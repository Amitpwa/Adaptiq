/**
 * Computerised Adaptive Testing.
 *
 * Item selection maximises Fisher information at the current ability estimate,
 * so each question is chosen to tell us the most about *this* learner. When a
 * learner fails a concept the selector switches to that concept's
 * prerequisites, which is what localises the exact boundary of competence
 * instead of merely producing a score (PRD FR-1.1).
 */

import { CAT, ZPD } from './constants';
import { difficultyForTargetProbability, estimateAbility, fisherInformation } from './irt';
import type { AbilityEstimate, CandidateItem, ScoredResponse } from './types';

export interface SelectionContext {
  /** Items not yet served in this session. */
  candidates: readonly CandidateItem[];
  /** Current ability estimate. */
  theta: number;
  /**
   * Concepts to prefer. When the previous answer was wrong this holds the
   * prerequisites of the failed concept, driving the drill-down.
   */
  preferredConceptIds?: readonly string[];
}

/**
 * Choose the next item.
 *
 * Preference is a filter, not a tiebreak: if any candidate belongs to a
 * preferred concept, selection happens only within that set. Ties on
 * information are broken by item id so the sequence is reproducible.
 */
export function selectNextItem(context: SelectionContext): CandidateItem | null {
  const { candidates, theta, preferredConceptIds } = context;
  if (candidates.length === 0) return null;

  let pool = candidates;
  if (preferredConceptIds && preferredConceptIds.length > 0) {
    const preferred = new Set(preferredConceptIds);
    const filtered = candidates.filter((item) => preferred.has(item.conceptId));
    if (filtered.length > 0) pool = filtered;
  }

  let best: CandidateItem | null = null;
  let bestInformation = -Infinity;

  for (const item of pool) {
    const information = fisherInformation(theta, item);
    if (
      information > bestInformation ||
      (information === bestInformation && best !== null && item.id < best.id)
    ) {
      best = item;
      bestInformation = information;
    }
  }

  return best;
}

export interface StopDecision {
  shouldStop: boolean;
  reason: 'MAX_ITEMS' | 'PRECISION_REACHED' | 'NO_ITEMS_LEFT' | 'CONTINUE';
}

/**
 * Stopping rule: enough items for a defensible estimate, precise enough to act
 * on, or nothing left to ask.
 */
export function shouldStop(
  itemsServed: number,
  standardError: number,
  candidatesRemaining: number,
): StopDecision {
  if (itemsServed >= CAT.MAX_ITEMS) return { shouldStop: true, reason: 'MAX_ITEMS' };
  if (candidatesRemaining === 0) return { shouldStop: true, reason: 'NO_ITEMS_LEFT' };
  if (itemsServed >= CAT.MIN_ITEMS && standardError < CAT.TARGET_STANDARD_ERROR) {
    return { shouldStop: true, reason: 'PRECISION_REACHED' };
  }
  return { shouldStop: false, reason: 'CONTINUE' };
}

/** Re-estimate ability from the full response set for a session. */
export function reestimate(responses: readonly ScoredResponse[]): AbilityEstimate {
  return estimateAbility(responses);
}

/**
 * Pick the practice item closest to the learner's zone of proximal
 * development: hard enough to be worth answering, easy enough to be winnable
 * (FR-4.2).
 */
export function selectZpdItem(
  candidates: readonly CandidateItem[],
  theta: number,
): CandidateItem | null {
  if (candidates.length === 0) return null;

  let best: CandidateItem | null = null;
  let smallestDistance = Infinity;

  for (const item of candidates) {
    const ideal = difficultyForTargetProbability(
      theta,
      ZPD.TARGET_SUCCESS_PROBABILITY,
      item.discrimination,
    );
    const distance = Math.abs(item.difficulty - ideal);
    if (distance < smallestDistance || (distance === smallestDistance && best && item.id < best.id)) {
      best = item;
      smallestDistance = distance;
    }
  }

  return best;
}
