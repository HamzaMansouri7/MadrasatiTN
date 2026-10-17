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

export interface SceneSpeechBubble {
  speaker?: string;
  text: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
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
  /** Comprehension question on this panel for students */
  question?: string;
  /** Expected model answer for the teacher's key */
  answer?: string;
  /** Speech bubble dialogue typed as real Arabic/French text on top of the image */
  speechBubble?: SceneSpeechBubble;
  /** planned = outline only; ready = pupil text written. */
  status?: 'planned' | 'ready';
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
  /** 'history' keeps realistic educational illustration; 'story' uses children's storybook style */
  mode?: 'history' | 'story';
  createdAt?: string | number;
  updatedAt?: string | number;
}
