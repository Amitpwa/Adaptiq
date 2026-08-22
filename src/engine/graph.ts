/**
 * Concept-graph algorithms.
 *
 * The curriculum is a directed acyclic graph of concepts joined by
 * prerequisite edges. Everything here is a pure function over an adjacency
 * structure so it can be exercised without a database; the repository layer
 * supplies the same data via recursive CTEs.
 */

import type { GraphEdge } from './types';

export interface ConceptGraph {
  /** Every concept id present in the graph. */
  readonly nodeIds: readonly string[];
  /** conceptId -> ids that must be learned first. */
  readonly prerequisitesOf: ReadonlyMap<string, readonly string[]>;
  /** conceptId -> ids it unlocks. */
  readonly dependentsOf: ReadonlyMap<string, readonly string[]>;
  readonly edges: readonly GraphEdge[];
}

export class CyclicGraphError extends Error {
  constructor(public readonly cycle: readonly string[]) {
    super(`Concept graph contains a cycle: ${cycle.join(' -> ')}`);
    this.name = 'CyclicGraphError';
  }
}

/** Build an indexed graph from a node list and edge list. */
export function buildGraph(nodeIds: readonly string[], edges: readonly GraphEdge[]): ConceptGraph {
  const prerequisitesOf = new Map<string, string[]>();
  const dependentsOf = new Map<string, string[]>();
  const known = new Set(nodeIds);

  for (const id of nodeIds) {
    prerequisitesOf.set(id, []);
    dependentsOf.set(id, []);
  }

  for (const edge of edges) {
    // Edges referencing concepts outside the requested subgraph are ignored
    // rather than fatal: a goal's closure is a legitimate subset of the domain.
    if (!known.has(edge.prerequisiteId) || !known.has(edge.conceptId)) continue;
    prerequisitesOf.get(edge.conceptId)?.push(edge.prerequisiteId);
    dependentsOf.get(edge.prerequisiteId)?.push(edge.conceptId);
  }

  return { nodeIds: [...nodeIds], prerequisitesOf, dependentsOf, edges: [...edges] };
}

/**
 * Kahn topological sort. Ties are broken by the node's position in `nodeIds`,
 * which makes the ordering deterministic — required for stable layouts and
 * reproducible tests.
 */
export function topologicalSort(graph: ConceptGraph): string[] {
  const indegree = new Map<string, number>();
  for (const id of graph.nodeIds) {
    indegree.set(id, graph.prerequisitesOf.get(id)?.length ?? 0);
  }

  const ready = graph.nodeIds.filter((id) => (indegree.get(id) ?? 0) === 0);
  const ordered: string[] = [];

  while (ready.length > 0) {
    const current = ready.shift() as string;
    ordered.push(current);
    for (const dependent of graph.dependentsOf.get(current) ?? []) {
      const remaining = (indegree.get(dependent) ?? 0) - 1;
      indegree.set(dependent, remaining);
      if (remaining === 0) ready.push(dependent);
    }
  }

  if (ordered.length !== graph.nodeIds.length) {
    throw new CyclicGraphError(findCycle(graph) ?? []);
  }
  return ordered;
}

/** Locate one cycle, for error reporting when curriculum authoring goes wrong. */
export function findCycle(graph: ConceptGraph): string[] | null {
  const VISITING = 1;
  const DONE = 2;
  const state = new Map<string, number>();
  const stack: string[] = [];

  const visit = (id: string): string[] | null => {
    const current = state.get(id);
    if (current === DONE) return null;
    if (current === VISITING) {
      const start = stack.indexOf(id);
      return [...stack.slice(start), id];
    }

    state.set(id, VISITING);
    stack.push(id);
    for (const dependent of graph.dependentsOf.get(id) ?? []) {
      const cycle = visit(dependent);
      if (cycle) return cycle;
    }
    stack.pop();
    state.set(id, DONE);
    return null;
  };

  for (const id of graph.nodeIds) {
    const cycle = visit(id);
    if (cycle) return cycle;
  }
  return null;
}

export function isAcyclic(graph: ConceptGraph): boolean {
  return findCycle(graph) === null;
}

/** Whether adding this edge would introduce a cycle. Used as a write guard. */
export function wouldCreateCycle(
  graph: ConceptGraph,
  prerequisiteId: string,
  conceptId: string,
): boolean {
  if (prerequisiteId === conceptId) return true;
  // A cycle appears exactly when the proposed prerequisite is already
  // reachable downstream of the concept it would gate.
  return ancestors(graph, prerequisiteId).has(conceptId);
}

/** All concepts transitively required before `conceptId`. */
export function ancestors(graph: ConceptGraph, conceptId: string): Set<string> {
  const found = new Set<string>();
  const queue = [...(graph.prerequisitesOf.get(conceptId) ?? [])];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (found.has(current)) continue;
    found.add(current);
    queue.push(...(graph.prerequisitesOf.get(current) ?? []));
  }
  return found;
}

/** All concepts transitively unlocked by `conceptId`. */
export function descendants(graph: ConceptGraph, conceptId: string): Set<string> {
  const found = new Set<string>();
  const queue = [...(graph.dependentsOf.get(conceptId) ?? [])];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (found.has(current)) continue;
    found.add(current);
    queue.push(...(graph.dependentsOf.get(current) ?? []));
  }
  return found;
}

/**
 * The subgraph needed to reach `targetIds`: the targets plus everything they
 * transitively depend on. This is what prunes a 50-concept domain down to the
 * handful a specific goal actually requires.
 */
export function closureFor(graph: ConceptGraph, targetIds: readonly string[]): Set<string> {
  const closure = new Set<string>();
  for (const target of targetIds) {
    if (!graph.prerequisitesOf.has(target)) continue;
    closure.add(target);
    for (const ancestor of ancestors(graph, target)) closure.add(ancestor);
  }
  return closure;
}

/**
 * Direct prerequisites of `conceptId` that the learner has not yet satisfied.
 *
 * This is the query behind both the "why is this locked?" explanation and the
 * prerequisite route-back: when a learner fails, these are the concepts to
 * test next.
 */
export function unmetPrerequisites(
  graph: ConceptGraph,
  conceptId: string,
  isSatisfied: (id: string) => boolean,
): string[] {
  return (graph.prerequisitesOf.get(conceptId) ?? []).filter((id) => !isSatisfied(id));
}

/** A concept is ready when every direct prerequisite is satisfied. */
export function isReady(
  graph: ConceptGraph,
  conceptId: string,
  isSatisfied: (id: string) => boolean,
): boolean {
  return unmetPrerequisites(graph, conceptId, isSatisfied).length === 0;
}

/**
 * The deepest unmet prerequisite reachable from `conceptId` — the true root of
 * a learner's difficulty rather than the symptom they hit.
 *
 * Walks upward, always following unsatisfied edges, and returns the first
 * concept whose own prerequisites are all satisfied: the shallowest thing the
 * learner can actually start on.
 */
export function deepestUnmetPrerequisite(
  graph: ConceptGraph,
  conceptId: string,
  isSatisfied: (id: string) => boolean,
): string | null {
  const visited = new Set<string>();
  const queue = unmetPrerequisites(graph, conceptId, isSatisfied);
  let fallback: string | null = null;

  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (visited.has(current)) continue;
    visited.add(current);
    fallback ??= current;

    const unmet = unmetPrerequisites(graph, current, isSatisfied);
    if (unmet.length === 0) return current;
    queue.push(...unmet);
  }

  return fallback;
}
