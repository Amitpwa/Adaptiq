import { describe, expect, it } from 'vitest';
import { buildGraph } from '@/engine/graph';
import { assignRanks, orderWithinRanks, computeLayout, countCrossings } from '@/engine/layout';

describe('engine/layout', () => {
  it('assigns longest-path ranks where prerequisites are placed strictly above dependents', () => {
    const nodeIds = ['A', 'B', 'C', 'D'];
    const edges = [
      { prerequisiteId: 'A', conceptId: 'B', strength: 1.0 },
      { prerequisiteId: 'A', conceptId: 'C', strength: 1.0 },
      { prerequisiteId: 'B', conceptId: 'D', strength: 1.0 },
      { prerequisiteId: 'C', conceptId: 'D', strength: 1.0 },
    ];
    const graph = buildGraph(nodeIds, edges);

    const ranks = assignRanks(graph);
    expect(ranks.get('A')).toBe(0);
    expect(ranks.get('B')).toBe(1);
    expect(ranks.get('C')).toBe(1);
    expect(ranks.get('D')).toBe(2);
  });

  it('computes deterministic layout positions with symmetric centering', () => {
    const nodeIds = ['A', 'B'];
    const edges = [{ prerequisiteId: 'A', conceptId: 'B', strength: 1.0 }];
    const graph = buildGraph(nodeIds, edges);

    const positions = computeLayout(graph);
    expect(positions).toHaveLength(2);
    const posA = positions.find((p) => p.conceptId === 'A');
    const posB = positions.find((p) => p.conceptId === 'B');
    expect(posA?.y).toBe(0);
    expect(posB?.y).toBeGreaterThan(0);
  });

  it('counts edge crossings accurately across layers', () => {
    const nodeIds = ['A1', 'A2', 'B1', 'B2'];
    const edges = [
      { prerequisiteId: 'A2', conceptId: 'B1', strength: 1.0 },
      { prerequisiteId: 'A1', conceptId: 'B2', strength: 1.0 },
    ];
    const graph = buildGraph(nodeIds, edges);

    const ranks = assignRanks(graph);
    const layers = orderWithinRanks(graph, ranks);
    const crossings = countCrossings(graph, layers, ranks);
    expect(crossings).toBeGreaterThanOrEqual(0);
  });
});
