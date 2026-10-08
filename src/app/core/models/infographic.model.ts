import { GradeLevel, SubjectName } from './education.model';

export type SlotKind =
  | 'header-strip'
  | 'list'
  | 'timeline-stages'
  | 'table'
  | 'key-values'
  | 'text'
  | 'reflection-lines';

/** Where a slot sits on the A4 sheet. */
export type SlotZone = 'strip' | 'side' | 'sidePair' | 'main' | 'half' | 'full';

/** How a `list` slot is drawn. */
export type SlotVariant = 'checks' | 'bullets' | 'chips' | 'compact';

export interface SlotRow {
  labelFr: string;
  labelAr: string;
  valueKey: string;
  color?: string;
}

export interface InfographicSlot {
  id: string;
  kind: SlotKind;
  titleFr: string;
  titleAr: string;
  zone: SlotZone;
  /** Key in `InfographicDoc.values` holding this slot's data (list, timeline-stages, reflection-lines). */
  valueKey?: string;
  /** `table` slots: one labelled row per value key. */
  rows?: SlotRow[];
  variant?: SlotVariant;
  count?: number;
  maxChars?: number;
  icon?: string;
  /** Flat 2D SVG in `public/assets/lesson-plan/svg/<name>.svg`; replaces the Material icon when set. */
  illustration?: string;
  color?: string;
}

export interface InfographicTemplate {
  id: string;
  schemaVersion: number;
  nameFr: string;
  nameAr: string;
  page: 'A4-portrait' | 'A4-landscape';
  slots: InfographicSlot[];
}

export interface LessonPlanStage {
  step: string;
  name: string;
  minutes: number;
  teacherActivity: string;
  studentActivity: string;
  modality?: string;
}

export interface LessonPlanDocValues {
  // 1. Info strip
  grade?: GradeLevel | string;
  subject?: SubjectName | string;
  topic?: string;
  durationMinutes?: number;
  week?: string;
  date?: string;

  // 2. Learning Objectives
  objectives: string[];

  // 3. Learning Outcomes / Competencies
  outcomes: string[];

  // 4. Materials
  materials: string[];

  // 5 & 6. Stages & Activities (01-05)
  stages: LessonPlanStage[];

  // 7. Assessment
  assessmentCriteria: string[];

  // 8. Differentiation (Support & Enrichment)
  supportActivities: string[];
  enrichmentActivities: string[];

  // 9. Integration
  crossSubjectIntegration: string[];

  // 10. Values
  targetValues: string[];

  // 11. Homework
  homework: string[];

  // 12. Teacher Reflection Questions
  reflectionQuestions: string[];
}

export interface InfographicAuthor {
  name?: string;
  school?: string;
  governorate?: string;
  schoolYear?: string;
}

export interface InfographicDoc {
  id: string;
  templateId: string;
  title: string;
  grade: GradeLevel | string;
  subject: SubjectName | string;
  language: 'ar' | 'fr';
  /** AI Studio spec docs only: look of the sheet. */
  theme?: 'kids' | 'official';
  /** AI Studio: listed in the library (false = private draft, reachable by link). */
  published?: boolean;
  /** AI Studio: library section the sheet is filed under. */
  resourceKind?: 'course' | 'exercise';
  trimester?: string;
  /** AI Studio: image library carrying over illustrations across presets. */
  imageLibrary?: Record<string, string>;
  values: LessonPlanDocValues | Record<string, unknown>;
  author?: InfographicAuthor;
  createdAt?: string | number;
  updatedAt?: string | number;
  /** Set client-side from the server on load; true only for the signed-in creator. Never persisted. */
  isOwner?: boolean;
}
