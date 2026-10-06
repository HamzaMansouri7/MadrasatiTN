import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemoDoc, EducationStore, LanguageService } from '../../../core';

@Component({
  selector: 'app-memo-steps-layout',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (memo; as m) {
      <div class="print-page w-full max-w-[210mm] mx-auto min-h-[297mm] p-6 bg-white text-[#14251D] border border-[#E7DFCF] rounded-2xl flex flex-col justify-between shadow-sm relative font-sans select-text">
        
        <!-- Top Cartouche Header -->
        <header class="border-b border-[#E7DFCF] pb-4 mb-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#2D6A4F] text-[#FBF8F1] flex items-center justify-center font-display font-bold text-lg">
              M
            </div>
            <div>
              <h1
                contenteditable="true"
                (blur)="onUpdateField('title', $event)"
                class="font-display text-2xl font-bold text-[#14251D] focus:outline-none focus:bg-[#F2ECDE] rounded px-1"
              >
                {{ m.title }}
              </h1>
              <p
                contenteditable="true"
                (blur)="onUpdateField('subtitle', $event)"
                class="text-xs text-[#5B6B60] focus:outline-none focus:bg-[#F2ECDE] rounded px-1"
              >
                {{ m.subtitle || (m.grade + ' • ' + m.subject) }}
              </p>
            </div>
          </div>

          <div class="text-end">
            <span class="px-3 py-1 bg-[#F2ECDE] text-[#8A5A00] text-xs font-bold rounded-lg border border-[#E7DFCF]">
              {{ m.grade }}
            </span>
          </div>
        </header>

        <!-- Main Layout: Left = Large Vertical Steps Flow, Right = Cards + Example -->
        <div class="flex-1 grid grid-cols-1 md:grid-cols-12 gap-5">
          
          <!-- Left Column (7 cols): Step-by-Step Procedure -->
          <div class="md:col-span-7 space-y-3">
            <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-2">
              <h2 class="font-display font-bold text-sm text-[#2D6A4F] flex items-center gap-1.5">
                <img src="/assets/memo/backpack.svg" alt="icon" class="w-4 h-4" />
                {{ lang.tr('Démarche & Méthode de Résolution', 'منهجية العمل وخطوات الإنجاز') }}
              </h2>
              <button
                (click)="store.regenerateMemoBlock('steps')"
                class="no-print text-[10px] text-[#8A5A00] hover:underline cursor-pointer"
              >
                {{ lang.tr('↻ Régénérer', '↻ إعادة توليد') }}
              </button>
            </div>

            <div class="relative space-y-3 ps-2">
              @for (step of m.steps; track step.n; let idx = $index) {
                <div class="flex items-start gap-3 p-3 bg-[#FBF8F1] rounded-xl border border-[#E7DFCF] relative">
                  <div class="w-7 h-7 rounded-lg bg-[#2D6A4F] text-[#FBF8F1] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    0{{ step.n }}
                  </div>
                  <div class="flex-1">
                    <h3
                      contenteditable="true"
                      (blur)="onUpdateStepHeading(idx, $event)"
                      class="font-bold text-xs text-[#14251D] focus:outline-none focus:bg-[#F2ECDE] rounded"
                    >
                      {{ step.heading }}
                    </h3>
                    <p
                      contenteditable="true"
                      (blur)="onUpdateStepBody(idx, $event)"
                      class="text-xs text-[#5B6B60] mt-1 leading-relaxed focus:outline-none focus:bg-[#F2ECDE] rounded"
                    >
                      {{ step.body }}
                    </p>
                  </div>
                  <button
                    (click)="store.removeMemoStep(idx)"
                    class="no-print text-[#C1121F] hover:opacity-75 text-xs font-bold px-1"
                  >
                    ×
                  </button>
                </div>
              }
            </div>

            <button
              (click)="store.addMemoStep()"
              class="no-print w-full py-1.5 border border-dashed border-[#2D6A4F]/40 text-[#2D6A4F] hover:bg-[#F2ECDE] text-xs font-medium rounded-lg cursor-pointer transition-colors"
            >
              + {{ lang.tr('Ajouter une étape', 'إضافة خطوة') }}
            </button>
          </div>

          <!-- Right Column (5 cols): Concept Cards & Analyzed Sample -->
          <div class="md:col-span-5 space-y-4">
            
            <!-- Key Concepts -->
            <section class="space-y-2">
              <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-1.5">
                <h2 class="font-display font-bold text-xs text-[#14251D] flex items-center gap-1.5">
                  <img src="/assets/memo/star.svg" alt="icon" class="w-4 h-4" />
                  {{ lang.tr('Points Clés à Retenir', 'المفاهيم الجوهرية') }}
                </h2>
                <button
                  (click)="store.regenerateMemoBlock('cards')"
                  class="no-print text-[10px] text-[#8A5A00] hover:underline cursor-pointer"
                >
                  {{ lang.tr('↻', '↻') }}
                </button>
              </div>

              @for (card of m.cards; track card.id) {
                <div class="p-2.5 bg-[#FBF8F1] rounded-xl border border-[#E7DFCF] space-y-1">
                  <div class="flex items-center justify-between">
                    <h4
                      contenteditable="true"
                      (blur)="onUpdateCardLabel(card.id, $event)"
                      class="font-bold text-xs text-[#2D6A4F] focus:outline-none focus:bg-[#F2ECDE] rounded"
                    >
                      {{ card.label }}
                    </h4>
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
                    class="text-[11px] text-[#5B6B60] leading-snug focus:outline-none focus:bg-[#F2ECDE] rounded"
                  >
                    {{ card.definition }}
                  </p>
                  <div class="flex flex-wrap gap-1 pt-1">
                    @for (ex of card.examples; track $index) {
                      <span class="px-1.5 py-0.5 bg-white border border-[#E7DFCF] text-[#14251D] rounded text-[10px] font-medium">
                        {{ ex }}
                      </span>
                    }
                  </div>
                </div>
              }
            </section>

            <!-- Analysed Example -->
            @if (m.example) {
              <section class="p-3 bg-[#F2ECDE] rounded-xl border border-[#E7DFCF] space-y-2 text-xs">
                <div class="flex items-center justify-between">
                  <h3 class="font-bold text-[#8A5A00] text-xs flex items-center gap-1">
                    <img src="/assets/memo/pencils.svg" alt="icon" class="w-3.5 h-3.5" />
                    {{ lang.tr("Exemple d'application", 'تطبيق نموذجي') }}
                  </h3>
                  <button
                    (click)="store.regenerateMemoBlock('example')"
                    class="no-print text-[10px] text-[#8A5A00] hover:underline cursor-pointer"
                  >
                    {{ lang.tr('↻', '↻') }}
                  </button>
                </div>
                <p class="font-semibold text-[#14251D] bg-white p-2 rounded-lg border border-[#E7DFCF]">
                  "{{ m.example.sentence }}"
                </p>
                <div class="space-y-1 text-[11px]">
                  @for (item of m.example.analysis; track item.word) {
                    <div class="flex items-center justify-between">
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
            <div class="p-2.5 bg-[#14251D] text-[#FBF8F1] rounded-xl flex items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-1.5">
                <img src="/assets/memo/heart.svg" alt="icon" class="w-4 h-4" />
                <span class="font-bold text-[#F2C14E] text-xs">{{ lang.tr("Règle d'or :", 'القاعدة الذهبية :') }}</span>
              </div>
              <div class="flex items-center gap-1 font-bold">
                @for (part of m.formula.parts; track $index) {
                  <span [class]="$index % 2 === 0 ? 'bg-[#2D6A4F] px-2 py-0.5 rounded text-[11px]' : 'text-[#F2C14E] text-[11px]'">
                    {{ part }}
                  </span>
                }
              </div>
              <span class="text-[10px] text-[#B7C7BC] italic hidden md:inline">
                {{ m.formula.note }}
              </span>
            </div>
          }

          <div class="p-2 bg-[#FBF8F1] rounded-xl border border-[#E7DFCF] flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="font-bold text-[#C1121F]">{{ lang.tr('Mémo :', 'تذكير :') }}</span>
              <span class="text-[#5B6B60] text-[11px]">{{ m.remember.join(' • ') }}</span>
            </div>
            <span class="text-[9px] font-bold text-[#8A5A00] uppercase tracking-wider shrink-0 ms-2">
              Madrasati TN
            </span>
          </div>
        </footer>

      </div>
    }
  `,
})
export class MemoStepsLayoutComponent {
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
}
