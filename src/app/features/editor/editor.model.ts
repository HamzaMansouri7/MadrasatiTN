import { GradeLevel, SubjectName } from '@core';

export type EditorBlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'callout'
  | 'exercise'
  | 'image'
  | 'cartouche'
  | 'divider'
  | 'quote';

export type CalloutVariant = 'info' | 'tip' | 'warning' | 'ministry';

export type ExerciseFormat = 'free' | 'qcm' | 'true_false' | 'fill_blanks' | 'matching' | 'ordering' | 'table' | 'column_calc' | 'chart';

export type ExerciseDifficulty = 'Facile' | 'Moyen' | 'Difficile';

export interface ExerciseCriterion {
  label: string;
  points: number;
  detail?: string;
}

export interface EditorBlock {
  id: string;
  type: EditorBlockType;
  content: string;
  placeholder?: string;
  // Heading specific
  level?: 1 | 2 | 3;
  // Callout specific
  calloutTitle?: string;
  calloutVariant?: CalloutVariant;
  // Exercise specific
  exerciseTitle?: string;
  exercisePoints?: number;
  exerciseSolution?: string;
  exerciseDifficulty?: ExerciseDifficulty;
  exerciseCriteria?: ExerciseCriterion[];
  showBaremeFrame?: boolean;
  showPedagogicalGrid?: boolean;
  parentGuide?: string;
  teacherNotes?: string;
  showSolution?: boolean;
  exerciseFormat?: ExerciseFormat;
  qcmOptions?: string[];
  qcmCorrectIndex?: number;
  tfStatements?: { text: string; answer: boolean }[];
  gapText?: string;
  matchingPairs?: { left: string; right: string }[];
  /** Ordering: items in the correct order (the sheet shows them mixed). */
  orderItems?: string[];
  /** Table to complete: a cell written [[answer]] is left empty on the sheet. */
  tableHeaders?: string[];
  tableRows?: string[][];
  /** Worked calculation set out in columns. */
  calcOperands?: string[];
  calcOperator?: '+' | '-' | '×';
  calcResult?: string;
  /** Chart to read or complete (chartBlanks = entries the pupil draws). */
  chartKind?: 'bar' | 'line';
  chartLabels?: string[];
  chartValues?: number[];
  chartBlanks?: number[];
  chartUnit?: string;
  // Image specific
  imageUrl?: string;
  imageCaption?: string;
}

export type DocumentType = 'course' | 'exam' | 'article' | 'exercise_sheet' | 'summary';

export interface StudioDocument {
  id: string;
  title: string;
  docType: DocumentType;
  subject: SubjectName;
  grade: GradeLevel;
  trimester: 'Trimestre 1' | 'Trimestre 2' | 'Trimestre 3';
  schoolYear: string;
  schoolName: string;
  teacherName: string;
  watermarkText: string;
  tags: string[];
  blocks: EditorBlock[];
  updatedAt: string;
}
