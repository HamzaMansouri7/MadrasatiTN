import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InfographicDoc, InfographicSpec, SpecImageTarget } from '@core';
import { IllustrateButtonComponent } from './illustrate-button';

/**
 * Flyer preset (Affiche & Annonce scolaire):
 * School event poster and announcement flyer featuring event title, logistics pills,
 * banner image, structured schedule/sections, and parent notice banner.
 */
@Component({
  selector: 'app-preset-flyer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IllustrateButtonComponent],
  styles: `
    :host { display: block; }
    .flyer-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .flyer-banner-card {
      background: var(--ig-card);
      border: var(--ig-bw, 2px) solid var(--ig-border);
      border-radius: var(--ig-radius, 20px);
      padding: 1.75rem;
      position: relative;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.03);
      text-align: center;
    }
    .flyer-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 1rem;
      border-radius: 999px;
      font-weight: 800;
      font-size: 0.85rem;
      color: #ffffff;
      margin-bottom: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .flyer-logistics-bar {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.75rem;
      margin: 1.25rem 0 0.5rem;
    }
    .flyer-pill {
      background: var(--ig-hero);
      border: 1px solid var(--ig-border);
      border-radius: 999px;
      padding: 0.45rem 1rem;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .flyer-hero-img {
      width: 100%;
      max-height: 240px;
      object-fit: cover;
      border-radius: calc(var(--ig-radius, 20px) - 6px);
      border: 1px solid var(--ig-border);
      margin-top: 1.25rem;
    }
    .flyer-sections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }
    .flyer-sec-card {
      background: var(--ig-card);
      border: var(--ig-bw, 2px) solid var(--ig-border);
      border-radius: var(--ig-radius, 16px);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
    }
    .flyer-notice-box {
      background: var(--ig-hero);
      border: 2px dashed var(--ig-a);
      border-radius: var(--ig-radius, 16px);
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
  `,
  template: `
    @let s = spec();
    @let f = s.flyer;
    @let fr = doc().language === 'fr';

    <div class="flyer-container">
      @if (f) {
        <section class="flyer-banner-card">
          <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
            <span class="flyer-badge font-display" [style.background]="accent()(0)">
              <span class="material-icons text-sm" aria-hidden="true">campaign</span>
              <span>{{ f.badge }}</span>
            </span>
            <app-illustrate-button
              [prompt]="f.imagePrompt"
              [imageUrl]="f.imageUrl"
              [busy]="illustrating() === 'flyer'"
              [disabled]="!!illustrating()"
              (pressed)="illustrate.emit({ kind: 'flyer' })" />
          </div>

          <h2 class="text-2xl sm:text-4xl font-black font-display text-[var(--ig-heading)] leading-tight">
            {{ f.eventTitle }}
          </h2>

          <!-- Logistics Bar -->
          <div class="flyer-logistics-bar">
            <div class="flyer-pill">
              <span class="material-icons text-base" [style.color]="accent()(0)" aria-hidden="true">calendar_today</span>
              <span>{{ f.date }}</span>
            </div>
            @if (f.time) {
              <div class="flyer-pill">
                <span class="material-icons text-base" [style.color]="accent()(1)" aria-hidden="true">schedule</span>
                <span>{{ f.time }}</span>
              </div>
            }
            <div class="flyer-pill">
              <span class="material-icons text-base" [style.color]="accent()(2)" aria-hidden="true">place</span>
              <span>{{ f.location }}</span>
            </div>
          </div>

          @if (f.imageUrl) {
            <img class="flyer-hero-img" [src]="f.imageUrl" [alt]="f.eventTitle" />
          }
        </section>

        <!-- Structured Sections -->
        @if (f.sections.length) {
          <section class="flyer-sections-grid">
            @for (sec of f.sections; track $index; let idx = $index) {
              <article class="flyer-sec-card">
                <div class="flex items-center gap-2 mb-2.5 pb-2 border-b border-[var(--ig-border)]">
                  <span class="material-icons text-xl" [style.color]="accent()(idx)" aria-hidden="true">
                    {{ sec.icon || 'star' }}
                  </span>
                  <h3 class="font-display font-bold text-base text-[var(--ig-heading)]">{{ sec.title }}</h3>
                </div>

                <ul class="space-y-1.5 text-xs sm:text-sm" style="color: var(--ig-ink)">
                  @for (d of sec.details; track $index) {
                    <li class="flex items-start gap-1.5">
                      <span class="text-xs mt-0.5" [style.color]="accent()(idx)">•</span>
                      <span>{{ d }}</span>
                    </li>
                  }
                </ul>
              </article>
            }
          </section>
        }

        <!-- Parent Notice / Reminder Box -->
        @if (f.notice) {
          <aside class="flyer-notice-box">
            <span class="material-icons text-2xl shrink-0" [style.color]="accent()(0)" aria-hidden="true">notification_important</span>
            <div class="text-xs sm:text-sm">
              <p class="font-bold text-[var(--ig-heading)]">{{ fr ? 'Rappel Important aux Parents :' : 'تذكير هام للأولياء :' }}</p>
              <p style="color: var(--ig-muted)">{{ f.notice }}</p>
            </div>
          </aside>
        }
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
export class PresetFlyerComponent {
  readonly spec = input.required<InfographicSpec>();
  readonly doc = input.required<InfographicDoc>();
  readonly accent = input.required<(i: number) => string>();
  readonly illustrating = input<string | null>(null);
  readonly illustrate = output<SpecImageTarget>();
}
