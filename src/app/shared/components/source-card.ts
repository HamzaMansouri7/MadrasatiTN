import { ChangeDetectionStrategy, Component, computed, HostListener, inject, input, OnInit, signal, WritableSignal } from '@angular/core';
import { CurriculumChapter, LanguageService, chapterTitle, downscaleImage } from '@core';
import { LibraryResourcesService } from '@core/services/library-resources.service';
import { TopicPickerComponent } from './topic-picker';

export type SourceTab = 'topic' | 'text' | 'photo' | 'file' | 'library';

export interface SourceImage {
  base64Data: string;
  contentType: string;
}

export interface SourceFile extends SourceImage {
  filename: string;
}

/**
 * The fields of a source card. A studio can pass its own existing signals here, so its other code
 * (drafts, previews, requests) keeps reading them unchanged.
 */
export interface SourceFormState {
  tab: WritableSignal<SourceTab>;
  topic: WritableSignal<string>;
  topicId: WritableSignal<string | null>;
  text: WritableSignal<string>;
  images: WritableSignal<SourceImage[]>;
  file: WritableSignal<SourceFile | null>;
  resourceUrl: WritableSignal<string>;
  instructions: WritableSignal<string>;
}

export function createSourceFormState(): SourceFormState {
  return {
    tab: signal<SourceTab>('topic'),
    topic: signal(''),
    topicId: signal<string | null>(null),
    text: signal(''),
    images: signal<SourceImage[]>([]),
    file: signal<SourceFile | null>(null),
    resourceUrl: signal(''),
    instructions: signal(''),
  };
}

/** Field ids used for the required-field messages (pass them to the studio session's validate). */
export const SOURCE_FIELD_IDS: Record<SourceTab, string> = {
  topic: 'src-topic',
  text: 'src-text',
  photo: 'src-photo',
  file: 'src-file',
  library: 'src-library',
};

/** True when the active tab holds something to generate from. */
export function hasSource(s: SourceFormState): boolean {
  switch (s.tab()) {
    case 'topic': return !!s.topic().trim();
    case 'text': return !!s.text().trim();
    case 'photo': return s.images().length > 0;
    case 'file': return !!s.file();
    case 'library': return !!s.resourceUrl();
  }
}

/** Required-field check for the active tab, in the shape the studio session's validate() takes. */
export function sourceChecks(s: SourceFormState, tr: (fr: string, ar: string) => string) {
  const tab = s.tab();
  return [
    { id: SOURCE_FIELD_IDS.topic, ok: tab !== 'topic' || !!s.topic().trim(), message: tr('Indiquez le sujet de la leçon.', 'اكتب موضوع الدرس.') },
    { id: SOURCE_FIELD_IDS.text, ok: tab !== 'text' || !!s.text().trim(), message: tr('Collez le texte du cours.', 'الصق نص الدرس.') },
    { id: SOURCE_FIELD_IDS.photo, ok: tab !== 'photo' || s.images().length > 0, message: tr('Ajoutez au moins une photo.', 'أضف صورة واحدة على الأقل.') },
    { id: SOURCE_FIELD_IDS.file, ok: tab !== 'file' || !!s.file(), message: tr('Choisissez un fichier PDF ou Word.', 'اختر ملف PDF أو Word.') },
    { id: SOURCE_FIELD_IDS.library, ok: tab !== 'library' || !!s.resourceUrl(), message: tr('Choisissez un document officiel.', 'اختر وثيقة رسمية.') },
  ];
}

interface FieldErrors {
  fieldError(id: string): string;
  clearFieldError(id: string): void;
}

/**
 * Shared "Source" card of the studios: topic (with the official programme picker), lesson text,
 * photos (drop, browse or Ctrl+V), PDF / Word file, or a page of the official textbooks filtered by
 * the chosen grade and subject. Plus optional notes for the AI.
 */
