import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { InfographicDoc, LanguageService, LessonPlanDocValues } from '@core';

@Component({
  selector: 'app-infographic-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="infographic-container w-full max-w-[850px] mx-auto space-y-4">
      
      <!-- Toolbar (Screen Only) -->
      <div class="flex items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-[#E7DFCF] print:hidden ">
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
            (click)="shareDoc()"
            class="px-4 py-1.5 rounded-xl bg-white hover:bg-[#F4F6F5] border border-[#E7DFCF] text-[#14251D] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
            <span class="material-icons text-sm">{{ shareCopied() ? 'check' : 'share' }}</span>
            <span>{{ shareCopied() ? lang.tr('Lien copié ✓', 'تم نسخ الرابط ✓') : lang.tr('Partager', 'مشاركة') }}</span>
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
        [attr.dir]="doc().language === 'fr' ? 'ltr' : 'rtl'"
        [attr.lang]="doc().language"
        class="print-sheet bg-white rounded-[28px] border border-[#E7DFCF] p-6 sm:p-10 text-[#14251D] space-y-6 shadow-sm min-h-[1100px] relative">
        
        <!-- Top Institutional Ministry Cartouche -->
        <div class="border-b-2 border-[#14251D] pb-4 flex items-center justify-between gap-4">
          <div class="text-start space-y-0.5 text-xs">
            <p class="font-display font-semibold text-[#14251D] text-sm">{{ t('République Tunisienne', 'الجمهورية التونسية') }}</p>
            <p class="text-[#5B6B60] text-xs">{{ t('Ministère de l’Éducation', 'وزارة التربية') }}</p>
            <p class="text-[#5B6B60] text-xs">{{ t('Enseignement primaire', 'المرحلة الابتدائية') }}@if (doc().author?.schoolYear) { — {{ doc().author?.schoolYear }} }</p>
          </div>

          <div class="text-center space-y-1">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#14251D] text-[#FBF8F1] font-display font-semibold text-xs">
              <span class="material-icons text-sm text-[#F2C14E]">school</span>
              <span>{{ t('Fiche pédagogique', 'جذاذة بيداغوجية') }}</span>
            </div>
            <h2 class="font-display font-semibold text-lg text-[#14251D] tracking-tight">
              {{ doc().title || values().topic }}
            </h2>
          </div>

          <div class="text-left flex flex-col items-end">
            <span class="tn-seal w-10 h-10 shrink-0" aria-hidden="true"></span>
            <span class="text-[11px] text-[#5B6B60] mt-1 font-mono">MADRASATI-TN</span>
          </div>
        </div>

        <!-- 1. Info Strip (المعطيات العامة) -->
        <div class="bg-[#FBF8F1] border border-[#E7DFCF] rounded-2xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div class="flex items-center gap-2">
            <span class="material-icons text-sm text-[#2D6A4F]">class</span>
            <div>
              <p class="text-[11px] text-[#5B6B60]">{{ t('Niveau', 'المستوى') }}</p>
              <p class="font-semibold text-[#14251D]">{{ doc().grade }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="material-icons text-sm text-[#8A5A00]">menu_book</span>
            <div>
              <p class="text-[11px] text-[#5B6B60]">{{ t('Matière', 'المادة') }}</p>
              <p class="font-semibold text-[#14251D]">{{ doc().subject }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="material-icons text-sm text-[#BF5B34]">timer</span>
            <div>
              <p class="text-[11px] text-[#5B6B60]">{{ t('Durée', 'المدة') }}</p>
              <p class="font-semibold text-[#14251D]">{{ values().durationMinutes || 45 }} {{ t('min', 'دقيقة') }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="material-icons text-sm text-[#14251D]">calendar_today</span>
            <div>
              <p class="text-[11px] text-[#5B6B60]">{{ t('Semaine / date', 'الأسبوع / التاريخ') }}</p>
              <p class="font-semibold text-[#14251D]">{{ values().week || '…………' }}</p>
            </div>
          </div>
        </div>

        <!-- Main 2-Column Grid: Pedagogy Frame & Stages Timeline -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          <!-- Left Column (4 cols): Objectives, Outcomes, Materials, Values -->
          <div class="lg:col-span-5 space-y-4 text-xs">
            <!-- Objectives -->
            <div class="bg-white rounded-xl border border-[#E7DFCF] p-3.5 space-y-2">
              <div class="flex items-center gap-1.5 text-[#2D6A4F] font-semibold border-b border-[#F2ECDE] pb-1.5">
                <span class="material-icons text-sm">flag</span>
                <span>{{ t('Objectifs', 'الأهداف المميزة للدرس') }}</span>
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
              <div class="flex items-center gap-1.5 text-[#1B4332] font-semibold border-b border-[#F2ECDE] pb-1.5">
                <span class="material-icons text-sm">task_alt</span>
                <span>{{ t('Compétences visées', 'مخرجات التعلم والكفايات') }}</span>
              </div>
              <ul class="space-y-1 text-[#4A5A50] leading-relaxed">
                @for (out of values().outcomes; track $index) {
                  <li class="flex items-start gap-1.5">
                    <span class="text-[#1B4332] font-semibold" aria-hidden="true">•</span>
                    <span>{{ out }}</span>
                  </li>
                }
              </ul>
            </div>

            <!-- Teaching Materials -->
            <div class="bg-[#FBF8F1] rounded-xl border border-[#E7DFCF] p-3 space-y-1.5">
              <p class="font-semibold text-[#8A5A00] flex items-center gap-1 text-[11px]">
                <span class="material-icons text-xs">inventory_2</span>
                <span>{{ t('Matériel', 'الوسائل والمعينات') }}</span>
              </p>
              <div class="flex flex-wrap gap-1">
                @for (mat of values().materials; track $index) {
                  <span class="bg-white px-2 py-0.5 rounded-md border border-[#E7DFCF] text-[11px] text-[#5B6B60]">
                    {{ mat }}
                  </span>
                }
              </div>
            </div>

            <!-- Cross-Subject & Values -->
            <div class="grid grid-cols-2 gap-2 text-[11px]">
              <div class="bg-white p-2.5 rounded-xl border border-[#E7DFCF] space-y-1">
                <p class="font-semibold text-[#14251D] flex items-center gap-1">
                  <span class="material-icons text-xs text-[#2D6A4F]">hub</span>
                  <span>{{ t('Intégration', 'الامتدادات') }}</span>
                </p>
                <p class="text-[#5B6B60] text-[11px] leading-tight">
                  {{ values().crossSubjectIntegration.join(', ') }}
                </p>
              </div>

              <div class="bg-white p-2.5 rounded-xl border border-[#E7DFCF] space-y-1">
                <p class="font-semibold text-[#14251D] flex items-center gap-1">
                  <span class="material-icons text-xs text-[#BF5B34]">favorite</span>
                  <span>{{ t('Valeurs', 'القيم المستهدفة') }}</span>
                </p>
                <p class="text-[#5B6B60] text-[11px] leading-tight">
                  {{ values().targetValues.join(', ') }}
                </p>
              </div>
            </div>

          </div>

          <!-- Right Column (7 cols): Lesson Stages Timeline (01-05) -->
          <div class="lg:col-span-7 space-y-2.5 text-xs">
            <div class="flex items-center justify-between border-b-2 border-[#2D6A4F] pb-1.5">
              <div class="flex items-center gap-2 font-display font-semibold text-sm text-[#14251D]">
                <span class="material-icons text-base text-[#2D6A4F]">view_timeline</span>
                <span>{{ t('Déroulement de la séance', 'سيرورة الدرس') }}</span>
              </div>
              <span class="text-[11px] text-[#5B6B60]">{{ t('Total', 'المجموع') }}: {{ totalStageMinutes() }} {{ t('min', 'دقيقة') }}</span>
            </div>

            <div class="space-y-2.5">
              @for (st of values().stages; track st.step) {
                <div class="avoid-break bg-white rounded-xl border border-[#E7DFCF] p-3 space-y-2 relative overflow-hidden">
                  <!-- Stage Header -->
                  <div class="flex items-center justify-between gap-2 border-b border-[#F2ECDE] pb-1.5">
                    <div class="flex items-center gap-2">
                      <span class="w-6 h-6 rounded-lg bg-[#14251D] text-[#FBF8F1] font-display font-semibold text-[11px] flex items-center justify-center shrink-0">
                        {{ st.step }}
                      </span>
                      <span class="font-semibold text-[#14251D] text-xs">{{ st.name }}</span>
                    </div>
                    <span class="bg-[#2D6A4F]/10 text-[#1B4332] font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full border border-[#2D6A4F]/20">
                      {{ st.minutes }} {{ t('min', 'د') }}
                    </span>
                  </div>

                  <!-- Activities -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] leading-relaxed">
                    <div class="bg-[#FBF8F1] p-2 rounded-lg border border-[#E7DFCF]">
                      <span class="font-semibold text-[#2D6A4F] flex items-center gap-1 text-[11px] mb-0.5"><span class="material-icons text-xs" aria-hidden="true">school</span>{{ t('Activité du maître', 'دور المعلم') }}</span>
                      <span class="text-[#4A5A50]">{{ st.teacherActivity }}</span>
                    </div>
                    <div class="bg-[#FBF8F1] p-2 rounded-lg border border-[#E7DFCF]">
                      <span class="font-semibold text-[#8A5A00] flex items-center gap-1 text-[11px] mb-0.5"><span class="material-icons text-xs" aria-hidden="true">edit</span>{{ t('Activité de l’élève', 'نشاط المتعلم') }}</span>
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
            <p class="font-semibold text-[#8A5A00] flex items-center gap-1.5 border-b border-[#F2ECDE] pb-1">
              <span class="material-icons text-sm">diversity_3</span>
              <span>{{ t('Différenciation', 'الفارق البيداغوجي') }}</span>
            </p>
            <div class="space-y-1.5 text-[11px]">
              <p><strong class="text-[#BF5B34]">{{ t('Remédiation :', 'الدعم والعلاج :') }}</strong> {{ values().supportActivities.join(' • ') }}</p>
              <p><strong class="text-[#2D6A4F]">{{ t('Approfondissement :', 'التميز والإثراء :') }}</strong> {{ values().enrichmentActivities.join(' • ') }}</p>
            </div>
          </div>

          <!-- Assessment Criteria -->
          <div class="bg-white rounded-xl border border-[#E7DFCF] p-3.5 space-y-2">
            <p class="font-semibold text-[#2D6A4F] flex items-center gap-1.5 border-b border-[#F2ECDE] pb-1">
              <span class="material-icons text-sm">fact_check</span>
              <span>{{ t('Évaluation et travail à la maison', 'التقييم والعمل المنزلي') }}</span>
            </p>
            <div class="space-y-1.5 text-[11px]">
              <p><strong class="text-[#14251D]">{{ t('Critères de réussite :', 'مؤشرات النجاح :') }}</strong> {{ values().assessmentCriteria.join(' • ') }}</p>
              <p><strong class="text-[#8A5A00]">{{ t('À la maison :', 'العمل المنزلي :') }}</strong> {{ values().homework.join(' • ') }}</p>
            </div>
          </div>
        </div>

        <!-- Section 4: Teacher Self-Reflection with lines (التقييم الذاتي والملاحظات) -->
        <div class="bg-[#FBF8F1] rounded-xl border border-[#E7DFCF] p-3.5 space-y-2 text-xs">
          <p class="font-semibold text-[#14251D] flex items-center gap-1.5">
            <span class="material-icons text-sm text-[#2D6A4F]">psychology_alt</span>
            <span>{{ t('Auto-évaluation de l’enseignant', 'التقييم الذاتي للمعلم') }}</span>
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-[#5B6B60]">
            @for (q of values().reflectionQuestions; track $index) {
              <div class="avoid-break border-b border-[#E7DFCF] pb-1">
                <p class="font-medium text-[#14251D]">{{ q }}</p>
                <div class="h-5 border-b border-dashed border-[#E7DFCF] mt-0.5"></div>
              </div>
            }
          </div>
        </div>

        <!-- Official Footer -->
        <div class="border-t border-[#14251D] pt-3 flex items-center justify-between text-[11px] text-[#5B6B60]">
          <div>
            <span>{{ t('Réalisé par : ', 'من إنجاز : ') }}</span>
            <strong class="text-[#14251D]">{{ doc().author?.name || 'Madrasati TN' }}</strong>
            @if (doc().author?.school) {
              <span> — {{ doc().author?.school }}</span>
            }
          </div>

          <div class="flex items-center gap-3">
            <span>{{ t('Visa : ____________', 'التأشيرة : ____________') }}</span>
            <span class="font-mono text-[11px]">Madrasati TN</span>
          </div>
        </div>

      </div>

    </div>
  `,
})
export class InfographicPageComponent {
  readonly lang = inject(LanguageService);

  readonly doc = input.required<InfographicDoc>();
  readonly shareCopied = signal(false);

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

  t(fr: string, ar: string): string {
    return this.doc().language === 'fr' ? fr : ar;
  }

  async shareDoc() {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/lesson-plan/${this.doc().id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: this.doc().title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      this.shareCopied.set(true);
      setTimeout(() => this.shareCopied.set(false), 2500);
    } catch {
      // user cancelled the share sheet or clipboard denied
    }
  }

  printDoc() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
