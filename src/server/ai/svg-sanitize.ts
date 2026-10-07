/**
 * Sanitizer for model-generated SVG before it is written to /uploads.
 * Policy: reject anything that can run code or load external content; strip event handlers.
 * Returns the cleaned SVG, or null when the input is not a safe SVG.
 */
const MAX_SVG_BYTES = 200 * 1024;

const FORBIDDEN_TAGS = /<\s*(script|foreignObject|iframe|object|embed|audio|video|link|meta|animate|set)\b/i;
const FORBIDDEN_URLS = /(javascript:|vbscript:|data:text\/html|data:application)/i;

export function sanitizeSvg(raw: string): string | null {
  const svg = String(raw ?? '')
    .replace(/```(?:xml|svg)?/gi, '')
    .trim();

  if (!svg || Buffer.byteLength(svg, 'utf8') > MAX_SVG_BYTES) return null;
  if (!/^<svg[\s>]/i.test(svg) || !/<\/svg>\s*$/i.test(svg)) return null;
  if (FORBIDDEN_TAGS.test(svg) || FORBIDDEN_URLS.test(svg)) return null;
  if (/<!ENTITY|<!DOCTYPE/i.test(svg)) return null;

  let out = svg;
  // Event handler attributes (onclick=, onload=, ...).
  out = out.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  // href / xlink:href may only point to an in-document id.
  out = out.replace(/\s+(?:xlink:)?href\s*=\s*("([^"]*)"|'([^']*)')/gi, (match, _q, dq, sq) => {
    const value = (dq ?? sq ?? '').trim();
    return value.startsWith('#') ? match : '';
  });
  // External resources in CSS.
  out = out.replace(/@import[^;]*;?/gi, '');
  out = out.replace(/url\(\s*["']?\s*(?:https?:)?\/\/[^)]*\)/gi, 'none');

  return out;
}
