/**
 * Item Response Theory (3PL) and Expected A Posteriori ability estimation.
 *
 * Ability is estimated over a fixed quadrature grid rather than by iterative
 * maximum likelihood. That choice is deliberate: grid EAP always terminates,
 * always produces a finite estimate (even for all-correct or all-incorrect
 * response patterns, where maximum likelihood diverges to +/-infinity), and is
 * exactly reproducible in tests.
 */

import { IRT } from './constants';
import type { AbilityEstimate, ItemParameters, ScoredResponse } from './types';

/**
 * Probability of a correct response under the 3-parameter logistic model.
 *
 *   P(theta) = c + (1 - c) / (1 + exp(-a(theta - b)))
 */
export function probabilityCorrect(theta: number, item: ItemParameters): number {
  const { difficulty: b, discrimination: a, guessing: c } = item;
  const logistic = 1 / (1 + Math.exp(-a * (theta - b)));
  return c + (1 - c) * logistic;
}

/**
 * Fisher information for an item at a given ability.
 *
 *   I(theta) = a^2 * (P - c)^2 * (1 - P) / (P * (1 - c)^2)
 *
 * This is what makes the diagnostic adaptive: the most informative item is the
 * one that most reduces uncertainty about this particular learner.
 */
export function fisherInformation(theta: number, item: ItemParameters): number {
  const { discrimination: a, guessing: c } = item;
  const p = probabilityCorrect(theta, item);
  const denominator = p * Math.pow(1 - c, 2);
  if (denominator < IRT.EPSILON) return 0;
  return (Math.pow(a, 2) * Math.pow(p - c, 2) * (1 - p)) / denominator;
}

/** The fixed ability quadrature grid, computed once at module load. */
const THETA_GRID: readonly number[] = (() => {
  const step = (IRT.THETA_MAX - IRT.THETA_MIN) / (IRT.GRID_POINTS - 1);
  return Array.from({ length: IRT.GRID_POINTS }, (_, i) => IRT.THETA_MIN + i * step);
})();

/** Unnormalised N(0, PRIOR_SD) density over the grid. */
const PRIOR: readonly number[] = THETA_GRID.map((theta) =>
  Math.exp(-Math.pow(theta, 2) / (2 * Math.pow(IRT.PRIOR_SD, 2))),
);

export function thetaGrid(): readonly number[] {
  return THETA_GRID;
}

/**
 * Estimate ability from a sequence of graded responses.
 *
 * With no responses this returns the prior mean (0) and the prior standard
 * deviation, which is the honest answer: we know nothing yet.
 */
export function estimateAbility(responses: readonly ScoredResponse[]): AbilityEstimate {
  const posterior = THETA_GRID.map((theta, i) => {
    let density = PRIOR[i] ?? 0;
    for (const { item, correct } of responses) {
      const p = probabilityCorrect(theta, item);
      density *= correct ? p : 1 - p;
    }
    return density;
  });

  const total = posterior.reduce((sum, d) => sum + d, 0);
  if (total < IRT.EPSILON) {
    // Numerically degenerate posterior; fall back to the prior rather than
    // emitting NaN.
    return { theta: 0, standardError: IRT.PRIOR_SD };
  }

  let mean = 0;
  for (let i = 0; i < THETA_GRID.length; i += 1) {
    mean += (THETA_GRID[i] ?? 0) * (posterior[i] ?? 0);
  }
  mean /= total;

  let variance = 0;
  for (let i = 0; i < THETA_GRID.length; i += 1) {
    variance += Math.pow((THETA_GRID[i] ?? 0) - mean, 2) * (posterior[i] ?? 0);
  }
  variance /= total;

  return { theta: mean, standardError: Math.sqrt(variance) };
}

/**
 * Convert an ability estimate into a prior probability of mastery for a
 * concept. This is the bridge from the diagnostic to the knowledge tracer:
 * the diagnostic genuinely warm-starts BKT rather than the two running
 * independently.
 */
export function abilityToMastery(theta: number, item: ItemParameters): number {
  return probabilityCorrect(theta, item);
}

/**
 * The item difficulty a learner of the given ability would answer correctly
 * with `targetProbability`. Used for dynamic difficulty adjustment (FR-4.2).
 *
 * Inverting the 2PL form: b = theta - ln(p / (1 - p)) / a. The guessing
 * parameter is excluded deliberately — targeting a raw logistic probability
 * keeps difficulty selection stable across item types with different floors.
 */
export function difficultyForTargetProbability(
  theta: number,
  targetProbability: number,
  discrimination: number,
): number {
  const p = Math.min(Math.max(targetProbability, IRT.EPSILON), 1 - IRT.EPSILON);
  const a = Math.abs(discrimination) < IRT.EPSILON ? 1 : discrimination;
  return theta - Math.log(p / (1 - p)) / a;
}
