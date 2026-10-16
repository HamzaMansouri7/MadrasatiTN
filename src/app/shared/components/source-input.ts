import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TopicPickerComponent } from './topic-picker';
import { CurriculumChapter, GradeLevel, LanguageService, chapterTitle, PRIMARY_GRADES, PRIMARY_SUBJECTS, SourceInput, SubjectName, Trimester, TRIMESTERS, downscaleImage } from '@core';

@Component({
  selector: 'app-source-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TopicPickerComponent],
  template: `
    <fieldset [disabled]="busy()" [attr.aria-busy]="busy()" class="@container bg-white rounded-[28px] border border-[#E7DFCF] p-5 sm:p-7 space-y-6 shadow-sm min-w-0">
      <!-- Tabs (Topic, Text, Photo, File) -->
      <div role="tablist" [attr.aria-label]="lang.tr('Source du contenu', 'مصدر المحتوى')" class="grid grid-cols-2 @xl:flex items-center gap-1.5 p-1 bg-[#FBF8F1] rounded-xl border border-[#E7DFCF]">
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="mode() === 'topic'"
          (click)="setMode('topic')"
          [class]="mode() === 'topic' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'text-[#5B6B60] hover:text-[#14251D] hover:bg-[#F2ECDE]'"
          class="flex-1 min-w-24 min-h-11 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
          <span class="material-icons text-sm" aria-hidden="true">title</span>
          <span>{{ lang.tr('Sujet / Notions', 'موضوع / فكرة') }}</span>
        </button>

        <button
          type="button"
          role="tab"
          [attr.aria-selected]="mode() === 'text'"
          (click)="setMode('text')"
          [class]="mode() === 'text' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'text-[#5B6B60] hover:text-[#14251D] hover:bg-[#F2ECDE]'"
          class="flex-1 min-w-24 min-h-11 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
          <span class="material-icons text-sm" aria-hidden="true">edit_note</span>
          <span>{{ lang.tr('Coller un texte', 'نص الدرس') }}</span>
        </button>

        <button
          type="button"
          role="tab"
          [attr.aria-selected]="mode() === 'photo'"
          (click)="setMode('photo')"
          [class]="mode() === 'photo' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'text-[#5B6B60] hover:text-[#14251D] hover:bg-[#F2ECDE]'"
          class="flex-1 min-w-24 min-h-11 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
          <span class="material-icons text-sm" aria-hidden="true">photo_camera</span>
          <span>{{ lang.tr('Photos / Manuel', 'صورة من كتاب') }}</span>
        </button>

        <button
          type="button"
          role="tab"
          [attr.aria-selected]="mode() === 'file'"
          (click)="setMode('file')"
          [class]="mode() === 'file' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'text-[#5B6B60] hover:text-[#14251D] hover:bg-[#F2ECDE]'"
          class="flex-1 min-w-24 min-h-11 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
          <span class="material-icons text-sm" aria-hidden="true">upload_file</span>
          <span>{{ lang.tr('Fichier PDF', 'ملف PDF') }}</span>
        </button>
      </div>

      <!-- Mode 1: Topic -->
      @if (mode() === 'topic') {
        <div class="space-y-1.5">
          <label for="src-topic" class="block text-xs font-semibold text-[#14251D]">
            {{ lang.tr('Titre ou notion à travailler', 'موضوع الدرس أو المفهوم البيداغوجي') }} *
          </label>
          <input
            id="src-topic"
            type="text"
            dir="auto"
            [value]="topic()"
            (input)="onTopicTyped($any($event.target).value)"
            [attr.aria-invalid]="!!fieldError('src-topic')"
            [attr.aria-describedby]="fieldError('src-topic') ? 'src-topic-error' : null"
            [placeholder]="lang.tr('Ex: La multiplication posée, التوسع في الجملة الفعلية...', 'مثال: التوسع في الجملة الفعلية، الدوران والتناظر، دورة الماء...')"
            class="w-full bg-[#FBF8F1] border border-[#E7DFCF] aria-invalid:border-[#BF5B34] rounded-xl px-3.5 py-3 text-sm text-[#14251D] placeholder-[#6B7A70] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]" />
          @if (fieldError('src-topic'); as msg) {
            <p id="src-topic-error" class="text-xs font-medium text-[#BF5B34]">{{ msg }}</p>
          }
        </div>
      }

      <!-- Mode 2: Text -->
      @if (mode() === 'text') {
        <div class="space-y-1.5">
          <label for="src-text" class="block text-xs font-semibold text-[#14251D]">
            {{ lang.tr('Contenu complet du cours ou document', 'نص المحتوى أو وثيقة العمل كاملة') }} *
          </label>
          <textarea
            id="src-text"
            rows="5"
            dir="auto"
            [value]="text()"
            (input)="text.set($any($event.target).value); clearError('src-text')"
            [attr.aria-invalid]="!!fieldError('src-text')"
            [attr.aria-describedby]="fieldError('src-text') ? 'src-text-error' : null"
            [placeholder]="lang.tr('Collez ici le texte du cours, le paragraphe d’histoire ou les données de l’exercice...', 'انسخ والصق هنا نص الدرس كاملاً، الأحداث التاريخية، أو وضعية العمل...')"
            class="w-full bg-[#FBF8F1] border border-[#E7DFCF] aria-invalid:border-[#BF5B34] rounded-xl p-3.5 text-sm text-[#14251D] placeholder-[#6B7A70] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F] leading-relaxed"></textarea>
          @if (fieldError('src-text'); as msg) {
            <p id="src-text-error" class="text-xs font-medium text-[#BF5B34]">{{ msg }}</p>
          }
        </div>
      }

      <!-- Mode 3: Photo -->
      @if (mode() === 'photo') {
        <div class="space-y-3">
          <label
            (dragover)="onDragOver($event)"
            (drop)="onPhotoDrop($event)"
            class="block bg-[#FBF8F1] rounded-2xl border-2 border-dashed border-[#E7DFCF] hover:border-[#2D6A4F] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#2D6A4F] p-6 text-center cursor-pointer transition-colors">
            <input id="src-photo" type="file" accept="image/*" multiple class="sr-only peer" [attr.aria-invalid]="!!fieldError('src-photo')"[attr.aria-label]="lang.tr('Ajouter des photos', 'إضافة صور')" (change)="onPhotoSelect($event)" />
            <span class="material-icons text-4xl text-[#2D6A4F]" aria-hidden="true">add_a_photo</span>
            <p class="font-display font-semibold text-sm text-[#14251D] mt-2">
              {{ lang.tr('Prendre ou glisser une photo du manuel', 'التقط أو اسحب صورة من الكتاب أو كراس التلميذ') }}
            </p>
            <p class="text-[11px] text-[#6B7A70] mt-1">{{ lang.tr('Jusqu’à 3 photos utilisées (PNG, JPG, WebP)', 'حتى 3 صور واضحة') }}</p>
          </label>
          @if (fieldError('src-photo'); as msg) {
            <p class="text-xs font-medium text-[#BF5B34]">{{ msg }}</p>
          }

          @if (images().length > 0) {
            <div class="grid grid-cols-2 @xl:grid-cols-4 gap-2.5 pt-1">
              @for (img of images(); track $index) {
                <div class="relative group rounded-xl overflow-hidden border border-[#E7DFCF] aspect-4/3 bg-black/5">
                  <img [src]="img.base64Data" [alt]="lang.tr('Photo importée', 'صورة مستوردة') + ' ' + ($index + 1)" class="w-full h-full object-cover" />
                  <button
                    type="button"
                    (click)="removeImage($index)"
                    [attr.aria-label]="lang.tr('Retirer la photo', 'حذف الصورة')"
                    class="absolute top-1 end-1 bg-[#14251D]/80 hover:bg-[#14251D] text-white rounded-full w-11 h-11 flex items-center justify-center cursor-pointer transition-colors">
                    <span class="material-icons text-sm" aria-hidden="true">close</span>
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Mode 4: File -->
      @if (mode() === 'file') {
        <div class="space-y-3">
          <label class="block bg-[#FBF8F1] rounded-2xl border-2 border-dashed border-[#E7DFCF] hover:border-[#2D6A4F] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#2D6A4F] p-6 text-center cursor-pointer transition-colors">
            <input id="src-file" type="file" accept=".pdf,application/pdf" class="sr-only peer" [attr.aria-invalid]="!!fieldError('src-file')"[attr.aria-label]="lang.tr('Choisir un fichier PDF', 'اختر ملف PDF')" (change)="onFileSelect($event)" />
            <span class="material-icons text-4xl text-[#2D6A4F]" aria-hidden="true">upload_file</span>
            <p class="font-display font-semibold text-sm text-[#14251D] mt-2">
              {{ lang.tr('Sélectionner un fichier PDF', 'اختر ملف PDF') }}
            </p>
            <p class="text-[11px] text-[#5B6B60] mt-1">{{ file()?.filename || lang.tr('Taille max 15 Mo', 'الحد الأقصى 15 ميغابايت') }}</p>
          </label>
          @if (fieldError('src-file'); as msg) {
            <p class="text-xs font-medium text-[#BF5B34]">{{ msg }}</p>
          }

          @if (file(); as f) {
            <div class="flex items-center justify-between p-3 bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl text-xs">
              <div class="flex items-center gap-2">
                <span class="material-icons text-[#2D6A4F]">description</span>
                <span class="font-semibold text-[#14251D]">{{ f.filename }}</span>
              </div>
              <button type="button" (click)="file.set(null)" [attr.aria-label]="lang.tr('Retirer le fichier', 'حذف الملف')" class="w-11 h-11 flex items-center justify-center text-[#5B6B60] hover:text-[#14251D] cursor-pointer">
                <span class="material-icons text-sm" aria-hidden="true">close</span>
              </button>
            </div>
          }
        </div>
      }

      <!-- Metadata Selector Strip -->
      <div class="grid grid-cols-1 @md:grid-cols-2 @4xl:grid-cols-4 gap-3 pt-2 border-t border-[#E7DFCF]">
        <!-- Grade -->
        <div>
          <label for="src-grade" class="block text-xs font-medium text-[#5B6B60] mb-1">{{ lang.t('filterGrade') }}</label>
          <select
            id="src-grade"
            [value]="grade()"
            (change)="grade.set($any($event.target).value); topicId.set(null)"
            class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 py-2.5 text-xs text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
            @for (g of grades; track g) {
              <option [value]="g" [selected]="g === grade()">{{ lang.translateGrade(g) }}</option>
            }
          </select>
        </div>

        <!-- Subject -->
        <div>
          <label for="src-subject" class="block text-xs font-medium text-[#5B6B60] mb-1">{{ lang.t('filterSubject') }}</label>
          <select
            id="src-subject"
            [value]="subject()"
            (change)="subject.set($any($event.target).value); topicId.set(null)"
            class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 py-2.5 text-xs text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
            @for (s of subjects; track s) {
              <option [value]="s" [selected]="s === subject()">{{ lang.translateSubject(s) }}</option>
            }
          </select>
        </div>

        <!-- Trimester -->
        <div>
          <label for="src-trimester" class="block text-xs font-medium text-[#5B6B60] mb-1">{{ lang.tr('Trimestre', 'الثلاثي') }}</label>
          <select
            id="src-trimester"
            [value]="trimester()"
            (change)="trimester.set($any($event.target).value); topicId.set(null)"
            class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 py-2.5 text-xs text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
            @for (tri of trimesters; track tri) {
              <option [value]="tri" [selected]="tri === trimester()">{{ lang.tr(tri, tri === 'Trimestre 1' ? 'الثلاثي الأول' : tri === 'Trimestre 2' ? 'الثلاثي الثاني' : 'الثلاثي الثالث') }}</option>
            }
          </select>
        </div>

        <!-- Language -->
        <div>
          <label for="src-lang" class="block text-xs font-medium text-[#5B6B60] mb-1">{{ lang.tr('Langue de sortie', 'لغة الإخراج') }}</label>
          <select
            id="src-lang"
            [value]="language()"
            (change)="language.set($any($event.target).value)"
            class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 py-2.5 text-xs text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
            <option value="ar" [selected]="language() === 'ar'">العربية (Arabe standard)</option>
            <option value="fr" [selected]="language() === 'fr'">Français (Français)</option>
          </select>
        </div>
      </div>

      @if (mode() === 'topic') {
        <app-topic-picker
          selectId="src-topic-picker"
          [grade]="grade()"
          [subject]="subject()"
          [trimester]="trimester()"
          [value]="topicId()"
          (topicChange)="onTopicPicked($event)" />
      }

      <!-- Action Footer -->
      <div class="flex items-center justify-between pt-2">
        <p class="text-[11px] text-[#6B7A70]">
          {{ lang.tr('Conforme aux programmes officiels CNP', 'مطابق للبرامج الرسمية للمركز الوطني البيداغوجي') }}
        </p>

        <button
          type="button"
          (click)="submitForm()"
          class="bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-70 disabled:cursor-default text-[#FBF8F1] font-semibold px-6 min-h-11 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-sm">
          @if (busy()) {
            <span class="material-icons text-sm animate-spin motion-reduce:animate-none" aria-hidden="true">sync</span>
            <span>{{ lang.tr('Génération…', 'جارٍ التوليد…') }}</span>
          } @else {
            <span class="material-icons text-sm" aria-hidden="true">auto_awesome</span>
            <span>{{ submitLabel() || lang.tr('Continuer la génération', 'متابعة المعالجة والإنشاء') }}</span>
          }
        </button>
      </div>
    </fieldset>
  `,
})
export class SourceInputComponent {
  readonly lang = inject(LanguageService);

