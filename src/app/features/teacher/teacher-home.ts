import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { EducationStore, LanguageService, FirebaseService, Announcement, Course, Homework, SubjectName, Submission } from '@core';

export interface GeneratedExerciseResult {
  title: string;
  promptText: string;
  solutionText: string;
  hints?: string[];
  points?: number;
}

@Component({
  selector: 'app-teacher-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="space-y-6">
      
      <!-- Welcome Header: "Cartouche officielle" institutional hero -->
      <div class="rounded-[24px] bg-[#0B2947] text-white p-7 sm:p-9 shadow-sm">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1.5 text-[#8CA9C4] text-xs font-medium">
                <span class="material-icons text-sm text-[#E0AA32]">verified</span>
                {{ lang.tr('Enseignante Certifiée — Éducation Nationale', 'معلمة معتمدة — وزارة التربية والتعليم') }}
              </span>

              <button
                (click)="teacherProfileModal.set(true)"
                class="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer">
                <span class="material-icons text-sm text-[#E0AA32]">badge</span>
                <span>{{ lang.tr('Mon Profil Public (4.9/5)', 'ملفي المهني (4.9/5)') }}</span>
              </button>
            </div>

            <div>
              <h1 class="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                {{ teacherGreeting() }}
              </h1>
              <p class="text-[#D7E7F2] text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                {{ teacherHeaderSub() }}
                <span class="font-semibold text-white underline decoration-[#E0AA32] underline-offset-4">{{ store.activeClass().name }}</span>
                — {{ store.activeClass().schoolName }}.
              </p>
            </div>
          </div>

          <!-- Quick Actions Bar -->
          <div class="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              (click)="openModal('announcement')"
              class="flex items-center gap-1.5 bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold px-4 py-2.5 rounded-[10px] text-xs transition-colors cursor-pointer shadow-sm">
              <span class="material-icons text-base">campaign</span>
              {{ lang.t('addAnnouncementBtn') }}
            </button>

            <button
              (click)="openModal('course')"
              class="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white font-semibold px-4 py-2.5 rounded-[10px] text-xs border border-white/15 transition-colors cursor-pointer">
              <span class="material-icons text-base">cloud_upload</span>
              {{ lang.t('addCourseBtn') }}
            </button>

            <button
              (click)="openModal('homework')"
              class="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white font-semibold px-4 py-2.5 rounded-[10px] text-xs border border-white/15 transition-colors cursor-pointer">
              <span class="material-icons text-base">assignment</span>
              {{ lang.t('addHomeworkBtn') }}
            </button>

            <button
              (click)="openModal('ai')"
              class="flex items-center gap-1.5 bg-[#E0AA32] hover:bg-[#D19A24] text-[#102A43] font-semibold px-4 py-2.5 rounded-[10px] text-xs transition-colors cursor-pointer shadow-sm">
              <span class="material-icons text-base">auto_awesome</span>
              {{ lang.t('aiAssistantBtn') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Class Metric Cards & Quick Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-[#0E1D2A] rounded-[18px] border border-[#E3ECF2] dark:border-[#1A3145] shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col">
          <div class="h-1.5 bg-[#007CC2]"></div>
          <div class="p-5 flex flex-col justify-between grow">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-[#102A43] dark:text-white">{{ lang.t('statStudents') }}</span>
              <div class="w-8 h-8 rounded-lg bg-[#E8F5FC] dark:bg-[#102A43] text-[#007CC2] flex items-center justify-center">
                <span class="material-icons text-lg">groups</span>
              </div>
            </div>
            <div>
              <p class="font-display text-3xl font-semibold text-[#102A43] dark:text-white tracking-tight">{{ store.activeClass().studentCount }}</p>
              <p class="text-[11px] text-[#486581] dark:text-[#8CA9C4] font-medium mt-1 flex items-center gap-1">
                <span class="material-icons text-xs text-[#007CC2]">done_all</span>
                {{ lang.tr('100% inscrits dans la classe', 'مسجلون بالكامل في القسم') }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-[#0E1D2A] rounded-[18px] border border-[#E3ECF2] dark:border-[#1A3145] shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col">
          <div class="h-1.5 bg-[#23845B]"></div>
          <div class="p-5 flex flex-col justify-between grow">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-[#102A43] dark:text-white">{{ lang.t('statSubmissions') }}</span>
              <div class="w-8 h-8 rounded-lg bg-[#E8F6EF] dark:bg-[#153B2D] text-[#23845B] flex items-center justify-center">
                <span class="material-icons text-lg">fact_check</span>
              </div>
            </div>
            <div>
              <p class="font-display text-3xl font-semibold text-[#102A43] dark:text-white tracking-tight">{{ store.submissions().length }}</p>
              <p class="text-[11px] text-[#486581] dark:text-[#8CA9C4] font-medium mt-1 flex items-center gap-1">
                <span class="material-icons text-xs text-[#23845B]">pending_actions</span>
                {{ lang.tr('Soumissions reçues', 'تطبيقات مستلمة للتقييم') }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-[#0E1D2A] rounded-[18px] border border-[#E3ECF2] dark:border-[#1A3145] shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col">
          <div class="h-1.5 bg-[#D19A24]"></div>
          <div class="p-5 flex flex-col justify-between grow">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-[#102A43] dark:text-white">{{ lang.t('statViews') }}</span>
              <div class="w-8 h-8 rounded-lg bg-[#FFF4D8] dark:bg-[#3D2E10] text-[#D19A24] flex items-center justify-center">
                <span class="material-icons text-lg">visibility</span>
              </div>
            </div>
            <div>
              <p class="font-display text-3xl font-semibold text-[#102A43] dark:text-white tracking-tight">342</p>
              <p class="text-[11px] text-[#486581] dark:text-[#8CA9C4] font-medium mt-1 flex items-center gap-1">
                <span class="material-icons text-xs text-[#D19A24]">trending_up</span>
                {{ lang.tr('+18% cette semaine', '+18% هذا الأسبوع') }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-[#0E1D2A] rounded-[18px] border border-[#E3ECF2] dark:border-[#1A3145] shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col">
          <div class="h-1.5 bg-[#D64545]"></div>
          <div class="p-5 flex flex-col justify-between grow">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-[#102A43] dark:text-white">{{ lang.t('statConfirmations') }}</span>
              <div class="w-8 h-8 rounded-lg bg-[#FDECEC] dark:bg-[#3D1414] text-[#D64545] flex items-center justify-center">
                <span class="material-icons text-lg">verified_user</span>
              </div>
            </div>
            <div>
              <p class="font-display text-3xl font-semibold text-[#102A43] dark:text-white tracking-tight">24 <span class="text-[#829AB1] text-lg">/ 28</span></p>
              <p class="text-[11px] text-[#486581] dark:text-[#8CA9C4] font-medium mt-1 flex items-center gap-1">
                <span class="material-icons text-xs text-[#D64545]">check_circle</span>
                {{ lang.tr("86% accusés de lecture", '86% نسبة اطلاع الأولياء') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Class Content Tabs -->
      <div class="bg-white dark:bg-[#0E1D2A] rounded-[24px] border border-[#E3ECF2] dark:border-[#1A3145] overflow-hidden shadow-xs">

        <!-- Tab Bar Header -->
        <div class="border-b border-[#E3ECF2] dark:border-[#1A3145] bg-[#F7F9FB] dark:bg-[#152737] px-6 pt-3 flex flex-wrap gap-2">
          <button
            (click)="activeTab.set('announcements')"
            [class]="activeTab() === 'announcements' ? 'border-[#007CC2] text-[#007CC2] bg-white dark:bg-[#0E1D2A] font-semibold shadow-xs' : 'border-transparent text-[#486581] dark:text-[#8CA9C4] font-medium hover:text-[#007CC2]'"
            class="px-4 py-3 border-b-2 text-xs flex items-center gap-2 transition-all cursor-pointer rounded-t-lg">
            <span class="material-icons text-base">campaign</span>
            <span>{{ lang.t('tabAnnouncements') }} ({{ store.classAnnouncements().length }})</span>
          </button>

          <button
            (click)="activeTab.set('courses')"
            [class]="activeTab() === 'courses' ? 'border-[#007CC2] text-[#007CC2] bg-white dark:bg-[#0E1D2A] font-semibold shadow-xs' : 'border-transparent text-[#486581] dark:text-[#8CA9C4] font-medium hover:text-[#007CC2]'"
            class="px-4 py-3 border-b-2 text-xs flex items-center gap-2 transition-all cursor-pointer rounded-t-lg">
            <span class="material-icons text-base">menu_book</span>
            <span>{{ lang.t('tabCourses') }} ({{ store.classCourses().length }})</span>
          </button>

          <button
            (click)="activeTab.set('homeworks')"
            [class]="activeTab() === 'homeworks' ? 'border-[#007CC2] text-[#007CC2] bg-white dark:bg-[#0E1D2A] font-semibold shadow-xs' : 'border-transparent text-[#486581] dark:text-[#8CA9C4] font-medium hover:text-[#007CC2]'"
            class="px-4 py-3 border-b-2 text-xs flex items-center gap-2 transition-all cursor-pointer rounded-t-lg">
            <span class="material-icons text-base">assignment</span>
            <span>{{ lang.t('tabHomeworks') }} ({{ store.classHomeworks().length }})</span>
          </button>

          <button
            (click)="activeTab.set('submissions')"
            [class]="activeTab() === 'submissions' ? 'border-[#007CC2] text-[#007CC2] bg-white dark:bg-[#0E1D2A] font-semibold shadow-xs' : 'border-transparent text-[#486581] dark:text-[#8CA9C4] font-medium hover:text-[#007CC2]'"
            class="px-4 py-3 border-b-2 text-xs flex items-center gap-2 transition-all cursor-pointer rounded-t-lg">
            <span class="material-icons text-base">rate_review</span>
            <span>{{ lang.t('tabSubmissions') }} ({{ store.submissions().length }})</span>
          </button>
        </div>

        <!-- Tab Body -->
        <div class="p-6">
          
          <!-- TAB 1: ANNOUNCEMENTS -->
          @if (activeTab() === 'announcements') {
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-display font-semibold text-[#14251D]">
                    {{ lang.tr('Annonces diffusées aux parents et élèves', 'البلاغات الموجهة للأولياء والتلاميذ') }}
                  </h3>
                  <p class="text-xs text-[#5B6B60]">
                    {{ lang.tr('Chaque annonce est datée, archivée et traçable.', 'كل إعلان مؤرخ وموثق ومنظم.') }}
                  </p>
                </div>
                <button
                  (click)="openModal('announcement')"
                  class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm">
                  <span class="material-icons text-sm">add</span> {{ lang.t('addAnnouncementBtn') }}
                </button>
              </div>

              @for (a of store.classAnnouncements(); track a.id) {
                <div class="bg-[#FBF8F1] rounded-2xl p-5 border border-[#E7DFCF] space-y-3 relative hover:border-[#D8CEB8] transition-colors">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex items-center gap-3">
                      <img [src]="a.teacherAvatar" alt="Teacher" class="w-10 h-10 rounded-full object-cover border border-[#E7DFCF]" />
                      <div>
                        <div class="flex items-center gap-2">
                          <h4 class="font-display font-semibold text-[#14251D] text-sm">{{ a.title }}</h4>
                          @if (a.isPinned) {
                            <span class="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span class="material-icons text-[12px]">push_pin</span>
                              {{ lang.tr('Épinglé', 'مثبت') }}
                            </span>
                          }
                        </div>
                        <p class="text-[11px] text-[#5B6B60] font-medium">{{ a.teacherName }} • {{ a.date }}</p>
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      <span [class]="getCategoryBadgeClass(a.category)" class="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {{ a.category }}
                      </span>
                    </div>
                  </div>

                  <p class="text-xs text-[#4A5A50] leading-relaxed whitespace-pre-line bg-white p-3.5 rounded-xl border border-[#E7DFCF] font-sans">
                    {{ a.content }}
                  </p>

                  <div class="flex items-center justify-between text-xs text-[#5B6B60] pt-1">
                    <span class="flex items-center gap-1 text-[#1B4332] font-medium">
                      <span class="material-icons text-sm">check_circle</span>
                      {{ a.confirmedByParentsCount }} {{ lang.tr('parents ont confirmé la lecture', 'أولياء أكدوا اطلاعهم') }}
                    </span>

                    <span class="text-[11px] text-[#6B7A70]">
                      {{ lang.tr('Visibilité : Parents + Élèves de la classe', 'النطاق: أولياء وتلاميذ الفصل') }}
                    </span>
                  </div>
                </div>
              }
            </div>
          }

          <!-- TAB 2: COURSES -->
          @if (activeTab() === 'courses') {
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-display font-semibold text-[#14251D]">{{ lang.t('tabCourses') }}</h3>
                  <p class="text-xs text-[#5B6B60]">
                    {{ lang.tr("Un espace structuré par chapitre avec filigrane officiel et impression PDF immédiate.", 'مساحة منظمة بالفيليغران الرسمي وإمكانية الطباعة المباشرة بصيغة PDF.') }}
                  </p>
                </div>
                <button
                  (click)="openModal('course')"
                  class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm">
                  <span class="material-icons text-sm">add</span> {{ lang.t('addCourseBtn') }}
                </button>
              </div>

              <div class="grid md:grid-cols-2 gap-4">
                @for (c of store.classCourses(); track c.id) {
                  <div class="bg-[#FBF8F1] rounded-2xl p-5 border border-[#E7DFCF] flex flex-col justify-between space-y-3 hover:border-[#2D6A4F]/40 transition-colors">
                    <div class="space-y-2">
                      <div class="flex items-center justify-between">
                        <span class="bg-[#1B4332]/10 text-[#1B4332] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {{ c.subject }}
                        </span>
                        <span class="text-[11px] text-[#6B7A70]">{{ c.createdAt }}</span>
                      </div>
                      <h4 class="font-display font-semibold text-[#14251D] text-sm leading-snug">{{ c.title }}</h4>
                      <p class="text-xs text-[#5B6B60] line-clamp-2">{{ c.summary }}</p>

                      @if (c.pdfUrl) {
                        <div class="inline-flex items-center gap-1 text-[11px] text-[#1B4332] font-semibold bg-[#1B4332]/8 px-2 py-0.5 rounded border border-[#E7DFCF]">
                          <span class="material-icons text-xs">picture_as_pdf</span>
                          <span>Fichier PDF / Document joint</span>
                        </div>
                      }
                    </div>

                    <div class="pt-3 border-t border-[#E7DFCF] flex items-center justify-between gap-2">
                      <div class="flex items-center gap-1">
                        <button
                          (click)="openPrintCourseModal(c)"
                          class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-sm">
                          <span class="material-icons text-xs">print</span>
                          {{ lang.tr('Imprimer PDF', 'طباعة PDF') }}
                        </button>
                      </div>

                      <button
                        (click)="selectedCourseDetail.set(c)"
                        class="text-xs font-semibold text-[#14251D] hover:text-[#1B4332] flex items-center gap-1 cursor-pointer">
                        {{ lang.tr('Consulter', 'قراءة') }} <span class="material-icons text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- TAB 3: HOMEWORKS -->
          @if (activeTab() === 'homeworks') {
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-display font-semibold text-[#14251D]">{{ lang.t('tabHomeworks') }}</h3>
                  <p class="text-xs text-[#5B6B60]">
                    {{ lang.tr('Définissez les exercices, la date limite et recevez les réponses des élèves.', 'حدد التمارين والموعد واستلم إنجازات التلاميذ.') }}
                  </p>
                </div>
                <button
                  (click)="openModal('homework')"
                  class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm">
                  <span class="material-icons text-sm">add</span> {{ lang.t('addHomeworkBtn') }}
                </button>
              </div>

              @for (hw of store.classHomeworks(); track hw.id) {
                <div class="bg-[#FBF8F1] rounded-2xl p-5 border border-[#E7DFCF] space-y-4">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7DFCF] pb-3">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="bg-[#8A5A00]/10 text-[#8A5A00] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {{ hw.subject }}
                        </span>
                        <h4 class="font-display font-semibold text-[#14251D] text-sm">{{ hw.title }}</h4>
                      </div>
                      <p class="text-xs text-[#5B6B60] mt-1">
                        {{ lang.tr('À rendre pour :', 'أجل التسليم:') }} <span class="font-semibold text-[#BF5B34]">{{ hw.dueDate }}</span>
                      </p>
                    </div>

                    <div class="flex items-center gap-2">
                      <span class="text-xs text-[#4A5A50] font-medium bg-white px-3 py-1 rounded-xl border border-[#E7DFCF]">
                        {{ hw.submissionsCount }} / 28 {{ lang.tr('rendus', 'مستلم') }}
                      </span>
                    </div>
                  </div>

                  <!-- Exercise Items List inside Homework -->
                  <div class="space-y-2">
                    <p class="text-xs font-semibold text-[#14251D]">
                      {{ lang.tr('Liste des exercices inclus :', 'قائمة التمارين المرفقة:') }}
                    </p>
                    <div class="grid gap-2">
                      @for (ex of hw.exercises; track ex.id) {
                        <div class="bg-white p-3 rounded-xl border border-[#E7DFCF] text-xs space-y-1">
                          <div class="flex items-center justify-between">
                            <span class="font-semibold text-[#14251D]">{{ ex.title }}</span>
                            <span class="text-[11px] text-[#1B4332] font-semibold">{{ ex.points }} {{ lang.tr('points', 'نقاط') }}</span>
                          </div>
                          <p class="text-[#5B6B60] italic">"{{ ex.promptText }}"</p>
                          <div class="text-[11px] text-[#5B6B60] pt-1">
                            <span class="font-semibold text-[#14251D]">{{ lang.tr('Corrigé enseignant :', 'إصلاح المعلم:') }}</span> {{ ex.solutionText }}
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- TAB 4: SUBMISSIONS (CORRECTIONS) -->
          @if (activeTab() === 'submissions') {
            <div class="space-y-4">
              <div>
                <h3 class="font-display font-semibold text-[#14251D]">
                  {{ lang.tr("Travaux et photos d'exercices reçus", 'التطبيقات والمحاولات المستلمة من التلاميذ') }}
                </h3>
                <p class="text-xs text-[#5B6B60]">
                  {{ lang.tr('Consultez les réponses saisies ou les photos de cahiers envoyées par les élèves et attribuez une note avec remarque.', 'راجع كتابات التلاميذ أو صور كراساتهم وسجل التقييم والترديد.') }}
                </p>
              </div>

              @for (sub of store.submissions(); track sub.id) {
                <div class="bg-[#FBF8F1] rounded-2xl p-5 border border-[#E7DFCF] space-y-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <img [src]="sub.studentAvatar" alt="Student" class="w-10 h-10 rounded-full object-cover border border-[#E7DFCF]" />
                      <div>
                        <h4 class="font-display font-semibold text-[#14251D] text-sm">{{ sub.studentName }}</h4>
                        <p class="text-[11px] text-[#5B6B60]">{{ lang.tr('Soumis le', 'تم الإرسال بتاريخ') }} {{ sub.submittedAt }}</p>
                      </div>
                    </div>

                    @if (sub.status === 'graded') {
                      <span class="bg-[#1B4332]/10 text-[#1B4332] font-semibold text-xs px-3 py-1 rounded-full">
                        {{ lang.tr('Note :', 'العدد:') }} {{ sub.score }} / {{ sub.maxScore }}
                      </span>
                    } @else {
                      <span class="bg-[#8A5A00]/10 text-[#8A5A00] font-semibold text-xs px-3 py-1 rounded-full">
                        {{ lang.tr('En attente de correction', 'في انتظار الاصلاح') }}
                      </span>
                    }
                  </div>

                  <div class="grid md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-[#E7DFCF] text-xs">
                    <div>
                      <p class="font-semibold text-[#14251D] mb-1">{{ lang.tr('Réponse rédigée :', 'الإجابة المكتوبة:') }}</p>
                      <p class="text-[#4A5A50] whitespace-pre-line">{{ sub.textAnswer || 'Aucune réponse texte.' }}</p>
                    </div>

                    @if (sub.photoUrl) {
                      <div>
                        <p class="font-semibold text-[#14251D] mb-1">{{ lang.tr('Photo du cahier :', 'صورة الكراسة:') }}</p>
                        <img [src]="sub.photoUrl" alt="Photo cahier" class="rounded-xl border border-[#E7DFCF] h-32 w-full object-cover" />
                      </div>
                    }
                  </div>

                  @if (sub.feedback) {
                    <div class="bg-[#1B4332]/8 text-[#1B4332] p-3 rounded-xl border border-[#E7DFCF] text-xs">
                      <span class="font-semibold">{{ lang.tr("Remarque transmise à l'élève :", 'ملاحظة المعلم للتلميذ:') }}</span> {{ sub.feedback }}
                    </div>
                  } @else {
                    <div class="flex items-center gap-2 pt-2">
                      <button
                        (click)="gradingSubmission.set(sub)"
                        class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer">
                        <span class="material-icons text-sm">edit</span> {{ lang.tr('Noter et Formuler un retour', 'إسناد عدد وتدوين ملاحظة') }}
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          }

        </div>
      </div>

    </div>

    <!-- MODAL 1: AI ASSISTANT MODAL FOR TEACHER -->
    @if (modalType() === 'ai') {
      <div class="fixed inset-0 z-50 bg-[#14251D]/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-[28px] max-w-2xl w-full p-6 space-y-5 border border-[#E7DFCF] shadow-sm max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-[#F2C14E] text-2xl">auto_awesome</span>
              <div>
                <h3 class="font-display font-semibold text-[#14251D] text-lg">
                  {{ lang.tr('Assistant Pédagogique IA Tunisie', 'المساعد البيداغوجي الذكي في تونس') }}
                </h3>
                <p class="text-xs text-[#5B6B60]">
                  {{ lang.tr("Générez un exercice sur-mesure ou une idée d'évaluation alignée au programme.", 'توليد تمارين واختبارات متطابقة مع البرنامج الرسمي.') }}
                </p>
              </div>
            </div>
            <button (click)="closeModal()" class="text-[#6B7A70] hover:text-[#14251D] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-4 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="ai-subject-select" class="block font-semibold text-[#14251D] mb-1">
                  {{ lang.tr('Matière', 'المادة') }}
                </label>
                <select
                  id="ai-subject-select"
                  [value]="aiFormSubject()"
                  (change)="onAiSubjectChange($event)"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-2.5 outline-none">
                  <option value="Mathématiques">Mathématiques / الرياضيات</option>
                  <option value="Français">Français / الفرنسية</option>
                  <option value="اللغة العربية">اللغة العربية</option>
                  <option value="Éveil Scientifique">Éveil Scientifique / الإيقاظ العلمي</option>
                </select>
              </div>

              <div>
                <label for="ai-difficulty-select" class="block font-semibold text-[#14251D] mb-1">
                  {{ lang.tr('Difficulté', 'درجة الصعوبة') }}
                </label>
                <select
                  id="ai-difficulty-select"
                  [value]="aiFormDifficulty()"
                  (change)="onAiDifficultyChange($event)"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-2.5 outline-none">
                  <option value="Facile">Facile / سهل</option>
                  <option value="Moyen">Moyen / متوسط</option>
                  <option value="Avancé">Avancé (Préparation Concours 6ème) / متقدم (مناظرة السادسة)</option>
                </select>
              </div>
            </div>

            <div>
              <label for="ai-topic-input" class="block font-semibold text-[#14251D] mb-1">
                {{ lang.tr('Thème / Chapitre précis', 'المحور أو الدرس') }}
              </label>
              <input
                id="ai-topic-input"
                type="text"
                [value]="aiFormTopic()"
                (input)="onAiTopicInput($event)"
                placeholder="Ex: La multiplication, الجملة الاسمية..."
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-2.5 outline-none" />
            </div>

            <button
              [disabled]="isAiLoading()"
              (click)="generateAiExercise()"
              class="w-full bg-[#F2C14E] hover:bg-[#e0b143] text-[#14251D] font-semibold py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50">
              @if (isAiLoading()) {
                <span class="material-icons animate-spin text-sm">sync</span>
                <span>{{ lang.tr("Génération par l'IA Gemini en cours...", 'جاري التوليد باستخدام الذكاء الاصطناعي...') }}</span>
              } @else {
                <span class="material-icons text-sm">auto_awesome</span>
                <span>{{ lang.tr("Générer l'exercice et la solution", 'توليد التمرين والإصلاح') }}</span>
              }
            </button>

            <!-- AI Result Box -->
            @if (generatedAiResult(); as result) {
              <div class="bg-[#F2ECDE] rounded-2xl p-4 border border-[#E7DFCF] space-y-3 mt-4">
                <div class="flex items-center justify-between">
                  <h4 class="font-display font-semibold text-[#14251D] text-sm">{{ result.title }}</h4>
                  <span class="bg-[#F2C14E] text-[#14251D] font-semibold px-2 py-0.5 rounded-md text-[10px]">
                    {{ lang.tr('Généré avec succès', 'تم التوليد بنجاح') }}
                  </span>
                </div>

                <p class="text-[#14251D] bg-white p-3 rounded-xl border border-[#E7DFCF] leading-relaxed font-mono text-[11px]">
                  {{ result.promptText }}
                </p>

                <div class="bg-[#1B4332]/8 p-3 rounded-xl text-[#1B4332]">
                  <span class="font-semibold">{{ lang.tr('Solution :', 'الإصلاح:') }}</span> {{ result.solutionText }}
                </div>

                <button
                  (click)="saveGeneratedToBank()"
                  class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-4 py-2 rounded-xl w-full cursor-pointer">
                  ➕ {{ lang.tr("Ajouter directement à la Banque d'Exercices", 'إضافة مباشرة لمكتبة التمارين') }}
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- MODAL 2: CREATE ANNOUNCEMENT -->
    @if (modalType() === 'announcement') {
      <div class="fixed inset-0 z-50 bg-[#14251D]/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-[28px] max-w-lg w-full p-6 space-y-4 border border-[#E7DFCF] shadow-sm">
          <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-3">
            <h3 class="font-display font-semibold text-[#14251D] text-base">
              {{ lang.tr('Publier une Annonce de Classe', 'نشر إعلان جديد للعموم') }}
            </h3>
            <button (click)="closeModal()" class="text-[#6B7A70] hover:text-[#14251D] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label for="announce-title-input" class="block font-semibold text-[#14251D] mb-1">
                {{ lang.tr("Titre de l'annonce", 'عنوان الإعلان') }}
              </label>
              <input
                id="announce-title-input"
                type="text"
                [value]="newAnnounceTitle()"
                (input)="onAnnounceTitleInput($event)"
                placeholder="Ex: 📌 Devoir de contrôle à venir"
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-2.5 outline-none" />
            </div>

            <div>
              <label for="announce-cat-select" class="block font-semibold text-[#14251D] mb-1">
                {{ lang.tr('Catégorie', 'الصنف') }}
              </label>
              <select
                id="announce-cat-select"
                [value]="newAnnounceCategory()"
                (change)="onAnnounceCatChange($event)"
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-2.5 outline-none">
                <option value="exam">Examen / Devoir de Synthèse - فرض تأليفي</option>
                <option value="homework">Devoir à domicile - واجب منزلي</option>
                <option value="supply">Fournitures & Matériel - أدوات ومستلزمات</option>
                <option value="urgent">Urgent - عاجل</option>
                <option value="general">Général - عام</option>
              </select>
            </div>

            <div>
              <label for="announce-content-textarea" class="block font-semibold text-[#14251D] mb-1">
                {{ lang.tr('Contenu détaillé', 'تفاصيل الإعلان') }}
              </label>
              <textarea
                id="announce-content-textarea"
                [value]="newAnnounceContent()"
                (input)="onAnnounceContentInput($event)"
                rows="4"
                placeholder="Rédigez clairement votre information..."
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-2.5 outline-none"></textarea>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <button (click)="submitAnnouncement()" class="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold py-2.5 rounded-xl cursor-pointer">
                {{ lang.tr("Diffuser l'Annonce", 'نشر الإعلان الآن') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 3: CREATE COURSE WITH REAL UPLOAD & WATERMARK -->
    @if (modalType() === 'course') {
      <div class="fixed inset-0 z-50 bg-[#14251D]/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-[28px] max-w-lg w-full p-6 space-y-4 border border-[#E7DFCF] shadow-sm max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-[#2D6A4F]">post_add</span>
              <h3 class="font-display font-semibold text-[#14251D] text-base">
                {{ lang.tr('Publier un Cours ou Fiche de Révision', 'إضافة درس أو ملخص رسمي') }}
              </h3>
            </div>
            <button (click)="closeModal()" class="text-[#6B7A70] hover:text-[#14251D] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-[#14251D] mb-1">
                {{ lang.tr('Titre du Cours', 'عنوان الدرس') }}
              </label>
              <input
                type="text"
                [value]="newCourseTitle()"
                (input)="newCourseTitle.set($any($event.target).value)"
                placeholder="Ex: Les nombres décimaux et calcul mental"
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-2.5 outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-[#14251D] mb-1">{{ lang.tr('Matière', 'المادة') }}</label>
                <select
                  [value]="newCourseSubject()"
                  (change)="newCourseSubject.set($any($event.target).value)"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-2.5 outline-none">
                  <option value="Mathématiques">Mathématiques</option>
                  <option value="Français">Français</option>
                  <option value="اللغة العربية">اللغة العربية</option>
                  <option value="Éveil Scientifique">Éveil Scientifique</option>
                  <option value="Histoire & Géographie">Histoire & Géographie</option>
                  <option value="Anglais">Anglais</option>
                </select>
              </div>

              <div>
                <label class="block font-semibold text-[#14251D] mb-1">{{ lang.tr('Trimestre', 'الثلاثي') }}</label>
                <select
                  [value]="newCourseTrimester()"
                  (change)="newCourseTrimester.set($any($event.target).value)"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-2.5 outline-none">
                  <option value="Trimestre 1">Trimestre 1</option>
                  <option value="Trimestre 2">Trimestre 2</option>
                  <option value="Trimestre 3">Trimestre 3</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-[#14251D] mb-1">{{ lang.tr('Résumé pédagogique', 'ملخص تمهيدي') }}</label>
              <input
                type="text"
                [value]="newCourseSummary()"
                (input)="newCourseSummary.set($any($event.target).value)"
                placeholder="Points essentiels à retenir..."
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-2.5 outline-none" />
            </div>

            <!-- REAL FILE UPLOAD BUTTON (DIRECT VPS DISK) -->
            <div class="bg-[#1B4332]/6 p-3.5 rounded-2xl border border-[#E7DFCF] space-y-2">
              <label class="block font-semibold text-[#1B4332] flex items-center gap-1.5">
                <span class="material-icons text-base">attach_file</span>
                {{ lang.tr('Attacher un document (PDF ou Image du devoir)', 'إرفاق وثيقة الدرس أو الفرض (PDF أو صورة)') }}
              </label>
              <div class="flex items-center gap-2">
                <input
                  type="file"
                  #fileInput
                  (change)="handleCourseFileUpload($event)"
                  accept=".pdf,image/*"
                  class="hidden" />
                <button
                  type="button"
                  (click)="fileInput.click()"
                  class="bg-white hover:bg-[#F2ECDE] text-[#14251D] font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border border-[#E7DFCF] shadow-sm">
                  <span class="material-icons text-sm text-[#2D6A4F]">cloud_upload</span>
                  {{ uploadedFileName() ? uploadedFileName() : lang.tr('Sélectionner le fichier...', 'اختيار الملف...') }}
                </button>
                @if (isUploading()) {
                  <span class="text-xs text-[#2D6A4F] animate-spin material-icons">sync</span>
                  <span class="text-[11px] text-[#2D6A4F]">Envoi au serveur...</span>
                } @else if (uploadedFileName()) {
                  <span class="text-xs text-[#2D6A4F] font-semibold">✔️ Prêt</span>
                }
              </div>
            </div>

            <div>
              <label class="block font-semibold text-[#14251D] mb-1">{{ lang.tr('Contenu ou consignes du cours', 'محتوى الدرس أو التوجيهات') }}</label>
              <textarea
                [value]="newCourseContent()"
                (input)="newCourseContent.set($any($event.target).value)"
                rows="4"
                placeholder="Rédigez ou collez le contenu complet de la leçon..."
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-2.5 outline-none"></textarea>
            </div>

            <!-- Auto Watermark Notice -->
            <div class="bg-[#FBF8F1] p-3 rounded-xl border border-[#E7DFCF] text-[11px] text-[#5B6B60] flex items-center justify-between">
              <span>Filigrane automatique : <strong>Madrasati TN — Document Certifié — Enseignant Certifié</strong></span>
              <span class="material-icons text-xs text-[#2D6A4F]">verified</span>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <button (click)="submitCourse()" class="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold py-2.5 rounded-xl cursor-pointer shadow-sm">
                {{ lang.tr('Publier le Cours', 'نشر الدرس الآن') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 4: CREATE HOMEWORK -->
    @if (modalType() === 'homework') {
      <div class="fixed inset-0 z-50 bg-[#14251D]/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-[28px] max-w-lg w-full p-6 space-y-4 border border-[#E7DFCF] shadow-sm max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-3">
            <h3 class="font-display font-semibold text-[#14251D] text-base">
              {{ lang.tr('Assigner un Devoir à Domicile', 'تكليف بواجب منزلي جديد') }}
            </h3>
            <button (click)="closeModal()" class="text-[#6B7A70] hover:text-[#14251D] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-[#14251D] mb-1">{{ lang.tr('Titre du Devoir', 'عنوان الواجب') }}</label>
              <input
                type="text"
                [value]="newHwTitle()"
                (input)="newHwTitle.set($any($event.target).value)"
                placeholder="Ex: Devoir maison N°2 : Géométrie et Calcul"
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-2.5 outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-[#14251D] mb-1">{{ lang.tr('Matière', 'المادة') }}</label>
                <select
                  [value]="newHwSubject()"
                  (change)="newHwSubject.set($any($event.target).value)"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-2.5 outline-none">
                  <option value="Mathématiques">Mathématiques</option>
                  <option value="Français">Français</option>
                  <option value="اللغة العربية">اللغة العربية</option>
                  <option value="Éveil Scientifique">Éveil Scientifique</option>
                </select>
              </div>

              <div>
                <label class="block font-semibold text-[#14251D] mb-1">{{ lang.tr('Date limite', 'آخر أجل للتسليم') }}</label>
                <input
                  type="text"
                  [value]="newHwDueDate()"
                  (input)="newHwDueDate.set($any($event.target).value)"
                  placeholder="Jeudi prochain à 18h00"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-2.5 outline-none" />
              </div>
            </div>

            <div>
              <label class="block font-semibold text-[#14251D] mb-1">{{ lang.tr('Consignes et Exercice à faire', 'التعليمات والتمرين المطلوب') }}</label>
              <textarea
                [value]="newHwInstructions()"
                (input)="newHwInstructions.set($any($event.target).value)"
                rows="4"
                placeholder="Exercice 1 page 45 du livre officiel ou énoncé personnalisé..."
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-2.5 outline-none"></textarea>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <button (click)="submitHomework()" class="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold py-2.5 rounded-xl cursor-pointer shadow-sm">
                {{ lang.tr('Assigner le devoir à la classe', 'تأكيد الواجب للقسم') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 5: COURSE DETAIL VIEW WITH PRINT & WHATSAPP -->
    @if (selectedCourseDetail(); as course) {
      <div class="fixed inset-0 z-50 bg-[#14251D]/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-[28px] max-w-2xl w-full p-6 space-y-4 border border-[#E7DFCF] shadow-sm max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-3">
            <div>
              <span class="bg-[#1B4332]/10 text-[#1B4332] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                {{ course.subject }}
              </span>
              <h3 class="font-display font-semibold text-[#14251D] text-lg mt-1">{{ course.title }}</h3>
            </div>
            <button (click)="selectedCourseDetail.set(null)" class="text-[#6B7A70] hover:text-[#14251D] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="prose prose-slate max-w-none text-xs leading-relaxed whitespace-pre-line bg-[#FBF8F1] p-4 rounded-2xl border border-[#E7DFCF] font-sans">
            {{ course.content }}
          </div>

          @if (course.pdfUrl) {
            <div class="bg-[#1B4332]/8 p-3.5 rounded-2xl border border-[#E7DFCF] flex items-center justify-between text-xs">
              <div class="flex items-center gap-2 text-[#1B4332] font-semibold">
                <span class="material-icons text-[#2D6A4F]">picture_as_pdf</span>
                <span>Document officiel / Fiche attachée</span>
              </div>
              <a [href]="course.pdfUrl" target="_blank" class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-sm">
                <span class="material-icons text-xs">download</span>
                Télécharger
              </a>
            </div>
          }

          <div class="flex items-center justify-between gap-2 pt-2 border-t border-[#E7DFCF]">
            <div class="flex items-center gap-2">
              <button
                (click)="openPrintCourseModal(course)"
                class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm">
                <span class="material-icons text-sm">print</span>
                {{ lang.tr('🖨️ Imprimer avec Filigrane', '🖨️ طباعة بالفيليغران') }}
              </button>
            </div>

            <button (click)="selectedCourseDetail.set(null)" class="bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer border border-[#E7DFCF]">
              {{ lang.tr('Fermer', 'إغلاق') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 6: 🖨️ DEDICATED A4 PRINT & WATERMARK MODAL (OFFICIAL TUNISIAN FORMAT) -->
    @if (printModalCourse(); as c) {
      <div id="printable-modal" class="print-container fixed inset-0 z-50 bg-[#14251D]/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-[28px] max-w-2xl w-full p-6 space-y-5 border border-[#E7DFCF] shadow-sm max-h-[90vh] overflow-y-auto relative">

          <div class="no-print bg-[#14251D] text-[#FBF8F1] p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div class="flex items-center gap-2">
              <span class="material-icons text-[#F2C14E]">verified</span>
              <div>
                <h4 class="font-display font-semibold text-sm text-[#FBF8F1]">MADRASATI TN 🇹🇳 — APERÇU FILIGRANE & IMPRESSION</h4>
                <p class="text-[11px] text-[#B7C7BC]">
                  {{ c.watermarkText || 'Madrasati TN — Document Certifié — Enseignant Certifié' }}
                </p>
              </div>
            </div>
            <button (click)="printModalCourse.set(null)" class="text-[#FBF8F1]/80 hover:text-[#FBF8F1] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <!-- Official Document Frame (Target of @media print) -->
          <div id="printable-document" class="print-document bg-[#FBF8F1] rounded-2xl p-6 border-2 border-[#E7DFCF] relative overflow-hidden space-y-4">
            <div class="print-watermark absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 select-none rotate-[-25deg]">
              <span class="text-4xl font-black uppercase text-[#1B4332] tracking-widest text-center">
                MADRASATI TN <br /> COPIE CERTIFIÉE ENSEIGNANT
              </span>
            </div>

            <!-- Official Ministry Header -->
            <div class="border-b-2 border-[#14251D] pb-3 font-sans">
              <div class="flex items-center justify-between text-xs">
                <div class="text-left font-bold text-[#14251D] leading-tight">
                  <p>الجمهورية التونسية</p>
                  <p>وزارة التربية والتعليم</p>
                  <p class="text-[10px] text-[#5B6B60] font-normal">المندوبية الجهوية للتربية بأريانة</p>
                </div>
                <div class="text-center font-bold">
                  <p class="font-display text-base text-[#1B4332] font-semibold">{{ c.title }}</p>
                  <p class="text-xs text-[#5B6B60]">{{ c.grade }} • {{ c.subject }}</p>
                </div>
                <div class="text-right text-xs text-[#4A5A50] leading-tight">
                  <p>{{ c.trimester || 'الثلاثي الأول' }}</p>
                  <p>السنة الدراسية: {{ c.schoolYear || '2025-2026' }}</p>
                </div>
              </div>

              <!-- Student Filling Box -->
              <div class="mt-3 pt-2 border-t border-dashed border-[#C8BEA8] grid grid-cols-3 gap-2 text-xs font-semibold">
                <p>الاسم واللقب: ....................................</p>
                <p>القسم: {{ c.grade }}</p>
                <p class="text-right font-bold text-[#1B4332]">العدد: .......... / 20</p>
              </div>
            </div>

            <!-- Course Content -->
            <div class="prose prose-slate max-w-none text-xs leading-relaxed whitespace-pre-line py-3 font-sans relative z-10">
              {{ c.content }}
            </div>

            <!-- Footer Attribution -->
            <div class="border-t border-[#E7DFCF] pt-3 text-[10px] text-[#5B6B60] font-sans flex items-center justify-between">
              <span>Attribution Enseignant : {{ c.watermarkText || 'Enseignant Certifié' }}</span>
              <span>Plateforme Nationale Madrasati TN</span>
            </div>
          </div>

          <div class="no-print flex items-center justify-between gap-3 pt-2">
            <button (click)="printModalCourse.set(null)" class="bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] font-semibold px-4 py-2.5 rounded-xl text-xs cursor-pointer border border-[#E7DFCF]">
              {{ lang.tr('Fermer', 'إغلاق') }}
            </button>

            <button
              (click)="triggerPrintDialog()"
              class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-sm">
              <span class="material-icons text-base">print</span>
              {{ lang.t('printBtn') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 7: TEACHER CREDENTIALS & PROFILE DRAWER -->
    @if (teacherProfileModal()) {
      <div class="fixed inset-0 z-50 bg-[#14251D]/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-[28px] max-w-lg w-full p-6 space-y-5 border border-[#E7DFCF] shadow-sm relative">
          <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-3">
            <span class="inline-flex items-center gap-1 text-[#1B4332] font-semibold text-xs uppercase tracking-wider bg-[#1B4332]/10 px-3 py-1 rounded-full">
              <span class="material-icons text-xs">verified</span>
              {{ lang.tr('Enseignante Agréée Ministère', 'معلمة معتمدة من وزارة التربية') }}
            </span>
            <button (click)="teacherProfileModal.set(false)" class="text-[#6B7A70] hover:text-[#14251D] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="flex items-center gap-4">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
              alt="Enseignant Certifié"
              class="w-16 h-16 rounded-full object-cover border-2 border-[#2D6A4F] shadow-sm" />
            <div>
              <h3 class="font-display font-semibold text-[#14251D] text-base">Enseignant Certifié</h3>
              <p class="text-xs text-[#5B6B60] font-medium">Enseignante Principale (4ème & 5ème Année)</p>
              <p class="text-[11px] text-[#1B4332] font-semibold mt-0.5">École Primaire Habib Bourguiba, Ariana</p>
            </div>
          </div>

          <div class="grid grid-cols-4 gap-2 text-center p-3 bg-[#FBF8F1] rounded-2xl border border-[#E7DFCF]">
            <div>
              <p class="font-display font-semibold text-[#14251D] text-sm">24</p>
              <p class="text-[10px] text-[#6B7A70]">Cours</p>
            </div>
            <div>
              <p class="font-display font-semibold text-[#14251D] text-sm">340</p>
              <p class="text-[10px] text-[#6B7A70]">Exercices</p>
            </div>
            <div>
              <p class="font-display font-semibold text-[#14251D] text-sm">620</p>
              <p class="text-[10px] text-[#6B7A70]">Élèves</p>
            </div>
            <div>
              <p class="font-display font-semibold text-[#8A5A00] text-sm flex items-center justify-center gap-1">
                <span class="material-icons text-sm text-[#8A5A00]">star</span>4.9
              </p>
              <p class="text-[10px] text-[#6B7A70]">128 avis</p>
            </div>
          </div>

          <div class="space-y-2 text-xs text-[#4A5A50]">
            <h4 class="font-display font-semibold text-[#14251D]">Filigrane Automatique des Documents :</h4>
            <div class="p-3 bg-[#1B4332]/8 border border-[#E7DFCF] rounded-xl font-mono text-[11px] text-[#1B4332] flex items-center justify-between">
              <span>Madrasati TN — Document Certifié — Enseignant Certifié</span>
              <span class="material-icons text-[#2D6A4F] text-sm">lock</span>
            </div>
          </div>

          <button
            (click)="teacherProfileModal.set(false)"
            class="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold py-2.5 rounded-xl text-xs cursor-pointer shadow-sm">
            {{ lang.tr('Fermer', 'إغلاق') }}
          </button>
        </div>
      </div>
    }

    <!-- MODAL 8: GRADING SUBMISSION MODAL -->
    @if (gradingSubmission(); as sub) {
      <div class="fixed inset-0 z-50 bg-[#14251D]/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-[28px] max-w-md w-full p-6 space-y-4 border border-[#E7DFCF] shadow-sm">
          <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-3">
            <h3 class="font-display font-semibold text-[#14251D] text-base">
              {{ lang.tr('Corriger le devoir de', 'إصلاح واجب التلميذ') }} {{ sub.studentName }}
            </h3>
            <button (click)="gradingSubmission.set(null)" class="text-[#6B7A70] hover:text-[#14251D] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label for="grade-score-input" class="block font-semibold text-[#14251D] mb-1">
                {{ lang.tr('Note attribuée (sur 20)', 'العدد المسند (من 20)') }}
              </label>
              <input
                id="grade-score-input"
                type="number"
                [value]="gradeScore()"
                (input)="onGradeScoreInput($event)"
                min="0"
                max="20"
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-2.5 outline-none font-semibold text-[#1B4332]" />
            </div>

            <div>
              <label for="grade-feedback-textarea" class="block font-semibold text-[#14251D] mb-1">
                {{ lang.tr("Remarque & Conseils pour l'élève", 'ملاحظات وتوجيهات للتلميذ') }}
              </label>
              <textarea
                id="grade-feedback-textarea"
                [value]="gradeFeedback()"
                (input)="onGradeFeedbackInput($event)"
                rows="3"
                placeholder="Ex: Bravo pour la démarche ! Fais attention aux unités à la fin..."
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-2.5 outline-none"></textarea>
            </div>

            <button (click)="submitGrading()" class="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold py-2.5 rounded-xl cursor-pointer shadow-sm">
              {{ lang.tr('Valider la correction', 'تأكيد وحفظ الإصلاح') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class TeacherHomeComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  readonly firebase = inject(FirebaseService);

  teacherGreeting(): string {
    const profile = this.firebase.userProfile();
    if (profile?.displayName) {
      return this.lang.tr(`Bonjour, ${profile.displayName}`, `مرحباً، ${profile.displayName}`);
    }
    return this.lang.tr('Espace Enseignant', 'فضاء المعلم');
  }

  readonly activeTab = signal<'announcements' | 'courses' | 'homeworks' | 'submissions'>('announcements');
  readonly modalType = signal<'none' | 'announcement' | 'course' | 'homework' | 'ai'>('none');
  
  readonly selectedCourseDetail = signal<Course | null>(null);
  readonly printModalCourse = signal<Course | null>(null);
  readonly teacherProfileModal = signal<boolean>(false);
  readonly gradingSubmission = signal<Submission | null>(null);

  // Form signals
  readonly newAnnounceTitle = signal('📌 Rappel : Devoir de Mathématiques');
  readonly newAnnounceCategory = signal<'exam' | 'homework' | 'supply' | 'urgent' | 'general'>('homework');
  readonly newAnnounceContent = signal('N\'oubliez pas d\'effectuer la série N°3 sur la multiplication pour demain.');

  // Course Form
  readonly newCourseTitle = signal('');
  readonly newCourseSubject = signal<SubjectName>('Mathématiques');
  readonly newCourseTrimester = signal('Trimestre 1');
  readonly newCourseSummary = signal('');
  readonly newCourseContent = signal('');
  readonly uploadedFileUrl = signal<string | null>(null);
  readonly uploadedFileName = signal<string | null>(null);
  readonly isUploading = signal<boolean>(false);

  // Homework Form
  readonly newHwTitle = signal('');
  readonly newHwSubject = signal<SubjectName>('Mathématiques');
  readonly newHwDueDate = signal('Demain à 18h00');
  readonly newHwInstructions = signal('');

  readonly aiFormSubject = signal('Mathématiques');
  readonly aiFormDifficulty = signal('Moyen');
  readonly aiFormTopic = signal('La résolution de problèmes à deux étapes');

  readonly isAiLoading = signal<boolean>(false);
  readonly generatedAiResult = signal<GeneratedExerciseResult | null>(null);

  readonly gradeScore = signal(18);
  readonly gradeFeedback = signal('Très bon travail ! La méthode est bien comprise.');

  teacherHeaderSub(): string {
    return this.lang.tr(
      'Votre espace enseignant professionnel pour la classe ',
      'فضاؤك المهني للتعليم الخاص بفصل '
    );
  }

  openModal(type: 'announcement' | 'course' | 'homework' | 'ai') {
    this.modalType.set(type);
  }

  closeModal() {
    this.modalType.set('none');
    this.uploadedFileUrl.set(null);
    this.uploadedFileName.set(null);
  }

  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'exam':
        return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'homework':
        return 'bg-[#8A5A00]/10 text-[#8A5A00] border border-[#E7DFCF]';
      case 'supply':
        return 'bg-[#1B4332]/10 text-[#1B4332] border border-[#E7DFCF]';
      case 'urgent':
        return 'bg-red-500 text-white font-black';
      default:
        return 'bg-[#F2ECDE] text-[#14251D] border border-[#E7DFCF]';
    }
  }

  onAiSubjectChange(e: Event) {
    this.aiFormSubject.set((e.target as HTMLSelectElement).value);
  }

  onAiDifficultyChange(e: Event) {
    this.aiFormDifficulty.set((e.target as HTMLSelectElement).value);
  }

  onAiTopicInput(e: Event) {
    this.aiFormTopic.set((e.target as HTMLInputElement).value);
  }

  onAnnounceTitleInput(e: Event) {
    this.newAnnounceTitle.set((e.target as HTMLInputElement).value);
  }

  onAnnounceCatChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value as 'exam' | 'homework' | 'supply' | 'urgent' | 'general';
    this.newAnnounceCategory.set(val);
  }

  onAnnounceContentInput(e: Event) {
    this.newAnnounceContent.set((e.target as HTMLTextAreaElement).value);
  }

  onGradeScoreInput(e: Event) {
    this.gradeScore.set(+(e.target as HTMLInputElement).value);
  }

  onGradeFeedbackInput(e: Event) {
    this.gradeFeedback.set((e.target as HTMLTextAreaElement).value);
  }

  submitAnnouncement() {
    this.store.addAnnouncement({
      title: this.newAnnounceTitle(),
      category: this.newAnnounceCategory(),
      content: this.newAnnounceContent(),
      isPinned: this.newAnnounceCategory() === 'exam',
    });
    this.closeModal();
  }

  async handleCourseFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.isUploading.set(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const base64Data = await base64Promise;

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          base64Data,
          contentType: file.type,
        }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        this.uploadedFileUrl.set(data.url);
        this.uploadedFileName.set(file.name);
        if (!this.newCourseTitle()) {
          this.newCourseTitle.set(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      this.isUploading.set(false);
    }
  }

  submitCourse() {
    if (!this.newCourseTitle()) return;
    this.store.addCourse({
      title: this.newCourseTitle(),
      subject: this.newCourseSubject(),
      trimester: this.newCourseTrimester() as any,
      summary: this.newCourseSummary(),
      content: this.newCourseContent() || 'Document de révision officiel préparé pour la classe.',
      pdfUrl: this.uploadedFileUrl() || undefined,
      watermarkText: 'Madrasati TN — Document Certifié — Enseignant Certifié',
    });
    this.closeModal();
  }

  submitHomework() {
    if (!this.newHwTitle()) return;
    this.store.addHomework({
      title: this.newHwTitle(),
      subject: this.newHwSubject(),
      dueDate: this.newHwDueDate(),
      instructions: this.newHwInstructions(),
    });
    this.closeModal();
  }

  openPrintCourseModal(c: Course) {
    this.printModalCourse.set(c);
  }

  triggerPrintDialog() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  async generateAiExercise() {
    this.isAiLoading.set(true);
    try {
      const res = await fetch('/api/ai/generate-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: this.store.activeClass().grade,
          subject: this.aiFormSubject(),
          topic: this.aiFormTopic(),
          difficulty: this.aiFormDifficulty(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        this.generatedAiResult.set(data.exercise);
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isAiLoading.set(false);
    }
  }

  saveGeneratedToBank() {
    const res = this.generatedAiResult();
    if (!res) return;

    this.store.addExerciseToBank({
      id: 'bank-' + Date.now(),
      title: res.title,
      chapter: this.aiFormTopic(),
      subject: this.aiFormSubject() as SubjectName,
      grade: this.store.activeClass().grade,
      difficulty: (this.aiFormDifficulty() as 'Facile' | 'Moyen' | 'Avancé') || 'Moyen',
      promptText: res.promptText,
      solutionText: res.solutionText,
      hints: res.hints || [],
      points: res.points || 10,
    });

    this.closeModal();
    this.generatedAiResult.set(null);
  }

  submitGrading() {
    const sub = this.gradingSubmission();
    if (sub) {
      this.store.gradeSubmission(sub.id, this.gradeScore(), this.gradeFeedback());
      this.gradingSubmission.set(null);
    }
  }
}
