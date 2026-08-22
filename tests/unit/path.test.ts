import { describe, expect, it } from 'vitest';

import { buildGraph } from '@/engine/graph';
import {
  generatePath,
  isPrerequisiteSatisfied,
  nextActionableNode,
  pathCompletion,
} from '@/engine/path';
import { PREREQUISITE_UNLOCK_THRESHOLD } from '@/engine/constants';
import type { DecayedKnowledge, GraphEdge, MasteryBand } from '@/engine/types';

const edge = (prerequisiteId: string, conceptId: string): GraphEdge => ({
  prerequisiteId,
  conceptId,
  strength: 1,
});

/** vectors -> matrices -> matmul ;  derivatives -> gradients -> matmul */
const nodes = ['vectors', 'matrices', 'derivatives', 'gradients', 'matmul'];
const graph = buildGraph(nodes, [
  edge('vectors', 'matrices'),
  edge('matrices', 'matmul'),
  edge('derivatives', 'gradients'),
  edge('gradients', 'matmul'),
]);

function state(
  conceptId: string,
  overrides: Partial<DecayedKnowledge> & { band: MasteryBand },
): DecayedKnowledge {
  return {
    conceptId,
    rawMastery: 0.5,
    stabilityDays: 10,
    lastInteractionAt: new Date('2026-08-22T00:00:00Z'),
    attempts: 3,
    correct: 2,
    retrievability: 1,
    effectiveMastery: 0.5,
    ...overrides,
  };
}

describe('isPrerequisiteSatisfied', () => {
  it('treats an untouched concept as unsatisfied', () => {
    expect(isPrerequisiteSatisfied(undefined)).toBe(false);
  });

  it('unlocks at the threshold rather than requiring full mastery', () => {
    expect(
      isPrerequisiteSatisfied(
        state('vectors', { band: 'FRAGILE', effectiveMastery: PREREQUISITE_UNLOCK_THRESHOLD }),
      ),
    ).toBe(true);
    expect(
      isPrerequisiteSatisfied(
        state('vectors', {
          band: 'IN_PROGRESS',
          effectiveMastery: PREREQUISITE_UNLOCK_THRESHOLD - 0.01,
        }),
      ),
    ).toBe(false);
  });
});

