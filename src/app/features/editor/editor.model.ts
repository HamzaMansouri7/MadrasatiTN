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

export type ExerciseFormat = 'free' | 'qcm' | 'true_false' | 'fill_blanks' | 'matching';

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
  showSolution?: boolean;
  exerciseFormat?: ExerciseFormat;
  qcmOptions?: string[];
  qcmCorrectIndex?: number;
  tfStatements?: { text: string; answer: boolean }[];
  gapText?: string;
  matchingPairs?: { left: string; right: string }[];
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
