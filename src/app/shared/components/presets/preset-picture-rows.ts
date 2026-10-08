import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InfographicSpec, SpecImageTarget } from '@core';
import { IllustrateButtonComponent } from './illustrate-button';

/**
 * Numbered rows "picture + model sentence" (observe the image, then write a sentence).
 * The key word of each sentence is painted by splitting the plain text, never by injecting HTML.
 */
@Component({
  selector: 'app-preset-picture-rows',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IllustrateButtonComponent],
  styles: `
    :host { display: block; }
    .ig-rows { display: flex; flex-direction: column; gap: 1rem; }
    .ig-row {
      position: relative; display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); gap: 1rem; align-items: center;
      background: var(--ig-card); border: var(--ig-bw) solid var(--ig-border); border-radius: var(--ig-radius);
      padding: 1.6rem 0.9rem 0.9rem; break-inside: avoid;
    }
    .ig-row-label {
      position: absolute; top: -0.7rem; inset-inline-start: 0.9rem;
      padding: 0.15rem 0.85rem; border-radius: 0.5rem; color: #fff; font-weight: 800; font-size: 0.95rem;
      font-family: var(--ig-font-display);
    }
    .ig-row-pic {
      position: relative; display: flex; align-items: center; justify-content: center; min-height: 9rem; overflow: hidden;
      border-radius: calc(var(--ig-radius) - 4px); background: var(--ig-hero); border: 1px solid var(--ig-border);
    }
    .ig-row-pic img { width: 100%; height: 100%; max-height: 11rem; object-fit: cover; display: block; }
    .ig-row-action-over { position: absolute; bottom: 0.4rem; inset-inline-end: 0.4rem; }
    .ig-row-text {
      font-family: var(--ig-font-display); font-weight: 700; font-size: 1.45rem; line-height: 1.45; color: var(--ig-ink);
    }
    .ig-row-text .ig-key { color: var(--ig-a); }
    @media print { .ig-row-pic { min-height: 0; } }
  `,
  template: `
    @let s = spec();
    <section class="ig-rows">
      @for (it of s.items; track $index) {
        <article class="ig-row">
          <span class="ig-row-label" [style.background]="accent()($index)">{{ $index + 1 }}. {{ it.title }}</span>
          <div class="ig-row-pic">
            @if (it.imageUrl) {
              <img [src]="it.imageUrl" [alt]="it.title" />
            }
            <span class="ig-row-action" [class.ig-row-action-over]="it.imageUrl">
              <app-illustrate-button
                [prompt]="it.imagePrompt"
                [imageUrl]="it.imageUrl"
                [busy]="illustrating() === 'item-' + $index"
                [disabled]="!!illustrating()"
                (pressed)="illustrate.emit({ kind: 'item', index: $index })" />
            </span>
          </div>
          <p class="ig-row-text">
            @let parts = split(it.text, it.keyword);
            {{ parts[0] }}@if (parts[1]) {<span class="ig-key">{{ parts[1] }}</span>}{{ parts[2] }}
          </p>
        </article>
      }
    </section>
  `,
})
export class PresetPictureRowsComponent {
  readonly spec = input.required<InfographicSpec>();
  readonly accent = input.required<(i: number) => string>();
  readonly illustrating = input<string | null>(null);
  readonly illustrate = output<SpecImageTarget>();

  /** [before, keyword, after] around the first occurrence of `keyword`; the whole text when absent. */
  split(text: string, keyword?: string): [string, string, string] {
    const at = keyword ? text.indexOf(keyword) : -1;
    if (!keyword || at < 0) return [text, '', ''];
    return [text.slice(0, at), keyword, text.slice(at + keyword.length)];
  }
}
