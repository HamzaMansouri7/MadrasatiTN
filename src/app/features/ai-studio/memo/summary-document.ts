import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { LanguageService } from '@core/services/language.service';
import { MemoDoc, SummarySection } from '@core/models/memo.model';
import { SUMMARY_MAX_IMAGES, summarySections } from '@core/utils/summary.util';

/**
 * Revision document (ملف مراجعة): header then sections top to bottom, like a short report.
 * Practice answers print only on the teacher copy. Section tools are screen-only.
 */
@Component({
  selector: 'app-summary-document',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .sd-page {
      background: #ffffff;
      border: 1px solid #E7DFCF;
      border-radius: 8px;
      padding: 2.5rem 2.75rem;
      max-width: 210mm;
      margin-inline: auto;
      color: #14251D;
      line-height: 1.75;
    }
    .sd-section { break-inside: avoid-page; padding-top: 1.25rem; margin-top: 1.25rem; border-top: 1px solid #E7DFCF; }
    .sd-section:first-of-type { border-top: 0; margin-top: 0.5rem; }
    .sd-num {
      inline-size: 1.75rem;
      block-size: 1.75rem;
      border-radius: 999px;
      background: #2D6A4F;
      color: #FBF8F1;
      font-size: 0.8rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .sd-remember { background: #FBF8F1; border: 1px solid #E7DFCF; border-inline-start: 4px solid #8A5A00; border-radius: 6px; padding: 1rem 1.25rem; }
    .sd-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .sd-table th { background: #F2ECDE; font-weight: 700; }
    .sd-table th, .sd-table td { border: 1px solid #E7DFCF; padding: 0.45rem 0.6rem; text-align: start; vertical-align: top; }
    .sd-lines { border-bottom: 1px dotted #B9AE97; block-size: 1.75rem; }
    .sd-figure img { max-block-size: 260px; inline-size: auto; max-inline-size: 100%; margin-inline: auto; border-radius: 6px; border: 1px solid #E7DFCF; }
    @media print {
      .sd-page { border: 0; border-radius: 0; padding: 0; max-width: none; }
      .sd-answers-pupil { display: none !important; }
    }
  `,
  template: `
    @let d = memo();
    @let fr = d.language === 'fr';
    <article class="sd-page" [attr.dir]="fr ? 'ltr' : 'rtl'" [attr.lang]="d.language">
      <header class="border-b-2 border-[#14251D] pb-4 mb-2">
        <p class="text-sm text-[#5B6B60] flex flex-wrap gap-x-3">
          <span>{{ lang.translateGrade(d.grade, d.language) }}</span>
          <span>{{ lang.translateSubject(d.subject, d.language) }}</span>
          @if (d.trimester) {
            <span>{{ lang.translateTrimester(d.trimester) }}</span>
          }
        </p>
        <h1 class="font-display text-2xl sm:text-3xl font-semibold mt-1">{{ d.title }}</h1>
        @if (d.subtitle) {
          <p class="text-[#4A5A50] mt-1">{{ d.subtitle }}</p>
        }
        @if (d.objective) {
          <p class="mt-3 text-sm bg-[#FBF8F1] border border-[#E7DFCF] rounded-md px-3 py-2">
            <span class="font-semibold">{{ fr ? 'Objectif : ' : 'الهدف : ' }}</span>{{ d.objective }}
          </p>
        }
      </header>

      @for (s of sections(); track $index; let i = $index) {
        <section class="sd-section">
          <div class="flex items-center gap-3 mb-2">
            <span class="sd-num" aria-hidden="true">{{ i + 1 }}</span>
            <h2 class="font-display text-lg sm:text-xl font-semibold flex-1">{{ s.heading || defaultHeading(s, fr) }}</h2>
            @if (editable()) {
              <div class="no-print flex items-center gap-1">
                <button
                  type="button"
                  (click)="regenerate.emit(i)"
                  [disabled]="busyIndex() > 0"
                  [attr.aria-label]="(fr ? 'Réécrire la section ' : 'إعادة كتابة القسم ') + (i + 1)"
                  class="min-h-11 min-w-11 rounded-md text-[#4A5A50] hover:bg-[#F2ECDE] inline-flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-default">
                  <span class="material-icons text-lg" [class.animate-spin]="busyIndex() === i + 1" aria-hidden="true">refresh</span>
                </button>
                @if (s.imageUrl) {
                  <button
                    type="button"
                    (click)="removePicture.emit(i)"
                    [attr.aria-label]="fr ? 'Retirer l’image' : 'حذف الصورة'"
                    class="min-h-11 min-w-11 rounded-md text-[#4A5A50] hover:bg-[#F2ECDE] inline-flex items-center justify-center cursor-pointer">
                    <span class="material-icons text-lg" aria-hidden="true">hide_image</span>
                  </button>
                } @else if (imageCount() < maxImages) {
                  <button
                    type="button"
                    (click)="addPicture.emit(i)"
                    [attr.aria-label]="fr ? 'Ajouter une image' : 'إضافة صورة'"
                    class="min-h-11 min-w-11 rounded-md text-[#4A5A50] hover:bg-[#F2ECDE] inline-flex items-center justify-center cursor-pointer">
                    <span class="material-icons text-lg" aria-hidden="true">add_photo_alternate</span>
                  </button>
                }
              </div>
            }
          </div>

          @if (s.text && s.type !== 'example') {
            <p class="whitespace-pre-line">{{ s.text }}</p>
          }

          @switch (s.type) {
            @case ('rule') {
              @if (s.items?.length) {
                <ul class="list-disc ps-6 space-y-1 mt-2">
                  @for (it of s.items; track $index) {
                    <li>{{ it }}</li>
                  }
                </ul>
              }
            }
            @case ('remember') {
              <div class="sd-remember">
                <ul class="list-disc ps-5 space-y-1">
                  @for (it of s.items ?? []; track $index) {
                    <li class="font-medium">{{ it }}</li>
                  }
                </ul>
              </div>
            }
            @case ('method') {
              <ol class="space-y-2.5">
                @for (st of s.steps ?? []; track $index) {
                  <li class="flex gap-3">
                    <span class="font-display font-semibold text-[#2D6A4F] shrink-0">{{ $index + 1 }}.</span>
                    <p><span class="font-semibold">{{ st.heading }}</span>@if (st.heading && st.body) {<span> : </span>}{{ st.body }}</p>
                  </li>
                }
              </ol>
            }
            @case ('example') {
              <div class="bg-[#FBF8F1] border border-[#E7DFCF] rounded-md px-4 py-3">
                <p class="font-semibold whitespace-pre-line">{{ s.text }}</p>
                @if (s.solution) {
                  <p class="mt-2 text-[#4A5A50] whitespace-pre-line"><span class="font-semibold text-[#2D6A4F]">{{ fr ? 'Solution : ' : 'الحلّ : ' }}</span>{{ s.solution }}</p>
                }
              </div>
            }
            @case ('table') {
              @if (s.table; as t) {
                <div class="overflow-x-auto">
                  <table class="sd-table">
                    <thead>
                      <tr>
                        @for (h of t.headers; track $index) {
                          <th scope="col">{{ h }}</th>
                        }
                      </tr>
                    </thead>
                    <tbody>
                      @for (r of t.rows; track $index) {
                        <tr>
                          <th scope="row">{{ r.label }}</th>
                          @for (c of r.cells; track $index) {
                            <td>{{ c }}</td>
                          }
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            }
            @case ('conjugation') {
              @if (s.conjugation; as c) {
                <p class="font-semibold mb-2">{{ c.verb }}@if (c.tense) {<span class="text-[#5B6B60] font-normal"> — {{ c.tense }}</span>}</p>
                <table class="sd-table">
                  <tbody>
                    @for (r of c.rows; track $index) {
                      <tr>
                        <th scope="row" class="w-1/4">{{ r.pronoun }}</th>
                        <td class="font-semibold">{{ r.form }}</td>
                        <td class="text-[#4A5A50]">{{ r.example }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            }
            @case ('timeline') {
              <ol class="border-s-2 border-[#E7DFCF] ms-2 ps-5 space-y-3">
                @for (e of s.timeline ?? []; track $index) {
                  <li class="relative">
                    <span class="absolute -start-[1.65rem] top-2 w-3 h-3 rounded-full bg-[#2D6A4F]" aria-hidden="true"></span>
                    <p><span class="font-semibold text-[#2D6A4F]">{{ e.stepOrDate }}</span> <span class="font-semibold">{{ e.title }}</span></p>
                    <p class="text-[#4A5A50]">{{ e.description }}</p>
                  </li>
                }
              </ol>
            }
            @case ('practice') {
              <ol class="space-y-4">
                @for (ex of s.exercises ?? []; track $index) {
                  <li>
                    <p><span class="font-semibold">{{ $index + 1 }}.</span> {{ ex.question }}</p>
                    <div class="sd-lines" aria-hidden="true"></div>
                    <div class="sd-lines" aria-hidden="true"></div>
                  </li>
                }
              </ol>
              <div class="mt-5 text-sm bg-[#F2ECDE] rounded-md px-4 py-3" [class.sd-answers-pupil]="!teacherCopy()">
                <p class="font-semibold mb-1">{{ fr ? 'Réponses (copie de l’enseignant)' : 'الإجابات (نسخة المعلّم)' }}</p>
                <ol class="list-decimal ps-5 space-y-0.5">
                  @for (ex of s.exercises ?? []; track $index) {
                    <li>{{ ex.answer }}</li>
                  }
                </ol>
              </div>
            }
          }

          @if (s.imageUrl) {
            <figure class="sd-figure mt-3">
              <img [src]="s.imageUrl" [alt]="s.heading" />
            </figure>
          }
        </section>
      }

      <footer class="mt-8 pt-3 border-t border-[#E7DFCF] text-xs text-[#5B6B60] flex justify-between gap-3">
        <span>{{ author() }}</span>
        <span>Madrasati TN</span>
      </footer>
    </article>
  `,
})
export class SummaryDocumentComponent {
  readonly lang = inject(LanguageService);

  readonly memo = input.required<MemoDoc>();
  readonly author = input<string>('');
  /** Shows the section tools (rewrite, picture). */
  readonly editable = input<boolean>(false);
  /** 1-based index of the section being rewritten, 0 = none. */
  readonly busyIndex = input<number>(0);
  /** Teacher copy: practice answers also print. */
  readonly teacherCopy = input<boolean>(false);

  readonly regenerate = output<number>();
  readonly addPicture = output<number>();
  readonly removePicture = output<number>();

  readonly maxImages = SUMMARY_MAX_IMAGES;
  readonly sections = computed<SummarySection[]>(() => summarySections(this.memo()));
  readonly imageCount = computed(() => this.sections().filter((s) => s.imageUrl).length);

  defaultHeading(s: SummarySection, fr: boolean): string {
    const names: Record<SummarySection['type'], [string, string]> = {
      intro: ['Introduction', 'تمهيد'],
      rule: ['La règle', 'القاعدة'],
      method: ['La méthode', 'الطريقة'],
      example: ['Exemple', 'مثال'],
      table: ['Tableau', 'جدول'],
      conjugation: ['Conjugaison', 'التصريف'],
      timeline: ['Chronologie', 'التسلسل الزمني'],
      remember: ['Je retiens', 'أتذكّر'],
      practice: ['Je m’entraîne', 'أتمرّن'],
    };
    return names[s.type][fr ? 0 : 1];
  }
}
