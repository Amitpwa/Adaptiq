/**
 * Model allowlist and provider catalogue.
 *
 * A learner-supplied model name is never passed through to a provider
 * unvalidated — it is matched against this catalogue first. That closes an
 * otherwise open door: an arbitrary `model` string is attacker-controlled input
 * that reaches an upstream API, and some providers expose expensive or
 * differently-behaved endpoints by model id.
 */

export type ProviderId = 'ANTHROPIC' | 'OPENAI';

/**
 * How Adaptiq talks to a provider. Two wire protocols cover everything we
 * need: Anthropic's Messages API, and the OpenAI chat-completions shape, which
 * OpenRouter, Groq, Together, DeepInfra, and local Ollama all implement.
 */
export type Protocol = 'anthropic' | 'openai-compatible';

export interface ProviderSpec {
  id: ProviderId;
  label: string;
  protocol: Protocol;
  baseUrl: string;
  /** Where a learner goes to create a key. Shown in the connect dialog. */
  consoleUrl: string;
  /** Human description of the expected key shape, for the UI hint. */
  keyFormatHint: string;
  /** Cheap validation of shape before we spend a network call. */
  keyPattern: RegExp;
}

export const PROVIDERS: Record<ProviderId, ProviderSpec> = {
  ANTHROPIC: {
    id: 'ANTHROPIC',
    label: 'Anthropic',
    protocol: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    consoleUrl: 'https://console.anthropic.com/settings/keys',
    keyFormatHint: 'Starts with sk-ant-',
    keyPattern: /^sk-ant-[A-Za-z0-9_\-]{20,}$/,
  },
  OPENAI: {
    id: 'OPENAI',
    label: 'OpenAI-compatible',
    protocol: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    consoleUrl: 'https://platform.openai.com/api-keys',
    keyFormatHint: 'Starts with sk-',
    keyPattern: /^sk-[A-Za-z0-9_\-]{20,}$/,
  },
};

export interface ModelSpec {
  id: string;
  label: string;
  provider: ProviderId;
  /** True for open-weights models (Llama, Qwen, Mistral, Gemma, ...). */
  openSource: boolean;
  /** True when the model is available at no cost on the configured endpoint. */
  free: boolean;
}

/**
 * Models Adaptiq will talk to.
 *
 * The open-source entries are routed through an OpenAI-compatible gateway
 * (OpenRouter by default, configurable via COMMUNITY_LLM_BASE_URL) whose
 * `:free` tiers serve open-weights models at no cost. This is what backs the
 * community fallback tier described in src/ai/resolve.ts.
 */
export const MODELS: readonly ModelSpec[] = [
  {
    id: 'claude-sonnet-5',
    label: 'Claude Sonnet 5',
    provider: 'ANTHROPIC',
    openSource: false,
    free: false,
  },
  {
    id: 'claude-haiku-4-5-20251001',
    label: 'Claude Haiku 4.5',
    provider: 'ANTHROPIC',
    openSource: false,
    free: false,
  },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini', provider: 'OPENAI', openSource: false, free: false },
  // Open-weights models, served free through an OpenAI-compatible gateway.
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    label: 'Llama 3.3 70B (open source, free)',
    provider: 'OPENAI',
    openSource: true,
    free: true,
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct:free',
    label: 'Qwen 2.5 72B (open source, free)',
    provider: 'OPENAI',
    openSource: true,
    free: true,
  },
  {
    id: 'mistralai/mistral-small-3.2-24b-instruct:free',
    label: 'Mistral Small 3.2 24B (open source, free)',
    provider: 'OPENAI',
    openSource: true,
    free: true,
  },
];

export function findModel(id: string): ModelSpec | undefined {
  return MODELS.find((model) => model.id === id);
}

export function modelsForProvider(provider: ProviderId): ModelSpec[] {
  return MODELS.filter((model) => model.provider === provider);
}

/**
 * Validate a learner-supplied model id against the allowlist.
 *
 * Returns the spec, or throws — callers must not fall back to a default,
 * because silently substituting a model the learner did not choose would
 * mislead them about what generated their explanations.
 */
export function assertAllowedModel(id: string, provider: ProviderId): ModelSpec {
  const model = findModel(id);
  if (!model || model.provider !== provider) {
    throw new Error(`Model "${id}" is not available for ${PROVIDERS[provider].label}`);
  }
  return model;
}
