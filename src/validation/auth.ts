import { z } from 'zod';

import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@/auth/password-policy';

/**
 * Auth request schemas.
 *
 * `.strict()` on every write schema is the mass-assignment defence: a client
 * that posts `{ email, password, role: "ADMIN" }` is rejected outright rather
 * than having the extra field silently ignored (or worse, honoured).
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .max(254)
  .email('That does not look like an email address.')
  .transform((value) => value.toLowerCase());

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Enter your name.')
      .max(80, 'That name is too long.'),
    email: emailSchema,
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
      .max(MAX_PASSWORD_LENGTH),
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Enter your password.'),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
