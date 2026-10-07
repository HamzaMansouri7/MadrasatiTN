import { GradeLevel, SubjectName } from './education.model';

export type SceneKind = 'scene' | 'roles' | 'map' | 'timeline';

export interface SeriesCharacter {
  name: string;
  role: string;
  visualDescription: string;
}

export interface SeriesBible {
  characters: SeriesCharacter[];
  style: string;
  era: string;
}

export interface Scene {
  n: number;
  title: string;
  event: string;
  year?: string;
  text: string;
  caption?: string;
  imagePrompt: string;
  imageUrl?: string;
  kind: SceneKind;
  teachingGoal?: string;
}

export interface SeriesAuthor {
  name?: string;
  school?: string;
  governorate?: string;
}

export interface SeriesDoc {
  id: string;
  title: string;
  grade: GradeLevel | string;
  subject: SubjectName | string;
  language: 'ar' | 'fr';
  bible: SeriesBible;
  scenes: Scene[];
  author?: SeriesAuthor;
  sourceText?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
}
