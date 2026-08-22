import { z } from 'zod';

export const llmProviderSchema = z.enum(['ANTHROPIC', 'OPENAI', 'OPENAI_COMPATIBLE', 'OLLAMA']);

export const addCredentialSchema = z.object({
  provider: llmProviderSchema,
  apiKey: z.string().min(1, 'API key cannot be empty'),
  baseUrl: z.string().url().optional(),
  model: z.string().min(1, 'Model name is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(100),
  cognitivePreference: z.enum(['ANALOGY', 'FIRST_PRINCIPLES', 'CODE', 'VISUAL']),
  motionPreference: z.enum(['SYSTEM', 'FULL', 'REDUCED']),
});
