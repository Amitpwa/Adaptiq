import 'server-only';

import { z } from 'zod';

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.string().default('postgresql://localhost:5432/postgres'),
  DIRECT_URL: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),

  AUTH_SECRET: z.string().default('default-fallback-build-secret-key-32-chars-long'),
  AUTH_URL: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),

  ANTHROPIC_API_KEY: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-5'),
  AI_TIMEOUT_MS: z.preprocess((v) => (v === '' || v === undefined ? 3500 : Number(v)), z.number().default(3500)),

  COMMUNITY_LLM_API_KEY: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  COMMUNITY_LLM_BASE_URL: z.preprocess((v) => (v === '' || v === undefined ? 'https://openrouter.ai/api/v1' : v), z.string().default('https://openrouter.ai/api/v1')),
  COMMUNITY_LLM_MODEL: z.string().default('meta-llama/llama-3.3-70b-instruct:free'),

  ENCRYPTION_KEY: z.string().default('EpKtg9P9pqu/M9TFTH9QbcXHpfsII70iJRkC/BMzldk='),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function loadServerEnv(): ServerEnv {
  try {
    const parsed = serverEnvSchema.safeParse(process.env);
    if (!parsed.success) {
      return serverEnvSchema.parse({});
    }
    return parsed.data;
  } catch {
    return serverEnvSchema.parse({});
  }
}

export const env: ServerEnv = loadServerEnv();

export const hasDeploymentLlm = (): boolean =>
  Boolean(env.ANTHROPIC_API_KEY) || Boolean(env.COMMUNITY_LLM_API_KEY);
