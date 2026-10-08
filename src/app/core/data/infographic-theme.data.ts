import { InfographicTheme } from '../models/infographic-spec.model';

export interface ThemeColors {
  bg: string;
  ink: string;
  muted: string;
  card: string;
  border: string;
  hero: string;
  accents: [string, string, string, string];
}

export interface InfographicThemeDef {
  id: InfographicTheme;
  nameFr: string;
  nameAr: string;
  colors: ThemeColors;
  radius: string;
  borderWidth: string;
  titleSize: string;
  imageStyle: string;
}

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
    },
    radius: '20px',
    borderWidth: '2.5px',
    titleSize: '2.35rem',
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
    },
    radius: '14px',
    borderWidth: '1.5px',
    titleSize: '1.95rem',
    imageStyle:
      'Flat 2D vector-style educational illustration, clean smooth outlines, flat colors with minimal soft shading, simple friendly shapes, white background',
  },
};

export const THEME_IMAGE_STYLE: Record<InfographicTheme, string> = {
  kids: INFOGRAPHIC_THEMES_CONFIG.kids.imageStyle,
  official: INFOGRAPHIC_THEMES_CONFIG.official.imageStyle,
};

export type SpecImageTarget =
  | { kind: 'hero' }
  | { kind: 'item'; index: number }
  | { kind: 'column'; index: number }
  | { kind: 'problem' };
