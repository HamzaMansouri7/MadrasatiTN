import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { LanguageService } from '@core';

export interface ViewerImage {
  src: string;
  alt: string;
}

/**
 * Full-screen viewer for one infographic or the pages of a course deck.
 * Escape closes, arrow keys move (swapped in RTL), focus is trapped and restored.
 */
@Component({
  selector: 'app-p-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKey($event)' },
  template: `
    @if (open()) {
      <div
        class="parascolaire fixed inset-0 z-[60] flex flex-col bg-[#0E1530]/95"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="label()"
        (keydown.tab)="trap($event)">
        <div class="absolute inset-0" role="presentation" tabindex="-1" (click)="close()" (keydown.escape)="close()"></div>
        <div class="relative flex items-center justify-between gap-3 p-3 text-white pointer-events-none">
          <span class="text-[0.9375rem]" aria-live="polite">{{ index() + 1 }} / {{ images().length }}</span>
          <button
            #closeBtn
            type="button"
            class="p-btn p-btn-secondary !min-w-[44px] !px-3 pointer-events-auto"
            [attr.aria-label]="lang.tr('Fermer', 'إغلاق')"
            (click)="close()">
            <span class="material-icons" aria-hidden="true">close</span>
          </button>
        </div>
        <div class="relative flex-1 min-h-0 flex items-center justify-center gap-2 px-2 pb-3 pointer-events-none">
          @if (images().length > 1) {
            <button
              #prevBtn
              type="button"
              class="p-btn p-btn-secondary !px-2 shrink-0 disabled:opacity-40 pointer-events-auto"
              [attr.aria-label]="lang.tr('Page précédente', 'الصفحة السابقة')"
              [disabled]="index() === 0"
              (click)="go(-1)">
              <span class="material-icons" aria-hidden="true">{{ lang.isArabic() ? 'chevron_right' : 'chevron_left' }}</span>
            </button>
          }
          @if (images()[index()]; as img) {
            <img
              [src]="img.src"
              [alt]="img.alt"
              class="max-h-full max-w-full min-w-0 object-contain rounded-[4px] bg-white pointer-events-auto" />
          }
          @if (images().length > 1) {
            <button
              #nextBtn
              type="button"
              class="p-btn p-btn-secondary !px-2 shrink-0 disabled:opacity-40 pointer-events-auto"
              [attr.aria-label]="lang.tr('Page suivante', 'الصفحة التالية')"
              [disabled]="index() === images().length - 1"
              (click)="go(1)">
              <span class="material-icons" aria-hidden="true">{{ lang.isArabic() ? 'chevron_left' : 'chevron_right' }}</span>
            </button>
          }
        </div>
      </div>
    }
  `,
})
export class ViewerDialogComponent {
  readonly lang = inject(LanguageService);
  readonly open = model(false);
  readonly index = model(0);
  readonly images = input.required<ViewerImage[]>();
  readonly label = input.required<string>();

  private readonly closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');
  private opener: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.open()) {
        if (typeof document !== 'undefined') {
          this.opener = document.activeElement as HTMLElement | null;
        }
        queueMicrotask(() => this.closeBtn()?.nativeElement.focus());
      } else if (this.opener) {
        this.opener.focus();
        this.opener = null;
      }
    });
  }

  close(): void {
    this.open.set(false);
  }

  go(delta: number): void {
    const next = this.index() + delta;
    if (next >= 0 && next < this.images().length) this.index.set(next);
  }

  onKey(e: KeyboardEvent): void {
    if (!this.open()) return;
    if (e.key === 'Escape') {
      this.close();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const forward = (e.key === 'ArrowRight') !== this.lang.isArabic();
      this.go(forward ? 1 : -1);
      e.preventDefault();
    }
  }

  /** Keep Tab inside the dialog: it holds at most three buttons. */
  trap(e: Event): void {
    const root = (e.currentTarget as HTMLElement) ?? null;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled])'));
    if (nodes.length === 0) return;
    const ke = e as KeyboardEvent;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (ke.shiftKey && document.activeElement === first) {
      last.focus();
      ke.preventDefault();
    } else if (!ke.shiftKey && document.activeElement === last) {
      first.focus();
      ke.preventDefault();
    }
  }
}
