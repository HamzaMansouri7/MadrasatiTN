import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Course, LanguageService } from '@core';
import { ShareButtonComponent } from './share-button';

export type DocCardAccent = 'blue' | 'green' | 'library';

@Component({
  selector: 'app-doc-card',
  standalone: true,
  imports: [ShareButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="containerClasses()">
      <div class="space-y-2">
        @if (course().imageUrls; as imgs) {
          @if (imgs.length > 0) {
            <button
              type="button"
              (click)="preview.emit(course())"
              class="block w-full relative rounded-[12px] overflow-hidden border group cursor-pointer mb-1"
              [class]="borderClass()"
              [title]="lang.tr('Voir & imprimer', 'عرض وطباعة')">
              <img
                [src]="imgs[0]"
                [alt]="course().title"
                loading="lazy"
                class="w-full h-40 object-cover object-top transition-transform group-hover:scale-[1.03]" />
              @if (imgs.length > 1) {
                <span class="absolute top-2 right-2 bg-[#0B2947]/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span class="material-icons text-[11px]" aria-hidden="true">collections</span>{{ imgs.length }}
                </span>
              }
              @if (course().hasCorrection) {
                <span class="absolute top-2 left-2 bg-[#23845B] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  {{ lang.tr('Corrigé', 'إصلاح') }}
                </span>
              }
            </button>
          }
        }

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span [class]="subjectBadgeClass()">
              {{ lang.translateSubject(course().subject) }}
            </span>
            @if (course().grade) {
              <span [class]="gradeBadgeClass()">
                {{ lang.translateGrade(course().grade) }}
              </span>
            }
          </div>
          @if (course().createdAt) {
            <span [class]="metaTextClass()">{{ course().createdAt }}</span>
          }
        </div>

        <h4 [class]="headingClass()">{{ course().title }}</h4>
        @if (course().theme) {
          <span class="inline-block bg-[#8A5A00]/10 text-[#8A5A00] text-[10px] font-semibold px-2 py-0.5 rounded-full">{{ course().theme }}</span>
        }
        <p [class]="summaryClass()">{{ course().summary }}</p>

        @if (course().pdfUrl && accent() !== 'blue') {
          <div class="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md border" [class]="pdfBadgeClass()">
            <span class="material-icons text-xs" aria-hidden="true">picture_as_pdf</span>
            <span>{{ lang.tr('Fichier VPS / Document joint', 'ملف مرفق على الخادم') }}</span>
          </div>
        }
      </div>

      <div class="pt-3 border-t flex items-center justify-between gap-2" [class]="borderClass()">
        <div class="flex items-center gap-1.5 flex-wrap">
          @if (course().pdfUrl && accent() === 'blue') {
            <a
              [href]="course().pdfUrl"
              target="_blank"
              rel="noopener"
              download
              class="bg-[#23845B] hover:bg-[#1C6949] text-white font-bold px-2.5 py-1.5 rounded-[8px] text-xs flex items-center gap-1 shadow-xs transition-colors">
              <span class="material-icons text-xs" aria-hidden="true">download</span>
              <span>{{ lang.tr('PDF', 'تحميل PDF') }}</span>
            </a>
          }
          <a
            [href]="'/solve?docId=' + course().id"
            class="bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold px-2.5 py-1.5 rounded-[8px] text-xs flex items-center gap-1 shadow-xs transition-colors">
            <span class="material-icons text-xs" aria-hidden="true">photo_camera</span>
            <span>{{ lang.tr('Résoudre', 'حلّ') }}</span>
          </a>
          <button
            type="button"
            (click)="print.emit(course())"
            [class]="printBtnClass()">
            <span class="material-icons text-xs" aria-hidden="true">print</span>
            {{ lang.t('printA4Btn') }}
          </button>
          <app-share-button
            [url]="'/discovery?doc=' + course().id"
            [title]="course().title"
            [text]="course().summary || course().title"
            variant="icon"
            [accent]="accent() === 'blue' ? 'blue' : 'green'" />
        </div>

        <button
          type="button"
          (click)="preview.emit(course())"
          [class]="previewBtnClass()">
          {{ lang.tr('Aperçu', 'معاينة') }} <span class="material-icons text-sm" [class.rtl:rotate-180]="lang.isArabic()" aria-hidden="true">arrow_forward</span>
        </button>
      </div>
    </div>
  `,
})
export class DocCardComponent {
  readonly lang = inject(LanguageService);

  readonly course = input.required<Course>();
  readonly accent = input<DocCardAccent>('blue');

  readonly print = output<Course>();
  readonly preview = output<Course>();
  readonly copyLink = output<Course>();

  protected readonly borderClass = computed(() =>
    this.accent() === 'blue' ? 'border-[#E3ECF2]' : 'border-[#E7DFCF]'
  );

  protected readonly containerClasses = computed(() => {
    return this.accent() === 'blue'
      ? 'bg-[#F7F9FB] rounded-[18px] p-5 border border-[#E3ECF2] flex flex-col justify-between space-y-3 hover:shadow-md transition-all'
      : 'bg-[#FBF8F1] rounded-[18px] p-5 border border-[#E7DFCF] flex flex-col justify-between space-y-3 hover:border-[#2D6A4F]/40 transition-colors';
  });

  protected readonly subjectBadgeClass = computed(() => {
    switch (this.accent()) {
      case 'green': return 'bg-[#2D6A4F]/10 text-[#2D6A4F] text-[10px] font-bold px-2.5 py-0.5 rounded-full';
      case 'library': return 'bg-[#1B4332]/10 text-[#1B4332] text-[10px] font-bold px-2.5 py-0.5 rounded-full';
      case 'blue':
      default: return 'bg-[#007CC2]/10 text-[#007CC2] text-[10px] font-bold px-2.5 py-0.5 rounded-full';
    }
  });

  protected readonly gradeBadgeClass = computed(() => {
    return this.accent() === 'blue'
      ? 'bg-[#E0AA32]/15 text-[#9E6A00] text-[10px] font-bold px-2 py-0.5 rounded-full'
      : 'bg-[#F2C14E]/15 text-[#8A5A00] text-[10px] font-bold px-2 py-0.5 rounded-full';
  });

  protected readonly metaTextClass = computed(() =>
    this.accent() === 'blue' ? 'text-[11px] text-[#627D98]' : 'text-[11px] text-[#5B6B60]'
  );

  protected readonly headingClass = computed(() => {
    return this.accent() === 'blue'
      ? 'font-display font-semibold text-[#102A43] text-sm leading-snug'
      : 'font-display font-semibold text-[#14251D] text-sm leading-snug';
  });

  protected readonly summaryClass = computed(() => {
    return this.accent() === 'blue'
      ? 'text-xs text-[#486581] line-clamp-2 leading-relaxed'
      : 'text-xs text-[#5B6B60] line-clamp-2 leading-relaxed';
  });

  protected readonly pdfBadgeClass = computed(() => {
    return this.accent() === 'blue'
      ? 'text-[#007CC2] bg-[#E8F5FC] border-[#007CC2]/20'
      : 'text-[#2D6A4F] bg-[#F2ECDE] border-[#2D6A4F]/20';
  });

  protected readonly printBtnClass = computed(() => {
    return this.accent() === 'blue'
      ? 'bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold px-2.5 py-1.5 rounded-[8px] text-xs flex items-center gap-1 cursor-pointer shadow-xs transition-colors'
      : 'bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-3 py-1.5 rounded-[8px] text-xs flex items-center gap-1 cursor-pointer shadow-xs transition-colors';
  });

  protected readonly copyBtnClass = computed(() => {
    return this.accent() === 'blue'
      ? 'bg-[#F7F9FB] hover:bg-[#E3ECF2] text-[#486581] font-semibold px-2.5 py-1.5 rounded-[8px] text-xs flex items-center gap-1 border border-[#E3ECF2] transition-colors cursor-pointer'
      : 'bg-[#FBF8F1] hover:bg-[#E7DFCF] text-[#5B6B60] font-semibold px-3 py-1.5 rounded-[8px] text-xs flex items-center gap-1 border border-[#E7DFCF] transition-colors cursor-pointer';
  });

  protected readonly previewBtnClass = computed(() => {
    return this.accent() === 'blue'
      ? 'text-xs font-semibold text-[#102A43] hover:text-[#007CC2] flex items-center gap-1 cursor-pointer shrink-0'
      : 'text-xs font-semibold text-[#14251D] hover:text-[#2D6A4F] flex items-center gap-1 cursor-pointer shrink-0';
  });
}
