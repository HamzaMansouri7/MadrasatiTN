import { describe, it, expect } from 'vitest';
import { classifyProviderError } from './error-class';

describe('classifyProviderError', () => {
  it('treats the Cloudflare daily allowance as a long provider-wide pause', () => {
    const c = classifyProviderError('AiError: you have used up your daily free allocation of 10,000 neurons');
    expect(c).toEqual({ kind: 'quota-daily', cooldownMs: 3_600_000, providerWide: true });
  });
  it('429 is a 2 minute per-model pause', () => {
    expect(classifyProviderError('HTTP 429 quota')).toMatchObject({ kind: 'rate', cooldownMs: 120_000, providerWide: false });
  });
  it('503/504 are 30 s overloads', () => {
    expect(classifyProviderError('HTTP 503 high demand').cooldownMs).toBe(30_000);
    expect(classifyProviderError('DEADLINE_EXCEEDED').kind).toBe('overload');
  });
  it('422 invalid output is 15 s', () => {
    expect(classifyProviderError('422 invalid output: x').cooldownMs).toBe(15_000);
  });
  it('401-404 and agreement errors are 30 minutes', () => {
    expect(classifyProviderError('HTTP 404 no longer available').cooldownMs).toBe(1_800_000);
    expect(classifyProviderError('403 Model Agreement: submit agree').kind).toBe('auth');
  });
  it('unknown errors get no cooldown', () => {
    expect(classifyProviderError('weird')).toEqual({ kind: 'other', cooldownMs: 0, providerWide: false });
  });
});
