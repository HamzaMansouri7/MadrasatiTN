import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemoDoc, EducationStore, LanguageService } from '../../../core';

@Component({
  selector: 'app-memo-table-layout',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (memo; as m) {
      <div class="print-page w-full max-w-[210mm] mx-auto min-h-[297mm] p-6 bg-white text-[#14251D] border border-[#E7DFCF] rounded-2xl flex flex-col justify-between shadow-sm relative font-sans select-text">
        
        <!-- Header -->
        <header class="border-b border-[#E7DFCF] pb-3 mb-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#8A5A00] text-[#FBF8F1] flex items-center justify-center font-display font-semibold text-lg">
              <span class="material-icons text-xl" aria-hidden="true">table_chart</span>
            </div>
            <div>
              <h1
                contenteditable="true"
                (blur)="onUpdateField('title', $event)"
                class="font-display text-2xl font-semibold text-[#14251D] focus:bg-[#F2ECDE] focus-visible:outline-2 focus-visible:outline-[#2D6A4F] rounded px-1"
              >
                {{ m.title }}
              </h1>
              <p
                contenteditable="true"
                (blur)="onUpdateField('subtitle', $event)"
                class="text-xs text-[#5B6B60] focus:bg-[#F2ECDE] focus-visible:outline-2 focus-visible:outline-[#2D6A4F] rounded px-1"
              >
                {{ m.subtitle || (m.grade + ' • ' + m.subject) }}
              </p>
            </div>
          </div>

          <div class="text-end">
            <span class="px-3 py-1 bg-[#F2ECDE] text-[#8A5A00] text-xs font-semibold rounded-lg border border-[#E7DFCF]">
              {{ m.grade }}
            </span>
          </div>
        </header>

        <!-- Main Comparative Table Matrix -->
        <div class="flex-1 space-y-4">
          
          <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-1.5">
            <h2 class="font-display font-semibold text-sm text-[#14251D] flex items-center gap-2">
              <img src="/assets/memo/books.svg" alt="icon" class="w-4 h-4" />
              {{ lang.tr('Tableau Comparatif & Synthèse', 'جدول المقارنة والتمييز بين المفاهيم') }}
            </h2>
            <button
              (click)="store.regenerateMemoBlock('cards')"
              class="no-print text-[10px] text-[#8A5A00] hover:underline cursor-pointer"
            >
              {{ lang.tr('↻ Régénérer', '↻ إعادة توليد') }}
            </button>
          </div>

          <!-- Responsive Comparison Grid -->
          <div class="overflow-x-auto rounded-xl border border-[#E7DFCF]">
            <table class="w-full text-xs text-start border-collapse">
              <thead>
                <tr class="bg-[#1B4332] text-[#FBF8F1]">
                  <th class="p-3 text-start font-semibold border-e border-[#2D6A4F] w-1/4">
                    {{ lang.tr('Critère / Notions', 'المفهوم / المعيار') }}
                  </th>
                  <th class="p-3 text-start font-semibold border-e border-[#2D6A4F] w-1/2">
                    {{ lang.tr('Définition & Règles', 'التعريف والقاعدة') }}
                  </th>
                  <th class="p-3 text-start font-semibold w-1/4">
                    {{ lang.tr('Exemples Types', 'أمثلة تطبيقية') }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E7DFCF]">
                @for (card of m.cards; track card.id) {
                  <tr class="hover:bg-[#FBF8F1] transition-colors">
                    <td class="p-3 font-semibold text-[#2D6A4F] bg-[#FBF8F1] border-e border-[#E7DFCF] align-top">
                      <div class="flex items-center justify-between">
                        <span>{{ card.label }}</span>
                        <button
                          (click)="store.removeMemoCard(card.id)"
                          class="no-print text-[#C1121F] hover:opacity-75 text-xs font-semibold px-1"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                    <td class="p-3 text-[#14251D] border-e border-[#E7DFCF] leading-relaxed align-top">
                      {{ card.definition }}
                    </td>
                    <td class="p-3 text-[#5B6B60] bg-[#FDFBF7] align-top">
                      <div class="flex flex-wrap gap-1">
                        @for (ex of card.examples; track $index) {
                          <span class="px-1.5 py-0.5 bg-white border border-[#E7DFCF] text-[#14251D] rounded text-[10px] font-medium">
                            {{ ex }}
                          </span>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Bottom Steps and Application -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <!-- Steps -->
            <div class="p-3 bg-[#FBF8F1] rounded-xl border border-[#E7DFCF] space-y-2">
              <h3 class="font-semibold text-xs text-[#2D6A4F] flex items-center gap-1.5">
                <img src="/assets/memo/backpack.svg" alt="icon" class="w-3.5 h-3.5" />
                {{ lang.tr('Rappel Méthodologique', 'تذكير بالمنهجية') }}
              </h3>
              <div class="space-y-1.5 text-[11px]">
                @for (step of m.steps; track step.n) {
                  <div class="flex items-start gap-1.5">
                    <span class="font-semibold text-[#8A5A00]">{{ step.n }}.</span>
                    <span><strong>{{ step.heading }} :</strong> {{ step.body }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Example -->
            @if (m.example) {
              <div class="p-3 bg-[#F2ECDE] rounded-xl border border-[#E7DFCF] space-y-2">
                <h3 class="font-semibold text-xs text-[#8A5A00] flex items-center gap-1.5">
                  <img src="/assets/memo/pencils.svg" alt="icon" class="w-3.5 h-3.5" />
                  {{ lang.tr('Exemple d’Illustration', 'مثال توضيحي') }}
                </h3>
                <p class="font-semibold text-[#14251D] bg-white p-2 rounded-lg border border-[#E7DFCF] text-xs">
                  "{{ m.example.sentence }}"
                </p>
                <div class="flex flex-wrap gap-2 text-[10px]">
                  @for (item of m.example.analysis; track item.word) {
                    <span class="bg-white px-2 py-0.5 rounded border border-[#E7DFCF]">
                      <strong>{{ item.word }}</strong> ➔ {{ item.role }}
                    </span>
                  }
                </div>
              </div>
            }
          </div>

        </div>

        <!-- Footer -->
        <footer class="mt-4 pt-3 border-t border-[#E7DFCF] space-y-2">
          <div class="p-2 bg-[#FBF8F1] rounded-xl border border-[#E7DFCF] flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-[#C1121F]">📌 {{ lang.tr('À retenir :', 'تذكير :') }}</span>
              <span class="text-[#5B6B60] text-[11px]">{{ m.remember.join(' • ') }}</span>
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
export class MemoTableLayoutComponent {
  @Input() memo: MemoDoc | null = null;
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);

  onUpdateField(field: keyof MemoDoc, event: FocusEvent) {
    const text = (event.target as HTMLElement).innerText.trim();
    this.store.updateMemoField(field, text as never);
  }
}
