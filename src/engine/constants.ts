/**
 * Every threshold, weight, and tuning parameter the adaptive engine uses.
 *
 * Nothing in `src/engine` may contain a bare numeric literal with pedagogical
 * meaning — it belongs here, named, so behaviour is auditable and tunable in
 * one place.
 */

/** Mastery bands over *effective* mastery (raw BKT posterior x retrievability). */
export const MASTERY_THRESHOLDS = {
  /** At or above this, the concept counts as mastered. */
  MASTERED: 0.85,
  /** At or above this (but below MASTERED), the concept is fragile. */
  FRAGILE: 0.6,
  /** At or above this (but below FRAGILE), the learner is making progress. */
  IN_PROGRESS: 0.3,
} as const;

/**
 * A prerequisite is considered satisfied — and its dependent concept unlocked —
 * at this effective mastery. Deliberately below MASTERED: requiring mastery of
 * every prerequisite would stall learners on foundations they know well enough
 * to build on.
 */
export const PREREQUISITE_UNLOCK_THRESHOLD = 0.7;

/**
 * Ebbinghaus retrievability below which a concept is scheduled for a spaced
 * review probe (PRD FR-2.2).
 */
export const REVIEW_TRIGGER_RETRIEVABILITY = 0.7;

/** Memory stability (Ebbinghaus S, in days). */
export const STABILITY = {
  /** Stability of a freshly learned concept. */
  INITIAL_DAYS: 1,
  /** Multiplier applied on each successful recall. */
  GROWTH_FACTOR: 1.6,
  /** Additional growth per consecutive correct answer, capped by MAX_DAYS. */
  STREAK_BONUS: 0.4,
  /** Multiplier applied on a failed recall — forgetting is fast. */
  DECAY_FACTOR: 0.5,
  MIN_DAYS: 0.5,
  /** Ceiling so a long-dormant concept still eventually resurfaces. */
  MAX_DAYS: 180,
} as const;

/** Computerised Adaptive Testing stopping rule (PRD FR-1.1: 5-7 questions). */
export const CAT = {
  MIN_ITEMS: 5,
  MAX_ITEMS: 7,
  /** Stop early once the ability estimate is this precise. */
  TARGET_STANDARD_ERROR: 0.35,
} as const;

/** Item Response Theory estimation grid. */
export const IRT = {
  /** Ability scale bounds; +/-3 logits covers essentially all learners. */
  THETA_MIN: -3,
  THETA_MAX: 3,
  /** Quadrature points for Expected A Posteriori estimation. */
  GRID_POINTS: 61,
  /** Standard deviation of the N(0, sigma) ability prior. */
  PRIOR_SD: 1,
  /** Guards against division by zero in the information function. */
  EPSILON: 1e-9,
} as const;

/**
 * Zone of Proximal Development targeting (PRD FR-4.2): select items the learner
 * has roughly a 70% chance of answering correctly, keeping the observed failure
 * rate in the 25-35% band.
 */
export const ZPD = {
  TARGET_SUCCESS_PROBABILITY: 0.7,
  ACCEPTABLE_MIN: 0.6,
  ACCEPTABLE_MAX: 0.8,
} as const;

/**
 * Recommendation scoring weights. They sum to 1 so a score is directly
 * interpretable as a 0-1 priority.
 */
export const RECOMMENDATION_WEIGHTS = {
  /** How relevant the concept is to the learner's stated goal. */
  GOAL_RELEVANCE: 0.3,
  /** Whether prerequisites are met — an unready concept is a bad suggestion. */
  READINESS: 0.25,
  /** How far below mastery the concept sits. */
  GAP_SEVERITY: 0.2,
  /** How urgently a known concept needs refreshing before it decays away. */
  DECAY_URGENCY: 0.15,
  /** Pressure from unresolved misconceptions attached to the concept. */
  MISCONCEPTION_PRESSURE: 0.1,
} as const;

/** Relative priority multipliers by recommendation kind. */
export const RECOMMENDATION_KIND_BOOST = {
  /** A blocking gap is the most valuable thing a learner can fix. */
  PREREQ_BRIDGE: 1.25,
  MISCONCEPTION_DRILL: 1.15,
  REVIEW_PROBE: 1.1,
  NEXT_CONCEPT: 1.0,
} as const;

/** Socratic scaffolding ladder (PRD FR-5.2). */
export const SCAFFOLDING = {
  MIN_LEVEL: 1,
  MAX_LEVEL: 4,
  /** Consecutive failed hints before routing to a prerequisite bridge lesson. */
  FAILURES_BEFORE_BRIDGE: 3,
} as const;

/** Frustration signal used to soften Socratic friction (PRD §11). */
export const FRUSTRATION = {
  /** Added per consecutive incorrect answer. */
  INCREMENT_PER_FAILURE: 0.15,
  /** Added when the learner climbs to the top of the hint ladder. */
  INCREMENT_PER_MAX_HINT: 0.2,
  /** Removed on a correct answer. */
  DECREMENT_PER_SUCCESS: 0.25,
  /** Above this, the tutor drops Socratic indirection for direct guidance. */
  DIRECT_GUIDANCE_THRESHOLD: 0.6,
  MIN: 0,
  MAX: 1,
} as const;

/** Knowledge-graph layout geometry (see src/engine/layout.ts). */
export const LAYOUT = {
  RANK_SPACING_Y: 160,
  NODE_SPACING_X: 220,
  /** Barycentre ordering sweeps; more sweeps means fewer edge crossings. */
  ORDERING_SWEEPS: 4,
} as const;