@Component({
  selector: 'app-source-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TopicPickerComponent],
  template: `
    <div class="space-y-4">
      <div role="tablist" [attr.aria-label]="lang.tr('Source du cours', 'مصدر الدرس')" class="flex flex-wrap gap-1.5 p-1.5 rounded-2xl border border-[#E7DFCF] bg-[#FBF8F1]">
        @for (tab of tabs; track tab.id) {
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="state().tab() === tab.id"
            (click)="state().tab.set(tab.id)"
            [class]="state().tab() === tab.id ? 'bg-[#14251D] text-[#FBF8F1] shadow-xs font-semibold' : 'text-[#5B6B60] hover:bg-[#F2ECDE] hover:text-[#14251D] font-medium'"
            class="px-3 min-h-10 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
            <span class="material-icons text-base" aria-hidden="true">{{ tab.icon }}</span>
            <span>{{ lang.t(tab.key) }}</span>
          </button>
        }
      </div>

      @switch (state().tab()) {
        @case ('topic') {
          <div class="space-y-2">
            <label [for]="ids.topic" class="block text-sm font-semibold text-[#14251D]">{{ lang.t('memoInputTopicLabel') }}</label>
            <textarea
              [id]="ids.topic"
              rows="2"
              dir="auto"
              [value]="state().topic()"
              (input)="onTopicTyped($any($event.target).value)"
              [attr.aria-invalid]="!!error(ids.topic)"
              [placeholder]="lang.t('memoInputTopicPlaceholder')"
              [class]="field"></textarea>
            @if (error(ids.topic); as msg) {
              <p class="text-xs font-medium text-[#BF5B34]">{{ msg }}</p>
            }
            <app-topic-picker
              [selectId]="ids.topic + '-picker'"
              [grade]="grade()"
              [subject]="subject()"
              [trimester]="trimester()"
              [value]="state().topicId()"
              (topicChange)="onTopicPicked($event)" />
          </div>
        }
        @case ('text') {
          <div class="space-y-2">
            <label [for]="ids.text" class="block text-sm font-semibold text-[#14251D]">{{ lang.t('memoInputTextLabel') }}</label>
            <textarea
              [id]="ids.text"
              rows="6"
              dir="auto"
              [value]="state().text()"
              (input)="state().text.set($any($event.target).value); clear(ids.text)"
              [attr.aria-invalid]="!!error(ids.text)"
              [placeholder]="lang.t('memoInputTextPlaceholder')"
              [class]="field"></textarea>
            @if (error(ids.text); as msg) {
              <p class="text-xs font-medium text-[#BF5B34]">{{ msg }}</p>
            }
          </div>
        }
        @case ('photo') {
          <div class="space-y-3">
            <label [for]="ids.photo + '-input'" class="block text-sm font-semibold text-[#14251D]">{{ lang.tr('Ajouter ou coller des captures (Ctrl+V)', 'إضافة أو لصق لقطات الشاشة') }}</label>
            <div (dragover)="$event.preventDefault()" (drop)="onDrop($event)" class="border-2 border-dashed border-[#E7DFCF] rounded-lg p-6 text-center bg-[#FBF8F1] hover:bg-[#F2ECDE] transition-colors">
              <input #photoInput type="file" multiple accept="image/*" (change)="onImageSelect($event)" class="hidden" [id]="ids.photo + '-input'" />
              <div class="space-y-2">
                <img src="/assets/memo/magnifier.svg" alt="" aria-hidden="true" class="w-8 h-8 mx-auto" />
                <p class="text-sm text-[#5B6B60]">{{ lang.tr('Glissez vos photos ici, collez avec Ctrl+V ou', 'اسحب الصور هنا، الصق بـ Ctrl+V أو') }}</p>
                <button type="button" [id]="ids.photo" (click)="photoInput.click()" class="px-5 min-h-11 bg-[#FBF8F1] border border-[#E7DFCF] rounded-md text-sm font-medium text-[#4A5A50] hover:bg-[#F2ECDE] transition-colors cursor-pointer">
                  {{ lang.tr('Parcourir les fichiers', 'استعراض الصور') }}
                </button>
              </div>
            </div>
            @if (error(ids.photo); as msg) {
              <p role="alert" class="text-xs font-medium text-[#BF5B34]">{{ msg }}</p>
            }
            @if (state().images().length > 0) {
              <div class="flex flex-wrap gap-2 pt-2">
                @for (img of state().images(); track $index) {
                  <div class="relative w-20 h-20 rounded-md overflow-hidden border border-[#E7DFCF]">
                    <img [src]="img.base64Data" alt="" class="w-full h-full object-cover" />
                    <button type="button" (click)="removeImage($index)" [attr.aria-label]="lang.tr('Retirer la photo', 'إزالة الصورة')" class="absolute top-1 end-1 w-7 h-7 bg-[#14251D] hover:bg-[#C1121F] text-[#FBF8F1] rounded-full flex items-center justify-center cursor-pointer transition-colors">
                      <span class="material-icons text-base" aria-hidden="true">close</span>
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        }
        @case ('file') {
          <div class="space-y-3">
            <label [for]="ids.file + '-input'" class="block text-sm font-semibold text-[#14251D]">{{ lang.tr('Fichier PDF ou DOCX', 'ملف PDF أو DOCX') }}</label>
            <div class="border-2 border-dashed border-[#E7DFCF] rounded-lg p-6 text-center bg-[#FBF8F1]">
              <input #docInput type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" (change)="onFileSelect($event)" class="hidden" [id]="ids.file + '-input'" />
              <div class="space-y-2">
                <img src="/assets/memo/books.svg" alt="" aria-hidden="true" class="w-8 h-8 mx-auto" />
                <p class="text-sm text-[#5B6B60]">{{ state().file()?.filename || lang.tr('Sélectionnez un document PDF ou Word (.docx)', 'اختر وثيقة بصيغة PDF أو Word') }}</p>
                <button type="button" [id]="ids.file" (click)="docInput.click()" class="px-5 min-h-11 bg-[#FBF8F1] border border-[#E7DFCF] rounded-md text-sm font-medium text-[#4A5A50] hover:bg-[#F2ECDE] transition-colors cursor-pointer">
                  {{ state().file() ? lang.tr('Changer de fichier', 'تغيير الملف') : lang.tr('Parcourir', 'اختيار ملف') }}
                </button>
              </div>
            </div>
            @if (error(ids.file); as msg) {
              <p role="alert" class="text-xs font-medium text-[#BF5B34]">{{ msg }}</p>
            }
          </div>
        }
        @case ('library') {
          <div class="space-y-3">
            <label [for]="ids.library" class="block text-sm font-semibold text-[#14251D]">{{ lang.tr('Choisir une ressource du catalogue CNP', 'اختر من معينات ودليل الكتب المدرسية') }}</label>
            @if (!library.loaded()) {
              <p class="text-sm text-[#5B6B60]">{{ lang.tr('Chargement des ressources du catalogue…', 'جارٍ تحميل المعينات…') }}</p>
            } @else if (libraryItems().length === 0) {
              <p class="text-sm text-[#5B6B60]">{{ lang.tr('Aucune page de manuel pour ce niveau et cette matière pour le moment.', 'لا توجد صفحات من الكتاب المدرسي لهذا المستوى وهذه المادة حاليًا.') }}</p>
            } @else {
              <select
                [id]="ids.library"
                [value]="state().resourceUrl()"
                (change)="state().resourceUrl.set($any($event.target).value); clear(ids.library)"
                [attr.aria-invalid]="!!error(ids.library)"
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] aria-invalid:border-[#BF5B34] rounded-xl px-3 min-h-11 text-sm text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]">
                <option value="">{{ lang.tr('Sélectionner un document officiel', 'اختر وثيقة رسمية') }}</option>
                @for (item of libraryItems(); track item.id) {
                  <option [value]="item.relPath" [selected]="item.relPath === state().resourceUrl()">{{ item.title }}</option>
                }
              </select>
            }
            @if (error(ids.library); as msg) {
              <p role="alert" class="text-xs font-medium text-[#BF5B34]">{{ msg }}</p>
            }
          </div>
        }
      }

      <div class="space-y-1.5">
        <label [for]="ids.topic + '-notes'" class="flex items-center justify-between text-sm font-semibold text-[#14251D]">
          <span>{{ lang.t('memoInstructionsLabel') }}</span>
          <span class="text-xs font-normal text-[#5B6B60]">{{ lang.tr('Optionnel', 'اختياري') }}</span>
        </label>
        <textarea
          [id]="ids.topic + '-notes'"
          rows="3"
          dir="auto"
          [value]="state().instructions()"
          (input)="state().instructions.set($any($event.target).value)"
          [placeholder]="lang.t('memoInstructionsPlaceholder')"
          [class]="field"></textarea>
      </div>
    </div>
  `,
})
export class SourceCardComponent implements OnInit {
  readonly lang = inject(LanguageService);
  readonly library = inject(LibraryResourcesService);

