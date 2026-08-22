import { requireUser } from '@/auth/session';
import { ok, withApi } from '@/lib/api-handler';
import { getDashboardSummary } from '@/services/dashboard';

/** Aggregate knowledge metrics for the learner's active goal. */
export const GET = withApi(async () => {
  const user = await requireUser();
  return ok(await getDashboardSummary(user.id));
});
