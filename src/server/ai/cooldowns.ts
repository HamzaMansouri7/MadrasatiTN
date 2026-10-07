/**
 * Provider / model / key cooldown tracking for AI fallback chains.
 */

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
  const status = err ? statusOf(err) : '429';
  const now = Date.now();

  if (status === '503' || status === '504' || status === '500') {
    // Model-wide cooldown across all keys for that model
    cooldowns.set(`${provider}|${model}|*`, now + 30 * 1000);
  } else if (status === '429') {
    cooldowns.set(`${provider}|${model}|${key}`, now + 2 * 60 * 1000);
  } else if (status === '422') {
    cooldowns.set(`${provider}|${model}|${key}`, now + 15 * 1000);
  } else {
    // 401, 403, 404 long cooldown
    cooldowns.set(`${provider}|${model}|${key}`, now + 30 * 60 * 1000);
  }

  return status;
}

export function isCoolingDown(
  provider: string,
  model: string,
  key: string | number = '*',
): boolean {
  const now = Date.now();
  const modelWide = cooldowns.get(`${provider}|${model}|*`) ?? 0;
  if (modelWide > now) return true;

  const keySpecific = cooldowns.get(`${provider}|${model}|${key}`) ?? 0;
  return keySpecific > now;
}

export function clearCooldowns(): void {
  cooldowns.clear();
}
