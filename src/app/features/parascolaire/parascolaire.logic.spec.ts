import { describe, expect, it } from 'vitest';
import {
  booksOfClass,
  filterThemes,
  findBook,
  findTheme,
  mediaUrl,
  neighbours,
  rulerSegments,
  subjectColor,
  subjectLabel,
  themeHasResource,
} from './parascolaire.logic';
import { ParascolaireBook, ParascolaireCatalog, ParascolaireTheme, SlotStatus } from './parascolaire.models';

const theme = (id: string, subject: string, ig: SlotStatus, cs: SlotStatus, vd: SlotStatus = 'soon'): ParascolaireTheme => ({
  id,
  n: 1,
  title: id,
  subject,
  exerciseCount: 5,
  slots: { infographic: { status: ig }, course: { status: cs }, video: { status: vd } },
});

const book = (id: string, number: number, themes: ParascolaireTheme[]): ParascolaireBook => ({
  id,
  classe: id.split('/')[0],
  title: id,
  number,
  subject: 'Mathématiques',
  subjects: ['Mathématiques', 'Arabe'],
  themeCount: themes.length,
  readyCount: themes.filter(themeHasResource).length,
  resources: { parentGuide: { status: 'soon' } },
  themes,
});

const T = [
  theme('01-a', 'Arabe', 'ready', 'ready'),
  theme('02-b', 'Mathématiques', 'ready', 'in-progress'),
  theme('03-c', 'Mathématiques', 'in-progress', 'in-progress'),
];
const catalog: ParascolaireCatalog = {
  version: 1,
  generatedAt: '',
  classes: [{ id: '1ere-annee', label: '1ère Année', order: 1 }],
  books: [book('1ere-annee/z', 2, []), book('1ere-annee/a', 1, T)],
};

describe('parascolaire logic', () => {
  it('builds media urls and ignores empty paths', () => {
    expect(mediaUrl('img/x.webp')).toBe('/media/parascolaire/img/x.webp');
    expect(mediaUrl(undefined)).toBe('');
  });

  it('counts a theme as having a resource when any slot is ready', () => {
    expect(themeHasResource(T[0])).toBe(true);
    expect(themeHasResource(T[2])).toBe(false);
  });

  it('orders the books of a class by number and finds a book and a theme', () => {
    expect(booksOfClass(catalog, '1ere-annee').map((b) => b.number)).toEqual([1, 2]);
    expect(booksOfClass(null, '1ere-annee')).toEqual([]);
    const b = findBook(catalog, '1ere-annee', 'a');
    expect(b?.themeCount).toBe(3);
    expect(findTheme(b, '02-b')?.id).toBe('02-b');
    expect(findTheme(b, 'nope')).toBeUndefined();
  });

  it('gives previous and next themes', () => {
    const b = findBook(catalog, '1ere-annee', 'a');
    expect(neighbours(b, '01-a')).toEqual({ prev: null, next: T[1] });
    expect(neighbours(b, '03-c')).toEqual({ prev: T[1], next: null });
    expect(neighbours(undefined, 'x')).toEqual({ prev: null, next: null });
  });

  it('filters by subject and status', () => {
    expect(filterThemes(T, 'all', 'all')).toHaveLength(3);
    expect(filterThemes(T, 'Mathématiques', 'all').map((t) => t.id)).toEqual(['02-b', '03-c']);
    expect(filterThemes(T, 'all', 'ready').map((t) => t.id)).toEqual(['01-a', '02-b']);
    expect(filterThemes(T, 'all', 'pending').map((t) => t.id)).toEqual(['03-c']);
  });

  it('draws the coverage ruler: done, partial, empty', () => {
    expect(rulerSegments(findBook(catalog, '1ere-annee', 'a')!)).toEqual(['done', 'partial', 'empty']);
  });

  it('maps subjects to cover colours and Arabic labels, with fallbacks', () => {
    expect(subjectColor('Mathématiques')).toBe('var(--p-maths)');
    expect(subjectColor('Inconnue')).toBe('var(--p-ink)');
    expect(subjectLabel('Arabe', true)).toBe('اللغة العربية');
    expect(subjectLabel('Arabe', false)).toBe('Arabe');
    expect(subjectLabel('Inconnue', true)).toBe('Inconnue');
  });
});
