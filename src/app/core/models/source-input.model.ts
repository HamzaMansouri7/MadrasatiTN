import { GradeLevel, SubjectName, Trimester } from './education.model';

export interface SourceInput {
  mode: 'topic' | 'text' | 'photo' | 'file';
  topic?: string;
  /** Official curriculum row id (CurriculumChapter.id) when the topic was picked from the programme. */
  topicId?: string;
  text?: string;
  instructions?: string;
  photos?: { base64Data: string; contentType: string }[];
  images?: { base64Data: string; contentType: string }[];
  file?: { base64Data: string; contentType: string; filename: string } | null;
  grade?: GradeLevel | string;
  subject?: SubjectName | string;
  trimester?: Trimester | string;
  language?: 'ar' | 'fr';
}
