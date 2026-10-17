import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { LanguageService, LessonPlanStage } from '@core';

type StageField = 'name' | 'teacherActivity' | 'studentActivity';

/**
 * Lesson stages table on the A4 sheet: stage, minutes, teacher activity, pupils' activity.
 * In edit mode every cell is a field, rows can be added or removed, and the total minutes stay visible.
 */
@Component({
  selector: 'app-stages-block',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <table class="w-full text-xs border-collapse bg-white" (click)="editing() && $event.stopPropagation()">
      <thead>
        <tr>
          <th scope="col" class="border border-[#14251D]/40 bg-[#F2ECDE] px-2 py-1.5 font-semibold text-[#14251D] w-[22%]">{{ lang.tr('Étape', 'المرحلة') }}</th>
          <th scope="col" class="border border-[#14251D]/40 bg-[#F2ECDE] px-2 py-1.5 font-semibold text-[#14251D] w-[9%]">{{ lang.tr('Durée', 'المدة') }}</th>
          <th scope="col" class="border border-[#14251D]/40 bg-[#F2ECDE] px-2 py-1.5 font-semibold text-[#14251D]">{{ lang.tr('Activités de l’enseignant', 'نشاط المعلّم') }}</th>
          <th scope="col" class="border border-[#14251D]/40 bg-[#F2ECDE] px-2 py-1.5 font-semibold text-[#14251D]">{{ lang.tr('Activités des élèves', 'نشاط التلاميذ') }}</th>
          @if (editing()) {
            <th scope="col" class="border border-[#14251D]/40 bg-[#F2ECDE] w-8 print:hidden"><span class="sr-only">{{ lang.tr('Supprimer', 'حذف') }}</span></th>
          }
        </tr>
      </thead>
      <tbody>
        @for (s of stages(); track $index; let i = $index) {
          <tr class="align-top">
            @if (editing()) {
              <td class="border border-[#14251D]/40 p-1">
                <textarea dir="auto" rows="2" [value]="s.name" (input)="set(i, 'name', $any($event.target).value)" [attr.aria-label]="lang.tr('Étape', 'المرحلة') + ' ' + (i + 1)" [class]="field"></textarea>
              </td>
              <td class="border border-[#14251D]/40 p-1">
                <input type="number" min="1" max="120" [value]="s.minutes" (input)="setMinutes(i, $any($event.target).value)" [attr.aria-label]="lang.tr('Minutes', 'دقائق')" [class]="field" />
              </td>
              <td class="border border-[#14251D]/40 p-1">
                <textarea dir="auto" rows="4" [value]="s.teacherActivity" (input)="set(i, 'teacherActivity', $any($event.target).value)" [attr.aria-label]="lang.tr('Activités de l’enseignant', 'نشاط المعلّم')" [class]="field"></textarea>
              </td>
              <td class="border border-[#14251D]/40 p-1">
                <textarea dir="auto" rows="4" [value]="s.studentActivity" (input)="set(i, 'studentActivity', $any($event.target).value)" [attr.aria-label]="lang.tr('Activités des élèves', 'نشاط التلاميذ')" [class]="field"></textarea>
              </td>
              <td class="border border-[#14251D]/40 text-center print:hidden">
                <button type="button" (click)="remove(i)" [attr.aria-label]="lang.tr('Supprimer l’étape', 'حذف المرحلة')" class="w-8 h-8 inline-flex items-center justify-center text-[#BF5B34] hover:opacity-80 cursor-pointer">
                  <span class="material-icons text-sm" aria-hidden="true">delete</span>
                </button>
              </td>
            } @else {
              <td dir="auto" class="border border-[#14251D]/40 px-2 py-1.5 font-semibold text-[#14251D]">{{ s.name || '…' }}</td>
              <td class="border border-[#14251D]/40 px-2 py-1.5 text-center text-[#14251D] whitespace-nowrap">{{ s.minutes }} {{ lang.tr('min', 'د') }}</td>
              <td dir="auto" class="border border-[#14251D]/40 px-2 py-1.5 text-[#14251D] whitespace-pre-line">{{ s.teacherActivity || '…' }}</td>
              <td dir="auto" class="border border-[#14251D]/40 px-2 py-1.5 text-[#14251D] whitespace-pre-line">{{ s.studentActivity || '…' }}</td>
            }
          </tr>
        }
      </tbody>
      <tfoot>
        <tr>
          <td class="border border-[#14251D]/40 bg-[#FBF8F1] px-2 py-1.5 font-semibold text-[#14251D]">{{ lang.tr('Total', 'المجموع') }}</td>
          <td class="border border-[#14251D]/40 bg-[#FBF8F1] px-2 py-1.5 text-center font-semibold whitespace-nowrap" [class]="totalMatches() ? 'text-[#2D6A4F]' : 'text-[#BF5B34]'">{{ total() }} {{ lang.tr('min', 'د') }}</td>
          <td [attr.colspan]="editing() ? 3 : 2" class="border border-[#14251D]/40 bg-[#FBF8F1] px-2 py-1.5 text-[#5B6B60]">
            @if (!totalMatches()) {
              {{ lang.tr('La somme ne correspond pas à la durée de la séance (' + duration() + ' min).', 'مجموع المراحل لا يساوي مدة الحصة (' + duration() + ' دقيقة).') }}
            }
          </td>
        </tr>
      </tfoot>
    </table>
    @if (editing()) {
      <button type="button" (click)="add(); $event.stopPropagation()" class="mt-2 print:hidden px-3 min-h-9 rounded-xl border border-dashed border-[#2D6A4F]/40 hover:border-[#2D6A4F] text-[#2D6A4F] font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer">
        <span class="material-icons text-sm" aria-hidden="true">add</span>{{ lang.tr('Ajouter une étape', 'إضافة مرحلة') }}
      </button>
    }
  `,
})
export class StagesBlockComponent {
  readonly lang = inject(LanguageService);

  readonly stages = input<LessonPlanStage[]>([]);
  readonly editing = input<boolean>(false);
  /** Planned session length; the total turns terracotta when the stages do not add up to it. */
  readonly duration = input<number>(45);
  readonly stagesChange = output<LessonPlanStage[]>();

  readonly total = computed(() => this.stages().reduce((sum, s) => sum + (Number(s.minutes) || 0), 0));
  readonly totalMatches = computed(() => this.total() === this.duration());

  readonly field = 'w-full bg-[#FBF8F1] border border-[#2D6A4F]/40 rounded p-1.5 text-xs text-[#14251D] outline-none focus-visible:outline-2 focus-visible:outline-[#2D6A4F] leading-relaxed';

  set(i: number, key: StageField, value: string) {
    this.stagesChange.emit(this.stages().map((s, j) => (j === i ? { ...s, [key]: value } : s)));
  }

  setMinutes(i: number, value: string) {
    const minutes = Math.min(120, Math.max(0, Math.round(Number(value) || 0)));
    this.stagesChange.emit(this.stages().map((s, j) => (j === i ? { ...s, minutes } : s)));
  }

  add() {
    const next = this.stages().length + 1;
    this.stagesChange.emit([...this.stages(), { step: String(next), name: '', minutes: 5, teacherActivity: '', studentActivity: '' }]);
  }

  remove(i: number) {
    this.stagesChange.emit(this.stages().filter((_, j) => j !== i).map((s, j) => ({ ...s, step: String(j + 1) })));
  }
}