  readonly initialInput = input<SourceInput | null>(null);
  readonly submitLabel = input<string>('');

  readonly submitSource = output<SourceInput>();
  /** Every edit, so the host can keep a local draft. Not emitted while the form is empty. */
  readonly draftChange = output<SourceInput>();
  readonly busy = input<boolean>(false);

  /** Missing required field per input id, shown under the field after a submit attempt. */
  private readonly errors = signal<Record<string, string>>({});

  readonly grades = PRIMARY_GRADES;
  readonly subjects = PRIMARY_SUBJECTS;
  readonly trimesters = TRIMESTERS;

  readonly mode = signal<'topic' | 'text' | 'photo' | 'file'>('topic');
  readonly topic = signal<string>('');
  readonly text = signal<string>('');
  readonly images = signal<{ base64Data: string; contentType: string }[]>([]);
  readonly file = signal<{ base64Data: string; contentType: string; filename: string } | null>(null);
  readonly grade = signal<GradeLevel | string>('4ème Année');
  readonly subject = signal<SubjectName | string>('Mathématiques');
  readonly trimester = signal<Trimester | string>('Trimestre 1');
  readonly language = signal<'ar' | 'fr'>('ar');
  readonly topicId = signal<string | null>(null);
  private pickedTitle = '';
  private baseline = '';

