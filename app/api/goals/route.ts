import { ok, withApi } from '@/lib/api-handler';
import { requireUser } from '@/auth/session';
import { listGoals } from '@/repositories/curriculum';

/** Learning goals a learner can choose during onboarding. */
export const GET = withApi(async () => {
  await requireUser();
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
