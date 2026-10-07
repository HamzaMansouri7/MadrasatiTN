import { ChangeDetectionStrategy, Component, computed, inject, input, model, output } from '@angular/core';
import { LanguageService, PRIMARY_GRADES, PRIMARY_SUBJECTS } from '@core';

export type FilterBarAccent = 'blue' | 'green' | 'library';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-[#F7F9FB] p-4 rounded-[18px] border border-[#E3ECF2] space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <!-- Search Input -->
        <div class="relative grow max-w-md">
          <span class="material-icons absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-[#627D98] text-sm" aria-hidden="true">search</span>
          <input
            type="text"
            [value]="search()"
            (input)="onSearchInput($any($event.target).value)"
            [placeholder]="searchPlaceholder() || lang.t('searchDocsPlaceholder')"
            class="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 text-xs bg-white border border-[#E3ECF2] rounded-[10px] outline-none text-[#102A43] transition-colors"
            [class]="inputFocusClass()" />
        </div>

        <!-- Grade Filter Pills -->
        @if (grades().length > 0) {
          <div class="flex flex-wrap items-center gap-1.5" role="group" [attr.aria-label]="lang.tr('Niveau scolaire', 'المستوى الدراسي')">
            @for (grade of grades(); track grade) {
              <button
                type="button"
                (click)="onSelectGrade(grade)"
                [class]="selectedGrade() === grade ? gradeActiveBtnClass() : gradeInactiveBtnClass()"
                class="px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer">
                {{ grade === 'all' ? lang.t('filterGradeAll') : lang.translateGrade(grade) }}
              </button>
            }
          </div>
        }
      </div>

      <!-- Subject Filter Pills -->
      @if (subjects().length > 0) {
        <div class="flex flex-wrap items-center gap-1.5 pt-1" role="group" [attr.aria-label]="lang.tr('Matière', 'المادة')">
          @for (subj of subjects(); track subj) {
            <button
              type="button"
              (click)="onSelectSubject(subj)"
              [class]="selectedSubject() === subj
                ? 'bg-[#23845B] text-white font-semibold shadow-xs'
                : 'bg-white text-[#486581] border border-[#E3ECF2] hover:border-[#23845B]'"
              class="px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer">
              {{ subj === 'all' ? lang.t('filterSubjectAll') : lang.translateSubject(subj) }}
            </button>
          }
        </div>
      }

      <!-- Topic Taxonomy Pills (Book → Chapter → Topic → Exercise) -->
      @if (topics().length > 1) {
        <div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E3ECF2]" role="group" [attr.aria-label]="lang.tr('Thème / Chapitre', 'المحور / الدرس')">
          <span class="text-[10px] font-semibold text-[#627D98] flex items-center gap-1 pr-1 rtl:pr-0 rtl:pl-1">
            <span class="material-icons text-xs text-[#8A5A00]" aria-hidden="true">sell</span>
            {{ lang.tr('Thème / Chapitre :', 'المحور / الدرس :') }}
          </span>
          @for (topic of topics(); track topic) {
            <button
              type="button"
              (click)="onSelectTopic(topic)"
              [class]="selectedTopic() === topic
                ? 'bg-[#8A5A00] text-white font-semibold shadow-xs'
                : 'bg-white text-[#486581] border border-[#E3ECF2] hover:border-[#8A5A00]'"
              class="px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer">
              {{ topic === 'all' ? lang.tr('Tous les thèmes', 'كل المحاور') : topic }}
            </button>
          }
        </div>
      }

      <ng-content />
    </div>
  `,
})
export class FilterBarComponent {
  readonly lang = inject(LanguageService);

  readonly search = model<string>('');
  readonly selectedGrade = model<string>('all');
  readonly selectedSubject = model<string>('all');
  readonly selectedTopic = model<string>('all');

  readonly grades = input<readonly string[]>(['all', ...PRIMARY_GRADES]);
  readonly subjects = input<readonly string[]>(['all', ...PRIMARY_SUBJECTS]);
  readonly topics = input<readonly string[]>([]);
  readonly searchPlaceholder = input<string>('');
  readonly accent = input<FilterBarAccent>('blue');

  readonly filterChange = output<void>();

  protected readonly inputFocusClass = computed(() => {
    switch (this.accent()) {
      case 'green': return 'focus:border-[#2D6A4F]';
      case 'library': return 'focus:border-[#1B4332]';
      case 'blue':
      default: return 'focus:border-[#007CC2]';
    }
  });

  protected readonly gradeActiveBtnClass = computed(() => {
    switch (this.accent()) {
      case 'green': return 'bg-[#2D6A4F] text-[#FBF8F1] font-semibold shadow-xs';
      case 'library': return 'bg-[#1B4332] text-[#FBF8F1] font-semibold shadow-xs';
      case 'blue':
      default: return 'bg-[#007CC2] text-white font-semibold shadow-xs';
    }
  });

  protected readonly gradeInactiveBtnClass = computed(() => {
    switch (this.accent()) {
      case 'green': return 'bg-white text-[#486581] border border-[#E3ECF2] hover:border-[#2D6A4F]';
      case 'library': return 'bg-white text-[#486581] border border-[#E3ECF2] hover:border-[#1B4332]';
      case 'blue':
      default: return 'bg-white text-[#486581] border border-[#E3ECF2] hover:border-[#007CC2]';
    }
  });

  onSearchInput(val: string) {
    this.search.set(val);
    this.filterChange.emit();
  }

  onSelectGrade(grade: string) {
    this.selectedGrade.set(grade);
    this.selectedTopic.set('all');
    this.filterChange.emit();
  }

  onSelectSubject(subj: string) {
    this.selectedSubject.set(subj);
    this.selectedTopic.set('all');
    this.filterChange.emit();
  }

  onSelectTopic(topic: string) {
    this.selectedTopic.set(topic);
    this.filterChange.emit();
  }
}
