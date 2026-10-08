import { describe, expect, it } from 'vitest';
import { normalizeInfographicSpec, sanitizeImagePrompt, sanitizeImageUrl, sanitizeSvg } from './infographic-spec.util';

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

describe('sanitizeImagePrompt', () => {
  it('appends text-free suffix and clips length', () => {
    const prompt = sanitizeImagePrompt('A boy reading a math book');
    expect(prompt).toBe('A boy reading a math book, no text, no letters, no numbers, no labels, no watermark');
  });

  it('rejects prompts containing Arabic characters', () => {
    expect(sanitizeImagePrompt('تلميذ يقرأ كتابا')).toBeUndefined();
    expect(sanitizeImagePrompt('A boy reading كتاب')).toBeUndefined();
  });

  it('preserves existing text-free mentions without duplicating suffix', () => {
    const prompt = sanitizeImagePrompt('A tree in spring, no text');
    expect(prompt).toBe('A tree in spring, no text');
  });
});

describe('sanitizeImageUrl', () => {
  it('accepts valid /uploads/ urls', () => {
    expect(sanitizeImageUrl('/uploads/img-123.webp')).toBe('/uploads/img-123.webp');
  });

  it('rejects external or malicious urls', () => {
    expect(sanitizeImageUrl('https://evil.com/a.png')).toBeUndefined();
    expect(sanitizeImageUrl('javascript:alert(1)')).toBeUndefined();
    expect(sanitizeImageUrl('/other/path.png')).toBeUndefined();
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

  it('normalizes image prompts, wantsImage and uploads imageUrl on items and hero', () => {
    const spec = normalizeInfographicSpec({
      preset: 'hero-cards',
      title: 'Les sciences',
      hero: {
        label: 'Bio',
        wantsImage: true,
        imagePrompt: 'A green leaf cell under microscope',
        imageUrl: '/uploads/hero-bio.webp',
      },
      items: [
        {
          title: 'Cellule',
          text: 'Unité de base',
          icon: 'eco',
          wantsImage: true,
          imagePrompt: 'Microscopic plant cell structure',
          imageUrl: '/uploads/cell.webp',
        },
        item(2),
        item(3),
        item(4),
      ],
      remember: ['Retenir 1'],
    });
    expect(spec?.hero?.wantsImage).toBe(true);
    expect(spec?.hero?.imageUrl).toBe('/uploads/hero-bio.webp');
    expect(spec?.hero?.imagePrompt).toContain('no text');
    expect(spec?.items[0].wantsImage).toBe(true);
    expect(spec?.items[0].imageUrl).toBe('/uploads/cell.webp');
    expect(spec?.items[0].imagePrompt).toContain('no text');
  });

  it('accepts new presets: comparison, lesson-stages, central-picture', () => {
    const comparison = normalizeInfographicSpec({
      preset: 'comparison',
      title: 'Le vivant et le non-vivant',
      items: [item(1), item(2)],
      columns: [
        { title: 'Êtres vivants', points: ['Respirent', 'Grandissent'] },
        { title: 'Objets inanimés', points: ['Ne respirent pas'] },
      ],
      remember: ['Point clé'],
    });
    expect(comparison?.preset).toBe('comparison');
    expect(comparison?.columns).toHaveLength(2);

    const stages = normalizeInfographicSpec({
      preset: 'lesson-stages',
      title: 'Séance de grammaire',
      items: [item(1), item(2)],
      stages: [
        { stageNumber: 1, title: 'Découverte', teacherActivity: 'Présente la phrase', learnerActivity: 'Lit et observe' },
        { stageNumber: 2, title: 'Entraînement', teacherActivity: 'Guider', learnerActivity: 'Pratique' },
      ],
      remember: ['Règle'],
    });
    expect(stages?.preset).toBe('lesson-stages');
    expect(stages?.stages).toHaveLength(2);
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
