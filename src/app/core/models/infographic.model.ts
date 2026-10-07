import { GradeLevel, SubjectName } from './education.model';

export type SlotKind =
  | 'header-strip'
  | 'list'
  | 'timeline-stages'
  | 'table'
  | 'key-values'
  | 'text'
  | 'reflection-lines';

export interface InfographicSlot {
  id: string;
  kind: SlotKind;
  titleFr: string;
  titleAr: string;
  count?: number;
  maxChars?: number;
  icon?: string;
  color?: string;
}

export interface InfographicTemplate {
  id: string;
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
  values: LessonPlanDocValues | Record<string, unknown>;
  author?: InfographicAuthor;
  createdAt?: string | number;
  updatedAt?: string | number;
}
