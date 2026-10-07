import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getChain, isStepConfigured } from './registry';
import { ProviderStep } from './types';

describe('ai registry', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('drops steps when API key is missing', () => {
    delete process.env['GEMINI_API_KEY'];
    delete process.env['GEMINI_API_KEY_1'];
    delete process.env['OPENROUTER_API_KEY'];
    delete process.env['CLOUDFLARE_ACCOUNT_ID'];
    delete process.env['CLOUDFLARE_API_TOKEN'];

    const geminiStep: ProviderStep = {
      id: 'gemini-3.6-flash',
      provider: 'gemini',
      model: 'gemini-3.6-flash',
      quality: 9,
      tasks: ['text'],
    };
    expect(isStepConfigured(geminiStep)).toBe(false);

    const chainA = getChain('A');
    expect(chainA).toHaveLength(0);
  });

  it('keeps steps when matching keys are present in env', () => {
    process.env['GEMINI_API_KEY'] = 'test-gemini-key';
    delete process.env['OPENROUTER_API_KEY'];
    delete process.env['CLOUDFLARE_ACCOUNT_ID'];
    delete process.env['CLOUDFLARE_API_TOKEN'];

    const chainA = getChain('A');
    expect(chainA.length).toBeGreaterThan(0);
    expect(chainA.every(step => step.provider === 'gemini')).toBe(true);
  });

  it('keeps cloudflare and openrouter steps when their keys are configured', () => {
    delete process.env['GEMINI_API_KEY'];
    process.env['OPENROUTER_API_KEY'] = 'test-openrouter-key';
    process.env['CLOUDFLARE_ACCOUNT_ID'] = '0123456789abcdef0123456789abcdef';
    process.env['CLOUDFLARE_API_TOKEN'] = 'test-token';

    const chainA = getChain('A');
    expect(chainA.some(s => s.provider === 'cloudflare')).toBe(true);
    expect(chainA.some(s => s.provider === 'openai-compat')).toBe(true);
    expect(chainA.some(s => s.provider === 'gemini')).toBe(false);
  });
});
