import { z } from 'zod';

export const updatePreferencesSchema = z
  .object({
    preferredLens: z.enum(['ANALOGY', 'FIRST_PRINCIPLES', 'CODE', 'VISUAL']),
    motionPreference: z.enum(['SYSTEM', 'FULL', 'REDUCED']).optional(),
  })
  .strict();

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
