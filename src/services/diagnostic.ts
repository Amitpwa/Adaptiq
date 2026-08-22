import 'server-only';

import { CAT } from '@/engine/constants';
import { selectNextItem, shouldStop } from '@/engine/cat';
import { estimateAbility } from '@/engine/irt';
import type { CandidateItem, ScoredResponse } from '@/engine/types';
import { prisma } from '@/lib/db';
import { ConflictError, NotFoundError, RuleViolationError } from '@/lib/errors';
import {
  loadGoalCurriculum,
  loadQuestionWithAnswers,
  loadQuestionsForConcepts,
  type GoalCurriculum,
} from '@/repositories/curriculum';
import { recordEvidence, seedStatesFromAbility } from './knowledge-state';
import { regeneratePath } from './path';
import { refreshRecommendations } from './recommendation';

/**
 * Adaptive diagnostic (PRD FR-1.1).
 *
 * The session is stateless between requests: ability is re-estimated from the
 * stored responses each time rather than kept in memory, because on a
 * serverless runtime there is no memory to keep it in. Grid EAP makes that
 * cheap and exactly reproducible.
 */

export interface ServedQuestion {
  itemId: string;
  questionId: string;
  position: number;
  conceptTitle: string;
  type: string;
  stem: string;
  options: Array<{ id: string; label: string }>;
}

export interface DiagnosticProgress {
  sessionId: string;
  itemsServed: number;
  maxItems: number;
  /** Standard error of the ability estimate — narrows as evidence accrues. */
  standardError: number;
  theta: number;
  complete: boolean;
}

/** Start a diagnostic for a goal, or resume one already in progress. */
export async function startDiagnostic(userId: string, goalSlug: string) {
  const curriculum = await loadGoalCurriculum(goalSlug);

  const existing = await prisma.assessmentSession.findFirst({
    where: { userId, goalId: curriculum.goalId, type: 'DIAGNOSTIC', status: 'IN_PROGRESS' },
    select: { id: true },
  });
  if (existing) {
    // Resuming rather than starting fresh: a learner who reloads mid-diagnostic
    // should not lose their answers or be re-measured from scratch.
    return { sessionId: existing.id, resumed: true, goal: curriculum };
  }

  const session = await prisma.$transaction(async (tx) => {
    const created = await tx.assessmentSession.create({
      data: {
        userId,
        type: 'DIAGNOSTIC',
        goalId: curriculum.goalId,
        status: 'IN_PROGRESS',
        theta: 0,
        standardError: 1,
      },
      select: { id: true },
    });

    await tx.learnerProfile.update({
      where: { userId },
      data: { activeGoalId: curriculum.goalId, onboardingStage: 'DIAGNOSTIC_IN_PROGRESS' },
    });

    await tx.activityEvent.create({
      data: { userId, type: 'DIAGNOSTIC_STARTED', payload: { goalSlug } },
    });

    return created;
  });

  return { sessionId: session.id, resumed: false, goal: curriculum };
}

