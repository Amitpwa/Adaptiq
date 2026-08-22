import 'server-only';

import { LAYOUT } from '@/engine/constants';
import { unmetPrerequisites } from '@/engine/graph';
import { isPrerequisiteSatisfied } from '@/engine/path';
import type { MasteryBand } from '@/engine/types';
import { prisma } from '@/lib/db';
import { loadGoalCurriculum } from '@/repositories/curriculum';
import { loadDecayedStates } from './knowledge-state';

/**
 * The learner's knowledge graph.
 *
 * Node positions come from `ConceptLayout`, computed once at seed time by the
 * layout engine. Nothing is laid out in the browser: the map is identical for
 * every learner and stable across sessions, so the spatial memory a learner
 * builds of their own knowledge stays valid. Only node *state* is personal.
 */

export interface GraphNodeView {
  id: string;
  slug: string;
  title: string;
  summary: string;
  band: MasteryBand;
  /** Raw BKT posterior before forgetting is applied. */
  rawMastery: number;
  /** Ebbinghaus R(t) — how much is still retrievable right now. */
  retrievability: number;
  /** rawMastery x retrievability. This is what the halftone density renders. */
  effectiveMastery: number;
  attempts: number;
  /** Layer in the prerequisite DAG; also the keyboard traversal order. */
  rank: number;
  order: number;
  x: number;
  y: number;
  estimatedMinutes: number;
  /** Titles of prerequisites not yet satisfied — the "why is this locked" answer. */
  unmetPrerequisites: string[];
}

export interface GraphEdgeView {
  id: string;
  /** Prerequisite concept id — the edge points from here... */
  from: string;
  /** ...to the concept it unlocks. */
  to: string;
  /** True when the prerequisite is cleared, so the edge renders as unlocked. */
  satisfied: boolean;
}

export interface KnowledgeGraphData {
  goalSlug: string;
  goalTitle: string;
  nodes: GraphNodeView[];
  edges: GraphEdgeView[];
}

export async function getKnowledgeGraph(
  userId: string,
  goalSlug: string,
): Promise<KnowledgeGraphData> {
  const curriculum = await loadGoalCurriculum(goalSlug);
  const conceptIds = curriculum.concepts.map((concept) => concept.id);

  // Two queries for the whole graph — layout and learner state — rather than
  // one per node.
  const [layouts, knowledge] = await Promise.all([
    prisma.conceptLayout.findMany({
      where: { goalId: curriculum.goalId },
      select: { conceptId: true, rank: true, order: true, x: true, y: true },
    }),
    loadDecayedStates(userId, conceptIds),
  ]);

  const layoutByConcept = new Map(layouts.map((layout) => [layout.conceptId, layout]));
  const satisfied = (id: string) => isPrerequisiteSatisfied(knowledge.get(id));

  const nodes: GraphNodeView[] = curriculum.concepts.map((concept) => {
    const state = knowledge.get(concept.id);
    const layout = layoutByConcept.get(concept.id);
    const unmet = unmetPrerequisites(curriculum.graph, concept.id, satisfied);

    return {
      id: concept.id,
      slug: concept.slug,
      title: concept.title,
      summary: concept.summary,
      band: state?.band ?? 'NOT_STARTED',
      rawMastery: state?.rawMastery ?? 0,
      retrievability: state?.retrievability ?? 1,
      effectiveMastery: state?.effectiveMastery ?? 0,
      attempts: state?.attempts ?? 0,
      rank: layout?.rank ?? 0,
      order: layout?.order ?? 0,
      // Falling back to a computed position rather than stacking every node at
      // the origin if a layout row is ever missing.
      x: layout?.x ?? (layout?.order ?? 0) * LAYOUT.NODE_SPACING_X,
      y: layout?.y ?? (layout?.rank ?? 0) * LAYOUT.RANK_SPACING_Y,
      estimatedMinutes: concept.estimatedMinutes,
      unmetPrerequisites: unmet.map(
        (id) => curriculum.conceptById.get(id)?.title ?? 'a prerequisite',
      ),
    };
  });

  const edges: GraphEdgeView[] = curriculum.graph.edges.map((edge) => ({
    id: `${edge.prerequisiteId}->${edge.conceptId}`,
    from: edge.prerequisiteId,
    to: edge.conceptId,
    satisfied: satisfied(edge.prerequisiteId),
  }));

  return {
    goalSlug: curriculum.goalSlug,
    goalTitle: curriculum.goalTitle,
    nodes: nodes.sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.order - b.order)),
    edges,
  };
}
