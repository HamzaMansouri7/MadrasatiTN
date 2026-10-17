import {
  MemoComparisonTable,
  MemoConjugationGrid,
  MemoDoc,
  MemoStep,
  MemoTimelineEvent,
  SummaryExercise,
  SummarySection,
  SummarySectionType,
} from '../models/memo.model';

export const SUMMARY_SECTION_TYPES: readonly SummarySectionType[] = [
  'intro',
  'rule',
  'method',
  'example',
  'table',
  'conjugation',
  'timeline',
  'remember',
  'practice',
];

/** A teacher may add at most this many pictures to one document. */
export const SUMMARY_MAX_IMAGES = 2;

const clip = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/[ \t]+/g, ' ').trim().slice(0, max) : '';
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' ? (v as Record<string, unknown>) : null);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const strList = (v: unknown, maxLen: number, maxCount: number): string[] =>
  list(v).map((x) => clip(x, maxLen)).filter(Boolean).slice(0, maxCount);

/** Same-origin uploads only; anything else (data:, javascript:, other hosts) is dropped. */
const safeImageUrl = (v: unknown): string | undefined => {
  const url = clip(v, 300);
  return /^\/uploads\/[A-Za-z0-9/_.-]+\.(?:webp|png|jpe?g)$/.test(url) ? url : undefined;
};

function normalizeSteps(v: unknown, max = 6): MemoStep[] {
  return list(v)
    .map((s, i) => {
      const o = obj(s);
      const heading = o ? clip(o['heading'], 80) : '';
      const body = o ? clip(o['body'], 400) : '';
      return heading || body ? { n: i + 1, heading, body } : null;
    })
    .filter((s): s is MemoStep => s !== null)
    .slice(0, max);
}

function normalizeTable(v: unknown): MemoComparisonTable | undefined {
  const o = obj(v);
  if (!o) return undefined;
  const headers = strList(o['headers'], 60, 5);
  const rows = list(o['rows'])
    .map((r) => {
      const ro = obj(r);
      const label = ro ? clip(ro['label'], 80) : '';
      return ro && label ? { label, cells: strList(ro['cells'], 160, 4) } : null;
    })
    .filter((r): r is { label: string; cells: string[] } => r !== null)
    .slice(0, 10);
  return headers.length >= 2 && rows.length ? { headers, rows } : undefined;
}

