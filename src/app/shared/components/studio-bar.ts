import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { LanguageService } from '@core';

/**
 * Dark studio bar shared by the generators (same structure as the editor and the AI Studio):
 * kind badge, title, status, the settings toggle and projected actions.
 */
@Component({
  selector: 'app-studio-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="no-print bg-[#14251D] text-[#FBF8F1] rounded-[28px] p-5">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1 bg-[#F2C14E] text-[#14251D] text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                <span class="material-icons text-xs" aria-hidden="true">{{ icon() }}</span>
                {{ badge() }}
              </span>
              @for (d of details(); track $index) {
                @if (d) {
                  <span class="text-xs text-[#B7C7BC] whitespace-nowrap">{{ d }}</span>
                }
              }
              @if (status()) {
                <span class="text-xs text-[#9DBBA8] inline-flex items-center gap-1.5 whitespace-nowrap" aria-live="polite">
                  <span class="w-1.5 h-1.5 rounded-full" [class]="busy() ? 'bg-[#F2C14E] animate-pulse' : 'bg-[#9DBBA8]'"></span>
                  {{ status() }}
                </span>
              }
            </div>
            <h1 dir="auto" class="font-display text-xl sm:text-2xl font-semibold mt-1 truncate max-w-[70vw] lg:max-w-xl">
              {{ heading() }}
            </h1>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          @if (showSettings()) {
            <button
              type="button"
              (click)="settingsToggle.emit()"
              [attr.aria-expanded]="settingsOpen()"
              [attr.aria-controls]="settingsId()"
              [class]="settingsOpen() ? 'bg-[#FBF8F1] text-[#14251D]' : 'bg-[#FBF8F1]/10 hover:bg-[#FBF8F1]/20 text-[#FBF8F1]'"
              class="border border-[#FBF8F1]/20 px-4 min-h-11 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors">
              <span class="material-icons text-base" aria-hidden="true">tune</span>
              {{ lang.tr('Réglages', 'الإعدادات') }}
            </button>
          }
          <ng-content />
        </div>
      </div>
    </div>
  `,
})
export class StudioBarComponent {
  readonly lang = inject(LanguageService);

  readonly badge = input.required<string>();
  readonly icon = input<string>('auto_awesome');
  readonly heading = input.required<string>();
  readonly details = input<(string | undefined)[]>([]);
  readonly status = input<string>('');
  readonly busy = input<boolean>(false);
  readonly showSettings = input<boolean>(true);
  readonly settingsOpen = input<boolean>(false);
  readonly settingsId = input<string>('studio-settings');
  readonly settingsToggle = output<void>();
}

/** Class string for secondary actions placed inside the studio bar. */
export const STUDIO_BAR_BTN =
  'bg-[#FBF8F1]/10 hover:bg-[#FBF8F1]/20 border border-[#FBF8F1]/20 text-[#FBF8F1] px-4 min-h-11 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-default';
