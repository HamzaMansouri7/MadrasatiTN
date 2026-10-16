import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InfographicDoc, InfographicSpec, SpecImageTarget } from '@core';
import { IllustrateButtonComponent } from './illustrate-button';

/**
 * Quiz & MCQ card preset: Displays a prominent question, optional illustration,
 * 4 clear answer choices (A, B, C, D) with selection bubbles, a pedagogical hint,
 * and an answer explanation footer.
 */
@Component({
  selector: 'app-preset-quizcard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IllustrateButtonComponent],
  styles: `
    :host { display: block; }
    .qc-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .qc-question-box {
      background: var(--ig-card);
      border: var(--ig-bw, 2px) solid var(--ig-border);
      border-radius: var(--ig-radius, 16px);
      padding: 1.5rem;
      position: relative;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
    }
    .qc-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.85rem;
      border-radius: 999px;
      font-weight: 800;
      font-size: 0.8rem;
      color: #ffffff;
      margin-bottom: 0.75rem;
    }
    .qc-question-text {
      font-size: 1.25rem;
      font-weight: 800;
      line-height: 1.4;
      color: var(--ig-heading);
    }
    .qc-img {
      width: 100%;
      max-height: 220px;
      object-fit: cover;
      border-radius: calc(var(--ig-radius, 16px) - 4px);
      border: 1px solid var(--ig-border);
      margin-top: 1rem;
    }
    .qc-choices-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.85rem;
    }
    @media (max-width: 640px) {
      .qc-choices-grid { grid-template-columns: 1fr; }
    }
    .qc-choice {
      background: var(--ig-card);
      border: var(--ig-bw, 2px) solid var(--ig-border);
      border-radius: var(--ig-radius, 16px);
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      transition: transform 0.15s ease, border-color 0.15s ease;
      position: relative;
    }
    .qc-choice-badge {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.95rem;
      color: #ffffff;
      flex-shrink: 0;
    }
    .qc-choice-bubble {
      margin-inline-start: auto;
      width: 1.35rem;
      height: 1.35rem;
      border-radius: 999px;
      border: 2px solid var(--ig-border);
      flex-shrink: 0;
    }
    .qc-hint-box {
      background: var(--ig-hero);
      border: 1px dashed var(--ig-border);
      border-radius: calc(var(--ig-radius, 16px) - 4px);
      padding: 0.85rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 0.875rem;
    }
    .qc-explanation {
      background: var(--ig-card);
      border: var(--ig-bw, 2px) solid var(--ig-border);
      border-radius: var(--ig-radius, 16px);
      padding: 1.1rem 1.25rem;
      border-inline-start: 5px solid var(--ig-a);
    }
    @media print {
      .qc-explanation { display: none !important; }
    }
  `,
  template: `
    @let s = spec();
    @let q = s.quiz;
    @let fr = doc().language === 'fr';

    <div class="qc-container">
      @if (q) {
        <section class="qc-question-box">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <span class="qc-badge" [style.background]="accent()(0)">
              <span class="material-icons text-sm" aria-hidden="true">quiz</span>
              <span>{{ fr ? 'Question' : 'السؤال' }}</span>
            </span>
            <app-illustrate-button
              [prompt]="q.imagePrompt"
              [imageUrl]="q.imageUrl"
              [busy]="illustrating() === 'quiz'"
              [disabled]="!!illustrating()"
              (pressed)="illustrate.emit({ kind: 'quiz' })" />
          </div>

          <p class="qc-question-text font-display">{{ q.question }}</p>

          @if (q.imageUrl) {
            <img class="qc-img" [src]="q.imageUrl" [alt]="q.question" />
          }
        </section>

        @if (q.choices.length) {
          <section class="qc-choices-grid">
            @for (c of q.choices; track c.id; let idx = $index) {
              <article class="qc-choice">
                <span class="qc-choice-badge" [style.background]="accent()(idx)">
                  {{ choiceLabels[idx] || (idx + 1) }}
                </span>
                <span class="text-sm sm:text-base font-medium flex-1">{{ c.text }}</span>
                <span class="qc-choice-bubble" aria-hidden="true"></span>
              </article>
            }
          </section>
        }

        @if (q.hint) {
          <aside class="qc-hint-box">
            <span class="material-icons text-base" [style.color]="accent()(1)" aria-hidden="true">lightbulb</span>
            <p class="text-xs sm:text-sm"><strong>{{ fr ? 'Indice : ' : 'إرشاد : ' }}</strong>{{ q.hint }}</p>
          </aside>
        }

        @if (q.explanation) {
          <section class="qc-explanation print:hidden">
            <div class="flex items-center gap-2 mb-1.5 font-bold text-sm" style="color: var(--ig-heading)">
              <span class="material-icons text-base" [style.color]="accent()(0)" aria-hidden="true">check_circle</span>
              <span>{{ fr ? 'Correction & Explication' : 'الإصلاح والتفسير' }}</span>
            </div>
            <p class="text-xs sm:text-sm" style="color: var(--ig-muted)">{{ q.explanation }}</p>
          </section>
        }
      }

      @if (s.items.length) {
        <section class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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
    </div>
  `,
})
export class PresetQuizcardComponent {
  readonly spec = input.required<InfographicSpec>();
  readonly doc = input.required<InfographicDoc>();
  readonly accent = input.required<(i: number) => string>();
  readonly illustrating = input<string | null>(null);
  readonly illustrate = output<SpecImageTarget>();

  readonly choiceLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
}
