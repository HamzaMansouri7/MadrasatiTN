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

const THEME_AR: Record<string, string> = {
  '01-lettres-et-sons': 'الحروف والأصوات: ز، و، ح',
  '02-comparaison-et-rangement-des-nombres': 'مقارنة وترتيب الأعداد',
  '03-monnaie-pieces-et-millimes': 'النقود: القطع والمليمات',
  '04-calculs-avec-la-monnaie': 'الحساب بالنقود',
  '05-lettres-et-sons': 'الحروف والأصوات: ف، ق، ط',
  '06-addition-jusqu-a-20': 'عملية الجمع حتى 20',
  '07-lecture-nature-et-saisons': 'القراءة: الطبيعة والفصول',
  '08-decomposition-des-nombres-jusqu-a-10': 'تفكيك الأعداد حتى 10',
  '09-ordonner-des-phrases-et-coherence-textuelle': 'ترتيب الجمل والاتساق النصي',
  '10-dizaines-et-groupements': 'العشرات والمجموعات',
  '11-lecture-vie-quotidienne': 'القراءة: الحياة اليومية',
  '12-enrichissement-de-phrases': 'إغناء الجمل',
  '13-nombres-de-10-a-20': 'الأعداد من 10 إلى 20',
  '14-reunion-d-ensembles': 'ضم المجموعات',
  '15-addition-jusqu-a-10': 'الجمع حتى 10',
  '16-personnages-lieux-et-evenements-du-recit': 'الشخصيات والأمكنة والأحداث في الإطار القصصي',
  '17-syllabe-fermee-et-lettre': 'المقطع المغلق وحرف التاء',
  '18-la-hamza': 'الهمزة',
  '19-nombres-ordinaux': 'الأعداد الترتيبية',
  '20-substitution-et-transformation-de-phrases': 'التعويض وتحويل الجمل',
  '21-les-nombres-de-0-a-9': 'الأعداد من 0 إلى 9',
  '22-comprehension-de-texte': 'فهم النص',
  '23-problemes-additifs': 'المشكلات الجمعية',
  '24-production-ecrite-images-et-scenes': 'الإنتاج الكتابي: صور ومشاهد',
};

export const themeTitle = (t: ParascolaireTheme | undefined | null, isArabic: boolean): string => {
  if (!t) return '';
  return isArabic ? (THEME_AR[t.id] ?? t.title) : t.title;
};

const BOOK_AR: Record<string, string> = {
  '1ere-annee/evaluations-maths-arabe': 'تقييمات السنة الأولى — رياضيات ولغة عربية',
  '2eme-annee/evaluations-toutes-matieres': 'تقييمات السنة الثانية — جميع المواد',
  '3eme-annee/examens-toutes-matieres': 'امتحانات السنة الثالثة — جميع المواد',
  '4eme-annee/mathematiques_exercices_corriges': 'رياضيات السنة الرابعة — تمارين وحلول',
  '4eme-annee/production_ecrite_arabe': 'الإنتاج الكتابي السنة الرابعة — لغة عربية',
  '5eme-annee/devoirs_trimestre_1_matieres_mixtes': 'فروض السنة الخامسة — الثلاثي الأول',
  '5eme-annee/exercices_mathematiques_corriges': 'رياضيات السنة الخامسة — تمارين محلولة',
  '5eme-annee/mathematiques_exercices_evaluations': 'رياضيات السنة الخامسة — تمارين وتقييمات',
  '5eme-annee/eveil_scientifique_evaluations': 'الإيقاظ العلمي السنة الخامسة — تقييمات',
  '6eme-annee/concours_mathematiques_corriges': 'مناظرة السنة السادسة — رياضيات (مع الإصلاح)',
  '6eme-annee/concours_blanc_eveil_scientifique_corrige': 'مناظرة بيضاء السنة السادسة — إيقاظ علمي',
  '6eme-annee/examen_lecture_arabe_corrige': 'امتحان قراءة السنة السادسة — لغة عربية',
  '6eme-annee/francais_lire_et_sexprimer': 'الفرنسية السنة السادسة — قراءة وتعبير',
  '6eme-annee/grammaire_arabe_cahier_regles': 'قواعد اللغة العربية السنة السادسة — كراس القواعد',
  '6eme-annee/soutien_maths_francais': 'دعم السنة السادسة — رياضيات وفرنسية',
  '6eme-annee/epreuve_modele_mathematiques_corrigee': 'اختبار نموذجي السنة السادسة — رياضيات',
  '6eme-annee/eveil_scientifique_cours_exercices': 'الإيقاظ العلمي السنة السادسة — دروس وتمارين',
};

export const bookTitle = (b: ParascolaireBook | undefined | null, isArabic: boolean): string => {
  if (!b) return '';
  return isArabic ? (BOOK_AR[b.id] ?? b.title) : b.title;
};

/**
 * Coverage ruler segments, one per theme: done = infographic and course ready,
 * partial = at least one resource ready, empty = nothing yet. (Video is not required for "done" in v1.)
 */
export const rulerSegments = (b: ParascolaireBook): ('done' | 'partial' | 'empty')[] =>
  b.themes.map((t) => {
    if (t.slots.infographic.status === 'ready' && t.slots.course.status === 'ready') return 'done';
    return themeHasResource(t) ? 'partial' : 'empty';
  });
