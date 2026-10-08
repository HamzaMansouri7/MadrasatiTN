import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InfographicDoc, InfographicSpec, SpecImageTarget } from '@core';
import { IllustrateButtonComponent } from './illustrate-button';

/**
 * Two things side by side (near / far, living / non-living, before / after), each with its own
 * accent and optional picture, a round "vs" seal between them, and shared points underneath.
 */
@Component({
  selector: 'app-preset-comparison',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IllustrateButtonComponent],
  styles: `
    :host { display: block; }
    .cmp-grid { display: grid; grid-template-columns: 1fr auto 1fr; gap: 0.75rem; align-items: stretch; }
    .cmp-col {
      background: var(--ig-card);
      border: calc(var(--ig-bw, 2px) + 1px) solid var(--cmp-accent);
      border-radius: var(--ig-radius, 16px);
      padding: 1rem;
      break-inside: avoid;
    }
    .cmp-title {
      display: inline-block; padding: 0.3rem 1rem; border-radius: 999px; color: #fff;
      background: var(--cmp-accent); font-weight: 800; font-size: 1.05rem;
    }
    .cmp-img { width: 100%; height: 9rem; object-fit: cover; border-radius: calc(var(--ig-radius, 16px) - 6px); margin-top: 0.75rem; }
    .cmp-vs {
      align-self: center; width: 3rem; height: 3rem; border-radius: 999px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      background: var(--ig-hero); border: var(--ig-bw, 2px) solid var(--ig-border); color: var(--ig-ink);
    }
    .cmp-points li { display: flex; gap: 0.4rem; align-items: flex-start; }
    .cmp-common {
      margin-top: 1rem; padding: 0.9rem 1rem; border-radius: var(--ig-radius, 16px);
      background: var(--ig-hero); border: var(--ig-bw, 2px) solid var(--ig-border); break-inside: avoid;
    }
    @media (max-width: 640px) {
      .cmp-grid { grid-template-columns: 1fr; }
      .cmp-vs { justify-self: center; }
    }
  `,
  template: `
    @let s = spec();
    @let fr = doc().language === 'fr';
    <section class="cmp-grid">
      @for (col of columnsPair(); track $index; let i = $index) {
        @if (i === 1) {
          <span class="cmp-vs" aria-hidden="true"><span class="material-icons">compare_arrows</span></span>
        }
        <article class="cmp-col" [style.--cmp-accent]="accent()(i === 0 ? 0 : 2)">
          <h3 class="cmp-title font-display">{{ col.title }}</h3>
          @if (col.subtitle) {
            <p class="text-xs mt-1" style="color: var(--ig-muted)">{{ col.subtitle }}</p>
          }
          @if (col.imageUrl) {
            <img class="cmp-img" [src]="col.imageUrl" [alt]="col.title" />
          }
          <ul class="cmp-points space-y-1.5 mt-3 text-sm">
            @for (p of col.points; track $index) {
              <li>
                <span class="material-icons text-base" [style.color]="accent()(i === 0 ? 0 : 2)" aria-hidden="true">check_circle</span>
                <span>{{ p }}</span>
              </li>
            }
          </ul>
          <div class="mt-2">
            <app-illustrate-button
              [prompt]="col.imagePrompt"
              [imageUrl]="col.imageUrl"
              [busy]="illustrating() === 'column-' + i"
              [disabled]="!!illustrating()"
              (pressed)="illustrate.emit({ kind: 'column', index: i })" />
          </div>
        </article>
      }
    </section>

    @if (s.items.length) {
      <section class="cmp-common">
        <p class="font-display font-semibold text-sm mb-2">{{ fr ? 'Points communs' : 'نقاط مشتركة' }}</p>
        <ul class="grid grid-cols-2 gap-2 text-sm">
          @for (it of s.items; track $index) {
            <li class="flex items-start gap-1.5">
              <span class="material-icons text-base" [style.color]="accent()(1)" aria-hidden="true">{{ it.icon }}</span>
              <span><strong>{{ it.title }}</strong> {{ it.text }}</span>
            </li>
          }
        </ul>
      </section>
    }
  `,
})
export class PresetComparisonComponent {
  readonly spec = input.required<InfographicSpec>();
  readonly doc = input.required<InfographicDoc>();
  readonly accent = input.required<(i: number) => string>();
  readonly illustrating = input<string | null>(null);
  readonly illustrate = output<SpecImageTarget>();

  /** The renderer draws exactly two sides; the validator guarantees at least two. */
  columnsPair() {
    return (this.spec().columns ?? []).slice(0, 2);
  }
}
