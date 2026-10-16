import { InfographicTheme, isInfographicTheme } from '../models/infographic-spec.model';
import { SeasonName } from '../models/infographic.model';

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
export type ThemeFrame =
  | 'plain'
  | 'fiche'
  | 'notebook'
  | 'graph'
  | 'poster'
  | 'comic'
  | 'boxed'
  | 'blackboard'
  | 'herbarium'
  | 'encyclopedia'
  | 'seasons';

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
  handwritten: {
    id: 'handwritten',
    nameFr: 'Notes de classe',
    nameAr: 'دفتر ملاحظات',
    colors: {
      bg: '#FEFCF6',
      ink: '#1D3557',
      muted: '#457B9D',
      card: '#FFFFFF',
      border: '#E2D9C8',
      hero: '#FFF8E7',
      accents: ['#E63946', '#1D3557', '#2A9D8F', '#E76F51'],
      title: '#1D3557',
      heading: '#E63946',
      tip: '#FEF08A',
    },
    radius: '8px',
    borderWidth: '1.5px',
    titleSize: '2.1rem',
    fontDisplay: "'Changa', 'Noto Kufi Arabic', system-ui, sans-serif",
    frame: 'notebook',
    imageStyle:
      'Clean hand-drawn scientific ink line sketch and colored pencil study doodle, textbook margin illustration, white background',
  },
  'graph-paper': {
    id: 'graph-paper',
    nameFr: 'Papier millimétré (Écorché)',
    nameAr: 'ورق تقني ومخطط تشريحي',
    colors: {
      bg: '#F0F9FF',
      ink: '#0F172A',
      muted: '#475569',
      card: '#FFFFFF',
      border: '#BAE6FD',
      hero: '#E0F2FE',
      accents: ['#0284C7', '#0D9488', '#2563EB', '#DC2626'],
      title: '#0369A1',
      heading: '#0F172A',
      tip: '#E0F2FE',
    },
    radius: '10px',
    borderWidth: '1.5px',
    titleSize: '2.0rem',
    fontDisplay: APP_DISPLAY_FONT,
    frame: 'graph',
    imageStyle:
      'Detailed cross-section scientific anatomical cutaway illustration, engineering precision, clean flat colors, medical textbook diagram, white background',
  },
  poster: {
    id: 'poster',
    nameFr: 'Affiche murale',
    nameAr: 'ملصق حائطي',
    colors: {
      bg: '#FFFDF5',
      ink: '#18181B',
      muted: '#52525B',
      card: '#FFFFFF',
      border: '#F59E0B',
      hero: '#FEF3C7',
      accents: ['#DC2626', '#2563EB', '#059669', '#D97706'],
      title: '#B45309',
      heading: '#18181B',
      tip: '#FEF3C7',
    },
    radius: '16px',
    borderWidth: '3px',
    titleSize: '2.5rem',
    fontDisplay: "'Changa', 'Noto Kufi Arabic', system-ui, sans-serif",
    frame: 'poster',
    imageStyle:
      'High-impact classroom poster illustration, bold clear focal artwork, vibrant colors, clean outlines, white background',
  },
  comic: {
    id: 'comic',
    nameFr: 'Bande dessinée',
    nameAr: 'قصة مصورة (BD)',
    colors: {
      bg: '#FFFBEB',
      ink: '#18181B',
      muted: '#71717A',
      card: '#FFFFFF',
      border: '#18181B',
      hero: '#FEF08A',
      accents: ['#EF4444', '#3B82F6', '#10B981', '#F59E0B'],
      title: '#18181B',
      heading: '#18181B',
      tip: '#FEF08A',
    },
    radius: '12px',
    borderWidth: '3px',
    titleSize: '2.2rem',
    fontDisplay: "'Changa', 'Noto Kufi Arabic', system-ui, sans-serif",
    frame: 'comic',
    imageStyle:
      'Classic educational comic book panel illustration, expressive dynamic characters, clean outlines, cel shading, bright school story style, white background',
  },
  lilac: {
    id: 'lilac',
    nameFr: 'Fiche numérique',
    nameAr: 'ورقة رقمية',
    colors: {
      bg: '#FFFFFF',
      ink: '#2B2350',
      muted: '#5E5A7A',
      card: '#FFFFFF',
      border: '#8B6FD6',
      hero: '#F1EBFC',
      accents: ['#7C5CD6', '#E0357A', '#4F6FE0', '#2A9D8F'],
      title: '#3E2A8F',
      heading: '#3E2A8F',
      tip: '#F1EBFC',
    },
    radius: '14px',
    borderWidth: '2px',
    titleSize: '2.2rem',
    fontDisplay: "'Changa', 'Noto Kufi Arabic', system-ui, sans-serif",
    frame: 'boxed',
    imageStyle:
      'Friendly flat educational icon illustration with soft rounded shapes and clean outlines, purple and pink accents, white background',
  },
  blackboard: {
    id: 'blackboard',
    nameFr: 'Tableau noir',
    nameAr: 'سبورة القسم',
    colors: {
      bg: '#1A2721',
      ink: '#F5F7F2',
      muted: '#9BB1A5',
      card: '#22342C',
      border: '#3A5246',
      hero: '#2A3F35',
      accents: ['#FFE066', '#8CE99A', '#74C0FC', '#FFA8A8'],
      title: '#FFE066',
      heading: '#F5F7F2',
      tip: '#2A3F35',
    },
    radius: '10px',
    borderWidth: '1.5px',
    titleSize: '2.2rem',
    fontDisplay: "'Changa', 'Noto Kufi Arabic', system-ui, sans-serif",
    frame: 'blackboard',
    imageStyle:
      'Chalk drawing on a dark school blackboard, crisp white and pastel chalk outlines, soft smudged chalk shading, clean textbook diagrams, text-free, dark chalkboard background',
  },
  herbarium: {
    id: 'herbarium',
    nameFr: 'Planche herbier',
    nameAr: 'لوحة الأعشاب والنبات',
    colors: {
      bg: '#FAF6EE',
      ink: '#1B3B2B',
      muted: '#5C7967',
      card: '#FFFFFF',
      border: '#C2D4BB',
      hero: '#EAF3E7',
      accents: ['#4F772D', '#DDA15E', '#BC6C25', '#8C2D40'],
      title: '#2D5A3E',
      heading: '#1B3B2B',
      tip: '#EAF3E7',
    },
    radius: '10px',
    borderWidth: '1.5px',
    titleSize: '2.1rem',
    fontDisplay: APP_DISPLAY_FONT,
    frame: 'herbarium',
    imageStyle:
      'Vintage botanical herbarium plate illustration, fine watercolor wash, detailed ink botanical line art, pressed plant study, text-free, off-white parchment background',
  },
  encyclopedia: {
    id: 'encyclopedia',
    nameFr: 'Encyclopédie',
    nameAr: 'موسوعة علمية كلاسيكية',
    colors: {
      bg: '#F8F3E5',
      ink: '#272019',
      muted: '#6B5E50',
      card: '#FFFCF5',
      border: '#D0C3AC',
      hero: '#EFE6D4',
      accents: ['#871F28', '#1D3557', '#C27827', '#2D5D46'],
      title: '#871F28',
      heading: '#272019',
      tip: '#EFE6D4',
    },
    radius: '8px',
    borderWidth: '1.5px',
    titleSize: '2.1rem',
    fontDisplay: APP_DISPLAY_FONT,
    frame: 'encyclopedia',
    imageStyle:
      'Classic vintage encyclopedia engraving illustration, fine etching line work, delicate antique watercolor wash, historical scientific dictionary plate, text-free, warm antique paper background',
  },
  seasons: {
    id: 'seasons',
    nameFr: '4 Saisons',
    nameAr: 'الفصول الأربعة',
    colors: {
      bg: '#F4FBF4',
      ink: '#153621',
      muted: '#4B7356',
      card: '#FFFFFF',
      border: '#B6DFBC',
      hero: '#E1F6E4',
      accents: ['#2D6A4F', '#E85D75', '#F4A261', '#4EA8DE'],
      title: '#1B4332',
      heading: '#153621',
      tip: '#E1F6E4',
    },
    radius: '14px',
    borderWidth: '2px',
    titleSize: '2.2rem',
    fontDisplay: APP_DISPLAY_FONT,
    frame: 'seasons',
    imageStyle:
      'Vibrant seasonal nature educational illustration with fresh flora and seasonal atmosphere, clean outlines, rich watercolor shading, text-free, white background',
  },
};

