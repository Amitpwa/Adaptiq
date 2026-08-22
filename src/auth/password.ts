import 'server-only';

import bcrypt from 'bcryptjs';

export { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, checkPasswordPolicy } from './password-policy';
export type { PasswordCheck } from './password-policy';

/**
 * Password hashing and policy.
 *
 * bcryptjs (pure JS) rather than a native binding: native modules are a
 * recurring build hazard on Vercel, and a deployment that fails to build is a
 * worse outcome than the marginal KDF strength difference. Cost 12 lands around
 * 250ms on the Vercel Node runtime — slow enough to make offline cracking
 * expensive, fast enough not to hurt sign-in.
 */

const COST = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * A bcrypt hash of a throwaway value, compared against when no user exists.
 *
 * Without this, sign-in for an unknown email returns fast while a known email
 * spends ~250ms hashing — a timing difference that reliably enumerates which
 * addresses have accounts.
 */
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEe.7ChpVpiQZUFYCK9QlZfXO5fkO1a3.Cy';

export async function burnTimingBudget(password: string): Promise<void> {
  await bcrypt.compare(password, DUMMY_HASH);
}
