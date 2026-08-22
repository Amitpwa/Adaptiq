import { z } from 'zod';

/** Slugs are our own identifiers; constrain them rather than accepting free text. */
export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9-]+$/, 'That is not a valid identifier.');

export const startDiagnosticSchema = z.object({ goalSlug: slugSchema }).strict();

/**
 * An answer is either a chosen option or free text, never both.
 *
 * `.strict()` plus the refinement means a client cannot smuggle in extra
 * fields or send an empty submission that grading would have to guess at.
 */
export const submitAnswerSchema = z
  .object({
    itemId: z.string().min(1).max(64),
    optionId: z.string().min(1).max(64).optional(),
    text: z.string().max(500).optional(),
  })
  .strict()
  .refine((value) => Boolean(value.optionId) || Boolean(value.text?.trim()), {
    message: 'Choose an option or type an answer.',
  });

export type StartDiagnosticInput = z.infer<typeof startDiagnosticSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
