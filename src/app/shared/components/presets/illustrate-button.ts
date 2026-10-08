import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { LanguageService } from '@core';

/**
 * On-demand picture for one block of an AI Studio sheet. Shown only when the block has an
 * English imagePrompt and no image yet; screen only (hidden in print).
 */
@Component({
  selector: 'app-illustrate-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (prompt() && !imageUrl()) {
      <button
        type="button"
        (click)="pressed.emit()"
        [disabled]="busy() || disabled()"
        [attr.aria-label]="lang.tr('Illustrer ce bloc', 'رسم صورة لهذا الجزء')"
        class="no-print print:hidden inline-flex items-center gap-1 min-h-8 px-2.5 rounded-full text-[11px] font-semibold border border-[var(--ig-border)] bg-[var(--ig-card)] hover:bg-[var(--ig-hero)] cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-default"
        style="color: var(--ig-ink)">
        <span class="material-icons text-sm" [class.animate-spin]="busy()" aria-hidden="true">{{ busy() ? 'sync' : 'image' }}</span>
        {{ busy() ? lang.tr('Dessin…', 'جارٍ الرسم…') : lang.tr('Illustrer', 'رسم صورة') }}
      </button>
    }
  `,
})
export class IllustrateButtonComponent {
  readonly lang = inject(LanguageService);

  readonly prompt = input<string | undefined>(undefined);
  readonly imageUrl = input<string | undefined>(undefined);
  readonly busy = input(false);
  /** Another block is being drawn: one image at a time keeps the free quota safe. */
  readonly disabled = input(false);
  readonly pressed = output<void>();
}
