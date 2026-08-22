import { requireUser } from '@/auth/session';
import { ok, withApi } from '@/lib/api-handler';
import { getDueReviews } from '@/services/review';

/** Spaced retrieval reviews due based on Ebbinghaus forgetting curve R(t) < 0.70. */
export const GET = withApi(async () => {
  const user = await requireUser();
  return ok(await getDueReviews(user.id));
});