export const SEASON_THEMES_CONFIG: Record<SeasonName, InfographicThemeDef> = {
  spring: {
    id: 'seasons',
    nameFr: 'Printemps',
    nameAr: 'فصل الربيع',
    colors: {
      bg: '#F4FBF4',
      ink: '#153621',
      muted: '#4B7356',
      card: '#FFFFFF',
      border: '#B6DFBC',
      hero: '#E1F6E4',
      accents: ['#2D6A4F', '#E85D75', '#F4A261', '#4EA8DE'],
      title: '#1B4332',
      heading: '#153621',
      tip: '#E1F6E4',
    },
    radius: '14px',
    borderWidth: '2px',
    titleSize: '2.2rem',
    fontDisplay: APP_DISPLAY_FONT,
    frame: 'seasons',
    imageStyle:
      'Fresh spring season illustration, vibrant budding flowers and young green leaves, bright cheerful morning sunlight, watercolor and clean outlines, text-free, white background',
  },
  summer: {
    id: 'seasons',
    nameFr: 'Été',
    nameAr: 'فصل الصيف',
    colors: {
      bg: '#FFFDF0',
      ink: '#14233C',
      muted: '#52657E',
      card: '#FFFFFF',
      border: '#FDE047',
      hero: '#FEF9C3',
      accents: ['#EAB308', '#0284C7', '#F43F5E', '#10B981'],
      title: '#B45309',
      heading: '#14233C',
      tip: '#FEF9C3',
    },
    radius: '14px',
    borderWidth: '2px',
    titleSize: '2.2rem',
    fontDisplay: APP_DISPLAY_FONT,
    frame: 'seasons',
    imageStyle:
      'Bright summer season educational illustration, radiant warm sunlight, golden sunshine and azure sea tones, lush vibrant colors, text-free, white background',
  },
  autumn: {
    id: 'seasons',
    nameFr: 'Automne',
    nameAr: 'فصل الخريف',
    colors: {
      bg: '#FFF9F2',
      ink: '#2E1C14',
      muted: '#765647',
      card: '#FFFFFF',
      border: '#FED7AA',
      hero: '#FFEDD5',
      accents: ['#EA580C', '#D97706', '#991B1B', '#854D0E'],
      title: '#9A3412',
      heading: '#2E1C14',
      tip: '#FFEDD5',
    },
    radius: '14px',
    borderWidth: '2px',
    titleSize: '2.2rem',
    fontDisplay: APP_DISPLAY_FONT,
    frame: 'seasons',
    imageStyle:
      'Cozy autumn season illustration, golden amber and copper falling leaves, warm harvest atmosphere, rich watercolor textures, text-free, white background',
  },
  winter: {
    id: 'seasons',
    nameFr: 'Hiver',
    nameAr: 'فصل الشتاء',
    colors: {
      bg: '#F0F9FF',
      ink: '#0F172A',
      muted: '#475569',
      card: '#FFFFFF',
      border: '#BAE6FD',
      hero: '#E0F2FE',
      accents: ['#0284C7', '#1D4ED8', '#0F766E', '#DC2626'],
      title: '#0369A1',
      heading: '#0F172A',
      tip: '#E0F2FE',
    },
    radius: '14px',
    borderWidth: '2px',
    titleSize: '2.2rem',
    fontDisplay: APP_DISPLAY_FONT,
    frame: 'seasons',
    imageStyle:
      'Crisp winter season educational illustration, clean snowy frost tones, cool crystalline blue and evergreen accents, cozy atmosphere, text-free, white background',
  },
};

