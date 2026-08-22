/**
 * Bayesian Knowledge Tracing.
 *
 * The learner's mastery of a concept is a probability updated by Bayes' rule
 * on each graded response, then advanced by the learning-transition
 * probability. The update is O(1) and depends only on the previous posterior —
 * a learner's full history is never replayed, which is what lets knowledge
 * state scale with activity (see the efficiency requirements in the brief).
 */

import type { BktParameters, KnowledgeTracer } from './types';

/** Clamp a probability into the open-ish unit interval to avoid 0/1 lock-in. */
function clampProbability(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), 1);
}

/**
 * Validate that BKT parameters are usable.
 *
 * The slip + guess < 1 condition matters: if a concept were authored such that
 * slipping and guessing together exceeded certainty, the posterior would move
 * the wrong way on evidence — a correct answer would *reduce* estimated
 * mastery. Rather than silently produce nonsense, we reject it.
 */
export function assertValidParameters(params: BktParameters): void {
  const { pInit, pTransit, pSlip, pGuess } = params;
  for (const [name, value] of Object.entries({ pInit, pTransit, pSlip, pGuess })) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new RangeError(`BKT parameter ${name} must be within [0, 1], received ${value}`);
    }
  }
  if (pSlip + pGuess >= 1) {
    throw new RangeError(
      `BKT parameters are degenerate: pSlip (${pSlip}) + pGuess (${pGuess}) must be < 1`,
    );
  }
}

/** Mastery before any evidence. */
export function initialMastery(params: BktParameters): number {
  assertValidParameters(params);
  return clampProbability(params.pInit);
}

/**
 * Posterior probability of mastery given one observation, before the learning
 * transition is applied.
 *
 *   correct:   P(L)(1 - slip) / [ P(L)(1 - slip) + (1 - P(L)) guess ]
 *   incorrect: P(L) slip      / [ P(L) slip      + (1 - P(L))(1 - guess) ]
 */
export function posteriorGivenObservation(
  priorMastery: number,
  correct: boolean,
  params: BktParameters,
): number {
  const prior = clampProbability(priorMastery);
  const { pSlip, pGuess } = params;

  const numerator = correct ? prior * (1 - pSlip) : prior * pSlip;
  const denominator = correct
    ? prior * (1 - pSlip) + (1 - prior) * pGuess
    : prior * pSlip + (1 - prior) * (1 - pGuess);

  // Denominator is the marginal likelihood of the observation. It can only
  // reach zero if the observation is impossible under the model, in which case
  // the evidence carries no information and the prior stands.
  if (denominator === 0) return prior;
  return clampProbability(numerator / denominator);
}

/**
 * Fold one graded response into a mastery estimate.
 *
 *   P(L') = P(L | obs) + (1 - P(L | obs)) * P(T)
 *
 * The transition term is why mastery can rise even after a wrong answer: the
 * learner had an opportunity to learn from the attempt.
 */
export function updateMastery(
  currentMastery: number,
  correct: boolean,
  params: BktParameters,
): number {
  assertValidParameters(params);
  const conditioned = posteriorGivenObservation(currentMastery, correct, params);
  return clampProbability(conditioned + (1 - conditioned) * params.pTransit);
}

/**
 * Fold a sequence of responses in order. Provided for backfills and tests;
 * the live path always uses the incremental single-response update.
 */
export function updateMasterySequence(
  startingMastery: number,
  responses: readonly boolean[],
  params: BktParameters,
): number {
  return responses.reduce(
    (mastery, correct) => updateMastery(mastery, correct, params),
    clampProbability(startingMastery),
  );
}

/** The shipped implementation of the tracer port. */
export const bktTracer: KnowledgeTracer = {
  initial: initialMastery,
  update: updateMastery,
};
