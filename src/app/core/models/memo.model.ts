export interface MemoStep {
  n: number;
  heading: string;
  body: string;
}

export interface MemoCard {
  id: string;
  label: string;
  definition: string;
  examples: string[];
  icon?: string;
  color?: string;
}

export interface MemoAnalysisItem {
  word: string;
  role: string;
}

export interface MemoExample {
  sentence: string;
  analysis: MemoAnalysisItem[];
}

export interface MemoFormula {
  parts: string[];
  note: string;
}

export interface MemoTimelineEvent {
  stepOrDate: string;
  title: string;
  description: string;
}

export interface MemoComparisonTable {
  headers: string[];
  rows: { label: string; cells: string[] }[];
}

export interface MemoConjugationRow {
  pronoun: string;
  form: string;
  example?: string;
}

export interface MemoConjugationGrid {
  verb: string;
  tense: string;
  rows: MemoConjugationRow[];
}

export type SummarySectionType =
  | 'intro'
  | 'rule'
  | 'method'
  | 'example'
  | 'table'
  | 'conjugation'
  | 'timeline'
  | 'remember'
  | 'practice';

export interface SummaryExercise {
  question: string;
  answer: string;
}

/** One block of the revision document, rendered top to bottom. Only the fields of its type are filled. */
export interface SummarySection {
  type: SummarySectionType;
  heading: string;
  /** intro / rule / example: a short paragraph (the example's statement). */
  text?: string;
  /** rule / remember: bullet lines. */
  items?: string[];
  /** method: ordered steps. */
  steps?: MemoStep[];
  /** example: the worked solution. */
  solution?: string;
  table?: MemoComparisonTable;
  conjugation?: MemoConjugationGrid;
  timeline?: MemoTimelineEvent[];
  /** practice: answers are printed only on the teacher copy. */
  exercises?: SummaryExercise[];
  /** Optional picture added by the teacher (max 2 per document). */
  imageUrl?: string;
}

export type SummaryLength = 'short' | 'full';

/**
 * Revision document (ملف مراجعة). New documents carry `sections`; documents saved before
 * 2026-10-16 only have the old blocks (steps, cards...) and are adapted on open.
 */
export interface MemoDoc {
  title: string;
  subtitle?: string;
  grade: string;
  subject: string;
  topic: string;
  trimester?: string;
  language: 'ar' | 'fr';
  objective?: string;
  length?: SummaryLength;
  sections?: SummarySection[];
  steps?: MemoStep[];
  cards?: MemoCard[];
  example?: MemoExample;
  remember?: string[];
  formula?: MemoFormula;
  quote?: string;
  timeline?: MemoTimelineEvent[];
  comparisonTable?: MemoComparisonTable;
  conjugationGrid?: MemoConjugationGrid;
}

export interface MemoInput {
  mode: 'topic' | 'text' | 'image' | 'file' | 'resource';
  topic?: string;
  /** Official curriculum row id (CurriculumChapter.id) when picked from the programme. */
  topicId?: string;
  text?: string;
  images?: { base64Data: string; contentType?: string }[];
  file?: { base64Data: string; contentType?: string; filename?: string };
  resourceUrl?: string;
  grade: string;
  subject: string;
  trimester?: string;
  language?: 'ar' | 'fr';
  instructions?: string;
  length?: SummaryLength;
  withPractice?: boolean;
  /** Regenerate one section of `currentMemo` only. */
  sectionIndex?: number;
  currentMemo?: MemoDoc;
}

export interface MemoGenerateResponse {
  ok: boolean;
  result?: MemoDoc;
  extractedText?: string;
  error?: string;
}