  readonly state = input.required<SourceFormState>();
  readonly grade = input<string>('');
  readonly subject = input<string>('');
  readonly trimester = input<string>('');
  /** The studio session (or anything with fieldError / clearFieldError) for required-field messages. */
  readonly errors = input<FieldErrors | null>(null);

  readonly ids = SOURCE_FIELD_IDS;
  readonly tabs: { id: SourceTab; icon: string; key: string }[] = [
    { id: 'topic', icon: 'menu_book', key: 'memoTabTopic' },
    { id: 'text', icon: 'notes', key: 'memoTabText' },
    { id: 'photo', icon: 'photo_camera', key: 'memoTabPhoto' },
    { id: 'file', icon: 'upload_file', key: 'memoTabFile' },
    { id: 'library', icon: 'auto_stories', key: 'memoTabLibrary' },
  ];
  readonly field =
    'w-full bg-[#FBF8F1] border border-[#E7DFCF] aria-invalid:border-[#BF5B34] rounded-xl p-3 text-sm text-[#14251D] leading-relaxed resize-y focus:bg-white focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F] transition-all shadow-2xs';

  readonly libraryItems = computed(() => this.library.forClass(this.grade(), this.subject()));
  private pickedTitle = '';

  ngOnInit() {
    void this.library.load();
  }

