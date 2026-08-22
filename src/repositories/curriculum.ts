import 'server-only';

import { prisma } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';
import { buildGraph, type ConceptGraph } from '@/engine/graph';

const curriculumCache = new Map<string, { data: GoalCurriculum; cachedAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export interface GoalSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  domainTitle: string;
  conceptCount: number;
  _count: { concepts: number };
}

export async function listGoals(): Promise<GoalSummary[]> {
  const goals = await prisma.goal.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      domain: { select: { title: true } },
      _count: { select: { concepts: true } },
    },
    orderBy: { title: 'asc' },
  });

  return goals.map((g) => ({
    id: g.id,
    slug: g.slug,
    title: g.title,
    summary: g.summary,
    description: g.summary,
    domainTitle: g.domain.title,
    conceptCount: g._count.concepts,
    _count: g._count,
  }));
}

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
  const cached = curriculumCache.get(goalSlug);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.data;
  }

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

  const edges = await prisma.conceptEdge.findMany({
    where: { conceptId: { in: conceptIds }, prerequisiteId: { in: conceptIds } },
    select: { prerequisiteId: true, conceptId: true, strength: true },
  });

  const result: GoalCurriculum = {
    goalId: goal.id,
    goalSlug: goal.slug,
    goalTitle: goal.title,
    concepts,
    conceptById: new Map(concepts.map((c) => [c.id, c])),
    graph: buildGraph(conceptIds, edges),
  };

  curriculumCache.set(goalSlug, { data: result, cachedAt: Date.now() });
  return result;
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

export async function loadQuestionWithAnswers(questionId: string) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      conceptId: true,
      type: true,
      stem: true,
      explanation: true,
      canonicalAnswer: true,
      difficultyB: true,
      discriminationA: true,
      guessC: true,
      concept: {
        select: {
          id: true,
          title: true,
          pInit: true,
          pTransit: true,
          pSlip: true,
          pGuess: true,
        },
      },
      options: {
        select: {
          id: true,
          label: true,
          isCorrect: true,
          explanation: true,
          misconceptionId: true,
          position: true,
        },
        orderBy: { position: 'asc' },
      },
    },
  });
  if (!question) throw NotFoundError('That question does not exist.');
  return question;
}
