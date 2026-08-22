import { describe, expect, it } from 'vitest';
import {
  MODELS,
  PROVIDERS,
  findModel,
  modelsForProvider,
  assertAllowedModel,
} from '@/ai/models';

describe('ai/models', () => {
  it('defines providers with strict key pattern validation', () => {
    expect(MODELS.length).toBeGreaterThan(0);
    expect(PROVIDERS.ANTHROPIC.keyPattern.test('sk-ant-api03-abcdef1234567890abcdef123456')).toBe(true);
    expect(PROVIDERS.ANTHROPIC.keyPattern.test('invalid-key')).toBe(false);

    expect(PROVIDERS.OPENAI.keyPattern.test('sk-proj-abcdef1234567890abcdef1234567890')).toBe(true);
    expect(PROVIDERS.OPENAI.keyPattern.test('bad-key')).toBe(false);
  });

  it('finds existing models by ID', () => {
    const claude = findModel('claude-sonnet-5');
    expect(claude).toBeDefined();
    expect(claude?.provider).toBe('ANTHROPIC');
    expect(claude?.openSource).toBe(false);

    const llama = findModel('meta-llama/llama-3.3-70b-instruct:free');
    expect(llama).toBeDefined();
    expect(llama?.openSource).toBe(true);
    expect(llama?.free).toBe(true);
  });

  it('returns undefined for non-existent model ID', () => {
    expect(findModel('non-existent-model-xyz')).toBeUndefined();
  });

  it('filters models by provider', () => {
    const anthropicModels = modelsForProvider('ANTHROPIC');
    expect(anthropicModels.length).toBeGreaterThan(0);
    expect(anthropicModels.every((m) => m.provider === 'ANTHROPIC')).toBe(true);

    const openAiModels = modelsForProvider('OPENAI');
    expect(openAiModels.length).toBeGreaterThan(0);
    expect(openAiModels.every((m) => m.provider === 'OPENAI')).toBe(true);
  });

  it('asserts allowed model and throws on unlisted or mismatched provider model', () => {
    const model = assertAllowedModel('gpt-4o-mini', 'OPENAI');
    expect(model.id).toBe('gpt-4o-mini');

    expect(() => assertAllowedModel('gpt-4o-mini', 'ANTHROPIC')).toThrow(
      'Model "gpt-4o-mini" is not available for Anthropic',
    );
    expect(() => assertAllowedModel('unknown-model', 'OPENAI')).toThrow(
      'Model "unknown-model" is not available for OpenAI-compatible',
    );
  });
});
