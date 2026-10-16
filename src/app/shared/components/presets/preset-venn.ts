import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InfographicDoc, InfographicSpec, SpecImageTarget } from '@core';

/**
 * Venn diagram preset:
 * Renders intersecting conceptual sets (Set A, Overlap / Intersection, Set B, and optional Set C),
 * with overlapping visual graphics, distinct accent colours, and clean item badges.
 */
@Component({
  selector: 'app-preset-venn',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .venn-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .venn-diagram-card {
      background: var(--ig-card);
      border: var(--ig-bw, 2px) solid var(--ig-border);
      border-radius: var(--ig-radius, 20px);
      padding: 1.5rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
    }
    .venn-zones-grid {
      display: grid;
      grid-template-columns: 1fr 1.15fr 1fr;
      gap: 1rem;
      align-items: stretch;
    }
    @media (max-width: 768px) {
      .venn-zones-grid { grid-template-columns: 1fr; }
    }
    .venn-zone {
      border: var(--ig-bw, 2px) solid var(--v-accent);
      border-radius: var(--ig-radius, 16px);
      padding: 1.25rem 1rem;
      background: var(--ig-card);
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .venn-zone.is-overlap {
      background: var(--ig-hero);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
      border-style: dashed;
    }
    .venn-title-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.9rem;
      border-radius: 999px;
      font-weight: 800;
      font-size: 0.95rem;
      color: #ffffff;
      align-self: flex-start;
      margin-bottom: 0.85rem;
    }
    .venn-items-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .venn-chip {
      background: rgba(255, 255, 255, 0.85);
      border: 1px solid var(--ig-border);
      border-radius: calc(var(--ig-radius, 16px) - 6px);
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      line-height: 1.35;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }
    .venn-svg-preview {
      width: 100%;
      max-width: 320px;
      margin: 0 auto 1.25rem;
      display: block;
    }
  `,
  template: `
    @let s = spec();
    @let v = s.venn;
    @let fr = doc().language === 'fr';

    <div class="venn-container">
      @if (v) {
        <section class="venn-diagram-card">
          <!-- Visual Overlapping Rings SVG -->
          <svg class="venn-svg-preview" viewBox="0 0 300 130" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="105" cy="65" r="55" [attr.fill]="accent()(0)" fill-opacity="0.25" [attr.stroke]="accent()(0)" stroke-width="2.5" />
            <circle cx="195" cy="65" r="55" [attr.fill]="accent()(2)" fill-opacity="0.25" [attr.stroke]="accent()(2)" stroke-width="2.5" />
            <!-- Overlap lens -->
            <path d="M 150 20 A 55 55 0 0 1 150 110 A 55 55 0 0 1 150 20" [attr.fill]="accent()(1)" fill-opacity="0.4" [attr.stroke]="accent()(1)" stroke-width="2" />
            <text x="75" y="69" text-anchor="middle" font-size="11" font-weight="bold" fill="currentColor">{{ v.setA.title }}</text>
            <text x="150" y="69" text-anchor="middle" font-size="10" font-weight="900" fill="currentColor">∩</text>
            <text x="225" y="69" text-anchor="middle" font-size="11" font-weight="bold" fill="currentColor">{{ v.setB.title }}</text>
          </svg>

          <div class="venn-zones-grid">
            <!-- Set A -->
            <article class="venn-zone" [style.--v-accent]="accent()(0)">
              <span class="venn-title-badge font-display" [style.background]="accent()(0)">
                <span class="material-icons text-sm" aria-hidden="true">category</span>
                <span>{{ v.setA.title }}</span>
              </span>
              <div class="venn-items-list">
                @for (item of v.setA.items; track $index) {
                  <div class="venn-chip">
                    <span class="w-2 h-2 rounded-full shrink-0" [style.background]="accent()(0)"></span>
                    <span>{{ item }}</span>
                  </div>
                }
              </div>
            </article>

            <!-- Overlap / Intersection -->
            <article class="venn-zone is-overlap" [style.--v-accent]="accent()(1)">
              <span class="venn-title-badge font-display" [style.background]="accent()(1)">
                <span class="material-icons text-sm" aria-hidden="true">join_inner</span>
                <span>{{ v.overlap.title || (fr ? 'Zone Commune' : 'الخصائص المشتركة') }}</span>
              </span>
              <div class="venn-items-list">
                @for (item of v.overlap.items; track $index) {
                  <div class="venn-chip font-medium">
                    <span class="material-icons text-sm shrink-0" [style.color]="accent()(1)" aria-hidden="true">check</span>
                    <span>{{ item }}</span>
                  </div>
                }
              </div>
            </article>

            <!-- Set B -->
            <article class="venn-zone" [style.--v-accent]="accent()(2)">
              <span class="venn-title-badge font-display" [style.background]="accent()(2)">
                <span class="material-icons text-sm" aria-hidden="true">category</span>
                <span>{{ v.setB.title }}</span>
              </span>
              <div class="venn-items-list">
                @for (item of v.setB.items; track $index) {
                  <div class="venn-chip">
                    <span class="w-2 h-2 rounded-full shrink-0" [style.background]="accent()(2)"></span>
                    <span>{{ item }}</span>
                  </div>
                }
              </div>
            </article>
          </div>

          <!-- Optional Set C -->
          @if (v.setC) {
            <article class="venn-zone mt-4" [style.--v-accent]="accent()(3)">
              <span class="venn-title-badge font-display" [style.background]="accent()(3)">
                <span class="material-icons text-sm" aria-hidden="true">alt_route</span>
                <span>{{ v.setC.title }}</span>
              </span>
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                @for (item of v.setC.items; track $index) {
                  <div class="venn-chip">
                    <span class="w-2 h-2 rounded-full shrink-0" [style.background]="accent()(3)"></span>
                    <span>{{ item }}</span>
                  </div>
                }
              </div>
            </article>
          }
        </section>
      }

      @if (s.items.length) {
        <section class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          @for (it of s.items; track $index; let idx = $index) {
            <div class="p-3 rounded-xl border border-[var(--ig-border)] bg-[var(--ig-card)] flex items-start gap-2.5">
              <span class="material-icons text-base mt-0.5" [style.color]="accent()(idx)" aria-hidden="true">{{ it.icon || 'info' }}</span>
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
export class PresetVennComponent {
  readonly spec = input.required<InfographicSpec>();
  readonly doc = input.required<InfographicDoc>();
  readonly accent = input.required<(i: number) => string>();
  readonly illustrating = input<string | null>(null);
  readonly illustrate = output<SpecImageTarget>();
}
