import { InfographicTheme } from '../models/infographic-spec.model';

/**
 * Style block sent with every card image of a theme (PROMPT-SETTINGS.md §2), so all pictures
 * of one sheet share a look. English only; the image model never receives Arabic.
 */
export const THEME_IMAGE_STYLE: Record<InfographicTheme, string> = {
  kids: "2D children's book cartoon illustration, soft clean outlines, flat pastel colors with gentle watercolor shading, friendly rounded shapes, white background",
  official:
    'Flat 2D vector-style educational illustration, clean smooth outlines, flat colors with minimal soft shading, simple friendly shapes, white background',
};

/** Which block of a spec gets the picture. */
export type SpecImageTarget = { kind: 'hero' } | { kind: 'item'; index: number } | { kind: 'column'; index: number };
