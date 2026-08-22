import 'server-only';

import { generatePath, nextActionableNode, pathCompletion } from '@/engine/path';
import { prisma } from '@/lib/db';
import { loadGoalCurriculum } from '@/repositories/curriculum';
import { loadDecayedStates } from './knowledge-state';

/**
 * Learning-path generation and persistence.
 *
 * The path is derived, not authored: it is the goal's prerequisite closure in
 * topological order, classified against current knowledge. Regenerating is
 * therefore always safe, and the stored copy exists so the dashboard can render
 * without recomputing the graph on every request.
 */

export async function regeneratePath(userId: string, goalSlug: string) {
  const curriculum = await loadGoalCurriculum(goalSlug);
  const knowledge = await loadDecayedStates(
    userId,
    curriculum.concepts.map((c) => c.id),
  );

  const nodes = generatePath({
    graph: curriculum.graph,
    goalConceptIds: curriculum.concepts.map((c) => c.id),
    knowledge,
    titleOf: (id) => curriculum.conceptById.get(id)?.title ?? 'a prerequisite',
  });

  await prisma.$transaction(async (tx) => {
    const path = await tx.learningPath.upsert({
      where: { userId_goalId: { userId, goalId: curriculum.goalId } },
      create: { userId, goalId: curriculum.goalId, version: 1 },
      update: { version: { increment: 1 }, generatedAt: new Date() },
      select: { id: true },
    });

    // Replace nodes wholesale. Node status is fully derived from current
    // knowledge, so a stale row left behind would be a lie about where the
    // learner stands.
    await tx.learningPathNode.deleteMany({ where: { pathId: path.id } });
    await tx.learningPathNode.createMany({
      data: nodes.map((node) => ({
        pathId: path.id,
        conceptId: node.conceptId,
        position: node.position,
        status: node.status,
        rationale: node.rationale,
      })),
    });
  });

  return nodes;
}

export interface PathView {
  goalSlug: string;
  goalTitle: string;
  completion: number;
  nodes: Array<{
    conceptId: string;
    conceptSlug: string;
    title: string;
    summary: string;
    position: number;
    status: string;
    rationale: string;
    estimatedMinutes: number;
    effectiveMastery: number;
    retrievability: number;
  }>;
  next: { conceptSlug: string; title: string; rationale: string } | null;
}

/** Read the learner's path with live decay applied. */
export async function getPath(userId: string, goalSlug: string): Promise<PathView> {
  const curriculum = await loadGoalCurriculum(goalSlug);
  const knowledge = await loadDecayedStates(
    userId,
    curriculum.concepts.map((c) => c.id),
  );

  // Recomputed rather than read back: decay moves continuously, so a node
  // stored as READY yesterday may be a review candidate today.
  const nodes = generatePath({
    graph: curriculum.graph,
    goalConceptIds: curriculum.concepts.map((c) => c.id),
    knowledge,
    titleOf: (id) => curriculum.conceptById.get(id)?.title ?? 'a prerequisite',
  });

  const next = nextActionableNode(nodes);

  return {
    goalSlug: curriculum.goalSlug,
    goalTitle: curriculum.goalTitle,
    completion: pathCompletion(nodes),
    nodes: nodes.map((node) => {
      const concept = curriculum.conceptById.get(node.conceptId);
      const state = knowledge.get(node.conceptId);
      return {
        conceptId: node.conceptId,
        conceptSlug: concept?.slug ?? '',
        title: concept?.title ?? '',
        summary: concept?.summary ?? '',
        position: node.position,
        status: node.status,
        rationale: node.rationale,
        estimatedMinutes: concept?.estimatedMinutes ?? 0,
        effectiveMastery: state?.effectiveMastery ?? 0,
        retrievability: state?.retrievability ?? 1,
      };
    }),
    next: next
      ? {
          conceptSlug: curriculum.conceptById.get(next.conceptId)?.slug ?? '',
          title: curriculum.conceptById.get(next.conceptId)?.title ?? '',
          rationale: next.rationale,
        }
      : null,
  };
}
