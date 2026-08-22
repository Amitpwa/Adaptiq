/**
 * Personalised learning-path generation.
 *
 * A path is the goal's prerequisite closure, topologically ordered, with each
 * node classified against the learner's current knowledge. Mastered concepts
 * are pruned from what the learner is asked to *do* but retained in the graph
 * so the map still shows the foundation they already hold.
 */

import { PREREQUISITE_UNLOCK_THRESHOLD, REVIEW_TRIGGER_RETRIEVABILITY } from './constants';
import { closureFor, isReady, topologicalSort, unmetPrerequisites, buildGraph } from './graph';
import type { ConceptGraph } from './graph';
import type { DecayedKnowledge } from './types';

export type PathNodeStatus = 'LOCKED' | 'READY' | 'IN_PROGRESS' | 'MASTERED' | 'GAP';

export interface PathNode {
  conceptId: string;
  position: number;
  status: PathNodeStatus;
  /** Why this node has this status, shown verbatim to the learner. */
  rationale: string;
  unmetPrerequisiteIds: string[];
}

export interface PathInput {
  graph: ConceptGraph;
  /** Concepts the goal directly requires. */
  goalConceptIds: readonly string[];
  /** Decayed knowledge by concept id; absent means never attempted. */
  knowledge: ReadonlyMap<string, DecayedKnowledge>;
  /** Resolves a concept id to a human-readable title for rationales. */
  titleOf?: (conceptId: string) => string;
}

/** A prerequisite counts as satisfied at the unlock threshold, not full mastery. */
export function isPrerequisiteSatisfied(knowledge: DecayedKnowledge | undefined): boolean {
  if (!knowledge) return false;
  return knowledge.effectiveMastery >= PREREQUISITE_UNLOCK_THRESHOLD;
}

export function generatePath(input: PathInput): PathNode[] {
  const { graph, goalConceptIds, knowledge } = input;
  const titleOf = input.titleOf ?? ((id: string) => id);

  const closure = closureFor(graph, goalConceptIds);
  const subgraph = buildGraph(
    graph.nodeIds.filter((id) => closure.has(id)),
    graph.edges.filter((e) => closure.has(e.prerequisiteId) && closure.has(e.conceptId)),
  );

  const ordered = topologicalSort(subgraph);
  const satisfied = (id: string) => isPrerequisiteSatisfied(knowledge.get(id));

  return ordered.map((conceptId, index) => {
    const state = knowledge.get(conceptId);
    const unmet = unmetPrerequisites(subgraph, conceptId, satisfied);
    const ready = isReady(subgraph, conceptId, satisfied);

    const { status, rationale } = classify({
      state,
      ready,
      unmet,
      titleOf,
    });

    return {
      conceptId,
      position: index,
      status,
      rationale,
      unmetPrerequisiteIds: unmet,
    };
  });
}

function classify(args: {
  state: DecayedKnowledge | undefined;
  ready: boolean;
  unmet: readonly string[];
  titleOf: (id: string) => string;
}): { status: PathNodeStatus; rationale: string } {
  const { state, ready, unmet, titleOf } = args;

  if (state?.band === 'MASTERED') {
    return {
      status: 'MASTERED',
      rationale: `You have demonstrated mastery here (${formatPercent(state.effectiveMastery)}). Skipping ahead.`,
    };
  }

  if (!ready) {
    const names = unmet.map(titleOf);
    return {
      status: 'LOCKED',
      rationale:
        names.length === 1
          ? `Locked until you are comfortable with ${names[0]}.`
          : `Locked until you are comfortable with ${names.slice(0, -1).join(', ')} and ${names.at(-1)}.`,
    };
  }

  if (state?.band === 'FRAGILE') {
    // "Fading" must mean genuinely decayed, not merely "not exactly 1.0".
    // Retrievability is a continuous exponential, so it is below 1 microseconds
    // after an answer — comparing against 1 told a learner who had just
    // answered correctly that their knowledge was slipping away.
    const isFading = state.retrievability < REVIEW_TRIGGER_RETRIEVABILITY;
    return {
      status: 'IN_PROGRESS',
      rationale: isFading
        ? `You knew this at ${formatPercent(state.rawMastery)}, but recall has slipped to ${formatPercent(state.retrievability)}. A short review will restore it.`
        : `Nearly there at ${formatPercent(state.effectiveMastery)} — a little more practice will secure it.`,
    };
  }

  if (state?.band === 'IN_PROGRESS') {
    return {
      status: 'IN_PROGRESS',
      rationale: `In progress at ${formatPercent(state.effectiveMastery)}. Keep going — prerequisites are met.`,
    };
  }

  if (state?.band === 'GAP') {
    return {
      status: 'GAP',
      rationale: `A gap the diagnostic found (${formatPercent(state.effectiveMastery)}), and your prerequisites are ready. This is worth your time now.`,
    };
  }

  return {
    status: 'READY',
    rationale: 'Prerequisites met and not yet started — this is open to you now.',
  };
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/**
 * The next node a learner should act on: the earliest in topological order
 * that is actionable. Returns null when the goal is complete.
 */
export function nextActionableNode(nodes: readonly PathNode[]): PathNode | null {
  return (
    nodes.find((node) => node.status === 'GAP') ??
    nodes.find((node) => node.status === 'IN_PROGRESS') ??
    nodes.find((node) => node.status === 'READY') ??
    null
  );
}

/** Fraction of the path's concepts already mastered, for progress display. */
export function pathCompletion(nodes: readonly PathNode[]): number {
  if (nodes.length === 0) return 0;
  const mastered = nodes.filter((node) => node.status === 'MASTERED').length;
  return mastered / nodes.length;
}
