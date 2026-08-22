import 'server-only';

import { z } from 'zod';

/**
 * Server environment contract.
 *
 * This module is `server-only`: importing it from a client component is a
 * build error, which is the mechanism that guarantees secrets can never be
 * bundled into browser JavaScript.
 *
 * Validation runs once at module load and throws on a misconfigured
 * deployment, so the application fails at boot with a readable message rather
 * than at the first database call with a stack trace.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  /** Non-pooled connection, used only by migrations. Falls back to DATABASE_URL. */
  DIRECT_URL: z.string().min(1).optional(),

  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  AUTH_URL: z.string().url().optional(),

  /**
   * Optional. Absent means Adaptiq runs in deterministic mode: curated content
   * and the database-backed Socratic hint ladder. This is a supported path,
   * not a degraded one, and it is covered by tests.
   */
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-5'),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(3500),

  /**
   * Community tier: a free, open-weights model served through an
   * OpenAI-compatible gateway. One operator-level key set at deploy time means
   * learners with no key of their own still get generative explanations.
   */
  COMMUNITY_LLM_API_KEY: z.string().optional(),
  COMMUNITY_LLM_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  COMMUNITY_LLM_MODEL: z.string().default('meta-llama/llama-3.3-70b-instruct:free'),

  /** AES-256-GCM master key protecting learner-supplied API keys at rest. */
  ENCRYPTION_KEY: z.string().min(1, 'ENCRYPTION_KEY is required'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function loadServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid server environment configuration:\n${issues}\n\n` +
        'Copy .env.example to .env and fill in the required values.',
    );
  }
  return parsed.data;
}

export const env: ServerEnv = loadServerEnv();

/**
 * Whether any deployment-level model is configured.
 *
 * Learners may still have generative features through their own connected key
 * even when this is false — see src/ai/resolve.ts for the full tier order.
 */
export const hasDeploymentLlm = (): boolean =>
  Boolean(env.ANTHROPIC_API_KEY) || Boolean(env.COMMUNITY_LLM_API_KEY);
