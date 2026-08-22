import { describe, expect, it } from 'vitest';
import {
  selectNextItem,
  shouldStop,
  reestimate,
  selectZpdItem,
} from '@/engine/cat';
import type { CandidateItem, ScoredResponse } from '@/engine/types';

describe('engine/cat (Computerised Adaptive Testing)', () => {
  const itemA: CandidateItem = {
    id: 'item-1',
    conceptId: 'concept-A',
    difficulty: 0.0,
    discrimination: 1.2,
    guessing: 0.2,
  };

  const itemB: CandidateItem = {
    id: 'item-2',
    conceptId: 'concept-B',
    difficulty: 1.5,
    discrimination: 1.5,
    guessing: 0.2,
  };

  const itemC: CandidateItem = {
    id: 'item-3',
    conceptId: 'concept-A',
    difficulty: -1.0,
    discrimination: 1.0,
    guessing: 0.2,
  };

  describe('selectNextItem', () => {
    it('returns null when candidate pool is empty', () => {
      const result = selectNextItem({ candidates: [], theta: 0.0 });
      expect(result).toBeNull();
    });

    it('selects item with maximum Fisher Information for a given ability theta', () => {
      const candidates = [itemA, itemB, itemC];
      // At ability theta = 0, itemA (difficulty 0.0) has higher information than itemB (1.5)
      const selected = selectNextItem({ candidates, theta: 0.0 });
      expect(selected?.id).toBe('item-1');
    });

    it('prioritises candidates in preferredConceptIds if specified', () => {
      const candidates = [itemA, itemB, itemC];
      // Force preference to concept-B
      const selected = selectNextItem({
        candidates,
        theta: 0.0,
        preferredConceptIds: ['concept-B'],
      });
      expect(selected?.id).toBe('item-2');
    });

    it('falls back to general candidate pool if no preferred concept candidates match', () => {
      const candidates = [itemA, itemB];
      const selected = selectNextItem({
        candidates,
        theta: 0.0,
        preferredConceptIds: ['concept-NONEXISTENT'],
      });
      expect(selected).not.toBeNull();
      expect(selected?.id).toBe('item-1');
    });

    it('breaks information ties deterministically by item id', () => {
      const item1: CandidateItem = { id: 'item-a', conceptId: 'c1', difficulty: 0, discrimination: 1, guessing: 0 };
      const item2: CandidateItem = { id: 'item-b', conceptId: 'c1', difficulty: 0, discrimination: 1, guessing: 0 };
      const selected = selectNextItem({ candidates: [item2, item1], theta: 0 });
      expect(selected?.id).toBe('item-a');
    });
  });

  describe('shouldStop (Adaptive Stopping Rules)', () => {
    it('stops when maximum item threshold is reached', () => {
      const decision = shouldStop(7, 0.5, 10);
      expect(decision.shouldStop).toBe(true);
      expect(decision.reason).toBe('MAX_ITEMS');
    });

    it('stops when no items are left in the candidate pool', () => {
      const decision = shouldStop(3, 0.5, 0);
      expect(decision.shouldStop).toBe(true);
      expect(decision.reason).toBe('NO_ITEMS_LEFT');
    });

    it('stops when minimum items are served and target standard error precision is satisfied', () => {
      const decision = shouldStop(5, 0.25, 10); // min items = 5, target SE = 0.35
      expect(decision.shouldStop).toBe(true);
      expect(decision.reason).toBe('PRECISION_REACHED');
    });

    it('continues when precision has not been reached and items remain', () => {
      const decision = shouldStop(3, 0.45, 10);
      expect(decision.shouldStop).toBe(false);
      expect(decision.reason).toBe('CONTINUE');
    });
  });

  describe('reestimate', () => {
    it('estimates posterior ability from a series of scored responses', () => {
      const responses: ScoredResponse[] = [
        { item: itemA, correct: true },
        { item: itemB, correct: true },
      ];
      const estimate = reestimate(responses);
      expect(estimate.theta).toBeGreaterThan(0.0);
      expect(estimate.standardError).toBeGreaterThan(0.0);
    });
  });

  describe('selectZpdItem (Zone of Proximal Development)', () => {
    it('returns null when candidates are empty', () => {
      expect(selectZpdItem([], 0.0)).toBeNull();
    });

    it('selects the item with difficulty closest to optimal target success rate (0.65-0.75)', () => {
      const candidates = [itemA, itemB, itemC];
      const zpd = selectZpdItem(candidates, 0.0);
      expect(zpd).not.toBeNull();
      expect(zpd?.conceptId).toBeDefined();
    });
  });
});