  error(id: string): string {
    return this.errors()?.fieldError(id) ?? '';
  }

  clear(id: string) {
    this.errors()?.clearFieldError(id);
  }

  onTopicPicked(ch: CurriculumChapter | null) {
    const s = this.state();
    s.topicId.set(ch?.id ?? null);
    this.pickedTitle = ch ? chapterTitle(ch, this.lang.isArabic() ? 'ar' : 'fr') : '';
    if (ch) {
      s.topic.set(this.pickedTitle);
      this.clear(this.ids.topic);
    }
  }

  /** Typing over a picked chapter turns it back into a free topic. */
  onTopicTyped(value: string) {
    const s = this.state();
    s.topic.set(value);
    this.clear(this.ids.topic);
    if (s.topicId() && value !== this.pickedTitle) s.topicId.set(null);
  }

  @HostListener('window:paste', ['$event'])
  async onPaste(event: ClipboardEvent) {
    if (this.state().tab() !== 'photo') return;
    for (const item of Array.from(event.clipboardData?.items ?? [])) {
      const f = item.type.startsWith('image/') ? item.getAsFile() : null;
      if (f) await this.addImage(f);
    }
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();
    for (const f of Array.from(event.dataTransfer?.files ?? [])) {
      if (f.type.startsWith('image/')) await this.addImage(f);
    }
  }

  async onImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    for (const f of Array.from(input.files ?? [])) await this.addImage(f);
    input.value = '';
  }

  removeImage(index: number) {
    this.state().images.update((imgs) => imgs.filter((_, i) => i !== index));
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.state().file.set({ base64Data: reader.result as string, contentType: f.type || 'application/pdf', filename: f.name });
      this.clear(this.ids.file);
    };
    reader.readAsDataURL(f);
    input.value = '';
  }

  private async addImage(f: File) {
    const processed = await downscaleImage(f);
    this.state().images.update((imgs) => [...imgs.slice(0, 7), processed]);
    this.clear(this.ids.photo);
  }
}
