/** Shared shapes for authored curriculum content. */

export interface MisconceptionSeed {
  code: string;
  label: string;
  description: string;
  remediationHint: string;
}

export interface OptionSeed {
  label: string;
  correct?: boolean;
  /** Code of the misconception this distractor diagnoses. */
  misconception?: string;
}

export interface QuestionSeed {
  type: 'MCQ' | 'SHORT' | 'OUTPUT_PREDICTION';
  stem: string;
  difficultyB: number;
  discriminationA: number;
  guessC?: number;
  explanation: string;
  canonicalAnswer?: string;
  options?: OptionSeed[];
  /** Exactly four, levels 1 through 4. */
  hints: [string, string, string, string];
}

export interface LensSeed {
  lens: 'ANALOGY' | 'FIRST_PRINCIPLES' | 'CODE' | 'VISUAL';
  level?: number;
  body: string;
  citation?: string;
}

export interface ConceptContent {
  concept: string;
  lenses: LensSeed[];
  misconceptions?: MisconceptionSeed[];
  questions: QuestionSeed[];
}
