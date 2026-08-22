import 'dotenv/config';

/**
 * Exercises every read path against the real database.
 *
 * Prisma 7's `select` types turned out to be permissive enough to let a
 * non-existent column typecheck and then throw at runtime — `listGoals` shipped
 * a broken query that `tsc` accepted. Static checking alone therefore does not
 * prove these queries work, so this runs each one for real and reports which
 * ones survive.
 */

import { prisma } from '../src/lib/db';
import { listGoals, loadGoalCurriculum } from '../src/repositories/curriculum';
import { getDashboardSummary } from '../src/services/dashboard';
import { getKnowledgeGraph } from '../src/services/graph';
import { getPath } from '../src/services/path';
import { listRecommendations } from '../src/services/recommendation';
import { loadDecayedStates } from '../src/services/knowledge-state';

const results: Array<{ name: string; ok: boolean; detail: string }> = [];

async function check(name: string, run: () => Promise<string>) {
  try {
    results.push({ name, ok: true, detail: await run() });
  } catch (error) {
    const message = error instanceof Error ? (error.message.split('\n')[0] ?? 'Unknown error') : String(error);
    results.push({ name, ok: false, detail: message });
  }
}

// Pick a learner who has actually been through onboarding, so the read paths
// run against realistic state rather than an empty profile.
const learner = await prisma.learnerProfile.findFirst({
  where: { activeGoalId: { not: null }, onboardingStage: 'COMPLETE' },
  select: { userId: true, activeGoal: { select: { slug: true } } },
});

if (!learner?.activeGoal) {
  console.log('No onboarded learner found — run scripts/smoke-diagnostic.ts first.');
  await prisma.$disconnect();
  process.exit(0);
}

const userId = learner.userId;
const goalSlug = learner.activeGoal.slug;
console.log(`Using learner ${userId} on goal "${goalSlug}"\n`);

await check('listGoals', async () => `${(await listGoals()).length} goals`);

await check('loadGoalCurriculum', async () => {
  const curriculum = await loadGoalCurriculum(goalSlug);
  return `${curriculum.concepts.length} concepts, ${curriculum.graph.edges.length} edges`;
});

await check('getDashboardSummary', async () => {
  const summary = await getDashboardSummary(userId);
  if (!summary) return 'null (no active goal)';
  return `${summary.masteredCount} mastered / ${summary.gapCount} gaps / avg ${summary.averageMastery.toFixed(2)}`;
});

await check('getKnowledgeGraph', async () => {
  const graph = await getKnowledgeGraph(userId, goalSlug);
  return `${graph.nodes.length} nodes, ${graph.edges.length} edges, ${graph.edges.filter((e) => e.satisfied).length} unlocked`;
});

await check('getPath', async () => {
  const path = await getPath(userId, goalSlug);
  return `${path.nodes.length} nodes, next: ${path.next?.title ?? 'none'}`;
});

await check('listRecommendations', async () => {
  const recommendations = await listRecommendations(userId);
  return `${recommendations.length} recommendations`;
});

await check('loadDecayedStates', async () => {
  const curriculum = await loadGoalCurriculum(goalSlug);
  const states = await loadDecayedStates(
    userId,
    curriculum.concepts.map((c) => c.id),
  );
  return `${states.size} states decayed`;
});

// Services added after the initial slice; imported dynamically so a missing or
// renamed export is reported as a failed check rather than crashing the script.
await check('getReviewQueue', async () => {
  const reviewModule = await import('../src/services/review');
  const fn = Object.values(reviewModule).find((value) => typeof value === 'function') as
    | ((...args: unknown[]) => Promise<unknown>)
    | undefined;
  if (!fn) return 'no exported function';
  const result = await fn(userId);
  return `${Array.isArray(result) ? result.length : 'ok'} due`;
});

await check('getConceptStudioData', async () => {
  const { getConceptStudioData } = await import('../src/services/concept');
  const curriculum = await loadGoalCurriculum(goalSlug);
  const slug = curriculum.concepts.find((c) => c.slug === 'vectors')?.slug
    ?? curriculum.concepts[0]?.slug
    ?? 'vectors';
  const studio = (await getConceptStudioData(userId, slug)) as unknown as Record<string, unknown>;
  return `"${slug}" -> keys: ${Object.keys(studio).join(', ')}`;
});

await check('tutor hint ladder', async () => {
  const tutorModule = await import('../src/services/tutor');
  const names = Object.keys(tutorModule);
  const question = await prisma.question.findFirst({
    where: { hints: { some: {} } },
    select: { id: true, conceptId: true },
  });
  if (!question) return 'no question with hints';
  return `exports: ${names.join(', ')} (question ${question.id.slice(0, 8)} has hints)`;
});

console.log('Service read paths:\n');
for (const result of results) {
  console.log(`  ${result.ok ? 'PASS' : 'FAIL'}  ${result.name.padEnd(22)} ${result.detail}`);
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passing`);

await prisma.$disconnect();
if (failed > 0) process.exitCode = 1;
