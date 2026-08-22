import 'server-only';

import { prisma } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';
import { buildGraph, type ConceptGraph } from '@/engine/graph';

/**
 * Curriculum reads.
 *
 * The concept graph for a goal is loaded in two queries regardless of graph
 * size — one for nodes, one for edges — and then indexed in memory. The
 * alternative (walking prerequisites with a query per level) is the classic
 * N+1 and would put a round trip on every rank of the graph.
 */

export interface ConceptRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  difficultyB: number;
  discriminationA: number;
  guessC: number;
  pInit: number;
  pTransit: number;
  pSlip: number;
  pGuess: number;
  estimatedMinutes: number;
  goalWeight: number;
}

export interface GoalCurriculum {
  goalId: string;
  goalSlug: string;
  goalTitle: string;
  concepts: ConceptRow[];
  conceptById: Map<string, ConceptRow>;
  graph: ConceptGraph;
}

export async function loadGoalCurriculum(goalSlug: string): Promise<GoalCurriculum> {
  const goal = await prisma.goal.findUnique({
    where: { slug: goalSlug },
    select: { id: true, slug: true, title: true },
  });
  if (!goal) throw NotFoundError('That learning goal does not exist.');

  const goalConcepts = await prisma.goalConcept.findMany({
    where: { goalId: goal.id },
    select: {
      weight: true,
      concept: {
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          difficultyB: true,
          discriminationA: true,
          guessC: true,
          pInit: true,
          pTransit: true,
          pSlip: true,
          pGuess: true,
          estimatedMinutes: true,
        },
      },
    },
  });

  const concepts: ConceptRow[] = goalConcepts.map((row) => ({
    ...row.concept,
    goalWeight: row.weight,
  }));
  const conceptIds = concepts.map((c) => c.id);

  // Only edges wholly inside the goal's concept set matter; an edge to a
  // concept outside the goal is not something this learner has to satisfy.
  const edges = await prisma.conceptEdge.findMany({
    where: { conceptId: { in: conceptIds }, prerequisiteId: { in: conceptIds } },
    select: { prerequisiteId: true, conceptId: true, strength: true },
  });

  return {
    goalId: goal.id,
    goalSlug: goal.slug,
    goalTitle: goal.title,
    concepts,
    conceptById: new Map(concepts.map((c) => [c.id, c])),
    graph: buildGraph(conceptIds, edges),
  };
}

export interface QuestionRow {
  id: string;
  conceptId: string;
  type: string;
  stem: string;
  difficultyB: number;
  discriminationA: number;
  guessC: number;
  options: Array<{ id: string; label: string; position: number }>;
}

/**
 * Load questions for a set of concepts, without answer keys.
 *
 * `isCorrect`, `canonicalAnswer`, `explanation`, and the misconception mapping
 * are deliberately excluded: this shape is what gets serialised to the browser,
 * and shipping the answer key alongside the question would make the assessment
 * meaningless to anyone who opens developer tools.
 */
export async function loadQuestionsForConcepts(conceptIds: string[]): Promise<QuestionRow[]> {
  if (conceptIds.length === 0) return [];

  const questions = await prisma.question.findMany({
    where: { conceptId: { in: conceptIds } },
    select: {
      id: true,
      conceptId: true,
      type: true,
      stem: true,
      difficultyB: true,
      discriminationA: true,
      guessC: true,
      options: {
        select: { id: true, label: true, position: true },
        orderBy: { position: 'asc' },
      },
    },
  });

  return questions;
}

/** Full question record including the answer key. Server-side only. */
export async function loadQuestionWithAnswers(questionId: string) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      conceptId: true,
      type: true,
      stem: true,
      canonicalAnswer: true,
      explanation: true,
      difficultyB: true,
      discriminationA: true,
      guessC: true,
      options: {
        select: { id: true, label: true, isCorrect: true, misconceptionId: true, position: true },
        orderBy: { position: 'asc' },
      },
      concept: {
        select: {
          id: true,
          slug: true,
          title: true,
          pInit: true,
          pTransit: true,
          pSlip: true,
          pGuess: true,
        },
      },
    },
  });
  if (!question) throw NotFoundError('That question does not exist.');
  return question;
}

export async function listGoals() {
  return prisma.goal.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      _count: { select: { concepts: true } },
    },
    orderBy: { title: 'asc' },
  });
}
