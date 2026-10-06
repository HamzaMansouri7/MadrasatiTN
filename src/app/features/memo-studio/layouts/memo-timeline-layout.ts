import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemoDoc, EducationStore, LanguageService } from '../../../core';

@Component({
  selector: 'app-memo-timeline-layout',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (memo; as m) {
      <div class="print-page w-full max-w-[210mm] mx-auto min-h-[297mm] p-6 bg-white text-[#14251D] border border-[#E7DFCF] rounded-2xl flex flex-col justify-between shadow-sm relative font-sans select-text">
        
        <!-- Header Banner -->
        <header class="border-b-2 border-[#1B4332] pb-3 mb-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#1B4332] text-[#FBF8F1] flex items-center justify-center font-display font-bold text-lg shadow-sm">
              ⏳
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
            <span class="px-3 py-1 bg-[#2D6A4F] text-[#FBF8F1] text-xs font-bold rounded-lg shadow-xs">
              {{ m.grade }}
            </span>
          </div>
        </header>

        <!-- Main Content Area -->
        <div class="flex-1 space-y-4">
          
          <!-- Timeline / Chronological Flow Section -->
          <section class="space-y-3">
            <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-1.5">
              <h2 class="font-display font-bold text-sm text-[#1B4332] flex items-center gap-2">
                <img src="/assets/memo/globe.svg" alt="icon" class="w-4 h-4" />
                {{ lang.tr('Chronologie & Enchaînement des Faits', 'التسلسل الزمني والمراحل الرئيسية') }}
              </h2>
              <button
                (click)="store.regenerateMemoBlock('steps')"
                class="no-print text-[10px] text-[#8A5A00] hover:underline cursor-pointer"
              >
                {{ lang.tr('↻ Régénérer', '↻ إعادة توليد') }}
              </button>
            </div>

            <!-- Vertical Timeline Track -->
            <div class="relative border-s-2 border-[#2D6A4F]/30 ms-4 ps-6 space-y-4 py-2">
              @for (step of m.steps; track step.n; let idx = $index) {
                <div class="relative group">
                  <!-- Timeline Node Dot -->
                  <div class="absolute -start-[31px] top-1 w-6 h-6 rounded-full bg-[#1B4332] text-[#FBF8F1] flex items-center justify-center font-bold text-[11px] ring-4 ring-white shadow-xs">
                    {{ step.n }}
                  </div>
                  <div class="p-3 bg-[#FBF8F1] rounded-xl border border-[#E7DFCF] hover:border-[#2D6A4F] transition-colors">
                    <div class="flex items-center justify-between">
                      <h3
                        contenteditable="true"
                        (blur)="onUpdateStepHeading(idx, $event)"
                        class="font-bold text-xs text-[#14251D] focus:outline-none focus:bg-[#F2ECDE] rounded"
                      >
                        {{ step.heading }}
                      </h3>
                      <button
                        (click)="store.removeMemoStep(idx)"
                        class="no-print text-[#C1121F] hover:opacity-75 text-xs font-bold px-1"
                      >
                        ×
                      </button>
                    </div>
                    <p
                      contenteditable="true"
                      (blur)="onUpdateStepBody(idx, $event)"
                      class="text-xs text-[#5B6B60] mt-1 leading-relaxed focus:outline-none focus:bg-[#F2ECDE] rounded"
                    >
                      {{ step.body }}
                    </p>
                  </div>
                </div>
              }
            </div>

            <button
              (click)="store.addMemoStep()"
              class="no-print w-full py-1.5 border border-dashed border-[#2D6A4F]/40 text-[#2D6A4F] hover:bg-[#F2ECDE] text-xs font-medium rounded-lg cursor-pointer transition-colors"
            >
              + {{ lang.tr('Ajouter un jalon chronologique', 'إضافة مرحلة أو تاريخ') }}
            </button>
          </section>

          <!-- Middle Row: Cards Matrix & Example Analysis -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            
            <!-- Cards Column -->
            <section class="space-y-2">
              <h3 class="font-display font-bold text-xs text-[#14251D] flex items-center gap-1.5 border-b border-[#E7DFCF] pb-1">
                <img src="/assets/memo/star.svg" alt="icon" class="w-3.5 h-3.5" />
                {{ lang.tr('Éléments Incontournables', 'عناصر لا غنى عنها') }}
              </h3>
              <div class="space-y-2">
                @for (card of m.cards; track card.id) {
                  <div class="p-2.5 bg-[#F2ECDE] rounded-xl border border-[#E7DFCF] space-y-1">
                    <h4 class="font-bold text-xs text-[#2D6A4F]">{{ card.label }}</h4>
                    <p class="text-[11px] text-[#5B6B60]">{{ card.definition }}</p>
                  </div>
                }
              </div>
            </section>

            <!-- Analyzed Example -->
            @if (m.example) {
              <section class="space-y-2">
                <h3 class="font-display font-bold text-xs text-[#8A5A00] flex items-center gap-1.5 border-b border-[#E7DFCF] pb-1">
                  <img src="/assets/memo/pencils.svg" alt="icon" class="w-3.5 h-3.5" />
                  {{ lang.tr("Exemple Type d'Analyse", 'نموذج تطبيقي') }}
                </h3>
                <div class="p-2.5 bg-[#FBF8F1] rounded-xl border border-[#E7DFCF] space-y-2 text-xs">
                  <p class="font-semibold text-[#14251D] bg-white p-2 rounded-lg border border-[#E7DFCF]">
                    "{{ m.example.sentence }}"
                  </p>
                  <div class="grid grid-cols-2 gap-1.5 text-[10px]">
                    @for (item of m.example.analysis; track item.word) {
                      <div class="p-1.5 bg-white rounded border border-[#E7DFCF] flex justify-between">
                        <span class="font-bold text-[#14251D]">{{ item.word }}</span>
                        <span class="text-[#2D6A4F]">{{ item.role }}</span>
                      </div>
                    }
                  </div>
                </div>
              </section>
            }

          </div>

        </div>

        <!-- Footer / Remember Rules -->
        <footer class="mt-4 pt-3 border-t border-[#E7DFCF] space-y-2">
          <div class="p-2.5 bg-[#1B4332] text-[#FBF8F1] rounded-xl flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="font-bold text-[#F2C14E]">⭐ {{ lang.tr('Synthèse :', 'الخلاصة :') }}</span>
              <span class="text-[11px] text-[#E7DFCF]">{{ m.remember.join(' • ') }}</span>
            </div>
            <span class="text-[9px] font-bold text-[#F2C14E] uppercase tracking-wider shrink-0 ms-2">
              Madrasati TN
            </span>
          </div>
        </footer>

      </div>
    }
  `,
})
export class MemoTimelineLayoutComponent {
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
}
