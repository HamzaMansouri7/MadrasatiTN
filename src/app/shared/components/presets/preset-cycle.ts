import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { InfographicDoc, InfographicSpec, SpecImageTarget } from '@core';

@Component({
  selector: 'app-preset-cycle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .ig-ring {
      position: relative;
      width: 100%;
      max-width: 760px;
      margin: 0 auto;
      aspect-ratio: 4 / 3;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ig-ring-center {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 30%;
      text-align: center;
      background: radial-gradient(circle, var(--ig-card) 60%, transparent 100%);
      padding: 1rem;
      border-radius: 999px;
      z-index: 2;
    }
    .ig-ring-node {
      position: absolute;
      width: 36%;
      max-width: 240px;
      transform: translate(-50%, -50%);
      background: var(--ig-card);
      border: var(--ig-bw, 2px) solid var(--ig-border);
      border-radius: var(--ig-radius, 16px);
      padding: 0.85rem;
      break-inside: avoid;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
      z-index: 3;
      transition: transform 0.15s ease;
    }
    .ig-badge {
      width: 1.85rem;
      height: 1.85rem;
      border-radius: 10px;
      color: #fff;
      font-weight: 800;
      font-size: 0.85rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .ig-diagram {
      background: #ffffff;
      border: 1px solid var(--ig-border);
      border-radius: calc(var(--ig-radius, 16px) - 4px);
      padding: 0.75rem;
      margin-top: 1.5rem;
    }
    .ig-diagram :is(svg) { width: 100%; height: auto; max-height: 240px; }
  `,
  template: `
    @let s = spec();
    <section class="ig-ring">
      <svg class="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <ellipse cx="50" cy="50" rx="38" ry="36" fill="none" stroke-width="0.8" stroke-dasharray="3 2" stroke="currentColor" style="color: var(--ig-border)" />
      </svg>
      <div class="ig-ring-center">
        @if (s.hero; as hero) {
          @if (hero.imageUrl) {
            <img [src]="hero.imageUrl" [alt]="hero.label" class="w-16 h-16 rounded-full object-cover mx-auto mb-1 border-2 border-[var(--ig-border)] shadow-sm" />
          }
          <p class="font-display font-black text-3xl sm:text-4xl tracking-tight" [style.color]="accent()(0)">{{ hero.label }}</p>
          @if (hero.caption) {
            <p class="text-xs font-semibold mt-0.5" style="color: var(--ig-muted)">{{ hero.caption }}</p>
          }
        }
      </div>
      @for (it of s.items; track $index) {
        <article class="ig-ring-node space-y-1.5" [style.left.%]="ringX($index, s.items.length)" [style.top.%]="ringY($index, s.items.length)">
          <div class="flex items-center gap-2">
            <span class="ig-badge" [style.background]="accent()($index)">{{ $index + 1 }}</span>
            <h3 class="font-display font-bold text-xs sm:text-sm text-[#14251D] leading-tight">{{ it.title }}</h3>
          </div>
          <p class="text-[11px] sm:text-xs leading-snug line-clamp-3" style="color: var(--ig-muted)">{{ it.text }}</p>
        </article>
      }
    </section>
    @if (diagram(); as svg) {
      <div class="ig-diagram" [innerHTML]="svg"></div>
    }
  `,
})
export class PresetCycleComponent {
  readonly spec = input.required<InfographicSpec>();
  readonly doc = input.required<InfographicDoc>();
  readonly diagram = input<SafeHtml | null>(null);
  readonly accent = input.required<(i: number) => string>();
  readonly illustrating = input<string | null>(null);
  readonly illustrate = output<SpecImageTarget>();

  /** Positions on the ring: first item at top, clockwise with subtle margin spacing. */
  ringX(i: number, n: number): number {
    const mirror = this.doc().language === 'fr' ? 1 : -1;
    return 50 + mirror * 38 * Math.cos(this.angle(i, n));
  }

  ringY(i: number, n: number): number {
    return 50 + 36 * Math.sin(this.angle(i, n));
  }

  private angle(i: number, n: number): number {
    return -Math.PI / 2 + (2 * Math.PI * i) / Math.max(n, 1);
  }
}
