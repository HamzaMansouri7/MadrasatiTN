import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InfographicDoc, InfographicSpec, SpecImageTarget } from '@core';
import { IllustrateButtonComponent } from './illustrate-button';

/**
 * ID Card / Fiche d'identité preset:
 * Renders identification and classification sheets for animals, plants,
 * historic personalities or scientific elements with key stats and facts.
 */
@Component({
  selector: 'app-preset-idcard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IllustrateButtonComponent],
  styles: `
    :host { display: block; }
    .id-card-frame {
      background: var(--ig-card);
      border: var(--ig-bw, 2px) solid var(--ig-border);
      border-radius: var(--ig-radius, 20px);
      padding: 1.75rem;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.03);
    }
    .id-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
      border-bottom: 2px solid var(--ig-border);
      padding-bottom: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .id-category-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.9rem;
      border-radius: 999px;
      font-weight: 800;
      font-size: 0.825rem;
      color: #ffffff;
    }
    .id-body-grid {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    @media (max-width: 768px) {
      .id-body-grid { grid-template-columns: 1fr; }
    }
    .id-photo-container {
      border: var(--ig-bw, 2px) solid var(--ig-border);
      border-radius: calc(var(--ig-radius, 20px) - 4px);
      overflow: hidden;
      background: var(--ig-hero);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 240px;
      position: relative;
    }
    .id-photo-img {
      width: 100%;
      height: 240px;
      object-fit: cover;
    }
    .id-stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }
    @media (max-width: 500px) {
      .id-stats-grid { grid-template-columns: 1fr; }
    }
    .id-stat-box {
      background: var(--ig-hero);
      border: 1px solid var(--ig-border);
      border-radius: calc(var(--ig-radius, 16px) - 4px);
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .id-facts-box {
      margin-top: 1.5rem;
      padding: 1.25rem 1.5rem;
      background: var(--ig-hero);
      border: 1px dashed var(--ig-border);
      border-radius: var(--ig-radius, 16px);
    }
  `,
  template: `
    @let s = spec();
    @let id = s.idCard;
    @let fr = doc().language === 'fr';

    @if (id) {
      <article class="id-card-frame">
        <header class="id-header">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="id-category-pill" [style.background]="accent()(0)">
                <span class="material-icons text-xs" aria-hidden="true">badge</span>
                <span>{{ id.category }}</span>
              </span>
              @if (id.scientificName) {
                <span class="text-xs italic font-medium" style="color: var(--ig-muted)">({{ id.scientificName }})</span>
              }
            </div>
            <h2 class="text-2xl sm:text-3xl font-black font-display text-[var(--ig-heading)]">{{ id.entityName }}</h2>
          </div>

          <app-illustrate-button
            [prompt]="id.imagePrompt"
            [imageUrl]="id.imageUrl"
            [busy]="illustrating() === 'idCard'"
            [disabled]="!!illustrating()"
            (pressed)="illustrate.emit({ kind: 'idCard' })" />
        </header>

        <div class="id-body-grid">
          <!-- Photo Container -->
          <div class="id-photo-container">
            @if (id.imageUrl) {
              <img class="id-photo-img" [src]="id.imageUrl" [alt]="id.entityName" />
            } @else {
              <div class="p-6 text-center text-xs opacity-75">
                <span class="material-icons text-5xl mb-2" [style.color]="accent()(0)" aria-hidden="true">image</span>
                <p class="font-bold">{{ fr ? 'Illustration du sujet' : 'صورة العنصر' }}</p>
                <p class="mt-1 opacity-70">{{ id.imagePrompt || (fr ? 'Cliquez sur Illustrer pour créer l’image' : 'اضغط على توليد لإنشاء الصورة') }}</p>
              </div>
            }
          </div>

          <!-- Stats Grid -->
          <div class="space-y-3">
            <h3 class="text-xs uppercase tracking-wider font-bold text-[var(--ig-muted)]">
              {{ fr ? 'Caractéristiques Clés' : 'المعطيات والخصائص' }}
            </h3>
            <div class="id-stats-grid">
              @for (st of id.stats; track $index; let idx = $index) {
                <div class="id-stat-box">
                  <span class="material-icons text-xl shrink-0" [style.color]="accent()(idx)" aria-hidden="true">
                    {{ st.icon || 'analytics' }}
                  </span>
                  <div class="min-w-0">
                    <p class="text-[11px] font-semibold text-[var(--ig-muted)]">{{ st.label }}</p>
                    <p class="text-sm font-bold text-[var(--ig-heading)] truncate">{{ st.value }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        @if (id.facts.length) {
          <section class="id-facts-box">
            <h4 class="font-display font-bold text-sm mb-2 text-[var(--ig-heading)] flex items-center gap-1.5">
              <span class="material-icons text-base" [style.color]="accent()(1)" aria-hidden="true">tips_and_updates</span>
              <span>{{ fr ? 'Faits & Informations Importantes' : 'حقائق ومعلومات هامة' }}</span>
            </h4>
            <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              @for (fact of id.facts; track $index) {
                <li class="flex items-start gap-2">
                  <span class="material-icons text-sm mt-0.5 shrink-0" [style.color]="accent()(0)" aria-hidden="true">check_circle_outline</span>
                  <span>{{ fact }}</span>
                </li>
              }
            </ul>
          </section>
        }
      </article>
    }

    @if (s.items.length) {
      <section class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        @for (it of s.items; track $index; let idx = $index) {
          <div class="p-3 rounded-xl border border-[var(--ig-border)] bg-[var(--ig-card)] flex items-start gap-2.5">
            <span class="material-icons text-base mt-0.5" [style.color]="accent()(idx)" aria-hidden="true">{{ it.icon || 'star' }}</span>
            <div class="text-xs space-y-0.5">
              <p class="font-bold text-[var(--ig-heading)]">{{ it.title }}</p>
              <p style="color: var(--ig-muted)">{{ it.text }}</p>
            </div>
          </div>
        }
      </section>
    }
  `,
})
export class PresetIdcardComponent {
  readonly spec = input.required<InfographicSpec>();
  readonly doc = input.required<InfographicDoc>();
  readonly accent = input.required<(i: number) => string>();
  readonly illustrating = input<string | null>(null);
  readonly illustrate = output<SpecImageTarget>();
}
