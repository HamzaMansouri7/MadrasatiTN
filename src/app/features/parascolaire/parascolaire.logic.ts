import {
  ParascolaireBook,
  ParascolaireCatalog,
  ParascolaireTheme,
  SlotKind,
  SlotStatus,
  ThemeStatusFilter,
} from './parascolaire.models';

export const MEDIA_BASE = '/media/parascolaire/';

export const mediaUrl = (path: string | undefined): string => (path ? MEDIA_BASE + path : '');

export const SLOT_KINDS: readonly SlotKind[] = ['infographic', 'course', 'video'];

/** A theme counts as "with resources" when at least one slot is ready. */
export const themeHasResource = (t: ParascolaireTheme): boolean =>
  SLOT_KINDS.some((k) => t.slots[k].status === 'ready');

export const booksOfClass = (c: ParascolaireCatalog | null, classe: string): ParascolaireBook[] =>
  c ? c.books.filter((b) => b.classe === classe).sort((a, b) => a.number - b.number) : [];

export const findBook = (c: ParascolaireCatalog | null, classe: string, livre: string): ParascolaireBook | undefined =>
  c?.books.find((b) => b.id === `${classe}/${livre}`);

export const findTheme = (b: ParascolaireBook | undefined, themeId: string): ParascolaireTheme | undefined =>
  b?.themes.find((t) => t.id === themeId);

export const neighbours = (
  b: ParascolaireBook | undefined,
  themeId: string,
): { prev: ParascolaireTheme | null; next: ParascolaireTheme | null } => {
  if (!b) return { prev: null, next: null };
  const i = b.themes.findIndex((t) => t.id === themeId);
  return { prev: i > 0 ? b.themes[i - 1] : null, next: i >= 0 && i < b.themes.length - 1 ? b.themes[i + 1] : null };
};

export const filterThemes = (
  themes: ParascolaireTheme[],
  subject: string,
  status: ThemeStatusFilter,
): ParascolaireTheme[] =>
  themes.filter(
    (t) =>
      (subject === 'all' || t.subject === subject) &&
      (status === 'all' || (status === 'ready' ? themeHasResource(t) : !themeHasResource(t))),
  );

/** The slot kinds shown as "ready" for a theme, in display order. */
export const readyKinds = (t: ParascolaireTheme): SlotKind[] => SLOT_KINDS.filter((k) => t.slots[k].status === 'ready');

/** Cover colour per subject (cahier covers). Unknown subjects fall back to the ink colour. */
const SUBJECT_COLOR: Record<string, string> = {
  'mathématiques': 'var(--p-maths)',
  'arabe': 'var(--p-arabe)',
  'éveil scientifique': 'var(--p-eveil)',
  'français': 'var(--p-francais)',
  'éducation islamique': 'var(--p-islam)',
};

export const subjectColor = (subject: string): string => SUBJECT_COLOR[subject.trim().toLowerCase()] ?? 'var(--p-ink)';

const SUBJECT_AR: Record<string, string> = {
  'mathématiques': 'الرياضيات',
  'arabe': 'اللغة العربية',
  'éveil scientifique': 'الإيقاظ العلمي',
  'français': 'اللغة الفرنسية',
  'éducation islamique': 'التربية الإسلامية',
};

export const subjectLabel = (subject: string, isArabic: boolean): string =>
  isArabic ? (SUBJECT_AR[subject.trim().toLowerCase()] ?? subject) : subject;

const CLASS_AR = ['السنة الأولى', 'السنة الثانية', 'السنة الثالثة', 'السنة الرابعة', 'السنة الخامسة', 'السنة السادسة'];

export const classLabel = (order: number, fr: string, isArabic: boolean): string =>
  isArabic ? (CLASS_AR[order - 1] ?? fr) : fr;

export const statusKey = (s: SlotStatus): 'ready' | 'inProgress' | 'soon' =>
  s === 'ready' ? 'ready' : s === 'in-progress' ? 'inProgress' : 'soon';

/**
 * Coverage ruler segments, one per theme: done = infographic and course ready,
 * partial = at least one resource ready, empty = nothing yet. (Video is not required for "done" in v1.)
 */
export const rulerSegments = (b: ParascolaireBook): ('done' | 'partial' | 'empty')[] =>
  b.themes.map((t) => {
    if (t.slots.infographic.status === 'ready' && t.slots.course.status === 'ready') return 'done';
    return themeHasResource(t) ? 'partial' : 'empty';
  });
