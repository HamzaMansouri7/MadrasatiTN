import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface ChartPoint {
  label: string;
  value: number;
  blank: boolean;
  x: number;
  y: number;
}

const W = 480;
const H = 260;
const PAD = { top: 16, right: 16, bottom: 36, left: 44 };

/** Smallest step from 1/2/5 × 10^n that gives about five grid lines up to `max`. */
function niceStep(max: number): number {
  const raw = Math.max(max, 1) / 5;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / pow;
  return (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10) * pow;
}

/**
 * Printable school chart (bar or line) drawn as plain SVG: squared grid, numbered axis, labels.
 * "Blank" entries are left empty so the pupil draws the bar or places the point.
 */
@Component({
  selector: 'app-sheet-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" class="w-full max-w-[480px] h-auto mx-auto block" role="img" [attr.aria-label]="title() || 'chart'">
      <!-- squared grid -->
      @for (g of grid().lines; track g.y) {
        <line [attr.x1]="pad.left" [attr.x2]="width - pad.right" [attr.y1]="g.y" [attr.y2]="g.y" stroke="#14251D" stroke-opacity="0.15" stroke-width="1" />
        <text [attr.x]="pad.left - 6" [attr.y]="g.y + 4" text-anchor="end" font-size="11" fill="#14251D">{{ g.value }}</text>
      }
      @for (x of grid().columns; track x) {
        <line [attr.x1]="x" [attr.x2]="x" [attr.y1]="pad.top" [attr.y2]="baseY" stroke="#14251D" stroke-opacity="0.08" stroke-width="1" />
      }

      <!-- axes -->
      <line [attr.x1]="pad.left" [attr.x2]="pad.left" [attr.y1]="pad.top" [attr.y2]="baseY" stroke="#14251D" stroke-width="1.5" />
      <line [attr.x1]="pad.left" [attr.x2]="width - pad.right" [attr.y1]="baseY" [attr.y2]="baseY" stroke="#14251D" stroke-width="1.5" />
      @if (unit()) {
        <text [attr.x]="pad.left" [attr.y]="pad.top - 4" font-size="11" fill="#14251D">{{ unit() }}</text>
      }

      @if (kind() === 'line') {
        @for (seg of lineSegments(); track $index) {
          <line [attr.x1]="seg.a.x" [attr.y1]="seg.a.y" [attr.x2]="seg.b.x" [attr.y2]="seg.b.y" stroke="#2D6A4F" stroke-width="2.5" />
        }
        @for (p of points(); track $index) {
          @if (!p.blank) {
            <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4" fill="#2D6A4F" />
          }
        }
      } @else {
        @for (p of points(); track $index) {
          @if (!p.blank) {
            <rect [attr.x]="p.x - barWidth() / 2" [attr.y]="p.y" [attr.width]="barWidth()" [attr.height]="baseY - p.y" fill="#2D6A4F" fill-opacity="0.85" />
          }
        }
      }

      <!-- category labels -->
      @for (p of points(); track $index) {
        <text [attr.x]="p.x" [attr.y]="baseY + 18" text-anchor="middle" font-size="11" fill="#14251D">{{ p.label }}</text>
      }
    </svg>
  `,
})
export class SheetChartComponent {
  readonly kind = input<'bar' | 'line'>('bar');
  readonly labels = input<string[]>([]);
  readonly values = input<number[]>([]);
  /** Indexes left for the pupil to draw. */
  readonly blanks = input<number[]>([]);
  readonly unit = input<string>('');
  readonly title = input<string>('');

  readonly width = W;
  readonly height = H;
  readonly pad = PAD;
  readonly baseY = H - PAD.bottom;

  private readonly scale = computed(() => {
    const max = Math.max(0, ...this.values().map((v) => (Number.isFinite(v) ? v : 0)));
    const step = niceStep(max);
    const top = Math.max(step, Math.ceil(max / step) * step);
    return { step, top };
  });

  readonly grid = computed(() => {
    const { step, top } = this.scale();
    const lines: { y: number; value: number }[] = [];
    for (let v = 0; v <= top + 1e-9; v += step) {
      lines.push({ y: this.yFor(v, top), value: Math.round(v * 100) / 100 });
    }
    const n = this.labels().length;
    const slot = (W - PAD.left - PAD.right) / Math.max(n, 1);
    const columns = Array.from({ length: n + 1 }, (_, i) => PAD.left + i * slot);
    return { lines, columns };
  });

  readonly points = computed<ChartPoint[]>(() => {
    const { top } = this.scale();
    const labels = this.labels();
    const values = this.values();
    const blanks = new Set(this.blanks());
    const slot = (W - PAD.left - PAD.right) / Math.max(labels.length, 1);
    return labels.map((label, i) => {
      const value = Number.isFinite(values[i]) ? values[i] : 0;
      return { label, value, blank: blanks.has(i), x: PAD.left + slot * (i + 0.5), y: this.yFor(value, top) };
    });
  });

  readonly barWidth = computed(() => ((W - PAD.left - PAD.right) / Math.max(this.labels().length, 1)) * 0.55);

  /** Line pieces between consecutive given points; a blank point breaks the line. */
  readonly lineSegments = computed(() => {
    const pts = this.points();
    const segs: { a: ChartPoint; b: ChartPoint }[] = [];
    for (let i = 1; i < pts.length; i++) {
      if (!pts[i - 1].blank && !pts[i].blank) segs.push({ a: pts[i - 1], b: pts[i] });
    }
    return segs;
  });

  private yFor(value: number, top: number): number {
    return this.baseY - (value / top) * (this.baseY - PAD.top);
  }
}
