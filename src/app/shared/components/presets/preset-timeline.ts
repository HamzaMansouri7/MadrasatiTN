import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { InfographicSpec, SpecImageTarget } from '@core';

@Component({
  selector: 'app-preset-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .ig-timeline {
      position: relative;
      padding-inline-start: 3.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .ig-line {
      position: absolute;
      inset-inline-start: 1.25rem;
      top: 1rem;
      bottom: 1rem;
      width: 3px;
      background: repeating-linear-gradient(
        to bottom,
        var(--ig-border),
        var(--ig-border) 6px,
        transparent 6px,
        transparent 12px
      );
    }
    .ig-card {
      background: var(--ig-card);
      border: var(--ig-bw, 2px) solid var(--ig-border);
      border-radius: var(--ig-radius, 18px);
      padding: 1.15rem;
      break-inside: avoid;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
      position: relative;
    }
    .ig-badge {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 999px;
      color: #fff;
      font-weight: 800;
      font-size: 1rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
      border: 3px solid #ffffff;
    }
    .ig-diagram {
      background: #ffffff;
      border: 1px solid var(--ig-border);
      border-radius: calc(var(--ig-radius, 18px) - 6px);
      padding: 0.75rem;
      margin-top: 1.25rem;
    }
    .ig-diagram :is(svg) { width: 100%; height: auto; max-height: 240px; }
  `,
  template: `
    @let s = spec();
    <section class="ig-timeline">
      <span class="ig-line" aria-hidden="true"></span>
      @for (it of s.items; track $index) {
        <article class="relative ig-card">
          <span class="ig-badge absolute top-3.5 -start-[3.75rem]" [style.background]="accent()($index)">
            {{ $index + 1 }}
          </span>
          @if (it.imageUrl) {
            <div class="mb-3 rounded-xl overflow-hidden border border-[var(--ig-border)]">
              <img [src]="it.imageUrl" [alt]="it.title" class="w-full h-32 sm:h-36 object-cover" />
            </div>
          }
          <div class="flex items-center gap-2.5 mb-1.5">
            <span class="material-icons text-xl" [style.color]="accent()($index)" aria-hidden="true">{{ it.icon }}</span>
            <h3 class="font-display font-bold text-base sm:text-lg text-[#14251D]">{{ it.title }}</h3>
          </div>
          <p class="text-sm leading-relaxed" style="color: var(--ig-muted)">{{ it.text }}</p>
        </article>
      }
    </section>
    @if (diagram(); as svg) {
      <div class="ig-diagram" [innerHTML]="svg"></div>
    }
  `,
})
export class PresetTimelineComponent {
  readonly spec = input.required<InfographicSpec>();
  readonly diagram = input<SafeHtml | null>(null);
  readonly accent = input.required<(i: number) => string>();
  readonly illustrating = input<string | null>(null);
  readonly illustrate = output<SpecImageTarget>();
}
