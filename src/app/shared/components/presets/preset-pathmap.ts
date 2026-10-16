import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InfographicDoc, InfographicSpec, SpecImageTarget } from '@core';
import { IllustrateButtonComponent } from './illustrate-button';

/**
 * Path map preset (/illustratedmap, /treasuremap): numbered stations placed left and right
 * of a dashed winding trail, from a start pin to a finish marker. The theme gives the map its look.
 */
@Component({
  selector: 'app-preset-pathmap',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IllustrateButtonComponent],
  styles: `
    :host { display: block; }
    .pm-trail {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 0.5rem 0;
    }
    .pm-trail::before {
      content: '';
      position: absolute;
      top: 1.5rem;
      bottom: 1.5rem;
      inset-inline-start: 50%;
      border-inline-start: 3px dashed var(--ig-border);
      transform: translateX(-1.5px);
    }
    .pm-end {
      position: relative;
      align-self: center;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.9rem;
      border-radius: 999px;
      background: var(--ig-card);
      border: var(--ig-bw, 2px) solid var(--ig-border);
      font-weight: 800;
      font-size: 0.85rem;
      color: var(--ig-heading);
      z-index: 1;
    }
    .pm-row {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 3rem 1fr;
      align-items: center;
      break-inside: avoid;
    }
    .pm-pin {
      grid-column: 2;
      justify-self: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 999px;
      color: #fff;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid var(--ig-card);
      box-shadow: 0 0 0 2px var(--ig-border);
      z-index: 1;
    }
    .pm-card {
      background: var(--ig-card);
      border: var(--ig-bw, 2px) solid var(--ig-border);
      border-radius: var(--ig-radius, 14px);
      padding: 0.85rem 1rem;
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }
    .pm-row.start .pm-card { grid-column: 1; grid-row: 1; }
    .pm-row.end .pm-card { grid-column: 3; grid-row: 1; }
    .pm-title { font-family: var(--ig-font-display); font-weight: 800; font-size: 1rem; color: var(--ig-heading); }
    .pm-text { font-size: 0.85rem; line-height: 1.5; color: var(--ig-muted); margin-top: 0.15rem; }
    .pm-pic { width: 4.5rem; height: 4.5rem; flex-shrink: 0; border-radius: 10px; object-fit: contain; background: #fff; border: 1px solid var(--ig-border); }
    @media (max-width: 640px) {
      .pm-trail::before { inset-inline-start: 1.25rem; }
      .pm-row { grid-template-columns: 2.5rem 1fr; gap: 0.5rem; }
      .pm-pin { grid-column: 1; }
      .pm-row.start .pm-card, .pm-row.end .pm-card { grid-column: 2; }
      .pm-end { align-self: flex-start; }
    }
  `,
  template: `
    @let s = spec();
    @let fr = doc().language === 'fr';
    <div class="pm-trail">
      <span class="pm-end">
        <span class="material-icons text-base" [style.color]="accent()(0)" aria-hidden="true">location_on</span>
        {{ fr ? 'Départ' : 'الانطلاق' }}
      </span>

      @for (it of s.items; track $index) {
        <div class="pm-row" [class.start]="$index % 2 === 0" [class.end]="$index % 2 === 1">
          <span class="pm-pin" [style.background]="accent()($index)">{{ $index + 1 }}</span>
          <article class="pm-card">
            @if (it.imageUrl) {
              <img class="pm-pic" [src]="it.imageUrl" [alt]="it.title" />
            }
            <div class="min-w-0 flex-1">
              <h3 class="pm-title">{{ it.title }}</h3>
              <p class="pm-text">{{ it.text }}</p>
              @if (it.imagePrompt) {
                <div class="mt-1.5">
                  <app-illustrate-button
                    [prompt]="it.imagePrompt"
                    [imageUrl]="it.imageUrl"
                    [busy]="illustrating() === 'item-' + $index"
                    [disabled]="!!illustrating()"
                    (pressed)="illustrate.emit({ kind: 'item', index: $index })" />
                </div>
              }
            </div>
          </article>
        </div>
      }

      <span class="pm-end">
        <span class="material-icons text-base" [style.color]="accent()(1)" aria-hidden="true">flag</span>
        {{ fr ? 'Arrivée' : 'الوصول' }}
      </span>
    </div>
  `,
})
export class PresetPathmapComponent {
  readonly spec = input.required<InfographicSpec>();
  readonly doc = input.required<InfographicDoc>();
  readonly accent = input.required<(i: number) => string>();
  readonly illustrating = input<string | null>(null);
  readonly illustrate = output<SpecImageTarget>();
}
