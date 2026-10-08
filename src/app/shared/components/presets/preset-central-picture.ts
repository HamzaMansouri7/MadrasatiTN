import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { InfographicDoc, InfographicSpec, SpecImageTarget } from '@core';
import { SpecCardComponent } from '../spec-card';
import { IllustrateButtonComponent } from './illustrate-button';

/**
 * One strong central picture (the hero) framed by cards on both sides, like a family or
 * "roles" poster. Cards split right/left of the picture; a quote bubble closes the sheet.
 */
@Component({
  selector: 'app-preset-central-picture',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SpecCardComponent, IllustrateButtonComponent],
  styles: `
    :host { display: block; }
    .cp-grid { display: grid; grid-template-columns: 1fr 1.35fr 1fr; gap: 1rem; align-items: center; }
    .cp-side { display: flex; flex-direction: column; gap: 1rem; }
    .cp-frame {
      background: var(--ig-hero);
      border: calc(var(--ig-bw, 2px) + 1px) solid var(--ig-border);
      border-radius: calc(var(--ig-radius, 16px) + 8px);
      padding: 0.75rem;
      text-align: center;
      break-inside: avoid;
    }
    .cp-picture { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; border-radius: var(--ig-radius, 16px); }
    .cp-placeholder {
      width: 100%; min-height: 9rem; padding: 1.25rem 0.75rem; border-radius: var(--ig-radius, 16px);
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem;
      background: var(--ig-card);
    }
    .cp-label { font-size: 3.25rem; line-height: 1.1; font-weight: 800; }
    .cp-caption {
      display: block; margin-top: 0.6rem; padding: 0.4rem 0.9rem;
      background: var(--ig-card); border: var(--ig-bw, 2px) solid var(--ig-border); font-weight: 700; font-size: 0.9rem;
      border-radius: var(--ig-radius, 16px); line-height: 1.6;
    }
    .cp-quote {
      margin-top: 1.25rem; padding: 1rem 1.5rem; border-radius: 2rem; text-align: center;
      background: var(--ig-card); border: var(--ig-bw, 2px) dashed var(--ig-border);
      font-weight: 700; font-size: 1.05rem; break-inside: avoid;
    }
    @media (max-width: 640px) {
      .cp-grid { grid-template-columns: 1fr; }
    }
  `,
  template: `
    @let s = spec();
    <section class="cp-grid">
      <div class="cp-side">
        @for (it of startItems(); track $index) {
          <app-spec-card [title]="it.title" [text]="it.text" [icon]="it.icon" [imageUrl]="it.imageUrl" [badgeBg]="accent()($index)" size="sm">
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
      </div>

      <figure class="cp-frame">
        @if (s.hero?.imageUrl) {
          <img class="cp-picture" [src]="s.hero?.imageUrl" [alt]="s.hero?.label || s.title" />
        } @else {
          <div class="cp-placeholder">
            <p class="cp-label font-display" [style.color]="accent()(0)">{{ s.hero?.label || s.title }}</p>
            @if (s.hero; as hero) {
              <app-illustrate-button
                [prompt]="hero.imagePrompt"
                [imageUrl]="hero.imageUrl"
                [busy]="illustrating() === 'hero'"
                [disabled]="!!illustrating()"
                (pressed)="illustrate.emit({ kind: 'hero' })" />
            }
          </div>
        }
        @if (s.hero?.caption) {
          <figcaption class="cp-caption">{{ s.hero?.caption }}</figcaption>
        }
      </figure>

      <div class="cp-side">
        @for (it of endItems(); track $index) {
          <app-spec-card [title]="it.title" [text]="it.text" [icon]="it.icon" [imageUrl]="it.imageUrl" [badgeBg]="accent()(split() + $index)" size="sm">
            <div cardAction>
              <app-illustrate-button
                [prompt]="it.imagePrompt"
                [imageUrl]="it.imageUrl"
                [busy]="illustrating() === 'item-' + (split() + $index)"
                [disabled]="!!illustrating()"
                (pressed)="illustrate.emit({ kind: 'item', index: split() + $index })" />
            </div>
          </app-spec-card>
        }
      </div>
    </section>

    @if (s.quote; as q) {
      <blockquote class="cp-quote font-display" [style.color]="accent()(2)">
        {{ q.text }}
        @if (q.author) {
          <span class="block text-xs font-semibold mt-1" style="color: var(--ig-muted)">{{ q.author }}</span>
        }
      </blockquote>
    }
  `,
})
export class PresetCentralPictureComponent {
  readonly spec = input.required<InfographicSpec>();
  readonly doc = input.required<InfographicDoc>();
  readonly accent = input.required<(i: number) => string>();
  readonly illustrating = input<string | null>(null);
  readonly illustrate = output<SpecImageTarget>();

  /** First half sits at the reading start (right in RTL), the rest after the picture. */
  readonly split = computed(() => Math.ceil(this.spec().items.length / 2));
  readonly startItems = computed(() => this.spec().items.slice(0, this.split()));
  readonly endItems = computed(() => this.spec().items.slice(this.split()));
}
