/** Composition the renderer draws; the model picks one, it never writes layout. */
export type InfographicPreset =
  | 'hero-cards'
  | 'circular-flow'
  | 'timeline'
  | 'central-picture'
  | 'lesson-stages'
  | 'comparison'
  | 'problem'
  | 'picture-rows'
  | 'steps-interface'
  | 'mindmap'
  | 'flashcards';

/** Look of the sheet (design tokens only). Scoped to AI Studio sheets, never the app UI. */
export type InfographicTheme = 'kids' | 'official' | 'fiche' | 'handwritten' | 'graph-paper' | 'poster' | 'comic' | 'lilac';

export const INFOGRAPHIC_PRESETS: readonly InfographicPreset[] = [
  'hero-cards',
  'circular-flow',
  'timeline',
  'central-picture',
  'lesson-stages',
  'comparison',
  'problem',
  'picture-rows',
  'steps-interface',
  'mindmap',
  'flashcards',
];
/**
 * Presets that have a renderer today. The model may only pick from these (schema enum + Auto list);
 * add an id here when its preset component ships. Unknown/old ids still load via INFOGRAPHIC_PRESETS.
 */
export const ENABLED_INFOGRAPHIC_PRESETS: readonly InfographicPreset[] = [
  'hero-cards',
  'circular-flow',
  'timeline',
  'central-picture',
  'lesson-stages',
  'comparison',
  'problem',
  'picture-rows',
  'steps-interface',
  'mindmap',
  'flashcards',
];
export const INFOGRAPHIC_THEMES: readonly InfographicTheme[] = [
  'kids',
  'official',
  'fiche',
  'handwritten',
  'graph-paper',
  'poster',
  'comic',
  'lilac',
];

/** Narrows untrusted input (request body, saved doc) to a known theme id. */
export function isInfographicTheme(value: unknown): value is InfographicTheme {
  return typeof value === 'string' && (INFOGRAPHIC_THEMES as readonly string[]).includes(value);
}

/** Material icon names the model may pick from (anything else falls back to `star`). */
export const SPEC_ICONS: readonly string[] = [
  'star', 'lightbulb', 'bolt', 'favorite', 'eco', 'water_drop', 'wb_sunny', 'public',
  'pets', 'science', 'calculate', 'menu_book', 'edit', 'palette', 'music_note', 'directions_run',
  'home', 'park', 'restaurant', 'health_and_safety', 'schedule', 'groups', 'flag', 'extension',
  'help_outline', 'quiz', 'assignment', 'insights',
  'looks_one', 'looks_two', 'looks_3', 'looks_4', 'looks_5', 'looks_6',
];

export interface SpecItem {
  title: string;
  text: string;
  icon: string;
  /** Exact quantity (1-10) drawn as dots by our code, for counting lessons (images miscount). */
  count?: number;
  /** Word inside `text` the renderer paints in the accent colour (picture-rows). Plain text, never HTML. */
  keyword?: string;
  wantsImage?: boolean;
  imagePrompt?: string;
  imageUrl?: string;
}

export interface SpecHero {
  /** Big focal text: a letter, number, word or short formula (rendered as real text, never an image). */
  label: string;
  caption?: string;
  wantsImage?: boolean;
  imagePrompt?: string;
  imageUrl?: string;
}

export interface SpecColumn {
  title: string;
  subtitle?: string;
  points: string[];
  wantsImage?: boolean;
  imagePrompt?: string;
  imageUrl?: string;
}

export interface SpecStage {
  stageNumber: number;
  title: string;
  teacherActivity: string;
  learnerActivity: string;
  duration?: string;
  wantsImage?: boolean;
  imagePrompt?: string;
  imageUrl?: string;
}

export interface SpecQuote {
  text: string;
  author?: string;
}

export interface SpecProblemTable {
  headers: string[];
  rows: string[][];
}

export interface SpecProblemQuestion {
  text: string;
  linesCount?: number;
}

export interface SpecProblem {
  situation: string;
  table?: SpecProblemTable;
  questions: SpecProblemQuestion[];
  wantsImage?: boolean;
  imagePrompt?: string;
  imageUrl?: string;
}

/** One field of the simplified screen mockup: a question, a setting, a menu entry... */
export interface SpecInterfaceField {
  label: string;
  /** How the field is drawn: radio choices, short answer line, paragraph box, or a plain button. */
  kind: 'choice' | 'short' | 'long' | 'button';
  hint?: string;
  options?: string[];
}

/** Simplified screen of the tool being taught (drawn by our code as HTML, never an image). */
export interface SpecInterface {
  appName: string;
  tabs: string[];
  fields: SpecInterfaceField[];
}

export interface InfographicSpec {
  preset: InfographicPreset;
  title: string;
  subtitle?: string;
  /** What the student must do with this sheet (e.g. "Observe chaque image, puis écris une phrase."). */
  instruction?: string;
  hero?: SpecHero;
  items: SpecItem[];
  /** 0-3 short points to remember. */
  remember: string[];
  /** Optional exact diagram as inline SVG (already sanitized server-side). */
  diagramSvg?: string;
  /** Optional 2 comparison sides for comparison preset */
  columns?: SpecColumn[];
  /** Optional pedagogical stages for lesson-stages preset */
  stages?: SpecStage[];
  /** Optional quote for central-picture preset */
  quote?: SpecQuote;
  /** Optional problem solving layout for problem preset */
  problem?: SpecProblem;
  /** Simplified screen mockup for the steps-interface preset */
  interface?: SpecInterface;
  /** One English sentence of lesson context (topic + key objects), prepended to every image prompt. */
  imageStory?: string;
  /** Per-doc image library carrying illustrations across layout switches */
  imageLibrary?: Record<string, string>;
}

/** Item count limits per composition. */
export const PRESET_ITEM_LIMITS: Record<InfographicPreset, { min: number; max: number }> = {
  'hero-cards': { min: 3, max: 6 },
  'circular-flow': { min: 3, max: 6 },
  timeline: { min: 3, max: 6 },
  'central-picture': { min: 2, max: 6 },
  // content lives in `stages`, items are optional extras
  'lesson-stages': { min: 0, max: 5 },
  // content lives in `columns`, items are optional extras
  comparison: { min: 0, max: 4 },
  // content lives in `problem`, items are optional extras
  problem: { min: 0, max: 4 },
  // one numbered row per picture + sentence
  'picture-rows': { min: 2, max: 5 },
  // numbered steps beside a simplified screen mockup (`interface`)
  'steps-interface': { min: 3, max: 6 },
  mindmap: { min: 3, max: 8 },
  flashcards: { min: 4, max: 8 },
};
