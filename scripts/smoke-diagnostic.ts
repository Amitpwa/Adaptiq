import 'dotenv/config';

/**
 * End-to-end exercise of the adaptive loop against the real database.
 *
 * Simulates the PRD's "Priya" persona: strong programming fundamentals, real
 * gaps in the calculus and linear algebra that machine learning depends on.
 * The point is to check that the system *reacts differently* to her strengths
 * and her gaps — a diagnostic that produces the same path for everyone would
 * pass a smoke test but fail the product.
 */

import { prisma } from '../src/lib/db';
import { hashPassword } from '../src/auth/password';
import {
  completeDiagnostic,
  nextDiagnosticItem,
  startDiagnostic,
  submitDiagnosticAnswer,
} from '../src/services/diagnostic';
import { getPath } from '../src/services/path';
import { listRecommendations } from '../src/services/recommendation';
import { loadDecayedStates } from '../src/services/knowledge-state';

const EMAIL = 'smoke-priya@example.com';
const GOAL = 'ml-engineer';

/** Concepts Priya is weak in. Everything else she answers correctly. */
const WEAK_CONCEPTS = new Set([
  'derivatives',
  'partial-derivatives',
  'gradients',
  'matrix-multiplication',
]);

async function resetLearner() {
  await prisma.user.deleteMany({ where: { email: EMAIL } });
  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      name: 'Priya (smoke test)',
      passwordHash: await hashPassword('correct-horse-battery-staple'),
      profile: { create: {} },
    },
    select: { id: true },
  });
  return user.id;
}

async function main() {
  const userId = await resetLearner();
  console.log(`Learner created: ${userId}\n`);

  const { sessionId, goal } = await startDiagnostic(userId, GOAL);
  console.log(`Diagnostic started on "${goal.goalTitle}" (${goal.concepts.length} concepts)\n`);

  let step = 0;
  for (;;) {
    const { question, progress } = await nextDiagnosticItem(userId, sessionId);
    if (!question) {
      console.log(`\nDiagnostic stopped after ${progress.itemsServed} items ` +
        `(SE ${progress.standardError.toFixed(3)})`);
      break;
    }

    step += 1;
    // Decide the simulated answer from the concept, not from the options, so
    // the learner model is consistent regardless of item order.
    const conceptRow = await prisma.question.findUnique({
      where: { id: question.questionId },
      select: { concept: { select: { slug: true } } },
    });
    const slug = conceptRow?.concept.slug ?? '';
    const shouldAnswerCorrectly = !WEAK_CONCEPTS.has(slug);

    const options = await prisma.questionOption.findMany({
      where: { questionId: question.questionId },
      select: { id: true, isCorrect: true },
      orderBy: { position: 'asc' },
    });

    let response: { optionId?: string; text?: string };
    if (options.length > 0) {
      const target = shouldAnswerCorrectly
        ? options.find((o) => o.isCorrect)
        : options.find((o) => !o.isCorrect);
      response = { optionId: (target ?? options[0])!.id };
    } else {
      const key = await prisma.question.findUnique({
        where: { id: question.questionId },
        select: { canonicalAnswer: true },
      });
      response = { text: shouldAnswerCorrectly ? (key?.canonicalAnswer ?? '') : 'definitely wrong' };
    }

    const result = await submitDiagnosticAnswer(userId, sessionId, question.itemId, response);

    console.log(
      `${String(step).padStart(2)}. [${slug}] ${result.correct ? 'correct  ' : 'incorrect'} ` +
        `mastery ${result.masteryBefore.toFixed(3)} -> ${result.masteryAfter.toFixed(3)}` +
        (result.misconception ? `  misconception: ${result.misconception.label}` : ''),
    );
  }

  const summary = await completeDiagnostic(userId, sessionId);
  console.log(
    `\nAbility estimate: theta ${summary.theta.toFixed(3)} (SE ${summary.standardError.toFixed(3)}), ` +
      `${summary.correctCount}/${summary.itemsAnswered} correct\n`,
  );

  // --- What the learner would actually see --------------------------------
  const path = await getPath(userId, GOAL);
  console.log(`Learning path: ${path.nodes.length} concepts, ` +
    `${Math.round(path.completion * 100)}% complete`);
  console.log(`Next up: ${path.next?.title ?? 'nothing'} — ${path.next?.rationale ?? ''}\n`);

  const byStatus = new Map<string, number>();
  for (const node of path.nodes) byStatus.set(node.status, (byStatus.get(node.status) ?? 0) + 1);
  console.log('Path node status:', Object.fromEntries(byStatus));

  const states = await loadDecayedStates(userId, path.nodes.map((n) => n.conceptId));
  const measured = path.nodes
    .filter((n) => (states.get(n.conceptId)?.attempts ?? 0) > 0)
    .map((n) => ({
      concept: n.title,
      mastery: states.get(n.conceptId)!.effectiveMastery.toFixed(3),
      band: states.get(n.conceptId)!.band,
    }));
  console.log('\nConcepts with direct evidence:');
  console.table(measured);

  const recommendations = await listRecommendations(userId);
  console.log('Recommendations:');
  for (const recommendation of recommendations) {
    console.log(`  [${recommendation.kind}] ${recommendation.conceptTitle} ` +
      `(score ${recommendation.score.toFixed(3)})`);
    console.log(`      ${recommendation.rationale}`);
  }

  const misconceptions = await prisma.learnerMisconception.findMany({
    where: { userId },
    select: { occurrences: true, misconception: { select: { label: true } } },
  });
  console.log('\nMisconceptions caught:');
  for (const row of misconceptions) {
    console.log(`  ${row.misconception.label} (x${row.occurrences})`);
  }

  const events = await prisma.knowledgeStateEvent.count({ where: { userId } });
  console.log(`\nAudit trail: ${events} knowledge-state events recorded`);
}

main()
  .catch((error) => {
    console.error('\nSmoke test failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
