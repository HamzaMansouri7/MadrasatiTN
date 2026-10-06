export type MemoLayout = 'tree' | 'steps' | 'cards' | 'timeline' | 'table' | 'conjugation';

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
  rows: Array<{ label: string; cells: string[] }>;
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

export interface MemoDoc {
  title: string;
  subtitle?: string;
  grade: string;
  subject: string;
  topic: string;
  language: 'ar' | 'fr';
  steps: MemoStep[];
  cards: MemoCard[];
  example?: MemoExample;
  remember: string[];
  formula?: MemoFormula;
  quote?: string;
  timeline?: MemoTimelineEvent[];
  comparisonTable?: MemoComparisonTable;
  conjugationGrid?: MemoConjugationGrid;
}

export interface MemoInput {
  mode: 'topic' | 'text' | 'image' | 'file' | 'resource';
  topic?: string;
  text?: string;
  images?: { base64Data: string; contentType?: string }[];
  file?: { base64Data: string; contentType?: string; filename?: string };
  resourceUrl?: string;
  grade: string;
  subject: string;
  trimester?: string;
  language?: 'ar' | 'fr';
  instructions?: string;
  blockToRegenerate?: 'steps' | 'cards' | 'example' | 'remember' | 'formula' | 'quote';
  currentMemo?: MemoDoc;
}

export interface MemoGenerateResponse {
  ok: boolean;
  result?: MemoDoc;
  extractedText?: string;
  error?: string;
}
