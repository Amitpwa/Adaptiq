import { describe, expect, it, vi } from 'vitest';
import { createBackend, type CompletionRequest } from '@/ai/provider';
import { findModel } from '@/ai/models';

describe('ai/provider integration and Generative AI protocol compliance', () => {
  it('instantiates OpenAI-compatible provider and validates payload schema', async () => {
    const backend = createBackend('OPENAI', {
      apiKey: 'sk-test-mock-api-key-1234567890abcdef',
      baseUrl: 'https://openrouter.ai/api/v1',
    });

    expect(backend.provider).toBe('OPENAI');

    const fakeFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Socratic hint: Have you considered matrix dimensions?' } }],
        usage: { prompt_tokens: 45, completion_tokens: 18 },
      }),
    });
    vi.stubGlobal('fetch', fakeFetch);

    const request: CompletionRequest = {
      system: 'You are a Socratic tutor. Guide the learner without giving away the direct answer.',
      messages: [{ role: 'user', content: 'What is matrix multiplication?' }],
      maxTokens: 150,
      temperature: 0.2,
      model: 'meta-llama/llama-3.3-70b-instruct:free',
    };

    const controller = new AbortController();
    const result = await backend.complete(request, controller.signal);

    expect(result.content).toBe('Socratic hint: Have you considered matrix dimensions?');
    expect(result.tokensIn).toBe(45);
    expect(result.tokensOut).toBe(18);
    expect(result.model).toBe('meta-llama/llama-3.3-70b-instruct:free');
    expect(fakeFetch).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it('instantiates Anthropic provider with Messages API protocol', async () => {
    const backend = createBackend('ANTHROPIC', {
      apiKey: 'sk-ant-api03-testkey-1234567890abcdef12345678',
    });

    expect(backend.provider).toBe('ANTHROPIC');

    const fakeFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: 'Step 1: Check if inner matrix dimensions match.' }],
        usage: { input_tokens: 30, output_tokens: 15 },
      }),
    });
    vi.stubGlobal('fetch', fakeFetch);

    const request: CompletionRequest = {
      system: 'You are a Socratic tutor.',
      messages: [{ role: 'user', content: 'How do I multiply A and B?' }],
      maxTokens: 100,
      temperature: 0.1,
      model: 'claude-haiku-4-5-20251001',
    };

    const controller = new AbortController();
    const result = await backend.complete(request, controller.signal);

    expect(result.content).toBe('Step 1: Check if inner matrix dimensions match.');
    expect(result.tokensIn).toBe(30);
    expect(result.tokensOut).toBe(15);
    expect(fakeFetch).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it('handles auth errors gracefully with LlmAuthError', async () => {
    const backend = createBackend('OPENAI', {
      apiKey: 'sk-invalid-key-example-1234567890',
    });

    const fakeFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Invalid API key provided',
    });
    vi.stubGlobal('fetch', fakeFetch);

    const request: CompletionRequest = {
      system: 'System prompt',
      messages: [{ role: 'user', content: 'User prompt' }],
      maxTokens: 50,
      temperature: 0.2,
      model: 'gpt-4o-mini',
    };

    const controller = new AbortController();
    await expect(backend.complete(request, controller.signal)).rejects.toThrow();

    vi.unstubAllGlobals();
  });

  it('supports open weights free models with zero configuration', () => {
    const freeModels = ['meta-llama/llama-3.3-70b-instruct:free', 'qwen/qwen-2.5-72b-instruct:free'];
    for (const modelId of freeModels) {
      const model = findModel(modelId);
      expect(model).toBeDefined();
      expect(model?.openSource).toBe(true);
      expect(model?.free).toBe(true);
    }
  });
});
