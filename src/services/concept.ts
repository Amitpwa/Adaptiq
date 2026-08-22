import 'server-only';

import { prisma } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';
import { loadDecayedStates, recordEvidence } from './knowledge-state';
import { resolveLlmForUser } from '@/ai/resolve';
import type { Lens } from '@/generated/prisma/client';

export interface ConceptExplanationView {
  conceptId: string;
  conceptSlug: string;
  conceptTitle: string;
  summary: string;
  lens: Lens;
  body: string;
  attribution: string;
  effectiveMastery: number;
  retrievability: number;
  band: 'NOT_STARTED' | 'GAP' | 'IN_PROGRESS' | 'FRAGILE' | 'MASTERED';
  questions: Array<{
    id: string;
    stem: string;
    type: string;
    options: Array<{ id: string; label: string }>;
  }>;
}

export async function getConceptStudioData(
  userId: string,
  conceptSlug: string,
  requestedLens?: Lens,
): Promise<ConceptExplanationView> {
  const concept = await prisma.concept.findFirst({
    where: { slug: conceptSlug },
    include: {
      contentLenses: true,
      questions: {
        select: {
          id: true,
          stem: true,
          type: true,
          options: {
            select: { id: true, label: true, position: true },
            orderBy: { position: 'asc' },
          },
        },
      },
    },
  });

  if (!concept) throw NotFoundError('That concept does not exist.');

  const profile = await prisma.learnerProfile.findUnique({
    where: { userId },
    select: { cognitivePreference: true },
  });

  const targetLens: Lens = requestedLens ?? profile?.cognitivePreference ?? 'ANALOGY';

  const explanation = concept.contentLenses.find((e) => e.lens === targetLens) ?? concept.contentLenses[0];
  const knowledge = await loadDecayedStates(userId, [concept.id]);
  const state = knowledge.get(concept.id);
  const resolvedLlm = await resolveLlmForUser(userId);

  return {
    conceptId: concept.id,
    conceptSlug: concept.slug,
    conceptTitle: concept.title,
    summary: concept.summary,
    lens: targetLens,
    body: explanation?.body ?? concept.summary,
    attribution: resolvedLlm.attribution,
    effectiveMastery: state?.effectiveMastery ?? 0,
    retrievability: state?.retrievability ?? 1,
    band: state?.band ?? 'NOT_STARTED',
    questions: concept.questions.map((q) => ({
      id: q.id,
      stem: q.stem,
      type: q.type,
      options: q.options,
    })),
  };
}

export async function submitConceptMicroProbe(
  userId: string,
  conceptId: string,
  questionId: string,
  input: { optionId?: string; text?: string },
) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      options: true,
      concept: true,
    },
  });

  if (!question || question.conceptId !== conceptId) {
    throw NotFoundError('Question not found for this concept.');
  }

  let correct = false;
  let misconceptionId: string | null = null;

  if (input.optionId) {
    const selectedOption = question.options.find((o) => o.id === input.optionId);
    correct = Boolean(selectedOption?.isCorrect);
    misconceptionId = selectedOption?.misconceptionId ?? null;
  } else if (input.text && question.canonicalAnswer) {
    correct = input.text.trim().toLowerCase() === question.canonicalAnswer.trim().toLowerCase();
  }

  // Update BKT Bayesian knowledge state inside a transaction
  const updatedState = await prisma.$transaction(async (tx) => {
    return recordEvidence(tx, {
      userId,
      conceptId,
      correct,
      bkt: {
        pInit: question.concept.pInit,
        pTransit: question.concept.pTransit,
        pSlip: question.concept.pSlip,
        pGuess: question.concept.pGuess,
      },
      evidenceType: 'PRACTICE_ITEM',
      evidenceId: questionId,
    });
  });

  if (!correct && misconceptionId) {
    await prisma.learnerMisconception.upsert({
      where: {
        userId_misconceptionId: {
          userId,
          misconceptionId,
        },
      },
      create: {
        userId,
        misconceptionId,
        occurrences: 1,
      },
      update: {
        occurrences: { increment: 1 },
      },
    });
  }

  return {
    correct,
    explanation: question.explanation,
    updatedMastery: updatedState.posterior,
    band: updatedState.band,
  };
}
