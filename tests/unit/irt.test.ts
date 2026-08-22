import { describe, expect, it } from 'vitest';

import {
  difficultyForTargetProbability,
  estimateAbility,
  fisherInformation,
  probabilityCorrect,
} from '@/engine/irt';
import { IRT } from '@/engine/constants';
import type { ItemParameters, ScoredResponse } from '@/engine/types';

const item = (
  difficulty: number,
  discrimination = 1,
  guessing = 0,
): ItemParameters => ({ difficulty, discrimination, guessing });

describe('probabilityCorrect', () => {
  it('returns exactly 0.5 when ability equals difficulty and there is no guessing', () => {
    expect(probabilityCorrect(0, item(0))).toBeCloseTo(0.5, 10);
    expect(probabilityCorrect(1.5, item(1.5))).toBeCloseTo(0.5, 10);
  });

  it('lifts the floor to the guessing parameter for very low ability', () => {
    // With c = 0.25, a learner far below the item difficulty still has the
    // one-in-four chance a four-option question gives them. The logistic term
    // is asymptotic rather than zero, so the value approaches 0.25 from above.
    expect(probabilityCorrect(-10, item(0, 1, 0.25))).toBeCloseTo(0.25, 3);
    expect(probabilityCorrect(-10, item(0, 1, 0.25))).toBeGreaterThan(0.25);
  });

  it('approaches 1 for ability far above difficulty', () => {
    expect(probabilityCorrect(10, item(0))).toBeGreaterThan(0.999);
  });

  it('matches the closed-form 2PL value', () => {
    // a=1.5, b=0.5, theta=1.0 => 1 / (1 + exp(-1.5 * 0.5)) = 0.6791787...
    expect(probabilityCorrect(1, item(0.5, 1.5))).toBeCloseTo(0.679178699, 8);
  });

  it('is monotonically increasing in ability', () => {
    const params = item(0.3, 1.2, 0.2);
    let previous = -Infinity;
    for (let theta = -3; theta <= 3; theta += 0.25) {
      const p = probabilityCorrect(theta, params);
      expect(p).toBeGreaterThan(previous);
      previous = p;
    }
  });

  it('is monotonically decreasing in item difficulty', () => {
    let previous = Infinity;
    for (let b = -3; b <= 3; b += 0.25) {
      const p = probabilityCorrect(0, item(b));
      expect(p).toBeLessThan(previous);
      previous = p;
    }
  });
});

