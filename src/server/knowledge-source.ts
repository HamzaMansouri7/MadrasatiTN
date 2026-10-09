/**
 * Knowledge Source layer — source-agnostic curriculum grounding for all AI endpoints.
 *
 * One flat, keyed corpus feeds `retrieveContext()`, which every /api/ai/* endpoint
 * calls to inject official Tunisian curriculum context into its Gemini prompt.
 *
 * Extending later = add a new adapter (new `origin`) that maps raw data into
 * `KnowledgeSource` rows. No endpoint change required.
 */
import { TUNISIAN_CURRICULUM_CHAPTERS } from '../app/core/data/curriculum-chapters.data';
import { chapterById, chapterTitle } from '../app/core/utils/curriculum.util';
import { CNP_PRIMARY_COURSES } from '../app/core/data/cnp-books.data';

export type KnowledgeLang = 'ar' | 'fr' | 'en' | 'mixed';

export interface KnowledgeSource {
  id: string;
  /** Provenance tag: 'cnp-chapter' | 'cnp-book' | future ('manual', 'teacher', 'past-exam', scraped sites…) */
  origin: string;
  grade: string;
  subject: string;
  trimester?: string;
  lang: KnowledgeLang;
  title: string;
  /** Grounding text injected into prompts (competency, summary, extracted exercise text…) */
  text: string;
  /** External reference: official code, PDF URL, source URL — legal trace + dedupe key */
  ref?: string;
}

export interface RetrieveQuery {
  grade?: string;
  subject?: string;
  trimester?: string;
  /** Free-text topic/chapter — used for keyword ranking */
  topic?: string;
  /** Official curriculum row id (CurriculumChapter.id). Pins that exact chapter first; unknown ids are ignored. */
  topicId?: string;
  lang?: 'ar' | 'fr';
  limit?: number;
}

export interface RetrievedContext {
  sources: KnowledgeSource[];
  /** Ready-to-inject prompt block (localized AR/FR). Empty string when nothing matched. */
  block: string;
}

// ---------------------------------------------------------------------------
// Adapters — one per origin. New sources plug in here as data, not endpoint code.
// ---------------------------------------------------------------------------

const ARABIC_RE = /[؀-ۿ]/;

/** CNP curriculum chapters → two rows each (ar + fr) so lang filtering stays trivial. */
function fromCurriculumChapters(): KnowledgeSource[] {
  const rows: KnowledgeSource[] = [];
  for (const ch of TUNISIAN_CURRICULUM_CHAPTERS) {
    rows.push({
      id: `${ch.id}-ar`,
      origin: 'cnp-chapter',
      grade: ch.grade,
      subject: ch.subject,
      trimester: ch.trimester,
      lang: 'ar',
      title: ch.titleAr,
      text: ch.keyCompetencyAr || ch.titleAr,
      ref: ch.id,
    });
    rows.push({
      id: `${ch.id}-fr`,
      origin: 'cnp-chapter',
      grade: ch.grade,
      subject: ch.subject,
      trimester: ch.trimester,
      lang: 'fr',
      title: ch.titleFr,
      text: ch.keyCompetencyFr || ch.titleFr,
      ref: ch.id,
    });
  }
  return rows;
}

/** Official CNP textbooks → one row each; language inferred from the title. */
function fromCnpBooks(): KnowledgeSource[] {
  return CNP_PRIMARY_COURSES.map((c) => ({
    id: c.id,
    origin: 'cnp-book',
    grade: c.grade,
    subject: c.subject,
    trimester: c.trimester,
    lang: ARABIC_RE.test(c.title) ? 'ar' as const : 'fr' as const,
    title: c.title,
    text: c.summary,
    ref: c.pdfUrl || c.content,
  }));
}

/** Full corpus, built once at startup. Future adapters: push their rows here. */
const CORPUS: KnowledgeSource[] = [...fromCurriculumChapters(), ...fromCnpBooks()];

/** Register extra sources at runtime (e.g. loaded from scraped-site JSON files). */
export function registerSources(sources: KnowledgeSource[]): void {
  const known = new Set(CORPUS.map((s) => s.id));
  for (const s of sources) {
    if (!known.has(s.id)) {
      CORPUS.push(s);
      known.add(s.id);
    }
  }
}

// ---------------------------------------------------------------------------
// Retrieval — keyword filter + topic ranking (small corpus; embeddings later).
// ---------------------------------------------------------------------------