describe('generatePath', () => {
  it('orders prerequisites before the concepts they gate', () => {
    const path = generatePath({ graph, goalConceptIds: ['matmul'], knowledge: new Map() });
    const positionOf = new Map(path.map((node) => [node.conceptId, node.position]));
    expect(positionOf.get('vectors')).toBeLessThan(positionOf.get('matrices') as number);
    expect(positionOf.get('matrices')).toBeLessThan(positionOf.get('matmul') as number);
    expect(positionOf.get('gradients')).toBeLessThan(positionOf.get('matmul') as number);
  });

  it('locks a concept whose prerequisites are unmet, naming them', () => {
    const path = generatePath({ graph, goalConceptIds: ['matmul'], knowledge: new Map() });
    const matmul = path.find((node) => node.conceptId === 'matmul');
    expect(matmul?.status).toBe('LOCKED');
    expect(matmul?.unmetPrerequisiteIds.sort()).toEqual(['gradients', 'matrices']);
    // The learner must be told which prerequisites, not just that it is locked.
    expect(matmul?.rationale).toContain('matrices');
    expect(matmul?.rationale).toContain('gradients');
  });

  it('opens root concepts immediately', () => {
    const path = generatePath({ graph, goalConceptIds: ['matmul'], knowledge: new Map() });
    expect(path.find((node) => node.conceptId === 'vectors')?.status).toBe('READY');
  });

  it('reports a GAP only when prerequisites are already met', () => {
    // A weak concept whose own foundation is missing is LOCKED, not a GAP:
    // sending the learner at it directly would set them up to fail.
    const knowledge = new Map([
      ['matrices', state('matrices', { band: 'GAP', effectiveMastery: 0.1 })],
    ]);
    const path = generatePath({ graph, goalConceptIds: ['matmul'], knowledge });
    expect(path.find((node) => node.conceptId === 'matrices')?.status).toBe('LOCKED');

    const withFoundation = new Map([
      ['vectors', state('vectors', { band: 'MASTERED', effectiveMastery: 0.9 })],
      ['matrices', state('matrices', { band: 'GAP', effectiveMastery: 0.1 })],
    ]);
    const path2 = generatePath({ graph, goalConceptIds: ['matmul'], knowledge: withFoundation });
    expect(path2.find((node) => node.conceptId === 'matrices')?.status).toBe('GAP');
  });

  it('marks mastered concepts as mastered so they can be skipped', () => {
    const knowledge = new Map([
      ['vectors', state('vectors', { band: 'MASTERED', effectiveMastery: 0.92 })],
    ]);
    const path = generatePath({ graph, goalConceptIds: ['matmul'], knowledge });
    expect(path.find((node) => node.conceptId === 'vectors')?.status).toBe('MASTERED');
  });

  it('does not tell a learner their knowledge is fading immediately after they answered', () => {
    // Retrievability is a continuous exponential, so it is fractionally below 1
    // the instant after an interaction. Copy keyed on "< 1" told a learner who
    // had just answered correctly that their recall was slipping.
    const knowledge = new Map([
      [
        'vectors',
        state('vectors', {
          band: 'FRAGILE',
          rawMastery: 0.76,
          effectiveMastery: 0.7599,
          retrievability: 0.9999,
        }),
      ],
    ]);
    const path = generatePath({ graph, goalConceptIds: ['matmul'], knowledge });
    const vectors = path.find((node) => node.conceptId === 'vectors');
    expect(vectors?.status).toBe('IN_PROGRESS');
    expect(vectors?.rationale).not.toMatch(/fading|slipped/i);
    expect(vectors?.rationale).toMatch(/practice/i);
  });

  it('does say knowledge is fading once retrievability has genuinely dropped', () => {
    const knowledge = new Map([
      [
        'vectors',
        state('vectors', {
          band: 'FRAGILE',
          rawMastery: 0.95,
          effectiveMastery: 0.45,
          retrievability: 0.47,
        }),
      ],
    ]);
    const path = generatePath({ graph, goalConceptIds: ['matmul'], knowledge });
    expect(path.find((node) => node.conceptId === 'vectors')?.rationale).toMatch(/slipped/i);
  });

  it('prunes concepts unrelated to the goal', () => {
    const path = generatePath({ graph, goalConceptIds: ['matrices'], knowledge: new Map() });
    expect(path.map((node) => node.conceptId).sort()).toEqual(['matrices', 'vectors']);
  });

  it('gives every node a non-empty rationale', () => {
    const path = generatePath({ graph, goalConceptIds: ['matmul'], knowledge: new Map() });
    for (const node of path) {
      expect(node.rationale.length).toBeGreaterThan(0);
    }
  });
});

describe('nextActionableNode', () => {
  it('prioritises a gap over other actionable work', () => {
    const knowledge = new Map([
      ['vectors', state('vectors', { band: 'MASTERED', effectiveMastery: 0.9 })],
      ['matrices', state('matrices', { band: 'GAP', effectiveMastery: 0.1 })],
      ['derivatives', state('derivatives', { band: 'IN_PROGRESS', effectiveMastery: 0.4 })],
    ]);
    const path = generatePath({ graph, goalConceptIds: ['matmul'], knowledge });
    expect(nextActionableNode(path)?.conceptId).toBe('matrices');
  });

  it('never returns a locked node', () => {
    const path = generatePath({ graph, goalConceptIds: ['matmul'], knowledge: new Map() });
    expect(nextActionableNode(path)?.status).not.toBe('LOCKED');
  });

  it('returns null when everything is mastered', () => {
    const knowledge = new Map(
      nodes.map((id) => [id, state(id, { band: 'MASTERED', effectiveMastery: 0.95 })]),
    );
    const path = generatePath({ graph, goalConceptIds: ['matmul'], knowledge });
    expect(nextActionableNode(path)).toBeNull();
  });
});

describe('pathCompletion', () => {
  it('is zero for an empty path', () => {
    expect(pathCompletion([])).toBe(0);
  });

  it('counts only mastered nodes', () => {
    const knowledge = new Map([
      ['vectors', state('vectors', { band: 'MASTERED', effectiveMastery: 0.9 })],
    ]);
    const path = generatePath({ graph, goalConceptIds: ['matmul'], knowledge });
    expect(pathCompletion(path)).toBeCloseTo(1 / path.length, 10);
  });
});
