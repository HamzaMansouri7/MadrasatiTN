import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { EducationStore } from '../services/education-store';
import { LanguageService } from '../services/language.service';
import { Course, SubjectName, Submission } from '../models/education.model';

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
      
      <!-- Welcome Header -->
      <div class="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-2">
            <div class="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-semibold">
              <span class="material-icons text-sm">verified</span>
              {{ lang.tr('Enseignante Certifiée — Éducation Nationale', 'معلمة معتمدة — وزارة التربية والتعليم') }}
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {{ lang.t('teacherWelcome') }}
            </h1>
            <p class="text-emerald-100/90 text-sm max-w-xl">
              {{ teacherHeaderSub() }}
              <span class="font-bold underline text-white">{{ store.activeClass().name }}</span>.
            </p>
          </div>

          <!-- Quick Actions Bar -->
          <div class="flex flex-wrap gap-2.5 shrink-0">
            <button
              (click)="openModal('announcement')"
              class="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-xs">
              <span class="material-icons text-base">campaign</span>
              {{ lang.t('addAnnouncementBtn') }}
            </button>

            <button
              (click)="openModal('course')"
              class="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl text-xs border border-white/20 transition-all cursor-pointer">
              <span class="material-icons text-base">menu_book</span>
              {{ lang.t('addCourseBtn') }}
            </button>

            <button
              (click)="openModal('homework')"
              class="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl text-xs border border-white/20 transition-all cursor-pointer">
              <span class="material-icons text-base">assignment</span>
              {{ lang.t('addHomeworkBtn') }}
            </button>

            <button
              (click)="openModal('ai')"
              class="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-xs hover:scale-105">
              <span class="material-icons text-base">auto_awesome</span>
              {{ lang.t('aiAssistantBtn') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Class Metric Cards & Quick Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div class="flex items-center justify-between text-slate-500 mb-2">
            <span class="text-xs font-semibold">{{ lang.t('statStudents') }}</span>
            <span class="material-icons text-emerald-600 text-xl">groups</span>
          </div>
          <p class="text-2xl font-black text-slate-900">{{ store.activeClass().studentCount }}</p>
          <p class="text-[11px] text-emerald-600 font-medium mt-1">
            {{ lang.tr('100% inscrits sans groupe FB', 'مسجلون بالكامل بدون فيسبوك') }}
          </p>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div class="flex items-center justify-between text-slate-500 mb-2">
            <span class="text-xs font-semibold">{{ lang.t('statSubmissions') }}</span>
            <span class="material-icons text-amber-500 text-xl">fact_check</span>
          </div>
          <p class="text-2xl font-black text-slate-900">{{ store.submissions().length }}</p>
          <p class="text-[11px] text-amber-600 font-medium mt-1">
            {{ lang.tr('Soumissions reçues', 'تطبيقات مستلمة للتقييم') }}
          </p>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div class="flex items-center justify-between text-slate-500 mb-2">
            <span class="text-xs font-semibold">{{ lang.t('statViews') }}</span>
            <span class="material-icons text-indigo-600 text-xl">visibility</span>
          </div>
          <p class="text-2xl font-black text-slate-900">342</p>
          <p class="text-[11px] text-indigo-600 font-medium mt-1">
            {{ lang.tr('Vues cette semaine', 'زيارة هذا الأسبوع') }}
          </p>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div class="flex items-center justify-between text-slate-500 mb-2">
            <span class="text-xs font-semibold">{{ lang.t('statConfirmations') }}</span>
            <span class="material-icons text-teal-600 text-xl">verified_user</span>
          </div>
          <p class="text-2xl font-black text-slate-900">24 / 28</p>
          <p class="text-[11px] text-teal-600 font-medium mt-1">
            {{ lang.tr("Avis d'examens validés", 'موافقات الأولياء المؤكدة') }}
          </p>
        </div>
      </div>

      <!-- Main Class Content Tabs -->
      <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        
        <!-- Tab Bar Header -->
        <div class="border-b border-slate-200 bg-slate-50/80 px-6 pt-4 flex flex-wrap gap-2">
          <button
            (click)="activeTab.set('announcements')"
            [class]="activeTab() === 'announcements' ? 'border-emerald-600 text-emerald-800 bg-white font-bold' : 'border-transparent text-slate-600 font-medium hover:text-slate-900'"
            class="px-4 py-3 border-b-2 text-xs flex items-center gap-2 transition-all cursor-pointer rounded-t-xl">
            <span class="material-icons text-base">campaign</span>
            <span>{{ lang.t('tabAnnouncements') }} ({{ store.classAnnouncements().length }})</span>
          </button>

          <button
            (click)="activeTab.set('courses')"
            [class]="activeTab() === 'courses' ? 'border-emerald-600 text-emerald-800 bg-white font-bold' : 'border-transparent text-slate-600 font-medium hover:text-slate-900'"
            class="px-4 py-3 border-b-2 text-xs flex items-center gap-2 transition-all cursor-pointer rounded-t-xl">
            <span class="material-icons text-base">menu_book</span>
            <span>{{ lang.t('tabCourses') }} ({{ store.classCourses().length }})</span>
          </button>

          <button
            (click)="activeTab.set('homeworks')"
            [class]="activeTab() === 'homeworks' ? 'border-emerald-600 text-emerald-800 bg-white font-bold' : 'border-transparent text-slate-600 font-medium hover:text-slate-900'"
            class="px-4 py-3 border-b-2 text-xs flex items-center gap-2 transition-all cursor-pointer rounded-t-xl">
            <span class="material-icons text-base">assignment</span>
            <span>{{ lang.t('tabHomeworks') }} ({{ store.classHomeworks().length }})</span>
          </button>

          <button
            (click)="activeTab.set('submissions')"
            [class]="activeTab() === 'submissions' ? 'border-emerald-600 text-emerald-800 bg-white font-bold' : 'border-transparent text-slate-600 font-medium hover:text-slate-900'"
            class="px-4 py-3 border-b-2 text-xs flex items-center gap-2 transition-all cursor-pointer rounded-t-xl">
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
                  <h3 class="font-bold text-slate-900">
                    {{ lang.tr('Annonces diffusées aux parents et élèves', 'البلاغات الموجهة للأولياء والتلاميذ') }}
                  </h3>
                  <p class="text-xs text-slate-500">
                    {{ lang.tr('Finies les questions à répétition sur WhatsApp. Chaque annonce est datée et traçable.', 'لا مزيد من الأسئلة المكررة على الواتساب. كل إعلان موثق ومنظم.') }}
                  </p>
                </div>
                <button
                  (click)="openModal('announcement')"
                  class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer">
                  <span class="material-icons text-sm">add</span> {{ lang.t('addAnnouncementBtn') }}
                </button>
              </div>

              @for (a of store.classAnnouncements(); track a.id) {
                <div class="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3 relative hover:border-slate-300 transition-all">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex items-center gap-3">
                      <img [src]="a.teacherAvatar" alt="Teacher" class="w-10 h-10 rounded-full object-cover border border-slate-300" />
                      <div>
                        <div class="flex items-center gap-2">
                          <h4 class="font-bold text-slate-900 text-sm">{{ a.title }}</h4>
                          @if (a.isPinned) {
                            <span class="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span class="material-icons text-[12px]">push_pin</span>
                              {{ lang.tr('Épinglé', 'مثبت') }}
                            </span>
                          }
                        </div>
                        <p class="text-[11px] text-slate-500 font-medium">{{ a.teacherName }} • {{ a.date }}</p>
                      </div>
                    </div>

                    <span [class]="getCategoryBadgeClass(a.category)" class="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {{ a.category }}
                    </span>
                  </div>

                  <p class="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-white p-3.5 rounded-xl border border-slate-200/60">
                    {{ a.content }}
                  </p>

                  <div class="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <div class="flex items-center gap-4">
                      <span class="flex items-center gap-1 text-emerald-700 font-medium">
                        <span class="material-icons text-sm">check_circle</span>
                        {{ a.confirmedByParentsCount }} {{ lang.tr('parents ont confirmé la lecture', 'أولياء أكدوا اطلاعهم') }}
                      </span>
                    </div>

                    <span class="text-[11px] text-slate-400">
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
                  <h3 class="font-bold text-slate-900">{{ lang.t('tabCourses') }}</h3>
                  <p class="text-xs text-slate-500">
                    {{ lang.tr("Un espace structuré par chapitre. Retrouvez n'importe quelle leçon en un clic.", 'مساحة منظمة حسب المحاور. استرجع أي درس بضغطة زر.') }}
                  </p>
                </div>
                <button
                  (click)="openModal('course')"
                  class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer">
                  <span class="material-icons text-sm">add</span> {{ lang.t('addCourseBtn') }}
                </button>
              </div>

              <div class="grid md:grid-cols-2 gap-4">
                @for (c of store.classCourses(); track c.id) {
                  <div class="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between space-y-3">
                    <div class="space-y-2">
                      <div class="flex items-center justify-between">
                        <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {{ c.subject }}
                        </span>
                        <span class="text-[11px] text-slate-400">{{ c.createdAt }}</span>
                      </div>
                      <h4 class="font-bold text-slate-900 text-sm leading-snug">{{ c.title }}</h4>
                      <p class="text-xs text-slate-600 line-clamp-2">{{ c.summary }}</p>
                    </div>

                    <div class="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                      <div class="flex flex-wrap gap-1">
                        @for (tag of c.tags; track tag) {
                          <span class="text-[10px] bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-600">#{{ tag }}</span>
                        }
                      </div>

                      <button
                        (click)="selectedCourseDetail.set(c)"
                        class="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer">
                        {{ lang.tr('Consulter', 'قراءة الدرس') }} <span class="material-icons text-sm">arrow_forward</span>
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
                  <h3 class="font-bold text-slate-900">{{ lang.t('tabHomeworks') }}</h3>
                  <p class="text-xs text-slate-500">
                    {{ lang.tr('Définissez les exercices, la date limite et recevez les réponses des élèves.', 'حدد التمارين والموعد واستلم إنجازات التلاميذ.') }}
                  </p>
                </div>
                <button
                  (click)="openModal('homework')"
                  class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer">
                  <span class="material-icons text-sm">add</span> {{ lang.t('addHomeworkBtn') }}
                </button>
              </div>

              @for (hw of store.classHomeworks(); track hw.id) {
                <div class="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {{ hw.subject }}
                        </span>
                        <h4 class="font-bold text-slate-900 text-sm">{{ hw.title }}</h4>
                      </div>
                      <p class="text-xs text-slate-500 mt-1">
                        {{ lang.tr('À rendre pour :', 'أجل التسليم:') }} <span class="font-semibold text-rose-700">{{ hw.dueDate }}</span>
                      </p>
                    </div>

                    <div class="flex items-center gap-3">
                      <span class="text-xs text-slate-600 font-medium bg-white px-3 py-1 rounded-xl border border-slate-200">
                        {{ hw.submissionsCount }} / 28 {{ lang.tr('rendus', 'مستلم') }}
                      </span>
                    </div>
                  </div>

                  <!-- Exercise Items List inside Homework -->
                  <div class="space-y-2">
                    <p class="text-xs font-bold text-slate-700">
                      {{ lang.tr('Liste des exercices inclus :', 'قائمة التمارين المرفقة:') }}
                    </p>
                    <div class="grid gap-2">
                      @for (ex of hw.exercises; track ex.id) {
                        <div class="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                          <div class="flex items-center justify-between">
                            <span class="font-bold text-slate-800">{{ ex.title }}</span>
                            <span class="text-[11px] text-emerald-700 font-semibold">{{ ex.points }} {{ lang.tr('points', 'نقاط') }}</span>
                          </div>
                          <p class="text-slate-600 italic">"{{ ex.promptText }}"</p>
                          <div class="text-[11px] text-slate-500 pt-1">
                            <span class="font-semibold text-slate-700">{{ lang.tr('Corrigé enseignant :', 'إصلاح المعلم:') }}</span> {{ ex.solutionText }}
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
                <h3 class="font-bold text-slate-900">
                  {{ lang.tr("Travaux et photos d'exercices reçus", 'التطبيقات والمحاولات المستلمة من التلاميذ') }}
                </h3>
                <p class="text-xs text-slate-500">
                  {{ lang.tr('Consultez les réponses saisies ou les photos de cahiers envoyées par les élèves et attribuez une note avec remarque.', 'راجع كتابات التلاميذ أو صور كراساتهم وسجل التقييم والترديد.') }}
                </p>
              </div>

              @for (sub of store.submissions(); track sub.id) {
                <div class="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <img [src]="sub.studentAvatar" alt="Student" class="w-10 h-10 rounded-full object-cover border border-slate-300" />
                      <div>
                        <h4 class="font-bold text-slate-900 text-sm">{{ sub.studentName }}</h4>
                        <p class="text-[11px] text-slate-500">{{ lang.tr('Soumis le', 'تم الإرسال بتاريخ') }} {{ sub.submittedAt }}</p>
                      </div>
                    </div>

                    @if (sub.status === 'graded') {
                      <span class="bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-1 rounded-full">
                        {{ lang.tr('Note :', 'العدد:') }} {{ sub.score }} / {{ sub.maxScore }}
                      </span>
                    } @else {
                      <span class="bg-amber-100 text-amber-800 font-bold text-xs px-3 py-1 rounded-full">
                        {{ lang.tr('En attente de correction', 'في انتظار الاصلاح') }}
                      </span>
                    }
                  </div>

                  <div class="grid md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <p class="font-bold text-slate-800 mb-1">{{ lang.tr('Réponse rédigée :', 'الإجابة المكتوبة:') }}</p>
                      <p class="text-slate-700 whitespace-pre-line">{{ sub.textAnswer || 'Aucune réponse texte.' }}</p>
                    </div>

                    @if (sub.photoUrl) {
                      <div>
                        <p class="font-bold text-slate-800 mb-1">{{ lang.tr('Photo du cahier :', 'صورة الكراسة:') }}</p>
                        <img [src]="sub.photoUrl" alt="Photo cahier" class="rounded-xl border border-slate-300 h-32 w-full object-cover" />
                      </div>
                    }
                  </div>

                  @if (sub.feedback) {
                    <div class="bg-emerald-50 text-emerald-900 p-3 rounded-xl border border-emerald-200 text-xs">
                      <span class="font-bold">{{ lang.tr("Remarque transmise à l'élève :", 'ملاحظة المعلم للتلميذ:') }}</span> {{ sub.feedback }}
                    </div>
                  } @else {
                    <div class="flex items-center gap-2 pt-2">
                      <button
                        (click)="gradingSubmission.set(sub)"
                        class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer">
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
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-amber-500 text-2xl">auto_awesome</span>
              <div>
                <h3 class="font-bold text-slate-900 text-lg">
                  {{ lang.tr('Assistant Pédagogique IA Tunisie', 'المساعد البيداغوجي الذكي في تونس') }}
                </h3>
                <p class="text-xs text-slate-500">
                  {{ lang.tr("Générez un exercice sur-mesure ou une idée d'évaluation alignée au programme.", 'توليد تمارين واختبارات متطابقة مع البرنامج الرسمي.') }}
                </p>
              </div>
            </div>
            <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-4 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="ai-subject-select" class="block font-semibold text-slate-700 mb-1">
                  {{ lang.tr('Matière', 'المادة') }}
                </label>
                <select
                  id="ai-subject-select"
                  [value]="aiFormSubject()"
                  (change)="onAiSubjectChange($event)"
                  class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none">
                  <option value="Mathématiques">Mathématiques / الرياضيات</option>
                  <option value="Français">Français / الفرنسية</option>
                  <option value="اللغة العربية">اللغة العربية</option>
                  <option value="Éveil Scientifique">Éveil Scientifique / الإيقاظ العلمي</option>
                </select>
              </div>

              <div>
                <label for="ai-difficulty-select" class="block font-semibold text-slate-700 mb-1">
                  {{ lang.tr('Difficulté', 'درجة الصعوبة') }}
                </label>
                <select
                  id="ai-difficulty-select"
                  [value]="aiFormDifficulty()"
                  (change)="onAiDifficultyChange($event)"
                  class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none">
                  <option value="Facile">Facile / سهل</option>
                  <option value="Moyen">Moyen / متوسط</option>
                  <option value="Avancé">Avancé (Préparation Concours 6ème) / متقدم (مناظرة السادسة)</option>
                </select>
              </div>
            </div>

            <div>
              <label for="ai-topic-input" class="block font-semibold text-slate-700 mb-1">
                {{ lang.tr('Thème / Chapitre précis', 'المحور أو الدرس') }}
              </label>
              <input
                id="ai-topic-input"
                type="text"
                [value]="aiFormTopic()"
                (input)="onAiTopicInput($event)"
                placeholder="Ex: La multiplication, الجملة الاسمية..."
                class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none" />
            </div>

            <button
              [disabled]="isAiLoading()"
              (click)="generateAiExercise()"
              class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50">
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
              <div class="bg-amber-50 rounded-2xl p-4 border border-amber-200 space-y-3 mt-4">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold text-amber-950 text-sm">{{ result.title }}</h4>
                  <span class="bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-md text-[10px]">
                    {{ lang.tr('Généré avec succès', 'تم التوليد بنجاح') }}
                  </span>
                </div>

                <p class="text-slate-800 bg-white p-3 rounded-xl border border-amber-200/60 leading-relaxed font-mono text-[11px]">
                  {{ result.promptText }}
                </p>

                <div class="bg-emerald-100/70 p-3 rounded-xl text-emerald-900">
                  <span class="font-bold">{{ lang.tr('Solution :', 'الإصلاح:') }}</span> {{ result.solutionText }}
                </div>

                <button
                  (click)="saveGeneratedToBank()"
                  class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl w-full cursor-pointer">
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
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-xl">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="font-bold text-slate-900 text-base">
              {{ lang.tr('Publier une Annonce de Classe', 'نشر إعلان جديد للعموم') }}
            </h3>
            <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label for="announce-title-input" class="block font-semibold text-slate-700 mb-1">
                {{ lang.tr("Titre de l'annonce", 'عنوان الإعلان') }}
              </label>
              <input
                id="announce-title-input"
                type="text"
                [value]="newAnnounceTitle()"
                (input)="onAnnounceTitleInput($event)"
                placeholder="Ex: 📌 Devoir de contrôle à venir"
                class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none" />
            </div>

            <div>
              <label for="announce-cat-select" class="block font-semibold text-slate-700 mb-1">
                {{ lang.tr('Catégorie', 'الصنف') }}
              </label>
              <select
                id="announce-cat-select"
                [value]="newAnnounceCategory()"
                (change)="onAnnounceCatChange($event)"
                class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none">
                <option value="exam">Examen / Devoir de Synthèse - فرض تأليفي</option>
                <option value="homework">Devoir à domicile - واجب منزلي</option>
                <option value="supply">Fournitures & Matériel - أدوات ومستلزمات</option>
                <option value="urgent">Urgent - عاجل</option>
                <option value="general">Général - عام</option>
              </select>
            </div>

            <div>
              <label for="announce-content-textarea" class="block font-semibold text-slate-700 mb-1">
                {{ lang.tr('Contenu détaillé', 'تفاصيل الإعلان') }}
              </label>
              <textarea
                id="announce-content-textarea"
                [value]="newAnnounceContent()"
                (input)="onAnnounceContentInput($event)"
                rows="4"
                placeholder="Rédigez clairement votre information..."
                class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none"></textarea>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <button (click)="submitAnnouncement()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl cursor-pointer">
                {{ lang.tr("Diffuser l'Annonce", 'نشر الإعلان الآن') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 3: COURSE DETAIL VIEW -->
    @if (selectedCourseDetail(); as course) {
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                {{ course.subject }}
              </span>
              <h3 class="font-bold text-slate-900 text-lg mt-1">{{ course.title }}</h3>
            </div>
            <button (click)="selectedCourseDetail.set(null)" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="prose prose-slate max-w-none text-xs leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {{ course.content }}
          </div>

          <div class="flex justify-end">
            <button (click)="selectedCourseDetail.set(null)" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer">
              {{ lang.tr('Fermer', 'إغلاق') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 4: GRADING SUBMISSION MODAL -->
    @if (gradingSubmission(); as sub) {
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="font-bold text-slate-900 text-base">
              {{ lang.tr('Corriger le devoir de', 'إصلاح واجب التلميذ') }} {{ sub.studentName }}
            </h3>
            <button (click)="gradingSubmission.set(null)" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label for="grade-score-input" class="block font-semibold text-slate-700 mb-1">
                {{ lang.tr('Note attribuée (sur 20)', 'العدد المسند (من 20)') }}
              </label>
              <input
                id="grade-score-input"
                type="number"
                [value]="gradeScore()"
                (input)="onGradeScoreInput($event)"
                min="0"
                max="20"
                class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none font-bold text-emerald-800" />
            </div>

            <div>
              <label for="grade-feedback-textarea" class="block font-semibold text-slate-700 mb-1">
                {{ lang.tr("Remarque & Conseils pour l'élève", 'ملاحظات وتوجيهات للتلميذ') }}
              </label>
              <textarea
                id="grade-feedback-textarea"
                [value]="gradeFeedback()"
                (input)="onGradeFeedbackInput($event)"
                rows="3"
                placeholder="Ex: Bravo pour la démarche ! Fais attention aux unités à la fin..."
                class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none"></textarea>
            </div>

            <button (click)="submitGrading()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl cursor-pointer">
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

  readonly activeTab = signal<'announcements' | 'courses' | 'homeworks' | 'submissions'>('announcements');
  readonly modalType = signal<'none' | 'announcement' | 'course' | 'homework' | 'ai'>('none');
  
  readonly selectedCourseDetail = signal<Course | null>(null);
  readonly gradingSubmission = signal<Submission | null>(null);

  // Form signals
  readonly newAnnounceTitle = signal('📌 Rappel : Devoir de Mathématiques');
  readonly newAnnounceCategory = signal<'exam' | 'homework' | 'supply' | 'urgent' | 'general'>('homework');
  readonly newAnnounceContent = signal('N\'oubliez pas d\'effectuer la série N°3 sur la multiplication pour demain.');

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
  }

  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'exam':
        return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'homework':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'supply':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      case 'urgent':
        return 'bg-red-500 text-white font-black';
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-200';
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
