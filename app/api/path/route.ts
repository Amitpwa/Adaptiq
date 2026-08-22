import type { NextRequest } from 'next/server';

import { requireUser } from '@/auth/session';
import { ok, withApi } from '@/lib/api-handler';
import { prisma } from '@/lib/db';
import { getPath } from '@/services/path';
import { slugSchema } from '@/validation/diagnostic';

/** The learner's personalised path for a goal, with live decay applied. */
export const GET = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  const rawGoal = request.nextUrl.searchParams.get('goal');

  let goalSlug = '';
  if (rawGoal) {
    goalSlug = slugSchema.parse(rawGoal);
  } else {
    const profile = await prisma.learnerProfile.findUnique({
      where: { userId: user.id },
      select: { activeGoal: { select: { slug: true } } },
    });
    goalSlug = profile?.activeGoal?.slug ?? '';
  }

  if (!goalSlug) {
    return ok(null);
  }

  return ok(await getPath(user.id, goalSlug));
});
