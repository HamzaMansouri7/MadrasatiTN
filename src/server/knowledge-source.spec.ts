import { describe, expect, it } from 'vitest';
import { retrieveContext, fromParascolairePatterns } from './knowledge-source';

describe('retrieveContext with topicId', () => {
  it('puts the pinned chapter first and derives grade/subject from it', () => {
    const { sources } = retrieveContext({ topicId: 'ar-5-u3', lang: 'ar' });
    expect(sources[0].ref).toBe('ar-5-u3');
    expect(sources[0].grade).toBe('5ème Année');
    expect(sources[0].lang).toBe('ar');
  });

  it('respects the requested language for the pinned chapter', () => {
    const { sources } = retrieveContext({ topicId: 'ar-5-u3', lang: 'fr' });
    expect(sources[0].ref).toBe('ar-5-u3');
    expect(sources[0].lang).toBe('fr');
  });

  it('keeps the pinned chapter first even with a misleading free-text topic', () => {
    const { sources } = retrieveContext({
      topicId: 'ar-5-u3',
      topic: 'fractions',
      lang: 'ar',
    });
    expect(sources[0].ref).toBe('ar-5-u3');
  });

  it('ignores unknown ids and behaves like the free-text query', () => {
    const base = retrieveContext({ grade: '5ème Année', subject: 'اللغة العربية', lang: 'ar' });
    const withBad = retrieveContext({
      grade: '5ème Année',
      subject: 'اللغة العربية',
      topicId: 'does-not-exist',
      lang: 'ar',
    });
    expect(withBad.sources.map((s) => s.ref)).toEqual(base.sources.map((s) => s.ref));
  });

  it('honours the limit and does not duplicate the pinned chapter', () => {
    const { sources } = retrieveContext({ topicId: 'ar-5-u3', lang: 'ar', limit: 3 });
    expect(sources.length).toBeLessThanOrEqual(3);
    expect(new Set(sources).size).toBe(sources.length);
  });
});

describe('fromParascolairePatterns', () => {
  it('loads patterns and inspiration models when index exists', () => {
    const patterns = fromParascolairePatterns();
    expect(Array.isArray(patterns)).toBe(true);
    if (patterns.length > 0) {
      const first = patterns[0];
      expect(first.origin).toBe('parascolaire-pattern');
      expect(first.text).toContain('INSPIRATION');
    }
  });
});
