import { requireUser } from '@/auth/session';
import { ok, withApi } from '@/lib/api-handler';
import { listRecommendations } from '@/services/recommendation';

/** Ranked next actions, each carrying the reason it was chosen. */
export const GET = withApi(async () => {
  const user = await requireUser();
  return ok(await listRecommendations(user.id));
});
