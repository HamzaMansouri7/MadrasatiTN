import { describe, expect, it } from 'vitest';
import { firstImageUrl } from './docs.routes';

describe('firstImageUrl', () => {
  it('prefers the hero picture of a sheet', () => {
    const doc = { values: { hero: { imageUrl: '/uploads/hero.webp' }, items: [{ imageUrl: '/uploads/a.webp' }] } };
    expect(firstImageUrl(doc)).toBe('/uploads/hero.webp');
  });

  it('falls back to the first item, column or scene picture', () => {
    expect(firstImageUrl({ values: { items: [{}, { imageUrl: '/uploads/b.webp' }] } })).toBe('/uploads/b.webp');
    expect(firstImageUrl({ values: { columns: [{ imageUrl: '/uploads/c.webp' }] } })).toBe('/uploads/c.webp');
    expect(firstImageUrl({ scenes: [{}, { imageUrl: '/uploads/s.webp' }] })).toBe('/uploads/s.webp');
  });

  it('ignores pictures that are not served from /uploads', () => {
    expect(firstImageUrl({ values: { hero: { imageUrl: 'https://evil.example/x.png' } } })).toBe('');
  });

  it('returns an empty string when there is no picture', () => {
    expect(firstImageUrl({ values: { items: [{ title: 'a' }] } })).toBe('');
    expect(firstImageUrl({})).toBe('');
  });
});
