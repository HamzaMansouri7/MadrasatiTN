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
              <p class="text-xs text-[#5B6B60] font-semibold truncate">{{ t('Série historique illustrée', 'سلسلة تاريخية مصورة') }} · {{ seriesTitle() }}</p>
              <h2 class="font-display font-semibold text-lg sm:text-xl text-[#14251D] tracking-tight">{{ scene().title }}</h2>
            </div>
          </div>

          @if (scene().year) {
            <span class="bg-[#8A5A00]/10 text-[#8A5A00] font-mono font-semibold text-xs px-3 py-1 rounded-full border border-[#8A5A00]/20 shrink-0">
              {{ scene().year }}
            </span>
          }
        </header>

        <figure class="avoid-break space-y-2">
          @if (scene().imageUrl) {
            <div class="w-full aspect-16/10 rounded-2xl overflow-hidden border border-[#E7DFCF] bg-[#FBF8F1]">
              <img [src]="scene().imageUrl" [alt]="scene().caption || scene().title" class="w-full h-full object-cover" />
            </div>
            @if (scene().caption) {
              <figcaption class="text-xs text-[#5B6B60] text-center">{{ scene().caption }}</figcaption>
            }
          } @else {
            <div class="w-full aspect-16/10 rounded-2xl border-2 border-dashed border-[#E7DFCF] bg-[#FBF8F1] flex flex-col items-center justify-center text-center p-6 text-[#5B6B60] space-y-2 print:hidden">
              <span class="material-icons text-4xl text-[#BF5B34]" aria-hidden="true">image</span>
              <p class="font-semibold text-xs text-[#14251D]">{{ scene().event }}</p>
              <p class="text-xs">{{ t('Illustration non générée', 'لم يتم إنشاء الصورة بعد') }}</p>
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

  t(fr: string, ar: string): string {
    return this.docLang() === 'ar' ? ar : fr;
  }

  formatNumber(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }
}
