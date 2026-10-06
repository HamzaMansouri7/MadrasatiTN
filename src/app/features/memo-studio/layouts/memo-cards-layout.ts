import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemoDoc, EducationStore, LanguageService } from '../../../core';

@Component({
  selector: 'app-memo-cards-layout',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (memo; as m) {
      <div class="print-page w-full max-w-[210mm] mx-auto min-h-[297mm] p-6 bg-[#FBF8F1] text-[#14251D] border border-[#E7DFCF] rounded-2xl flex flex-col justify-between shadow-sm relative font-sans select-text">
        
        <!-- Top Title Header -->
        <header class="bg-[#14251D] text-[#FBF8F1] p-4 rounded-xl mb-4 flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 bg-[#2D6A4F] text-[#FBF8F1] text-[10px] font-semibold rounded">
                {{ m.grade }}
              </span>
              <span class="text-[#F2C14E] text-xs font-semibold">
                {{ m.subject }}
              </span>
            </div>
            <h1
              contenteditable="true"
              (blur)="onUpdateField('title', $event)"
              class="font-display text-2xl font-semibold tracking-tight text-[#FBF8F1] focus:outline-none focus:bg-[#1B4332] rounded px-1"
            >
              {{ m.title }}
            </h1>
            @if (m.subtitle) {
              <p
                contenteditable="true"
                (blur)="onUpdateField('subtitle', $event)"
                class="text-xs text-[#B7C7BC] italic mt-0.5 focus:outline-none focus:bg-[#1B4332] rounded px-1"
              >
                {{ m.subtitle }}
              </p>
            }
          </div>

          <div class="hidden sm:block text-end">
            <img src="/assets/memo/books.svg" alt="icon" class="w-8 h-8 opacity-80" />
          </div>
        </header>

        <!-- Main Cards Grid -->
        <div class="flex-1 space-y-4">
          
          <!-- Concept Cards Section -->
          <section class="space-y-2">
            <div class="flex items-center justify-between">
              <h2 class="font-display font-semibold text-sm text-[#1B4332] flex items-center gap-2">
                <img src="/assets/memo/star.svg" alt="icon" class="w-4 h-4" />
                {{ lang.tr('Règles et Notions Clés', 'القواعد والمفاهيم الأساسية') }}
              </h2>
              <div class="flex items-center gap-2">
                <button
                  (click)="store.addMemoCard()"
                  class="no-print text-xs text-[#2D6A4F] font-semibold hover:underline cursor-pointer"
                >
                  + {{ lang.tr('Ajouter', 'إضافة') }}
                </button>
                <button
                  (click)="store.regenerateMemoBlock('cards')"
                  class="no-print text-[10px] text-[#8A5A00] hover:underline cursor-pointer"
                >
                  {{ lang.tr('↻ Régénérer', '↻ إعادة توليد') }}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              @for (card of m.cards; track card.id) {
                <div class="p-3.5 bg-white rounded-xl border-t-4 border-t-[#2D6A4F] border border-[#E7DFCF] space-y-2 text-xs">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <img [src]="'/assets/memo/' + (card.icon || 'star') + '.svg'" alt="card icon" class="w-4 h-4" />
                      <h3
                        contenteditable="true"
                        (blur)="onUpdateCardLabel(card.id, $event)"
                        class="font-semibold text-xs text-[#14251D] focus:bg-[#F2ECDE] focus-visible:outline-2 focus-visible:outline-[#2D6A4F] rounded px-0.5"
                      >
                        {{ card.label }}
                      </h3>
                    </div>
                    <button
                      (click)="store.removeMemoCard(card.id)"
                      class="no-print text-[#C1121F] hover:opacity-75 text-xs font-semibold px-1"
                    >
                      ×
                    </button>
                  </div>

                  <p
                    contenteditable="true"
                    (blur)="onUpdateCardDef(card.id, $event)"
                    class="text-[#5B6B60] leading-relaxed focus:bg-[#F2ECDE] focus-visible:outline-2 focus-visible:outline-[#2D6A4F] rounded px-0.5"
                  >
                    {{ card.definition }}
                  </p>

                  <div class="pt-1 flex flex-wrap gap-1">
                    @for (ex of card.examples; track $index) {
                      <span class="px-2 py-0.5 bg-[#FBF8F1] border border-[#E7DFCF] text-[#2D6A4F] font-semibold rounded text-[10px]">
                        {{ ex }}
                      </span>
                    }
                  </div>
                </div>
              }
            </div>
          </section>

          <!-- Application & Steps Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <!-- Steps mini-column -->
            <section class="p-3 bg-white rounded-xl border border-[#E7DFCF] space-y-2">
              <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-1.5">
                <h3 class="font-display font-semibold text-xs text-[#8A5A00] flex items-center gap-1.5">
                  <img src="/assets/memo/magnifier.svg" alt="icon" class="w-3.5 h-3.5" />
                  {{ lang.tr('Méthode de travail', 'طريقة العمل') }}
                </h3>
                <button
                  (click)="store.regenerateMemoBlock('steps')"
                  class="no-print text-[10px] text-[#8A5A00] hover:underline cursor-pointer"
                >
                  {{ lang.tr('↻', '↻') }}
                </button>
              </div>
              <div class="space-y-1.5 text-xs">
                @for (step of m.steps; track step.n; let idx = $index) {
                  <div class="flex items-start gap-2">
                    <span class="w-4 h-4 rounded-full bg-[#8A5A00] text-[#FBF8F1] font-semibold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                      {{ step.n }}
                    </span>
                    <div>
                      <span class="font-semibold text-[#14251D] text-xs">{{ step.heading }} : </span>
                      <span class="text-[#5B6B60] text-[11px]">{{ step.body }}</span>
                    </div>
                  </div>
                }
              </div>
            </section>

            <!-- Analysed Example -->
            @if (m.example) {
              <section class="p-3 bg-white rounded-xl border border-[#E7DFCF] space-y-2">
                <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-1.5">
                  <h3 class="font-display font-semibold text-xs text-[#BF5B34] flex items-center gap-1.5">
                    <img src="/assets/memo/pencils.svg" alt="icon" class="w-3.5 h-3.5" />
                    {{ lang.tr('Exemple décortiqué', 'تطبيق محلل') }}
                  </h3>
                  <button
                    (click)="store.regenerateMemoBlock('example')"
                    class="no-print text-[10px] text-[#8A5A00] hover:underline cursor-pointer"
                  >
                    {{ lang.tr('↻', '↻') }}
                  </button>
                </div>
                <p class="font-semibold text-xs text-[#14251D] bg-[#FBF8F1] p-1.5 rounded border border-[#E7DFCF]">
                  "{{ m.example.sentence }}"
                </p>
                <div class="space-y-1 text-[11px]">
                  @for (item of m.example.analysis; track item.word) {
                    <div class="flex items-center justify-between py-0.5 border-b border-[#E7DFCF]/40">
                      <span class="font-semibold text-[#14251D]">{{ item.word }}</span>
                      <span class="text-[#5B6B60]">➔ {{ item.role }}</span>
                    </div>
                  }
                </div>
              </section>
            }
          </div>
        </div>

        <!-- Bottom Formula + Remember Bar -->
        <footer class="mt-4 pt-3 border-t border-[#E7DFCF] space-y-2">
          @if (m.formula) {
            <div class="p-2 bg-[#2D6A4F] text-[#FBF8F1] rounded-xl flex items-center justify-between gap-2 text-xs">
              <span class="font-semibold text-[#F2C14E] text-xs">{{ lang.tr('Synthèse :', 'خلاصة :') }}</span>
              <div class="flex items-center gap-1 font-semibold">
                @for (part of m.formula.parts; track $index) {
                  <span [class]="$index % 2 === 0 ? 'bg-[#1B4332] px-2 py-0.5 rounded text-[11px]' : 'text-[#F2C14E] text-[11px]'">
                    {{ part }}
                  </span>
                }
              </div>
              <span class="text-[10px] text-[#FBF8F1]/80 italic hidden md:inline">
                {{ m.formula.note }}
              </span>
            </div>
          }

          <div class="p-3 bg-white rounded-xl border border-[#E7DFCF] flex items-center justify-between text-xs">
            <div class="flex items-start gap-2">
              <img src="/assets/memo/apple.svg" alt="icon" class="w-4 h-4 text-[#C1121F] shrink-0 mt-0.5" />
              <div>
                <span class="font-semibold text-[#C1121F]">{{ lang.tr('À retenir absolument : ', 'للتثبيت والترسيخ : ') }}</span>
                <span class="text-[#5B6B60] text-[11px]">{{ m.remember.join(' • ') }}</span>
              </div>
            </div>
            <span class="text-[9px] font-semibold text-[#8A5A00] uppercase tracking-wider shrink-0 ms-2">
              Madrasati TN
            </span>
          </div>
        </footer>

      </div>
    }
  `,
})
export class MemoCardsLayoutComponent {
  @Input() memo: MemoDoc | null = null;
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);

  onUpdateField(field: keyof MemoDoc, event: FocusEvent) {
    const text = (event.target as HTMLElement).innerText.trim();
    this.store.updateMemoField(field, text as never);
  }

  onUpdateCardLabel(cardId: string, event: FocusEvent) {
    const text = (event.target as HTMLElement).innerText.trim();
    if (!this.memo) return;
    const updatedCards = this.memo.cards.map((c) =>
      c.id === cardId ? { ...c, label: text } : c,
    );
    this.store.updateMemoField('cards', updatedCards);
  }

  onUpdateCardDef(cardId: string, event: FocusEvent) {
    const text = (event.target as HTMLElement).innerText.trim();
    if (!this.memo) return;
    const updatedCards = this.memo.cards.map((c) =>
      c.id === cardId ? { ...c, definition: text } : c,
    );
    this.store.updateMemoField('cards', updatedCards);
  }
}
