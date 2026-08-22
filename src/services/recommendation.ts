import 'server-only';

import { isPrerequisiteSatisfied } from '@/engine/path';
import { rankRecommendations, type RecommendationCandidate } from '@/engine/recommender';
import { unmetPrerequisites } from '@/engine/graph';
import { prisma } from '@/lib/db';
import { loadGoalCurriculum } from '@/repositories/curriculum';
import { loadDecayedStates } from './knowledge-state';

/**
 * Recommendation generation.
 *
 * Every recommendation is persisted with the rationale that produced it, and
 * that rationale is what the learner reads. An adaptive system that says "do
 * this next" without saying why is indistinguishable from a random one.
 */

const RECOMMENDATION_LIMIT = 5;

export interface RecommendationView {
  id: string;
  conceptSlug: string;
  conceptTitle: string;
  kind: string;
  score: number;
  rationale: string;
  estimatedMinutes: number;
}

export async function refreshRecommendations(
  userId: string,
  goalSlug: string,
): Promise<RecommendationView[]> {
  const curriculum = await loadGoalCurriculum(goalSlug);
  const conceptIds = curriculum.concepts.map((c) => c.id);
  const knowledge = await loadDecayedStates(userId, conceptIds);

  // One grouped query for misconception pressure rather than a count per
  // concept.
  const openMisconceptions = await prisma.learnerMisconception.findMany({
    where: { userId, resolvedAt: null },
    select: { misconception: { select: { conceptId: true } } },
  });
  const misconceptionsByConcept = new Map<string, number>();
  for (const row of openMisconceptions) {
    const conceptId = row.misconception.conceptId;
    misconceptionsByConcept.set(conceptId, (misconceptionsByConcept.get(conceptId) ?? 0) + 1);
  }

  const satisfied = (id: string) => isPrerequisiteSatisfied(knowledge.get(id));

  const candidates: RecommendationCandidate[] = curriculum.concepts.map((concept) => {
    const unmet = unmetPrerequisites(curriculum.graph, concept.id, satisfied);
    const dependents = curriculum.graph.dependentsOf.get(concept.id) ?? [];

    const candidate: RecommendationCandidate = {
      conceptId: concept.id,
      conceptTitle: concept.title,
      goalWeight: concept.goalWeight,
      unmetPrerequisiteIds: unmet,
      unmetPrerequisiteTitles: unmet.map(
        (id) => curriculum.conceptById.get(id)?.title ?? 'a prerequisite',
      ),
      openMisconceptions: misconceptionsByConcept.get(concept.id) ?? 0,
      // A concept blocks progress when something downstream needs it and the
      // learner has not yet cleared it.
      blocksGoalProgress: dependents.length > 0 && !satisfied(concept.id),
    };

    const state = knowledge.get(concept.id);
    if (state) candidate.knowledge = state;
    return candidate;
  });

  const ranked = rankRecommendations(candidates, RECOMMENDATION_LIMIT);

  await prisma.$transaction(async (tx) => {
    // Clear only unconsumed recommendations: a consumed one is a record of
    // what the learner actually acted on and is part of their history.
    await tx.recommendation.deleteMany({ where: { userId, consumedAt: null } });
    if (ranked.length > 0) {
      await tx.recommendation.createMany({
        data: ranked.map((recommendation) => ({
          userId,
          conceptId: recommendation.conceptId,
          kind: recommendation.kind,
          score: recommendation.score,
          rationale: recommendation.rationale,
        })),
      });
    }
  });

  return listRecommendations(userId);
}

export async function listRecommendations(userId: string): Promise<RecommendationView[]> {
  const rows = await prisma.recommendation.findMany({
    where: { userId, consumedAt: null },
    orderBy: { score: 'desc' },
    take: RECOMMENDATION_LIMIT,
    select: {
      id: true,
      kind: true,
      score: true,
      rationale: true,
      concept: { select: { slug: true, title: true, estimatedMinutes: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    conceptSlug: row.concept.slug,
    conceptTitle: row.concept.title,
    kind: row.kind,
    score: row.score,
    rationale: row.rationale,
    estimatedMinutes: row.concept.estimatedMinutes,
  }));
}
