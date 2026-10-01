import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EducationStore, LanguageService } from '@core';

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    @if (store.toast(); as t) {
      <div
        class="fixed top-20 z-50 transition-all duration-300 pointer-events-auto"
        [class]="lang.isArabic() ? 'left-4 sm:left-6' : 'right-4 sm:right-6'"
        role="alert">
        <div
          class="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border text-sm max-w-md animate-fade-in"
          [class]="
            t.type === 'error'
              ? 'bg-[#491217]/95 text-white border-[#C1121F]/50 shadow-[0_10px_30px_-5px_rgba(193,18,31,0.4)]'
              : t.type === 'info'
              ? 'bg-[#0B2947]/95 text-white border-[#007CC2]/50 shadow-[0_10px_30px_-5px_rgba(0,124,194,0.4)]'
              : 'bg-[#14251D]/95 text-white border-[#2D6A4F]/50 shadow-[0_10px_30px_-5px_rgba(45,106,79,0.4)]'
          ">
          <span class="material-icons text-xl shrink-0" [class]="
            t.type === 'error' ? 'text-red-300' : t.type === 'info' ? 'text-blue-300' : 'text-emerald-300'
          ">
            {{ t.type === 'error' ? 'error' : t.type === 'info' ? 'info' : 'check_circle' }}
          </span>

          <p class="font-medium text-xs sm:text-sm leading-snug flex-1">{{ t.message }}</p>

          <button
            type="button"
            (click)="store.hideToast()"
            class="text-white/60 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Fermer">
            <span class="material-icons text-sm">close</span>
          </button>
        </div>
      </div>
    }
  `,
})
export class ToastComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
}
