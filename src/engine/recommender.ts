/**
 * Recommendation scoring: what should this learner do next, and why.
 *
 * Every recommendation carries a rationale string that is shown verbatim in
 * the UI. That is a product requirement, not a nicety — a learner who is told
 * "do this next" without being told why has no reason to trust the system, and
 * an adaptive engine whose reasoning cannot be inspected cannot be debugged.
 */

import {
  MASTERY_THRESHOLDS,
  PREREQUISITE_UNLOCK_THRESHOLD,
  RECOMMENDATION_KIND_BOOST,
  RECOMMENDATION_WEIGHTS,
  REVIEW_TRIGGER_RETRIEVABILITY,
} from './constants';
import type { DecayedKnowledge } from './types';

export type RecommendationKind =
  | 'NEXT_CONCEPT'
  | 'PREREQ_BRIDGE'
  | 'REVIEW_PROBE'
  | 'MISCONCEPTION_DRILL';

export interface RecommendationCandidate {
  conceptId: string;
  conceptTitle: string;
  /** Relevance of this concept to the active goal, 0-1. */
  goalWeight: number;
  /** Learner state, or undefined if never attempted. */
  knowledge?: DecayedKnowledge;
  /** Direct prerequisites not yet satisfied. */
  unmetPrerequisiteIds: readonly string[];
  /** Titles for those prerequisites, for the rationale text. */
  unmetPrerequisiteTitles?: readonly string[];
  /** Count of unresolved misconceptions attached to this concept. */
  openMisconceptions: number;
  /** True when this concept blocks something the goal needs. */
  blocksGoalProgress: boolean;
}

export interface ScoredRecommendation {
  conceptId: string;
  kind: RecommendationKind;
  score: number;
  rationale: string;
  components: {
    goalRelevance: number;
    readiness: number;
    gapSeverity: number;
    decayUrgency: number;
    misconceptionPressure: number;
  };
}

/** How ready the learner is to attempt this now. */
function readinessComponent(candidate: RecommendationCandidate): number {
  return candidate.unmetPrerequisiteIds.length === 0 ? 1 : 0;
}

/**
 * How far below mastery this concept sits, normalised.
 *
 * A never-attempted concept scores as a moderate gap rather than a maximal
 * one: an unknown is worth less attention than a *demonstrated* weakness.
 */
function gapSeverityComponent(candidate: RecommendationCandidate): number {
  const knowledge = candidate.knowledge;
  if (!knowledge || knowledge.attempts === 0) return 0.5;
  const shortfall = MASTERY_THRESHOLDS.MASTERED - knowledge.effectiveMastery;
  return Math.min(Math.max(shortfall / MASTERY_THRESHOLDS.MASTERED, 0), 1);
}

/**
 * How urgently a previously-known concept needs refreshing.
 *
 * Scores zero unless the learner actually knew it: you cannot forget something
 * you never learned, and treating unlearned concepts as urgent reviews would
 * flood the queue with noise.
 */
function decayUrgencyComponent(candidate: RecommendationCandidate): number {
  const knowledge = candidate.knowledge;
  if (!knowledge || knowledge.attempts === 0) return 0;
  if (knowledge.rawMastery < PREREQUISITE_UNLOCK_THRESHOLD) return 0;
  if (knowledge.retrievability >= REVIEW_TRIGGER_RETRIEVABILITY) return 0;
  return Math.min(
    Math.max(
      (REVIEW_TRIGGER_RETRIEVABILITY - knowledge.retrievability) / REVIEW_TRIGGER_RETRIEVABILITY,
      0,
    ),
    1,
  );
}

function misconceptionComponent(candidate: RecommendationCandidate): number {
  // Saturating rather than linear: three open misconceptions on one concept is
  // already maximal pressure, and ten should not swamp every other signal.
  return Math.min(candidate.openMisconceptions / 3, 1);
}

