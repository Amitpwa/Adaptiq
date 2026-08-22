/**
 * Forgetting, spaced retrieval, and mastery banding.
 *
 * Decay is applied lazily at read time from `lastInteractionAt` rather than
 * written back by a scheduled job. That is a deliberate scaling decision: a
 * cron sweep would have to touch every knowledge-state row for every learner
 * on every tick, whereas read-time decay is a single multiplication computed
 * only for rows someone actually looks at.
 */

import {
  MASTERY_THRESHOLDS,
  PREREQUISITE_UNLOCK_THRESHOLD,
  REVIEW_TRIGGER_RETRIEVABILITY,
  STABILITY,
} from './constants';
import type { ConceptKnowledge, DecayedKnowledge, MasteryBand } from './types';

const MILLISECONDS_PER_DAY = 86_400_000;

export function daysBetween(from: Date, to: Date): number {
  return Math.max(0, (to.getTime() - from.getTime()) / MILLISECONDS_PER_DAY);
}

/**
 * Ebbinghaus retrievability: R(t) = exp(-t / S).
 *
 * A concept never touched has nothing to forget, so retrievability is 1 and
 * banding falls to NOT_STARTED on the mastery value alone.
 */
export function retrievability(
  lastInteractionAt: Date | null,
  stabilityDays: number,
  now: Date,
): number {
  if (lastInteractionAt === null) return 1;
  const stability = Math.max(stabilityDays, STABILITY.MIN_DAYS);
  const elapsed = daysBetween(lastInteractionAt, now);
  return Math.exp(-elapsed / stability);
}

/**
 * Update memory stability after a retrieval attempt.
 *
 * Successful recall lengthens the interval (more so on a streak); failure
 * contracts it sharply, because a forgotten item needs to come back soon.
 */
export function updateStability(
  currentStability: number,
  correct: boolean,
  correctStreak: number,
): number {
  const current = Math.max(currentStability, STABILITY.MIN_DAYS);
  const next = correct
    ? current * (STABILITY.GROWTH_FACTOR + STABILITY.STREAK_BONUS * Math.max(0, correctStreak - 1))
    : current * STABILITY.DECAY_FACTOR;
  return Math.min(Math.max(next, STABILITY.MIN_DAYS), STABILITY.MAX_DAYS);
}

/**
 * Effective mastery: what the learner is actually shown, and what every
 * threshold in the system is evaluated against.
 */
export function effectiveMastery(rawMastery: number, retrievabilityValue: number): number {
  return Math.min(Math.max(rawMastery * retrievabilityValue, 0), 1);
}

/** Band an effective mastery value. */
export function bandFor(effective: number, attempts: number): MasteryBand {
  if (attempts === 0) return 'NOT_STARTED';
  if (effective >= MASTERY_THRESHOLDS.MASTERED) return 'MASTERED';
  if (effective >= MASTERY_THRESHOLDS.FRAGILE) return 'FRAGILE';
  if (effective >= MASTERY_THRESHOLDS.IN_PROGRESS) return 'IN_PROGRESS';
  return 'GAP';
}

/**
 * Apply decay to a stored knowledge state.
 *
 * FRAGILE and GAP mean different things to a learner, and the distinction is
 * about history rather than the current number: FRAGILE is "you knew this and
 * it is fading", GAP is "you never got this". A learner who genuinely mastered
 * a concept months ago has a low *effective* mastery today, but telling them
 * they have a gap is both inaccurate and demoralising — and it would send them
 * to a full lesson when a two-minute review probe would restore it.
 *
 * So once raw mastery shows the concept was actually learned, decay can only
 * pull the band down to FRAGILE, never to GAP.
 */
export function applyDecay(state: ConceptKnowledge, now: Date): DecayedKnowledge {
  const r = retrievability(state.lastInteractionAt, state.stabilityDays, now);
  const effective = effectiveMastery(state.rawMastery, r);
  let band = bandFor(effective, state.attempts);

  const wasLearned = state.rawMastery >= PREREQUISITE_UNLOCK_THRESHOLD;
  const hasFaded = r < REVIEW_TRIGGER_RETRIEVABILITY;

  if (wasLearned && hasFaded && band !== 'MASTERED') {
    band = 'FRAGILE';
  }

  return { ...state, retrievability: r, effectiveMastery: effective, band };
}

/** Whether this concept should be surfaced as a spaced-retrieval probe. */
export function needsReview(decayed: DecayedKnowledge): boolean {
  return decayed.attempts > 0 && decayed.retrievability < REVIEW_TRIGGER_RETRIEVABILITY;
}

/**
 * When retrievability will fall to the review trigger.
 *
 * Solving R(t) = threshold for t gives t = -S * ln(threshold), so the next due
 * date is computable in closed form — no polling, no scanning.
 */
export function nextReviewDate(
  lastInteractionAt: Date,
  stabilityDays: number,
  threshold: number = REVIEW_TRIGGER_RETRIEVABILITY,
): Date {
  const stability = Math.max(stabilityDays, STABILITY.MIN_DAYS);
  const days = -stability * Math.log(threshold);
  return new Date(lastInteractionAt.getTime() + days * MILLISECONDS_PER_DAY);
}
