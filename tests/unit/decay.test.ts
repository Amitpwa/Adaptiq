import { describe, expect, it } from 'vitest';

import {
  applyDecay,
  bandFor,
  daysBetween,
  effectiveMastery,
  needsReview,
  nextReviewDate,
  retrievability,
  updateStability,
} from '@/engine/decay';
import { MASTERY_THRESHOLDS, REVIEW_TRIGGER_RETRIEVABILITY, STABILITY } from '@/engine/constants';
import type { ConceptKnowledge } from '@/engine/types';

const NOW = new Date('2026-08-22T12:00:00.000Z');
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000);

const knowledge = (overrides: Partial<ConceptKnowledge> = {}): ConceptKnowledge => ({
  conceptId: 'c1',
  rawMastery: 0.9,
  stabilityDays: 10,
  lastInteractionAt: daysAgo(0),
  attempts: 5,
  correct: 4,
  ...overrides,
});

describe('daysBetween', () => {
  it('measures elapsed days', () => {
    expect(daysBetween(daysAgo(3), NOW)).toBeCloseTo(3, 10);
  });

  it('never returns a negative span for a future timestamp', () => {
    expect(daysBetween(new Date(NOW.getTime() + 86_400_000), NOW)).toBe(0);
  });
});

describe('retrievability', () => {
  it('is 1 immediately after an interaction', () => {
    expect(retrievability(NOW, 10, NOW)).toBeCloseTo(1, 10);
  });

  it('equals exp(-1) after exactly one stability period', () => {
    expect(retrievability(daysAgo(10), 10, NOW)).toBeCloseTo(Math.exp(-1), 10);
  });

  it('is 1 for a concept never interacted with — you cannot forget what you never learned', () => {
    expect(retrievability(null, 10, NOW)).toBe(1);
  });

  it('decays more slowly with greater stability', () => {
    expect(retrievability(daysAgo(7), 30, NOW)).toBeGreaterThan(
      retrievability(daysAgo(7), 3, NOW),
    );
  });

  it('is monotonically decreasing over time', () => {
    let previous = Infinity;
    for (const days of [0, 1, 3, 7, 14, 30, 90]) {
      const r = retrievability(daysAgo(days), 10, NOW);
      expect(r).toBeLessThan(previous);
      previous = r;
    }
  });

  it('stays within [0, 1]', () => {
    for (const days of [0, 1, 1000]) {
      const r = retrievability(daysAgo(days), 5, NOW);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
    }
  });
});

describe('updateStability', () => {
  it('lengthens the interval on successful recall', () => {
    expect(updateStability(10, true, 1)).toBeGreaterThan(10);
  });

  it('contracts sharply on failure', () => {
    expect(updateStability(10, false, 0)).toBeCloseTo(5, 10);
  });

  it('grows faster on a longer correct streak', () => {
    expect(updateStability(10, true, 4)).toBeGreaterThan(updateStability(10, true, 1));
  });

  it('is capped so a dormant concept still eventually resurfaces', () => {
    expect(updateStability(STABILITY.MAX_DAYS, true, 10)).toBeLessThanOrEqual(STABILITY.MAX_DAYS);
  });

  it('never falls below the floor', () => {
    let stability = 1;
    for (let i = 0; i < 20; i += 1) stability = updateStability(stability, false, 0);
    expect(stability).toBeGreaterThanOrEqual(STABILITY.MIN_DAYS);
  });
});

describe('effectiveMastery and bandFor', () => {
  it('scales raw mastery by retrievability', () => {
    expect(effectiveMastery(0.8, 0.5)).toBeCloseTo(0.4, 10);
  });

  it('reports NOT_STARTED when there are no attempts, whatever the value', () => {
    expect(bandFor(0.9, 0)).toBe('NOT_STARTED');
  });

  it('bands at the documented thresholds', () => {
    expect(bandFor(MASTERY_THRESHOLDS.MASTERED, 1)).toBe('MASTERED');
    expect(bandFor(MASTERY_THRESHOLDS.MASTERED - 0.001, 1)).toBe('FRAGILE');
    expect(bandFor(MASTERY_THRESHOLDS.FRAGILE, 1)).toBe('FRAGILE');
    expect(bandFor(MASTERY_THRESHOLDS.FRAGILE - 0.001, 1)).toBe('IN_PROGRESS');
    expect(bandFor(MASTERY_THRESHOLDS.IN_PROGRESS, 1)).toBe('IN_PROGRESS');
    expect(bandFor(MASTERY_THRESHOLDS.IN_PROGRESS - 0.001, 1)).toBe('GAP');
  });
});

