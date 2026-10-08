import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { InfographicDoc, InfographicSpec } from '@core';

/**
 * A lesson told as numbered stages, each split into what the teacher does and what the
 * learner does (the "مذكرة درس" poster structure). Items, when present, become key-notion chips.
 */
@Component({
  selector: 'app-preset-lesson-stages',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .ls-stage {
      background: var(--ig-card);
      border: var(--ig-bw, 2px) solid var(--ig-border);
      border-radius: var(--ig-radius, 16px);
      overflow: hidden;
      break-inside: avoid;
    }
    .ls-head { display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 1rem; }
    .ls-num {
      width: 2.25rem; height: 2.25rem; border-radius: 999px; color: #fff; font-weight: 800;
      display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .ls-time {
      margin-inline-start: auto; font-size: 0.75rem; font-weight: 700; padding: 0.15rem 0.6rem;
      border-radius: 999px; background: var(--ig-hero); border: 1px solid var(--ig-border);
    }
    .ls-cols { display: grid; grid-template-columns: 1fr 1fr; border-top: var(--ig-bw, 2px) solid var(--ig-border); }
    .ls-col { padding: 0.75rem 1rem; }
    .ls-col + .ls-col { border-inline-start: var(--ig-bw, 2px) dashed var(--ig-border); }
    .ls-role { display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; font-weight: 800; margin-bottom: 0.25rem; }
    .ls-chip {
      display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.8rem; border-radius: 999px;
      background: var(--ig-hero); border: var(--ig-bw, 2px) solid var(--ig-border); font-size: 0.8rem; font-weight: 700;
    }
    @media (max-width: 640px) {
      .ls-cols { grid-template-columns: 1fr; }
      .ls-col + .ls-col { border-inline-start: 0; border-top: var(--ig-bw, 2px) dashed var(--ig-border); }
    }
  `,
  template: `
    @let s = spec();
    @let fr = doc().language === 'fr';
    @if (s.items.length) {
      <div class="flex flex-wrap gap-2 mb-4">
        @for (it of s.items; track $index) {
          <span class="ls-chip">
            <span class="material-icons text-sm" [style.color]="accent()($index)" aria-hidden="true">{{ it.icon }}</span>
            {{ it.title }}
          </span>
        }
      </div>
    }

    <ol class="space-y-3">
      @for (st of s.stages ?? []; track $index) {
        <li class="ls-stage">
          <div class="ls-head">
            <span class="ls-num" [style.background]="accent()($index)">{{ st.stageNumber }}</span>
            <h3 class="font-display font-semibold text-base">{{ st.title }}</h3>
            @if (st.duration) {
              <span class="ls-time">{{ st.duration }}</span>
            }
          </div>
          <div class="ls-cols">
            <div class="ls-col">
              <p class="ls-role" [style.color]="accent()($index)">
                <span class="material-icons text-sm" aria-hidden="true">co_present</span>
                {{ fr ? 'Activité de l’enseignant' : 'نشاط المعلّم' }}
              </p>
              <p class="text-sm leading-relaxed">{{ st.teacherActivity }}</p>
            </div>
            <div class="ls-col">
              <p class="ls-role" [style.color]="accent()($index + 1)">
                <span class="material-icons text-sm" aria-hidden="true">edit</span>
                {{ fr ? 'Activité de l’élève' : 'نشاط المتعلّم' }}
              </p>
              <p class="text-sm leading-relaxed">{{ st.learnerActivity }}</p>
            </div>
          </div>
        </li>
      }
    </ol>
  `,
})
export class PresetLessonStagesComponent {
  readonly spec = input.required<InfographicSpec>();
  readonly doc = input.required<InfographicDoc>();
  readonly accent = input.required<(i: number) => string>();
}
