import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { InfographicDoc, InfographicSpec, LanguageService, SpecImageTarget } from '@core';
import { IllustrateButtonComponent } from './illustrate-button';

@Component({
  selector: 'app-preset-problem',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IllustrateButtonComponent],
  styles: `
    :host { display: block; }
    .problem-situation {
      background: var(--ig-hero, #FFF5DD);
      border: var(--ig-bw, 2px) solid var(--ig-border, #F0DCB0);
      border-radius: var(--ig-radius, 18px);
      padding: 1.25rem;
      position: relative;
    }
    .problem-table-wrap {
      overflow-x: auto;
      border: var(--ig-bw, 2px) solid var(--ig-border, #F0DCB0);
      border-radius: var(--ig-radius, 14px);
      background: var(--ig-card, #FFFFFF);
    }
    .problem-table th {
      background: var(--ig-hero, #FFF5DD);
      color: var(--ig-ink, #14251D);
      font-weight: 700;
      border-bottom: 2px solid var(--ig-border, #F0DCB0);
      padding: 0.65rem 0.85rem;
      font-size: 0.85rem;
    }
    .problem-table td {
      border-bottom: 1px solid var(--ig-border, #F0DCB0);
      border-inline-end: 1px solid var(--ig-border, #F0DCB0);
      padding: 0.65rem 0.85rem;
      font-size: 0.85rem;
      color: var(--ig-ink, #14251D);
    }
    .problem-table tr:last-child td {
      border-bottom: none;
    }
    .problem-table td:last-child {
      border-inline-end: none;
    }
    .question-card {
      background: var(--ig-card, #FFFFFF);
      border: var(--ig-bw, 2px) solid var(--ig-border, #F0DCB0);
      border-radius: var(--ig-radius, 16px);
      padding: 1.15rem;
      break-inside: avoid;
    }
    .writing-line {
      border-bottom: 1.5px dashed var(--ig-border, #F0DCB0);
      height: 1.85rem;
      margin-top: 0.4rem;
    }
  `,
  template: `
    @let p = spec().problem;
    @if (p) {
      <div class="space-y-4">
        <!-- Situation Context Box -->
        <section class="problem-situation">
          <div class="flex flex-col md:flex-row gap-4 items-start">
            @if (p.imageUrl) {
              <div class="w-full md:w-48 shrink-0 overflow-hidden rounded-xl border border-[var(--ig-border)] bg-white p-1">
                <img [src]="p.imageUrl" [alt]="spec().title" class="w-full h-32 object-contain rounded-lg" />
              </div>
            }
            <div class="flex-1 min-w-0 space-y-2">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm" [style.background]="accent()(0)">
                    <span class="material-icons text-base" aria-hidden="true">quiz</span>
                  </span>
                  <h3 class="font-display font-bold text-base sm:text-lg text-[var(--ig-ink)]">
                    {{ doc().language === 'fr' ? 'Situation problème' : 'الوضعية المشكل' }}
                  </h3>
                </div>
                <app-illustrate-button
                  [prompt]="p.imagePrompt"
                  [imageUrl]="p.imageUrl"
                  [busy]="illustrating() === 'problem'"
                  [disabled]="illustrating() !== null && illustrating() !== 'problem'"
                  (pressed)="illustrate.emit({ kind: 'problem' })">
                </app-illustrate-button>
              </div>
              <p class="text-sm sm:text-base font-medium leading-relaxed" style="color: var(--ig-ink)">
                {{ p.situation }}
              </p>
            </div>
          </div>
        </section>

        <!-- Optional Structured Table -->
        @if (p.table && p.table.rows.length) {
          <section class="problem-table-wrap">
            <table class="problem-table w-full text-start border-collapse">
              @if (p.table.headers && p.table.headers.length) {
                <thead>
                  <tr>
                    @for (h of p.table.headers; track $index) {
                      <th class="text-start">{{ h }}</th>
                    }
                  </tr>
                </thead>
              }
              <tbody>
                @for (row of p.table.rows; track $index) {
                  <tr [style.background]="$index % 2 === 1 ? 'var(--ig-hero)' : null">
                    @for (cell of row; track $index) {
                      <td class="font-semibold">{{ cell }}</td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </section>
        }

        <!-- Numbered Questions with Dotted Writing Lines -->
        <section class="space-y-3">
          @for (q of p.questions; track $index) {
            <article class="question-card">
              <div class="flex items-start gap-2.5 mb-2">
                <span class="w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5" [style.background]="accent()($index + 1)">
                  {{ $index + 1 }}
                </span>
                <p class="font-display font-bold text-sm sm:text-base text-[var(--ig-ink)] flex-1">
                  {{ q.text }}
                </p>
              </div>

              <!-- Answer lines for student writing in print / classroom -->
              <div class="pt-1">
                @for (_ of getLinesArray(q.linesCount || 2); track $index) {
                  <div class="writing-line"></div>
                }
              </div>
            </article>
          }
        </section>
      </div>
    }
  `,
})
export class PresetProblemComponent {
  readonly lang = inject(LanguageService);

  readonly spec = input.required<InfographicSpec>();
  readonly doc = input.required<InfographicDoc>();
  readonly accent = input.required<(i: number) => string>();
  readonly illustrating = input<string | null>(null);
  readonly illustrate = output<SpecImageTarget>();

  getLinesArray(count: number): number[] {
    return Array.from({ length: Math.min(Math.max(count, 1), 5) }, (_, i) => i);
  }
}