describe('fisherInformation', () => {
  it('peaks where the item difficulty matches the learner ability', () => {
    const target = item(0.8, 1.4);
    const atMatch = fisherInformation(0.8, target);
    expect(atMatch).toBeGreaterThan(fisherInformation(-0.5, target));
    expect(atMatch).toBeGreaterThan(fisherInformation(2.5, target));
  });

  it('equals a^2/4 at the difficulty point for a 2PL item', () => {
    // With c = 0, P = 0.5 at theta = b, so I = a^2 * 0.25.
    expect(fisherInformation(0, item(0, 2, 0))).toBeCloseTo(1, 8);
    expect(fisherInformation(0, item(0, 1, 0))).toBeCloseTo(0.25, 8);
  });

  it('rewards more discriminating items', () => {
    expect(fisherInformation(0, item(0, 2))).toBeGreaterThan(fisherInformation(0, item(0, 0.5)));
  });

  it('is never negative', () => {
    for (let theta = -3; theta <= 3; theta += 0.5) {
      expect(fisherInformation(theta, item(0.2, 1.1, 0.25))).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('estimateAbility', () => {
  it('returns the prior when there is no evidence', () => {
    const estimate = estimateAbility([]);
    expect(estimate.theta).toBeCloseTo(0, 10);
    // Slightly below PRIOR_SD because the grid truncates the normal prior at
    // +/-3 logits, which trims the tails that carry the remaining variance.
    expect(estimate.standardError).toBeGreaterThan(0.95 * IRT.PRIOR_SD);
    expect(estimate.standardError).toBeLessThanOrEqual(IRT.PRIOR_SD);
  });

  it('raises the estimate after correct answers on hard items', () => {
    const responses: ScoredResponse[] = [
      { item: item(1.5), correct: true },
      { item: item(2.0), correct: true },
    ];
    expect(estimateAbility(responses).theta).toBeGreaterThan(0.5);
  });

  it('lowers the estimate after incorrect answers on easy items', () => {
    const responses: ScoredResponse[] = [
      { item: item(-1.5), correct: false },
      { item: item(-2.0), correct: false },
    ];
    expect(estimateAbility(responses).theta).toBeLessThan(-0.5);
  });

  it('stays finite for an all-correct pattern where maximum likelihood diverges', () => {
    // This is the specific failure mode grid EAP is chosen to avoid: MLE would
    // run to +infinity here.
    const responses: ScoredResponse[] = Array.from({ length: 7 }, () => ({
      item: item(0),
      correct: true,
    }));
    const estimate = estimateAbility(responses);
    expect(Number.isFinite(estimate.theta)).toBe(true);
    expect(estimate.theta).toBeLessThanOrEqual(IRT.THETA_MAX);
    expect(estimate.theta).toBeGreaterThan(1);
  });

  it('stays finite for an all-incorrect pattern', () => {
    const responses: ScoredResponse[] = Array.from({ length: 7 }, () => ({
      item: item(0),
      correct: false,
    }));
    const estimate = estimateAbility(responses);
    expect(Number.isFinite(estimate.theta)).toBe(true);
    expect(estimate.theta).toBeGreaterThanOrEqual(IRT.THETA_MIN);
    expect(estimate.theta).toBeLessThan(-1);
  });

  it('becomes more precise as evidence accumulates', () => {
    const one = estimateAbility([{ item: item(0), correct: true }]);
    const many = estimateAbility(
      Array.from({ length: 6 }, (_, i) => ({
        item: item(i % 2 === 0 ? 0.2 : -0.2, 1.5),
        correct: i % 2 === 0,
      })),
    );
    expect(many.standardError).toBeLessThan(one.standardError);
  });

  it('is order-independent: the same responses in any order give the same estimate', () => {
    const responses: ScoredResponse[] = [
      { item: item(0.5), correct: true },
      { item: item(-0.5), correct: false },
      { item: item(1.2, 1.3), correct: true },
    ];
    const forward = estimateAbility(responses);
    const reversed = estimateAbility([...responses].reverse());
    expect(forward.theta).toBeCloseTo(reversed.theta, 12);
    expect(forward.standardError).toBeCloseTo(reversed.standardError, 12);
  });

  it('is deterministic across repeated calls', () => {
    const responses: ScoredResponse[] = [{ item: item(0.4, 1.1, 0.2), correct: true }];
    expect(estimateAbility(responses)).toEqual(estimateAbility(responses));
  });
});

describe('difficultyForTargetProbability', () => {
  it('returns the ability itself when targeting a 50% success rate', () => {
    expect(difficultyForTargetProbability(1.2, 0.5, 1)).toBeCloseTo(1.2, 10);
  });

  it('selects easier items when targeting a higher success rate', () => {
    const forSeventy = difficultyForTargetProbability(0, 0.7, 1);
    const forFifty = difficultyForTargetProbability(0, 0.5, 1);
    expect(forSeventy).toBeLessThan(forFifty);
  });

  it('round-trips through probabilityCorrect for the ZPD target', () => {
    const theta = 0.6;
    const discrimination = 1.3;
    const b = difficultyForTargetProbability(theta, 0.7, discrimination);
    expect(probabilityCorrect(theta, item(b, discrimination, 0))).toBeCloseTo(0.7, 8);
  });

  it('does not divide by zero for a degenerate discrimination', () => {
    expect(Number.isFinite(difficultyForTargetProbability(0, 0.7, 0))).toBe(true);
  });
});
