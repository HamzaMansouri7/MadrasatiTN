/**
 * Provider / model / key cooldown tracking for AI fallback chains.
 */

import { classifyProviderError } from './error-class';

const cooldowns = new Map<string, number>();

export const statusOf = (err: unknown): string => {
  const m = err instanceof Error ? err.message : String(err);
  const code = m.match(/\b(401|402|403|404|422|429|500|503|504)\b/)?.[1];
  if (code) return code;
  if (/RESOURCE_EXHAUSTED/.test(m)) return '429';
  if (/UNAVAILABLE/.test(m)) return '503';
  if (/DEADLINE_EXCEEDED|Deadline expired/.test(m)) return '504';
  if (/no longer available/.test(m)) return '404';
  return '?';
};

export const isProviderExhausted = (err: unknown): boolean =>
  /\b(401|402|403|404|422|429|500|503|504)\b|RESOURCE_EXHAUSTED|UNAVAILABLE|DEADLINE_EXCEEDED|Deadline expired|no longer available/.test(
    err instanceof Error ? err.message : String(err),
  );

export function markCooldown(
  provider: string,
  model: string,
  key: string | number = '*',
  err?: unknown,
): string {
  const m = err instanceof Error ? err.message : String(err ?? '');
  const classification = classifyProviderError(m);
  const now = Date.now();
  const dur = classification.cooldownMs || 2 * 60 * 1000;

  if (classification.providerWide) {
    cooldowns.set(`${provider}|*|*`, now + dur);
  } else if (classification.kind === 'overload') {
    cooldowns.set(`${provider}|${model}|*`, now + dur);
  } else {
    cooldowns.set(`${provider}|${model}|${key}`, now + dur);
  }

  return statusOf(err);
}

export function isCoolingDown(
  provider: string,
  model: string,
  key: string | number = '*',
): boolean {
  const now = Date.now();
  const providerWide = cooldowns.get(`${provider}|*|*`) ?? 0;
  if (providerWide > now) return true;

  const modelWide = cooldowns.get(`${provider}|${model}|*`) ?? 0;
  if (modelWide > now) return true;

  const keySpecific = cooldowns.get(`${provider}|${model}|${key}`) ?? 0;
  return keySpecific > now;
}

export function clearCooldowns(): void {
  cooldowns.clear();
}
