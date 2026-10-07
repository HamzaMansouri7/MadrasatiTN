import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService, Scene, SeriesAuthor, SeriesBible } from '@core';

@Component({
  selector: 'app-series-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div
      dir="rtl"
      class="series-panel-sheet w-full max-w-[800px] mx-auto bg-white rounded-[24px] print:rounded-none border border-[#E7DFCF] print:border-none p-6 sm:p-10 space-y-6 shadow-sm print:shadow-none min-h-[1050px] flex flex-col justify-between relative font-sans text-[#14251D]">
      
      <!-- Top Cartouche Header Strip -->
      <div class="space-y-4">
        <div class="border-b-2 border-[#14251D] pb-3.5 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-[#14251D] text-[#FBF8F1] font-display font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
              {{ formatNumber(scene().n) }}
            </span>
            <div>
              <p class="text-[11px] text-[#5B6B60] font-semibold">سلسلة تاريخية مصورة • {{ seriesTitle() }}</p>
              <h2 class="font-display font-bold text-lg sm:text-xl text-[#14251D] tracking-tight">
                {{ scene().title }}
              </h2>
            </div>
          </div>

          @if (scene().year) {
            <span class="bg-[#8A5A00]/10 text-[#8A5A00] font-mono font-bold text-xs px-3 py-1 rounded-full border border-[#8A5A00]/20">
              {{ scene().year }}
            </span>
          }
        </div>

        <!-- Central Illustration -->
        @if (scene().imageUrl) {
          <div class="w-full aspect-16/10 rounded-2xl overflow-hidden border border-[#E7DFCF] bg-[#FBF8F1] relative shadow-xs">
            <img [src]="scene().imageUrl" [alt]="scene().title" class="w-full h-full object-cover" />
            @if (scene().caption) {
              <div class="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs text-[#FBF8F1] text-[11px] px-4 py-1.5 text-center">
                {{ scene().caption }}
              </div>
            }
          </div>
        } @else {
          <!-- Illustration Placeholder / Pending Generation -->
          <div class="w-full aspect-16/10 rounded-2xl border-2 border-dashed border-[#E7DFCF] bg-[#FBF8F1] flex flex-col items-center justify-center text-center p-6 text-[#6B7A70] space-y-2">
            <span class="material-icons text-4xl text-[#BF5B34]" aria-hidden="true">auto_stories</span>
            <p class="font-semibold text-xs text-[#14251D]">{{ scene().event }}</p>
            <p class="text-[11px] max-w-md">{{ scene().imagePrompt }}</p>
          </div>
        }

        <!-- Text Prose Section (Real selectable RTL Arabic) -->
        <div class="bg-[#FBF8F1] rounded-2xl border border-[#E7DFCF] p-5 sm:p-6 space-y-3">
          <p class="text-sm sm:text-base leading-relaxed text-[#14251D] whitespace-pre-line font-medium text-justify">
            {{ scene().text }}
          </p>

          <!-- Roles / Characters in this Scene -->
          @if (scene().kind === 'roles' && bible()?.characters; as chars) {
            <div class="pt-3 border-t border-[#E7DFCF] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              @for (c of chars; track c.name) {
                <div class="bg-white p-2.5 rounded-xl border border-[#E7DFCF] flex items-center gap-2">
                  <span class="material-icons text-[#BF5B34] text-sm">person</span>
                  <div>
                    <span class="font-bold text-[#14251D]">{{ c.name }}</span>
                    <span class="text-[#5B6B60] text-[10px] block">{{ c.role }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Footer Attribution -->
      <div class="border-t border-[#14251D] pt-3 flex items-center justify-between text-xs text-[#5B6B60]">
        <div>
          @if (author()?.name) {
            <span>من إنجاز : </span>
            <strong class="text-[#14251D]">{{ author()?.name }}</strong>
            @if (author()?.school) {
              <span> ({{ author()?.school }})</span>
            }
          } @else {
            <span>منصة مدرستي تونس التعليمية</span>
          }
        </div>

        <div class="flex items-center gap-2 font-mono text-[10px]">
          <span>لوحة {{ scene().n }} من السلسلة</span>
          <span>• Madrasati TN</span>
        </div>
      </div>

    </div>
  `,
  styles: [`
    @media print {
      :host {
        display: block;
        page-break-after: always;
        break-after: page;
        width: 100%;
        background: white !important;
      }
      .series-panel-sheet {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        min-height: auto !important;
      }
    }
  `],
})
export class SeriesPanelComponent {
  readonly lang = inject(LanguageService);

  readonly scene = input.required<Scene>();
  readonly seriesTitle = input<string>('سلسلة تاريخية');
  readonly bible = input<SeriesBible | null>(null);
  readonly author = input<SeriesAuthor | null>(null);

  formatNumber(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }
}
