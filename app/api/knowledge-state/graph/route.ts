import type { NextRequest } from 'next/server';

import { requireUser } from '@/auth/session';
import { ok, withApi } from '@/lib/api-handler';
import { getKnowledgeGraph } from '@/services/graph';
import { slugSchema } from '@/validation/diagnostic';

/**
 * Nodes, edges, layout, and the learner's state in one round trip.
 *
 * Scoped to the session's user id, so a learner cannot read another learner's
 * knowledge map by passing a goal slug.
 */
export const GET = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  const goalSlug = slugSchema.parse(request.nextUrl.searchParams.get('goal') ?? '');
  return ok(await getKnowledgeGraph(user.id, goalSlug));
});
