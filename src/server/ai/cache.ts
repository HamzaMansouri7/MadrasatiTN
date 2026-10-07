import { createHash } from 'node:crypto';

/** Small in-memory TTL + LRU cache for AI responses (saves free quota on identical requests). */
export interface TtlCache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  size(): number;
}

/** Stable key: same fields in any order produce the same hash. */
export function hashKey(parts: Record<string, unknown>): string {
  const stable = JSON.stringify(parts, Object.keys(parts).sort());
  return createHash('sha256').update(stable).digest('hex');
}

export function createCache<T>(options: { ttlMs: number; max: number; now?: () => number }): TtlCache<T> {
  const { ttlMs, max } = options;
  const now = options.now ?? Date.now;
  const store = new Map<string, { value: T; expires: number }>();

  return {
    get(key) {
      const hit = store.get(key);
      if (!hit) return undefined;
      if (hit.expires <= now()) {
        store.delete(key);
        return undefined;
      }
      // Refresh recency (Map keeps insertion order).
      store.delete(key);
      store.set(key, hit);
      return hit.value;
    },
    set(key, value) {
      store.delete(key);
      store.set(key, { value, expires: now() + ttlMs });
      while (store.size > max) {
        const oldest = store.keys().next().value;
        if (oldest === undefined) break;
        store.delete(oldest);
      }
    },
    size: () => store.size,
  };
}
