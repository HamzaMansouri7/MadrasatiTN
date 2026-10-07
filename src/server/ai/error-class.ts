/**
 * Classifies a provider error message into a cooldown. Mirrors the status rules in cooldowns.ts and adds the
 * Cloudflare Workers AI daily allowance (10,000 neurons/day, shared by text and image models), which must
 * pause the provider for a long time instead of failing every request in turn.
 */
export type ErrorKind = 'quota-daily' | 'rate' | 'overload' | 'invalid' | 'auth' | 'other';

export interface ErrorClass {
  kind: ErrorKind;
  cooldownMs: number;
  /** true = the whole provider is out, not just one model/key. */
  providerWide: boolean;
}

const MIN = 60 * 1000;

export function classifyProviderError(message: string): ErrorClass {
  const m = String(message ?? '');
  if (/daily free allocation|used up your daily/i.test(m)) return { kind: 'quota-daily', cooldownMs: 60 * MIN, providerWide: true };
  if (/\b429\b|RESOURCE_EXHAUSTED|rate.?limit/i.test(m)) return { kind: 'rate', cooldownMs: 2 * MIN, providerWide: false };
  if (/\b(500|503|504)\b|UNAVAILABLE|DEADLINE_EXCEEDED|high demand/i.test(m)) return { kind: 'overload', cooldownMs: 30 * 1000, providerWide: false };
  if (/\b422\b|invalid output/i.test(m)) return { kind: 'invalid', cooldownMs: 15 * 1000, providerWide: false };
  if (/\b(401|402|403|404)\b|no longer available|Model Agreement/i.test(m)) return { kind: 'auth', cooldownMs: 30 * MIN, providerWide: false };
  return { kind: 'other', cooldownMs: 0, providerWide: false };
}
