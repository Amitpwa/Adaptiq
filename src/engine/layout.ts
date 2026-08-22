/**
 * Deterministic layered-DAG layout for the knowledge graph.
 *
 * Positions are a pure function of the curriculum, so every learner sees the
 * same map in the same place and it never shifts between visits. That
 * stability is a cognitive requirement, not an aesthetic one: learners build a
 * spatial memory of their own knowledge, and a force simulation that re-tumbles
 * on each mount would destroy it (see DAR D12). It also makes the graph
 * screenshot- and assertion-stable in tests.
 *
 * Algorithm: longest-path layering for ranks, then barycentre ordering sweeps
 * to reduce edge crossings — the classic Sugiyama pipeline minus the expensive
 * exact-crossing-minimisation step, which is unnecessary at curriculum scale.
 */

import { LAYOUT } from './constants';
import { topologicalSort } from './graph';
import type { ConceptGraph } from './graph';

export interface LayoutPosition {
  conceptId: string;
  /** Depth from the graph roots; the vertical layer. */
  rank: number;
  /** Position within the rank, left to right. */
  order: number;
  x: number;
  y: number;
}

/**
 * Assign each concept to a layer equal to its longest prerequisite chain.
 *
 * Longest-path (rather than shortest) layering guarantees every edge points
 * strictly downward, so a prerequisite is never drawn below the concept it
 * gates — the visual reading "higher means more foundational" always holds.
 */
export function assignRanks(graph: ConceptGraph): Map<string, number> {
  const ranks = new Map<string, number>();
  for (const id of topologicalSort(graph)) {
    const prerequisites = graph.prerequisitesOf.get(id) ?? [];
    const rank =
      prerequisites.length === 0
        ? 0
        : Math.max(...prerequisites.map((p) => (ranks.get(p) ?? 0) + 1));
    ranks.set(id, rank);
  }
  return ranks;
}

/** Group concept ids by rank, preserving deterministic within-rank order. */
function groupByRank(
  graph: ConceptGraph,
  ranks: ReadonlyMap<string, number>,
): Map<number, string[]> {
  const layers = new Map<number, string[]>();
  // Iterating nodeIds (not the map) keeps initial ordering stable and
  // independent of Map insertion order.
  for (const id of graph.nodeIds) {
    if (!ranks.has(id)) continue;
    const rank = ranks.get(id) as number;
    const layer = layers.get(rank);
    if (layer) layer.push(id);
    else layers.set(rank, [id]);
  }
  return layers;
}

/** Mean index of a node's neighbours in the adjacent layer. */
function barycentre(
  neighbours: readonly string[],
  positionIn: ReadonlyMap<string, number>,
): number | null {
  const known = neighbours.map((n) => positionIn.get(n)).filter((p): p is number => p !== undefined);
  if (known.length === 0) return null;
  return known.reduce((sum, p) => sum + p, 0) / known.length;
}

/**
 * Reduce edge crossings by repeatedly sorting each layer by the average
 * position of its neighbours in the layer above, then below.
 *
 * Nodes with no neighbours in the reference layer keep their current position,
 * so the sort stays total and deterministic.
 */
export function orderWithinRanks(
  graph: ConceptGraph,
  ranks: ReadonlyMap<string, number>,
): Map<number, string[]> {
  const layers = groupByRank(graph, ranks);
  const rankNumbers = [...layers.keys()].sort((a, b) => a - b);

  const positionsFor = (ids: readonly string[]): Map<string, number> =>
    new Map(ids.map((id, index) => [id, index]));

  for (let sweep = 0; sweep < LAYOUT.ORDERING_SWEEPS; sweep += 1) {
    const downward = sweep % 2 === 0;
    const sequence = downward ? rankNumbers : [...rankNumbers].reverse();

    for (const rank of sequence) {
      const referenceRank = downward ? rank - 1 : rank + 1;
      const reference = layers.get(referenceRank);
      const layer = layers.get(rank);
      if (!layer || !reference) continue;

      const referencePositions = positionsFor(reference);
      const currentPositions = positionsFor(layer);

      const sorted = [...layer].sort((a, b) => {
        const neighboursA = downward
          ? (graph.prerequisitesOf.get(a) ?? [])
          : (graph.dependentsOf.get(a) ?? []);
        const neighboursB = downward
          ? (graph.prerequisitesOf.get(b) ?? [])
          : (graph.dependentsOf.get(b) ?? []);

        const baryA = barycentre(neighboursA, referencePositions) ?? currentPositions.get(a) ?? 0;
        const baryB = barycentre(neighboursB, referencePositions) ?? currentPositions.get(b) ?? 0;

        if (baryA !== baryB) return baryA - baryB;
        // Deterministic tiebreak so repeated runs are identical.
        return a < b ? -1 : a > b ? 1 : 0;
      });

      layers.set(rank, sorted);
    }
  }

  return layers;
}

/**
 * Compute final coordinates. Each layer is centred horizontally so the graph
 * reads as a symmetric tree rather than drifting right as it widens.
 */
export function computeLayout(graph: ConceptGraph): LayoutPosition[] {
  const ranks = assignRanks(graph);
  const layers = orderWithinRanks(graph, ranks);

  const widest = Math.max(1, ...[...layers.values()].map((layer) => layer.length));
  const canvasWidth = (widest - 1) * LAYOUT.NODE_SPACING_X;

  const positions: LayoutPosition[] = [];
  for (const [rank, layer] of [...layers.entries()].sort((a, b) => a[0] - b[0])) {
    const layerWidth = (layer.length - 1) * LAYOUT.NODE_SPACING_X;
    const offset = (canvasWidth - layerWidth) / 2;

    layer.forEach((conceptId, order) => {
      positions.push({
        conceptId,
        rank,
        order,
        x: offset + order * LAYOUT.NODE_SPACING_X,
        y: rank * LAYOUT.RANK_SPACING_Y,
      });
    });
  }

  return positions;
}

/**
 * Count edge crossings — used by tests to assert that ordering actually helps,
 * rather than merely asserting that it runs.
 */
export function countCrossings(
  graph: ConceptGraph,
  layers: ReadonlyMap<number, readonly string[]>,
  ranks: ReadonlyMap<string, number>,
): number {
  const positionOf = new Map<string, number>();
  for (const layer of layers.values()) {
    layer.forEach((id, index) => positionOf.set(id, index));
  }

  let crossings = 0;
  const rankNumbers = [...layers.keys()].sort((a, b) => a - b);

  for (const rank of rankNumbers) {
    const edgesBetween: Array<{ from: number; to: number }> = [];
    for (const id of layers.get(rank) ?? []) {
      for (const dependent of graph.dependentsOf.get(id) ?? []) {
        if (ranks.get(dependent) !== rank + 1) continue;
        const from = positionOf.get(id);
        const to = positionOf.get(dependent);
        if (from === undefined || to === undefined) continue;
        edgesBetween.push({ from, to });
      }
    }

    for (let i = 0; i < edgesBetween.length; i += 1) {
      for (let j = i + 1; j < edgesBetween.length; j += 1) {
        const a = edgesBetween[i];
        const b = edgesBetween[j];
        if (!a || !b) continue;
        if ((a.from - b.from) * (a.to - b.to) < 0) crossings += 1;
      }
    }
  }

  return crossings;
}
