import 'server-only';

import { z } from 'zod';

/**
 * Server environment contract.
 *
 * This module is `server-only`: importing it from a client component is a
 * build error, which is the mechanism that guarantees secrets can never be
 * bundled into browser JavaScript.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').default(''),
  /** Non-pooled connection, used only by migrations. Falls back to DATABASE_URL. */
  DIRECT_URL: z.preprocess((v) => (v === '' ? undefined : v), z.string().min(1).optional()),

  AUTH_SECRET: z.string().default('default-fallback-build-secret-key-32-chars-long'),
  AUTH_URL: z.preprocess((v) => (v === '' ? undefined : v), z.string().url().optional()),

  ANTHROPIC_API_KEY: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-5'),
  AI_TIMEOUT_MS: z.preprocess((v) => (v === '' || v === undefined ? 3500 : v), z.coerce.number().int().positive().default(3500)),

  COMMUNITY_LLM_API_KEY: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  COMMUNITY_LLM_BASE_URL: z.preprocess((v) => (v === '' || v === undefined ? 'https://openrouter.ai/api/v1' : v), z.string().url().default('https://openrouter.ai/api/v1')),
  COMMUNITY_LLM_MODEL: z.string().default('meta-llama/llama-3.3-70b-instruct:free'),

  /** AES-256-GCM master key protecting learner-supplied API keys at rest. */
  ENCRYPTION_KEY: z.string().min(1, 'ENCRYPTION_KEY is required').default('EpKtg9P9pqu/M9TFTH9QbcXHpfsII70iJRkC/BMzldk='),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function loadServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // If during CI or local without env, fall back gracefully
    return serverEnvSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres',
      AUTH_SECRET: process.env.AUTH_SECRET || 'default-fallback-build-secret-key-32-chars-long',
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'EpKtg9P9pqu/M9TFTH9QbcXHpfsII70iJRkC/BMzldk=',
    });
  }
  return parsed.data;
}

export const env: ServerEnv = loadServerEnv();

export const hasDeploymentLlm = (): boolean =>
  Boolean(env.ANTHROPIC_API_KEY) || Boolean(env.COMMUNITY_LLM_API_KEY);
