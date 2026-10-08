import {
  INFOGRAPHIC_PRESETS,
  InfographicPreset,
  InfographicSpec,
  PRESET_ITEM_LIMITS,
  SPEC_ICONS,
  SpecColumn,
  SpecItem,
  SpecProblem,
  SpecProblemQuestion,
  SpecProblemTable,
  SpecQuote,
  SpecStage,
} from '../models/infographic-spec.model';

const SVG_TAGS = new Set([
  'svg', 'g', 'defs', 'use', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon',
  'text', 'tspan', 'lineargradient', 'radialgradient', 'stop', 'title', 'desc',
]);

const SVG_ATTRS = new Set([
  'viewbox', 'xmlns', 'width', 'height', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
  'd', 'points', 'transform', 'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-linecap',
  'stroke-linejoin', 'stroke-dasharray', 'stroke-opacity', 'opacity', 'id', 'offset', 'stop-color', 'stop-opacity',
  'text-anchor', 'dominant-baseline', 'font-size', 'font-weight', 'font-family', 'dx', 'dy', 'direction', 'dir',
  'xml:space', 'preserveaspectratio', 'gradientunits', 'gradienttransform', 'fx', 'fy', 'href', 'xlink:href',
]);

const MAX_SVG_CHARS = 12_000;

/** A reference is safe only when it points inside the document (`#id`) or is a plain paint value. */
function safeAttrValue(name: string, value: string): boolean {
  const v = value.trim().toLowerCase();
  if (/javascript:|data:|vbscript:|<|&#/.test(v)) return false;
  if (name === 'href' || name === 'xlink:href') return v.startsWith('#');
  if (v.includes('url(') && !/^url\(\s*#[\w-]+\s*\)$/.test(v)) return false;
  return true;
}

/**
 * Whitelist sanitizer for model-written SVG. String based (no DOM) so it runs on the
 * server and in SSR. Returns '' when the markup is not a single usable `<svg>` document.
 */
export function sanitizeSvg(input: unknown): string {
  if (typeof input !== 'string') return '';
  let src = input.trim();
  if (!src || src.length > MAX_SVG_CHARS) return '';
  src = src.replace(/<!--[\s\S]*?-->/g, '').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '').replace(/<\?[\s\S]*?\?>/g, '');
  if (!/^<svg[\s>]/i.test(src) || !/<\/svg>\s*$/i.test(src)) return '';

  // Drop whole blocks that can run code or pull resources.
  src = src.replace(/<(script|style|foreignobject|image|iframe|object|embed|animate|set)\b[\s\S]*?(<\/\1>|\/>)/gi, '');

  const out = src.replace(/<(\/?)([a-zA-Z][\w:-]*)([^>]*)>/g, (_m, close: string, rawTag: string, rawAttrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!SVG_TAGS.has(tag)) return '';
    if (close) return `</${tag}>`;
    const selfClose = /\/\s*$/.test(rawAttrs);
    const attrs: string[] = [];
    const re = /([a-zA-Z_:][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(rawAttrs))) {
      const name = m[1].toLowerCase();
      const value = m[3] ?? m[4] ?? '';
      if (name.startsWith('on') || !SVG_ATTRS.has(name) || !safeAttrValue(name, value)) continue;
      attrs.push(`${name === 'viewbox' ? 'viewBox' : name}="${value.replace(/"/g, '&quot;')}"`);
    }
    if (tag === 'svg' && !attrs.some((a) => a.startsWith('xmlns='))) attrs.unshift('xmlns="http://www.w3.org/2000/svg"');
    return `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}${selfClose ? ' /' : ''}>`;
  });

  return /^<svg[\s>]/.test(out) && /<\/svg>\s*$/.test(out) ? out : '';
}

const clip = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '';

const TEXT_FREE_SUFFIX = ', no text, no letters, no numbers, no labels, no watermark, no symbols, no writing';

/**
 * Validates and sanitizes an English illustration prompt destined for FLUX.
 * Rejects Arabic characters completely (Arabic text must never reach FLUX),
 * clips length to 300 characters, and guarantees the text-free suffix.
 */
export function sanitizeImagePrompt(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  let prompt = input.replace(/\s+/g, ' ').trim();
  if (!prompt) return undefined;
  // Reject Arabic characters (Arabic must never reach FLUX)
  if (/[\u0600-\u06FF]/.test(prompt)) return undefined;

  prompt = prompt.slice(0, 300).trim();
  if (!prompt) return undefined;

  if (!prompt.toLowerCase().includes('no text')) {
    prompt += TEXT_FREE_SUFFIX;
  }
  return prompt;
}

/**
 * Validates imageUrl: only VPS local storage paths starting with /uploads/ are permitted.
 */
export function sanitizeImageUrl(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const url = input.trim();
  if (url.startsWith('/uploads/')) return url;
  return undefined;
}

/**
 * Coerces raw model output into a safe, renderable spec: known preset, item count within the
 * preset limits, clipped text, allow-listed icons, sanitized SVG, validated image prompts. Returns null when nothing usable.
 */
export function normalizeInfographicSpec(raw: unknown, fallbackPreset: InfographicPreset = 'hero-cards'): InfographicSpec | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const preset: InfographicPreset = INFOGRAPHIC_PRESETS.includes(r['preset'] as InfographicPreset)
    ? (r['preset'] as InfographicPreset)
    : fallbackPreset;
  const { min, max } = PRESET_ITEM_LIMITS[preset];

  const items: SpecItem[] = (Array.isArray(r['items']) ? (r['items'] as unknown[]) : [])
    .map((it): SpecItem | null => {
      if (!it || typeof it !== 'object') return null;
      const o = it as Record<string, unknown>;
      const title = clip(o['title'], 40);
      const text = clip(o['text'], 140);
      if (!title && !text) return null;
      const icon = typeof o['icon'] === 'string' && SPEC_ICONS.includes(o['icon']) ? o['icon'] : 'star';
      const count =
        typeof o['count'] === 'number' && Number.isInteger(o['count']) && o['count'] >= 1 && o['count'] <= 10
          ? o['count']
          : undefined;
      const wantsImage = Boolean(o['wantsImage']);
      const imagePrompt = o['wantsImage'] === false ? undefined : sanitizeImagePrompt(o['imagePrompt']);
      const imageUrl = sanitizeImageUrl(o['imageUrl']);
      return {
        title,
        text,
        icon,
        count,
        wantsImage: wantsImage || undefined,
        imagePrompt,
        imageUrl,
      };
    })
    .filter((it): it is SpecItem => it !== null)
    .slice(0, max);

  const title = clip(r['title'], 80);
  if (!title) return null;

  const heroRaw = r['hero'] && typeof r['hero'] === 'object' ? (r['hero'] as Record<string, unknown>) : null;
  const heroLabel = heroRaw ? clip(heroRaw['label'], 24) : '';
  const heroWantsImage = heroRaw ? Boolean(heroRaw['wantsImage']) : false;
  const heroImagePrompt = heroRaw ? sanitizeImagePrompt(heroRaw['imagePrompt']) : undefined;
  const heroImageUrl = heroRaw ? sanitizeImageUrl(heroRaw['imageUrl']) : undefined;
  const diagramSvg = sanitizeSvg(r['diagramSvg']);

  const columns: SpecColumn[] | undefined = Array.isArray(r['columns'])
    ? (r['columns'] as unknown[])
        .map((col): SpecColumn | null => {
          if (!col || typeof col !== 'object') return null;
          const c = col as Record<string, unknown>;
          const colTitle = clip(c['title'], 60);
          if (!colTitle) return null;
          const points = (Array.isArray(c['points']) ? (c['points'] as unknown[]) : [])
            .map((p) => clip(p, 140))
            .filter(Boolean)
            .slice(0, 6);
          const wantsImage = Boolean(c['wantsImage']);
          const imagePrompt = c['wantsImage'] === false ? undefined : sanitizeImagePrompt(c['imagePrompt']);
          const imageUrl = sanitizeImageUrl(c['imageUrl']);
          return {
            title: colTitle,
            subtitle: clip(c['subtitle'], 100) || undefined,
            points,
            wantsImage: wantsImage || undefined,
            imagePrompt,
            imageUrl,
          };
        })
        .filter((c): c is SpecColumn => c !== null)
        .slice(0, 4)
    : undefined;

  const stages: SpecStage[] | undefined = Array.isArray(r['stages'])
    ? (r['stages'] as unknown[])
        .map((st, idx): SpecStage | null => {
          if (!st || typeof st !== 'object') return null;
          const s = st as Record<string, unknown>;
          const stTitle = clip(s['title'], 60);
          const teacherActivity = clip(s['teacherActivity'], 200);
          const learnerActivity = clip(s['learnerActivity'], 200);
          if (!stTitle && !teacherActivity && !learnerActivity) return null;
          return {
            stageNumber: typeof s['stageNumber'] === 'number' ? s['stageNumber'] : idx + 1,
            title: stTitle,
            teacherActivity,
            learnerActivity,
            duration: clip(s['duration'], 30) || undefined,
          };
        })
        .filter((st): st is SpecStage => st !== null)
        .slice(0, 5)
    : undefined;

  const quoteRaw = r['quote'] && typeof r['quote'] === 'object' ? (r['quote'] as Record<string, unknown>) : null;
  const quoteText = quoteRaw ? clip(quoteRaw['text'], 240) : '';
  const quote: SpecQuote | undefined = quoteText
    ? { text: quoteText, author: clip(quoteRaw?.['author'], 60) || undefined }
    : undefined;

  // Problem preset normalization
  const probRaw = r['problem'] && typeof r['problem'] === 'object' ? (r['problem'] as Record<string, unknown>) : null;
  let problem: SpecProblem | undefined;
  if (probRaw) {
    const situation = clip(probRaw['situation'], 450);
    const questions: SpecProblemQuestion[] = (Array.isArray(probRaw['questions']) ? (probRaw['questions'] as unknown[]) : [])
      .map((q): SpecProblemQuestion | null => {
        if (!q) return null;
        if (typeof q === 'string') return { text: clip(q, 200), linesCount: 2 };
        const qo = q as Record<string, unknown>;
        const qText = clip(qo['text'], 200);
        if (!qText) return null;
        return {
          text: qText,
          linesCount: typeof qo['linesCount'] === 'number' ? Math.min(Math.max(qo['linesCount'], 1), 5) : 2,
        };
      })
      .filter((q): q is SpecProblemQuestion => q !== null);

    let table: SpecProblemTable | undefined;
    if (probRaw['table'] && typeof probRaw['table'] === 'object') {
      const tb = probRaw['table'] as Record<string, unknown>;
      const headers = (Array.isArray(tb['headers']) ? (tb['headers'] as unknown[]) : []).map((h) => clip(h, 40)).filter(Boolean);
      const rows = (Array.isArray(tb['rows']) ? (tb['rows'] as unknown[]) : [])
        .map((rRow) => (Array.isArray(rRow) ? (rRow as unknown[]).map((cell) => clip(cell, 60)) : []))
        .filter((rRow) => rRow.length > 0);
      if (headers.length || rows.length) {
        table = { headers, rows };
      }
    }

    if (situation || questions.length) {
      problem = {
        situation,
        table,
        questions,
        wantsImage: Boolean(probRaw['wantsImage']) || undefined,
        imagePrompt: probRaw['wantsImage'] === false ? undefined : sanitizeImagePrompt(probRaw['imagePrompt']),
        imageUrl: sanitizeImageUrl(probRaw['imageUrl']),
      };
    }
  }

  // Validate minimum requirements per preset
  if (preset === 'comparison' && (columns?.length ?? 0) < 2) return null;
  if (preset === 'lesson-stages' && (stages?.length ?? 0) < 2) return null;
  if (preset === 'problem' && !problem?.situation && (problem?.questions?.length ?? 0) < 1) return null;
  if (preset !== 'problem' && preset !== 'lesson-stages' && preset !== 'comparison' && items.length < min) return null;

  const imageStory = clip(r['imageStory'], 160);

  // Per-doc image library
  const imageLibrary: Record<string, string> = {};
  if (r['imageLibrary'] && typeof r['imageLibrary'] === 'object') {
    for (const [k, v] of Object.entries(r['imageLibrary'] as Record<string, unknown>)) {
      const cleanUrl = sanitizeImageUrl(v);
      if (cleanUrl) imageLibrary[clip(k, 80)] = cleanUrl;
    }
  }

  return {
    preset,
    title,
    subtitle: clip(r['subtitle'], 120) || undefined,
    hero: heroLabel || heroWantsImage || heroImageUrl
      ? {
          label: heroLabel,
          caption: clip(heroRaw?.['caption'], 60) || undefined,
          wantsImage: heroWantsImage || undefined,
          imagePrompt: heroImagePrompt,
          imageUrl: heroImageUrl,
        }
      : undefined,
    items,
    remember: (Array.isArray(r['remember']) ? (r['remember'] as unknown[]) : [])
      .map((x) => clip(x, 110))
      .filter(Boolean)
      .slice(0, 3),
    diagramSvg: diagramSvg || undefined,
    columns: columns?.length ? columns : undefined,
    stages: stages?.length ? stages : undefined,
    quote,
    problem,
    imageStory: imageStory && !/[؀-ۿ]/.test(imageStory) ? imageStory : undefined,
    imageLibrary: Object.keys(imageLibrary).length ? imageLibrary : undefined,
  };
}

/** Two numbers packed into one card title ("العدد 3 و 4", "3 et 4"). */
const MERGED_TITLE = /\d+\s*(?:و|et|&|,|-|\/)\s*\d+/;
/** Card text that describes the picture instead of teaching. */
const DESCRIBES_PICTURE = /^(?:تمثيل|صورة|رسم|يظهر|تظهر|نرى|في الصورة)|\b(?:image|illustration|dessin|on voit|représentation)\b/i;

/**
 * Content problems the normalizer can't fix (merged cards, duplicate titles, picture captions).
 * Short French notes, fed back to the model for one corrective retry.
 */
export function specQualityIssues(spec: InfographicSpec): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  spec.items.forEach((it, i) => {
    const n = i + 1;
    if (MERGED_TITLE.test(it.title)) issues.push(`carte ${n} ("${it.title}") regroupe deux idées : une seule idée par carte`);
    const key = it.title.trim().toLowerCase();
    if (key && seen.has(key)) issues.push(`carte ${n} répète le titre "${it.title}"`);
    seen.add(key);
    if (DESCRIBES_PICTURE.test(it.text.trim())) issues.push(`carte ${n} : le texte décrit l'image au lieu d'enseigner`);
  });
  return issues;
}
