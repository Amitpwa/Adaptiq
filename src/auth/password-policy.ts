/**
 * Password policy.
 *
 * Deliberately free of the `server-only` marker and of any Node import: the
 * sign-up form needs these rules to give immediate feedback, and duplicating
 * them in the client would guarantee the two drift apart. The server still
 * re-runs every check — this module is shared logic, not a security boundary.
 */

/** Minimum length. Length dominates character-class rules for real strength. */
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 200;

/**
 * Passwords that are long but trivially guessable. A length rule alone happily
 * accepts "passwordpassword".
 */
const COMMON_PASSWORDS = new Set([
  'passwordpassword',
  'password123456',
  '123456789012',
  'qwertyuiopas',
  'adaptiqadaptiq',
  'letmeinletmein',
  'iloveyouiloveyou',
  'administrator',
  'welcome12345',
  'abcdefghijkl',
]);

export interface PasswordCheck {
  ok: boolean;
  message?: string;
}

/**
 * Validate a candidate password.
 *
 * Runs on the server as the security boundary; the same function backs the
 * client-side form hint so the learner sees consistent rules.
 */
export function checkPasswordPolicy(password: string, email?: string): PasswordCheck {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: `Use at least ${MIN_PASSWORD_LENGTH} characters. Longer is stronger than more symbols.`,
    };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    // Bounded to keep hashing cost predictable; an unbounded input is a cheap
    // way to make the server do expensive work.
    return { ok: false, message: `Keep it under ${MAX_PASSWORD_LENGTH} characters.` };
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, message: 'That password is too common. Pick something less predictable.' };
  }
  if (/^(.)\1+$/.test(password)) {
    return { ok: false, message: 'That password is a single repeated character.' };
  }
  if (email) {
    const localPart = email.split('@')[0]?.toLowerCase() ?? '';
    if (localPart.length >= 4 && password.toLowerCase().includes(localPart)) {
      return { ok: false, message: 'Your password should not contain your email address.' };
    }
  }
  return { ok: true };
}
