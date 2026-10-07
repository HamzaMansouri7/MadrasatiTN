import { describe, it, expect } from 'vitest';
import { createCache, hashKey } from './cache';

describe('hashKey', () => {
  it('is order-independent and content-sensitive', () => {
    expect(hashKey({ a: 1, b: 2 })).toBe(hashKey({ b: 2, a: 1 }));
    expect(hashKey({ a: 1 })).not.toBe(hashKey({ a: 2 }));
    expect(hashKey({ a: 1 })).toHaveLength(64);
  });
});

describe('createCache', () => {
  it('returns stored values and misses unknown keys', () => {
    const c = createCache<string>({ ttlMs: 1000, max: 5 });
    c.set('k', 'v');
    expect(c.get('k')).toBe('v');
    expect(c.get('x')).toBeUndefined();
  });
  it('expires entries after the ttl', () => {
    let t = 0;
    const c = createCache<string>({ ttlMs: 1000, max: 5, now: () => t });
    c.set('k', 'v');
    t = 999;
    expect(c.get('k')).toBe('v');
    t = 1000;
    expect(c.get('k')).toBeUndefined();
    expect(c.size()).toBe(0);
  });
  it('evicts the least recently used entry beyond max', () => {
    const c = createCache<number>({ ttlMs: 1000, max: 2 });
    c.set('a', 1);
    c.set('b', 2);
    c.get('a'); // a becomes most recent
    c.set('c', 3); // evicts b
    expect(c.get('b')).toBeUndefined();
    expect(c.get('a')).toBe(1);
    expect(c.get('c')).toBe(3);
  });
});