/** Theme for a saved or requested id; unknown or missing ids fall back to `kids`. */
export function resolveTheme(id: unknown, season?: SeasonName): InfographicThemeDef {
  if (id === 'seasons') {
    if (season && SEASON_THEMES_CONFIG[season]) {
      return SEASON_THEMES_CONFIG[season];
    }
    return INFOGRAPHIC_THEMES_CONFIG.seasons;
  }
  return isInfographicTheme(id) ? INFOGRAPHIC_THEMES_CONFIG[id] : INFOGRAPHIC_THEMES_CONFIG.kids;
}

/** Picture style plus the theme's own colours, so pictures match the page palette. */
export function themeImageStyle(id: unknown, season?: SeasonName): string {
  const t = resolveTheme(id, season);
  return `${t.imageStyle}. Limited colour palette: ${t.colors.accents.join(', ')}. Recurring characters keep identical faces, hair and clothes in every picture`;
}

export const THEME_IMAGE_STYLE: Record<InfographicTheme, string> = {
  kids: INFOGRAPHIC_THEMES_CONFIG.kids.imageStyle,
  official: INFOGRAPHIC_THEMES_CONFIG.official.imageStyle,
  fiche: INFOGRAPHIC_THEMES_CONFIG.fiche.imageStyle,
  handwritten: INFOGRAPHIC_THEMES_CONFIG.handwritten.imageStyle,
  'graph-paper': INFOGRAPHIC_THEMES_CONFIG['graph-paper'].imageStyle,
  poster: INFOGRAPHIC_THEMES_CONFIG.poster.imageStyle,
  comic: INFOGRAPHIC_THEMES_CONFIG.comic.imageStyle,
  lilac: INFOGRAPHIC_THEMES_CONFIG.lilac.imageStyle,
  blackboard: INFOGRAPHIC_THEMES_CONFIG.blackboard.imageStyle,
  herbarium: INFOGRAPHIC_THEMES_CONFIG.herbarium.imageStyle,
  encyclopedia: INFOGRAPHIC_THEMES_CONFIG.encyclopedia.imageStyle,
  seasons: INFOGRAPHIC_THEMES_CONFIG.seasons.imageStyle,
};

export type SpecImageTarget =
  | { kind: 'hero' }
  | { kind: 'item'; index: number }
  | { kind: 'column'; index: number }
  | { kind: 'stage'; index: number }
  | { kind: 'problem' };

