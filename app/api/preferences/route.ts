import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { requireUser } from '@/auth/session';
import { ok, withApi } from '@/lib/api-handler';
import { prisma } from '@/lib/db';
import { ValidationError } from '@/lib/errors';

/**
 * Learner preferences.
 *
 * `.strict()` with enum-bounded values: only these two fields are writable, so
 * this endpoint cannot be used to reach onboarding stage, the active goal, or
 * anything else on the profile.
 */
const preferencesSchema = z
  .object({
    preferredLens: z.enum(['ANALOGY', 'FIRST_PRINCIPLES', 'CODE', 'VISUAL']).optional(),
    motionPreference: z.enum(['SYSTEM', 'FULL', 'REDUCED']).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: 'Nothing to update.' });

export const PATCH = withApi(async (request: NextRequest) => {
  const user = await requireUser();

  const body: unknown = await request.json().catch(() => {
    throw ValidationError('Expected a JSON body.');
  });
  const input = preferencesSchema.parse(body);

  const profile = await prisma.learnerProfile.update({
    where: { userId: user.id },
    data: {
      ...(input.preferredLens ? { cognitivePreference: input.preferredLens } : {}),
      ...(input.motionPreference ? { motionPreference: input.motionPreference } : {}),
      ...(input.preferredLens ? { onboardingStage: 'PREFERENCES_SET' as const } : {}),
    },
    select: { cognitivePreference: true, motionPreference: true },
  });

  return ok({ preferredLens: profile.cognitivePreference, motionPreference: profile.motionPreference });
});
