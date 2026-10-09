import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CurriculumChapter, LanguageService, chapterById, chapterTitle, chaptersFor } from '@core';

/**
 * Picks an official curriculum topic for a grade / subject / trimester.
 * Presentational: the parent owns the selection and keeps free text as the fallback.
 * Renders nothing when the curriculum has no topic for that combination.
 */
@Component({
  selector: 'app-topic-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (options().length) {
      <div>
        <label [for]="selectId()" class="block text-xs font-medium text-[#5B6B60] mb-1">
          {{ lang.tr('Chapitre du programme officiel', 'درس من البرنامج الرسمي') }}
        </label>
        <select
          [id]="selectId()"
          [value]="value() ?? ''"
          (change)="onPick($any($event.target).value)"
          class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 py-2.5 text-xs text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
          <option value="" [selected]="!value()">{{ lang.tr('Sujet libre', 'موضوع حر') }}</option>
          @for (ch of options(); track ch.id) {
            <option [value]="ch.id" [selected]="ch.id === value()">{{ label(ch) }}</option>
          }
        </select>
      </div>
    }
  `,
})
export class TopicPickerComponent {
  readonly lang = inject(LanguageService);

  readonly grade = input<string | undefined>();
  readonly subject = input<string | undefined>();
  readonly trimester = input<string | undefined>();
  readonly value = input<string | null | undefined>(null);
  readonly selectId = input<string>('topic-picker');

  readonly topicChange = output<CurriculumChapter | null>();

  readonly options = computed(() =>
    this.grade() && this.subject() ? chaptersFor(this.grade(), this.subject(), this.trimester()) : [],
  );

  label(ch: CurriculumChapter): string {
    return chapterTitle(ch, this.lang.isArabic() ? 'ar' : 'fr');
  }

  onPick(id: string): void {
    this.topicChange.emit(chapterById(id) ?? null);
  }
}