function normalizeConjugation(v: unknown): MemoConjugationGrid | undefined {
  const o = obj(v);
  if (!o) return undefined;
  const rows = list(o['rows'])
    .map((r) => {
      const ro = obj(r);
      const pronoun = ro ? clip(ro['pronoun'], 30) : '';
      const form = ro ? clip(ro['form'], 60) : '';
      return pronoun && form ? { pronoun, form, example: clip(ro?.['example'], 140) || undefined } : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .slice(0, 14);
  const verb = clip(o['verb'], 40);
  return verb && rows.length ? { verb, tense: clip(o['tense'], 40), rows } : undefined;
}

function normalizeTimeline(v: unknown): MemoTimelineEvent[] {
  return list(v)
    .map((e) => {
      const eo = obj(e);
      const title = eo ? clip(eo['title'], 80) : '';
      return eo && title ? { stepOrDate: clip(eo['stepOrDate'], 40), title, description: clip(eo['description'], 240) } : null;
    })
    .filter((e): e is MemoTimelineEvent => e !== null)
    .slice(0, 10);
}

function normalizeExercises(v: unknown): SummaryExercise[] {
  return list(v)
    .map((e) => {
      const eo = obj(e);
      const question = eo ? clip(eo['question'], 300) : '';
      return eo && question ? { question, answer: clip(eo['answer'], 300) } : null;
    })
    .filter((e): e is SummaryExercise => e !== null)
    .slice(0, 6);
}

/** Cleans one model-written section; null when it has nothing worth printing. */
export function normalizeSummarySection(raw: unknown): SummarySection | null {
  const o = obj(raw);
  if (!o) return null;
  const type = SUMMARY_SECTION_TYPES.includes(o['type'] as SummarySectionType) ? (o['type'] as SummarySectionType) : null;
  if (!type) return null;
  const s: SummarySection = { type, heading: clip(o['heading'], 100) };
  const text = clip(o['text'], 900);
  if (text) s.text = text;
  const imageUrl = safeImageUrl(o['imageUrl']);
  if (imageUrl) s.imageUrl = imageUrl;

  switch (type) {
    case 'intro':
      return s.text ? s : null;
    case 'rule':
    case 'remember': {
      const items = strList(o['items'], 240, 8);
      if (items.length) s.items = items;
      return s.text || items.length ? s : null;
    }
    case 'method': {
      const steps = normalizeSteps(o['steps']);
      return steps.length ? { ...s, steps } : null;
    }
    case 'example': {
      const solution = clip(o['solution'], 900);
      if (solution) s.solution = solution;
      return s.text ? s : null;
    }
    case 'table': {
      const table = normalizeTable(o['table']);
      return table ? { ...s, table } : null;
    }
    case 'conjugation': {
      const conjugation = normalizeConjugation(o['conjugation']);
      return conjugation ? { ...s, conjugation } : null;
    }
    case 'timeline': {
      const timeline = normalizeTimeline(o['timeline']);
      return timeline.length ? { ...s, timeline } : null;
    }
    case 'practice': {
      const exercises = normalizeExercises(o['exercises']);
      return exercises.length ? { ...s, exercises } : null;
    }
  }
}

/** Keeps the first SUMMARY_MAX_IMAGES pictures and drops the rest. */
function capImages(sections: SummarySection[]): SummarySection[] {
  let seen = 0;
  return sections.map((s) => {
    if (!s.imageUrl) return s;
    seen++;
    if (seen <= SUMMARY_MAX_IMAGES) return s;
    const rest = { ...s };
    delete rest.imageUrl;
    return rest;
  });
}

/** Cleans a model or client revision document; null when there is no title or no usable section. */
export function normalizeSummary(raw: unknown): MemoDoc | null {
  const o = obj(raw);
  if (!o) return null;
  const title = clip(o['title'], 120);
  const sections = capImages(
    list(o['sections'])
      .map(normalizeSummarySection)
      .filter((s): s is SummarySection => s !== null)
      .slice(0, 12),
  );
  if (!title || sections.length < 2) return null;
  return {
    title,
    subtitle: clip(o['subtitle'], 160) || undefined,
    objective: clip(o['objective'], 240) || undefined,
    grade: clip(o['grade'], 40),
    subject: clip(o['subject'], 40),
    topic: clip(o['topic'], 200) || title,
    trimester: clip(o['trimester'], 40) || undefined,
    language: o['language'] === 'fr' ? 'fr' : 'ar',
    length: o['length'] === 'full' ? 'full' : 'short',
    sections,
  };
}

/**
 * Sections to render. New documents carry them; documents saved before the 2026-10-16
 * refactor only have the old blocks, which are mapped here (never rewritten on disk).
 */
export function summarySections(doc: MemoDoc): SummarySection[] {
  if (doc.sections?.length) return doc.sections;
  const ar = doc.language !== 'fr';
  const h = (fr: string, a: string) => (ar ? a : fr);
  const out: SummarySection[] = [];
  if (doc.subtitle) out.push({ type: 'intro', heading: h('Introduction', 'تمهيد'), text: doc.subtitle });
  if (doc.cards?.length) {
    out.push({
      type: 'rule',
      heading: h('Notions clés', 'المفاهيم الأساسية'),
      items: doc.cards.map((c) => `${c.label} : ${c.definition}${c.examples?.length ? ` (${c.examples.join('، ')})` : ''}`),
    });
  }
  if (doc.formula?.parts?.length) {
    out.push({ type: 'rule', heading: h('Règle', 'القاعدة'), text: doc.formula.parts.join(' '), items: doc.formula.note ? [doc.formula.note] : undefined });
  }
  if (doc.steps?.length) out.push({ type: 'method', heading: h('Ma méthode pas à pas', 'طريقتي خطوة بخطوة'), steps: doc.steps });
  if (doc.example?.sentence) {
    out.push({
      type: 'example',
      heading: h('Exemple analysé', 'مثال تطبيقي'),
      text: doc.example.sentence,
      solution: doc.example.analysis?.map((a) => `${a.word} : ${a.role}`).join(' — ') || undefined,
    });
  }
  if (doc.comparisonTable?.rows?.length) out.push({ type: 'table', heading: h('Tableau comparatif', 'جدول مقارنة'), table: doc.comparisonTable });
  if (doc.conjugationGrid?.rows?.length) out.push({ type: 'conjugation', heading: h('Conjugaison', 'التصريف'), conjugation: doc.conjugationGrid });
  if (doc.timeline?.length) out.push({ type: 'timeline', heading: h('Chronologie', 'التسلسل الزمني'), timeline: doc.timeline });
  if (doc.remember?.length) out.push({ type: 'remember', heading: h('À retenir', 'أتذكّر'), items: doc.remember });
  return out;
}
