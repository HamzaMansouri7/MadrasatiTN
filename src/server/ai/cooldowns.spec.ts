import { describe, it, expect, beforeEach } from 'vitest';
import { markCooldown, isCoolingDown, clearCooldowns, statusOf } from './cooldowns';

describe('ai cooldowns', () => {
  beforeEach(() => {
    clearCooldowns();
  });

  it('detects HTTP status codes and error messages', () => {
    expect(statusOf(new Error('HTTP 503 high demand'))).toBe('503');
    expect(statusOf(new Error('RESOURCE_EXHAUSTED'))).toBe('429');
    expect(statusOf(new Error('422 invalid output'))).toBe('422');
  });

  it('marks model-wide cooldown on 503', () => {
    markCooldown('gemini', 'gemini-3.7-flash', 1, new Error('HTTP 503'));
    expect(isCoolingDown('gemini', 'gemini-3.7-flash', 1)).toBe(true);
    expect(isCoolingDown('gemini', 'gemini-3.7-flash', 2)).toBe(true);
    expect(isCoolingDown('gemini', 'gemini-3.6-flash', 1)).toBe(false);
  });

  it('marks per-key cooldown on 429', () => {
    markCooldown('gemini', 'gemini-3.6-flash', 1, new Error('HTTP 429'));
    expect(isCoolingDown('gemini', 'gemini-3.6-flash', 1)).toBe(true);
    expect(isCoolingDown('gemini', 'gemini-3.6-flash', 2)).toBe(false);
  });
});
