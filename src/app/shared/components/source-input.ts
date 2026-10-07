import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GradeLevel, LanguageService, PRIMARY_GRADES, PRIMARY_SUBJECTS, SourceInput, SubjectName, Trimester, TRIMESTERS, downscaleImage } from '@core';

@Component({
  selector: 'app-source-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="bg-white rounded-[24px] border border-[#E7DFCF] p-5 sm:p-7 space-y-6 shadow-sm">
      <!-- Tabs (Topic, Text, Photo, File) -->
      <div class="flex items-center gap-1.5 p-1 bg-[#FBF8F1] rounded-xl border border-[#E7DFCF] overflow-x-auto">
        <button
          type="button"
          (click)="setMode('topic')"
          [class]="mode() === 'topic' ? 'bg-[#2D6A4F] text-[#FBF8F1] shadow-xs' : 'text-[#5B6B60] hover:text-[#14251D] hover:bg-[#F2ECDE]'"
          class="flex-1 min-w-24 py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
          <span class="material-icons text-sm" aria-hidden="true">title</span>
          <span>{{ lang.tr('Sujet / Notions', 'موضوع / فكرة') }}</span>
        </button>

        <button
          type="button"
          (click)="setMode('text')"
          [class]="mode() === 'text' ? 'bg-[#2D6A4F] text-[#FBF8F1] shadow-xs' : 'text-[#5B6B60] hover:text-[#14251D] hover:bg-[#F2ECDE]'"
          class="flex-1 min-w-24 py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
          <span class="material-icons text-sm" aria-hidden="true">edit_note</span>
          <span>{{ lang.tr('Coller un texte', 'نص الدرس') }}</span>
        </button>

        <button
          type="button"
          (click)="setMode('photo')"
          [class]="mode() === 'photo' ? 'bg-[#2D6A4F] text-[#FBF8F1] shadow-xs' : 'text-[#5B6B60] hover:text-[#14251D] hover:bg-[#F2ECDE]'"
          class="flex-1 min-w-24 py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
          <span class="material-icons text-sm" aria-hidden="true">photo_camera</span>
          <span>{{ lang.tr('Photos / Manuel', 'صورة من كتاب') }}</span>
        </button>

        <button
          type="button"
          (click)="setMode('file')"
          [class]="mode() === 'file' ? 'bg-[#2D6A4F] text-[#FBF8F1] shadow-xs' : 'text-[#5B6B60] hover:text-[#14251D] hover:bg-[#F2ECDE]'"
          class="flex-1 min-w-24 py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
          <span class="material-icons text-sm" aria-hidden="true">upload_file</span>
          <span>{{ lang.tr('Fichier (PDF/Docx)', 'ملف وورد/PDF') }}</span>
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
            (input)="topic.set($any($event.target).value)"
            [placeholder]="lang.tr('Ex: La multiplication posée, التوسع في الجملة الفعلية...', 'مثال: التوسع في الجملة الفعلية، الدوران والتناظر، دورة الماء...')"
            class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3.5 py-3 text-sm text-[#14251D] placeholder-[#6B7A70] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]" />
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
            (input)="text.set($any($event.target).value)"
            [placeholder]="lang.tr('Collez ici le texte du cours, le paragraphe d’histoire ou les données de l’exercice...', 'انسخ والصق هنا نص الدرس كاملاً، الأحداث التاريخية، أو وضعية العمل...')"
            class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-3.5 text-sm text-[#14251D] placeholder-[#6B7A70] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F] leading-relaxed"></textarea>
        </div>
      }

      <!-- Mode 3: Photo -->
      @if (mode() === 'photo') {
        <div class="space-y-3">
          <label
            (dragover)="onDragOver($event)"
            (drop)="onPhotoDrop($event)"
            class="block bg-[#FBF8F1] rounded-2xl border-2 border-dashed border-[#E7DFCF] hover:border-[#2D6A4F] p-6 text-center cursor-pointer transition-colors">
            <input type="file" accept="image/*" multiple class="hidden" (change)="onPhotoSelect($event)" />
            <span class="material-icons text-4xl text-[#2D6A4F]" aria-hidden="true">add_a_photo</span>
            <p class="font-display font-semibold text-sm text-[#14251D] mt-2">
              {{ lang.tr('Prendre ou glisser une photo du manuel', 'التقط أو اسحب صورة من الكتاب أو كراس التلميذ') }}
            </p>
            <p class="text-[11px] text-[#6B7A70] mt-1">{{ lang.tr('Jusqu’à 8 photos (PNG, JPG, WebP)', 'حتى 8 صور واضحة') }}</p>
          </label>

          @if (images().length > 0) {
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              @for (img of images(); track $index) {
                <div class="relative group rounded-xl overflow-hidden border border-[#E7DFCF] aspect-4/3 bg-black/5">
                  <img [src]="img.base64Data" alt="Photo" class="w-full h-full object-cover" />
                  <button
                    type="button"
                    (click)="removeImage($index)"
                    class="absolute top-1.5 right-1.5 bg-black/70 hover:bg-[#C1121F] text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer transition-colors">
                    <span class="material-icons text-xs">close</span>
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
          <label class="block bg-[#FBF8F1] rounded-2xl border-2 border-dashed border-[#E7DFCF] hover:border-[#2D6A4F] p-6 text-center cursor-pointer transition-colors">
            <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" class="hidden" (change)="onFileSelect($event)" />
            <span class="material-icons text-4xl text-[#2D6A4F]" aria-hidden="true">upload_file</span>
            <p class="font-display font-semibold text-sm text-[#14251D] mt-2">
              {{ lang.tr('Sélectionner un fichier Word (.docx) ou PDF', 'اختر ملف وورد (.docx) أو PDF') }}
            </p>
            <p class="text-[11px] text-[#6B7A70] mt-1">{{ file()?.filename || lang.tr('Taille max 15 Mo', 'الحد الأقصى 15 ميغابايت') }}</p>
          </label>

          @if (file(); as f) {
            <div class="flex items-center justify-between p-3 bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl text-xs">
              <div class="flex items-center gap-2">
                <span class="material-icons text-[#2D6A4F]">description</span>
                <span class="font-semibold text-[#14251D]">{{ f.filename }}</span>
              </div>
              <button type="button" (click)="file.set(null)" class="text-[#6B7A70] hover:text-[#C1121F] cursor-pointer">
                <span class="material-icons text-sm">close</span>
              </button>
            </div>
          }
        </div>
      }

      <!-- Metadata Selector Strip -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#E7DFCF]">
        <!-- Grade -->
        <div>
          <label for="src-grade" class="block text-xs font-medium text-[#5B6B60] mb-1">{{ lang.t('filterGrade') }}</label>
          <select
            id="src-grade"
            [value]="grade()"
            (change)="grade.set($any($event.target).value)"
            class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 py-2.5 text-xs text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
            @for (g of grades; track g) {
              <option [value]="g">{{ lang.translateGrade(g) }}</option>
            }
          </select>
        </div>

        <!-- Subject -->
        <div>
          <label for="src-subject" class="block text-xs font-medium text-[#5B6B60] mb-1">{{ lang.t('filterSubject') }}</label>
          <select
            id="src-subject"
            [value]="subject()"
            (change)="subject.set($any($event.target).value)"
            class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 py-2.5 text-xs text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
            @for (s of subjects; track s) {
              <option [value]="s">{{ lang.translateSubject(s) }}</option>
            }
          </select>
        </div>

        <!-- Trimester -->
        <div>
          <label for="src-trimester" class="block text-xs font-medium text-[#5B6B60] mb-1">{{ lang.tr('Trimestre', 'الثلاثي') }}</label>
          <select
            id="src-trimester"
            [value]="trimester()"
            (change)="trimester.set($any($event.target).value)"
            class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 py-2.5 text-xs text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
            @for (tri of trimesters; track tri) {
              <option [value]="tri">{{ lang.tr(tri, tri === 'Trimestre 1' ? 'الثلاثي الأول' : tri === 'Trimestre 2' ? 'الثلاثي الثاني' : 'الثلاثي الثالث') }}</option>
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
            <option value="ar">العربية (Arabe standard)</option>
            <option value="fr">Français (Français)</option>
          </select>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="flex items-center justify-between pt-2">
        <p class="text-[11px] text-[#6B7A70]">
          {{ lang.tr('Conforme aux programmes officiels CNP', 'مطابق للبرامج الرسمية للمركز الوطني البيداغوجي') }}
        </p>

        <button
          type="button"
          (click)="submitForm()"
          [disabled]="!isValid()"
          class="bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-50 text-[#FBF8F1] font-semibold px-6 py-3 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-sm">
          <span class="material-icons text-sm" aria-hidden="true">auto_awesome</span>
          <span>{{ submitLabel() || lang.tr('Continuer la génération', 'متابعة المعالجة والإنشاء') }}</span>
        </button>
      </div>
    </div>
  `,
})
export class SourceInputComponent {
  readonly lang = inject(LanguageService);

  readonly initialInput = input<SourceInput | null>(null);
  readonly submitLabel = input<string>('');

  readonly submitSource = output<SourceInput>();

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
      }
    }
  }

  async onPhotoSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    for (const f of Array.from(input.files)) {
      const processed = await downscaleImage(f);
      this.images.update((list) => [...list.slice(0, 7), processed]);
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

  submitForm() {
    if (!this.isValid()) return;
    const source: SourceInput = {
      mode: this.mode(),
      topic: this.topic().trim() || undefined,
      text: this.text().trim() || undefined,
      images: this.images().length > 0 ? this.images() : undefined,
      file: this.file(),
      grade: this.grade(),
      subject: this.subject(),
      trimester: this.trimester(),
      language: this.language(),
    };
    this.submitSource.emit(source);
  }
}
