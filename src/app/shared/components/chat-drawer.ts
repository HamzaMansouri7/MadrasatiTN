import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ChatService, LanguageService } from '@core';

/**
 * The one and only chat surface: a global drawer mounted in app.html, outside the router outlet,
 * so it persists across navigation. A fixed launcher opens it; features call `chat.openChat()`.
 * Side panel on desktop, full-height bottom sheet on phones. Cartouche palette, FR/AR, OnPush.
 */
@Component({
  selector: 'app-chat-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <!-- Launcher -->
    @if (!chat.open()) {
      <button
        type="button"
        (click)="chat.toggle()"
        [attr.aria-label]="lang.tr('Ouvrir l’assistant', 'افتح المساعد')"
        class="no-print fixed bottom-5 end-5 z-40 flex items-center gap-2 h-14 ps-4 pe-5 rounded-full bg-[#2D6A4F] text-[#FBF8F1] shadow-lg hover:bg-[#1B4332] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]">
        <span class="material-icons">forum</span>
        <span class="text-sm font-semibold">{{ lang.tr('Assistant', 'المساعد') }}</span>
      </button>
    }

    <!-- Drawer -->
    @if (chat.open()) {
      <div class="no-print fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" [attr.dir]="lang.dir()">
        <button type="button" [attr.aria-label]="lang.tr('Fermer', 'إغلاق')" (click)="chat.closeChat()" class="absolute inset-0 bg-[#14251D]/30"></button>

        <section class="relative w-full sm:max-w-[400px] h-full bg-[#FBF8F1] border-s border-[#E7DFCF] shadow-xl flex flex-col">
          <!-- Header -->
          <header class="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-[#E7DFCF] bg-white">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-9 h-9 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center shrink-0">
                <span class="material-icons text-xl">forum</span>
              </span>
              <div class="min-w-0">
                <p class="font-display font-semibold text-sm text-[#14251D] truncate">{{ lang.tr('Assistant Madrasati', 'مساعد مدرستي') }}</p>
                <p class="text-xs text-[#5B6B60]">
                  {{ chat.mode() === 'teacher' ? lang.tr('Mode enseignant', 'وضع المعلّم') : lang.tr('Mode parent', 'وضع الولي') }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              @if (thread().length > 0) {
                <button type="button" (click)="chat.reset()" [attr.aria-label]="lang.tr('Effacer la conversation', 'مسح المحادثة')" class="w-10 h-10 rounded-xl text-[#5B6B60] hover:bg-[#F2ECDE] flex items-center justify-center cursor-pointer">
                  <span class="material-icons text-base">delete_sweep</span>
                </button>
              }
              <button type="button" (click)="chat.closeChat()" [attr.aria-label]="lang.tr('Fermer', 'إغلاق')" class="w-10 h-10 rounded-xl text-[#14251D] hover:bg-[#F2ECDE] flex items-center justify-center cursor-pointer">
                <span class="material-icons">close</span>
              </button>
            </div>
          </header>

          <!-- Messages -->
          <div #scroll class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            @if (thread().length === 0) {
              <div class="text-center space-y-4 py-8">
                <span class="material-icons text-4xl text-[#2D6A4F]">forum</span>
                <p class="font-display font-semibold text-[#14251D] text-sm">{{ lang.tr('Pose ta question sur une leçon, un exercice ou une révision.', 'اسأل عن أي درس أو تمرين أو مراجعة.') }}</p>
                <div class="flex flex-wrap justify-center gap-2">
                  @for (s of starters(); track s) {
                    <button type="button" (click)="chat.send(s)" class="px-3 py-1.5 rounded-full border border-[#E7DFCF] bg-white text-xs font-semibold text-[#14251D] hover:bg-[#F2ECDE] cursor-pointer">{{ s }}</button>
                  }
                </div>
              </div>
            }

            @for (m of thread(); track m.id) {
              @if (m.sender === 'user') {
                <div class="flex justify-end">
                  <p class="max-w-[85%] rounded-2xl rounded-ee-sm bg-[#2D6A4F] text-[#FBF8F1] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line">{{ m.text }}</p>
                </div>
              } @else {
                <div class="flex flex-col items-start gap-2 max-w-[90%]">
                  <div class="rounded-2xl rounded-es-sm bg-white border border-[#E7DFCF] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line"
                       [style.color]="m.error ? '#8F3F1F' : '#14251D'">
                    @if (m.pending) {
                      <span class="inline-flex items-center gap-2 text-[#5B6B60]">
                        <span class="material-icons text-base animate-spin motion-reduce:animate-none">sync</span>
                        {{ lang.tr('Je cherche…', 'جارٍ البحث…') }}
                      </span>
                    } @else {
                      {{ m.text }}
                    }
                  </div>

                  @if (m.action; as a) {
                    <a [routerLink]="a.route" [queryParams]="a.queryParams" (click)="chat.closeChat()"
                       class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2D6A4F] text-[#FBF8F1] text-xs font-semibold hover:bg-[#1B4332] cursor-pointer">
                      <span class="material-icons text-sm">auto_awesome</span>
                      {{ a.label }}
                    </a>
                  }

                  @if (m.sources?.length) {
                    <div class="flex flex-wrap gap-1.5">
                      @for (src of m.sources; track src.title) {
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F2ECDE] border border-[#E7DFCF] text-[11px] text-[#5B6B60]">
                          <span class="material-icons text-xs text-[#2D6A4F]">menu_book</span>
                          {{ src.title }}
                        </span>
                      }
                    </div>
                  }

                  @if (m.followUp) {
                    <button type="button" (click)="chat.send(m.followUp!)" class="text-start text-xs text-[#2D6A4F] font-semibold hover:underline cursor-pointer">
                      ↳ {{ m.followUp }}
                    </button>
                  }
                </div>
              }
            }
          </div>

          <!-- Composer -->
          <form (submit)="submit($event)" class="shrink-0 border-t border-[#E7DFCF] bg-white p-3 flex items-end gap-2">
            <textarea
              [value]="draft()"
              (input)="draft.set($any($event.target).value)"
              (keydown)="onKey($event)"
              rows="1"
              [attr.placeholder]="lang.tr('Écris ton message…', 'اكتب رسالتك…')"
              class="flex-1 resize-none max-h-28 bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 py-2.5 text-sm text-[#14251D] outline-none focus:border-[#2D6A4F]"></textarea>
            <button
              type="submit"
              [disabled]="!draft().trim() || chat.pending()"
              [attr.aria-label]="lang.tr('Envoyer', 'إرسال')"
              class="w-11 h-11 shrink-0 rounded-xl bg-[#2D6A4F] text-[#FBF8F1] flex items-center justify-center hover:bg-[#1B4332] disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors">
              <span class="material-icons text-xl rtl:-scale-x-100">send</span>
            </button>
          </form>
        </section>
      </div>
    }
  `,
})
export class ChatDrawerComponent {
  readonly chat = inject(ChatService);
  readonly lang = inject(LanguageService);
  private readonly router = inject(Router);

  readonly thread = this.chat.thread;
  readonly draft = signal('');

  private readonly scrollEl = viewChild<ElementRef<HTMLDivElement>>('scroll');

  readonly starters = () =>
    this.chat.mode() === 'teacher'
      ? [
          this.lang.tr('Crée une série d’exercices', 'أنشئ سلسلة تمارين'),
          this.lang.tr('Explique ce chapitre', 'اشرح هذا الدرس'),
        ]
      : [
          this.lang.tr('Aide mon enfant en maths', 'ساعد ابني في الرياضيات'),
          this.lang.tr('Explique simplement', 'اشرح ببساطة'),
        ];

  constructor() {
    // Keep the view pinned to the newest message as the thread grows or the drawer opens.
    effect(() => {
      this.thread();
      this.chat.open();
      if (typeof window !== 'undefined') setTimeout(() => this.scrollToEnd(), 0);
    });
  }

  private scrollToEnd(): void {
    const el = this.scrollEl()?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  onKey(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.doSend();
    }
  }

  submit(e: Event): void {
    e.preventDefault();
    this.doSend();
  }

  private doSend(): void {
    const text = this.draft().trim();
    if (!text || this.chat.pending()) return;
    this.draft.set('');
    void this.chat.send(text);
  }
}