  constructor() {
    effect(() => {
      const init = this.initialInput();
      if (init) {
        if (init.mode) this.mode.set(init.mode);
        if (init.topic) this.topic.set(init.topic);
        if (init.topicId) {
          this.topicId.set(init.topicId);
          this.pickedTitle = init.topic ?? '';
        }
        if (init.text) this.text.set(init.text);
        if (init.images) this.images.set(init.images);
        if (init.file) this.file.set(init.file);
        if (init.grade) this.grade.set(init.grade);
        if (init.subject) this.subject.set(init.subject);
        if (init.trimester) this.trimester.set(init.trimester);
        if (init.language) this.language.set(init.language);
      }
      this.baseline = untracked(() => fingerprint(this.snapshot()));
    });

    effect(() => {
      const snapshot = this.snapshot();
      // A prefill (open sheet, restored draft) is not an edit; only changes after it count.
      if (hasContent(snapshot) && fingerprint(snapshot) !== this.baseline) {
        untracked(() => this.draftChange.emit(snapshot));
      }
    });
  }

  fieldError(id: string): string {
    return this.errors()[id] ?? '';
  }

  clearError(id: string) {
    if (!this.errors()[id]) return;
    this.errors.update((e) => {
      const next = { ...e };
      delete next[id];
      return next;
    });
  }

