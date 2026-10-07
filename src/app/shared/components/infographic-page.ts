import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfographicDoc, LanguageService, LessonPlanDocValues, PrintService } from '@core';

@Component({
  selector: 'app-infographic-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="infographic-container w-full max-w-[850px] mx-auto space-y-4">
      
      <!-- Toolbar (Screen Only) -->
      <div class="flex items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-[#E7DFCF] print:hidden shadow-xs">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#2D6A4F]/10 text-[#1B4332] border border-[#2D6A4F]/20">
            <span class="material-icons text-sm">view_timeline</span>
            <span>{{ lang.tr('Fiche Pédagogique Officielle A4', 'جذاذة بيداغوجية رسمية A4') }}</span>
          </span>
          <span class="text-xs text-[#5B6B60]">• {{ doc().grade }} • {{ doc().subject }}</span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="toggleEdit()"
            class="px-3.5 py-1.5 rounded-xl border border-[#E7DFCF] bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#14251D] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
            <span class="material-icons text-sm">{{ isEditing() ? 'done' : 'edit' }}</span>
            <span>{{ isEditing() ? lang.tr('Terminer', 'تم') : lang.tr('Modifier', 'تعديل') }}</span>
          </button>

          <button
            type="button"
            (click)="printDoc()"
            class="px-4 py-1.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm">
            <span class="material-icons text-sm">print</span>
            <span>{{ lang.tr('Imprimer A4', 'طباعة A4') }}</span>
          </button>
        </div>
      </div>

      <!-- ================= A4 PORTRAIT SHEET ================= -->
      <div
        id="lesson-plan-sheet"
        dir="rtl"
        class="a4-portrait-sheet bg-white rounded-[24px] print:rounded-none border border-[#E7DFCF] print:border-none p-6 sm:p-10 text-[#14251D] space-y-6 shadow-sm print:shadow-none min-h-[1100px] relative font-sans">
        
        <!-- Top Institutional Ministry Cartouche -->
        <div class="border-b-2 border-[#14251D] pb-4 flex items-center justify-between gap-4">
          <div class="text-right space-y-0.5 text-xs">
            <p class="font-display font-semibold text-[#14251D] text-sm">الجمهورية التونسية</p>
            <p class="text-[#5B6B60] text-[11px]">وزارة التربية • المندوبية الجهوية للتربية</p>
            <p class="text-[#5B6B60] text-[10px]">المرحلة الابتدائية — السنة الدراسية: {{ doc().author?.schoolYear || '2025-2026' }}</p>
          </div>

          <div class="text-center space-y-1">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#14251D] text-[#FBF8F1] font-display font-semibold text-xs">
              <span class="material-icons text-sm text-[#F2C14E]">school</span>
              <span>جذاذة بيداغوجية رسمية للدرس</span>
            </div>
            <h2 class="font-display font-bold text-lg text-[#14251D] tracking-tight">
              {{ doc().title || values().topic || 'مخطط الدرس اليومي' }}
            </h2>
          </div>

          <div class="text-left flex flex-col items-end">
            <span class="tn-seal w-10 h-10 shrink-0" aria-hidden="true"></span>
            <span class="text-[9px] text-[#6B7A70] mt-1 font-mono">MADRASATI-TN</span>
          </div>
        </div>

        <!-- 1. Info Strip (المعطيات العامة) -->
        <div class="bg-[#FBF8F1] border border-[#E7DFCF] rounded-2xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div class="flex items-center gap-2">
            <span class="material-icons text-sm text-[#2D6A4F]">class</span>
            <div>
              <p class="text-[10px] text-[#5B6B60]">المستوى / القسم</p>
              <p class="font-bold text-[#14251D]">{{ doc().grade }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="material-icons text-sm text-[#8A5A00]">menu_book</span>
            <div>
              <p class="text-[10px] text-[#5B6B60]">المادة / النشاط</p>
              <p class="font-bold text-[#14251D]">{{ doc().subject }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="material-icons text-sm text-[#BF5B34]">timer</span>
            <div>
              <p class="text-[10px] text-[#5B6B60]">المدة الزمنية</p>
              <p class="font-bold text-[#14251D]">{{ values().durationMinutes || 45 }} دقيقة</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="material-icons text-sm text-[#14251D]">calendar_today</span>
            <div>
              <p class="text-[10px] text-[#5B6B60]">الأسبوع / التاريخ</p>
              <p class="font-bold text-[#14251D]">{{ values().week || 'الأسبوع البيداغوجي' }}</p>
            </div>
          </div>
        </div>

        <!-- Main 2-Column Grid: Pedagogy Frame & Stages Timeline -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          <!-- Left Column (4 cols): Objectives, Outcomes, Materials, Values -->
          <div class="lg:col-span-5 space-y-4 text-xs">
            <!-- Objectives -->
            <div class="bg-white rounded-xl border border-[#E7DFCF] p-3.5 space-y-2">
              <div class="flex items-center gap-1.5 text-[#2D6A4F] font-bold border-b border-[#F2ECDE] pb-1.5">
                <span class="material-icons text-sm">flag</span>
                <span>الأهداف المميزة للدرس</span>
              </div>
              <ul class="space-y-1.5 text-[#4A5A50] leading-relaxed">
                @for (obj of values().objectives; track $index) {
                  <li class="flex items-start gap-1.5">
                    <span class="material-icons text-xs text-[#2D6A4F] shrink-0 mt-0.5">check_circle</span>
                    <span>{{ obj }}</span>
                  </li>
                }
              </ul>
            </div>

            <!-- Outcomes & Competencies -->
            <div class="bg-white rounded-xl border border-[#E7DFCF] p-3.5 space-y-2">
              <div class="flex items-center gap-1.5 text-[#1B4332] font-bold border-b border-[#F2ECDE] pb-1.5">
                <span class="material-icons text-sm">task_alt</span>
                <span>مخرجات التعلم والكفايات</span>
              </div>
              <ul class="space-y-1 text-[#4A5A50] leading-relaxed">
                @for (out of values().outcomes; track $index) {
                  <li class="flex items-start gap-1.5">
                    <span class="text-[#1B4332] font-bold">•</span>
                    <span>{{ out }}</span>
                  </li>
                }
              </ul>
            </div>

            <!-- Teaching Materials -->
            <div class="bg-[#FBF8F1] rounded-xl border border-[#E7DFCF] p-3 space-y-1.5">
              <p class="font-bold text-[#8A5A00] flex items-center gap-1 text-[11px]">
                <span class="material-icons text-xs">inventory_2</span>
                <span>الوسائل والمعينات البيداغوجية :</span>
              </p>
              <div class="flex flex-wrap gap-1">
                @for (mat of values().materials; track $index) {
                  <span class="bg-white px-2 py-0.5 rounded-md border border-[#E7DFCF] text-[10px] text-[#5B6B60]">
                    {{ mat }}
                  </span>
                }
              </div>
            </div>

            <!-- Cross-Subject & Values -->
            <div class="grid grid-cols-2 gap-2 text-[11px]">
              <div class="bg-white p-2.5 rounded-xl border border-[#E7DFCF] space-y-1">
                <p class="font-bold text-[#14251D] flex items-center gap-1">
                  <span class="material-icons text-xs text-[#2D6A4F]">hub</span>
                  <span>الامتدادات :</span>
                </p>
                <p class="text-[#5B6B60] text-[10px] leading-tight">
                  {{ values().crossSubjectIntegration?.join('، ') || 'اللغة والرياضيات' }}
                </p>
              </div>

              <div class="bg-white p-2.5 rounded-xl border border-[#E7DFCF] space-y-1">
                <p class="font-bold text-[#C1121F] flex items-center gap-1">
                  <span class="material-icons text-xs">favorite</span>
                  <span>القيم المستهدفة :</span>
                </p>
                <p class="text-[#5B6B60] text-[10px] leading-tight">
                  {{ values().targetValues?.join('، ') || 'المواطنة والتعاون' }}
                </p>
              </div>
            </div>

          </div>

          <!-- Right Column (7 cols): Lesson Stages Timeline (01-05) -->
          <div class="lg:col-span-7 space-y-2.5 text-xs">
            <div class="flex items-center justify-between border-b-2 border-[#2D6A4F] pb-1.5">
              <div class="flex items-center gap-2 font-display font-bold text-sm text-[#14251D]">
                <span class="material-icons text-base text-[#2D6A4F]">view_timeline</span>
                <span>سيرورة ومراحل الدرس التفاعلي (01 ➔ 05)</span>
              </div>
              <span class="text-[10px] text-[#5B6B60]">المجموع: {{ totalStageMinutes() }} دقيقة</span>
            </div>

            <div class="space-y-2.5">
              @for (st of values().stages; track st.step) {
                <div class="bg-white rounded-xl border border-[#E7DFCF] p-3 space-y-2 relative overflow-hidden">
                  <!-- Stage Header -->
                  <div class="flex items-center justify-between gap-2 border-b border-[#F2ECDE] pb-1.5">
                    <div class="flex items-center gap-2">
                      <span class="w-6 h-6 rounded-lg bg-[#14251D] text-[#FBF8F1] font-display font-bold text-[10px] flex items-center justify-center shrink-0">
                        {{ st.step }}
                      </span>
                      <span class="font-bold text-[#14251D] text-xs">{{ st.name }}</span>
                    </div>
                    <span class="bg-[#2D6A4F]/10 text-[#1B4332] font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#2D6A4F]/20">
                      {{ st.minutes }} د
                    </span>
                  </div>

                  <!-- Activities -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] leading-relaxed">
                    <div class="bg-[#FBF8F1] p-2 rounded-lg border border-[#E7DFCF]">
                      <span class="font-bold text-[#2D6A4F] block text-[10px] mb-0.5">🔹 دور المعلم :</span>
                      <span class="text-[#4A5A50]">{{ st.teacherActivity }}</span>
                    </div>
                    <div class="bg-[#FBF8F1] p-2 rounded-lg border border-[#E7DFCF]">
                      <span class="font-bold text-[#8A5A00] block text-[10px] mb-0.5">🔸 نشاط المتعلم :</span>
                      <span class="text-[#4A5A50]">{{ st.studentActivity }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

        </div>

        <!-- Section 3: Differentiation & Assessment Table -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
          <!-- Differentiation (Remédiation / Approfondissement) -->
          <div class="bg-white rounded-xl border border-[#E7DFCF] p-3.5 space-y-2">
            <p class="font-bold text-[#8A5A00] flex items-center gap-1.5 border-b border-[#F2ECDE] pb-1">
              <span class="material-icons text-sm">diversity_3</span>
              <span>الفارق البيداغوجي (علاج وإثراء) :</span>
            </p>
            <div class="space-y-1.5 text-[11px]">
              <p><strong class="text-[#BF5B34]">أنشطة الدعم والعلاج :</strong> {{ values().supportActivities?.join(' • ') }}</p>
              <p><strong class="text-[#2D6A4F]">أنشطة التميز والإثراء :</strong> {{ values().enrichmentActivities?.join(' • ') }}</p>
            </div>
          </div>

          <!-- Assessment Criteria -->
          <div class="bg-white rounded-xl border border-[#E7DFCF] p-3.5 space-y-2">
            <p class="font-bold text-[#2D6A4F] flex items-center gap-1.5 border-b border-[#F2ECDE] pb-1">
              <span class="material-icons text-sm">fact_check</span>
              <span>معايير التقييم والعمل المنزلي :</span>
            </p>
            <div class="space-y-1.5 text-[11px]">
              <p><strong class="text-[#14251D]">مؤشرات النجاح :</strong> {{ values().assessmentCriteria?.join(' • ') }}</p>
              <p><strong class="text-[#8A5A00]">العمل المنزلي :</strong> {{ values().homework?.join(' • ') || 'تطبيق فردي بكراس التمارين' }}</p>
            </div>
          </div>
        </div>

        <!-- Section 4: Teacher Self-Reflection with lines (التقييم الذاتي والملاحظات) -->
        <div class="bg-[#FBF8F1] rounded-xl border border-[#E7DFCF] p-3.5 space-y-2 text-xs">
          <p class="font-bold text-[#14251D] flex items-center gap-1.5">
            <span class="material-icons text-sm text-[#2D6A4F]">psychology_alt</span>
            <span>التقييم الذاتي للمعلم وملاحظات التعديل اللاحق :</span>
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] text-[#5B6B60]">
            @for (q of values().reflectionQuestions; track $index) {
              <div class="border-b border-[#E7DFCF] pb-1">
                <p class="font-medium text-[#14251D]">❓ {{ q }}</p>
                <div class="h-4 border-b border-dashed border-[#CBD9E2] mt-0.5"></div>
              </div>
            }
          </div>
        </div>

        <!-- Official Footer -->
        <div class="border-t border-[#14251D] pt-3 flex items-center justify-between text-[11px] text-[#5B6B60]">
          <div>
            <span>من إعداد المعلم(ة) : </span>
            <strong class="text-[#14251D]">{{ doc().author?.name || 'مدرستي تونس' }}</strong>
            @if (doc().author?.school) {
              <span> — {{ doc().author?.school }}</span>
            }
          </div>

          <div class="flex items-center gap-3">
            <span>تأشيرة المفتش / المدير : ____________</span>
            <span class="font-mono text-[10px]">Madrasati TN ©</span>
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    @media print {
      :host {
        display: block;
        width: 100%;
        background: white !important;
      }
      .infographic-container {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .a4-portrait-sheet {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        min-height: auto !important;
      }
    }
  `],
})
export class InfographicPageComponent {
  readonly lang = inject(LanguageService);
  private readonly printSvc = inject(PrintService);

  readonly doc = input.required<InfographicDoc>();
  readonly isEditing = signal<boolean>(false);

  readonly values = computed<LessonPlanDocValues>(() => {
    return (this.doc().values as LessonPlanDocValues) || {
      objectives: [],
      outcomes: [],
      materials: [],
      stages: [],
      assessmentCriteria: [],
      supportActivities: [],
      enrichmentActivities: [],
      crossSubjectIntegration: [],
      targetValues: [],
      homework: [],
      reflectionQuestions: [],
    };
  });

  readonly totalStageMinutes = computed<number>(() => {
    return (this.values().stages || []).reduce((sum, st) => sum + (st.minutes || 0), 0);
  });

  toggleEdit() {
    this.isEditing.update((v) => !v);
  }

  printDoc() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
