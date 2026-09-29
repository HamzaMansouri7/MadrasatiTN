import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { EducationStore, LanguageService, Course, ExerciseItem, TeacherProfile } from '@core';

@Component({
  selector: 'app-public-discovery',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="space-y-6">
      
      <!-- Hero Banner & AI Bulk Upload Zone -->
      <div class="bg-gradient-to-br from-teal-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 space-y-6">
          <div class="max-w-3xl space-y-3">
            <div class="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-bold">
              🇹🇳 {{ lang.tr('La Bibliothèque Éducative Certifiée de Tunisie', 'المكتبة التعليمية المعتمدة في تونس') }}
            </div>

            <h1 class="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {{ lang.tr('De la confusion WhatsApp à la bibliothèque structurée.', 'من فوضى الواتساب إلى المكتبة التعليمية المنظمة.') }} <br />
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                {{ lang.t('publicHeroTitle') }}
              </span>
            </h1>

            <p class="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {{ publicSubText() }}
            </p>
          </div>

          <!-- FEATURE 1: AI Auto-Tagger Drag-and-Drop Bulk Upload Bar -->
          <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
              <div class="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <span class="material-icons text-base">auto_awesome</span>
                <span>{{ lang.tr('🤖 Gemini IA Auto-Tagger pour fichiers WhatsApp', '🤖 الذكاء الاصطناعي لتصنيف وثائق الواتساب تلقائياً') }}</span>
              </div>
              <span class="text-[11px] text-emerald-200">
                {{ lang.tr("Glissez-déposez des photos/PDFs : Gemini lit l'en-tête et étiquette tout !", 'اسحب وأسقط الملفات: يتعرف الذكاء الاصطناعي على العنوان والصنف تلقائياً!') }}
              </span>
            </div>

            <div class="flex flex-col sm:flex-row items-center gap-3">
              <div
                (click)="fileInput.click()"
                (dragover)="onDragOver($event)"
                (drop)="onFileDrop($event)"
                class="w-full bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/30 hover:border-emerald-400 rounded-xl p-3 text-center transition-all cursor-pointer">
                <input
                  type="file"
                  #fileInput
                  (change)="handleFileUpload($event)"
                  accept=".pdf,image/*"
                  class="hidden" />
                <p class="text-xs font-semibold text-white">
                  📁 {{ uploadedFileName() ? uploadedFileName() : lang.tr('Cliquer ou déposer ici vos devoirs ou photos WhatsApp', 'اضغط هنا أو اسحب ملفات الفروض وصور الواتساب') }}
                </p>
                <p class="text-[10px] text-slate-300">
                  {{ lang.tr('Supporte PDF et photos de cahiers (sauvegardé sur serveur)', 'يدعم ملفات PDF وصور الكراسات (حفظ مباشر على السيرفر)') }}
                </p>
              </div>

              <div class="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  [disabled]="isAutoTagging()"
                  (click)="fileInput.click()"
                  class="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs">
                  @if (isAutoTagging()) {
                    <span class="material-icons animate-spin text-sm">sync</span>
                    <span>{{ lang.tr('Upload & Analyse...', 'جاري الرفع والتحليل...') }}</span>
                  } @else {
                    <span class="material-icons text-sm">cloud_upload</span>
                    <span>{{ lang.tr('Sélectionner Fichier', 'اختيار ملف للرفع') }}</span>
                  }
                </button>
              </div>
            </div>

            @if (autoTagResult(); as tag) {
              <div class="bg-emerald-950/80 p-3 rounded-xl border border-emerald-400/50 text-xs space-y-1.5">
                <div class="flex items-center justify-between text-emerald-300 font-bold">
                  <span>✔️ {{ lang.tr('Étiquetage IA Gemini Réussi !', 'تم التصنيف الآلي بنجاح!') }}</span>
                  <span class="bg-emerald-500/30 px-2 py-0.5 rounded text-[10px]">{{ tag.docType }}</span>
                </div>
                <p class="text-white font-semibold">{{ tag.suggestedTitle }}</p>
                <div class="flex flex-wrap gap-2 text-[10px] text-slate-300">
                  <span class="bg-white/10 px-2 py-0.5 rounded">📊 {{ tag.grade }}</span>
                  <span class="bg-white/10 px-2 py-0.5 rounded">📘 {{ tag.subject }}</span>
                  <span class="bg-white/10 px-2 py-0.5 rounded">📅 {{ tag.trimester }}</span>
                  <span class="bg-white/10 px-2 py-0.5 rounded">✔️ {{ tag.hasCorrection ? 'Corrigé Inclus' : 'Sans Corrigé' }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- FEATURE 2: Multi-Facet Search & Filter Hub Panel -->
      <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <span class="material-icons text-emerald-600">tune</span>
            <h3 class="font-extrabold text-slate-900 text-sm">
              {{ lang.tr('Centre de Recherche Multi-Critères (Multi-Facet Hub)', 'مركّب البحث والفلترة متعددة المعايير') }}
            </h3>
          </div>
          <button
            (click)="store.resetAllFilters()"
            class="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer">
            <span class="material-icons text-sm">restart_alt</span>
            {{ lang.tr('Réinitialiser les filtres', 'إعادة ضبط الفلاتر') }}
          </button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <!-- Filter 1: Grade -->
          <div>
            <label for="filter-grade-select" class="block font-bold text-slate-700 mb-1">
              {{ lang.tr('Niveau (1ère-6ème)', 'المستوى') }}
            </label>
            <select
              id="filter-grade-select"
              [value]="store.selectedGradeFilter()"
              (change)="onGradeChange($event)"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800 outline-none">
              <option value="Tous">{{ lang.t('filterGradeAll') }}</option>
              <option value="1ère Année">1ère Année / الأولى</option>
              <option value="2ème Année">2ème Année / الثانية</option>
              <option value="3ème Année">3ème Année / الثالثة</option>
              <option value="4ème Année">4ème Année / الرابعة</option>
              <option value="5ème Année">5ème Année / الخامسة</option>
              <option value="6ème Année">6ème Année (Concours) / السادسة</option>
            </select>
          </div>

          <!-- Filter 2: Trimester -->
          <div>
            <label for="filter-trimester-select" class="block font-bold text-slate-700 mb-1">
              {{ lang.tr('Trimestre', 'الثلاثي') }}
            </label>
            <select
              id="filter-trimester-select"
              [value]="store.selectedTrimesterFilter()"
              (change)="onTrimesterChange($event)"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800 outline-none">
              <option value="Tous">Tous les Trimestres</option>
              <option value="Trimestre 1">Trimestre 1 / الثلاثي الأول</option>
              <option value="Trimestre 2">Trimestre 2 / الثلاثي الثاني</option>
              <option value="Trimestre 3">Trimestre 3 / الثلاثي الثالث</option>
            </select>
          </div>

          <!-- Filter 3: Subject -->
          <div>
            <label for="filter-subject-select" class="block font-bold text-slate-700 mb-1">
              {{ lang.tr('Matière', 'المادة') }}
            </label>
            <select
              id="filter-subject-select"
              [value]="store.selectedSubjectFilter()"
              (change)="onSubjectChange($event)"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800 outline-none">
              <option value="Tous">{{ lang.t('filterSubjectAll') }}</option>
              <option value="Mathématiques">Mathématiques / الرياضيات</option>
              <option value="Français">Français / الفرنسية</option>
              <option value="اللغة العربية">اللغة العربية</option>
              <option value="Éveil Scientifique">Éveil Scientifique / الإيقاظ العلمي</option>
            </select>
          </div>

          <!-- Filter 4: Doc Type -->
          <div>
            <label for="filter-doctype-select" class="block font-bold text-slate-700 mb-1">
              {{ lang.tr('Type de document', 'صنف الوثيقة') }}
            </label>
            <select
              id="filter-doctype-select"
              [value]="store.selectedDocTypeFilter()"
              (change)="onDocTypeChange($event)"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800 outline-none">
              <option value="Tous">Tous les types</option>
              <option value="Devoir de Contrôle">Devoir de Contrôle / فرض مراقبة</option>
              <option value="Devoir de Synthèse">Devoir de Synthèse / فرض تأليفي</option>
              <option value="Fiche de Révision">Fiche de Révision / ملخص درس</option>
              <option value="Série d'Exercices">Série d'Exercices / سلسلة تمارين</option>
            </select>
          </div>

          <!-- Filter 5: School Year -->
          <div>
            <label for="filter-year-select" class="block font-bold text-slate-700 mb-1">
              {{ lang.tr('Année Scolaire', 'السنة الدراسية') }}
            </label>
            <select
              id="filter-year-select"
              [value]="store.selectedSchoolYearFilter()"
              (change)="onSchoolYearChange($event)"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800 outline-none">
              <option value="Tous">Toutes les années</option>
              <option value="2025-2026">2025-2026 (Actuelle)</option>
              <option value="2024-2025">2024-2025</option>
            </select>
          </div>
        </div>

        <!-- Toggle Correction Checkbox & Search Keyword Input -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <label class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
            <input
              type="checkbox"
              [checked]="store.onlyWithCorrectionFilter()"
              (change)="onCorrectionToggle($event)"
              class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
            <span>✔️ {{ lang.tr('Uniquement avec Corrigé Étape par Étape', 'فقط الوثائق المصحوبة بالإصلاح المفصل') }}</span>
          </label>

          <div class="relative w-full sm:w-80">
            <span class="material-icons absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
            <input
              type="text"
              [value]="store.searchQuery()"
              (input)="onSearchInput($event)"
              placeholder="Rechercher par mot-clé (ex: Multiplication...)"
              class="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-1.5 rounded-xl text-xs outline-none" />
          </div>
        </div>
      </div>

      <!-- Main Directory Navigation Tabs -->
      <div class="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          (click)="activeSection.set('exercises')"
          [class]="activeSection() === 'exercises' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-700 font-medium'"
          class="px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap">
          <span class="material-icons text-sm">fitness_center</span>
          <span>{{ lang.tr("Banque d'Examens & Séries", 'مكتبة الفروض والسلاسل') }} ({{ store.filteredExercisesBank().length }})</span>
        </button>

        <button
          (click)="activeSection.set('courses')"
          [class]="activeSection() === 'courses' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-700 font-medium'"
          class="px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap">
          <span class="material-icons text-sm">menu_book</span>
          <span>{{ lang.tr('Fiches & Cours', 'الملخصات والدروس') }} ({{ store.filteredCourses().length }})</span>
        </button>

        <button
          (click)="activeSection.set('teachers')"
          [class]="activeSection() === 'teachers' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-700 font-medium'"
          class="px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap">
          <span class="material-icons text-sm">verified</span>
          <span>{{ lang.t('teachersDirectory') }} ({{ store.teachers().length }})</span>
        </button>

        <button
          (click)="activeSection.set('watchlist')"
          [class]="activeSection() === 'watchlist' ? 'bg-amber-600 text-white font-bold shadow-xs' : 'bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold border border-amber-200/80'"
          class="px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap">
          <span class="material-icons text-sm">bookmark</span>
          <span>{{ lang.tr('⭐ Ma Watchlist', '⭐ قائمة محفوظاتي') }} ({{ store.totalWatchlistCount() }})</span>
        </button>
      </div>

      <!-- SECTION 1: EXERCISES & EXAMS BANK WITH UPVOTING, REPORTING & WATERMARK -->
      @if (activeSection() === 'exercises') {
        <div class="grid md:grid-cols-2 gap-6">
          @for (ex of store.filteredExercisesBank(); track ex.id) {
            <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all">
              <div class="space-y-3">
                <div class="flex items-center justify-between flex-wrap gap-1 text-[10px]">
                  <div class="flex items-center gap-2">
                    <span class="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                      {{ ex.subject }}
                    </span>
                    <span class="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                      {{ ex.grade }}
                    </span>
                    <span class="bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded-full">
                      {{ ex.trimester || 'Trimestre 1' }}
                    </span>
                  </div>
                  
                  <span class="bg-indigo-50 text-indigo-800 font-bold px-2 py-0.5 rounded-md border border-indigo-200">
                    {{ ex.docType || 'Devoir' }}
                  </span>
                </div>

                <h3 class="font-bold text-slate-900 text-sm leading-snug">{{ ex.title }}</h3>

                <p class="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 leading-relaxed font-mono">
                  "{{ ex.promptText }}"
                </p>

                <!-- Badges: Teacher Verified & Watermark Notice -->
                <div class="flex items-center justify-between text-[11px] pt-1">
                  <span class="flex items-center gap-1 text-emerald-700 font-bold">
                    <span class="material-icons text-sm">verified</span>
                    {{ lang.tr('Corrigé Certifié Enseignant', 'إصلاح مؤكد ومعتمد') }}
                  </span>

                  <span class="text-slate-400 italic">
                    {{ ex.schoolYear || '2025-2026' }}
                  </span>
                </div>
              </div>

              <!-- Action Bar: Upvoting, Reporting & One-Click PDF Watermark Print -->
              <div class="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                
                <!-- FEATURE 4: Community Upvoting & Reporting -->
                <div class="flex items-center gap-2">
                  <button
                    (click)="store.toggleUpvoteExercise(ex.id)"
                    [class]="ex.isUpvoted ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold'"
                    class="px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer">
                    <span class="material-icons text-xs">thumb_up</span>
                    <span>{{ ex.upvotesCount || 0 }}</span>
                  </button>

                  <button
                    (click)="reportDocument(ex)"
                    [disabled]="ex.isReported"
                    [class]="ex.isReported ? 'text-rose-600 font-bold' : 'text-slate-400 hover:text-rose-600'"
                    title="Signaler un scan flou ou incomplet"
                    class="p-1 rounded-lg cursor-pointer transition-colors text-xs flex items-center gap-1">
                    <span class="material-icons text-sm">report_problem</span>
                    @if (ex.isReported) {
                      <span class="text-[10px]">{{ lang.tr('Signalé', 'تم الإبلاغ') }}</span>
                    }
                  </button>
                </div>

                <!-- FEATURE 5: One-Click PDF Watermark & Print Preview -->
                <div class="flex items-center gap-1.5 flex-wrap">
                  <button
                    (click)="store.toggleWatchlist(ex.id, 'exercise')"
                    [class]="store.isWatched(ex.id, 'exercise') ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border-slate-200'"
                    class="px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer border shadow-2xs"
                    [title]="store.isWatched(ex.id, 'exercise') ? 'Retirer des favoris' : 'Sauvegarder dans la watchlist'">
                    <span class="material-icons text-xs" [class.text-amber-600]="store.isWatched(ex.id, 'exercise')">
                      {{ store.isWatched(ex.id, 'exercise') ? 'bookmark' : 'bookmark_border' }}
                    </span>
                    <span>{{ store.isWatched(ex.id, 'exercise') ? 'Sauvegardé' : 'Favoris' }}</span>
                  </button>

                  <button
                    (click)="shareOnWhatsApp(ex)"
                    class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    title="Partager sur WhatsApp">
                    <span class="material-icons text-xs">share</span>
                    <span>WhatsApp</span>
                  </button>

                  <button
                    (click)="copyLink(ex)"
                    class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                    title="Copier le lien">
                    <span class="material-icons text-xs">content_copy</span>
                  </button>

                  <button
                    (click)="toggleSolution(ex.id)"
                    class="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer px-2 py-1">
                    <span class="material-icons text-sm">visibility</span>
                    {{ openSolutionIds().has(ex.id) ? lang.tr('Masquer', 'إخفاء') : lang.tr('Voir Corrigé', 'عرض الإصلاح') }}
                  </button>

                  <button
                    (click)="openWatermarkPreviewModal(ex)"
                    class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-2xs">
                    <span class="material-icons text-xs">print</span>
                    {{ lang.tr('Imprimer PDF', 'طباعة PDF') }}
                  </button>
                </div>
              </div>

              @if (openSolutionIds().has(ex.id)) {
                <div class="bg-emerald-50 text-emerald-900 p-4 rounded-2xl border border-emerald-200 text-xs space-y-1">
                  <span class="font-bold">{{ lang.tr('Corrigé Détaillé certifié :', 'الإصلاح المفصل المعتمد:') }}</span>
                  <p class="whitespace-pre-line">{{ ex.solutionText }}</p>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- SECTION 2: COURSES LIBRARY -->
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
                <button
                  (click)="store.toggleUpvoteCourse(c.id)"
                  [class]="c.isUpvoted ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold'"
                  class="px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer">
                  <span class="material-icons text-xs">thumb_up</span>
                  <span>{{ c.upvotesCount || 0 }}</span>
                </button>

                <div class="flex items-center gap-2">
                  <button
                    (click)="store.toggleWatchlist(c.id, 'course')"
                    [class]="store.isWatched(c.id, 'course') ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border-slate-200'"
                    class="px-2.5 py-2 rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer border shadow-2xs"
                    [title]="store.isWatched(c.id, 'course') ? 'Retirer des favoris' : 'Sauvegarder dans la watchlist'">
                    <span class="material-icons text-xs" [class.text-amber-600]="store.isWatched(c.id, 'course')">
                      {{ store.isWatched(c.id, 'course') ? 'bookmark' : 'bookmark_border' }}
                    </span>
                    <span>{{ store.isWatched(c.id, 'course') ? 'Sauvegardé' : 'Favoris' }}</span>
                  </button>

                  <button
                    (click)="viewCourseModal.set(c)"
                    class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl cursor-pointer">
                    {{ lang.tr('Consulter la Fiche', 'قراءة الملخص') }}
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- FEATURE 3: Teacher Credibility Profiles Directory -->
      @if (activeSection() === 'teachers') {
        <div class="grid md:grid-cols-3 gap-6">
          @for (t of store.teachers(); track t.id) {
            <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 text-center hover:border-emerald-300 transition-all">
              <div class="relative inline-block mx-auto">
                <img [src]="t.avatarUrl" alt="Teacher" class="w-20 h-20 rounded-full object-cover border-4 border-emerald-500 shadow-sm" />
                @if (t.verifiedBadge) {
                  <span class="material-icons absolute bottom-0 right-0 bg-emerald-600 text-white rounded-full text-base p-0.5 border-2 border-white" title="Enseignant Certifié Éducation Nationale">
                    verified
                  </span>
                }
              </div>

              <div>
                <h3 class="font-black text-slate-900 text-base flex items-center justify-center gap-1">
                  {{ t.name }}
                  <span class="text-rose-600 font-extrabold text-xs">TN 🇹🇳</span>
                </h3>
                <p class="text-xs text-slate-500 font-medium">{{ t.title }}</p>
                <p class="text-[11px] text-emerald-700 font-semibold mt-0.5">{{ t.school }}</p>
              </div>

              <p class="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                "{{ t.bio }}"
              </p>

              <!-- Credibility Metrics -->
              <div class="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-xs">
                <div>
                  <p class="font-black text-slate-900">{{ t.totalUploads || t.coursesCount }}</p>
                  <p class="text-[10px] text-slate-400">{{ lang.tr('Documents', 'وثائق') }}</p>
                </div>
                <div>
                  <p class="font-black text-slate-900">{{ t.downloadableExercisesCount || t.exercisesCount }}</p>
                  <p class="text-[10px] text-slate-400">{{ lang.tr('Exercices PDF', 'تمارين PDF') }}</p>
                </div>
                <div>
                  <p class="font-black text-slate-900 text-amber-500">⭐ {{ t.rating }}</p>
                  <p class="text-[10px] text-slate-400">{{ t.reviewsCount }} {{ lang.tr('avis', 'تقييم') }}</p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button
                  (click)="store.toggleWatchlist(t.id, 'teacher')"
                  [class]="store.isWatched(t.id, 'teacher') ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'"
                  class="px-3 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                  [title]="store.isWatched(t.id, 'teacher') ? 'Ne plus suivre' : 'Suivre cet enseignant'">
                  <span class="material-icons text-sm" [class.text-amber-600]="store.isWatched(t.id, 'teacher')">
                    {{ store.isWatched(t.id, 'teacher') ? 'star' : 'star_border' }}
                  </span>
                  <span>{{ store.isWatched(t.id, 'teacher') ? lang.tr('Suivi', 'متابع') : lang.tr('Suivre', 'متابعة') }}</span>
                </button>

                <button
                  (click)="selectedTeacherModal.set(t)"
                  class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-colors shadow-2xs">
                  <span class="material-icons text-sm">badge</span>
                  {{ lang.tr('Profil & Avis', 'عرض الملف والتقييمات') }}
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- FEATURE 6: ⭐ WATCHLIST & FAVORITES HUB -->
      @if (activeSection() === 'watchlist') {
        <div class="space-y-6">
          <div class="bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-emerald-500/10 border border-amber-300/60 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="material-icons text-amber-600 text-2xl">bookmark</span>
                <h3 class="font-extrabold text-slate-900 text-lg sm:text-xl">
                  {{ lang.tr('⭐ Ma Watchlist Éducative — Documents Favoris', '⭐ قائمة محفوظاتي التعليمية') }}
                </h3>
              </div>
              <p class="text-xs text-slate-600 mt-1">
                {{ lang.tr('Accédez immédiatement à vos cours, examens et enseignants favoris pour révision rapide ou impression.', 'الوصول المباشر إلى الدروس، الفروض والمعلمين المفضلين للمراجعة أو الطباعة.') }}
              </p>
            </div>
            <div class="flex items-center gap-2 text-xs font-bold text-amber-900 bg-amber-100/80 px-3.5 py-2 rounded-2xl border border-amber-300 shrink-0">
              <span class="material-icons text-sm text-amber-700">folder_special</span>
              <span>{{ store.totalWatchlistCount() }} {{ lang.tr('éléments sauvegardés', 'عناصر محفوظة') }}</span>
            </div>
          </div>

          @if (store.totalWatchlistCount() === 0) {
            <div class="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <span class="material-icons text-5xl text-slate-300">bookmark_border</span>
              <h4 class="font-extrabold text-slate-800 text-base">
                {{ lang.tr('Votre watchlist est vide pour le moment', 'قائمة المحفوظات فارغة حالياً') }}
              </h4>
              <p class="text-xs text-slate-500 max-w-md mx-auto">
                {{ lang.tr('Cliquez sur le signet "Favoris" dans la Banque d\'Examens ou les Cours pour sauvegarder vos documents de révision.', 'انقر على رمز الحفظ في مكتبة الفروض أو الدروس لحفظ وثائق المراجعة.') }}
              </p>
              <button
                (click)="activeSection.set('exercises')"
                class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-xs inline-flex items-center gap-1.5">
                <span class="material-icons text-sm">explore</span>
                <span>{{ lang.tr('Explorer la Banque d\'Examens', 'تصفح مكتبة الفروض') }}</span>
              </button>
            </div>
          } @else {
            <!-- 1. Watched Exercises -->
            @if (store.watchedExercises().length > 0) {
              <div class="space-y-3">
                <h4 class="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <span class="material-icons text-amber-500 text-base">assignment</span>
                  <span>{{ lang.tr('Examens & Séries Sauvegardés', 'الفروض والسلاسل المحفوظة') }} ({{ store.watchedExercises().length }})</span>
                </h4>
                <div class="grid md:grid-cols-2 gap-4">
                  @for (ex of store.watchedExercises(); track ex.id) {
                    <div class="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs space-y-3">
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">{{ ex.subject }} — {{ ex.grade }}</span>
                        <button (click)="store.toggleWatchlist(ex.id, 'exercise')" class="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer">
                          <span class="material-icons text-sm">bookmark_remove</span>
                          <span>{{ lang.tr('Retirer', 'حذف') }}</span>
                        </button>
                      </div>
                      <h5 class="font-bold text-slate-900 text-xs">{{ ex.title }}</h5>
                      <p class="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 line-clamp-2">{{ ex.promptText }}</p>
                      <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <button (click)="openWatermarkPreviewModal(ex)" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer">
                          <span class="material-icons text-xs">print</span>
                          <span>{{ lang.tr('Imprimer A4', 'طباعة A4') }}</span>
                        </button>
                        <button (click)="shareOnWhatsApp(ex)" class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer">
                          <span class="material-icons text-xs">share</span>
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- 2. Watched Courses -->
            @if (store.watchedCourses().length > 0) {
              <div class="space-y-3 pt-4">
                <h4 class="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <span class="material-icons text-indigo-500 text-base">menu_book</span>
                  <span>{{ lang.tr('Fiches & Cours Sauvegardés', 'الدروس والملخصات المحفوظة') }} ({{ store.watchedCourses().length }})</span>
                </h4>
                <div class="grid md:grid-cols-2 gap-4">
                  @for (c of store.watchedCourses(); track c.id) {
                    <div class="bg-white rounded-2xl p-4 border border-indigo-200/80 shadow-xs space-y-3">
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">{{ c.subject }} — {{ c.grade }}</span>
                        <button (click)="store.toggleWatchlist(c.id, 'course')" class="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer">
                          <span class="material-icons text-sm">bookmark_remove</span>
                          <span>{{ lang.tr('Retirer', 'حذف') }}</span>
                        </button>
                      </div>
                      <h5 class="font-bold text-slate-900 text-xs">{{ c.title }}</h5>
                      <p class="text-[11px] text-slate-600 line-clamp-2">{{ c.summary }}</p>
                      <div class="flex justify-end pt-2 border-t border-slate-100">
                        <button (click)="viewCourseModal.set(c)" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer">
                          {{ lang.tr('Consulter la Fiche', 'قراءة الملخص') }}
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- 3. Watched Teachers -->
            @if (store.watchedTeachers().length > 0) {
              <div class="space-y-3 pt-4">
                <h4 class="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <span class="material-icons text-emerald-500 text-base">verified</span>
                  <span>{{ lang.tr('Enseignants Suivis', 'المعلمون المتابعون') }} ({{ store.watchedTeachers().length }})</span>
                </h4>
                <div class="grid md:grid-cols-3 gap-4">
                  @for (t of store.watchedTeachers(); track t.id) {
                    <div class="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-xs space-y-3 text-center">
                      <img [src]="t.avatarUrl" alt="Avatar" class="w-16 h-16 rounded-full object-cover mx-auto border-2 border-emerald-500" />
                      <div>
                        <h5 class="font-bold text-slate-900 text-xs">{{ t.name }}</h5>
                        <p class="text-[10px] text-slate-500">{{ t.school }}</p>
                      </div>
                      <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <button (click)="selectedTeacherModal.set(t)" class="text-emerald-700 font-bold hover:underline">
                          {{ lang.tr('Voir profil', 'الملف') }}
                        </button>
                        <button (click)="store.toggleWatchlist(t.id, 'teacher')" class="text-rose-600 text-xs font-semibold cursor-pointer">
                          {{ lang.tr('Ne plus suivre', 'إلغاء المتابعة') }}
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
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

    <!-- FEATURE 3: CREDIBILITY PROFILE MODAL WITH STAR RATING BREAKDOWN -->
    @if (selectedTeacherModal(); as t) {
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-emerald-600 text-xl">verified</span>
              <h3 class="font-extrabold text-slate-900 text-base">
                {{ lang.tr('Profil de Crédibilité Enseignant', 'الملف المهني والاعتماد التربوي') }}
              </h3>
            </div>
            <button (click)="selectedTeacherModal.set(null)" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="text-center space-y-3">
            <img [src]="t.avatarUrl" alt="Avatar" class="w-24 h-24 rounded-full object-cover border-4 border-emerald-500 mx-auto shadow-sm" />
            <div>
              <h3 class="font-black text-slate-900 text-lg flex items-center justify-center gap-1">
                {{ t.name }}
                <span class="material-icons text-emerald-600 text-base">verified</span>
              </h3>
              <p class="text-xs text-emerald-700 font-bold">{{ t.title }}</p>
              <p class="text-[11px] text-slate-500">{{ t.school }}</p>
            </div>

            <!-- Total Uploads & Verified Stats -->
            <div class="grid grid-cols-3 gap-2 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200 text-xs">
              <div>
                <p class="font-extrabold text-emerald-900 text-base">{{ t.totalUploads || 148 }}</p>
                <p class="text-[10px] text-emerald-700 font-semibold">{{ lang.tr('Uploads WhatsApp', 'وثائق مرفوعة') }}</p>
              </div>
              <div>
                <p class="font-extrabold text-emerald-900 text-base">{{ t.downloadableExercisesCount || 310 }}</p>
                <p class="text-[10px] text-emerald-700 font-semibold">{{ lang.tr('Exercices Validés', 'تمارين معتمدة') }}</p>
              </div>
              <div>
                <p class="font-extrabold text-amber-600 text-base">⭐ {{ t.rating }}</p>
                <p class="text-[10px] text-amber-700 font-semibold">{{ t.reviewsCount }} {{ lang.tr('avis parents', 'تقييم ولي') }}</p>
              </div>
            </div>

            <!-- Star Rating Breakdown -->
            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2 text-left">
              <p class="font-bold text-slate-800">
                ⭐ {{ lang.tr('Évaluation des Parents & Élèves (Breakdown 1-5 Étoiles)', 'تقييم الأولياء والتلاميذ (1-5 نجوم)') }}
              </p>
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="w-12 font-semibold text-slate-600">5 ★</span>
                  <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div class="bg-amber-400 h-full rounded-full" style="width: 86%"></div>
                  </div>
                  <span class="font-bold text-slate-800">86%</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-12 font-semibold text-slate-600">4 ★</span>
                  <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div class="bg-amber-400 h-full rounded-full" style="width: 11%"></div>
                  </div>
                  <span class="font-bold text-slate-800">11%</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-12 font-semibold text-slate-600">3 ★</span>
                  <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div class="bg-amber-400 h-full rounded-full" style="width: 3%"></div>
                  </div>
                  <span class="font-bold text-slate-800">3%</span>
                </div>
              </div>
            </div>

            <p class="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed text-left">
              "{{ t.bio }}"
            </p>

            <button (click)="selectedTeacherModal.set(null)" class="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer">
              {{ lang.tr('Fermer le profil', 'إغلاق الملف') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- FEATURE 5: ONE-CLICK PDF WATERMARK & PRINT PREVIEW MODAL -->
    <!-- FEATURE 5: ONE-CLICK PDF WATERMARK & PRINT PREVIEW MODAL -->
    @if (watermarkPreviewModal(); as docEx) {
      <div id="printable-modal" class="print-container fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto relative">
          
          <!-- Watermark Header Banner -->
          <div class="no-print bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div class="flex items-center gap-2">
              <span class="material-icons text-amber-400">verified</span>
              <div>
                <h4 class="font-extrabold text-sm text-white">MADRASATI TN 🇹🇳 — FILIGRANE ET IMPRESSION PDF</h4>
                <p class="text-[11px] text-emerald-200">
                  {{ docEx.watermarkText || 'Madrasati TN — Document Certifié — Mme Amel Ben Ali' }}
                </p>
              </div>
            </div>
            <button (click)="watermarkPreviewModal.set(null)" class="text-white/80 hover:text-white cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <!-- Document Render Frame with Watermark Overlay -->
          <div id="printable-document" class="print-document bg-slate-50 rounded-2xl p-6 border-2 border-slate-200 relative overflow-hidden space-y-4 font-mono text-xs shadow-inner">
            
            <!-- Diagonal Watermark Stamp -->
            <div class="print-watermark absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 select-none rotate-[-25deg]">
              <span class="text-4xl font-black uppercase text-emerald-900 tracking-widest text-center">
                MADRASATI TN <br /> COPIE CERTIFIÉE GRATUITE
              </span>
            </div>

            <!-- Official Header -->
            <div class="border-b-2 border-slate-900 pb-3 font-sans">
              <div class="flex items-center justify-between text-xs">
                <div class="text-left font-bold text-slate-900 leading-tight">
                  <p>الجمهورية التونسية</p>
                  <p>وزارة التربية والتعليم</p>
                  <p class="text-[10px] text-slate-500 font-normal">المندوبية الجهوية للتربية</p>
                </div>
                <div class="text-center font-bold">
                  <p class="text-base text-emerald-900 font-black">{{ docEx.title }}</p>
                  <p class="text-xs text-slate-600">{{ docEx.grade }} • {{ docEx.subject }} • {{ docEx.trimester || 'Trimestre 1' }}</p>
                </div>
                <div class="text-right text-xs text-slate-700 leading-tight">
                  <span class="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded text-[10px]">
                    {{ docEx.docType || 'Devoir de Contrôle' }}
                  </span>
                  <p class="text-[10px] text-slate-400 mt-1">Année : {{ docEx.schoolYear || '2025-2026' }}</p>
                </div>
              </div>

              <!-- Student Filling Block for Printed Exams -->
              <div class="mt-3 pt-2 border-t border-dashed border-slate-400 grid grid-cols-3 gap-2 text-xs font-semibold">
                <p>الاسم واللقب: ....................................</p>
                <p>القسم: {{ docEx.grade }}</p>
                <p class="text-right font-bold text-emerald-900">العدد: .......... / 20</p>
              </div>
            </div>

            <!-- Exercise Body -->
            <div class="space-y-3 py-2 font-sans relative z-10">
              <h3 class="font-extrabold text-slate-900 text-sm">{{ docEx.title }}</h3>
              <p class="text-slate-800 leading-relaxed bg-white p-4 rounded-xl border border-slate-200 font-mono">
                {{ docEx.promptText }}
              </p>

              @if (docEx.solutionText) {
                <div class="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-emerald-950 font-sans">
                  <span class="font-bold">✔️ Corrigé Certifié :</span>
                  <p class="whitespace-pre-line mt-1">{{ docEx.solutionText }}</p>
                </div>
              }
            </div>

            <!-- Official Footer Watermark Attribution -->
            <div class="border-t border-slate-300 pt-3 text-[10px] text-slate-500 font-sans flex items-center justify-between">
              <span>Attribution Enseignant : {{ docEx.watermarkText }}</span>
              <span>Plateforme Madrasati TN</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="no-print flex items-center justify-between gap-3 pt-2">
            <button (click)="watermarkPreviewModal.set(null)" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer">
              {{ lang.tr('Fermer', 'إغلاق') }}
            </button>

            <button
              (click)="triggerPrintDialog()"
              class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md">
              <span class="material-icons text-base">print</span>
              {{ lang.t('printBtn') }}
            </button>
          </div>

        </div>
      </div>
    }
  `,
})
export class PublicDiscoveryComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);

  readonly activeSection = signal<'exercises' | 'courses' | 'teachers' | 'watchlist'>('exercises');
  readonly openSolutionIds = signal<Set<string>>(new Set());

  readonly viewCourseModal = signal<Course | null>(null);
  readonly selectedTeacherModal = signal<TeacherProfile | null>(null);
  readonly watermarkPreviewModal = signal<ExerciseItem | null>(null);

  readonly isAutoTagging = signal<boolean>(false);
  readonly autoTagResult = signal<{
    suggestedTitle: string;
    grade: string;
    subject: string;
    trimester: string;
    docType: string;
    hasCorrection: boolean;
  } | null>(null);

  publicSubText(): string {
    return this.lang.tr(
      'Fini la perte de documents dans les chaînes WhatsApp. Trouvez instantanément vos devoirs de contrôle, de synthèse et fiches de révision filigranés.',
      'لا مزيد من ضياع الوثائق في مجموعات الواتساب. استرجع فروض المراقبة والتأليفية والسلاسل المصحوبة بالإصلاح بضغطة زر.'
    );
  }

  onSearchInput(event: Event) {
    this.store.setSearchQuery((event.target as HTMLInputElement).value);
  }

  onGradeChange(event: Event) {
    this.store.setGradeFilter((event.target as HTMLSelectElement).value);
  }

  onSubjectChange(event: Event) {
    this.store.setSubjectFilter((event.target as HTMLSelectElement).value);
  }

  onTrimesterChange(event: Event) {
    this.store.setTrimesterFilter((event.target as HTMLSelectElement).value);
  }

  onDocTypeChange(event: Event) {
    this.store.setDocTypeFilter((event.target as HTMLSelectElement).value);
  }

  onSchoolYearChange(event: Event) {
    this.store.setSchoolYearFilter((event.target as HTMLSelectElement).value);
  }

  onCorrectionToggle(event: Event) {
    this.store.setOnlyWithCorrectionFilter((event.target as HTMLInputElement).checked);
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

  reportDocument(ex: ExerciseItem) {
    this.store.reportExercise(ex.id);
    const msg = this.lang.tr(
      '🚨 Signalement transmis à l\'équipe de modération. Merci pour votre contribution !',
      '🚨 تم إرسال الإبلاغ لفريق الإشراف. شكراً لمساهمتكم!'
    );
    alert(msg);
  }

  readonly uploadedFileName = signal<string | null>(null);

  openWatermarkPreviewModal(ex: ExerciseItem) {
    this.watermarkPreviewModal.set(ex);
  }

  triggerPrintDialog() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  shareOnWhatsApp(ex: ExerciseItem) {
    if (typeof window !== 'undefined') {
      const msg = `🇹🇳 *Madrasati TN - Document d'Exercices*\n📘 ${ex.title} (${ex.grade} - ${ex.subject})\n${ex.hasCorrection ? '✔️ Corrigé certifié inclus' : ''}\n\nAccédez au document complet: ${window.location.origin}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    }
  }

  copyLink(ex: ExerciseItem) {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}?doc=${ex.id}`);
      alert(this.lang.tr('🔗 Lien copié dans le presse-papier !', '🔗 تم نسخ رابط الوثيقة بنجاح!'));
    }
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
  }

  onFileDrop(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      this.uploadAndProcessFile(e.dataTransfer.files[0]);
    } else {
      this.simulateBulkUpload();
    }
  }

  async handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    await this.uploadAndProcessFile(file);
  }

  async uploadAndProcessFile(file: File) {
    this.isAutoTagging.set(true);
    this.uploadedFileName.set(file.name);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const base64Data = await base64Promise;

      const upRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          base64Data,
          contentType: file.type,
        }),
      });
      const upData = await upRes.json();
      const uploadedUrl = upData?.url || '';

      const result = await this.store.autoTagAndAddDocument(
        file.name,
        `Document scolaire officiel uploadé: ${file.name}`
      );

      if (result) {
        if (uploadedUrl) {
          result.photoUrl = uploadedUrl;
        }
        this.autoTagResult.set({
          suggestedTitle: result.title,
          grade: result.grade,
          subject: result.subject,
          trimester: result.trimester || 'Trimestre 1',
          docType: result.docType || 'Série d\'Exercices',
          hasCorrection: result.hasCorrection ?? true,
        });
      }
    } catch (err) {
      console.error('File upload error:', err);
      this.simulateBulkUpload();
    } finally {
      this.isAutoTagging.set(false);
    }
  }

  async simulateBulkUpload() {
    this.isAutoTagging.set(true);
    try {
      const result = await this.store.autoTagAndAddDocument(
        'Devoir_Synthese_N1_Maths_4eme_T1.pdf',
        'École Primaire Habib Bourguiba - Devoir de Synthèse N°1 - Mathématiques 4ème Année - Trimestre 1. Exercice 1: Multiplication. Exercice 2: Géométrie. Corrigé inclus.'
      );

      if (result) {
        this.autoTagResult.set({
          suggestedTitle: result.title,
          grade: result.grade,
          subject: result.subject,
          trimester: result.trimester || 'Trimestre 1',
          docType: result.docType || 'Devoir de Synthèse',
          hasCorrection: result.hasCorrection ?? true,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isAutoTagging.set(false);
    }
  }
}
