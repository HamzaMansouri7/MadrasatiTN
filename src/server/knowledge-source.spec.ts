import { describe, expect, it } from 'vitest';
import { retrieveContext } from './knowledge-source';

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

  it('returns parascolaire rows when retrieveContext is called with topicId math-5-ch1', () => {
    const { sources } = retrieveContext({ topicId: 'math-5-ch1' });
    expect(sources.length).toBeGreaterThan(0);
    const parascolaireRows = sources.filter((s) => s.origin === 'parascolaire');
    expect(parascolaireRows.length).toBeGreaterThan(0);
    expect(parascolaireRows[0].ref).toBe('math-5-ch1');
  });
});