/** Classify what kind of activity this candidate implies. */
export function classifyKind(candidate: RecommendationCandidate): RecommendationKind {
  if (decayUrgencyComponent(candidate) > 0) return 'REVIEW_PROBE';
  if (candidate.openMisconceptions > 0 && candidate.unmetPrerequisiteIds.length === 0) {
    return 'MISCONCEPTION_DRILL';
  }
  if (candidate.blocksGoalProgress && candidate.unmetPrerequisiteIds.length === 0) {
    return 'PREREQ_BRIDGE';
  }
  return 'NEXT_CONCEPT';
}

function buildRationale(candidate: RecommendationCandidate, kind: RecommendationKind): string {
  const knowledge = candidate.knowledge;
  const percent = (value: number) => `${Math.round(value * 100)}%`;

  switch (kind) {
    case 'REVIEW_PROBE':
      return `You knew ${candidate.conceptTitle} at ${percent(knowledge?.rawMastery ?? 0)}, but recall has dropped to ${percent(knowledge?.retrievability ?? 0)}. A two-minute refresher now will keep it.`;

    case 'MISCONCEPTION_DRILL':
      return `Your answers on ${candidate.conceptTitle} show ${candidate.openMisconceptions} recurring ${candidate.openMisconceptions === 1 ? 'misconception' : 'misconceptions'}. A short targeted drill will clear ${candidate.openMisconceptions === 1 ? 'it' : 'them'}.`;

    case 'PREREQ_BRIDGE':
      return `${candidate.conceptTitle} is blocking later concepts on your path, and you are ready for it now.`;

    case 'NEXT_CONCEPT':
    default: {
      if (candidate.unmetPrerequisiteIds.length > 0) {
        const titles = candidate.unmetPrerequisiteTitles ?? candidate.unmetPrerequisiteIds;
        return `Next on your path, once you have covered ${titles.join(' and ')}.`;
      }
      if (knowledge && knowledge.attempts > 0) {
        return `You are at ${percent(knowledge.effectiveMastery)} on ${candidate.conceptTitle} and your prerequisites are solid — this is the most useful next step toward your goal.`;
      }
      return `Prerequisites met and ${candidate.conceptTitle} is next toward your goal.`;
    }
  }
}

/** Score one candidate. */
export function scoreCandidate(candidate: RecommendationCandidate): ScoredRecommendation {
  const components = {
    goalRelevance: Math.min(Math.max(candidate.goalWeight, 0), 1),
    readiness: readinessComponent(candidate),
    gapSeverity: gapSeverityComponent(candidate),
    decayUrgency: decayUrgencyComponent(candidate),
    misconceptionPressure: misconceptionComponent(candidate),
  };

  const base =
    components.goalRelevance * RECOMMENDATION_WEIGHTS.GOAL_RELEVANCE +
    components.readiness * RECOMMENDATION_WEIGHTS.READINESS +
    components.gapSeverity * RECOMMENDATION_WEIGHTS.GAP_SEVERITY +
    components.decayUrgency * RECOMMENDATION_WEIGHTS.DECAY_URGENCY +
    components.misconceptionPressure * RECOMMENDATION_WEIGHTS.MISCONCEPTION_PRESSURE;

  const kind = classifyKind(candidate);
  const score = Math.min(base * RECOMMENDATION_KIND_BOOST[kind], 1);

  return {
    conceptId: candidate.conceptId,
    kind,
    score,
    rationale: buildRationale(candidate, kind),
    components,
  };
}

/**
 * Rank candidates, best first.
 *
 * Concepts the learner has already mastered and can still retrieve are dropped
 * entirely — recommending them would waste the learner's time, which is the
 * one thing an adaptive system exists to protect.
 */
export function rankRecommendations(
  candidates: readonly RecommendationCandidate[],
  limit = 5,
): ScoredRecommendation[] {
  return candidates
    .filter((candidate) => {
      const knowledge = candidate.knowledge;
      if (!knowledge) return true;
      const settled =
        knowledge.band === 'MASTERED' && knowledge.retrievability >= REVIEW_TRIGGER_RETRIEVABILITY;
      return !settled;
    })
    .map(scoreCandidate)
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.conceptId < b.conceptId ? -1 : 1))
    .slice(0, limit);
}
