/**
 * Curriculum: the concept graph.
 *
 * Authored, not generated. Every concept carries real prerequisites, real IRT
 * difficulty, and real BKT parameters, because the adaptive engine reads these
 * directly — placeholder values here would produce a system that adapts to
 * nothing.
 *
 * `difficultyB` is on the IRT logit scale: -2 is trivial for an average
 * learner, 0 is average, +2 is hard. `pSlip` is the chance of getting it wrong
 * despite knowing it (higher for fiddly, error-prone topics), `pGuess` the
 * chance of getting it right without knowing (higher for multiple choice with
 * few plausible distractors).
 */

export interface ConceptSeed {
  slug: string;
  title: string;
  summary: string;
  difficultyB: number;
  discriminationA: number;
  pInit: number;
  pTransit: number;
  pSlip: number;
  pGuess: number;
  estimatedMinutes: number;
  /** Slugs of concepts that must come first. */
  prerequisites: string[];
}

export const DOMAIN = {
  slug: 'cs-and-ai',
  title: 'Computer Science & AI Foundations',
  summary:
    'Programming foundations, the mathematics behind machine learning, and the core ideas of modern ML.',
};

export const CONCEPTS: ConceptSeed[] = [
  // --- Programming foundations ---------------------------------------------
  {
    slug: 'variables-and-types',
    title: 'Variables & Types',
    summary: 'How values are named, stored, and constrained by type.',
    difficultyB: -2.0,
    discriminationA: 1.0,
    pInit: 0.55,
    pTransit: 0.35,
    pSlip: 0.06,
    pGuess: 0.25,
    estimatedMinutes: 8,
    prerequisites: [],
  },
  {
    slug: 'control-flow',
    title: 'Control Flow',
    summary: 'Branching and looping: how a program decides what to do next.',
    difficultyB: -1.5,
    discriminationA: 1.1,
    pInit: 0.45,
    pTransit: 0.3,
    pSlip: 0.08,
    pGuess: 0.25,
    estimatedMinutes: 10,
    prerequisites: ['variables-and-types'],
  },
  {
    slug: 'functions',
    title: 'Functions',
    summary: 'Packaging behaviour behind a name, with inputs and a return value.',
    difficultyB: -1.0,
    discriminationA: 1.2,
    pInit: 0.4,
    pTransit: 0.28,
    pSlip: 0.08,
    pGuess: 0.25,
    estimatedMinutes: 12,
    prerequisites: ['control-flow'],
  },
  {
    slug: 'references-and-mutability',
    title: 'References & Mutability',
    summary:
      'Why changing a value inside a function sometimes affects the caller and sometimes does not.',
    difficultyB: 0.4,
    discriminationA: 1.5,
    pInit: 0.18,
    pTransit: 0.2,
    // Notoriously slip-prone: learners often understand the rule but misapply
    // it under time pressure.
    pSlip: 0.18,
    pGuess: 0.25,
    estimatedMinutes: 16,
    prerequisites: ['functions'],
  },
  {
    slug: 'recursion',
    title: 'Recursion',
    summary: 'Solving a problem by expressing it in terms of a smaller version of itself.',
    difficultyB: 0.3,
    discriminationA: 1.4,
    pInit: 0.2,
    pTransit: 0.22,
    pSlip: 0.12,
    pGuess: 0.25,
    estimatedMinutes: 18,
    prerequisites: ['functions'],
  },
  {
    slug: 'arrays',
    title: 'Arrays',
    summary: 'Contiguous indexed storage, and the costs that follow from that layout.',
    difficultyB: -1.2,
    discriminationA: 1.1,
    pInit: 0.42,
    pTransit: 0.3,
    pSlip: 0.08,
    pGuess: 0.25,
    estimatedMinutes: 10,
    prerequisites: ['variables-and-types'],
  },
  {
    slug: 'big-o-notation',
    title: 'Big-O Notation',
    summary: 'Describing how running time grows with input size, ignoring constants.',
    difficultyB: 0.0,
    discriminationA: 1.3,
    pInit: 0.25,
    pTransit: 0.25,
    pSlip: 0.1,
    pGuess: 0.25,
    estimatedMinutes: 14,
    prerequisites: ['control-flow', 'arrays'],
  },
  {
    slug: 'linked-lists',
    title: 'Linked Lists',
    summary: 'Nodes joined by references, trading random access for cheap insertion.',
    difficultyB: 0.2,
    discriminationA: 1.3,
    pInit: 0.22,
    pTransit: 0.25,
    pSlip: 0.1,
    pGuess: 0.25,
    estimatedMinutes: 14,
    prerequisites: ['references-and-mutability', 'arrays'],
  },
  {
    slug: 'stacks-and-queues',
    title: 'Stacks & Queues',
    summary: 'Two disciplined access patterns — last-in-first-out and first-in-first-out.',
    difficultyB: -0.4,
    discriminationA: 1.2,
    pInit: 0.3,
    pTransit: 0.28,
    pSlip: 0.08,
    pGuess: 0.25,
    estimatedMinutes: 12,
    prerequisites: ['arrays', 'linked-lists'],
  },
  {
    slug: 'trees',
    title: 'Trees',
    summary: 'Hierarchical structures with a root, branches, and no cycles.',
    difficultyB: 0.5,
    discriminationA: 1.3,
    pInit: 0.2,
    pTransit: 0.22,
    pSlip: 0.1,
    pGuess: 0.25,
    estimatedMinutes: 16,
    prerequisites: ['recursion', 'linked-lists'],
  },
  {
    slug: 'hash-tables',
    title: 'Hash Tables',
    summary: 'Constant-time average lookup by turning a key into an index.',
    difficultyB: 0.6,
    discriminationA: 1.4,
    pInit: 0.18,
    pTransit: 0.22,
    pSlip: 0.1,
    pGuess: 0.25,
    estimatedMinutes: 16,
    prerequisites: ['arrays', 'big-o-notation'],
  },
  {
    slug: 'sorting-algorithms',
    title: 'Sorting Algorithms',
    summary: 'Comparison sorts, their costs, and why O(n log n) is the floor.',
    difficultyB: 0.7,
    discriminationA: 1.3,
    pInit: 0.16,
    pTransit: 0.2,
    pSlip: 0.1,
    pGuess: 0.25,
    estimatedMinutes: 20,
    prerequisites: ['arrays', 'big-o-notation', 'recursion'],
  },

  // --- Mathematics for machine learning ------------------------------------
  {
    slug: 'vectors',
    title: 'Vectors',
    summary: 'Ordered lists of numbers with geometric meaning: direction and magnitude.',
    difficultyB: -0.8,
    discriminationA: 1.2,
    pInit: 0.35,
    pTransit: 0.28,
    pSlip: 0.08,
    pGuess: 0.25,
    estimatedMinutes: 12,
    prerequisites: ['variables-and-types'],
  },
  {
    slug: 'matrices',
    title: 'Matrices',
    summary: 'Rectangular arrays of numbers representing linear transformations.',
    difficultyB: -0.2,
    discriminationA: 1.2,
    pInit: 0.28,
    pTransit: 0.26,
    pSlip: 0.09,
    pGuess: 0.25,
    estimatedMinutes: 14,
    prerequisites: ['vectors'],
  },
  {
    slug: 'matrix-multiplication',
    title: 'Matrix Multiplication',
    summary: 'Composing transformations, and why dimensions must line up.',
    difficultyB: 0.5,
    discriminationA: 1.4,
    pInit: 0.2,
    pTransit: 0.24,
    // Dimension mistakes are the classic slip: the concept is understood, the
    // arithmetic goes wrong.
    pSlip: 0.15,
    pGuess: 0.25,
    estimatedMinutes: 18,
    prerequisites: ['matrices'],
  },
  {
    slug: 'derivatives',
    title: 'Derivatives',
    summary: 'Instantaneous rate of change: how fast a function moves at a point.',
    difficultyB: 0.3,
    discriminationA: 1.3,
    pInit: 0.25,
    pTransit: 0.24,
    pSlip: 0.1,
    pGuess: 0.25,
    estimatedMinutes: 18,
    prerequisites: ['functions'],
  },
  {
    slug: 'partial-derivatives',
    title: 'Partial Derivatives',
    summary: 'Rate of change with respect to one variable, holding the others fixed.',
    difficultyB: 0.8,
    discriminationA: 1.4,
    pInit: 0.15,
    pTransit: 0.2,
    pSlip: 0.12,
    pGuess: 0.25,
    estimatedMinutes: 20,
    prerequisites: ['derivatives', 'vectors'],
  },
  {
    slug: 'gradients',
    title: 'Gradients',
    summary: 'The vector of partial derivatives — the direction of steepest ascent.',
    difficultyB: 1.0,
    discriminationA: 1.5,
    pInit: 0.12,
    pTransit: 0.2,
    pSlip: 0.12,
    pGuess: 0.25,
    estimatedMinutes: 20,
    prerequisites: ['partial-derivatives'],
  },
  {
    slug: 'probability-basics',
    title: 'Probability Basics',
    summary: 'Events, independence, and conditional probability.',
    difficultyB: -0.3,
    discriminationA: 1.2,
    pInit: 0.3,
    pTransit: 0.26,
    pSlip: 0.1,
    pGuess: 0.25,
    estimatedMinutes: 16,
    prerequisites: ['variables-and-types'],
  },
  {
    slug: 'distributions',
    title: 'Probability Distributions',
    summary: 'How probability mass or density is spread across possible outcomes.',
    difficultyB: 0.4,
    discriminationA: 1.3,
    pInit: 0.2,
    pTransit: 0.22,
    pSlip: 0.1,
    pGuess: 0.25,
    estimatedMinutes: 18,
    prerequisites: ['probability-basics'],
  },
  {
    slug: 'expectation-and-variance',
    title: 'Expectation & Variance',
    summary: 'The centre of a distribution and how far it typically spreads.',
    difficultyB: 0.6,
    discriminationA: 1.3,
    pInit: 0.18,
    pTransit: 0.22,
    pSlip: 0.1,
    pGuess: 0.25,
    estimatedMinutes: 18,
    prerequisites: ['distributions'],
  },

  // --- Machine learning ----------------------------------------------------
  {
    slug: 'linear-regression',
    title: 'Linear Regression',
    summary: 'Fitting a straight-line relationship by minimising squared error.',
    difficultyB: 0.7,
    discriminationA: 1.4,
    pInit: 0.15,
    pTransit: 0.22,
    pSlip: 0.1,
    pGuess: 0.25,
    estimatedMinutes: 22,
    prerequisites: ['matrix-multiplication', 'expectation-and-variance'],
  },
  {
    slug: 'gradient-descent',
    title: 'Gradient Descent',
    summary: 'Iteratively stepping downhill along the gradient to minimise a loss.',
    difficultyB: 1.1,
    discriminationA: 1.5,
    pInit: 0.12,
    pTransit: 0.2,
    pSlip: 0.11,
    pGuess: 0.25,
    estimatedMinutes: 22,
    prerequisites: ['gradients', 'linear-regression'],
  },
  {
    slug: 'overfitting-and-regularisation',
    title: 'Overfitting & Regularisation',
    summary: 'Why a model that fits training data perfectly can still be useless.',
    difficultyB: 1.0,
    discriminationA: 1.4,
    pInit: 0.14,
    pTransit: 0.2,
    pSlip: 0.1,
    pGuess: 0.25,
    estimatedMinutes: 20,
    prerequisites: ['linear-regression', 'expectation-and-variance'],
  },
  {
    slug: 'neural-networks',
    title: 'Neural Networks',
    summary: 'Layers of linear transformations separated by non-linearities.',
    difficultyB: 1.3,
    discriminationA: 1.5,
    pInit: 0.1,
    pTransit: 0.18,
    pSlip: 0.1,
    pGuess: 0.25,
    estimatedMinutes: 26,
    prerequisites: ['gradient-descent', 'matrix-multiplication'],
  },
  {
    slug: 'backpropagation',
    title: 'Backpropagation',
    summary: 'Applying the chain rule backwards through a network to get every gradient.',
    difficultyB: 1.6,
    discriminationA: 1.6,
    pInit: 0.08,
    pTransit: 0.18,
    pSlip: 0.12,
    pGuess: 0.25,
    estimatedMinutes: 28,
    prerequisites: ['neural-networks', 'partial-derivatives'],
  },
];

export interface GoalSeed {
  slug: string;
  title: string;
  description: string;
  /** Terminal concepts; the engine derives the full path from prerequisites. */
  targets: Array<{ slug: string; weight: number }>;
}

export const GOALS: GoalSeed[] = [
  {
    slug: 'ml-engineer',
    title: 'Become a Machine Learning Engineer',
    description:
      'Build the mathematical grounding and ML fundamentals needed to train and reason about models — from vectors through backpropagation.',
    targets: [
      { slug: 'backpropagation', weight: 1.0 },
      { slug: 'overfitting-and-regularisation', weight: 0.9 },
      { slug: 'gradient-descent', weight: 0.85 },
    ],
  },
  {
    slug: 'data-structures',
    title: 'Master Data Structures & Algorithms',
    description:
      'Work up from arrays and recursion to trees, hash tables, and sorting — the toolkit technical interviews and systems work both assume.',
    targets: [
      { slug: 'sorting-algorithms', weight: 1.0 },
      { slug: 'hash-tables', weight: 0.9 },
      { slug: 'trees', weight: 0.9 },
      { slug: 'stacks-and-queues', weight: 0.7 },
    ],
  },
];
