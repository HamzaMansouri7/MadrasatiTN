import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemoDoc, MemoCard, MemoStep, EducationStore, LanguageService } from '../../../core';

@Component({
  selector: 'app-memo-tree-layout',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (memo; as m) {
      <div class="print-page w-full max-w-[210mm] mx-auto min-h-[297mm] p-6 bg-[#FBF8F1] text-[#14251D] border border-[#E7DFCF] rounded-2xl flex flex-col justify-between shadow-sm relative font-sans select-text">
        
        <!-- Top Header / Banner -->
        <header class="border-b-2 border-[#1B4332] pb-3 mb-4 flex items-center justify-between">
          <div class="flex-1 text-center">
            <span class="inline-block px-3 py-1 bg-[#1B4332] text-[#FBF8F1] text-xs font-semibold rounded-full mb-1">
              {{ m.grade }} • {{ m.subject }}
            </span>
            <h1
              contenteditable="true"
              (blur)="onUpdateField('title', $event)"
              class="font-display text-2xl font-bold text-[#14251D] tracking-tight focus:outline-none focus:bg-[#F2ECDE] rounded px-1"
            >
              {{ m.title }}
            </h1>
            @if (m.subtitle) {
              <p
                contenteditable="true"
                (blur)="onUpdateField('subtitle', $event)"
                class="text-xs text-[#5B6B60] italic mt-0.5 focus:outline-none focus:bg-[#F2ECDE] rounded px-1"
              >
                {{ m.subtitle }}
              </p>
            }
          </div>
        </header>

        <!-- Main Body: Tree-inspired central trunk + branch concept cards -->
        <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          
          <!-- Left Branch: Steps / Méthode -->
          <section class="bg-white p-4 rounded-xl border border-[#E7DFCF] shadow-xs space-y-3">
            <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-2">
              <div class="flex items-center gap-2">
                <img src="/assets/memo/magnifier.svg" alt="Icon" class="w-4 h-4 text-[#1B4332]" />
                <h2 class="font-display font-semibold text-sm text-[#1B4332]">{{ lang.tr('Ma méthode pas à pas', 'خطوات العمل المنهجية') }}</h2>
              </div>
              <button
                (click)="store.regenerateMemoBlock('steps')"
                class="no-print text-[10px] text-[#8A5A00] hover:underline cursor-pointer"
                title="Régénérer"
              >
                {{ lang.tr('↻ Régénérer', '↻ إعادة توليد') }}
              </button>
            </div>

            <div class="space-y-2">
              @for (step of m.steps; track step.n; let idx = $index) {
                <div class="flex items-start gap-2 p-2 bg-[#FBF8F1] rounded-lg border border-[#E7DFCF]/60 text-xs">
                  <span class="w-5 h-5 rounded-full bg-[#1B4332] text-[#FBF8F1] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {{ step.n }}
                  </span>
                  <div class="flex-1">
                    <h4
                      contenteditable="true"
                      (blur)="onUpdateStepHeading(idx, $event)"
                      class="font-semibold text-[#14251D] focus:outline-none focus:bg-[#F2ECDE] rounded"
                    >
                      {{ step.heading }}
                    </h4>
                    <p
                      contenteditable="true"
                      (blur)="onUpdateStepBody(idx, $event)"
                      class="text-[#5B6B60] mt-0.5 focus:outline-none focus:bg-[#F2ECDE] rounded"
                    >
                      {{ step.body }}
                    </p>
                  </div>
                  <button
                    (click)="store.removeMemoStep(idx)"
                    class="no-print text-[#C1121F] hover:opacity-75 text-xs font-bold px-1"
                    title="Supprimer"
                  >
                    ×
                  </button>
                </div>
              }
            </div>

            <button
              (click)="store.addMemoStep()"
              class="no-print w-full py-1.5 border border-dashed border-[#1B4332]/40 text-[#1B4332] hover:bg-[#F2ECDE] text-xs font-medium rounded-lg cursor-pointer transition-colors"
            >
              + {{ lang.tr('Ajouter une étape', 'إضافة خطوة') }}
            </button>
          </section>

          <!-- Center Trunk: Concept Cards -->
          <section class="bg-white p-4 rounded-xl border-2 border-[#1B4332] shadow-xs space-y-3">
            <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-2">
              <div class="flex items-center gap-2">
                <img src="/assets/memo/books.svg" alt="Icon" class="w-4 h-4 text-[#1B4332]" />
                <h2 class="font-display font-semibold text-sm text-[#1B4332]">{{ lang.tr('Concepts Clés', 'المفاهيم الأساسية') }}</h2>
              </div>
              <button
                (click)="store.regenerateMemoBlock('cards')"
                class="no-print text-[10px] text-[#8A5A00] hover:underline cursor-pointer"
              >
                {{ lang.tr('↻ Régénérer', '↻ إعادة توليد') }}
              </button>
            </div>

            <div class="space-y-3">
              @for (card of m.cards; track card.id; let idx = $index) {
                <div class="p-3 bg-[#FBF8F1] rounded-xl border border-[#E7DFCF] space-y-1.5 text-xs">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                      <img [src]="'/assets/memo/' + (card.icon || 'star') + '.svg'" alt="card icon" class="w-3.5 h-3.5" />
                      <h3
                        contenteditable="true"
                        (blur)="onUpdateCardLabel(card.id, $event)"
                        class="font-bold text-[#14251D] focus:outline-none focus:bg-[#F2ECDE] rounded px-0.5"
                      >
                        {{ card.label }}
                      </h3>
                    </div>
                    <button
                      (click)="store.removeMemoCard(card.id)"
                      class="no-print text-[#C1121F] hover:opacity-75 text-xs font-bold px-1"
                    >
                      ×
                    </button>
                  </div>
                  <p
                    contenteditable="true"
                    (blur)="onUpdateCardDef(card.id, $event)"
                    class="text-[#5B6B60] leading-relaxed focus:outline-none focus:bg-[#F2ECDE] rounded px-0.5"
                  >
                    {{ card.definition }}
                  </p>
                  <div class="pt-1 flex flex-wrap gap-1">
                    @for (ex of card.examples; track $index) {
                      <span class="px-2 py-0.5 bg-white border border-[#E7DFCF] text-[#2D6A4F] rounded-md font-semibold text-[10px]">
                        {{ ex }}
                      </span>
                    }
                  </div>
                </div>
              }
            </div>

            <button
              (click)="store.addMemoCard()"
              class="no-print w-full py-1.5 border border-dashed border-[#1B4332]/40 text-[#1B4332] hover:bg-[#F2ECDE] text-xs font-medium rounded-lg cursor-pointer transition-colors"
            >
              + {{ lang.tr('Ajouter une carte', 'إضافة بطاقة') }}
            </button>
          </section>

          <!-- Right Branch: Analysed Example & Formula -->
          <div class="space-y-4">
            @if (m.example) {
              <section class="bg-white p-4 rounded-xl border border-[#E7DFCF] shadow-xs space-y-2">
                <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-1.5">
                  <div class="flex items-center gap-2">
                    <img src="/assets/memo/pencils.svg" alt="Icon" class="w-4 h-4 text-[#8A5A00]" />
                    <h2 class="font-display font-semibold text-xs text-[#8A5A00]">{{ lang.tr("J'analyse une phrase", 'تحليل نموذج تطبيقي') }}</h2>
                  </div>
                  <button
                    (click)="store.regenerateMemoBlock('example')"
                    class="no-print text-[10px] text-[#8A5A00] hover:underline cursor-pointer"
                  >
                    {{ lang.tr('↻', '↻') }}
                  </button>
                </div>
                <p class="font-bold text-xs text-[#14251D] bg-[#F2ECDE] p-2 rounded-lg">
                  "{{ m.example.sentence }}"
                </p>
                <div class="space-y-1 text-xs">
                  @for (item of m.example.analysis; track item.word) {
                    <div class="flex items-center justify-between py-0.5 border-b border-[#E7DFCF]/40">
                      <span class="font-semibold text-[#14251D]">{{ item.word }}</span>
                      <span class="text-[#5B6B60] text-[11px]">➔ {{ item.role }}</span>
                    </div>
                  }
                </div>
              </section>
            }

            @if (m.formula) {
              <section class="bg-[#14251D] text-[#FBF8F1] p-3 rounded-xl shadow-xs space-y-1.5">
                <div class="flex items-center justify-between border-b border-[#FBF8F1]/20 pb-1">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-[#F2C14E]">
                    {{ lang.tr('Formule-Mémoire', 'معادلة التلخيص') }}
                  </span>
                  <button
                    (click)="store.regenerateMemoBlock('formula')"
                    class="no-print text-[10px] text-[#F2C14E] hover:underline cursor-pointer"
                  >
                    {{ lang.tr('↻', '↻') }}
                  </button>
                </div>
                <div class="flex flex-wrap items-center justify-center gap-1.5 font-bold text-xs py-1">
                  @for (part of m.formula.parts; track $index) {
                    <span [class]="$index % 2 === 0 ? 'bg-[#2D6A4F] px-2 py-0.5 rounded text-[#FBF8F1]' : 'text-[#F2C14E]'">
                      {{ part }}
                    </span>
                  }
                </div>
                <p class="text-[10px] text-[#B7C7BC] text-center italic">
                  {{ m.formula.note }}
                </p>
              </section>
            }
          </div>
        </div>

        <!-- Bottom Strip: Remember / À ne pas oublier -->
        <footer class="mt-4 pt-3 border-t-2 border-[#1B4332] grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <div class="md:col-span-3 bg-white p-3 rounded-xl border border-[#E7DFCF] flex items-start gap-2">
            <img src="/assets/memo/apple.svg" alt="Icon" class="w-5 h-5 shrink-0 mt-0.5 text-[#C1121F]" />
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <h4 class="font-display font-bold text-xs text-[#C1121F]">{{ lang.tr('À ne pas oublier !', 'تذكّر دائماً !') }}</h4>
                <button
                  (click)="store.regenerateMemoBlock('remember')"
                  class="no-print text-[10px] text-[#8A5A00] hover:underline cursor-pointer"
                >
                  {{ lang.tr('↻ Régénérer', '↻ إعادة توليد') }}
                </button>
              </div>
              <ul class="mt-1 space-y-0.5 text-[11px] text-[#14251D] list-disc list-inside">
                @for (rem of m.remember; track $index) {
                  <li contenteditable="true" (blur)="onUpdateRemember($index, $event)" class="focus:outline-none focus:bg-[#F2ECDE] rounded">
                    {{ rem }}
                  </li>
                }
              </ul>
            </div>
          </div>

          <div class="text-center p-2 bg-[#F2ECDE] rounded-xl border border-[#E7DFCF]">
            <p class="text-[10px] font-serif italic text-[#14251D]">
              "{{ m.quote || lang.tr("Apprendre aujourd'hui, réussir demain !", 'طلب العلم فريضة وطريق النجاح') }}"
            </p>
            <span class="block mt-1 text-[9px] font-bold text-[#8A5A00] uppercase tracking-wider">
              Madrasati TN
            </span>
          </div>
        </footer>

      </div>
    }
  `,
})
export class MemoTreeLayoutComponent {
  @Input() memo: MemoDoc | null = null;
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);

  onUpdateField(field: keyof MemoDoc, event: FocusEvent) {
    const text = (event.target as HTMLElement).innerText.trim();
    this.store.updateMemoField(field, text as never);
  }

  onUpdateStepHeading(index: number, event: FocusEvent) {
    const text = (event.target as HTMLElement).innerText.trim();
    if (!this.memo) return;
    const currentSteps = [...this.memo.steps];
    if (currentSteps[index]) {
      currentSteps[index] = { ...currentSteps[index], heading: text };
      this.store.updateMemoField('steps', currentSteps);
    }
  }

  onUpdateStepBody(index: number, event: FocusEvent) {
    const text = (event.target as HTMLElement).innerText.trim();
    if (!this.memo) return;
    const currentSteps = [...this.memo.steps];
    if (currentSteps[index]) {
      currentSteps[index] = { ...currentSteps[index], body: text };
      this.store.updateMemoField('steps', currentSteps);
    }
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

  onUpdateRemember(index: number, event: FocusEvent) {
    const text = (event.target as HTMLElement).innerText.trim();
    if (!this.memo) return;
    const updated = [...this.memo.remember];
    updated[index] = text;
    this.store.updateMemoField('remember', updated);
  }
}
