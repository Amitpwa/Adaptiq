import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { updateMastery } from '@/engine/bkt';
import { applyDecay, bandFor, nextReviewDate, updateStability } from '@/engine/decay';
import { abilityToMastery } from '@/engine/irt';
import type { ConceptKnowledge, DecayedKnowledge } from '@/engine/types';
import { REVIEW_TRIGGER_RETRIEVABILITY } from '@/engine/constants';

/**
 * The learner's knowledge state: reading it with decay applied, and moving it
 * when new evidence arrives.
 *
 * Two invariants hold throughout:
 *  - Updates are incremental. A learner's history is never replayed; the new
 *    posterior depends only on the stored one plus the single new observation.
 *  - Decay is applied at read time, never written back by a job. Nothing in
 *    this system sweeps every learner's rows on a timer.
 */

type Tx = Prisma.TransactionClient;

/** Load and decay a learner's states for a set of concepts. */
export async function loadDecayedStates(
  userId: string,
  conceptIds: string[],
  now: Date = new Date(),
): Promise<Map<string, DecayedKnowledge>> {
  if (conceptIds.length === 0) return new Map();

  const rows = await prisma.knowledgeState.findMany({
    // userId comes from the session and is always in the predicate — a learner
    // cannot read another learner's state even with a valid concept id.
    where: { userId, conceptId: { in: conceptIds } },
    select: {
      conceptId: true,
      pMastery: true,
      stabilityDays: true,
      lastInteractionAt: true,
      attempts: true,
      correct: true,
    },
  });

  const result = new Map<string, DecayedKnowledge>();
  for (const row of rows) {
    const state: ConceptKnowledge = {
      conceptId: row.conceptId,
      rawMastery: row.pMastery,
      stabilityDays: row.stabilityDays,
      lastInteractionAt: row.lastInteractionAt,
      attempts: row.attempts,
      correct: row.correct,
    };
    result.set(row.conceptId, applyDecay(state, now));
  }
  return result;
}

export interface EvidenceInput {
  userId: string;
  conceptId: string;
  correct: boolean;
  bkt: { pInit: number; pTransit: number; pSlip: number; pGuess: number };
  evidenceType: 'DIAGNOSTIC_ITEM' | 'PRACTICE_ITEM' | 'PROBE_ITEM';
  evidenceId?: string;
  now?: Date;
}

/**
 * Fold one graded response into the learner's state for a concept.
 *
 * Runs inside the caller's transaction so that the assessment item, the
 * mastery change, the audit event, and the review schedule either all land or
 * none do. A knowledge state that disagrees with its own audit trail would be
 * unexplainable to the learner and undebuggable for us.
 */
export async function recordEvidence(tx: Tx, input: EvidenceInput): Promise<{
  prior: number;
  posterior: number;
  band: string;
}> {
  const now = input.now ?? new Date();

  const existing = await tx.knowledgeState.findUnique({
    where: { userId_conceptId: { userId: input.userId, conceptId: input.conceptId } },
    select: {
      id: true,
      pMastery: true,
      stabilityDays: true,
      attempts: true,
      correct: true,
      lastInteractionAt: true,
    },
  });

  const prior = existing?.pMastery ?? input.bkt.pInit;
  const posterior = updateMastery(prior, input.correct, input.bkt);

  const attempts = (existing?.attempts ?? 0) + 1;
  const correct = (existing?.correct ?? 0) + (input.correct ? 1 : 0);

  // Streak drives how fast the review interval grows. Approximated from the
  // running correct count rather than stored separately: a learner who is
  // consistently right has a long streak by construction.
  const streak = input.correct ? correct : 0;
  const stabilityDays = updateStability(existing?.stabilityDays ?? 1, input.correct, streak);

  // The band is stored so dashboard queries can filter on an index instead of
  // decaying every row in application code. It is computed from the freshly
  // interacted state, where retrievability is 1.
  const band = bandFor(posterior, attempts);

  await tx.knowledgeState.upsert({
    where: { userId_conceptId: { userId: input.userId, conceptId: input.conceptId } },
    create: {
      userId: input.userId,
      conceptId: input.conceptId,
      pMastery: posterior,
      stabilityDays,
      attempts,
      correct,
      status: band,
      lastInteractionAt: now,
    },
    update: {
      pMastery: posterior,
      stabilityDays,
      attempts,
      correct,
      status: band,
      lastInteractionAt: now,
    },
  });

  await tx.knowledgeStateEvent.create({
    data: {
      userId: input.userId,
      conceptId: input.conceptId,
      prior,
      posterior,
      evidenceType: input.evidenceType,
      evidenceId: input.evidenceId ?? null,
    },
  });

  // Schedule the next retrieval probe in closed form, from the point where
  // retrievability will cross the trigger threshold.
  const dueAt = nextReviewDate(now, stabilityDays, REVIEW_TRIGGER_RETRIEVABILITY);
  await tx.reviewSchedule.upsert({
    where: { userId_conceptId: { userId: input.userId, conceptId: input.conceptId } },
    create: {
      userId: input.userId,
      conceptId: input.conceptId,
      dueAt,
      intervalDays: stabilityDays,
    },
    update: { dueAt, intervalDays: stabilityDays },
  });

  return { prior, posterior, band };
}

/**
 * Seed knowledge state across a goal from a completed diagnostic.
 *
 * Concepts the diagnostic actually tested already have state from their graded
 * responses. The rest are given a prior derived from the learner's estimated
 * ability against each concept's own difficulty — which is the whole point of
 * measuring ability rather than just scoring answers: it generalises to
 * concepts we never asked about.
 *
 * These inferred states are marked with `attempts: 0`, so they band as
 * NOT_STARTED and are never presented as demonstrated knowledge.
 */
export async function seedStatesFromAbility(
  tx: Tx,
  userId: string,
  theta: number,
  concepts: Array<{
    id: string;
    difficultyB: number;
    discriminationA: number;
    guessC: number;
  }>,
): Promise<number> {
  const alreadyMeasured = await tx.knowledgeState.findMany({
    where: { userId, conceptId: { in: concepts.map((c) => c.id) } },
    select: { conceptId: true },
  });
  const measured = new Set(alreadyMeasured.map((row) => row.conceptId));

  const pending = concepts
    .filter((concept) => !measured.has(concept.id))
    .map((concept) => ({
      concept,
      inferred: abilityToMastery(theta, {
        difficulty: concept.difficultyB,
        discrimination: concept.discriminationA,
        guessing: concept.guessC,
      }),
    }));

  if (pending.length === 0) return 0;

  // Two batched statements rather than two per concept. Written as a loop this
  // was ~34 sequential round trips for a 17-concept goal, which exceeded the
  // interactive transaction timeout against a remote database before it ever
  // saw production load.
  await tx.knowledgeState.createMany({
    data: pending.map(({ concept, inferred }) => ({
      userId,
      conceptId: concept.id,
      pMastery: inferred,
      stabilityDays: 1,
      attempts: 0,
      correct: 0,
      status: 'NOT_STARTED' as const,
      lastInteractionAt: null,
    })),
  });

  await tx.knowledgeStateEvent.createMany({
    data: pending.map(({ concept, inferred }) => ({
      userId,
      conceptId: concept.id,
      prior: 0,
      posterior: inferred,
      evidenceType: 'DIAGNOSTIC_ITEM' as const,
    })),
  });

  return pending.length;
}
