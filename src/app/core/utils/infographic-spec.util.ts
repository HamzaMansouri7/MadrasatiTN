import {
  INFOGRAPHIC_PRESETS,
  InfographicPreset,
  InfographicSpec,
  PRESET_ITEM_LIMITS,
  SPEC_ICONS,
  SpecItem,
} from '../models/infographic-spec.model';

const SVG_TAGS = new Set([
  'svg', 'g', 'defs', 'use', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon',
  'text', 'tspan', 'lineargradient', 'radialgradient', 'stop', 'title', 'desc',
]);

const SVG_ATTRS = new Set([
  'viewbox', 'xmlns', 'width', 'height', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
  'd', 'points', 'transform', 'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-linecap',
  'stroke-linejoin', 'stroke-dasharray', 'stroke-opacity', 'opacity', 'id', 'offset', 'stop-color', 'stop-opacity',
  'text-anchor', 'dominant-baseline', 'font-size', 'font-weight', 'font-family', 'dx', 'dy', 'direction',
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

/**
 * Coerces raw model output into a safe, renderable spec: known preset, item count within the
 * preset limits, clipped text, allow-listed icons, sanitized SVG. Returns null when nothing usable.
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
      return { title, text, icon };
    })
    .filter((it): it is SpecItem => it !== null)
    .slice(0, max);

  const title = clip(r['title'], 80);
  if (!title || items.length < min) return null;

  const heroRaw = r['hero'] && typeof r['hero'] === 'object' ? (r['hero'] as Record<string, unknown>) : null;
  const heroLabel = heroRaw ? clip(heroRaw['label'], 24) : '';
  const diagramSvg = sanitizeSvg(r['diagramSvg']);

  return {
    preset,
    title,
    subtitle: clip(r['subtitle'], 120) || undefined,
    hero: heroLabel ? { label: heroLabel, caption: clip(heroRaw?.['caption'], 60) || undefined } : undefined,
    items,
    remember: (Array.isArray(r['remember']) ? (r['remember'] as unknown[]) : [])
      .map((x) => clip(x, 110))
      .filter(Boolean)
      .slice(0, 3),
    diagramSvg: diagramSvg || undefined,
  };
}
