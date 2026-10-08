import { describe, expect, it } from 'vitest';
import { normalizeInfographicSpec, sanitizeSvg } from './infographic-spec.util';

const item = (n: number) => ({ title: `T${n}`, text: `Texte ${n}`, icon: 'bolt' });

describe('sanitizeSvg', () => {
  it('keeps a plain svg', () => {
    const out = sanitizeSvg('<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#fff"/></svg>');
    expect(out).toContain('<svg');
    expect(out).toContain('viewBox="0 0 10 10"');
    expect(out).toContain('<circle');
  });

  it('strips scripts, handlers and external references', () => {
    const out = sanitizeSvg(
      '<svg viewBox="0 0 10 10"><script>alert(1)</script><rect onclick="x()" width="5" height="5" fill="url(http://evil)"/>' +
        '<image href="http://evil/a.png"/><use href="http://evil#a"/></svg>',
    );
    expect(out).not.toMatch(/script|onclick|evil|image/i);
  });

  it('rejects non-svg input and oversize markup', () => {
    expect(sanitizeSvg('<div>hi</div>')).toBe('');
    expect(sanitizeSvg(42)).toBe('');
    expect(sanitizeSvg('<svg>' + 'x'.repeat(13_000) + '</svg>')).toBe('');
  });

  it('keeps internal #references', () => {
    const out = sanitizeSvg('<svg><defs><g id="a"><circle r="2"/></g></defs><use href="#a"/></svg>');
    expect(out).toContain('href="#a"');
  });
});

describe('normalizeInfographicSpec', () => {
  it('accepts a valid hero-cards spec and clips fields', () => {
    const spec = normalizeInfographicSpec({
      preset: 'hero-cards',
      title: 'Les fractions',
      hero: { label: '1/2' },
      items: [item(1), item(2), item(3), item(4), item(5)],
      remember: ['a', 'b', 'c', 'd'],
    });
    expect(spec?.items).toHaveLength(4);
    expect(spec?.remember).toHaveLength(3);
    expect(spec?.hero?.label).toBe('1/2');
  });

  it('falls back to the requested preset and a safe icon', () => {
    const spec = normalizeInfographicSpec(
      { preset: 'nope', title: 'Cycle', items: [{ title: 'a', text: 'b', icon: 'rm -rf' }, item(2), item(3)] },
      'circular-flow',
    );
    expect(spec?.preset).toBe('circular-flow');
    expect(spec?.items[0].icon).toBe('star');
  });

  it('returns null when too few items or no title', () => {
    expect(normalizeInfographicSpec({ preset: 'hero-cards', title: 'x', items: [item(1)] })).toBeNull();
    expect(normalizeInfographicSpec({ preset: 'timeline', items: [item(1), item(2), item(3)] })).toBeNull();
    expect(normalizeInfographicSpec(null)).toBeNull();
  });
});