  onTopicPicked(ch: CurriculumChapter | null) {
    this.topicId.set(ch?.id ?? null);
    this.pickedTitle = ch ? chapterTitle(ch, this.lang.isArabic() ? 'ar' : 'fr') : '';
    if (ch) {
      this.topic.set(this.pickedTitle);
      this.clearError('src-topic');
    }
  }

  /** Typing over a picked chapter turns it back into a free topic. */
  onTopicTyped(value: string) {
    this.topic.set(value);
    this.clearError('src-topic');
    if (this.topicId() && value !== this.pickedTitle) this.topicId.set(null);
  }

  setMode(m: 'topic' | 'text' | 'photo' | 'file') {
    this.mode.set(m);
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
  }

  async onPhotoDrop(e: DragEvent) {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files) return;
    for (const f of Array.from(files)) {
      if (f.type.startsWith('image/')) {
        const processed = await downscaleImage(f);
        this.images.update((list) => [...list.slice(0, 7), processed]);
        this.clearError('src-photo');
      }
    }
  }

  async onPhotoSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    for (const f of Array.from(input.files)) {
      const processed = await downscaleImage(f);
      this.images.update((list) => [...list.slice(0, 7), processed]);
      this.clearError('src-photo');
    }
    input.value = '';
  }

  removeImage(index: number) {
    this.images.update((list) => list.filter((_, i) => i !== index));
  }

  async onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.file.set({
        base64Data: reader.result as string,
        contentType: f.type || 'application/pdf',
        filename: f.name,
      });
      this.clearError('src-file');
    };
    reader.readAsDataURL(f);
    input.value = '';
  }

  isValid(): boolean {
    if (this.mode() === 'topic') return !!this.topic().trim();
    if (this.mode() === 'text') return !!this.text().trim();
    if (this.mode() === 'photo') return this.images().length > 0;
    if (this.mode() === 'file') return !!this.file();
    return false;
  }

  /** Clickable even when incomplete: marks the missing field, says why and focuses it. */
  submitForm() {
    if (this.busy()) return;
    if (!this.isValid()) {
      const id = `src-${this.mode()}`;
      const messages: Record<string, string> = {
        'src-topic': this.lang.tr('Indiquez le sujet ou la notion.', 'اكتب موضوع الدرس أو المفهوم.'),
        'src-text': this.lang.tr('Collez le texte du cours.', 'الصق نص الدرس.'),
        'src-photo': this.lang.tr('Ajoutez au moins une photo.', 'أضف صورة واحدة على الأقل.'),
        'src-file': this.lang.tr('Choisissez un fichier PDF.', 'اختر ملف PDF.'),
      };
      this.errors.set({ [id]: messages[id] });
      if (typeof document !== 'undefined') setTimeout(() => document.getElementById(id)?.focus(), 0);
      return;
    }
    this.errors.set({});
    this.submitSource.emit(this.snapshot());
  }

  private snapshot(): SourceInput {
    const m = this.mode();
    return {
      mode: m,
      topic: m === 'topic' ? this.topic().trim() : undefined,
      topicId: m === 'topic' ? (this.topicId() ?? undefined) : undefined,
      text: m === 'text' ? this.text().trim() : undefined,
      images: m === 'photo' && this.images().length > 0 ? this.images() : undefined,
      file: m === 'file' ? this.file() : undefined,
      grade: this.grade(),
      subject: this.subject(),
      trimester: this.trimester(),
      language: this.language(),
    };
  }
}

function hasContent(s: SourceInput): boolean {
  return !!(s.topic || s.text || s.images?.length || s.file);
}

/** Cheap identity of a source: image and file data stand in by size, not content. */
function fingerprint(s: SourceInput): string {
  return JSON.stringify({
    ...s,
    images: s.images?.map((i) => i.base64Data.length),
    file: s.file ? [s.file.filename, s.file.base64Data.length] : undefined,
  });
}
