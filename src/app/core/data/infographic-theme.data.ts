import { InfographicTheme, isInfographicTheme } from '../models/infographic-spec.model';

export interface ThemeColors {
  bg: string;
  ink: string;
  muted: string;
  card: string;
  border: string;
  hero: string;
  accents: [string, string, string, string];
  /** Sheet title. */
  title: string;
  /** Small headings and strong labels (chips, box headings, footer author). */
  heading: string;
  /** Background of the "to remember" box. */
  tip: string;
}

/**
 * Sheet frame. `plain` = rounded card with the accent bar on top;
 * `fiche` = Tunisian worksheet look: dashed navy frame, stars, flag badge.
 */
export type ThemeFrame = 'plain' | 'fiche';

export interface InfographicThemeDef {
  id: InfographicTheme;
  nameFr: string;
  nameAr: string;
  colors: ThemeColors;
  radius: string;
  borderWidth: string;
  titleSize: string;
  /** CSS font-family for the title and headings (the font must be loaded in index.html). */
  fontDisplay: string;
  frame: ThemeFrame;
  imageStyle: string;
}

/** Same stack as Tailwind's `font-display`, so old themes keep their exact look. */
const APP_DISPLAY_FONT = 'var(--font-display)';

export const INFOGRAPHIC_THEMES_CONFIG: Record<InfographicTheme, InfographicThemeDef> = {
  kids: {
    id: 'kids',
    nameFr: 'Enfants',
    nameAr: 'أطفال',
    colors: {
      bg: '#FFFDF9',
      ink: '#182238',
      muted: '#5B667D',
      card: '#FFFFFF',
      border: '#F0DCB0',
      hero: '#FFF5DD',
      accents: ['#E67E22', '#1B998B', '#2E86AB', '#E63946'],
      title: '#14251D',
      heading: '#14251D',
      tip: '#FFF5DD',
    },
    radius: '20px',
    borderWidth: '2.5px',
    titleSize: '2.35rem',
    fontDisplay: APP_DISPLAY_FONT,
    frame: 'plain',
    imageStyle:
      "2D children's book cartoon illustration, soft clean outlines, flat pastel colors with gentle watercolor shading, friendly rounded shapes, white background",
  },
  official: {
    id: 'official',
    nameFr: 'Officiel',
    nameAr: 'رسمي',
    colors: {
      bg: '#FBF9F5',
      ink: '#14251D',
      muted: '#526358',
      card: '#FFFFFF',
      border: '#E5DDCD',
      hero: '#F3ECE0',
      accents: ['#8A5A00', '#2D6A4F', '#1B4332', '#B85329'],
      title: '#14251D',
      heading: '#14251D',
      tip: '#F3ECE0',
    },
    radius: '14px',
    borderWidth: '1.5px',
    titleSize: '1.95rem',
    fontDisplay: APP_DISPLAY_FONT,
    frame: 'plain',
    imageStyle:
      'Flat 2D vector-style educational illustration, clean smooth outlines, flat colors with minimal soft shading, simple friendly shapes, white background',
  },
  fiche: {
    id: 'fiche',
    nameFr: 'Fiche classe',
    nameAr: 'بطاقة القسم',
    colors: {
      bg: '#FFFFFF',
      ink: '#1E2A78',
      muted: '#46518F',
      card: '#FFFFFF',
      border: '#1E2A78',
      hero: '#E8F1FC',
      accents: ['#D62828', '#1E2A78', '#2E7DD1', '#B45309'],
      title: '#D62828',
      heading: '#1E2A78',
      tip: '#FFF4CC',
    },
    radius: '12px',
    borderWidth: '2px',
    titleSize: '2.3rem',
    fontDisplay: "'Changa', 'Noto Kufi Arabic', system-ui, sans-serif",
    frame: 'fiche',
    imageStyle:
      "Warm 2D children's book illustration of Tunisian primary school pupils in a bright classroom, clean outlines, soft cel shading, cheerful expressive faces, consistent characters, white background",
  },
};

/** Theme for a saved or requested id; unknown or missing ids fall back to `kids`. */
export function resolveTheme(id: unknown): InfographicThemeDef {
  return isInfographicTheme(id) ? INFOGRAPHIC_THEMES_CONFIG[id] : INFOGRAPHIC_THEMES_CONFIG.kids;
}

export const THEME_IMAGE_STYLE: Record<InfographicTheme, string> = {
  kids: INFOGRAPHIC_THEMES_CONFIG.kids.imageStyle,
  official: INFOGRAPHIC_THEMES_CONFIG.official.imageStyle,
  fiche: INFOGRAPHIC_THEMES_CONFIG.fiche.imageStyle,
};

export type SpecImageTarget =
  | { kind: 'hero' }
  | { kind: 'item'; index: number }
  | { kind: 'column'; index: number }
  | { kind: 'problem' };