describe('applyDecay', () => {
  it('leaves a freshly practised concept at full strength', () => {
    const result = applyDecay(knowledge({ rawMastery: 0.9, lastInteractionAt: NOW }), NOW);
    expect(result.retrievability).toBeCloseTo(1, 8);
    expect(result.effectiveMastery).toBeCloseTo(0.9, 8);
    expect(result.band).toBe('MASTERED');
  });

  it('downgrades a well-learned but faded concept to FRAGILE, never to GAP', () => {
    // Raw mastery is high, but three stability periods have elapsed, so
    // effective mastery is far below the GAP threshold. The learner still
    // *learned* this, so it must read as "needs review", not "gap" — a gap
    // would send them to a full lesson instead of a two-minute probe.
    const result = applyDecay(
      knowledge({ rawMastery: 0.95, stabilityDays: 3, lastInteractionAt: daysAgo(9) }),
      NOW,
    );
    expect(result.retrievability).toBeLessThan(REVIEW_TRIGGER_RETRIEVABILITY);
    expect(result.effectiveMastery).toBeLessThan(MASTERY_THRESHOLDS.IN_PROGRESS);
    expect(result.band).toBe('FRAGILE');
  });

  it('reports a genuine GAP when the concept was never learned in the first place', () => {
    // Low raw mastery means there is nothing to have forgotten; decay must not
    // launder a never-learned concept into "needs review".
    const result = applyDecay(
      knowledge({ rawMastery: 0.2, stabilityDays: 3, lastInteractionAt: daysAgo(9) }),
      NOW,
    );
    expect(result.band).toBe('GAP');
  });

  it('keeps a mastered concept mastered while recall is still strong', () => {
    const result = applyDecay(
      knowledge({ rawMastery: 0.95, stabilityDays: 60, lastInteractionAt: daysAgo(2) }),
      NOW,
    );
    expect(result.band).toBe('MASTERED');
  });

  it('does not mutate the input state', () => {
    const input = knowledge();
    const snapshot = { ...input };
    applyDecay(input, NOW);
    expect(input).toEqual(snapshot);
  });
});

describe('needsReview', () => {
  it('flags a decayed concept the learner has actually studied', () => {
    const decayed = applyDecay(
      knowledge({ rawMastery: 0.9, stabilityDays: 2, lastInteractionAt: daysAgo(6) }),
      NOW,
    );
    expect(needsReview(decayed)).toBe(true);
  });

  it('does not flag a concept that was never attempted', () => {
    const decayed = applyDecay(
      knowledge({ attempts: 0, rawMastery: 0, lastInteractionAt: null }),
      NOW,
    );
    expect(needsReview(decayed)).toBe(false);
  });

  it('does not flag a recently practised concept', () => {
    const decayed = applyDecay(knowledge({ lastInteractionAt: daysAgo(0.5) }), NOW);
    expect(needsReview(decayed)).toBe(false);
  });
});

describe('nextReviewDate', () => {
  it('lands exactly where retrievability hits the review threshold', () => {
    const last = daysAgo(0);
    const due = nextReviewDate(last, 10);
    // Evaluated at the due date, retrievability should equal the trigger.
    expect(retrievability(last, 10, due)).toBeCloseTo(REVIEW_TRIGGER_RETRIEVABILITY, 8);
  });

  it('schedules further out for more stable memories', () => {
    const last = daysAgo(0);
    expect(nextReviewDate(last, 30).getTime()).toBeGreaterThan(nextReviewDate(last, 3).getTime());
  });

  it('is always in the future relative to the last interaction', () => {
    const last = daysAgo(0);
    expect(nextReviewDate(last, 1).getTime()).toBeGreaterThan(last.getTime());
  });
});
