import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { LanguageService } from '@core';

@Component({
  selector: 'app-ai-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div role="status" aria-live="polite" class="rounded-xl border border-[#E7DFCF] bg-[#FBF8F1] p-3.5 space-y-2">
        <div class="flex items-center gap-2.5 text-xs text-[#14251D] font-medium">
          <span class="material-icons animate-spin motion-reduce:animate-none text-sm text-[#2D6A4F]" aria-hidden="true">sync</span>
          <span>{{ label() || lang.tr('Génération en cours…', 'جارٍ الإنشاء بواسطة الذكاء الاصطناعي…') }}</span>
          <span class="text-[11px] text-[#5B6B60] font-mono">({{ elapsed() }}s)</span>
        </div>
        @if (elapsed() >= 5) {
          <p class="text-[11px] text-[#5B6B60] leading-snug">
            {{ lang.tr('Cette opération prend quelques secondes de plus (analyse approfondie)…', 'تستغرق هذه العملية بضع ثوان إضافية (تحليل دقيق ومطابقة المنهاج)…') }}
          </p>
        }
      </div>
    } @else if (error()) {
      <div role="alert" class="rounded-xl border border-[#BF5B34]/30 bg-[#BF5B34]/5 p-3.5 space-y-2.5">
        <div class="flex items-start gap-2 text-xs text-[#BF5B34]">
          <span class="material-icons text-sm shrink-0" aria-hidden="true">error_outline</span>
          <div class="space-y-1 grow">
            <p class="font-semibold">{{ lang.tr('Échec du traitement IA', 'تعذر إتمام طلب الذكاء الاصطناعي') }}</p>
            <p class="text-[#5B6B60] text-[11px] leading-relaxed">{{ error() }}</p>
          </div>
        </div>
        <div class="flex justify-end">
          <button
            type="button"
            (click)="retry.emit()"
            class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-3.5 min-h-11 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1">
            <span class="material-icons text-xs" aria-hidden="true">refresh</span>
            <span>{{ lang.tr('Réessayer', 'إعادة المحاولة') }}</span>
          </button>
        </div>
      </div>
    }
  `,
})
export class AiStatusComponent {
  readonly lang = inject(LanguageService);

  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly label = input<string>('');

  readonly retry = output<void>();

  readonly elapsed = signal<number>(0);

  constructor() {
    let timer: ReturnType<typeof setInterval> | null = null;
    effect((onCleanup) => {
      if (this.loading()) {
        this.elapsed.set(0);
        timer = setInterval(() => {
          this.elapsed.update((n) => n + 1);
        }, 1000);
      } else {
        if (timer) clearInterval(timer);
        this.elapsed.set(0);
      }
      onCleanup(() => {
        if (timer) clearInterval(timer);
      });
    });
  }
}
