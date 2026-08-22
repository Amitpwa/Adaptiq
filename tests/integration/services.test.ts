import { describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db';
import { getDashboardSummary } from '@/services/dashboard';
import { getPath } from '@/services/path';
import { getDueReviews } from '@/services/review';
import { listRecommendations } from '@/services/recommendation';
import { getConceptStudioData } from '@/services/concept';

describe('End-to-end Services and API data integrity (Zero 500 guarantee)', () => {
  it('safely handles non-existent or newly onboarded user without 500 crashes', async () => {
    const freshUserId = 'test-non-existent-user-id';

    // Dashboard summary returns null cleanly (200 OK with data: null)
    const summary = await getDashboardSummary(freshUserId);
    expect(summary).toBeNull();

    // Review queue returns empty array cleanly
    const reviews = await getDueReviews(freshUserId);
    expect(Array.isArray(reviews)).toBe(true);
    expect(reviews.length).toBe(0);

    // Recommendations list returns empty array cleanly
    const recs = await listRecommendations(freshUserId);
    expect(Array.isArray(recs)).toBe(true);
    expect(recs.length).toBe(0);
  }, 20000);

  it('correctly loads seeded curriculum concepts in concept studio without throwing', async () => {
    // Pick first concept in database
    const concept = await prisma.concept.findFirst({
      select: { id: true, slug: true },
    });

    if (concept) {
      const studio = await getConceptStudioData('test-user-id', concept.slug);
      expect(studio).toBeDefined();
      expect(studio.conceptSlug).toBe(concept.slug);
      expect(studio.body.length).toBeGreaterThan(0);
    }
  }, 20000);

  it('correctly computes learning path for active goals without cycle or layout crash', async () => {
    const goals = await prisma.goal.findMany({ select: { slug: true } });
    for (const goal of goals) {
      const path = await getPath('test-user-id', goal.slug);
      expect(path).toBeDefined();
      expect(path.goalSlug).toBe(goal.slug);
      expect(path.nodes.length).toBeGreaterThan(0);
    }
  }, 20000);
});
