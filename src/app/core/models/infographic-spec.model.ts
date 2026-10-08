/** Composition the renderer draws; the model picks one, it never writes layout. */
export type InfographicPreset = 'hero-cards' | 'circular-flow' | 'timeline';

/** Look of the sheet (design tokens only). `kids` is scoped to AI Studio sheets, never the app UI. */
export type InfographicTheme = 'kids' | 'official';

export const INFOGRAPHIC_PRESETS: readonly InfographicPreset[] = ['hero-cards', 'circular-flow', 'timeline'];
export const INFOGRAPHIC_THEMES: readonly InfographicTheme[] = ['kids', 'official'];

/** Material icon names the model may pick from (anything else falls back to `star`). */
export const SPEC_ICONS: readonly string[] = [
  'star', 'lightbulb', 'bolt', 'favorite', 'eco', 'water_drop', 'wb_sunny', 'public',
  'pets', 'science', 'calculate', 'menu_book', 'edit', 'palette', 'music_note', 'directions_run',
  'home', 'park', 'restaurant', 'health_and_safety', 'schedule', 'groups', 'flag', 'extension',
];

export interface SpecItem {
  title: string;
  text: string;
  icon: string;
}

export interface SpecHero {
  /** Big focal text: a letter, number, word or short formula (rendered as real text, never an image). */
  label: string;
  caption?: string;
}

export interface InfographicSpec {
  preset: InfographicPreset;
  title: string;
  subtitle?: string;
  hero?: SpecHero;
  items: SpecItem[];
  /** 0-3 short points to remember. */
  remember: string[];
  /** Optional exact diagram as inline SVG (already sanitized server-side). */
  diagramSvg?: string;
}

/** Item count limits per composition. */
export const PRESET_ITEM_LIMITS: Record<InfographicPreset, { min: number; max: number }> = {
  'hero-cards': { min: 4, max: 4 },
  'circular-flow': { min: 3, max: 6 },
  timeline: { min: 3, max: 6 },
};