/** Load a session, enforcing ownership in the query itself. */
async function loadOwnedSession(userId: string, sessionId: string) {
  const session = await prisma.assessmentSession.findFirst({
    // Both ids in the predicate: guessing a session id gets a learner nothing.
    where: { id: sessionId, userId },
    select: {
      id: true,
      goalId: true,
      status: true,
      theta: true,
      standardError: true,
      items: {
        select: {
          id: true,
          questionId: true,
          position: true,
          isCorrect: true,
          answeredAt: true,
          question: {
            select: {
              conceptId: true,
              difficultyB: true,
              discriminationA: true,
              guessC: true,
            },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  });
  if (!session) throw NotFoundError('That diagnostic session does not exist.');
  return session;
}

/**
 * Serve the next question, or report that the diagnostic is finished.
 *
 * Selection maximises Fisher information at the current ability estimate. When
 * the previous answer was wrong, candidates are restricted to that concept's
 * prerequisites — this is what turns a score into a *boundary*: instead of
 * simply recording the failure, the next question probes whether the
 * foundation beneath it is intact.
 */
export async function nextDiagnosticItem(
  userId: string,
  sessionId: string,
): Promise<{ question: ServedQuestion | null; progress: DiagnosticProgress }> {
  const session = await loadOwnedSession(userId, sessionId);
  if (session.status !== 'IN_PROGRESS') {
    throw ConflictError('This diagnostic has already been completed.');
  }
  if (!session.goalId) throw RuleViolationError('This diagnostic is not attached to a goal.');

  const curriculum = await loadGoalCurriculum(await goalSlugFor(session.goalId));

  const answered = session.items.filter((item) => item.answeredAt !== null);
  const responses: ScoredResponse[] = answered.map((item) => ({
    item: {
      difficulty: item.question.difficultyB,
      discrimination: item.question.discriminationA,
      guessing: item.question.guessC,
    },
    correct: item.isCorrect === true,
  }));

  const ability = estimateAbility(responses);

  // An unanswered item already served is re-served rather than replaced, so a
  // refresh does not silently skip a question.
  const pending = session.items.find((item) => item.answeredAt === null);
  if (pending) {
    return {
      question: await presentQuestion(pending.id, pending.questionId, pending.position, curriculum),
      progress: progressOf(session.id, answered.length, ability, false),
    };
  }

  const servedQuestionIds = new Set(session.items.map((item) => item.questionId));
  const candidates = await buildCandidates(curriculum, servedQuestionIds);

  const decision = shouldStop(answered.length, ability.standardError, candidates.length);
  if (decision.shouldStop) {
    return { question: null, progress: progressOf(session.id, answered.length, ability, true) };
  }

  // Drill down into prerequisites after a wrong answer.
  const lastAnswered = answered.at(-1);
  const preferredConceptIds =
    lastAnswered && lastAnswered.isCorrect === false
      ? (curriculum.graph.prerequisitesOf.get(lastAnswered.question.conceptId) ?? [])
      : undefined;

  const chosen = selectNextItem({
    candidates,
    theta: ability.theta,
    ...(preferredConceptIds && preferredConceptIds.length > 0 ? { preferredConceptIds } : {}),
  });

  if (!chosen) {
    return { question: null, progress: progressOf(session.id, answered.length, ability, true) };
  }

  const position = session.items.length;
  const item = await prisma.assessmentItem.create({
    data: {
      sessionId: session.id,
      questionId: chosen.id,
      position,
      thetaAtServe: ability.theta,
    },
    select: { id: true },
  });

  await prisma.assessmentSession.update({
    where: { id: session.id },
    data: { theta: ability.theta, standardError: ability.standardError },
  });

  return {
    question: await presentQuestion(item.id, chosen.id, position, curriculum),
    progress: progressOf(session.id, answered.length, ability, false),
  };
}

export interface AnswerResult {
  correct: boolean;
  explanation: string;
  /** Named misconception, when a tagged distractor was chosen. */
  misconception: { label: string; remediationHint: string } | null;
  masteryBefore: number;
  masteryAfter: number;
  conceptTitle: string;
  progress: DiagnosticProgress;
}

/**
 * Grade an answer and fold it into the learner's knowledge state.
 *
 * Grading is deterministic and server-side. The client sends only which option
 * it selected; correctness is decided here against the stored key, so a
 * modified client cannot mark its own work.
 */
export async function submitDiagnosticAnswer(
  userId: string,
  sessionId: string,
  itemId: string,
  response: { optionId?: string; text?: string },
): Promise<AnswerResult> {
  const session = await loadOwnedSession(userId, sessionId);
  if (session.status !== 'IN_PROGRESS') {
    throw ConflictError('This diagnostic has already been completed.');
  }

  const item = session.items.find((candidate) => candidate.id === itemId);
  if (!item) throw NotFoundError('That question is not part of this diagnostic.');
  if (item.answeredAt !== null) throw ConflictError('You have already answered that question.');

  const question = await loadQuestionWithAnswers(item.questionId);
  const { correct, chosenOption } = grade(question, response);

  const now = new Date();
  const latencyMs = 0;

  const outcome = await prisma.$transaction(async (tx) => {
    await tx.assessmentItem.update({
      where: { id: item.id },
      data: {
        answeredAt: now,
        isCorrect: correct,
        response: response as object,
        latencyMs,
      },
    });

    const evidence = await recordEvidence(tx, {
      userId,
      conceptId: question.conceptId,
      correct,
      bkt: {
        pInit: question.concept.pInit,
        pTransit: question.concept.pTransit,
        pSlip: question.concept.pSlip,
        pGuess: question.concept.pGuess,
      },
      evidenceType: 'DIAGNOSTIC_ITEM',
      evidenceId: item.id,
      now,
    });

    // A wrong answer on a tagged distractor is the difference between "got it
    // wrong" and "holds this specific false belief" — record it so later
    // remediation can target the belief rather than the topic.
    if (!correct && chosenOption?.misconceptionId) {
      await tx.learnerMisconception.upsert({
        where: {
          userId_misconceptionId: { userId, misconceptionId: chosenOption.misconceptionId },
        },
        create: { userId, misconceptionId: chosenOption.misconceptionId, occurrences: 1 },
        update: { occurrences: { increment: 1 }, lastSeenAt: now, resolvedAt: null },
      });
    }

    return evidence;
  });

  const misconception = chosenOption?.misconceptionId
    ? await prisma.misconception.findUnique({
        where: { id: chosenOption.misconceptionId },
        select: { label: true, remediationHint: true },
      })
    : null;

  const answered = session.items.filter((i) => i.answeredAt !== null).length + 1;
  const responses: ScoredResponse[] = [
    ...session.items
      .filter((i) => i.answeredAt !== null)
      .map((i) => ({
        item: {
          difficulty: i.question.difficultyB,
          discrimination: i.question.discriminationA,
          guessing: i.question.guessC,
        },
        correct: i.isCorrect === true,
      })),
    {
      item: {
        difficulty: question.difficultyB,
        discrimination: question.discriminationA,
        guessing: question.guessC,
      },
      correct,
    },
  ];
  const ability = estimateAbility(responses);

  await prisma.assessmentSession.update({
    where: { id: session.id },
    data: { theta: ability.theta, standardError: ability.standardError },
  });

  return {
    correct,
    explanation: question.explanation,
    misconception: misconception ? { ...misconception } : null,
    masteryBefore: outcome.prior,
    masteryAfter: outcome.posterior,
    conceptTitle: question.concept.title,
    progress: progressOf(session.id, answered, ability, false),
  };
}

/**
 * Finish the diagnostic: extend the measured ability across the goal, build the
 * learning path, and produce the first recommendations.
 *
 * All in one transaction — a learner left with a completed diagnostic but no
 * path would land on an empty dashboard with no way forward.
 */
export async function completeDiagnostic(userId: string, sessionId: string) {
  const session = await loadOwnedSession(userId, sessionId);
  if (session.status === 'COMPLETED') {
    throw ConflictError('This diagnostic has already been completed.');
  }
  if (!session.goalId) throw RuleViolationError('This diagnostic is not attached to a goal.');

  const answered = session.items.filter((item) => item.answeredAt !== null);
  if (answered.length === 0) {
    throw RuleViolationError('Answer at least one question before finishing the diagnostic.');
  }

  const goalSlug = await goalSlugFor(session.goalId);
  const curriculum = await loadGoalCurriculum(goalSlug);

  const ability = estimateAbility(
    answered.map((item) => ({
      item: {
        difficulty: item.question.difficultyB,
        discrimination: item.question.discriminationA,
        guessing: item.question.guessC,
      },
      correct: item.isCorrect === true,
    })),
  );

  await prisma.$transaction(async (tx) => {
    await tx.assessmentSession.update({
      where: { id: session.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        theta: ability.theta,
        standardError: ability.standardError,
      },
    });

    await seedStatesFromAbility(tx, userId, ability.theta, curriculum.concepts);

    await tx.learnerProfile.update({
      where: { userId },
      data: { onboardingStage: 'COMPLETE', activeGoalId: curriculum.goalId },
    });

    await tx.activityEvent.create({
      data: {
        userId,
        type: 'DIAGNOSTIC_COMPLETED',
        payload: { goalSlug, theta: ability.theta, items: answered.length },
      },
    });
  });

  // Path and recommendations read the state the transaction just wrote, so
  // they run after it commits rather than inside it.
  await regeneratePath(userId, goalSlug);
  const recommendations = await refreshRecommendations(userId, goalSlug);

  return {
    theta: ability.theta,
    standardError: ability.standardError,
    itemsAnswered: answered.length,
    correctCount: answered.filter((item) => item.isCorrect).length,
    goalSlug,
    recommendations,
  };
}

// --- internals -------------------------------------------------------------

async function goalSlugFor(goalId: string): Promise<string> {
  const goal = await prisma.goal.findUnique({ where: { id: goalId }, select: { slug: true } });
  if (!goal) throw NotFoundError('That learning goal no longer exists.');
  return goal.slug;
}

async function buildCandidates(
  curriculum: GoalCurriculum,
  excludeQuestionIds: Set<string>,
): Promise<CandidateItem[]> {
  const questions = await loadQuestionsForConcepts(curriculum.concepts.map((c) => c.id));
  return questions
    .filter((question) => !excludeQuestionIds.has(question.id))
    .map((question) => ({
      id: question.id,
      conceptId: question.conceptId,
      difficulty: question.difficultyB,
      discrimination: question.discriminationA,
      guessing: question.guessC,
    }));
}

async function presentQuestion(
  itemId: string,
  questionId: string,
  position: number,
  curriculum: GoalCurriculum,
): Promise<ServedQuestion> {
  const questions = await loadQuestionsForConcepts([]);
  void questions;

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      conceptId: true,
      type: true,
      stem: true,
      // No isCorrect, no canonicalAnswer, no explanation: this object is
      // serialised to the browser.
      options: { select: { id: true, label: true }, orderBy: { position: 'asc' } },
    },
  });
  if (!question) throw NotFoundError('That question no longer exists.');

  return {
    itemId,
    questionId: question.id,
    position,
    conceptTitle: curriculum.conceptById.get(question.conceptId)?.title ?? 'Unknown concept',
    type: question.type,
    stem: question.stem,
    options: question.options,
  };
}

function progressOf(
  sessionId: string,
  itemsServed: number,
  ability: { theta: number; standardError: number },
  complete: boolean,
): DiagnosticProgress {
  return {
    sessionId,
    itemsServed,
    maxItems: CAT.MAX_ITEMS,
    standardError: ability.standardError,
    theta: ability.theta,
    complete,
  };
}

/**
 * Deterministic grading against the stored answer key.
 *
 * Short-answer comparison is normalised (case, surrounding whitespace, and
 * stray punctuation) so that "5" and " 5. " both count — a learner should not
 * lose a point to formatting.
 */
function grade(
  question: Awaited<ReturnType<typeof loadQuestionWithAnswers>>,
  response: { optionId?: string; text?: string },
): {
  correct: boolean;
  chosenOption: { id: string; isCorrect: boolean; misconceptionId: string | null } | null;
} {
  if (question.options.length > 0) {
    const chosen = question.options.find((option) => option.id === response.optionId);
    if (!chosen) return { correct: false, chosenOption: null };
    return {
      correct: chosen.isCorrect,
      chosenOption: {
        id: chosen.id,
        isCorrect: chosen.isCorrect,
        misconceptionId: chosen.misconceptionId,
      },
    };
  }

  const expected = normalise(question.canonicalAnswer ?? '');
  const actual = normalise(response.text ?? '');
  return { correct: expected.length > 0 && expected === actual, chosenOption: null };
}

function normalise(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?]+$/g, '')
    .replace(/\s+/g, ' ');
}
