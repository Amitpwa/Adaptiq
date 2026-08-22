import type { NextRequest } from 'next/server';

import { checkPasswordPolicy, hashPassword } from '@/auth/password';
import { clientIdentifier, created, withApi } from '@/lib/api-handler';
import { prisma } from '@/lib/db';
import { ConflictError, ValidationError } from '@/lib/errors';
import { RATE_LIMITS, enforce } from '@/lib/rate-limit';
import { registerSchema } from '@/validation/auth';

/**
 * Create a learner account.
 *
 * Also creates the LearnerProfile in the same transaction: a user without a
 * profile is an invalid state the rest of the application would have to defend
 * against on every read, so it must never exist even briefly.
 */
export const POST = withApi(async (request: NextRequest) => {
  await enforce(RATE_LIMITS.REGISTER, clientIdentifier(request));

  const body: unknown = await request.json().catch(() => {
    throw ValidationError('Expected a JSON body.');
  });

  const { name, email, password } = registerSchema.parse(body);

  const policy = checkPasswordPolicy(password, email);
  if (!policy.ok) {
    throw ValidationError(policy.message ?? 'That password is not strong enough.');
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    // Registration necessarily reveals whether an address is taken — there is
    // no way to create an account without it. Sign-in, where enumeration
    // actually matters, gives a uniform response instead.
    throw ConflictError('An account with that email already exists. Try signing in.');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: { name, email, passwordHash, role: 'LEARNER' },
      select: { id: true, email: true, name: true },
    });
    await tx.learnerProfile.create({
      data: { userId: createdUser.id, onboardingStage: 'REGISTERED' },
    });
    await tx.activityEvent.create({
      data: { userId: createdUser.id, type: 'ACCOUNT_CREATED' },
    });
    return createdUser;
  });

  // The password hash is never part of any response shape.
  return created({ id: user.id, email: user.email, name: user.name });
});
