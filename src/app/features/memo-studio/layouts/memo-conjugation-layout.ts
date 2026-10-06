import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemoDoc, EducationStore, LanguageService } from '../../../core';

@Component({
  selector: 'app-memo-conjugation-layout',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (memo; as m) {
      <div class="print-page w-full max-w-[210mm] mx-auto min-h-[297mm] p-6 bg-white text-[#14251D] border border-[#E7DFCF] rounded-2xl flex flex-col justify-between shadow-sm relative font-sans select-text">
        
        <!-- Header -->
        <header class="border-b border-[#E7DFCF] pb-3 mb-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#2D6A4F] text-[#FBF8F1] flex items-center justify-center font-display font-bold text-lg">
              ✍️
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
            <span class="px-3 py-1 bg-[#F2ECDE] text-[#2D6A4F] text-xs font-bold rounded-lg border border-[#E7DFCF]">
              {{ m.grade }}
            </span>
          </div>
        </header>

        <!-- Main Body: Conjugation/Grammar Rules & Pronouns Table -->
        <div class="flex-1 space-y-4">
          
          <!-- Top Grid: Rules & Terminaisons -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            @for (card of m.cards; track card.id) {
              <div class="p-3 bg-[#FBF8F1] rounded-xl border border-[#E7DFCF] space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#8A5A00]">{{ card.label }}</span>
                <p class="text-xs text-[#14251D] font-medium">{{ card.definition }}</p>
                <div class="flex flex-wrap gap-1 pt-1">
                  @for (ex of card.examples; track $index) {
                    <span class="px-1.5 py-0.5 bg-white border border-[#E7DFCF] text-[#2D6A4F] rounded text-[10px] font-mono font-bold">
                      {{ ex }}
                    </span>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Conjugation Matrix / Analysis Table -->
          <section class="space-y-2">
            <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-1">
              <h2 class="font-display font-bold text-xs text-[#14251D] flex items-center gap-1.5">
                <img src="/assets/memo/pencils.svg" alt="icon" class="w-4 h-4" />
                {{ lang.tr('Tableau de Conjugaison & Emploi', 'جدول التصريف وتطبيقات الضمائر') }}
              </h2>
              <button
                (click)="store.regenerateMemoBlock('steps')"
                class="no-print text-[10px] text-[#8A5A00] hover:underline cursor-pointer"
              >
                {{ lang.tr('↻ Régénérer', '↻ إعادة توليد') }}
              </button>
            </div>

            <!-- Steps as Conjugation Table / Formula rows -->
            <div class="overflow-x-auto rounded-xl border border-[#E7DFCF]">
              <table class="w-full text-xs text-start border-collapse">
                <thead>
                  <tr class="bg-[#2D6A4F] text-[#FBF8F1]">
                    <th class="p-2.5 text-start font-bold border-e border-[#1B4332] w-1/4">
                      {{ lang.tr('Personne / الضمير', 'الضمير / Personne') }}
                    </th>
                    <th class="p-2.5 text-start font-bold border-e border-[#1B4332] w-2/4">
                      {{ lang.tr('Forme & Terminaison', 'صيغة الفعل وعلامة الإعراب') }}
                    </th>
                    <th class="p-2.5 text-start font-bold w-1/4">
                      {{ lang.tr('Exemple', 'مثال') }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E7DFCF]">
                  @for (step of m.steps; track step.n) {
                    <tr class="hover:bg-[#FBF8F1] transition-colors">
                      <td class="p-2.5 font-bold text-[#14251D] bg-[#FBF8F1] border-e border-[#E7DFCF]">
                        {{ step.heading }}
                      </td>
                      <td class="p-2.5 text-[#2D6A4F] font-semibold border-e border-[#E7DFCF]">
                        {{ step.body }}
                      </td>
                      <td class="p-2.5 text-[#5B6B60] italic">
                        @if (m.cards[step.n - 1]?.examples?.[0]) {
                          {{ m.cards[step.n - 1].examples[0] }}
                        } @else {
                          {{ m.title }}
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <!-- Analysed Sentence Section -->
          @if (m.example) {
            <section class="p-3 bg-[#F2ECDE] rounded-xl border border-[#E7DFCF] space-y-2 text-xs">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-[#8A5A00] flex items-center gap-1">
                  <img src="/assets/memo/apple.svg" alt="icon" class="w-3.5 h-3.5" />
                  {{ lang.tr('Phrase modèle analysée', 'جملة نموذجية محللة') }}
                </h3>
              </div>
              <p class="font-bold text-[#14251D] bg-white p-2 rounded-lg border border-[#E7DFCF]">
                "{{ m.example.sentence }}"
              </p>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                @for (item of m.example.analysis; track item.word) {
                  <div class="p-2 bg-white rounded-lg border border-[#E7DFCF]">
                    <div class="font-bold text-[#14251D]">{{ item.word }}</div>
                    <div class="text-[10px] text-[#2D6A4F]">{{ item.role }}</div>
                  </div>
                }
              </div>
            </section>
          }

        </div>

        <!-- Footer -->
        <footer class="mt-4 pt-3 border-t border-[#E7DFCF] space-y-2">
          @if (m.formula) {
            <div class="p-2.5 bg-[#14251D] text-[#FBF8F1] rounded-xl flex items-center justify-between gap-3 text-xs">
              <span class="font-bold text-[#F2C14E] text-xs">{{ lang.tr('Règle :', 'القاعدة :') }}</span>
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
              <span class="font-bold text-[#C1121F]">⭐ {{ lang.tr('Astuce :', 'تنبيه :') }}</span>
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
export class MemoConjugationLayoutComponent {
  @Input() memo: MemoDoc | null = null;
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);

  onUpdateField(field: keyof MemoDoc, event: FocusEvent) {
    const text = (event.target as HTMLElement).innerText.trim();
    this.store.updateMemoField(field, text as never);
  }
}
