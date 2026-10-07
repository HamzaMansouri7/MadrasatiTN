import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { LanguageService, getPageNumbers, calculateTotalPages } from '@core';

export type PaginationAccent = 'blue' | 'green' | 'library';

/**
 * Reusable presentational pagination bar.
 * Supports 2-way binding via [(page)] or [page] + (pageChange).
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (total() > pageSize()) {
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t text-xs" [class]="borderClass()">
        <span class="text-[#627D98] font-medium">
          {{ lang.tr('Affichage de', 'عرض') }}
          <strong [class]="countBoldClass()">{{ startItem() }}</strong>
          -
          <strong [class]="countBoldClass()">{{ endItem() }}</strong>
          {{ lang.tr('sur', 'من أصل') }}
          <strong [class]="totalHighlightClass()">{{ total() }}</strong>
          {{ unitLabel() }}
        </span>

        <div class="flex items-center gap-1.5">
          <button
            type="button"
            (click)="goToPage(page() - 1)"
            [disabled]="page() <= 1"
            [class]="navBtnClass()"
            class="px-3 py-1.5 rounded-[8px] border disabled:opacity-30 disabled:cursor-not-allowed font-medium flex items-center gap-1 cursor-pointer transition-colors"
            [attr.aria-label]="lang.tr('Page précédente', 'الصفحة السابقة')">
            <span class="material-icons text-sm rtl:rotate-180">chevron_left</span>
            <span>{{ lang.tr('Précédent', 'السابق') }}</span>
          </button>

          <div class="flex items-center gap-1">
            @for (p of pageNumbers(); track p) {
              <button
                type="button"
                (click)="goToPage(p)"
                [class]="page() === p ? activeBtnClass() : inactiveBtnClass()"
                class="w-8 h-8 rounded-[8px] text-xs font-semibold flex items-center justify-center transition-all cursor-pointer">
                {{ p }}
              </button>
            }
          </div>

          <button
            type="button"
            (click)="goToPage(page() + 1)"
            [disabled]="page() >= totalPages()"
            [class]="navBtnClass()"
            class="px-3 py-1.5 rounded-[8px] border disabled:opacity-30 disabled:cursor-not-allowed font-medium flex items-center gap-1 cursor-pointer transition-colors"
            [attr.aria-label]="lang.tr('Page suivante', 'الصفحة التالية')">
            <span>{{ lang.tr('Suivant', 'التالي') }}</span>
            <span class="material-icons text-sm rtl:rotate-180">chevron_right</span>
          </button>
        </div>
      </div>
    }
  `,
})
export class PaginationComponent {
  readonly lang = inject(LanguageService);

  readonly total = input<number>(0);
  readonly pageSize = input<number>(12);
  readonly page = model<number>(1);
  readonly accent = input<PaginationAccent>('blue');
  readonly unit = input<string>('');

  readonly totalPages = computed(() => calculateTotalPages(this.total(), this.pageSize()));
  readonly startItem = computed(() => (Math.max(1, this.page()) - 1) * this.pageSize() + 1);
  readonly endItem = computed(() => Math.min(Math.max(1, this.page()) * this.pageSize(), this.total()));
  readonly pageNumbers = computed(() => getPageNumbers(this.totalPages(), this.page(), 5));

  readonly unitLabel = computed(() => this.unit() || this.lang.tr('documents', 'وثيقة'));

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages() && p !== this.page()) {
      this.page.set(p);
    }
  }

  borderClass(): string {
    switch (this.accent()) {
      case 'green':
      case 'library':
        return 'border-[#E7DFCF]';
      default:
        return 'border-[#E3ECF2]';
    }
  }

  countBoldClass(): string {
    switch (this.accent()) {
      case 'green':
      case 'library':
        return 'text-[#14251D]';
      default:
        return 'text-[#102A43]';
    }
  }

  totalHighlightClass(): string {
    switch (this.accent()) {
      case 'green':
        return 'text-[#2D6A4F]';
      case 'library':
        return 'text-[#1B4332]';
      default:
        return 'text-[#007CC2]';
    }
  }

  navBtnClass(): string {
    switch (this.accent()) {
      case 'green':
      case 'library':
        return 'border-[#E7DFCF] text-[#14251D] hover:bg-[#FBF8F1]';
      default:
        return 'border-[#E3ECF2] text-[#102A43] hover:bg-[#F7F9FB]';
    }
  }

  activeBtnClass(): string {
    switch (this.accent()) {
      case 'green':
        return 'bg-[#2D6A4F] text-[#FBF8F1] font-bold shadow-xs';
      case 'library':
        return 'bg-[#14251D] text-[#FBF8F1] font-bold shadow-xs';
      default:
        return 'bg-[#007CC2] text-white font-bold shadow-xs';
    }
  }

  inactiveBtnClass(): string {
    switch (this.accent()) {
      case 'green':
        return 'bg-white text-[#5B6B60] border border-[#E7DFCF] hover:border-[#2D6A4F]';
      case 'library':
        return 'bg-white text-[#5B6B60] border border-[#E7DFCF] hover:border-[#14251D]';
      default:
        return 'bg-white text-[#486581] border border-[#E3ECF2] hover:border-[#007CC2]';
    }
  }
}
