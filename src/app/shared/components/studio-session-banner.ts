import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { EducationStore, LanguageService, StudioSession } from '@core';

/**
 * Status strip shared by the creation tools: offline notice, running generation with cancel,
 * interrupted run, draft restore, classified error, undo of a regeneration and the guest reminder.
 * Everything it shows comes from the tool's StudioSession.
 */
@Component({
  selector: 'app-studio-session-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = session();
    <div class="no-print space-y-2 empty:hidden" aria-live="polite">
      @if (!s.online()) {
        <div class="flex items-start gap-2.5 rounded-xl border border-[#E7DFCF] bg-white px-4 py-3 text-sm text-[#14251D]">
          <span class="material-icons text-base text-[#8A5A00] mt-0.5" aria-hidden="true">wifi_off</span>
          <p class="leading-relaxed">{{ lang.tr('Pas de connexion. La génération reprendra quand Internet reviendra.', 'لا يوجد اتصال بالإنترنت. التوليد غير متاح حتى يعود الاتصال.') }}</p>
        </div>
      }

      @if (s.busy()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-[#14251D]/30 px-4">
          <div role="status" class="w-full max-w-sm rounded-2xl border border-[#E7DFCF] bg-white px-6 py-6 shadow-lg text-center space-y-4">
            <span class="material-icons text-4xl text-[#2D6A4F] animate-spin motion-reduce:animate-none" aria-hidden="true">sync</span>
            <p class="font-display text-lg font-semibold text-[#14251D]">{{ lang.tr('Génération…', 'جارٍ التوليد…') }}</p>
            @if (s.progress(); as p) {
              <p class="text-sm font-semibold text-[#2D6A4F]">{{ p }}</p>
            }
            <p class="text-xs text-[#5B6B60] tabular-nums">{{ lang.tr('Temps écoulé', 'الوقت المنقضي') }} : {{ elapsed() }} {{ lang.tr('s', 'ث') }}</p>
            <button type="button" (click)="s.cancel()" class="min-h-11 px-6 rounded-xl border border-[#E7DFCF] bg-white hover:bg-[#F2ECDE] text-sm font-semibold text-[#14251D] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
              {{ lang.tr('Annuler', 'إلغاء') }}
            </button>
          </div>
        </div>
      }

      @if (s.interrupted() && !s.busy()) {
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#F2C14E]/60 bg-[#F2C14E]/10 px-4 py-2.5">
          <p class="flex items-center gap-2.5 text-sm text-[#14251D]">
            <span class="material-icons text-base text-[#8A5A00]" aria-hidden="true">history</span>
            {{ lang.tr('La génération s’est arrêtée. Relancez-la.', 'توقف التوليد، أعد المحاولة.') }}
          </p>
          <div class="flex items-center gap-2">
            @if (s.canRetry) {
              <button type="button" (click)="s.retry()" [class]="primaryBtn">{{ lang.tr('Réessayer', 'إعادة المحاولة') }}</button>
            }
            <button type="button" (click)="s.dismissInterrupted()" [class]="ghostBtn">{{ lang.tr('Fermer', 'إغلاق') }}</button>
          </div>
        </div>
      }

      @if (s.draft() !== null && !s.busy()) {
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E7DFCF] bg-white px-4 py-2.5">
          <p class="flex items-center gap-2.5 text-sm text-[#14251D]">
            <span class="material-icons text-base text-[#2D6A4F]" aria-hidden="true">restore</span>
            {{ lang.tr('Un brouillon de votre dernière visite est disponible.', 'لديك مسودة من زيارتك السابقة.') }}
          </p>
          <div class="flex items-center gap-2">
            <button type="button" (click)="s.restoreDraft()" [class]="primaryBtn">{{ lang.tr('Restaurer le brouillon', 'استعادة المسودة') }}</button>
            <button type="button" (click)="s.dismissDraft()" [class]="ghostBtn">{{ lang.tr('Ignorer', 'تجاهل') }}</button>
          </div>
        </div>
      }

      @if (s.error(); as err) {
        <div role="alert" class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#BF5B34]/30 bg-[#FDF0ED] px-4 py-2.5">
          <p class="flex items-start gap-2.5 text-sm text-[#8F3F1F] font-medium">
            <span class="material-icons text-base mt-0.5" aria-hidden="true">{{ err.kind === 'offline' ? 'wifi_off' : err.kind === 'quota' ? 'lock_clock' : 'error_outline' }}</span>
            <span>{{ err.message }}</span>
          </p>
          <div class="flex items-center gap-2">
            @if (err.kind === 'quota') {
              <button type="button" (click)="signup()" [class]="primaryBtn">{{ lang.tr('Créer un compte gratuit', 'إنشاء حساب مجاني') }}</button>
            } @else if (s.canRetry) {
              <button type="button" (click)="s.retry()" [disabled]="!s.online()" [class]="primaryBtn">{{ lang.tr('Réessayer', 'إعادة المحاولة') }}</button>
            }
            <button type="button" (click)="s.clearError()" [attr.aria-label]="lang.tr('Fermer', 'إغلاق')" class="w-11 h-11 flex items-center justify-center rounded-xl text-[#8F3F1F] hover:bg-[#BF5B34]/10 cursor-pointer">
              <span class="material-icons text-base" aria-hidden="true">close</span>
            </button>
          </div>
        </div>
      }

      @if (s.previous() && !s.busy()) {
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E7DFCF] bg-white px-4 py-2.5">
          <p class="flex items-center gap-2.5 text-sm text-[#14251D]">
            <span class="material-icons text-base text-[#2D6A4F]" aria-hidden="true">published_with_changes</span>
            {{ lang.tr('Nouvelle version générée.', 'تم توليد نسخة جديدة.') }}
          </p>
          <div class="flex items-center gap-2">
            <button type="button" (click)="s.undo()" [class]="ghostBtn">
              <span class="material-icons text-base" aria-hidden="true">undo</span>
              {{ lang.tr('Annuler la modification', 'تراجع') }}
            </button>
            <button type="button" (click)="s.dismissUndo()" [attr.aria-label]="lang.tr('Garder la nouvelle version', 'الإبقاء على النسخة الجديدة')" class="w-11 h-11 flex items-center justify-center rounded-xl text-[#5B6B60] hover:bg-[#F2ECDE] cursor-pointer">
              <span class="material-icons text-base" aria-hidden="true">close</span>
            </button>
          </div>
        </div>
      }

      @if (s.guestReminder()) {
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E7DFCF] bg-white px-4 py-2.5">
          <p class="flex items-center gap-2.5 text-sm text-[#5B6B60]">
            <span class="material-icons text-base text-[#2D6A4F]" aria-hidden="true">cloud_off</span>
            {{ lang.tr('Votre travail reste sur cet appareil. Un compte gratuit le garde en sécurité.', 'عملك محفوظ على هذا الجهاز فقط. أنشئ حسابًا مجانيًا حتى لا يضيع.') }}
          </p>
          <div class="flex items-center gap-2">
            <button type="button" (click)="signup()" [class]="ghostBtn">{{ lang.tr('Créer un compte gratuit', 'إنشاء حساب مجاني') }}</button>
            <button type="button" (click)="s.dismissReminder()" [attr.aria-label]="lang.tr('Plus tard', 'لاحقًا')" class="w-11 h-11 flex items-center justify-center rounded-xl text-[#5B6B60] hover:bg-[#F2ECDE] cursor-pointer">
              <span class="material-icons text-base" aria-hidden="true">close</span>
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class StudioSessionBannerComponent {
  readonly lang = inject(LanguageService);
  private readonly store = inject(EducationStore);

  readonly session = input.required<StudioSession<unknown>>();

  readonly primaryBtn =
    'min-h-11 px-4 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]';
  readonly ghostBtn =
    'min-h-11 px-4 rounded-xl border border-[#E7DFCF] bg-white hover:bg-[#F2ECDE] text-sm font-semibold text-[#14251D] cursor-pointer transition-colors inline-flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#2D6A4F]';

  readonly elapsed = signal(0);

  constructor() {
    effect((onCleanup) => {
      const started = this.session().startedAt();
      this.elapsed.set(0);
      if (!started || typeof window === 'undefined') return;
      const timer = setInterval(() => this.elapsed.set(Math.round((Date.now() - started) / 1000)), 1000);
      onCleanup(() => clearInterval(timer));
    });
  }

  signup() {
    this.store.openSignupModal('teacher');
  }
}
