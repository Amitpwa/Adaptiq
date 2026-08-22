import 'server-only';

import { decryptSecret } from '@/lib/crypto';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';

import { assertAllowedModel, findModel, type ProviderId } from './models';
import { createBackend, type LlmBackend } from './provider';

/**
 * Which source of language-model capability a request ended up using.
 *
 * This is surfaced in the UI on every generated explanation and hint, because
 * a learner should always know whether they are reading model output, and
 * whose model produced it.
 */
export type LlmTier =
  /** The learner connected their own key. */
  | 'LEARNER_KEY'
  /** A deployment-wide commercial key, set by whoever runs this instance. */
  | 'DEPLOYMENT_KEY'
  /** A free, open-weights model via an OpenAI-compatible community gateway. */
  | 'COMMUNITY_FREE'
  /** No model available: curated content and the database hint ladder. */
  | 'DETERMINISTIC';

export interface ResolvedLlm {
  tier: LlmTier;
  backend: LlmBackend | null;
  model: string | null;
  /** Short label shown next to generated content. */
  attribution: string;
  /** True when the model is open-weights. */
  openSource: boolean;
}

const DETERMINISTIC: ResolvedLlm = {
  tier: 'DETERMINISTIC',
  backend: null,
  model: null,
  attribution: 'Curated content',
  openSource: false,
};

/**
 * Pick the best available language-model source for a learner, in priority
 * order.
 *
 * The ordering is deliberate:
 *
 *   1. LEARNER_KEY     — their key, their choice of model, their quota. If a
 *                        learner has connected one, using anything else would
 *                        ignore an explicit preference.
 *   2. DEPLOYMENT_KEY  — the operator's commercial key, if they configured one.
 *   3. COMMUNITY_FREE  — an open-weights model (Llama / Qwen / Mistral) served
 *                        free through an OpenAI-compatible gateway. This is what
 *                        lets the product work for a learner who has no key and
 *                        no intention of getting one.
 *   4. DETERMINISTIC   — curated explanations and the database-backed Socratic
 *                        hint ladder. Fully functional, just not generative.
 *
 * Note on tier 3: Vercel has no GPU and a hard bundle limit, so "run an open
 * model ourselves" is not available (see DAR D7). Serving open weights means
 * calling a hosted gateway, which needs one operator-level key set once at
 * deploy time — learners never see it. If that key is absent the system falls
 * to tier 4 rather than pretending.
 */
export async function resolveLlmForUser(userId: string | null): Promise<ResolvedLlm> {
  if (userId) {
    const learnerBackend = await resolveLearnerKey(userId);
    if (learnerBackend) return learnerBackend;
  }

  if (env.ANTHROPIC_API_KEY) {
    return {
      tier: 'DEPLOYMENT_KEY',
      backend: createBackend('ANTHROPIC', { apiKey: env.ANTHROPIC_API_KEY }),
      model: env.ANTHROPIC_MODEL,
      attribution: 'Adaptiq AI',
      openSource: false,
    };
  }

  if (env.COMMUNITY_LLM_API_KEY) {
    const model = findModel(env.COMMUNITY_LLM_MODEL);
    if (model) {
      return {
        tier: 'COMMUNITY_FREE',
        backend: createBackend('OPENAI', {
          apiKey: env.COMMUNITY_LLM_API_KEY,
          baseUrl: env.COMMUNITY_LLM_BASE_URL,
        }),
        model: model.id,
        attribution: `${model.label.replace(' (open source, free)', '')} · open source`,
        openSource: true,
      };
    }
  }

  return DETERMINISTIC;
}

async function resolveLearnerKey(userId: string): Promise<ResolvedLlm | null> {
  const credential = await prisma.llmCredential.findFirst({
    // Scoped by userId from the session — a learner can only ever resolve
    // their own credential.
    where: { userId, status: { in: ['VERIFIED', 'UNVERIFIED'] } },
    orderBy: { lastVerifiedAt: 'desc' },
  });

  if (!credential?.model) return null;

  let apiKey: string;
  try {
    apiKey = decryptSecret(credential.ciphertext);
  } catch {
    // A ciphertext that will not decrypt is unusable — most likely
    // ENCRYPTION_KEY was rotated. Mark it so the learner is asked to
    // reconnect rather than silently getting no AI.
    await prisma.llmCredential.update({
      where: { id: credential.id },
      data: { status: 'INVALID', lastError: 'Stored key could not be decrypted. Please reconnect.' },
    });
    return null;
  }

  let modelSpec;
  try {
    modelSpec = assertAllowedModel(credential.model, credential.provider as ProviderId);
  } catch {
    return null;
  }

  return {
    tier: 'LEARNER_KEY',
    backend: createBackend(credential.provider as ProviderId, { apiKey }),
    model: modelSpec.id,
    attribution: `${modelSpec.label} · your key`,
    openSource: modelSpec.openSource,
  };
}

/** Whether generative features are available at all for this learner. */
export function isGenerative(resolved: ResolvedLlm): boolean {
  return resolved.tier !== 'DETERMINISTIC' && resolved.backend !== null;
}
