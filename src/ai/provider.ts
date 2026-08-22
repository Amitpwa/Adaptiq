import 'server-only';

import { PROVIDERS, type ProviderId, type ProviderSpec } from './models';

/**
 * The port every language-model backend satisfies.
 *
 * Two wire protocols are implemented (Anthropic Messages, OpenAI chat
 * completions). The OpenAI-compatible one is deliberately generic: OpenRouter,
 * Groq, Together, DeepInfra and a local Ollama all speak it, so serving an
 * open-weights model is a base-URL change rather than new code.
 */

export interface CompletionRequest {
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens: number;
  /** Low by default: pedagogical output should be stable, not creative. */
  temperature: number;
  model: string;
}

export interface CompletionResult {
  content: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
}

export interface LlmBackend {
  readonly provider: ProviderId;
  complete(request: CompletionRequest, signal: AbortSignal): Promise<CompletionResult>;
}

export class LlmAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmAuthError';
  }
}

export class LlmUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmUnavailableError';
  }
}

interface BackendConfig {
  apiKey: string;
  /** Overrides the provider default; how open-model gateways are targeted. */
  baseUrl?: string;
}

/** Anthropic Messages API. */
class AnthropicBackend implements LlmBackend {
  readonly provider: ProviderId = 'ANTHROPIC';
  private readonly spec: ProviderSpec = PROVIDERS.ANTHROPIC;

  constructor(private readonly config: BackendConfig) {}

  async complete(request: CompletionRequest, signal: AbortSignal): Promise<CompletionResult> {
    const startedAt = Date.now();
    const baseUrl = this.config.baseUrl ?? this.spec.baseUrl;

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        system: request.system,
        messages: request.messages,
      }),
    });

    if (!response.ok) throw await toError(response);

    const payload = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const content = (payload.content ?? [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('')
      .trim();

    return {
      content,
      model: request.model,
      tokensIn: payload.usage?.input_tokens ?? 0,
      tokensOut: payload.usage?.output_tokens ?? 0,
      latencyMs: Date.now() - startedAt,
    };
  }
}

/**
 * OpenAI chat-completions shape.
 *
 * Covers OpenAI itself and every gateway that mirrors it — which is how
 * Adaptiq serves open-weights models without a second code path.
 */
class OpenAiCompatibleBackend implements LlmBackend {
  readonly provider: ProviderId = 'OPENAI';
  private readonly spec: ProviderSpec = PROVIDERS.OPENAI;

  constructor(private readonly config: BackendConfig) {}

  async complete(request: CompletionRequest, signal: AbortSignal): Promise<CompletionResult> {
    const startedAt = Date.now();
    const baseUrl = this.config.baseUrl ?? this.spec.baseUrl;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        messages: [{ role: 'system', content: request.system }, ...request.messages],
      }),
    });

    if (!response.ok) throw await toError(response);

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    return {
      content: (payload.choices?.[0]?.message?.content ?? '').trim(),
      model: request.model,
      tokensIn: payload.usage?.prompt_tokens ?? 0,
      tokensOut: payload.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - startedAt,
    };
  }
}

/**
 * Convert an upstream failure into our own error types.
 *
 * The distinction matters downstream: an auth failure should mark the
 * learner's stored credential invalid and prompt them to reconnect, whereas an
 * outage or rate limit should quietly fall through to the next tier.
 */
async function toError(response: Response): Promise<Error> {
  const body = await response.text().catch(() => '');
  // Never echo the raw upstream body to a learner; it can contain request
  // details. Keep a short, sanitised excerpt for the server log only.
  const excerpt = body.slice(0, 200);

  if (response.status === 401 || response.status === 403) {
    return new LlmAuthError(`Provider rejected the API key (HTTP ${response.status}): ${excerpt}`);
  }
  return new LlmUnavailableError(`Provider error (HTTP ${response.status}): ${excerpt}`);
}

export function createBackend(provider: ProviderId, config: BackendConfig): LlmBackend {
  return provider === 'ANTHROPIC'
    ? new AnthropicBackend(config)
    : new OpenAiCompatibleBackend(config);
}
