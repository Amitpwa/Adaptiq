import 'server-only';

import { prisma } from '@/lib/db';
import { ForbiddenError, UnauthenticatedError } from '@/lib/errors';
import { auth } from './config';

export type Role = 'LEARNER' | 'INSTRUCTOR' | 'ADMIN';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/**
 * Resolve the signed-in user from the session cookie, verified against the
 * database.
 *
 * The database read is deliberate and not an optimisation target. A JWT is
 * held by the client and stays valid until it expires, so a user who was
 * deleted, demoted, or disabled would keep whatever the token claims. Re-reading
 * costs one indexed primary-key lookup and closes that window.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role as Role };
}

/** Require an authenticated user, or throw a 401. */
export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) throw UnauthenticatedError();
  return user;
}

/**
 * Require one of the given roles, or throw a 403.
 *
 * Role comes from the freshly-read database record, never from the token.
 */
export async function requireRole(...roles: readonly Role[]): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw ForbiddenError('Your account does not have access to this area.');
  }
  return user;
}

/**
 * Assert that a resource belongs to the current user.
 *
 * Ownership is normally enforced in the query itself (`where: { id, userId }`),
 * which is stronger because it cannot be forgotten at the call site. This
 * helper covers the cases where a record has already been fetched.
 */
export function assertOwnership(resourceUserId: string, currentUserId: string): void {
  if (resourceUserId !== currentUserId) {
    // Deliberately the same message a missing resource would produce, so the
    // response cannot be used to probe which ids exist.
    throw ForbiddenError('That resource does not exist or is not yours.');
  }
}
