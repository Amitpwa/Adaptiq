import 'server-only';

import { prisma } from '@/lib/db';
import { loadGoalCurriculum } from '@/repositories/curriculum';
import { loadDecayedStates } from './knowledge-state';

/**
 * Dashboard metrics.
 *
 * Every number here is derived from stored learner evidence with decay applied
 * at read time — none of it is cached, precomputed, or approximated. The
 * counts and the knowledge graph therefore always agree, which matters because
 * a learner will see both on the same screen.
 */

export interface DashboardSummary {
  goalSlug: string;
  goalTitle: string;
  totalConcepts: number;
  masteredCount: number;
  fragileCount: number;
  inProgressCount: number;
  gapCount: number;
  notStartedCount: number;
  /**
   * Mean effective mastery across the goal, 0-1. Includes concepts inferred
   * from the diagnostic rather than directly tested, because the learner's
   * position on the whole goal is what this is meant to convey.
   */
  averageMastery: number;
  /** Concepts whose retrievability has fallen below the review threshold. */
  dueForReview: number;
  /** Distinct unresolved misconceptions across the learner's history. */
  openMisconceptions: number;
}

export async function getDashboardSummary(userId: string): Promise<DashboardSummary | null> {
  const profile = await prisma.learnerProfile.findUnique({
    where: { userId },
    select: { activeGoal: { select: { slug: true } } },
  });

  const goalSlug = profile?.activeGoal?.slug;

  // If new user has not completed onboarding/diagnostic yet, return null
  if (!goalSlug) {
    return null;
  }

  const curriculum = await loadGoalCurriculum(goalSlug);
  const conceptIds = curriculum.concepts.map((concept) => concept.id);
  const knowledge = await loadDecayedStates(userId, conceptIds);

  const counts = {
    MASTERED: 0,
    FRAGILE: 0,
    IN_PROGRESS: 0,
    GAP: 0,
    NOT_STARTED: 0,
  };
  let masterySum = 0;

  for (const conceptId of conceptIds) {
    const state = knowledge.get(conceptId);
    counts[state?.band ?? 'NOT_STARTED'] += 1;
    masterySum += state?.effectiveMastery ?? 0;
  }

  // Counted in SQL rather than pulled into memory: these are aggregate
  // questions and the database answers them without shipping rows.
  const [dueForReview, openMisconceptions] = await Promise.all([
    prisma.reviewSchedule.count({
      where: {
        userId,
        dueAt: { lte: new Date() },
        conceptId: { in: conceptIds },
      },
    }),
    prisma.learnerMisconception.count({
      where: {
        userId,
        resolvedAt: null,
      },
    }),
  ]);

  return {
    goalSlug: curriculum.goalSlug,
    goalTitle: curriculum.goalTitle,
    totalConcepts: conceptIds.length,
    masteredCount: counts.MASTERED,
    fragileCount: counts.FRAGILE,
    inProgressCount: counts.IN_PROGRESS,
    gapCount: counts.GAP,
    notStartedCount: counts.NOT_STARTED,
    averageMastery: conceptIds.length > 0 ? masterySum / conceptIds.length : 0,
    dueForReview,
    openMisconceptions,
  };
}
