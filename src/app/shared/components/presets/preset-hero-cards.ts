import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { InfographicSpec, SpecImageTarget } from '@core';
import { SpecCardComponent } from '../spec-card';
import { IllustrateButtonComponent } from './illustrate-button';

@Component({
  selector: 'app-preset-hero-cards',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SpecCardComponent, IllustrateButtonComponent],
  styles: `
    :host { display: block; }
    .ig-hero {
      background: linear-gradient(135deg, var(--ig-hero) 0%, rgba(255, 255, 255, 0.9) 100%);
      border: var(--ig-bw, 2px) solid var(--ig-border);
      border-radius: var(--ig-radius, 20px);
      padding: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      flex-wrap: wrap;
      margin-bottom: 1.25rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
      position: relative;
      overflow: hidden;
    }
    .ig-hero-label {
      font-size: clamp(4rem, 8vw, 6.5rem);
      line-height: 1;
      font-weight: 900;
      letter-spacing: -0.02em;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    .ig-diagram {
      background: #ffffff;
      border: 1px solid var(--ig-border);
      border-radius: calc(var(--ig-radius, 20px) - 6px);
      padding: 0.75rem;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
    }
    .ig-diagram :is(svg) { width: 100%; height: auto; max-height: 240px; }
  `,
  template: `
    @let s = spec();
    @if (s.hero || diagram()) {
      <section class="ig-hero">
        @if (s.hero; as hero) {
          <div class="text-center shrink-0">
            @if (hero.imageUrl) {
              <div class="mb-2 max-w-sm rounded-xl overflow-hidden border border-[var(--ig-border)] shadow-sm">
                <img [src]="hero.imageUrl" [alt]="hero.label" class="w-full h-36 object-cover" />
              </div>
            }
            <p class="ig-hero-label font-display" [style.color]="accent()(0)">{{ hero.label }}</p>
            @if (hero.caption) {
              <div class="inline-block mt-2 px-3 py-1 rounded-full bg-white/80 border border-[var(--ig-border)] shadow-2xs">
                <p class="text-xs sm:text-sm font-bold text-[#14251D]">{{ hero.caption }}</p>
              </div>
            }
          </div>
        }
        @if (diagram(); as svg) {
          <div class="ig-diagram flex-1 min-w-[280px]" [innerHTML]="svg"></div>
        }
      </section>
    }

    <section class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      @for (it of s.items; track $index) {
        <app-spec-card
          [title]="it.title"
          [text]="it.text"
          [icon]="it.icon"
          [imageUrl]="it.imageUrl"
          [badgeBg]="accent()($index)">
          <div cardAction>
            <app-illustrate-button
              [prompt]="it.imagePrompt"
              [imageUrl]="it.imageUrl"
              [busy]="illustrating() === 'item-' + $index"
              [disabled]="!!illustrating()"
              (pressed)="illustrate.emit({ kind: 'item', index: $index })" />
          </div>
        </app-spec-card>
      }
    </section>
  `,
})
export class PresetHeroCardsComponent {
  readonly spec = input.required<InfographicSpec>();
  readonly diagram = input<SafeHtml | null>(null);
  readonly accent = input.required<(i: number) => string>();
  readonly illustrating = input<string | null>(null);
  readonly illustrate = output<SpecImageTarget>();
}
