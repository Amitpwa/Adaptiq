import { describe, expect, it } from 'vitest';

import {
  assertValidParameters,
  initialMastery,
  posteriorGivenObservation,
  updateMastery,
  updateMasterySequence,
} from '@/engine/bkt';
import type { BktParameters } from '@/engine/types';

const params: BktParameters = { pInit: 0.2, pTransit: 0.1, pSlip: 0.1, pGuess: 0.2 };

describe('assertValidParameters', () => {
  it('accepts well-formed parameters', () => {
    expect(() => assertValidParameters(params)).not.toThrow();
  });

  it.each([
    ['pInit', { ...params, pInit: 1.4 }],
    ['pTransit', { ...params, pTransit: -0.1 }],
    ['pSlip', { ...params, pSlip: Number.NaN }],
  ])('rejects an out-of-range %s', (_name, invalid) => {
    expect(() => assertValidParameters(invalid as BktParameters)).toThrow(RangeError);
  });

  it('rejects degenerate parameters where slip + guess >= 1', () => {
    // Under these parameters a correct answer would *lower* estimated mastery,
    // which is worse than useless — it silently inverts the model.
    expect(() => assertValidParameters({ ...params, pSlip: 0.6, pGuess: 0.5 })).toThrow(
      /degenerate/,
    );
  });
});

describe('posteriorGivenObservation', () => {
  it('matches the hand-computed value for a correct answer', () => {
    // prior 0.2, slip 0.1, guess 0.2
    // numerator   = 0.2 * 0.9                 = 0.18
    // denominator = 0.18 + 0.8 * 0.2 = 0.18 + 0.16 = 0.34
    // posterior   = 0.18 / 0.34 = 0.5294117647...
    expect(posteriorGivenObservation(0.2, true, params)).toBeCloseTo(0.529411764, 8);
  });

  it('matches the hand-computed value for an incorrect answer', () => {
    // numerator   = 0.2 * 0.1                 = 0.02
    // denominator = 0.02 + 0.8 * 0.8 = 0.02 + 0.64 = 0.66
    // posterior   = 0.02 / 0.66 = 0.0303030303...
    expect(posteriorGivenObservation(0.2, false, params)).toBeCloseTo(0.030303030, 8);
  });

  it('raises mastery on a correct answer and lowers it on an incorrect one', () => {
    expect(posteriorGivenObservation(0.5, true, params)).toBeGreaterThan(0.5);
    expect(posteriorGivenObservation(0.5, false, params)).toBeLessThan(0.5);
  });

  it('never leaves the unit interval', () => {
    for (const prior of [0, 0.001, 0.5, 0.999, 1]) {
      for (const correct of [true, false]) {
        const posterior = posteriorGivenObservation(prior, correct, params);
        expect(posterior).toBeGreaterThanOrEqual(0);
        expect(posterior).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('updateMastery', () => {
  it('applies the learning transition after conditioning', () => {
    // conditioned = 0.529411764..., transit = 0.1
    // P(L') = 0.529411764 + (1 - 0.529411764) * 0.1 = 0.576470588...
    expect(updateMastery(0.2, true, params)).toBeCloseTo(0.576470588, 8);
  });

  it('can increase mastery even after a wrong answer, because the learner had an opportunity to learn', () => {
    const generousTransit: BktParameters = { ...params, pTransit: 0.6 };
    const before = 0.05;
    expect(updateMastery(before, false, generousTransit)).toBeGreaterThan(before);
  });

  it('is monotone in the prior: knowing more before means knowing more after', () => {
    let previous = -Infinity;
    for (const prior of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
      const posterior = updateMastery(prior, true, params);
      expect(posterior).toBeGreaterThan(previous);
      previous = posterior;
    }
  });

  it('converges toward mastery under repeated correct answers', () => {
    let mastery = initialMastery(params);
    for (let i = 0; i < 12; i += 1) mastery = updateMastery(mastery, true, params);
    expect(mastery).toBeGreaterThan(0.95);
  });

  it('drives mastery down under repeated incorrect answers', () => {
    let mastery = 0.9;
    for (let i = 0; i < 12; i += 1) mastery = updateMastery(mastery, false, params);
    // The transition probability puts a floor under decline; the learner is
    // still credited with the practice.
    expect(mastery).toBeLessThan(0.2);
  });

  it('rejects invalid parameters rather than producing a silently wrong number', () => {
    expect(() => updateMastery(0.5, true, { ...params, pSlip: 0.7, pGuess: 0.4 })).toThrow(
      RangeError,
    );
  });

  it('is O(1): the result depends only on the previous posterior, not on history', () => {
    // Two different histories that arrive at the same posterior must produce
    // identical next values — this is the property that lets the live path
    // avoid replaying a learner's entire record.
    const viaSequence = updateMasterySequence(0.2, [true, false, true], params);
    const stepwise = updateMastery(
      updateMastery(updateMastery(0.2, true, params), false, params),
      true,
      params,
    );
    expect(viaSequence).toBeCloseTo(stepwise, 12);
  });
});

describe('updateMasterySequence', () => {
  it('is order-sensitive, as knowledge tracing should be', () => {
    // Recency matters: ending on a success is not the same as ending on a
    // failure, even with the same tally.
    const endsCorrect = updateMasterySequence(0.3, [false, true], params);
    const endsIncorrect = updateMasterySequence(0.3, [true, false], params);
    expect(endsCorrect).not.toBeCloseTo(endsIncorrect, 6);
    expect(endsCorrect).toBeGreaterThan(endsIncorrect);
  });

  it('returns the starting value for an empty sequence', () => {
    expect(updateMasterySequence(0.42, [], params)).toBeCloseTo(0.42, 12);
  });
});

describe('initialMastery', () => {
  it('returns the authored prior', () => {
    expect(initialMastery(params)).toBeCloseTo(0.2, 12);
  });
});
