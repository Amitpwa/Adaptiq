import { ok, withApi } from '@/lib/api-handler';
import { getCurrentUser } from '@/auth/session';
import { listGoals } from '@/repositories/curriculum';

/**
 * Learning goals a learner can choose during onboarding and browsing.
 * Returns the public goal catalogue if unauthenticated or authenticated.
 */
export const GET = withApi(async () => {
  // Optional auth context - catalogue is public
  await getCurrentUser();
  const goals = await listGoals();
  return ok(
    goals.map((goal) => ({
      slug: goal.slug,
      title: goal.title,
      description: goal.description,
      conceptCount: goal._count.concepts,
    })),
  );
});
