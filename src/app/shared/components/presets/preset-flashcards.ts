import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InfographicDoc, InfographicSpec, SpecImageTarget } from '@core';
import { IllustrateButtonComponent } from './illustrate-button';

/**
 * Flashcards Preset:
 * Modular printable grid of revision cards with dashed cut lines,
 * bold term headline, clear definition, example sentence, and optional illustration.
 */
@Component({
  selector: 'app-preset-flashcards',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IllustrateButtonComponent],
  styles: `
    :host { display: block; }
    .fc-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.25rem;
    }
    .fc-card {
      position: relative;
      background: var(--ig-card);
      border: 2px dashed var(--ig-border);
      border-radius: var(--ig-radius, 14px);
      padding: 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      break-inside: avoid;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
      transition: transform 0.15s ease;
    }
    .fc-cut-badge {
      position: absolute;
      top: -0.65rem;
      inset-inline-start: 1rem;
      background: var(--ig-card);
      border: 1px solid var(--ig-border);
      padding: 0.1rem 0.5rem;
      border-radius: 999px;
      font-size: 0.7rem;
      color: var(--ig-muted);
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
    .fc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }
    .fc-word {
      font-family: var(--ig-font-display);
      font-size: 1.2rem;
      font-weight: 900;
      color: var(--ig-ink);
      line-height: 1.25;
    }
    .fc-badge {
      width: 1.85rem;
      height: 1.85rem;
      border-radius: 8px;
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .fc-def {
      font-size: 0.85rem;
      line-height: 1.5;
      color: var(--ig-muted);
      flex: 1;
    }
    .fc-example {
      padding: 0.45rem 0.65rem;
      border-radius: 8px;
      background: var(--ig-hero);
      border: 1px solid var(--ig-border);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--ig-ink);
    }
    .fc-pic {
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--ig-border);
      max-height: 100px;
    }
    .fc-pic img {
      width: 100%;
      height: 90px;
      object-fit: contain;
      background: #ffffff;
    }
    @media print {
      .fc-card {
        box-shadow: none;
      }
    }
  `,
  template: `
    @let s = spec();
    <div class="fc-grid">
      @for (it of s.items; track $index) {
        <article class="fc-card">
          <!-- Cut Indicator -->
          <span class="fc-cut-badge">
            <span class="material-icons text-xs" aria-hidden="true">content_cut</span>
            <span>#{{ $index + 1 }}</span>
          </span>

          <div class="fc-header">
            <h3 class="fc-word">{{ it.title }}</h3>
            <span class="fc-badge" [style.background]="accent()($index)">
              <span class="material-icons text-sm" aria-hidden="true">{{ it.icon || 'star' }}</span>
            </span>
          </div>

          @if (it.imageUrl) {
            <div class="fc-pic">
              <img [src]="it.imageUrl" [alt]="it.title" />
            </div>
          }

          <p class="fc-def">{{ it.text }}</p>

          @if (it.keyword) {
            <div class="fc-example">
              <span class="font-bold opacity-75 text-xs block mb-0.5">{{ doc().language === 'fr' ? 'Exemple :' : 'مثال :' }}</span>
              <span>{{ it.keyword }}</span>
            </div>
          }

          @if (it.imagePrompt) {
            <div class="mt-auto pt-1">
              <app-illustrate-button
                [prompt]="it.imagePrompt"
                [imageUrl]="it.imageUrl"
                [busy]="illustrating() === 'item-' + $index"
                [disabled]="!!illustrating()"
                (pressed)="illustrate.emit({ kind: 'item', index: $index })" />
            </div>
          }
        </article>
      }
    </div>
  `,
})
export class PresetFlashcardsComponent {
  readonly spec = input.required<InfographicSpec>();
  readonly doc = input.required<InfographicDoc>();
  readonly accent = input.required<(i: number) => string>();
  readonly illustrating = input<string | null>(null);
  readonly illustrate = output<SpecImageTarget>();
}
