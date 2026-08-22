import type { NextRequest } from 'next/server';

import { requireUser } from '@/auth/session';
import { ok, withApi } from '@/lib/api-handler';
import { getPath } from '@/services/path';
import { slugSchema } from '@/validation/diagnostic';

/** The learner's personalised path for a goal, with live decay applied. */
export const GET = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  const goalSlug = slugSchema.parse(request.nextUrl.searchParams.get('goal') ?? '');
  return ok(await getPath(user.id, goalSlug));
});
