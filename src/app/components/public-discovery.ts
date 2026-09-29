import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { EducationStore } from '../services/education-store';
import { LanguageService } from '../services/language.service';
import { Course, TeacherProfile } from '../models/education.model';

@Component({
  selector: 'app-public-discovery',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="space-y-6">
      
      <!-- Hero Banner -->
      <div class="bg-gradient-to-br from-teal-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-10 shadow-md relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 max-w-3xl space-y-4">
          <div class="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-bold">
            🇹🇳 {{ lang.tr('La Communauté Éducative Numérique de Tunisie', 'المجتمع التعليمي الرقمي بالمدرسة التونسية') }}
          </div>

          <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {{ lang.tr('Stop aux groupes Facebook dispersés.', 'لا لمجموعات التواصل المشتتة.') }} <br />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
              {{ lang.t('publicHeroTitle') }}
            </span>
          </h1>

          <p class="text-slate-300 text-xs sm:text-sm leading-relaxed">
            {{ publicSubText() }}
          </p>

          <!-- Search Bar -->
          <div class="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <div class="relative w-full">
              <span class="material-icons absolute left-3.5 top-3 text-slate-400 text-lg">search</span>
              <input
                type="text"
                [value]="store.searchQuery()"
                (input)="onSearchInput($event)"
                [placeholder]="lang.t('searchPlaceholder')"
                class="w-full bg-white text-slate-900 placeholder-slate-400 pl-10 pr-4 py-3 rounded-2xl outline-none font-medium text-xs border border-slate-200 shadow-sm" />
            </div>

            <!-- Grade Filter Dropdown -->
            <select
              [value]="store.selectedGradeFilter()"
              (change)="onGradeChange($event)"
              class="w-full sm:w-auto bg-slate-800 text-white border border-slate-700 px-4 py-3 rounded-2xl text-xs font-semibold cursor-pointer outline-none shrink-0">
              <option value="Tous">{{ lang.t('filterGradeAll') }}</option>
              <option value="1ère Année">1ère Année Primaire / السنة الأولى</option>
              <option value="2ème Année">2ème Année Primaire / السنة الثانية</option>
              <option value="3ème Année">3ème Année Primaire / السنة الثالثة</option>
              <option value="4ème Année">4ème Année Primaire / السنة الرابعة</option>
              <option value="5ème Année">5ème Année Primaire / السنة الخامسة</option>
              <option value="6ème Année">6ème Année (Concours) / السنة السادسة</option>
            </select>

            <!-- Subject Filter Dropdown -->
            <select
              [value]="store.selectedSubjectFilter()"
              (change)="onSubjectChange($event)"
              class="w-full sm:w-auto bg-slate-800 text-white border border-slate-700 px-4 py-3 rounded-2xl text-xs font-semibold cursor-pointer outline-none shrink-0">
              <option value="Tous">{{ lang.t('filterSubjectAll') }}</option>
              <option value="Mathématiques">Mathématiques / الرياضيات</option>
              <option value="Français">Français / الفرنسية</option>
              <option value="اللغة العربية">اللغة العربية</option>
              <option value="Éveil Scientifique">Éveil Scientifique / الإيقاظ العلمي</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Main Directory Navigation Tabs -->
      <div class="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          (click)="activeSection.set('courses')"
          [class]="activeSection() === 'courses' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-700 font-medium'"
          class="px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer">
          <span class="material-icons text-sm">menu_book</span>
          <span>{{ lang.tr('Banque de Cours & Fiches', 'مكتبة الدروس والملخصات') }} ({{ store.filteredCourses().length }})</span>
        </button>

        <button
          (click)="activeSection.set('exercises')"
          [class]="activeSection() === 'exercises' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-700 font-medium'"
          class="px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer">
          <span class="material-icons text-sm">fitness_center</span>
          <span>{{ lang.tr('Séries & Corrigés Détaillés', 'السلاسل والإصلاحات') }} ({{ store.filteredExercisesBank().length }})</span>
        </button>

        <button
          (click)="activeSection.set('teachers')"
          [class]="activeSection() === 'teachers' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-700 font-medium'"
          class="px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer">
          <span class="material-icons text-sm">verified</span>
          <span>{{ lang.t('teachersDirectory') }} ({{ store.teachers().length }})</span>
        </button>
      </div>

      <!-- SECTION 1: PUBLIC COURSES -->
      @if (activeSection() === 'courses') {
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (c of store.filteredCourses(); track c.id) {
            <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between hover:border-emerald-300 transition-all">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {{ c.subject }}
                  </span>
                  <span class="text-[11px] font-semibold text-slate-400">{{ c.grade }}</span>
                </div>

                <h3 class="font-bold text-slate-900 text-base leading-snug">{{ c.title }}</h3>
                <p class="text-xs text-slate-600 leading-relaxed">{{ c.summary }}</p>
              </div>

              <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="material-icons text-slate-400 text-sm">person</span>
                  <span class="text-xs text-slate-700 font-semibold">{{ c.teacherName }}</span>
                </div>

                <button
                  (click)="viewCourseModal.set(c)"
                  class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl cursor-pointer">
                  {{ lang.tr('Lire la Fiche', 'قراءة الملخص') }}
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- SECTION 2: EXERCISES BANK -->
      @if (activeSection() === 'exercises') {
        <div class="grid md:grid-cols-2 gap-6">
          @for (ex of store.filteredExercisesBank(); track ex.id) {
            <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {{ ex.subject }}
                    </span>
                    <span class="text-[11px] text-slate-500 font-medium">{{ ex.grade }}</span>
                  </div>
                  <span class="text-xs font-bold text-emerald-700">{{ ex.difficulty }}</span>
                </div>

                <h3 class="font-bold text-slate-900 text-sm">{{ ex.title }}</h3>
                <p class="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 leading-relaxed font-mono">
                  "{{ ex.promptText }}"
                </p>
              </div>

              <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  (click)="toggleSolution(ex.id)"
                  class="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer">
                  <span class="material-icons text-sm">visibility</span>
                  {{ openSolutionIds().has(ex.id) ? lang.tr('Masquer la correction', 'إخفاء الإصلاح') : lang.tr('Voir le corrigé détaillé', 'عرض الإصلاح المفصل') }}
                </button>

                <button
                  (click)="simulateDownload()"
                  class="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer">
                  <span class="material-icons text-xs">file_download</span> PDF
                </button>
              </div>

              @if (openSolutionIds().has(ex.id)) {
                <div class="bg-emerald-50 text-emerald-900 p-4 rounded-2xl border border-emerald-200 text-xs space-y-1">
                  <span class="font-bold">{{ lang.tr('Corrigé type :', 'الإصلاح النموذجي:') }}</span>
                  <p class="whitespace-pre-line">{{ ex.solutionText }}</p>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- SECTION 3: TEACHERS DIRECTORY -->
      @if (activeSection() === 'teachers') {
        <div class="grid md:grid-cols-3 gap-6">
          @for (t of store.teachers(); track t.id) {
            <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 text-center hover:border-emerald-300 transition-all">
              <div class="relative inline-block mx-auto">
                <img [src]="t.avatarUrl" alt="Teacher" class="w-20 h-20 rounded-full object-cover border-4 border-emerald-500 shadow-sm" />
                @if (t.verifiedBadge) {
                  <span class="material-icons absolute bottom-0 right-0 bg-emerald-600 text-white rounded-full text-base p-0.5 border-2 border-white">
                    verified
                  </span>
                }
              </div>

              <div>
                <h3 class="font-black text-slate-900 text-base">{{ t.name }}</h3>
                <p class="text-xs text-slate-500 font-medium">{{ t.title }}</p>
                <p class="text-[11px] text-emerald-700 font-semibold mt-0.5">{{ t.school }}</p>
              </div>

              <p class="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                "{{ t.bio }}"
              </p>

              <!-- Teacher Stats -->
              <div class="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-xs">
                <div>
                  <p class="font-black text-slate-900">{{ t.coursesCount }}</p>
                  <p class="text-[10px] text-slate-400">{{ lang.tr('Cours', 'دروس') }}</p>
                </div>
                <div>
                  <p class="font-black text-slate-900">{{ t.exercisesCount }}</p>
                  <p class="text-[10px] text-slate-400">{{ lang.tr('Exercices', 'تمارين') }}</p>
                </div>
                <div>
                  <p class="font-black text-slate-900">⭐ {{ t.rating }}</p>
                  <p class="text-[10px] text-slate-400">{{ lang.tr('Avis', 'تقييمات') }} ({{ t.reviewsCount }})</p>
                </div>
              </div>

              <button
                (click)="selectedTeacherModal.set(t)"
                class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer">
                {{ lang.tr('Consulter le Profil Digital', 'عرض الملف المهني') }}
              </button>
            </div>
          }
        </div>
      }

    </div>

    <!-- MODAL: COURSE VIEW -->
    @if (viewCourseModal(); as c) {
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                {{ c.subject }}
              </span>
              <h3 class="font-bold text-slate-900 text-lg mt-1">{{ c.title }}</h3>
            </div>
            <button (click)="viewCourseModal.set(null)" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="prose prose-slate max-w-none text-xs leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-200 font-sans">
            {{ c.content }}
          </div>

          <div class="flex justify-between items-center pt-2">
            <span class="text-xs text-slate-500">{{ lang.tr('Par', 'من إعداد') }} {{ c.teacherName }}</span>
            <button (click)="viewCourseModal.set(null)" class="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer">
              {{ lang.tr('Fermer', 'إغلاق') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL: TEACHER PROFILE -->
    @if (selectedTeacherModal(); as t) {
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl text-center">
          <img [src]="t.avatarUrl" alt="Avatar" class="w-24 h-24 rounded-full object-cover border-4 border-emerald-500 mx-auto shadow-sm" />
          
          <div>
            <h3 class="font-black text-slate-900 text-lg">{{ t.name }}</h3>
            <p class="text-xs text-emerald-700 font-semibold">{{ t.title }}</p>
            <p class="text-[11px] text-slate-500">{{ t.school }}</p>
          </div>

          <p class="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 leading-relaxed text-left">
            "{{ t.bio }}"
          </p>

          <button (click)="selectedTeacherModal.set(null)" class="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer">
            {{ lang.tr('Fermer le profil', 'إغلاق الملف') }}
          </button>
        </div>
      </div>
    }
  `,
})
export class PublicDiscoveryComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);

  readonly activeSection = signal<'courses' | 'exercises' | 'teachers'>('courses');
  readonly openSolutionIds = signal<Set<string>>(new Set());

  readonly viewCourseModal = signal<Course | null>(null);
  readonly selectedTeacherModal = signal<TeacherProfile | null>(null);

  publicSubText(): string {
    return this.lang.tr(
      'Trouvez les fiches de cours, séries d\'exercices avec corrigés, et profils d\'enseignants certifiés pour toutes les classes du primaire en Tunisie.',
      'تصفح ملخصات الدروس، سلاسل التمارين والإصلاحات ودليل المعلمين المعتمدين لكافة سنوات المرحلة الابتدائية.'
    );
  }

  onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.store.setSearchQuery(val);
  }

  onGradeChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.store.setGradeFilter(val);
  }

  onSubjectChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.store.setSubjectFilter(val);
  }

  toggleSolution(id: string) {
    const newSet = new Set(this.openSolutionIds());
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    this.openSolutionIds.set(newSet);
  }

  simulateDownload() {
    const msg = this.lang.tr(
      '📄 Génération de la fiche d\'exercice au format PDF imprimable...',
      '📄 جاري تحضير ملف التمرين بصيغة PDF للطباعة...'
    );
    alert(msg);
  }
}
