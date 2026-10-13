/** Types of catalog.json produced by parascolaire/tools/publish_catalog.py (docs/PARASCOLAIRE-MODULE-SPEC.md section 4). */

export type SlotStatus = 'ready' | 'in-progress' | 'soon';
export type SlotKind = 'infographic' | 'course' | 'video';

export interface InfographicSlot {
  status: SlotStatus;
  orientation?: 'landscape' | 'portrait';
  full?: string;
  thumb?: string;
  w?: number;
  h?: number;
}

export interface CourseSlot {
  status: SlotStatus;
  pages?: string[];
  thumb?: string;
  w?: number;
  h?: number;
  pdf?: string;
  pdfBytes?: number;
}

export interface VideoSlot {
  status: SlotStatus;
  file?: string;
  bytes?: number;
}

export interface ParascolaireTheme {
  id: string;
  n: number;
  title: string;
  subject: string;
  exerciseCount: number;
  slots: { infographic: InfographicSlot; course: CourseSlot; video: VideoSlot };
}

export interface ParascolaireBook {
  id: string;
  classe: string;
  title: string;
  number: number;
  subject: string;
  subjects: string[];
  themeCount: number;
  readyCount: number;
  resources: { parentGuide: { status: SlotStatus } };
  cover?: string;
  themes: ParascolaireTheme[];
}

export interface ParascolaireClass {
  id: string;
  label: string;
  order: number;
}

export interface ParascolaireCatalog {
  version: number;
  generatedAt: string;
  classes: ParascolaireClass[];
  books: ParascolaireBook[];
}

export type ThemeStatusFilter = 'all' | 'ready' | 'pending';
