import type { ConceptContent } from './content-types';

/**
 * Assessment coverage for the mathematical spine of the ML path.
 *
 * Without items on these concepts the adaptive diagnostic runs out of
 * questions long before it reaches its precision target, and stops with a wide
 * standard error — which means the ability estimate it extends across the rest
 * of the goal is a guess. Item coverage is not content padding; it is what
 * makes the measurement trustworthy.
 *
 * Difficulties are spread deliberately across the logit range so the selector
 * always has something informative to serve regardless of where the learner
 * sits.
 */
export const MATH_CONTENT: ConceptContent[] = [
  {
    concept: 'functions',
    lenses: [
      {
        lens: 'ANALOGY',
        body: 'A function is a vending machine. You put in a code (the argument), the machine does something internal you do not need to see, and something comes out (the return value). The same code always yields the same snack — unless the machine has been secretly restocked, which is what we call a side effect.',
      },
      {
        lens: 'FIRST_PRINCIPLES',
        body: 'A function maps each element of a domain to exactly one element of a codomain. In programming this is relaxed: a procedure may also mutate state or perform I/O. A *pure* function is one that satisfies the mathematical definition — output determined solely by input, no observable effect elsewhere.',
      },
    ],
    questions: [
      {
        type: 'MCQ',
        stem: 'A function returns a different result each time it is called with the same argument. What must be true?',
        difficultyB: -0.7,
        discriminationA: 1.2,
        explanation:
          'A pure function is fully determined by its arguments. Differing results for identical input mean the function depends on something outside its parameters — mutable state, a clock, randomness, or I/O.',
        options: [
          { label: 'It depends on state outside its arguments', correct: true },
          { label: 'It has too many parameters' },
          { label: 'It is recursive' },
          { label: 'Its return type is wrong' },
        ],
        hints: [
          'If nothing but the argument decided the answer, could the answer ever change?',
          'A pure function is determined entirely by its inputs. Ask what else a function is able to read.',
          'Parallel: a vending machine that gives you a different snack for code A4 each morning. What is it consulting besides the code?',
          'Work it: the code A4 is identical each time, so the code cannot explain the difference. Something else must vary — what is left in the machine changes, or the time of day changes. Either way it is reading something beyond your input. Name that category for a function.',
        ],
      },
    ],
  },

  {
    concept: 'matrices',
    lenses: [
      {
        lens: 'ANALOGY',
        body: 'A matrix is a recipe for reshaping space. Applied to a grid of points, it can stretch, rotate, squash, or shear the whole grid at once. Each column tells you where one of the original axes ends up.',
      },
      {
        lens: 'FIRST_PRINCIPLES',
        body: 'An m×n matrix over a field represents a linear map from an n-dimensional space to an m-dimensional one, once bases are fixed. Its columns are the images of the basis vectors, which is why the column count must match the input dimension.',
      },
    ],
    questions: [
      {
        type: 'SHORT',
        stem: 'A matrix has 4 rows and 7 columns. Written in the standard "rows × columns" form, what is its shape? Answer as e.g. 2x3.',
        difficultyB: -0.6,
        discriminationA: 1.1,
        guessC: 0.05,
        canonicalAnswer: '4x7',
        explanation:
          'Matrix shape is stated rows-first: 4 rows and 7 columns is a 4×7 matrix. The convention matters because it determines which dimension must match in a product.',
        hints: [
          'Which of the two numbers is written first by convention?',
          'The convention is rows × columns, always in that order.',
          'Parallel: a matrix with 2 rows and 9 columns. Rows first, then columns.',
          'Work the parallel: 2 rows, so 2 comes first. 9 columns, so 9 comes second. The shape is 2x9. Now apply the identical ordering to 4 rows and 7 columns.',
        ],
      },
    ],
  },

  {
    concept: 'derivatives',
    lenses: [
      {
        lens: 'ANALOGY',
        body: 'The derivative is your speedometer reading. Total distance tells you where you have been; the speedometer tells you how fast things are changing at this exact instant. Zero on the speedometer means you are momentarily not moving — the top of a hill, or the bottom of a valley.',
      },
      {
        lens: 'FIRST_PRINCIPLES',
        body: "f'(x) = lim(h→0) [f(x+h) − f(x)] / h. The derivative is the limit of the average rate of change as the interval shrinks to nothing — geometrically, the slope of the tangent line at x.",
      },
    ],
    misconceptions: [
      {
        code: 'ZERO_DERIVATIVE_MEANS_ZERO_VALUE',
        label: 'Confusing a zero derivative with a zero function value',
        description:
          "The learner reads f'(x) = 0 as f(x) = 0, conflating the rate of change with the value itself.",
        remediationHint:
          'A car stopped at the top of a hill has zero speed but is not at zero altitude. Which quantity is the derivative?',
      },
    ],
    questions: [
      {
        type: 'MCQ',
        stem: 'At a point x, the derivative of f is zero. What does that tell you about f at x?',
        difficultyB: 0.2,
        discriminationA: 1.4,
        explanation:
          'A zero derivative means the tangent is flat — the function is momentarily not changing. That is a stationary point: a maximum, a minimum, or a saddle. It says nothing about the function\'s value.',
        options: [
          { label: 'f has a stationary point there — flat tangent', correct: true },
          { label: 'f(x) equals zero', misconception: 'ZERO_DERIVATIVE_MEANS_ZERO_VALUE' },
          { label: 'f is undefined at x' },
          { label: 'f must have a maximum there' },
        ],
        hints: [
          'The derivative measures rate of change. What does it mean for the rate of change to be zero?',
          'Distinguish two different quantities: the value of the function, and how fast that value is changing. Which one is the derivative?',
          'Parallel: a car at the summit of a hill, momentarily stationary. Its speed is zero. Is its altitude zero?',
          'Reason it out: at the summit the car has stopped moving, so speed = 0. But it is at the highest point on the road — altitude is large, not zero. Speed and altitude are different quantities entirely. Map speed onto the derivative and altitude onto f(x), then say what a zero derivative actually constrains.',
        ],
      },
    ],
  },

  {
    concept: 'partial-derivatives',
    lenses: [
      {
        lens: 'ANALOGY',
        body: 'On a hillside, walk due east and measure the slope under your feet. That is one partial derivative. Walk due north and measure again — another. Each one holds every other direction fixed and asks how steep it is along just one axis.',
      },
      {
        lens: 'FIRST_PRINCIPLES',
        body: '∂f/∂xᵢ is the derivative of f with respect to xᵢ, treating all other variables as constants. For f(x, y) = x²y, ∂f/∂x = 2xy and ∂f/∂y = x².',
      },
    ],
    questions: [
      {
        type: 'SHORT',
        stem: 'For f(x, y) = x²y, what is ∂f/∂y? (Write it in terms of x and y.)',
        difficultyB: 0.7,
        discriminationA: 1.5,
        guessC: 0.05,
        canonicalAnswer: 'x^2',
        explanation:
          'Differentiating with respect to y treats x² as a constant coefficient. The derivative of (constant)·y is that constant, so ∂f/∂y = x².',
        hints: [
          'When differentiating with respect to y, what role does x play?',
          'A partial derivative holds every other variable fixed. Treat x² exactly as you would treat the number 7.',
          'Parallel: g(x, y) = x³y. Differentiate with respect to y, treating x³ as a constant.',
          'Work the parallel: rewrite g as (x³)·y, where the bracket is just a constant coefficient — call it c, so g = c·y. The derivative of c·y with respect to y is c. Substituting back, c = x³, so ∂g/∂y = x³. Run the same three steps on x²y.',
        ],
      },
    ],
  },

  {
    concept: 'probability-basics',
    lenses: [
      {
        lens: 'ANALOGY',
        body: 'Two coin flips do not remember each other. Ten heads in a row does not make tails "due" — the coin has no memory. But drawing cards from a deck without replacing them is different: every card drawn changes what is left, so those draws are not independent.',
      },
      {
        lens: 'FIRST_PRINCIPLES',
        body: 'Events A and B are independent when P(A ∩ B) = P(A)·P(B), equivalently P(A|B) = P(A). Conditional probability is defined as P(A|B) = P(A ∩ B) / P(B) for P(B) > 0.',
      },
    ],
    misconceptions: [
      {
        code: 'GAMBLERS_FALLACY',
        label: "Gambler's fallacy",
        description:
          'The learner believes past independent outcomes change the probability of the next one — that a run of heads makes tails more likely.',
        remediationHint: 'Ask what physical mechanism would let the coin know what it did last time.',
      },
    ],
    questions: [
      {
        type: 'MCQ',
        stem: 'A fair coin has landed heads eight times in a row. What is the probability the next flip is heads?',
        difficultyB: -0.4,
        discriminationA: 1.3,
        explanation:
          'Each flip is independent, so the probability stays 0.5 regardless of history. A fair coin has no mechanism for remembering previous flips.',
        options: [
          { label: '0.5 — the flips are independent', correct: true },
          { label: 'Less than 0.5, because tails is overdue', misconception: 'GAMBLERS_FALLACY' },
          { label: 'More than 0.5, because heads is on a streak', misconception: 'GAMBLERS_FALLACY' },
          { label: 'It cannot be determined without more flips' },
        ],
        hints: [
          'What, physically, would have to carry information from the previous flip into the next one?',
          'Independence means P(A|B) = P(A): conditioning on the earlier flips does not change the probability.',
          'Parallel: a die that has rolled 6 three times running. Does the plastic retain any record of that?',
          'Reason it through: the die is a symmetric solid; nothing about its shape or mass changed when it landed on 6. It has no memory and no mechanism to compensate. So each roll faces exactly the same odds, 1/6, no matter the history. Apply the same reasoning to a fair coin after eight heads.',
        ],
      },
    ],
  },

  {
    concept: 'expectation-and-variance',
    lenses: [
      {
        lens: 'ANALOGY',
        body: 'Expectation is where the distribution balances if you put it on a see-saw. Variance is how spread out the weight is. Two classes can have the same average mark while one is tightly clustered and the other has everyone at the extremes.',
      },
      {
        lens: 'FIRST_PRINCIPLES',
        body: 'E[X] = Σ xᵢ·P(xᵢ) for discrete X. Var(X) = E[(X − E[X])²] = E[X²] − (E[X])². Variance is in squared units, which is why the standard deviation √Var(X) is often reported instead.',
      },
    ],
    questions: [
      {
        type: 'SHORT',
        stem: 'A fair six-sided die is rolled once. What is the expected value?',
        difficultyB: 0.1,
        discriminationA: 1.2,
        guessC: 0.05,
        canonicalAnswer: '3.5',
        explanation:
          'E[X] = (1 + 2 + 3 + 4 + 5 + 6)/6 = 21/6 = 3.5. The expected value need not be an outcome the die can actually show — it is a balance point, not a prediction.',
        hints: [
          'Each face is equally likely. What does that make the calculation?',
          'E[X] = Σ xᵢ·P(xᵢ). With equal probabilities this reduces to the plain average of the outcomes.',
          'Parallel: a fair four-sided die with faces 1, 2, 3, 4. Sum the faces and divide by how many there are.',
          'Work the parallel: 1 + 2 + 3 + 4 = 10, and there are 4 equally likely faces, so E[X] = 10/4 = 2.5. Note that 2.5 is not a face the die can land on — expectation is a balance point, not an outcome. Now run those steps for six faces.',
        ],
      },
    ],
  },

  {
    concept: 'linear-regression',
    lenses: [
      {
        lens: 'ANALOGY',
        body: 'Laying a straight stick through a scatter of points so the total up-and-down miss is as small as possible. Misses are squared before adding, so one badly-placed point pulls the stick much harder than several small misses do.',
      },
      {
        lens: 'FIRST_PRINCIPLES',
        body: 'Minimise the residual sum of squares: J(θ) = Σ(yᵢ − θᵀxᵢ)². The closed-form solution is θ = (XᵀX)⁻¹Xᵀy, valid when XᵀX is invertible; otherwise an iterative method or regularisation is required.',
      },
    ],
    questions: [
      {
        type: 'MCQ',
        stem: 'Linear regression squares the residuals before summing them. What is the main consequence?',
        difficultyB: 0.6,
        discriminationA: 1.4,
        explanation:
          'Squaring makes all errors positive so they cannot cancel, and it penalises large errors disproportionately — a residual of 10 contributes 100 while ten residuals of 1 contribute 10 in total. This makes least squares sensitive to outliers.',
        options: [
          { label: 'Large errors are penalised disproportionately, so outliers dominate', correct: true },
          { label: 'It guarantees the fitted line passes through every point' },
          { label: 'It makes the model non-linear' },
          { label: 'It removes the need for an intercept term' },
        ],
        hints: [
          'Compare the contribution of one residual of size 10 against ten residuals of size 1.',
          'Squaring is a convex, rapidly growing function. Ask how the penalty scales as an individual error grows.',
          'Parallel: residuals of 2 and 8 versus residuals of 5 and 5. Both sets total 10 unsquared. Square them and compare.',
          'Work the parallel: 2² + 8² = 4 + 64 = 68. But 5² + 5² = 25 + 25 = 50. Identical raw totals, very different squared totals — the set containing one large error costs far more. So the fit will contort itself to reduce that single big miss. Name what that means for a dataset containing an outlier.',
        ],
      },
    ],
  },

  {
    concept: 'gradient-descent',
    lenses: [
      {
        lens: 'ANALOGY',
        body: 'Descending a foggy mountain by feel. You test the slope around your feet, take a step downhill, and repeat. Step too small and nightfall beats you down; step too large and you leap straight across the valley and up the far slope.',
      },
      {
        lens: 'FIRST_PRINCIPLES',
        body: 'θ ← θ − α∇J(θ). The learning rate α scales the step. For convex J with suitably small α, iterates converge to the global minimum; too large an α can diverge, and too small makes convergence impractically slow.',
      },
    ],
    misconceptions: [
      {
        code: 'BIGGER_LR_IS_FASTER',
        label: 'Assuming a larger learning rate always converges faster',
        description:
          'The learner treats the learning rate as a pure speed dial, not recognising that too large a step overshoots the minimum and can diverge.',
        remediationHint:
          'Picture stepping across a narrow valley: what happens when your stride is wider than the valley floor?',
      },
    ],
    questions: [
      {
        type: 'MCQ',
        stem: 'During training, the loss oscillates wildly and increases rather than settling. What is the most likely cause?',
        difficultyB: 1.0,
        discriminationA: 1.5,
        explanation:
          'A learning rate that is too large overshoots the minimum on each step, landing further up the opposite slope each time — producing exactly this oscillating, diverging loss.',
        options: [
          { label: 'The learning rate is too large', correct: true },
          { label: 'The learning rate is too small', misconception: 'BIGGER_LR_IS_FASTER' },
          { label: 'The model has too few parameters' },
          { label: 'The training set is too large' },
        ],
        hints: [
          'What would each individual step have to be doing to make the loss go *up*?',
          'The update moves against the gradient by a distance scaled by the learning rate. Consider what happens when that distance exceeds the width of the valley.',
          'Parallel: stepping down a narrow V-shaped valley with a stride far wider than the valley floor. Where do you land, and at what height?',
          'Walk it: you stand on the left slope and step right. Your stride overshoots the floor entirely and you land on the right slope — higher than you started. Next step you overshoot back to the left, higher again. Height oscillates and grows. That pattern is exactly a diverging loss curve. Now name the parameter that sets your stride length.',
        ],
      },
    ],
  },

  {
    concept: 'neural-networks',
    lenses: [
      {
        lens: 'ANALOGY',
        body: 'An assembly line where each station reshapes the part it receives and passes it on. Without a non-linear step between stations, the whole line could be replaced by a single station — stacking linear operations just gives you another linear operation.',
      },
      {
        lens: 'FIRST_PRINCIPLES',
        body: 'A layer computes h = σ(Wx + b). Without the non-linearity σ, composing layers gives W₂(W₁x + b₁) + b₂ = (W₂W₁)x + (W₂b₁ + b₂), which is a single affine map. Non-linearity is what makes depth add expressive power.',
      },
    ],
    misconceptions: [
      {
        code: 'DEPTH_WITHOUT_NONLINEARITY',
        label: 'Believing stacked linear layers gain power from depth',
        description:
          'The learner assumes more layers means more expressive power, without recognising that composed linear maps collapse to a single linear map.',
        remediationHint:
          'Multiply two matrices together. What kind of object do you get, and how many layers does it represent?',
      },
    ],
    questions: [
      {
        type: 'MCQ',
        stem: 'A network stacks 10 fully-connected layers with no activation function between them. What is it equivalent to?',
        difficultyB: 1.2,
        discriminationA: 1.6,
        explanation:
          'Composing linear maps yields a linear map: W₁₀…W₁ multiplies out to a single weight matrix. Without non-linearity, ten layers have exactly the expressive power of one.',
        options: [
          { label: 'A single linear layer', correct: true },
          { label: 'A network ten times more expressive', misconception: 'DEPTH_WITHOUT_NONLINEARITY' },
          { label: 'A network that cannot be trained at all' },
          { label: 'A convolutional network' },
        ],
        hints: [
          'What do you get when you multiply two matrices together?',
          'Each layer computes Wx + b. Compose two of them algebraically and look at the shape of the result.',
          'Parallel: just two layers, W₂(W₁x + b₁) + b₂. Expand the brackets and group the terms.',
          'Expand it: W₂(W₁x + b₁) + b₂ = W₂W₁x + W₂b₁ + b₂. Now W₂W₁ is itself a single matrix — call it W — and W₂b₁ + b₂ is a single vector, call it b. So the whole thing is Wx + b: one layer. The same collapse happens at every additional layer. Conclude what ten stacked linear layers amount to.',
        ],
      },
    ],
  },

  {
    concept: 'backpropagation',
    lenses: [
      {
        lens: 'ANALOGY',
        body: 'Tracing blame backwards through a production line. The final product is faulty; you ask the last station how much of the error it contributed and how sensitive it was to what it received, then pass the remaining blame upstream. Each station only needs to know its own local sensitivity.',
      },
      {
        lens: 'FIRST_PRINCIPLES',
        body: 'Backpropagation applies the chain rule in reverse-mode automatic differentiation: ∂L/∂Wᵢ = (∂L/∂hᵢ)(∂hᵢ/∂Wᵢ), with ∂L/∂hᵢ computed from layer i+1. Reverse mode costs one backward pass for all parameters, whereas forward mode would cost one pass per parameter.',
      },
    ],
    questions: [
      {
        type: 'MCQ',
        stem: 'Which calculus rule does backpropagation apply to obtain gradients for every layer?',
        difficultyB: 1.4,
        discriminationA: 1.5,
        explanation:
          'The chain rule. A network is a composition of functions, and the chain rule gives the derivative of a composition as the product of the derivatives of its parts — applied from the loss backwards.',
        options: [
          { label: 'The chain rule', correct: true },
          { label: 'The product rule' },
          { label: 'Integration by parts' },
          { label: "L'Hôpital's rule" },
        ],
        hints: [
          'A network applies one function to the output of another. Which rule differentiates a composition?',
          'Write the network as L(f(g(x))). You need dL/dx in terms of the local derivatives at each stage.',
          'Parallel: y = sin(x²). Differentiate it and notice how the two derivatives combine.',
          'Work it: let u = x², so y = sin(u). Then dy/du = cos(u) and du/dx = 2x. Multiply them: dy/dx = cos(x²)·2x. The derivative of the composition is the *product* of the local derivatives, taken from outside in. That multiply-as-you-go-backwards is exactly what a network does across its layers. Name the rule.',
        ],
      },
    ],
  },
];
