/**
 * Engine-local types.
 *
 * These are deliberately independent of Prisma models: `src/engine` is a pure
 * computational core with no database awareness, so it can be unit-tested
 * without a connection and swapped behind its interfaces (see the
 * `KnowledgeTracer` port, which is what a future DKT implementation would
 * satisfy).
 */

/** Item Response Theory parameters for a single item (3PL). */
export interface ItemParameters {
  /** Difficulty (b): the ability at which success probability is halfway up. */
  difficulty: number;
  /** Discrimination (a): how sharply the item separates ability levels. */
  discrimination: number;
  /** Guessing (c): the floor probability for a learner of very low ability. */
  guessing: number;
}

/** A candidate question during adaptive item selection. */
export interface CandidateItem extends ItemParameters {
  id: string;
  conceptId: string;
}

/** One graded response in a scored sequence. */
export interface ScoredResponse {
  item: ItemParameters;
  correct: boolean;
}

/** Outcome of an ability estimation. */
export interface AbilityEstimate {
  /** Expected A Posteriori ability estimate, in logits. */
  theta: number;
  /** Posterior standard deviation — the precision of the estimate. */
  standardError: number;
}

/** Bayesian Knowledge Tracing parameters for a concept. */
export interface BktParameters {
  /** P(L0): probability of mastery before any evidence. */
  pInit: number;
  /** P(T): probability of transitioning to mastery after an opportunity. */
  pTransit: number;
  /** P(S): probability of answering incorrectly despite mastery. */
  pSlip: number;
  /** P(G): probability of answering correctly without mastery. */
  pGuess: number;
}

export type MasteryBand = 'NOT_STARTED' | 'GAP' | 'IN_PROGRESS' | 'FRAGILE' | 'MASTERED';

/** A learner's state for one concept, as the engine sees it. */
export interface ConceptKnowledge {
  conceptId: string;
  /** Raw BKT posterior, before forgetting is applied. */
  rawMastery: number;
  /** Memory stability S, in days. */
  stabilityDays: number;
  /** When the learner last interacted; null if never. */
  lastInteractionAt: Date | null;
  attempts: number;
  correct: number;
}

/** A concept's state after decay has been applied at read time. */
export interface DecayedKnowledge extends ConceptKnowledge {
  /** Ebbinghaus retrievability R(t) in [0, 1]. */
  retrievability: number;
  /** rawMastery x retrievability — what the learner is shown. */
  effectiveMastery: number;
  band: MasteryBand;
}

/** A directed prerequisite edge in the concept graph. */
export interface GraphEdge {
  prerequisiteId: string;
  conceptId: string;
  strength: number;
}

/** Minimal concept shape the graph algorithms need. */
export interface GraphNode {
  id: string;
}

/**
 * The port a knowledge-tracing implementation satisfies. BKT is the shipped
 * implementation (see DAR D5); a neural tracer would implement this same
 * contract without any caller changing.
 */
export interface KnowledgeTracer {
  /** Mastery before any evidence has been observed. */
  initial(params: BktParameters): number;
  /** Fold one graded response into the current mastery estimate. */
  update(currentMastery: number, correct: boolean, params: BktParameters): number;
}
