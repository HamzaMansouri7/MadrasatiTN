import { INFOGRAPHIC_THEMES_CONFIG, ThemeColors } from '../data/infographic-theme.data';
import { InfographicTheme } from '../models/infographic-spec.model';
import { sanitizeSvg } from './infographic-spec.util';

export type DiagramTemplate =
  | 'cycle-ring'
  | 'numbered-staircase'
  | 'snake-road'
  | 'pyramid'
  | 'quadrant-grid'
  | 'pros-cons';

export interface DiagramItemInput {
  title: string;
  subtitle?: string;
  badge?: string | number;
  icon?: string;
}

export interface DiagramOptions {
  theme?: InfographicTheme;
  lang?: 'ar' | 'fr';
  title?: string;
}

/** Escapes XML special characters in string content. */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates an SVG diagram for the 6 school-fit diagram templates with RTL support,
 * Noto Kufi Arabic font, theme colors and full XML sanitization.
 */
export function generateSchoolDiagram(
  template: DiagramTemplate,
  items: DiagramItemInput[],
  options: DiagramOptions = {},
): string {
  const themeKey = options.theme ?? 'kids';
  const themeDef = INFOGRAPHIC_THEMES_CONFIG[themeKey] || INFOGRAPHIC_THEMES_CONFIG.kids;
  const colors: ThemeColors = themeDef.colors;
  const isRtl = options.lang !== 'fr';
  const font = "system-ui, 'Noto Kufi Arabic', 'Cairo', sans-serif";

  // Filter valid items
  const validItems = items.filter((it) => it && it.title?.trim());
  if (!validItems.length) return '';

  let body = '';

  switch (template) {
    case 'cycle-ring': {
      // 3 to 6 nodes arranged in a circle
      const count = Math.min(Math.max(validItems.length, 3), 6);
      const cx = 250;
      const cy = 140;
      const r = 90;
      const nodeR = 34;

      // Draw background dashed ring
      body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colors.border}" stroke-width="3" stroke-dasharray="6,6" opacity="0.6"/>`;

      for (let i = 0; i < count; i++) {
        // RTL starts from top and flows counter-clockwise or clockwise
        const angle = isRtl
          ? -Math.PI / 2 - (i * 2 * Math.PI) / count
          : -Math.PI / 2 + (i * 2 * Math.PI) / count;
        const nx = cx + r * Math.cos(angle);
        const ny = cy + r * Math.sin(angle);
        const accent = colors.accents[i % colors.accents.length];
        const item = validItems[i] || { title: `Étape ${i + 1}` };
        const badge = item.badge ?? i + 1;
        const title = escapeXml(item.title.slice(0, 24));

        body += `
          <g transform="translate(${nx.toFixed(1)}, ${ny.toFixed(1)})">
            <circle cx="0" cy="0" r="${nodeR}" fill="${colors.card}" stroke="${accent}" stroke-width="3" />
            <circle cx="0" cy="0" r="${nodeR - 5}" fill="${accent}" opacity="0.15" />
            <text x="0" y="-4" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-weight="bold" font-size="14" fill="${accent}">${badge}</text>
            <text x="0" y="14" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-weight="600" font-size="10" fill="${colors.ink}">${title}</text>
          </g>
        `;
      }
      break;
    }

    case 'numbered-staircase': {
      // Ascending staircase steps
      const count = Math.min(Math.max(validItems.length, 2), 5);
      const stepWidth = 420 / count;
      const stepMaxH = 180;
      const baseX = 40;
      const baseY = 240;

      for (let i = 0; i < count; i++) {
        const itemIdx = isRtl ? count - 1 - i : i;
        const item = validItems[itemIdx] || { title: `Niveau ${itemIdx + 1}` };
        const x = baseX + i * stepWidth;
        const h = 40 + ((i + 1) / count) * (stepMaxH - 40);
        const y = baseY - h;
        const accent = colors.accents[itemIdx % colors.accents.length];
        const title = escapeXml(item.title.slice(0, 20));
        const badge = item.badge ?? itemIdx + 1;

        body += `
          <g>
            <rect x="${x + 4}" y="${y}" width="${stepWidth - 8}" height="${h}" rx="10" fill="${colors.card}" stroke="${accent}" stroke-width="2.5" />
            <rect x="${x + 4}" y="${y}" width="${stepWidth - 8}" height="32" rx="10" fill="${accent}" />
            <text x="${x + stepWidth / 2}" y="${y + 16}" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-weight="bold" font-size="13" fill="#ffffff">${badge}</text>
            <text x="${x + stepWidth / 2}" y="${y + 54}" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-weight="700" font-size="11" fill="${colors.ink}">${title}</text>
          </g>
        `;
      }
      break;
    }

    case 'snake-road': {
      // Winding road / path connecting milestone nodes
      const count = Math.min(Math.max(validItems.length, 3), 5);
      const points: { x: number; y: number }[] = [];
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const x = isRtl ? 440 - t * 380 : 60 + t * 380;
        const y = 80 + Math.sin(i * 1.5) * 60 + 60;
        points.push({ x, y });
      }

      // Draw path line
      if (points.length > 1) {
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          const mx = (prev.x + curr.x) / 2;
          d += ` C ${mx} ${prev.y}, ${mx} ${curr.y}, ${curr.x} ${curr.y}`;
        }
        body += `<path d="${d}" fill="none" stroke="${colors.border}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`;
        body += `<path d="${d}" fill="none" stroke="${colors.accents[0]}" stroke-width="3" stroke-dasharray="8,6" stroke-linecap="round"/>`;
      }

      // Draw milestone nodes
      for (let i = 0; i < count; i++) {
        const p = points[i];
        const item = validItems[i] || { title: `Point ${i + 1}` };
        const accent = colors.accents[i % colors.accents.length];
        const badge = item.badge ?? i + 1;
        const title = escapeXml(item.title.slice(0, 18));

        body += `
          <g transform="translate(${p.x.toFixed(1)}, ${p.y.toFixed(1)})">
            <circle cx="0" cy="0" r="22" fill="${colors.card}" stroke="${accent}" stroke-width="3"/>
            <text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-weight="bold" font-size="12" fill="${accent}">${badge}</text>
            <rect x="-45" y="26" width="90" height="22" rx="6" fill="${colors.card}" stroke="${colors.border}" stroke-width="1.5"/>
            <text x="0" y="37" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-weight="600" font-size="10" fill="${colors.ink}">${title}</text>
          </g>
        `;
      }
      break;
    }

    case 'pyramid': {
      // Triangular tiered levels from base to top
      const count = Math.min(Math.max(validItems.length, 2), 4);
      const totalH = 200;
      const tierH = totalH / count;
      const topY = 40;
      const cx = 250;
      const baseWidth = 420;

      for (let i = 0; i < count; i++) {
        // level 0 is top (narrowest), level count-1 is base (widest)
        const item = validItems[i] || { title: `Niveau ${i + 1}` };
        const y1 = topY + i * tierH;
        const y2 = y1 + tierH - 4;
        const topRatio = i / count;
        const bottomRatio = (i + 1) / count;
        const wTop = baseWidth * topRatio * 0.85;
        const wBottom = baseWidth * bottomRatio * 0.85;
        const accent = colors.accents[i % colors.accents.length];
        const title = escapeXml(item.title.slice(0, 30));
        const badge = item.badge ?? i + 1;

        const x1 = cx - wTop / 2;
        const x2 = cx + wTop / 2;
        const x3 = cx + wBottom / 2;
        const x4 = cx - wBottom / 2;

        body += `
          <g>
            <polygon points="${x1},${y1} ${x2},${y1} ${x3},${y2} ${x4},${y2}" fill="${colors.card}" stroke="${accent}" stroke-width="2.5"/>
            <polygon points="${x1},${y1} ${x2},${y1} ${x3},${y2} ${x4},${y2}" fill="${accent}" opacity="0.12"/>
            <circle cx="${cx - 90}" cy="${(y1 + y2) / 2}" r="12" fill="${accent}"/>
            <text x="${cx - 90}" y="${(y1 + y2) / 2}" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-weight="bold" font-size="10" fill="#ffffff">${badge}</text>
            <text x="${cx}" y="${(y1 + y2) / 2}" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-weight="700" font-size="12" fill="${colors.ink}">${title}</text>
          </g>
        `;
      }
      break;
    }

    case 'quadrant-grid': {
      // 2x2 grid with 4 color-accented corners
      const count = Math.min(validItems.length, 4);
      const cardW = 200;
      const cardH = 95;
      const coords = [
        { x: isRtl ? 260 : 40, y: 35 },
        { x: isRtl ? 40 : 260, y: 35 },
        { x: isRtl ? 260 : 40, y: 145 },
        { x: isRtl ? 40 : 260, y: 145 },
      ];

      // Central divider lines
      body += `<line x1="250" y1="30" x2="250" y2="250" stroke="${colors.border}" stroke-width="2" stroke-dasharray="4,4"/>`;
      body += `<line x1="30" y1="140" x2="470" y2="140" stroke="${colors.border}" stroke-width="2" stroke-dasharray="4,4"/>`;

      for (let i = 0; i < count; i++) {
        const item = validItems[i];
        const coord = coords[i];
        const accent = colors.accents[i % colors.accents.length];
        const title = escapeXml(item.title.slice(0, 24));
        const subtitle = item.subtitle ? escapeXml(item.subtitle.slice(0, 36)) : '';
        const badge = item.badge ?? i + 1;

        body += `
          <g transform="translate(${coord.x}, ${coord.y})">
            <rect x="0" y="0" width="${cardW}" height="${cardH}" rx="12" fill="${colors.card}" stroke="${accent}" stroke-width="2.5"/>
            <rect x="0" y="0" width="${cardW}" height="28" rx="12" fill="${accent}"/>
            <text x="${isRtl ? cardW - 14 : 14}" y="14" text-anchor="${isRtl ? 'end' : 'start'}" dominant-baseline="central" font-family="${font}" font-weight="bold" font-size="12" fill="#ffffff">${badge}. ${title}</text>
            ${subtitle ? `<text x="${isRtl ? cardW - 14 : 14}" y="55" text-anchor="${isRtl ? 'end' : 'start'}" dominant-baseline="central" font-family="${font}" font-weight="500" font-size="10" fill="${colors.muted}">${subtitle}</text>` : ''}
          </g>
        `;
      }
      break;
    }

    case 'pros-cons': {
      // 2 comparison cards with green/red or theme A/B accents
      const leftItems = validItems.filter((_, i) => i % 2 === 0);
      const rightItems = validItems.filter((_, i) => i % 2 !== 0);
      const colW = 205;
      const colH = 200;
      const y = 40;

      const col1X = isRtl ? 255 : 40;
      const col2X = isRtl ? 40 : 255;
      const accent1 = colors.accents[1]; // Teal/Green
      const accent2 = colors.accents[3]; // Coral/Red

      body += `
        <g>
          <!-- Column 1 -->
          <rect x="${col1X}" y="${y}" width="${colW}" height="${colH}" rx="14" fill="${colors.card}" stroke="${accent1}" stroke-width="2.5"/>
          <rect x="${col1X}" y="${y}" width="${colW}" height="36" rx="14" fill="${accent1}"/>
          <text x="${col1X + colW / 2}" y="${y + 18}" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-weight="bold" font-size="13" fill="#ffffff">✔ ${isRtl ? 'العناصر الأولى' : 'Points A'}</text>
          
          <!-- Column 2 -->
          <rect x="${col2X}" y="${y}" width="${colW}" height="${colH}" rx="14" fill="${colors.card}" stroke="${accent2}" stroke-width="2.5"/>
          <rect x="${col2X}" y="${y}" width="${colW}" height="36" rx="14" fill="${accent2}"/>
          <text x="${col2X + colW / 2}" y="${y + 18}" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-weight="bold" font-size="13" fill="#ffffff">✖ ${isRtl ? 'العناصر المقابلة' : 'Points B'}</text>
        </g>
      `;

      // Render points
      leftItems.slice(0, 4).forEach((it, idx) => {
        const py = y + 55 + idx * 34;
        const title = escapeXml(it.title.slice(0, 22));
        body += `
          <g>
            <circle cx="${isRtl ? col1X + colW - 20 : col1X + 20}" cy="${py}" r="5" fill="${accent1}"/>
            <text x="${isRtl ? col1X + colW - 32 : col1X + 32}" y="${py}" text-anchor="${isRtl ? 'end' : 'start'}" dominant-baseline="central" font-family="${font}" font-size="11" font-weight="600" fill="${colors.ink}">${title}</text>
          </g>
        `;
      });

      rightItems.slice(0, 4).forEach((it, idx) => {
        const py = y + 55 + idx * 34;
        const title = escapeXml(it.title.slice(0, 22));
        body += `
          <g>
            <circle cx="${isRtl ? col2X + colW - 20 : col2X + 20}" cy="${py}" r="5" fill="${accent2}"/>
            <text x="${isRtl ? col2X + colW - 32 : col2X + 32}" y="${py}" text-anchor="${isRtl ? 'end' : 'start'}" dominant-baseline="central" font-family="${font}" font-size="11" font-weight="600" fill="${colors.ink}">${title}</text>
          </g>
        `;
      });
      break;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 280" width="100%" height="100%" dir="${isRtl ? 'rtl' : 'ltr'}">${body}</svg>`;
  return sanitizeSvg(svg);
}
