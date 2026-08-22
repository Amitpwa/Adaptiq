import { describe, expect, it } from 'vitest';

import {
  CyclicGraphError,
  ancestors,
  buildGraph,
  closureFor,
  deepestUnmetPrerequisite,
  descendants,
  findCycle,
  isAcyclic,
  isReady,
  topologicalSort,
  unmetPrerequisites,
  wouldCreateCycle,
} from '@/engine/graph';
import type { GraphEdge } from '@/engine/types';

const edge = (prerequisiteId: string, conceptId: string): GraphEdge => ({
  prerequisiteId,
  conceptId,
  strength: 1,
});

/**
 * A small curriculum shaped like a real one:
 *
 *   variables ──> loops ──────> recursion ──> trees
 *        └──────> functions ──────┘
 *   pointers ──> memory
 */
const nodes = ['variables', 'loops', 'functions', 'recursion', 'trees', 'pointers', 'memory'];
const edges: GraphEdge[] = [
  edge('variables', 'loops'),
  edge('variables', 'functions'),
  edge('loops', 'recursion'),
  edge('functions', 'recursion'),
  edge('recursion', 'trees'),
  edge('pointers', 'memory'),
];
const graph = buildGraph(nodes, edges);

describe('buildGraph', () => {
  it('indexes prerequisites and dependents in both directions', () => {
    expect(graph.prerequisitesOf.get('recursion')).toEqual(['loops', 'functions']);
    expect(graph.dependentsOf.get('variables')).toEqual(['loops', 'functions']);
  });

  it('gives roots no prerequisites and leaves no dependents', () => {
    expect(graph.prerequisitesOf.get('variables')).toEqual([]);
    expect(graph.dependentsOf.get('trees')).toEqual([]);
  });

  it('ignores edges pointing outside the requested node set', () => {
    // A goal subgraph is a legitimate subset of the domain, so a dangling edge
    // is expected rather than exceptional.
    const partial = buildGraph(['loops', 'recursion'], edges);
    expect(partial.prerequisitesOf.get('recursion')).toEqual(['loops']);
  });
});

describe('topologicalSort', () => {
  it('places every prerequisite before the concept it gates', () => {
    const order = topologicalSort(graph);
    const positionOf = new Map(order.map((id, i) => [id, i]));
    for (const e of edges) {
      expect(positionOf.get(e.prerequisiteId)).toBeLessThan(positionOf.get(e.conceptId) as number);
    }
  });

  it('returns every node exactly once', () => {
    const order = topologicalSort(graph);
    expect(order).toHaveLength(nodes.length);
    expect(new Set(order).size).toBe(nodes.length);
  });

  it('is deterministic across repeated runs', () => {
    expect(topologicalSort(graph)).toEqual(topologicalSort(graph));
  });

  it('throws with the offending cycle rather than silently truncating', () => {
    const cyclic = buildGraph(['a', 'b', 'c'], [edge('a', 'b'), edge('b', 'c'), edge('c', 'a')]);
    expect(() => topologicalSort(cyclic)).toThrow(CyclicGraphError);
    try {
      topologicalSort(cyclic);
    } catch (error) {
      expect((error as CyclicGraphError).cycle.length).toBeGreaterThan(0);
    }
  });
});

describe('cycle detection', () => {
  it('accepts a well-formed curriculum', () => {
    expect(isAcyclic(graph)).toBe(true);
    expect(findCycle(graph)).toBeNull();
  });

  it('detects a self-loop', () => {
    const selfLoop = buildGraph(['a'], [edge('a', 'a')]);
    expect(isAcyclic(selfLoop)).toBe(false);
  });

  it('rejects an edge that would make a concept its own prerequisite', () => {
    expect(wouldCreateCycle(graph, 'trees', 'variables')).toBe(true);
    expect(wouldCreateCycle(graph, 'variables', 'variables')).toBe(true);
  });

  it('allows an edge that keeps the graph acyclic', () => {
    expect(wouldCreateCycle(graph, 'memory', 'trees')).toBe(false);
  });
});

describe('ancestors and descendants', () => {
  it('collects all transitive prerequisites', () => {
    expect(ancestors(graph, 'trees')).toEqual(
      new Set(['recursion', 'loops', 'functions', 'variables']),
    );
  });

  it('collects all transitively unlocked concepts', () => {
    expect(descendants(graph, 'variables')).toEqual(
      new Set(['loops', 'functions', 'recursion', 'trees']),
    );
  });

  it('returns empty sets at the boundaries', () => {
    expect(ancestors(graph, 'variables').size).toBe(0);
    expect(descendants(graph, 'trees').size).toBe(0);
  });
});

describe('closureFor', () => {
  it('prunes the domain to only what the goal requires', () => {
    // Targeting trees must not drag in the unrelated pointers/memory branch.
    const closure = closureFor(graph, ['trees']);
    expect(closure).toEqual(new Set(['trees', 'recursion', 'loops', 'functions', 'variables']));
    expect(closure.has('pointers')).toBe(false);
  });

  it('merges the closures of multiple targets', () => {
    expect(closureFor(graph, ['trees', 'memory']).has('pointers')).toBe(true);
  });

  it('ignores unknown target ids', () => {
    expect(closureFor(graph, ['nonexistent'])).toEqual(new Set());
  });
});

describe('readiness', () => {
  const satisfied = (ids: string[]) => (id: string) => ids.includes(id);

  it('reports a root concept as ready with nothing learned', () => {
    expect(isReady(graph, 'variables', satisfied([]))).toBe(true);
  });

  it('reports a gated concept as not ready and names what is missing', () => {
    expect(isReady(graph, 'recursion', satisfied(['loops']))).toBe(false);
    expect(unmetPrerequisites(graph, 'recursion', satisfied(['loops']))).toEqual(['functions']);
  });

  it('unlocks once every direct prerequisite is satisfied', () => {
    expect(isReady(graph, 'recursion', satisfied(['loops', 'functions']))).toBe(true);
  });
});

describe('deepestUnmetPrerequisite', () => {
  const satisfied = (ids: string[]) => (id: string) => ids.includes(id);

  it('walks past the symptom to the actual root of the difficulty', () => {
    // The learner failed trees. The immediate blocker is recursion, but the
    // real starting point is variables, since nothing above it is satisfied.
    expect(deepestUnmetPrerequisite(graph, 'trees', satisfied([]))).toBe('variables');
  });

  it('stops at the shallowest concept the learner can actually start on', () => {
    // With variables known, loops and functions both become startable.
    const result = deepestUnmetPrerequisite(graph, 'trees', satisfied(['variables']));
    expect(['loops', 'functions']).toContain(result);
  });

  it('returns null when nothing is blocking', () => {
    expect(
      deepestUnmetPrerequisite(graph, 'trees', satisfied(['recursion', 'loops', 'functions', 'variables'])),
    ).toBeNull();
  });

  it('terminates on a graph with shared ancestors rather than looping', () => {
    expect(deepestUnmetPrerequisite(graph, 'recursion', satisfied([]))).toBe('variables');
  });
});
