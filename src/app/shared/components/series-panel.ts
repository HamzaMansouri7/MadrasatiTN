import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { LanguageService, Scene, SeriesAuthor, SeriesBible } from '@core';

@Component({
  selector: 'app-series-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      [attr.dir]="docLang() === 'ar' ? 'rtl' : 'ltr'"
      [attr.lang]="docLang()"
      class="print-sheet w-full max-w-[800px] mx-auto bg-white rounded-[28px] border border-[#E7DFCF] p-6 sm:p-10 space-y-6 shadow-sm min-h-[1050px] flex flex-col justify-between relative text-[#14251D]">

      <div class="space-y-4">
        <header class="border-b-2 border-[#14251D] pb-3.5 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-10 h-10 rounded-xl bg-[#14251D] text-[#FBF8F1] font-display font-semibold text-base flex items-center justify-center shrink-0">
              {{ formatNumber(scene().n) }}
            </span>
            <div class="min-w-0">
              <p class="text-xs text-[#5B6B60] font-semibold truncate">
                {{ seriesMode() === 'history' ? t('Série historique illustrée', 'سلسلة تاريخية مصورة') : t('قصة الدرس المصورة', 'قصة الدرس المصورة') }} · {{ seriesTitle() }}
              </p>
              <h2 class="font-display font-semibold text-lg sm:text-xl text-[#14251D] tracking-tight">{{ scene().title }}</h2>
            </div>
          </div>

          @if (seriesMode() === 'history' && scene().year) {
            <span class="bg-[#8A5A00]/10 text-[#8A5A00] font-mono font-semibold text-xs px-3 py-1 rounded-full border border-[#8A5A00]/20 shrink-0">
              {{ scene().year }}
            </span>
          }
        </header>

        <figure class="avoid-break space-y-2">
          @if (scene().imageUrl) {
            <div class="w-full aspect-16/10 rounded-2xl overflow-hidden border border-[#E7DFCF] bg-[#FBF8F1] relative">
              <img [src]="scene().imageUrl" [alt]="scene().caption || scene().title" class="w-full h-full object-cover" />

              @if (scene().speechBubble?.text) {
                <div class="absolute bottom-3 start-3 max-w-[85%] bg-white/95 backdrop-blur-sm rounded-2xl p-3 sm:p-3.5 shadow-md border border-[#14251D]/15 z-10 text-xs sm:text-sm text-[#14251D]">
                  @if (scene().speechBubble?.speaker) {
                    <div class="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-[#8A5A00]">
                      <span class="material-icons text-xs">record_voice_over</span>
                      <span>{{ scene().speechBubble?.speaker }}</span>
                    </div>
                  }
                  <p class="leading-relaxed font-semibold italic text-[#14251D]">« {{ scene().speechBubble?.text }} »</p>
                </div>
              }
            </div>
            @if (scene().caption) {
              <figcaption class="text-xs text-[#5B6B60] text-center">{{ scene().caption }}</figcaption>
            }
          } @else {
            <div class="w-full aspect-16/10 rounded-2xl border-2 border-dashed border-[#E7DFCF] bg-[#FBF8F1] flex flex-col items-center justify-center text-center p-6 text-[#5B6B60] space-y-2 print:hidden relative">
              <span class="material-icons text-4xl text-[#BF5B34]" aria-hidden="true">image</span>
              <p class="font-semibold text-xs text-[#14251D]">{{ scene().event }}</p>
              <p class="text-xs">{{ t('Illustration non générée', 'لم يتم إنشاء الصورة بعد') }}</p>

              @if (scene().speechBubble?.text) {
                <div class="mt-2 bg-white/80 rounded-xl p-2.5 border border-[#E7DFCF] text-xs text-[#14251D] max-w-[90%]">
                  <span class="font-bold text-[#8A5A00] block text-[11px]">{{ scene().speechBubble?.speaker || t('Dialogue', 'الحوار') }}:</span>
                  <span>« {{ scene().speechBubble?.text }} »</span>
                </div>
              }
            </div>
          }
        </figure>

        <div class="avoid-break bg-[#FBF8F1] rounded-2xl border border-[#E7DFCF] p-5 sm:p-6 space-y-3">
          <p class="text-base leading-loose text-[#14251D] whitespace-pre-line font-medium text-justify">{{ scene().text }}</p>

          @if (scene().kind === 'roles' && bible()?.characters; as chars) {
            <ul class="pt-3 border-t border-[#E7DFCF] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              @for (c of chars; track c.name) {
                <li class="bg-white p-2.5 rounded-xl border border-[#E7DFCF] flex items-center gap-2">
                  <span class="material-icons text-[#BF5B34] text-sm" aria-hidden="true">person</span>
                  <div>
                    <span class="font-semibold text-[#14251D]">{{ c.name }}</span>
                    <span class="text-[#5B6B60] block">{{ c.role }}</span>
                  </div>
                </li>
              }
            </ul>
          }
        </div>

        @if (scene().question) {
          <div class="avoid-break bg-white rounded-2xl border-2 border-dashed border-[#2D6A4F]/30 p-4 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 text-xs font-bold text-[#2D6A4F]">
                <span class="material-icons text-base">quiz</span>
                <span>{{ t('سؤال الاستيعاب والفهم', 'سؤال الاستيعاب والفهم') }}</span>
              </div>
              <span class="text-[11px] text-[#5B6B60] font-mono">#{{ scene().n }}</span>
            </div>
            <p class="text-sm font-semibold text-[#14251D] leading-relaxed">{{ scene().question }}</p>
            <div class="space-y-3 pt-2">
              <div class="border-b border-dashed border-[#B7C7BC] h-5"></div>
              <div class="border-b border-dashed border-[#B7C7BC] h-5"></div>
            </div>

            @if (showAnswer() && scene().answer) {
              <div class="mt-2 p-2.5 rounded-xl bg-[#2D6A4F]/10 border border-[#2D6A4F]/20 text-xs text-[#2D6A4F]">
                <strong class="font-bold block mb-0.5">{{ t('الإجابة النموذجية (دليل المعلم):', 'الإجابة النموذجية (دليل المعلم):') }}</strong>
                <span>{{ scene().answer }}</span>
              </div>
            }
          </div>
        }
      </div>

      <footer class="border-t border-[#14251D] pt-3 flex items-center justify-between gap-3 text-xs text-[#5B6B60]">
        <div>
          @if (author()?.name) {
            <span>{{ t('Réalisé par : ', 'من إنجاز : ') }}</span>
            <strong class="text-[#14251D]">{{ author()?.name }}</strong>
            @if (author()?.school) {
              <span> ({{ author()?.school }})</span>
            }
          } @else {
            <span>{{ t('Plateforme Madrasati TN', 'منصة مدرستي تونس') }}</span>
          }
        </div>
        <span class="font-mono">{{ scene().n }} / {{ total() }} · Madrasati TN</span>
      </footer>
    </article>
  `,
})
export class SeriesPanelComponent {
  readonly lang = inject(LanguageService);

  readonly scene = input.required<Scene>();
  readonly seriesTitle = input<string>('');
  readonly bible = input<SeriesBible | null>(null);
  readonly author = input<SeriesAuthor | null>(null);
  readonly docLang = input<'ar' | 'fr'>('ar');
  readonly total = input<number>(0);
  readonly seriesMode = input<'history' | 'story'>('story');
  readonly showAnswer = input<boolean>(false);

  t(fr: string, ar: string): string {
    return this.docLang() === 'ar' ? ar : fr;
  }

  formatNumber(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }
}
