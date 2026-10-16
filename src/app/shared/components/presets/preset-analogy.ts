import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InfographicDoc, InfographicSpec, SpecImageTarget } from '@core';
import { IllustrateButtonComponent } from './illustrate-button';

/**
 * Analogy preset (المقاربة التمثيلية / Pont d'Analogie):
 * Connects a familiar everyday object/situation with a complex or abstract
 * scientific/mathematical concept via a central visual bridge.
 */
@Component({
  selector: 'app-preset-analogy',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IllustrateButtonComponent],
  styles: `
    :host { display: block; }
    .ana-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .ana-grid {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 1rem;
      align-items: stretch;
    }
    @media (max-width: 768px) {
      .ana-grid { grid-template-columns: 1fr; }
    }
    .ana-card {
      background: var(--ig-card);
      border: var(--ig-bw, 2px) solid var(--ana-border);
      border-radius: var(--ig-radius, 18px);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.02);
    }
    .ana-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.85rem;
      border-radius: 999px;
      font-weight: 800;
      font-size: 0.8rem;
      color: #ffffff;
      align-self: flex-start;
      margin-bottom: 0.75rem;
    }
    .ana-bridge-divider {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      align-self: center;
      padding: 0.5rem;
    }
    .ana-bridge-icon {
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 999px;
      background: var(--ig-hero);
      border: var(--ig-bw, 2px) solid var(--ig-border);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ig-a);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    }
    .ana-img {
      width: 100%;
      height: 160px;
      object-fit: cover;
      border-radius: calc(var(--ig-radius, 16px) - 6px);
      border: 1px solid var(--ig-border);
      margin-top: 0.75rem;
    }
    .ana-bridge-banner {
      background: linear-gradient(135deg, var(--ig-hero) 0%, rgba(255, 255, 255, 0.95) 100%);
      border: var(--ig-bw, 2px) dashed var(--ig-border);
      border-radius: var(--ig-radius, 16px);
      padding: 1.15rem 1.35rem;
      text-align: center;
    }
  `,
  template: `
    @let s = spec();
    @let a = s.analogy;
    @let fr = doc().language === 'fr';

    <div class="ana-container">
      @if (a) {
        <section class="ana-grid">
          <!-- Familiar Side (Left) -->
          <article class="ana-card" [style.--ana-border]="accent()(0)">
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="ana-badge font-display" [style.background]="accent()(0)">
                <span class="material-icons text-xs" aria-hidden="true">visibility</span>
                <span>{{ fr ? 'Ce que tu connais' : 'المفهوم المألوف لديك' }}</span>
              </span>
              <app-illustrate-button
                [prompt]="a.familiar.imagePrompt"
                [imageUrl]="a.familiar.imageUrl"
                [busy]="illustrating() === 'analogy-familiar'"
                [disabled]="!!illustrating()"
                (pressed)="illustrate.emit({ kind: 'analogy', side: 'familiar' })" />
            </div>

            <h3 class="text-xl font-bold font-display text-[var(--ig-heading)] mb-1">{{ a.familiar.concept }}</h3>
            <p class="text-xs sm:text-sm mb-3" style="color: var(--ig-muted)">{{ a.familiar.description }}</p>

            @if (a.familiar.imageUrl) {
              <img class="ana-img mb-3" [src]="a.familiar.imageUrl" [alt]="a.familiar.concept" />
            }

            <ul class="space-y-1.5 mt-auto pt-2 text-xs sm:text-sm">
              @for (pt of a.familiar.keyPoints; track $index) {
                <li class="flex items-start gap-1.5">
                  <span class="material-icons text-sm mt-0.5 shrink-0" [style.color]="accent()(0)" aria-hidden="true">check</span>
                  <span>{{ pt }}</span>
                </li>
              }
            </ul>
          </article>

          <!-- Center Bridge Symbol -->
          <div class="ana-bridge-divider">
            <div class="ana-bridge-icon" [title]="fr ? 'Pont analogique' : 'جسر الربط والتمثيل'">
              <span class="material-icons text-2xl" aria-hidden="true">sync_alt</span>
            </div>
            <span class="text-xs font-bold uppercase tracking-wider mt-2" style="color: var(--ig-muted)">
              {{ fr ? 'C’est comme…' : 'تماماً مثل…' }}
            </span>
          </div>

          <!-- Abstract Concept Side (Right) -->
          <article class="ana-card" [style.--ana-border]="accent()(2)">
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="ana-badge font-display" [style.background]="accent()(2)">
                <span class="material-icons text-xs" aria-hidden="true">psychology</span>
                <span>{{ fr ? 'La notion à comprendre' : 'المفهوم العلمي الجديد' }}</span>
              </span>
              <app-illustrate-button
                [prompt]="a.abstract.imagePrompt"
                [imageUrl]="a.abstract.imageUrl"
                [busy]="illustrating() === 'analogy-abstract'"
                [disabled]="!!illustrating()"
                (pressed)="illustrate.emit({ kind: 'analogy', side: 'abstract' })" />
            </div>

            <h3 class="text-xl font-bold font-display text-[var(--ig-heading)] mb-1">{{ a.abstract.concept }}</h3>
            <p class="text-xs sm:text-sm mb-3" style="color: var(--ig-muted)">{{ a.abstract.description }}</p>

            @if (a.abstract.imageUrl) {
              <img class="ana-img mb-3" [src]="a.abstract.imageUrl" [alt]="a.abstract.concept" />
            }

            <ul class="space-y-1.5 mt-auto pt-2 text-xs sm:text-sm">
              @for (pt of a.abstract.keyPoints; track $index) {
                <li class="flex items-start gap-1.5">
                  <span class="material-icons text-sm mt-0.5 shrink-0" [style.color]="accent()(2)" aria-hidden="true">check</span>
                  <span>{{ pt }}</span>
                </li>
              }
            </ul>
          </article>
        </section>

        <!-- Bridge Explanation Banner -->
        <section class="ana-bridge-banner">
          <p class="text-xs font-bold uppercase tracking-wider text-[var(--ig-heading)] mb-1">
            {{ fr ? 'Le lien fondamental' : 'وجه الشبه والتطبيق' }}
          </p>
          <p class="text-sm sm:text-base font-medium" style="color: var(--ig-ink)">
            « {{ a.bridgeNote }} »
          </p>
        </section>
      }

      @if (s.items.length) {
        <section class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          @for (it of s.items; track $index; let idx = $index) {
            <div class="p-3 rounded-xl border border-[var(--ig-border)] bg-[var(--ig-card)] flex items-start gap-2.5">
              <span class="material-icons text-base mt-0.5" [style.color]="accent()(idx)" aria-hidden="true">{{ it.icon || 'lightbulb' }}</span>
              <div class="text-xs space-y-0.5">
                <p class="font-bold text-[var(--ig-heading)]">{{ it.title }}</p>
                <p style="color: var(--ig-muted)">{{ it.text }}</p>
              </div>
            </div>
          }
        </section>
      }
    </div>
  `,
})
export class PresetAnalogyComponent {
  readonly spec = input.required<InfographicSpec>();
  readonly doc = input.required<InfographicDoc>();
  readonly accent = input.required<(i: number) => string>();
  readonly illustrating = input<string | null>(null);
  readonly illustrate = output<SpecImageTarget>();
}
