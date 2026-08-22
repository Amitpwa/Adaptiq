import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../src/generated/prisma/client';
import { buildGraph, closureFor, isAcyclic, findCycle } from '../../src/engine/graph';
import { computeLayout } from '../../src/engine/layout';
import { CONCEPTS, DOMAIN, GOALS } from './data/concepts';
import { seedContent } from './data/content';

/**
 * Idempotent database seed.
 *
 * Every write is an upsert keyed on a natural unique constraint, so running
 * this repeatedly converges rather than duplicating. That matters because the
 * seed is run against preview databases and re-run after schema changes.
 */

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

async function main() {
  console.log('Seeding Adaptiq curriculum…\n');

  // --- Fail fast on an invalid curriculum ----------------------------------
  // A cycle in the prerequisite graph would make topological ordering
  // impossible and strand learners on concepts that can never unlock. Better
  // to refuse to seed than to write a broken curriculum.
  const validationGraph = buildGraph(
    CONCEPTS.map((c) => c.slug),
    CONCEPTS.flatMap((c) =>
      c.prerequisites.map((p) => ({ prerequisiteId: p, conceptId: c.slug, strength: 1 })),
    ),
  );
  if (!isAcyclic(validationGraph)) {
    throw new Error(`Curriculum has a prerequisite cycle: ${findCycle(validationGraph)?.join(' -> ')}`);
  }

  const knownSlugs = new Set(CONCEPTS.map((c) => c.slug));
  for (const concept of CONCEPTS) {
    for (const prerequisite of concept.prerequisites) {
      if (!knownSlugs.has(prerequisite)) {
        throw new Error(`Concept "${concept.slug}" lists unknown prerequisite "${prerequisite}"`);
      }
    }
  }
  console.log(`✓ Curriculum validated: ${CONCEPTS.length} concepts, acyclic`);

  // --- Domain --------------------------------------------------------------
  const domain = await prisma.domain.upsert({
    where: { slug: DOMAIN.slug },
    create: DOMAIN,
    update: { title: DOMAIN.title, summary: DOMAIN.summary },
  });

  // --- Concepts ------------------------------------------------------------
  const conceptIdBySlug = new Map<string, string>();
  for (const concept of CONCEPTS) {
    const { prerequisites: _prerequisites, ...fields } = concept;
    const row = await prisma.concept.upsert({
      where: { domainId_slug: { domainId: domain.id, slug: concept.slug } },
      create: { ...fields, domainId: domain.id },
      update: fields,
    });
    conceptIdBySlug.set(concept.slug, row.id);
  }
  console.log(`✓ Concepts: ${conceptIdBySlug.size}`);

  // --- Prerequisite edges --------------------------------------------------
  let edgeCount = 0;
  for (const concept of CONCEPTS) {
    const conceptId = conceptIdBySlug.get(concept.slug) as string;
    for (const prerequisiteSlug of concept.prerequisites) {
      const prerequisiteId = conceptIdBySlug.get(prerequisiteSlug) as string;
      await prisma.conceptEdge.upsert({
        where: { prerequisiteId_conceptId: { prerequisiteId, conceptId } },
        create: { prerequisiteId, conceptId, strength: 1 },
        update: {},
      });
      edgeCount += 1;
    }
  }
  console.log(`✓ Prerequisite edges: ${edgeCount}`);

  // --- Goals ---------------------------------------------------------------
  const graph = buildGraph(
    [...conceptIdBySlug.values()],
    CONCEPTS.flatMap((c) =>
      c.prerequisites.map((p) => ({
        prerequisiteId: conceptIdBySlug.get(p) as string,
        conceptId: conceptIdBySlug.get(c.slug) as string,
        strength: 1,
      })),
    ),
  );

  for (const goal of GOALS) {
    const row = await prisma.goal.upsert({
      where: { slug: goal.slug },
      create: {
        slug: goal.slug,
        title: goal.title,
        description: goal.description,
        domainId: domain.id,
      },
      update: { title: goal.title, description: goal.description },
    });

    // The goal's concept set is its targets plus everything they transitively
    // require — computed here rather than hand-listed, so it can never drift
    // out of sync with the prerequisite graph.
    const targetIds = goal.targets.map((t) => conceptIdBySlug.get(t.slug) as string);
    const closure = closureFor(graph, targetIds);
    const explicitWeight = new Map(
      goal.targets.map((t) => [conceptIdBySlug.get(t.slug) as string, t.weight]),
    );

    for (const conceptId of closure) {
      // Supporting concepts carry a lower weight than the goal's own targets:
      // they matter, but reaching the target is what the learner asked for.
      const weight = explicitWeight.get(conceptId) ?? 0.6;
      await prisma.goalConcept.upsert({
        where: { goalId_conceptId: { goalId: row.id, conceptId } },
        create: { goalId: row.id, conceptId, weight },
        update: { weight },
      });
    }

    // --- Deterministic layout ---------------------------------------------
    // Computed once at seed time and stored, so every learner sees the same
    // stable map and the browser never runs a layout simulation.
    const goalGraph = buildGraph(
      [...closure],
      graph.edges.filter((e) => closure.has(e.prerequisiteId) && closure.has(e.conceptId)),
    );
    const positions = computeLayout(goalGraph);
    for (const position of positions) {
      await prisma.conceptLayout.upsert({
        where: { goalId_conceptId: { goalId: row.id, conceptId: position.conceptId } },
        create: {
          goalId: row.id,
          conceptId: position.conceptId,
          rank: position.rank,
          order: position.order,
          x: position.x,
          y: position.y,
        },
        update: { rank: position.rank, order: position.order, x: position.x, y: position.y },
      });
    }

    console.log(
      `✓ Goal "${goal.title}": ${closure.size} concepts, ${positions.length} laid out, ` +
        `${Math.max(...positions.map((p) => p.rank)) + 1} ranks deep`,
    );
  }

  // --- Learning content, questions, hints, misconceptions ------------------
  await seedContent(prisma, conceptIdBySlug);

  console.log('\nSeed complete.');
}

main()
  .catch((error) => {
    console.error('\nSeed failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
