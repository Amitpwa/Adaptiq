import type { PrismaClient } from '../../../src/generated/prisma/client';

import { MATH_CONTENT } from './content-math';
import type { ConceptContent } from './content-types';

/**
 * Learning content, assessment items, misconceptions, and the deterministic
 * Socratic hint ladder.
 *
 * All authored. The hint ladders in particular are not decoration: they are
 * what the tutor serves when no language model is available, so they must
 * stand on their own as teaching.
 *
 * Ladder contract (PRD FR-5.2), and none of the four may give the answer:
 *   1. a clarifying question that redirects attention
 *   2. a conceptual reminder naming the relevant rule
 *   3. an isomorphic worked example with different values
 *   4. a step-by-step walkthrough of that parallel problem
 */

const CORE_CONTENT: ConceptContent[] = [
  // -------------------------------------------------------------------------
  {
    concept: 'variables-and-types',
    lenses: [
      {
        lens: 'ANALOGY',
        body: 'A variable is a labelled box. The label is the name you use to find it again; the type is a rule about what shape of thing is allowed inside. Put a number in a box labelled "count" and the label tells you what it means; the type stops you accidentally storing a photograph there.',
      },
      {
        lens: 'FIRST_PRINCIPLES',
        body: 'A variable binds a name to a storage location. A type is a set of values together with the operations valid on them. Type checking is the guarantee that no operation is ever applied to a value outside its domain — statically, before the program runs, or dynamically, at the moment of use.',
      },
    ],
    questions: [
      {
        type: 'MCQ',
        stem: 'A language checks types while the program is running rather than before it starts. What is this called?',
        difficultyB: -1.8,
        discriminationA: 1.0,
        explanation:
          'Dynamic typing defers type checking to runtime, so a type error surfaces only when that line actually executes. Static typing checks before execution, catching those errors earlier but requiring more up-front declaration.',
        options: [
          { label: 'Dynamic typing', correct: true },
          { label: 'Static typing' },
          { label: 'Strong typing' },
          { label: 'Weak typing' },
        ],
        hints: [
          'When does the check happen in each case — before the program runs, or as it runs?',
          'Two separate axes are in play here. One is *when* checking happens (static vs dynamic); the other is *how strictly* types convert (strong vs weak). This question asks about timing.',
          'Consider a simpler pair: a bouncer who checks IDs at the door before anyone enters, versus one who checks only when someone orders a drink. Which is analogous to checking as the program runs?',
          'Work it through: the door check happens before entry — nothing invalid gets in at all. That is the "before it starts" case. The drink-order check happens during the evening, at the moment it matters. Map that second one onto program execution: the check happens while running. Now name the typing discipline that matches.',
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    concept: 'references-and-mutability',
    lenses: [
      {
        lens: 'ANALOGY',
        body: 'Passing a reference is like giving someone your home address. They can go there and rearrange the furniture, and you will see the change. Reassigning the variable is like writing a different address on your own copy of the note — where you now point has changed, but the original house is untouched.',
      },
      {
        lens: 'FIRST_PRINCIPLES',
        body: 'Assignment binds a name to a reference. Mutation alters the object that reference points to. A function receives a copy of the reference, not a copy of the object: mutating through it is visible to the caller, but rebinding the parameter only changes the local binding.',
      },
    ],
    misconceptions: [
      {
        code: 'PASS_BY_VALUE_CONFUSION',
        label: 'Confusing rebinding with mutation',
        description:
          'The learner believes reassigning a parameter inside a function changes the caller\'s variable, conflating "the reference was copied" with "the object was copied".',
        remediationHint:
          'Separate two questions: did the object change, or did the name start pointing somewhere else?',
      },
      {
        code: 'DEEP_COPY_ASSUMPTION',
        label: 'Assuming arguments are deep-copied',
        description:
          'The learner assumes passing an object to a function copies its contents, so mutations inside cannot be seen outside.',
        remediationHint:
          'Ask what is actually copied at the call: the object itself, or the arrow pointing to it?',
      },
    ],
    questions: [
      {
        type: 'OUTPUT_PREDICTION',
        stem: 'A function receives a list and runs `items.append(4)`, then `items = [9, 9]`. The caller passed `nums = [1, 2, 3]`. After the call, what is `nums`?',
        difficultyB: 0.5,
        discriminationA: 1.6,
        canonicalAnswer: '[1, 2, 3, 4]',
        explanation:
          'The append mutates the object the caller still holds, so 4 is added. The reassignment only rebinds the local parameter name to a new list; the caller\'s variable still points at the original object, which is now [1, 2, 3, 4].',
        options: [
          { label: '[1, 2, 3, 4]', correct: true },
          { label: '[9, 9]', misconception: 'PASS_BY_VALUE_CONFUSION' },
          { label: '[1, 2, 3]', misconception: 'DEEP_COPY_ASSUMPTION' },
          { label: '[1, 2, 3, 4, 9, 9]' },
        ],
        hints: [
          'Two different things happen in that function. Does each one change the object, or change what the name points to?',
          'The rule: a function receives a copy of the reference, not a copy of the object. Mutating through the reference is visible outside; rebinding the parameter name is not.',
          'Parallel case: you and a friend both have the address of the same warehouse. Your friend adds a crate to it, then writes a different address on their own notepad. What does the warehouse contain, and does your address still point to it?',
          'Step by step on the warehouse: (1) both notepads read "Warehouse A". (2) Your friend adds a crate — Warehouse A now holds its original contents plus one crate. (3) Your friend scribbles "Warehouse B" on their notepad; yours still reads "Warehouse A". (4) You visit your address and see the original contents plus the crate. Now map crates onto list items and run the same four steps on the code.',
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    concept: 'recursion',
    lenses: [
      {
        lens: 'ANALOGY',
        body: 'Standing in a queue and wanting to know your position: ask the person ahead of you for theirs and add one. They do the same. The person at the front answers "I am first" without asking anyone — that is the base case, and without it the question travels forever.',
      },
      {
        lens: 'FIRST_PRINCIPLES',
        body: 'A recursive function is defined in terms of itself on strictly smaller input. Correctness needs two things: a base case that terminates without recursing, and a recursive case that provably moves toward it. This is induction — the base case is the anchor, the recursive case the inductive step.',
      },
    ],
    misconceptions: [
      {
        code: 'MISSING_BASE_CASE',
        label: 'Recursive case without a terminating base',
        description:
          'The learner writes the self-referential step but no condition that stops it, producing infinite recursion.',
        remediationHint: 'Ask: what input is small enough to answer immediately, with no further call?',
      },
    ],
    questions: [
      {
        type: 'MCQ',
        stem: 'A recursive function calls itself on a smaller input every time but has no condition that returns without recursing. What happens?',
        difficultyB: 0.1,
        discriminationA: 1.4,
        explanation:
          'Without a base case each call adds a frame to the call stack and never removes one, so the stack grows until it overflows. Shrinking the input is not enough on its own — something must stop the descent.',
        options: [
          { label: 'It recurses until the call stack overflows', correct: true },
          { label: 'It returns null once the input reaches zero', misconception: 'MISSING_BASE_CASE' },
          { label: 'It stops automatically when the input cannot shrink further', misconception: 'MISSING_BASE_CASE' },
          { label: 'The compiler rejects it before it runs' },
        ],
        hints: [
          'What has to be true for a recursive call to stop, rather than make another call?',
          'Every recursive definition needs two parts: a case that recurses and a case that does not. Ask what happens to the call stack when the second is missing.',
          'Parallel: counting down from 10 by asking "what is one less?" each time, but never agreeing to stop at zero. What happens at zero, and at minus one?',
          'Walk it: at 10 you ask about 9, at 9 about 8, down to 0. At 0, with no rule saying "stop here", you ask about -1, then -2. Each question is still waiting on its answer, so none can resolve — the pile of unanswered questions grows without limit. Now name what that pile is in a running program.',
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    concept: 'big-o-notation',
    lenses: [
      {
        lens: 'ANALOGY',
        body: 'Big-O is a description of how a queue behaves as it gets longer, not how fast the cashier is today. Doubling the queue and doubling the wait is linear; doubling the queue and barely changing the wait is logarithmic. The cashier\'s speed is a constant, and constants are exactly what Big-O throws away.',
      },
      {
        lens: 'FIRST_PRINCIPLES',
        body: 'f(n) = O(g(n)) when there exist constants c > 0 and n₀ such that f(n) ≤ c·g(n) for all n ≥ n₀. It is an asymptotic upper bound: it describes growth for large n and deliberately discards constant factors and lower-order terms.',
      },
    ],
    misconceptions: [
      {
        code: 'CONSTANT_FACTOR_CONFUSION',
        label: 'Treating constants as significant',
        description:
          'The learner reports O(2n) or O(n + 5), not recognising that constant factors and lower-order terms vanish in asymptotic notation.',
        remediationHint: 'Ask what happens to the ratio between 2n and n as n grows very large.',
      },
      {
        code: 'NESTED_LOOP_ADDITION',
        label: 'Adding nested loop costs instead of multiplying',
        description:
          'The learner treats a loop inside a loop as n + n rather than n × n, confusing sequential with nested execution.',
        remediationHint:
          'Ask how many times the inner body runs *per single* iteration of the outer loop.',
      },
    ],
    questions: [
      {
        type: 'MCQ',
        stem: 'A loop over n items contains another loop over the same n items. What is the time complexity?',
        difficultyB: -0.2,
        discriminationA: 1.3,
        explanation:
          'The inner loop runs n times for each of the outer loop\'s n iterations, so the body executes n × n = n² times. Nesting multiplies; sequencing adds.',
        options: [
          { label: 'O(n²)', correct: true },
          { label: 'O(2n)', misconception: 'NESTED_LOOP_ADDITION' },
          { label: 'O(n log n)' },
          { label: 'O(n)', misconception: 'NESTED_LOOP_ADDITION' },
        ],
        hints: [
          'For one single pass of the outer loop, how many times does the inner loop body run?',
          'Nested loops multiply their counts; loops placed one after another add. Which structure is this?',
          'Parallel: a hotel with 5 floors and 5 rooms per floor. To visit every room you walk each floor, and on each floor you enter every room. How many rooms do you enter?',
          'Count it out: on floor 1 you enter 5 rooms, on floor 2 another 5, and so on for all 5 floors — 5 + 5 + 5 + 5 + 5 = 25, which is 5 × 5. The per-floor count multiplied by the number of floors. Now replace 5 with n and write the growth.',
        ],
      },
      {
        type: 'MCQ',
        stem: 'An algorithm performs exactly 3n + 100 operations on input of size n. What is its Big-O complexity?',
        difficultyB: 0.2,
        discriminationA: 1.4,
        explanation:
          'Constant factors (the 3) and lower-order terms (the 100) are discarded, leaving O(n). At n = 1,000,000 the 100 is negligible and the 3 does not change the shape of the growth.',
        options: [
          { label: 'O(n)', correct: true },
          { label: 'O(3n + 100)', misconception: 'CONSTANT_FACTOR_CONFUSION' },
          { label: 'O(3n)', misconception: 'CONSTANT_FACTOR_CONFUSION' },
          { label: 'O(100n)', misconception: 'CONSTANT_FACTOR_CONFUSION' },
        ],
        hints: [
          'What happens to the relative importance of the "+ 100" when n is a million?',
          'Big-O describes the *shape* of growth as n grows without bound. Constant multipliers and additive constants do not change that shape.',
          'Parallel: 7n + 2000 operations. At n = 10 the 2000 dominates completely; at n = 10,000,000 it is a rounding error. Which term decides the shape?',
          'Work the numbers: at n = 10, 7n + 2000 = 2070 and the constant dominates. At n = 1,000,000 it is 9,000,000 — the 2000 contributes 0.02%. Double n and the total roughly doubles, which is the signature of linear growth. The 7 scales it but does not bend it. Now apply the same reasoning to 3n + 100.',
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    concept: 'vectors',
    lenses: [
      {
        lens: 'ANALOGY',
        body: 'A vector is an instruction for a journey: "3 steps east, 4 steps north". It has a direction and a length, and it does not care where you started. Two journeys with the same instructions are the same vector even if they begin in different places.',
      },
      {
        lens: 'FIRST_PRINCIPLES',
        body: 'A vector is an element of a vector space: a set closed under addition and scalar multiplication satisfying the eight vector-space axioms. In ℝⁿ it is written as an ordered n-tuple, with magnitude ‖v‖ = √(Σvᵢ²).',
      },
    ],
    questions: [
      {
        type: 'SHORT',
        stem: 'What is the magnitude (length) of the vector [3, 4]?',
        difficultyB: -0.9,
        discriminationA: 1.2,
        guessC: 0.05,
        canonicalAnswer: '5',
        explanation:
          'Magnitude is √(3² + 4²) = √(9 + 16) = √25 = 5. This is the Pythagorean theorem: the vector is the hypotenuse of a right triangle with legs 3 and 4.',
        hints: [
          'If you walk 3 east then 4 north, how far are you from where you started — in a straight line?',
          'Magnitude in ℝⁿ is the square root of the sum of the squared components. Geometrically this is the Pythagorean theorem.',
          'Parallel: the vector [6, 8]. Square each component, add them, take the square root.',
          'Step by step on [6, 8]: 6² = 36, 8² = 64, sum = 100, √100 = 10. Four steps — square, square, add, root. Now run exactly those four steps on [3, 4].',
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    concept: 'matrix-multiplication',
    lenses: [
      {
        lens: 'ANALOGY',
        body: 'Multiplying matrices is chaining two machines. The first takes 3 inputs and emits 4 outputs; the second must accept exactly 4 inputs or the pipes do not connect. That is the whole dimension rule: the output count of the first must equal the input count of the second.',
      },
      {
        lens: 'FIRST_PRINCIPLES',
        body: 'For A (m×n) and B (n×p), the product AB is m×p with (AB)ᵢⱼ = Σₖ AᵢₖBₖⱼ. The inner dimensions must match because each entry is a dot product of a row of A with a column of B, and those must have equal length. Matrix multiplication is composition of linear maps, which is why it is associative but not commutative.',
      },
    ],
    misconceptions: [
      {
        code: 'DIMENSION_MISMATCH',
        label: 'Mixing up which dimensions must agree',
        description:
          'The learner checks the outer dimensions rather than the inner ones, or takes the result shape from the wrong pair.',
        remediationHint:
          'Write the shapes side by side as (m×n)(n×p): the touching pair must match, the outer pair is the result.',
      },
      {
        code: 'ASSUMES_COMMUTATIVE',
        label: 'Assuming AB = BA',
        description:
          'The learner carries commutativity over from scalar arithmetic; for matrices BA may have a different shape or not exist at all.',
        remediationHint: 'Try both orders on a 2×3 and a 3×2 and compare the resulting shapes.',
      },
    ],
    questions: [
      {
        type: 'MCQ',
        stem: 'Matrix A is 3×4 and matrix B is 4×2. What is the shape of AB?',
        difficultyB: 0.3,
        discriminationA: 1.5,
        explanation:
          'The inner dimensions (4 and 4) match, so the product is defined. The result takes the outer dimensions: 3×2.',
        options: [
          { label: '3×2', correct: true },
          { label: '4×4', misconception: 'DIMENSION_MISMATCH' },
          { label: '2×3', misconception: 'DIMENSION_MISMATCH' },
          { label: 'Undefined — the shapes are incompatible', misconception: 'DIMENSION_MISMATCH' },
        ],
        hints: [
          'Write the two shapes next to each other as (3×4)(4×2). Which numbers are touching in the middle?',
          'The rule: the inner dimensions must be equal for the product to exist, and the result takes the two outer dimensions.',
          'Parallel: a 5×7 matrix times a 7×3 matrix. Identify the inner pair, confirm they match, then read off the outer pair.',
          'Work it: write (5×7)(7×3). The touching numbers are 7 and 7 — equal, so the product exists. The outer numbers are 5 and 3, so the result is 5×3. Three steps: write the shapes adjacent, check the inner pair, read the outer pair. Apply them to (3×4)(4×2).',
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    concept: 'gradients',
    lenses: [
      {
        lens: 'ANALOGY',
        body: 'Standing on a hillside in fog, you feel the slope under each foot — one for east-west, one for north-south. Combine those two readings and you get an arrow pointing straight uphill, steepest first. That arrow is the gradient. To descend, walk the opposite way.',
      },
      {
        lens: 'FIRST_PRINCIPLES',
        body: '∇f = [∂f/∂x₁, …, ∂f/∂xₙ]. The gradient is the vector of partial derivatives; it points in the direction of steepest ascent, and its magnitude is the rate of increase in that direction. It is perpendicular to the level sets of f.',
      },
    ],
    misconceptions: [
      {
        code: 'GRADIENT_SIGN_ERROR',
        label: 'Descending along the gradient rather than against it',
        description:
          'The learner steps in the direction of ∇f when minimising, which climbs the loss instead of reducing it.',
        remediationHint:
          'The gradient points *uphill*. To minimise, you move opposite to it — hence the minus sign in the update rule.',
      },
    ],
    questions: [
      {
        type: 'MCQ',
        stem: 'You are minimising a loss function. In which direction should you step, relative to the gradient?',
        difficultyB: 0.9,
        discriminationA: 1.6,
        explanation:
          'The gradient points in the direction of steepest *ascent*. To reduce the loss you step in the opposite direction, which is why the update rule is θ ← θ − α∇f rather than θ ← θ + α∇f.',
        options: [
          { label: 'Opposite to the gradient', correct: true },
          { label: 'Along the gradient', misconception: 'GRADIENT_SIGN_ERROR' },
          { label: 'Perpendicular to the gradient' },
          { label: 'The direction does not matter if the step size is small enough', misconception: 'GRADIENT_SIGN_ERROR' },
        ],
        hints: [
          'The gradient points uphill or downhill — which one? And are you trying to go up or down?',
          'The gradient is the direction of steepest ascent. Minimising means decreasing the function value.',
          'Parallel: on a hill, the "steepest up" arrow points to the summit. If you want the valley, which way do you walk relative to that arrow?',
          'Reason it out: the arrow points at the summit. Walking along it takes you higher. Walking exactly against it takes you down fastest. Walking perpendicular keeps your height roughly constant — you circle the hill. You want the valley, so you go against the arrow. Now write the sign that puts into the update rule.',
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    concept: 'overfitting-and-regularisation',
    lenses: [
      {
        lens: 'ANALOGY',
        body: 'A student who memorises past exam papers word for word scores perfectly on those papers and badly on a new one. They learned the specific questions, not the subject. A model that memorises its training set does exactly this — and regularisation is the constraint that forces it to learn the subject instead.',
      },
      {
        lens: 'FIRST_PRINCIPLES',
        body: 'Expected error decomposes into bias² + variance + irreducible noise. Overfitting is the high-variance regime: the model has enough capacity to fit noise in the training sample, so training error falls while generalisation error rises. Regularisation adds a penalty on parameter magnitude (L1/L2) that trades a little bias for a larger reduction in variance.',
      },
    ],
    misconceptions: [
      {
        code: 'TRAINING_ACCURACY_IS_QUALITY',
        label: 'Reading training accuracy as model quality',
        description:
          'The learner treats near-perfect training accuracy as success, when it is the primary warning sign of overfitting.',
        remediationHint:
          'Ask what the model is being asked to do: reproduce data it has seen, or perform on data it has not?',
      },
    ],
    questions: [
      {
        type: 'MCQ',
        stem: 'A model scores 99% on training data and 62% on held-out test data. What is most likely happening?',
        difficultyB: 0.8,
        discriminationA: 1.5,
        explanation:
          'A large gap between training and test performance is the signature of overfitting: the model has fitted noise specific to the training sample, which does not transfer. Underfitting would show poor performance on both.',
        options: [
          { label: 'Overfitting — it has memorised the training data', correct: true },
          { label: 'Underfitting — it needs more capacity' },
          { label: 'The model is performing well; 99% is excellent', misconception: 'TRAINING_ACCURACY_IS_QUALITY' },
          { label: 'The test set must be mislabelled' },
        ],
        hints: [
          'Compare the two numbers. What does the size of the gap between them tell you?',
          'Underfitting shows poor performance on both sets. Overfitting shows strong training performance with weak test performance — the gap is the diagnostic.',
          'Parallel: a model at 55% training and 53% test. Is that gap large or small, and what would you conclude about capacity?',
          'Reason through the parallel: 55% and 53% are both poor and nearly equal — the model is failing on data it has seen, so it lacks the capacity to capture the pattern at all. That is underfitting, and the gap is tiny. Now look at 99% versus 62%: the model handles seen data almost perfectly but new data poorly, so the failure is not capacity. Name what a large gap in that direction is called.',
        ],
      },
    ],
  },
];

/** Everything the seed writes. Split by area purely for file size. */
export const CONTENT: ConceptContent[] = [...CORE_CONTENT, ...MATH_CONTENT];

/** Write all authored content. Idempotent, like the rest of the seed. */
export async function seedContent(
  prisma: PrismaClient,
  conceptIdBySlug: Map<string, string>,
): Promise<void> {
  let lensCount = 0;
  let questionCount = 0;
  let hintCount = 0;
  let misconceptionCount = 0;

  for (const entry of CONTENT) {
    const conceptId = conceptIdBySlug.get(entry.concept);
    if (!conceptId) {
      throw new Error(`Content references unknown concept "${entry.concept}"`);
    }

    for (const lens of entry.lenses) {
      const level = lens.level ?? 2;
      await prisma.contentLens.upsert({
        where: { conceptId_lens_level: { conceptId, lens: lens.lens, level } },
        create: { conceptId, lens: lens.lens, level, body: lens.body, citation: lens.citation ?? null },
        update: { body: lens.body, citation: lens.citation ?? null },
      });
      lensCount += 1;
    }

    const misconceptionIdByCode = new Map<string, string>();
    for (const misconception of entry.misconceptions ?? []) {
      const row = await prisma.misconception.upsert({
        where: { conceptId_code: { conceptId, code: misconception.code } },
        create: { conceptId, ...misconception },
        update: {
          label: misconception.label,
          description: misconception.description,
          remediationHint: misconception.remediationHint,
        },
      });
      misconceptionIdByCode.set(misconception.code, row.id);
      misconceptionCount += 1;
    }

    for (const question of entry.questions) {
      // Questions have no natural unique key, so the stem identifies them for
      // idempotency: re-running the seed updates rather than duplicating.
      const existing = await prisma.question.findFirst({
        where: { conceptId, stem: question.stem },
        select: { id: true },
      });

      const data = {
        conceptId,
        type: question.type,
        stem: question.stem,
        canonicalAnswer: question.canonicalAnswer ?? null,
        explanation: question.explanation,
        difficultyB: question.difficultyB,
        discriminationA: question.discriminationA,
        guessC: question.guessC ?? (question.options ? 1 / question.options.length : 0.05),
      };

      const row = existing
        ? await prisma.question.update({ where: { id: existing.id }, data })
        : await prisma.question.create({ data });

      // Replace options wholesale — editing content should not leave stale
      // distractors behind.
      await prisma.questionOption.deleteMany({ where: { questionId: row.id } });
      if (question.options) {
        for (const [index, option] of question.options.entries()) {
          await prisma.questionOption.create({
            data: {
              questionId: row.id,
              label: option.label,
              isCorrect: option.correct ?? false,
              position: index,
              misconceptionId: option.misconception
                ? (misconceptionIdByCode.get(option.misconception) ?? null)
                : null,
            },
          });
        }
      }

      for (const [index, body] of question.hints.entries()) {
        const level = index + 1;
        await prisma.questionHint.upsert({
          where: { questionId_level: { questionId: row.id, level } },
          create: { questionId: row.id, level, body },
          update: { body },
        });
        hintCount += 1;
      }

      questionCount += 1;
    }
  }

  console.log(
    `✓ Content: ${lensCount} lenses, ${questionCount} questions, ${hintCount} hints, ${misconceptionCount} misconceptions`,
  );
}