/** Loose subject matching: tolerate FR/AR aliases coming from different callers. */
const SUBJECT_ALIASES: Record<string, string> = {
  'math': 'Mathématiques',
  'mathematiques': 'Mathématiques',
  'الرياضيات': 'Mathématiques',
  'رياضيات': 'Mathématiques',
  'arabe': 'اللغة العربية',
  'العربية': 'اللغة العربية',
  'francais': 'Français',
  'français': 'Français',
  'الفرنسية': 'Français',
  'eveil': 'Éveil Scientifique',
  'éveil scientifique': 'Éveil Scientifique',
  'الإيقاظ العلمي': 'Éveil Scientifique',
  'ايقاظ': 'Éveil Scientifique',
  'anglais': 'Anglais',
  'english': 'Anglais',
  'الإنكليزية': 'Anglais',
  'الإنجليزية': 'Anglais',
  'histoire': 'Histoire & Géographie',
  'histoire-géo': 'Histoire & Géographie',
  'histoire & géographie': 'Histoire & Géographie',
  'التاريخ': 'Histoire & Géographie',
  'الجغرافيا': 'Histoire & Géographie',
  'التاريخ والجغرافيا': 'Histoire & Géographie',
  'islamique': 'Éducation Islamique',
  'éducation islamique': 'Éducation Islamique',
  'التربية الإسلامية': 'Éducation Islamique',
  'إسلامية': 'Éducation Islamique',
};

function normalizeSubject(subject?: string): string | undefined {
  if (!subject) return undefined;
  const key = subject.trim().toLowerCase();
  return SUBJECT_ALIASES[key] || subject.trim();
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[\s.,;:!?()[\]{}«»"'،؛؟\-–—/\\]+/)
    .filter((w) => w.length >= 2);
}

function scoreAgainstTopic(source: KnowledgeSource, topicTokens: string[]): number {
  if (topicTokens.length === 0) return 0;
  const haystack = `${source.title} ${source.text}`.toLowerCase();
  let score = 0;
  for (const token of topicTokens) {
    if (haystack.includes(token)) score += 1;
  }
  return score;
}

/**
 * Pick the top-K knowledge sources for (grade, subject, trimester, topic) and
 * format them as a localized grounding block ready to prepend to a Gemini prompt.
 */
export function retrieveContext(q: RetrieveQuery): RetrievedContext {
  const limit = Math.min(Math.max(q.limit || 4, 1), 8);
  const lang: 'ar' | 'fr' = q.lang === 'fr' ? 'fr' : 'ar';
  const pinned = chapterById(q.topicId);
  const subject = normalizeSubject(q.subject) ?? pinned?.subject;
  const grade = q.grade ?? pinned?.grade;

  let pool = CORPUS.filter((s) => {
    if (grade && s.grade !== grade) return false;
    if (subject && s.subject !== subject) return false;
    return true;
  });

  // Prefer requested language (+ mixed), but fall back to anything rather than nothing.
  const langPool = pool.filter((s) => s.lang === lang || s.lang === 'mixed');
  if (langPool.length > 0) pool = langPool;

  // Prefer the requested trimester; keep the rest as fallback.
  const trimester = q.trimester ?? pinned?.trimester;
  const topicTokens = tokenize(q.topic || (pinned ? chapterTitle(pinned, lang) : ''));
  const rankedAll = pool
    .map((s) => ({
      s,
      score:
        scoreAgainstTopic(s, topicTokens) * 10 +
        (trimester && s.trimester === trimester ? 5 : 0) +
        (s.origin === 'cnp-chapter' ? 1 : 0), // chapters carry competencies → slightly preferred
    }))
    .sort((a, b) => b.score - a.score)
    .map((r) => r.s);

  // The pinned chapter always comes first, then the usual keyword ranking fills the rest.
  const exact = pinned ? rankedAll.filter((s) => s.ref === pinned.id) : [];
  const ranked = [...exact, ...rankedAll.filter((s) => !exact.includes(s))].slice(0, limit);

  if (ranked.length === 0) return { sources: [], block: '' };

  const header =
    lang === 'ar'
      ? 'المرجعية الرسمية — البرنامج التونسي (المركز الوطني البيداغوجي):'
      : 'Références officielles — programme tunisien (Centre National Pédagogique) :';
  const instruction =
    lang === 'ar'
      ? 'اعتمد حصريًا على هذه الكفايات والمراجع الرسمية في صياغة المحتوى، وطابق مستوى الصعوبة مع المستوى الدراسي المذكور.'
      : 'Fonde strictement le contenu sur ces compétences et références officielles, en respectant le niveau indiqué.';

  const lines = ranked.map((s) => {
    const trimester = s.trimester ? ` [${s.trimester}]` : '';
    return `- (${s.origin}) ${s.title}${trimester} — ${s.text}`;
  });

  return { sources: ranked, block: `${header}\n${lines.join('\n')}\n${instruction}` };
}
