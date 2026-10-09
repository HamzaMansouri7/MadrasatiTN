import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EducationStore, FirebaseService, LanguageService, SeoService, Course, ExerciseItem, TeacherProfile, BlogPost, PrintService, paginate } from '@core';
import { BlogCardComponent, CartoucheComponent, CurriculumTreeComponent, PaginationComponent, TeacherCardComponent, ShareButtonComponent } from '@shared';
import { BlogReaderComponent } from './blog-reader.component';
import { BdLibraryComponent } from '../bd/bd-library';

interface RecitationItem {
  id: string; grade: string; trimester: number; title: string;
  file: string; relPath: string; lang: string; ref: string;
}

@Component({
  selector: 'app-public-discovery',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CartoucheComponent, BlogReaderComponent, BdLibraryComponent, PaginationComponent, BlogCardComponent, TeacherCardComponent, CurriculumTreeComponent, ShareButtonComponent],
  template: `
    <div class="space-y-6">
      
      <!-- Hero Banner & AI Bulk Upload Zone -->
      <div class="bg-[#14251D] text-[#FBF8F1] rounded-[24px] p-4 sm:p-6 overflow-hidden">
        <div class="space-y-5">
          <div class="max-w-3xl space-y-2">
            <div class="inline-flex items-center gap-2 text-[#9DBBA8] text-xs font-medium">
              <span class="material-icons text-[16px]">verified</span>
              {{ lang.tr('Bibliothèque officielle · Programmes CNP', 'المكتبة الرسمية · برامج المركز الوطني البيداغوجي') }}
            </div>

            <h1 class="font-display text-[1.5rem] sm:text-[2rem] font-semibold tracking-[-0.01em] leading-[1.1]">
              {{ lang.tr("La bibliothèque officielle de l’école primaire tunisienne.", 'المكتبة الرسمية للمدرسة الابتدائية التونسية.') }}
            </h1>

            <p class="text-[#B7C7BC] text-sm leading-relaxed max-w-2xl">
              {{ publicSubText() }}
            </p>
          </div>

        </div>
      </div>

      <!-- FEATURE 2: Multi-Facet Search & Filter Hub Panel -->
      <div class="bg-white rounded-2xl p-5 border border-[#E7DFCF] space-y-4">
        <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-3">
          <div class="flex items-center gap-2">
            <span class="material-icons text-[#1B4332]">tune</span>
            <h3 class="font-display font-semibold text-[#14251D] text-sm">
              {{ lang.tr('Centre de Recherche Multi-Critères (Multi-Facet Hub)', 'مركّب البحث والفلترة متعددة المعايير') }}
            </h3>
          </div>
          <button
            (click)="onResetFilters()"
            class="text-xs text-[#8A5A00] hover:text-[#C1121F] font-semibold flex items-center gap-1 cursor-pointer">
            <span class="material-icons text-sm">restart_alt</span>
            {{ lang.tr('Réinitialiser les filtres', 'إعادة ضبط الفلاتر') }}
          </button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <!-- Filter 1: Grade -->
          <div class="min-w-0">
            <label for="filter-grade-select" class="block font-medium text-[#486581] mb-1 truncate">
              {{ lang.tr('Niveau', 'المستوى') }}
            </label>
            <select
              id="filter-grade-select"
              [value]="store.selectedGradeFilter()"
              (change)="onGradeChange($event)"
              class="w-full min-w-0 bg-[#F7F9FB] border border-[#CBD9E2] rounded-[10px] p-2 font-medium text-[#102A43] outline-none focus:border-[#007CC2] text-xs">
              <option value="Tous">{{ lang.t('filterGradeAll') }}</option>
              <option value="1ère Année">{{ lang.tr('1ère Année Primaire', 'السنة الأولى ابتدائي') }}</option>
              <option value="2ème Année">{{ lang.tr('2ème Année Primaire', 'السنة الثانية ابتدائي') }}</option>
              <option value="3ème Année">{{ lang.tr('3ème Année Primaire', 'السنة الثالثة ابتدائي') }}</option>
              <option value="4ème Année">{{ lang.tr('4ème Année Primaire', 'السنة الرابعة ابتدائي') }}</option>
              <option value="5ème Année">{{ lang.tr('5ème Année Primaire', 'السنة الخامسة ابتدائي') }}</option>
              <option value="6ème Année">{{ lang.tr('6ème Année (Concours)', 'السنة السادسة (مناظرة)') }}</option>
            </select>
          </div>

          <!-- Filter 2: Trimester -->
          <div class="min-w-0">
            <label for="filter-trimester-select" class="block font-medium text-[#486581] mb-1 truncate">
              {{ lang.tr('Trimestre', 'الثلاثي') }}
            </label>
            <select
              id="filter-trimester-select"
              [value]="store.selectedTrimesterFilter()"
              (change)="onTrimesterChange($event)"
              class="w-full min-w-0 bg-[#F7F9FB] border border-[#CBD9E2] rounded-[10px] p-2 font-medium text-[#102A43] outline-none focus:border-[#007CC2] text-xs">
              <option value="Tous">{{ lang.tr('Tous les trimestres', 'جميع الثلاثيات') }}</option>
              <option value="Trimestre 1">{{ lang.tr('Trimestre 1', 'الثلاثي الأول') }}</option>
              <option value="Trimestre 2">{{ lang.tr('Trimestre 2', 'الثلاثي الثاني') }}</option>
              <option value="Trimestre 3">{{ lang.tr('Trimestre 3', 'الثلاثي الثالث') }}</option>
            </select>
          </div>

          <!-- Filter 4: Doc Type -->
          <div class="min-w-0">
            <label for="filter-doctype-select" class="block font-medium text-[#486581] mb-1 truncate">
              {{ lang.tr('Type de document', 'صنف الوثيقة') }}
            </label>
            <select
              id="filter-doctype-select"
              [value]="store.selectedDocTypeFilter()"
              (change)="onDocTypeChange($event)"
              class="w-full min-w-0 bg-[#F7F9FB] border border-[#CBD9E2] rounded-[10px] p-2 font-medium text-[#102A43] outline-none focus:border-[#007CC2] text-xs">
              <option value="Tous">{{ lang.tr('Tous les types', 'جميع الأصناف') }}</option>
              <option value="Devoir de Contrôle">{{ lang.tr('Devoir de Contrôle', 'فرض مراقبة') }}</option>
              <option value="Devoir de Synthèse">{{ lang.tr('Devoir de Synthèse', 'فرض تأليفي') }}</option>
              <option value="Fiche de Révision">{{ lang.tr('Fiche de Révision', 'ملخص درس') }}</option>
              <option value="Série d'Exercices">{{ lang.tr("Série d'Exercices", 'سلسلة تمارين') }}</option>
            </select>
          </div>

          <!-- Filter 5: School Year -->
          <div class="min-w-0">
            <label for="filter-year-select" class="block font-medium text-[#486581] mb-1 truncate">
              {{ lang.tr('Année Scolaire', 'السنة الدراسية') }}
            </label>
            <select
              id="filter-year-select"
              [value]="store.selectedSchoolYearFilter()"
              (change)="onSchoolYearChange($event)"
              class="w-full min-w-0 bg-[#F7F9FB] border border-[#CBD9E2] rounded-[10px] p-2 font-medium text-[#102A43] outline-none focus:border-[#007CC2] text-xs">
              <option value="Tous">{{ lang.tr('Toutes les années', 'جميع السنوات') }}</option>
              <option value="2025-2026">{{ lang.tr('2025-2026 (Actuelle)', '2025-2026 (الحالية)') }}</option>
              <option value="2024-2025">2024-2025</option>
            </select>
          </div>
        </div>

        <!-- Toggle Correction Checkbox & Search Keyword Input -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#E7DFCF]">
          <label class="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#14251D]">
            <input
              type="checkbox"
              [checked]="store.onlyWithCorrectionFilter()"
              (change)="onCorrectionToggle($event)"
              class="w-4 h-4 rounded text-[#2D6A4F] focus:ring-[#2D6A4F] cursor-pointer" />
            <span>{{ lang.tr('Uniquement avec Corrigé Étape par Étape', 'فقط الوثائق المصحوبة بالإصلاح المفصل') }}</span>
          </label>

          <div class="relative w-full sm:w-80">
            <span class="material-icons absolute left-3 top-2.5 text-[#6B7A70] text-sm">search</span>
            <input
              type="text"
              [value]="store.searchQuery()"
              (input)="onSearchInput($event)"
              placeholder="Rechercher par mot-clé (ex: Multiplication...)"
              class="w-full bg-[#FBF8F1] border border-[#E7DFCF] pl-9 pr-3 py-1.5 rounded-xl text-xs outline-none" />
          </div>
        </div>
      </div>

      <!-- Content: subject rail + results -->
      <div class="flex flex-col lg:flex-row gap-6 items-start">

        <!-- Main results column -->
        <div class="flex-1 min-w-0 space-y-6 order-last lg:order-none">

      <!-- Active shelf heading (section selection lives in the library rail) -->
      @if (activeShelf(); as shelf) {
        <div class="flex items-center gap-2.5 border-b border-[#E7DFCF] pb-3">
          <span class="material-icons text-lg" [style.color]="shelf.accent">{{ shelf.icon }}</span>
          <h2 class="font-display font-semibold text-[#14251D] text-base">{{ lang.tr(shelf.labelFr, shelf.labelAr) }}</h2>
          @if (sectionCount(shelf.key) !== null) {
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F2ECDE] text-[#4A5A50]">{{ sectionCount(shelf.key) }}</span>
          }
        </div>
      }

      <!-- SECTION: BANDES DESSINÉES (official CNP comic pages) -->
      @if (activeSection() === 'bd') {
        <app-bd-library />
      }

      <!-- SECTION: RÉCITATIONS & محفوظات (CNP poetry pages as WebP) -->
      @if (activeSection() === 'recitation') {
        <div class="space-y-5">

          <!-- Filter bar -->
          <div class="flex flex-wrap gap-2 items-center">
            <select
              [value]="recitationGradeFilter()"
              (change)="recitationGradeFilter.set($any($event.target).value)"
              class="bg-[#F7F9FB] border border-[#CBD9E2] rounded-[10px] px-3 py-1.5 text-xs font-medium text-[#102A43] outline-none focus:border-[#7B4F1E]">
              <option value="Tous">{{ lang.tr('Tous les niveaux', 'جميع المستويات') }}</option>
              <option value="1ere-annee">{{ lang.tr('1ère Année', 'السنة الأولى') }}</option>
              <option value="2eme-annee">{{ lang.tr('2ème Année', 'السنة الثانية') }}</option>
              <option value="3eme-annee">{{ lang.tr('3ème Année', 'السنة الثالثة') }}</option>
              <option value="4eme-annee">{{ lang.tr('4ème Année', 'السنة الرابعة') }}</option>
              <option value="5eme-annee">{{ lang.tr('5ème Année', 'السنة الخامسة') }}</option>
              <option value="6eme-annee">{{ lang.tr('6ème Année', 'السنة السادسة') }}</option>
            </select>

            <select
              [value]="recitationTrimesterFilter()"
              (change)="recitationTrimesterFilter.set(+$any($event.target).value)"
              class="bg-[#F7F9FB] border border-[#CBD9E2] rounded-[10px] px-3 py-1.5 text-xs font-medium text-[#102A43] outline-none focus:border-[#7B4F1E]">
              <option [value]="0">{{ lang.tr('Tous les trimestres', 'جميع الثلاثيات') }}</option>
              <option [value]="1">{{ lang.tr('Trimestre 1', 'الثلاثي الأول') }}</option>
              <option [value]="2">{{ lang.tr('Trimestre 2', 'الثلاثي الثاني') }}</option>
              <option [value]="3">{{ lang.tr('Trimestre 3', 'الثلاثي الثالث') }}</option>
            </select>

            <span class="text-xs text-[#4A5A50] font-medium">
              {{ filteredRecitations().length }} {{ lang.tr('محفوظة', 'محفوظة') }}
            </span>
          </div>

          <!-- Grid -->
          @if (!recitationLoaded()) {
            <div class="flex items-center justify-center py-12 text-[#4A5A50] gap-3">
              <span class="material-icons animate-spin text-[#7B4F1E]">autorenew</span>
              <span class="text-sm">{{ lang.tr('Chargement des récitations...', 'جارٍ تحميل المحفوظات...') }}</span>
            </div>
          } @else if (filteredRecitations().length === 0) {
            <div class="text-center py-12 text-[#6B7A70] text-sm">
              {{ lang.tr('Aucune récitation trouvée pour ce filtre.', 'لا توجد محفوظات لهذا الفلتر.') }}
            </div>
          } @else {
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              @for (r of filteredRecitations(); track r.id) {
                <button
                  (click)="recitationLightbox.set('/' + r.relPath)"
                  class="group bg-white rounded-2xl border border-[#E7DFCF] overflow-hidden flex flex-col transition-shadow hover:shadow-[0_12px_32px_-16px_rgba(123,79,30,0.4)] cursor-pointer text-left">
                  <div class="relative overflow-hidden bg-[#FBF8F1]">
                    <img
                      [src]="'/' + r.relPath"
                      [alt]="r.title"
                      loading="lazy"
                      class="w-full aspect-[3/4] object-cover object-top transition-transform group-hover:scale-[1.04] duration-300" />
                    <span class="absolute inset-0 bg-[#14251D]/0 group-hover:bg-[#14251D]/10 transition-colors flex items-center justify-center">
                      <span class="material-icons text-white opacity-0 group-hover:opacity-100 transition-opacity text-3xl drop-shadow">zoom_in</span>
                    </span>
                  </div>
                  <div class="p-2.5 space-y-1 flex-1">
                    <p class="text-[11px] font-semibold text-[#14251D] leading-snug line-clamp-2" dir="rtl">{{ r.title }}</p>
                    <div class="flex items-center gap-1 flex-wrap">
                      <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#7B4F1E]/10 text-[#7B4F1E]">
                        T{{ r.trimester }}
                      </span>
                      <span class="text-[9px] font-medium text-[#6B7A70]">
                        {{ r.grade.replace('-annee','').replace('ere','ère').replace('eme','ème') }}
                      </span>
                    </div>
                  </div>
                </button>
              }
            </div>
          }
        </div>

        <!-- Lightbox -->
        @if (recitationLightbox(); as imgSrc) {
          <div
            class="fixed inset-0 z-50 bg-[#0A1A12]/90 backdrop-blur-sm flex items-center justify-center p-4"
            role="button" tabindex="0"
            (click)="recitationLightbox.set(null)"
            (keydown.escape)="recitationLightbox.set(null)">
            <div class="relative max-w-2xl w-full" role="presentation" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()">
              <button
                (click)="recitationLightbox.set(null)"
                class="absolute -top-10 right-0 text-[#FBF8F1] hover:text-[#F2C14E] cursor-pointer flex items-center gap-1 text-xs font-semibold">
                <span class="material-icons text-sm">close</span>
                {{ lang.tr('Fermer', 'إغلاق') }}
              </button>
              <img
                [src]="imgSrc"
                alt="Récitation"
                class="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10" />
              <div class="flex justify-center mt-3">
                <a
                  [href]="imgSrc"
                  download
                  class="bg-[#7B4F1E] hover:bg-[#5C3A15] text-[#FBF8F1] font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors">
                  <span class="material-icons text-sm">download</span>
                  {{ lang.tr('Télécharger WebP', 'تحميل الصورة') }}
                </a>
              </div>
            </div>
          </div>
        }
      }

      <!-- SECTION 1: EXERCISES & EXAMS BANK WITH UPVOTING, REPORTING & WATERMARK -->
      @if (activeSection() === 'exercises') {
        <div class="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 items-stretch">
          @for (ex of paginatedExercises(); track ex.id) {
            <div class="bg-white rounded-2xl p-5 border border-[#E7DFCF] flex flex-col justify-between h-full transition-shadow hover:shadow-[0_18px_45px_-30px_rgba(20,38,29,0.5)]">
              <div class="space-y-3 flex-1 flex flex-col">
                <div class="flex items-center justify-between flex-wrap gap-1 text-[10px] shrink-0">
                  <div class="flex items-center gap-2">
                    <span class="bg-[#1B4332]/10 text-[#1B4332] font-semibold px-2.5 py-0.5 rounded-full">
                      {{ ex.subject }}
                    </span>
                    <span class="bg-[#F2ECDE] text-[#4A5A50] font-medium px-2 py-0.5 rounded-full">
                      {{ ex.grade }}
                    </span>
                    <span class="bg-[#8A5A00]/10 text-[#8A5A00] font-medium px-2 py-0.5 rounded-full">
                      {{ ex.trimester || 'Trimestre 1' }}
                    </span>
                  </div>

                  <span class="bg-[#FBF8F1] text-[#1B4332] font-semibold px-2 py-0.5 rounded-md border border-[#E7DFCF]">
                    {{ ex.docType || 'Devoir' }}
                  </span>
                </div>

                <!-- Uniform Thumbnail Container (exact h-40) -->
                <div class="w-full h-40 shrink-0 overflow-hidden rounded-xl border border-[#E7DFCF] bg-[#FBF8F1]">
                  @if (ex.photoUrl) {
                    <img
                      [src]="ex.photoUrl"
                      [alt]="ex.title"
                      loading="lazy"
                      class="w-full h-full object-cover" />
                  } @else {
                    <div [class]="'w-full h-full bg-gradient-to-br ' + getSubjectTheme(ex.subject).gradient + ' p-3.5 flex flex-col justify-between text-white relative overflow-hidden shadow-sm'">
                      <div class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
                      <div class="absolute right-3 bottom-1 opacity-20 pointer-events-none">
                        <span class="material-icons text-7xl">{{ getSubjectTheme(ex.subject).icon }}</span>
                      </div>
                      <div class="flex items-center justify-between z-10">
                        <span [class]="'inline-flex items-center gap-1.5 text-[10px] font-semibold ' + getSubjectTheme(ex.subject).badgeBg + ' backdrop-blur-sm px-2.5 py-0.5 rounded-full text-white'">
                          <span class="material-icons text-xs">{{ getSubjectTheme(ex.subject).icon }}</span>
                          {{ ex.subject }}
                        </span>
                        <span class="text-[10px] font-medium text-white/90 bg-black/25 px-2 py-0.5 rounded-md backdrop-blur-sm">
                          {{ ex.grade }}
                        </span>
                      </div>
                      <div class="z-10 space-y-1">
                        <p class="font-display font-semibold text-xs text-white line-clamp-2 leading-tight">
                          {{ ex.title }}
                        </p>
                        <div class="flex items-center gap-2 text-[10px] text-white/80">
                          <span class="bg-white/15 px-1.5 py-0.5 rounded text-[9px] font-semibold">{{ ex.docType || 'ورقة عمل A4' }}</span>
                          <span>•</span>
                          <span>{{ ex.trimester || 'الثلاثي 1' }}</span>
                        </div>
                      </div>
                    </div>
                  }
                </div>

                <h3 class="font-display font-semibold text-[#14251D] text-sm leading-snug line-clamp-2 min-h-[2.5rem]">{{ ex.title }}</h3>

                <!-- Clamped Prompt Text with fixed height -->
                <div class="bg-[#FBF8F1] p-3 rounded-xl border border-[#E7DFCF] text-xs text-[#4A5A50] leading-relaxed font-mono line-clamp-3 min-h-[4.2rem] max-h-[4.2rem] overflow-hidden">
                  "{{ ex.promptText }}"
                </div>

                <!-- Author attribution pinned to bottom of body -->
                <div class="flex items-center justify-between text-[11px] pt-1 mt-auto shrink-0">
                  @if (ex.teacherName && findAuthor(ex.teacherName, ex.teacherId); as author) {
                    <button
                      (click)="selectedTeacherModal.set(author)"
                      class="flex items-center gap-1 text-[#1B4332] font-semibold hover:underline underline-offset-2 cursor-pointer truncate">
                      <span class="material-icons text-sm">verified</span>
                      {{ lang.tr('Par', 'من إعداد') }} {{ ex.teacherName }}
                    </button>
                  } @else if (ex.teacherName) {
                    <span class="flex items-center gap-1 text-[#5B6B60] font-medium truncate">
                      <span class="material-icons text-sm text-[#1B4332]">verified</span>
                      {{ lang.tr('Par', 'من إعداد') }} {{ ex.teacherName }}
                    </span>
                  } @else {
                    <span class="flex items-center gap-1 text-[#1B4332] font-semibold truncate">
                      <span class="material-icons text-sm">verified</span>
                      {{ lang.tr('Corrigé Certifié Enseignant', 'إصلاح مؤكد ومعتمد') }}
                    </span>
                  }

                  <span class="text-[#6B7A70] italic shrink-0">
                    {{ ex.schoolYear || '2025-2026' }}
                  </span>
                </div>
              </div>

              <!-- Action bar pinned to card bottom: main actions, then one compact icon row -->
              <div class="pt-3 border-t border-[#E7DFCF] flex flex-col gap-2 shrink-0 mt-3">
                @if (ex.openUrl) {
                  <a
                    [routerLink]="ex.openUrl"
                    class="w-full h-9 justify-center bg-[#14251D] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-[12px] rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors">
                    <span class="material-icons text-[16px]">open_in_new</span>
                    {{ lang.tr('Ouvrir la fiche', 'فتح الجذاذة') }}
                  </a>
                }

                <button
                  (click)="openWatermarkPreviewModal(ex)"
                  class="w-full h-9 justify-center bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-[12px] rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors">
                  <span class="material-icons text-[16px]">print</span>
                  {{ lang.tr('Imprimer PDF', 'طباعة PDF') }}
                </button>

                <div class="flex items-center justify-between gap-1.5">
                  <button
                    (click)="store.toggleUpvoteExercise(ex.id)"
                    [class]="ex.isUpvoted ? 'bg-[#2D6A4F] text-[#FBF8F1] border-[#2D6A4F]' : 'bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] border-[#E7DFCF]'"
                    class="h-8 px-2.5 rounded-lg border text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
                    [attr.aria-pressed]="!!ex.isUpvoted"
                    [attr.aria-label]="lang.tr('Utile', 'مفيد')">
                    <span class="material-icons text-[16px]">thumb_up</span>
                    <span>{{ ex.upvotesCount || 0 }}</span>
                  </button>
                  <button
                    (click)="store.toggleWatchlist(ex.id, 'exercise')"
                    [class]="store.isWatched(ex.id, 'exercise') ? 'bg-[#8A5A00]/10 text-[#8A5A00] border-[#8A5A00]/40' : 'bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] border-[#E7DFCF]'"
                    class="w-8 h-8 shrink-0 rounded-lg border flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
                    [attr.aria-pressed]="store.isWatched(ex.id, 'exercise')"
                    [attr.aria-label]="store.isWatched(ex.id, 'exercise') ? lang.tr('Retirer des favoris', 'إزالة من المحفوظات') : lang.tr('Ajouter aux favoris', 'حفظ في المحفوظات')"
                    [title]="store.isWatched(ex.id, 'exercise') ? lang.tr('Retirer des favoris', 'إزالة من المحفوظات') : lang.tr('Ajouter aux favoris', 'حفظ في المحفوظات')">
                    <span class="material-icons text-[18px]">{{ store.isWatched(ex.id, 'exercise') ? 'bookmark' : 'bookmark_border' }}</span>
                  </button>
                  <app-share-button
                    [url]="'/discovery?doc=' + ex.id"
                    [title]="ex.title"
                    [text]="ex.promptText || ex.title"
                    variant="icon"
                    accent="green" />
                  <button
                    (click)="reportDocument(ex)"
                    [disabled]="ex.isReported"
                    [class]="ex.isReported ? 'text-[#C1121F] border-[#C1121F]/30 bg-[#C1121F]/5' : 'text-[#6B7A70] hover:text-[#C1121F] bg-[#FBF8F1] border-[#E7DFCF]'"
                    class="w-8 h-8 shrink-0 rounded-lg border flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
                    [attr.aria-label]="lang.tr('Signaler un scan flou ou incomplet', 'الإبلاغ عن مسح ضوئي غير واضح')"
                    [title]="lang.tr('Signaler un scan flou ou incomplet', 'الإبلاغ عن مسح ضوئي غير واضح')">
                    <span class="material-icons text-[18px]">flag</span>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>

        <app-pagination
          [total]="store.filteredExercisesBank().length"
          [pageSize]="exercisesPageSize()"
          [(page)]="exercisesPage"
          accent="library" />
      }

      <!-- SECTION 2: COURSES LIBRARY -->
      @if (activeSection() === 'courses' || activeSection() === 'cnp') {
        <div class="grid md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 items-stretch">
          @for (c of paginatedCourses(); track c.id) {
            <div class="bg-white rounded-2xl p-5 border border-[#E7DFCF] flex flex-col justify-between h-full transition-shadow hover:shadow-[0_18px_45px_-30px_rgba(20,38,29,0.5)]">
              <div class="space-y-3 flex-1 flex flex-col">
                <!-- Uniform Thumbnail Container (exact h-40) -->
                <div class="w-full h-40 shrink-0 overflow-hidden rounded-xl border border-[#E7DFCF] bg-[#FBF8F1]">
                  @if (c.imageUrls && c.imageUrls.length) {
                    <button
                      (click)="openImageDoc(c)"
                      class="block w-full h-full relative group cursor-pointer"
                      [title]="lang.tr('Voir en grand & imprimer', 'عرض وطباعة')">
                      <img [src]="c.imageUrls[0]" [alt]="c.title" loading="lazy" class="w-full h-full object-cover object-top transition-transform group-hover:scale-[1.03]" />
                      @if (c.imageUrls.length > 1) {
                        <span class="absolute top-2 right-2 bg-[#14251D]/80 text-[#FBF8F1] text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span class="material-icons text-[11px]">collections</span>{{ c.imageUrls.length }}
                        </span>
                      }
                      <span class="absolute inset-0 bg-[#14251D]/0 group-hover:bg-[#14251D]/15 transition-colors flex items-center justify-center">
                        <span class="material-icons text-white opacity-0 group-hover:opacity-100 transition-opacity text-3xl drop-shadow">zoom_in</span>
                      </span>
                    </button>
                  } @else {
                    <div [class]="'w-full h-full bg-gradient-to-br ' + getSubjectTheme(c.subject).gradient + ' p-3.5 flex flex-col justify-between text-white relative overflow-hidden shadow-sm'">
                      <div class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
                      <div class="absolute right-3 bottom-1 opacity-20 pointer-events-none">
                        <span class="material-icons text-7xl">{{ getSubjectTheme(c.subject).icon }}</span>
                      </div>
                      <div class="flex items-center justify-between z-10">
                        <span [class]="'inline-flex items-center gap-1.5 text-[10px] font-semibold ' + getSubjectTheme(c.subject).badgeBg + ' backdrop-blur-sm px-2.5 py-0.5 rounded-full text-white'">
                          <span class="material-icons text-xs">{{ getSubjectTheme(c.subject).icon }}</span>
                          {{ c.subject }}
                        </span>
                        <span class="text-[10px] font-medium text-white/90 bg-black/25 px-2 py-0.5 rounded-md backdrop-blur-sm">
                          {{ c.grade }}
                        </span>
                      </div>
                      <div class="z-10 space-y-1">
                        <p class="font-display font-semibold text-xs text-white line-clamp-2 leading-tight">
                          {{ c.title }}
                        </p>
                        <div class="flex items-center gap-2 text-[10px] text-white/80">
                          <span class="bg-white/15 px-1.5 py-0.5 rounded text-[9px] font-semibold">{{ c.docType || 'ملخص درس' }}</span>
                          <span>•</span>
                          <span>{{ c.trimester || 'الثلاثي 1' }}</span>
                        </div>
                      </div>
                    </div>
                  }
                </div>

                <div class="flex items-center justify-between shrink-0">
                  <span class="bg-[#1B4332]/10 text-[#1B4332] text-[10px] font-semibold px-2.5 py-0.5 rounded-full truncate max-w-[120px]">
                    {{ c.subject }}
                  </span>
                  <div class="flex items-center gap-1.5 shrink-0">
                    @if (c.pdfUrl) {
                      <span class="bg-[#C1121F]/10 text-[#C1121F] text-[9px] font-semibold px-2 py-0.5 rounded-full border border-[#C1121F]/30 flex items-center gap-0.5">
                        <span class="material-icons text-[10px]">picture_as_pdf</span>
                        CNP Officiel
                      </span>
                    }
                    @if (c.imageUrls && c.imageUrls.length && c.hasCorrection) {
                      <span class="bg-[#2D6A4F]/10 text-[#2D6A4F] text-[9px] font-semibold px-2 py-0.5 rounded-full border border-[#2D6A4F]/30">
                        {{ lang.tr('Corrigé', 'إصلاح') }}
                      </span>
                    }
                    @if (c.docType) {
                      <span class="text-[9px] font-medium text-[#8A5A00] bg-[#8A5A00]/10 px-2 py-0.5 rounded-full">{{ c.docType }}</span>
                    }
                    <span class="text-[11px] font-medium text-[#6B7A70]">{{ c.grade }}</span>
                  </div>
                </div>

                <h3 class="font-display font-semibold text-[#14251D] text-sm leading-snug line-clamp-2 min-h-[2.5rem]">{{ c.title }}</h3>
                <p class="text-xs text-[#5B6B60] leading-relaxed line-clamp-3 min-h-[3.8rem] max-h-[3.8rem] overflow-hidden">{{ c.summary }}</p>

                <!-- Author attribution pinned to bottom of body -->
                <div class="flex items-center justify-between text-[11px] pt-1 mt-auto shrink-0">
                  @if (findAuthor(c.teacherName, c.authorId); as author) {
                    <button
                      (click)="selectedTeacherModal.set(author)"
                      class="flex items-center gap-1 text-[11px] text-[#1B4332] font-semibold hover:underline underline-offset-2 cursor-pointer truncate">
                      <span class="material-icons text-sm">verified</span>
                      {{ lang.tr('Par', 'من إعداد') }} {{ c.teacherName }}
                    </button>
                  } @else {
                    <span class="flex items-center gap-1 text-[11px] text-[#5B6B60] font-medium truncate">
                      <span class="material-icons text-sm">person</span>
                      {{ lang.tr('Par', 'من إعداد') }} {{ c.teacherName }}
                    </span>
                  }
                </div>
              </div>

              <!-- action bar pinned to card bottom: main actions, then one compact icon row -->
              <div class="pt-3 border-t border-[#E7DFCF] flex flex-col gap-2 shrink-0 mt-3">
                @if (c.pdfUrl) {
                  <a
                    [href]="c.pdfUrl"
                    target="_blank"
                    rel="noopener"
                    class="w-full h-9 justify-center bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-[12px] rounded-lg flex items-center gap-1.5 transition-colors">
                    <span class="material-icons text-[16px]">download</span>
                    {{ lang.tr('Télécharger PDF', 'تحميل PDF') }}
                  </a>
                } @else if (c.imageUrls && c.imageUrls.length) {
                  <button
                    (click)="openImageDoc(c)"
                    class="w-full h-9 justify-center bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-[12px] rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors">
                    <span class="material-icons text-[16px]">print</span>
                    {{ lang.tr('Voir & Imprimer', 'عرض وطباعة') }}
                  </button>
                } @else {
                  <button
                    (click)="viewCourseModal.set(c)"
                    class="w-full h-9 justify-center bg-[#14251D] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-[12px] rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors">
                    <span class="material-icons text-[16px]">menu_book</span>
                    {{ lang.tr('Consulter', 'قراءة الملخص') }}
                  </button>
                }

                <button
                  (click)="router.navigate(['/solve'], { queryParams: { docId: c.id } })"
                  class="w-full h-8 justify-center bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold text-[11px] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer">
                  <span class="material-icons text-[15px]">photo_camera</span>
                  <span>{{ lang.tr('Résoudre cet exercice / devoir', 'حلّ هذا التمرين أو الفرض') }}</span>
                </button>

                <div class="flex items-center justify-between gap-1.5">
                  <button
                    (click)="store.toggleUpvoteCourse(c.id)"
                    [class]="c.isUpvoted ? 'bg-[#2D6A4F] text-[#FBF8F1] border-[#2D6A4F]' : 'bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] border-[#E7DFCF]'"
                    class="h-8 px-2.5 rounded-lg border text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
                    [attr.aria-pressed]="!!c.isUpvoted"
                    [attr.aria-label]="lang.tr('Utile', 'مفيد')">
                    <span class="material-icons text-[16px]">thumb_up</span>
                    <span>{{ c.upvotesCount || 0 }}</span>
                  </button>
                  <button
                    (click)="store.toggleWatchlist(c.id, 'course')"
                    [class]="store.isWatched(c.id, 'course') ? 'bg-[#8A5A00]/10 text-[#8A5A00] border-[#8A5A00]/40' : 'bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] border-[#E7DFCF]'"
                    class="w-8 h-8 shrink-0 rounded-lg border flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
                    [attr.aria-pressed]="store.isWatched(c.id, 'course')"
                    [attr.aria-label]="store.isWatched(c.id, 'course') ? lang.tr('Retirer des favoris', 'إزالة من المحفوظات') : lang.tr('Ajouter aux favoris', 'حفظ في المحفوظات')"
                    [title]="store.isWatched(c.id, 'course') ? lang.tr('Retirer des favoris', 'إزالة من المحفوظات') : lang.tr('Ajouter aux favoris', 'حفظ في المحفوظات')">
                    <span class="material-icons text-[18px]">{{ store.isWatched(c.id, 'course') ? 'bookmark' : 'bookmark_border' }}</span>
                  </button>
                  <app-share-button
                    [url]="'/discovery?doc=' + c.id"
                    [title]="c.title"
                    [text]="c.summary || c.title"
                    variant="icon"
                    accent="green" />
                </div>
              </div>

            </div>
          }
        </div>

        <app-pagination
          [total]="currentCoursesList().length"
          [pageSize]="coursesPageSize()"
          [(page)]="coursesPage"
          accent="library" />
      }

      <!-- SECTION 3: PEDAGOGICAL BLOG & ARTICLES -->
      @if (activeSection() === 'blog') {
        @if (store.selectedBlogPost()) {
          <app-blog-reader />
        } @else {
          <div class="space-y-6">
            <div class="grid md:grid-cols-2 gap-6">
              @for (post of store.filteredBlogPosts(); track post.id) {
                <app-blog-card
                  [post]="post"
                  accent="green"
                  [showCover]="true"
                  (open)="store.openBlogPost($event)"
                  (like)="store.likeBlogPost($event)" />
              }
            </div>
          </div>
        }
      }

      <!-- FEATURE 3: Teacher Credibility Profiles Directory -->
      <!-- FEATURE 6: WATCHLIST & FAVORITES HUB -->
      @if (activeSection() === 'watchlist') {
        <div class="space-y-6">
          <div class="bg-[#14251D] text-[#FBF8F1] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="material-icons text-[#F2C14E] text-2xl">bookmark</span>
                <h3 class="font-display font-semibold text-lg sm:text-xl text-[#FBF8F1]">
                  {{ lang.tr('Ma Watchlist Éducative — Documents Favoris', 'قائمة محفوظاتي التعليمية') }}
                </h3>
              </div>
              <p class="text-xs text-[#B7C7BC] mt-1">
                {{ lang.tr('Accédez immédiatement à vos cours, examens et enseignants favoris pour révision rapide ou impression.', 'الوصول المباشر إلى الدروس، الفروض والمعلمين المفضلين للمراجعة أو الطباعة.') }}
              </p>
            </div>
            <div class="flex items-center gap-2 text-xs font-semibold text-[#14251D] bg-[#F2C14E] px-3.5 py-2 rounded-xl shrink-0">
              <span class="material-icons text-sm">folder_special</span>
              <span>{{ store.totalWatchlistCount() }} {{ lang.tr('éléments sauvegardés', 'عناصر محفوظة') }}</span>
            </div>
          </div>

          @if (store.totalWatchlistCount() === 0) {
            <div class="bg-white rounded-2xl p-12 text-center border border-[#E7DFCF] space-y-3">
              <span class="material-icons text-5xl text-[#6B7A70]">bookmark_border</span>
              <h4 class="font-display font-semibold text-[#14251D] text-base">
                {{ lang.tr('Votre watchlist est vide pour le moment', 'قائمة المحفوظات فارغة حالياً') }}
              </h4>
              <p class="text-xs text-[#5B6B60] max-w-md mx-auto">
                {{ lang.tr("Cliquez sur le signet Favoris dans la Banque d'Examens ou les Cours pour sauvegarder vos documents de révision.", 'انقر على رمز الحفظ في مكتبة الفروض أو الدروس لحفظ وثائق المراجعة.') }}
              </p>
              <button
                (click)="activeSection.set('exercises')"
                class="bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold text-xs px-5 py-2.5 rounded-[10px] cursor-pointer shadow-xs inline-flex items-center gap-1.5 transition-colors">
                <span class="material-icons text-sm">explore</span>
                <span>{{ lang.tr("Explorer la Banque d'Examens", 'تصفح مكتبة الفروض') }}</span>
              </button>
            </div>
          } @else {
            <!-- 1. Watched Exercises -->
            @if (store.watchedExercises().length > 0) {
              <div class="space-y-3">
                <h4 class="font-display font-semibold text-[#14251D] text-sm flex items-center gap-2">
                  <span class="material-icons text-[#8A5A00] text-base">assignment</span>
                  <span>{{ lang.tr('Examens & Séries Sauvegardés', 'الفروض والسلاسل المحفوظة') }} ({{ store.watchedExercises().length }})</span>
                </h4>
                <div class="grid md:grid-cols-2 gap-4">
                  @for (ex of store.watchedExercises(); track ex.id) {
                    <div class="bg-white rounded-2xl p-4 border border-[#E7DFCF] shadow-xs space-y-3">
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="bg-[#F2ECDE] text-[#1B4332] font-semibold px-2 py-0.5 rounded-md">{{ ex.subject }} — {{ ex.grade }}</span>
                        <button (click)="store.toggleWatchlist(ex.id, 'exercise')" class="text-[#BF5B34] hover:text-[#C1121F] text-xs font-semibold flex items-center gap-1 cursor-pointer">
                          <span class="material-icons text-sm">bookmark_remove</span>
                          <span>{{ lang.tr('Retirer', 'حذف') }}</span>
                        </button>
                      </div>
                      <h5 class="font-semibold text-[#14251D] text-xs">{{ ex.title }}</h5>
                      <p class="text-[11px] text-[#4A5A50] bg-[#FBF8F1] p-2.5 rounded-xl border border-[#E7DFCF] line-clamp-2">{{ ex.promptText }}</p>
                      <div class="flex items-center justify-between pt-2 border-t border-[#E7DFCF] text-xs">
                        <button (click)="openWatermarkPreviewModal(ex)" class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors">
                          <span class="material-icons text-xs">print</span>
                          <span>{{ lang.tr('Imprimer A4', 'طباعة A4') }}</span>
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
                <h4 class="font-display font-semibold text-[#14251D] text-sm flex items-center gap-2">
                  <span class="material-icons text-[#2D6A4F] text-base">menu_book</span>
                  <span>{{ lang.tr('Fiches & Cours Sauvegardés', 'الدروس والملخصات المحفوظة') }} ({{ store.watchedCourses().length }})</span>
                </h4>
                <div class="grid md:grid-cols-2 gap-4">
                  @for (c of store.watchedCourses(); track c.id) {
                    <div class="bg-white rounded-2xl p-4 border border-[#E7DFCF] shadow-xs space-y-3">
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="bg-[#F2ECDE] text-[#2D6A4F] font-semibold px-2 py-0.5 rounded-md">{{ c.subject }} — {{ c.grade }}</span>
                        <button (click)="store.toggleWatchlist(c.id, 'course')" class="text-[#BF5B34] hover:text-[#C1121F] text-xs font-semibold flex items-center gap-1 cursor-pointer">
                          <span class="material-icons text-sm">bookmark_remove</span>
                          <span>{{ lang.tr('Retirer', 'حذف') }}</span>
                        </button>
                      </div>
                      <h5 class="font-semibold text-[#14251D] text-xs">{{ c.title }}</h5>
                      <p class="text-[11px] text-[#4A5A50] line-clamp-2">{{ c.summary }}</p>
                      <div class="flex justify-end pt-2 border-t border-[#E7DFCF]">
                        <button (click)="viewCourseModal.set(c)" class="bg-[#14251D] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-3 py-1.5 rounded-xl text-xs cursor-pointer transition-colors">
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
                <h4 class="font-display font-semibold text-[#14251D] text-sm flex items-center gap-2">
                  <span class="material-icons text-[#1B4332] text-base">verified</span>
                  <span>{{ lang.tr('Enseignants Suivis', 'المعلمون المتابعون') }} ({{ store.watchedTeachers().length }})</span>
                </h4>
                <div class="grid md:grid-cols-3 gap-4">
                  @for (t of store.watchedTeachers(); track t.id) {
                    <app-teacher-card
                      [teacher]="t"
                      [isWatched]="true"
                      (toggleWatch)="store.toggleWatchlist($event.id, 'teacher')" />
                  }
                </div>
              </div>
            }
          }
        </div>
      }

        </div>
        <!-- end main results column -->

        <!-- Library rail: shelves (content types) + subject facets (left in RTL / Arabic) -->
        <aside class="w-full lg:w-60 shrink-0 order-first lg:order-none space-y-4">

          <!-- Shelves — data-driven: new content type = one row in the sections registry, zero layout change -->
          <div class="bg-white rounded-2xl p-5 border border-[#E7DFCF] space-y-3 lg:sticky lg:top-4">
            <div class="flex items-center gap-2 border-b border-[#E7DFCF] pb-3">
              <span class="material-icons text-[#1B4332] text-base">shelves</span>
              <h3 class="font-display font-semibold text-[#14251D] text-sm">{{ lang.tr('Rayons de la bibliothèque', 'أقسام المكتبة') }}</h3>
            </div>

            <nav class="grid grid-cols-2 lg:grid-cols-1 gap-1.5" [attr.aria-label]="lang.tr('Rayons', 'الأقسام')">
              @for (s of sections; track s.key) {
                <button
                  (click)="activeSection.set(s.key)"
                  [attr.aria-current]="activeSection() === s.key ? 'true' : null"
                  [style.border-inline-start-color]="activeSection() === s.key ? s.accent : 'transparent'"
                  [class]="activeSection() === s.key
                    ? 'bg-[#F2ECDE] text-[#14251D] font-semibold'
                    : 'text-[#4A5A50] font-medium hover:bg-[#FBF8F1]'"
                  class="w-full flex items-center justify-between gap-2 px-2.5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer border-s-[3px] border-transparent min-h-[44px]">
                  <span class="flex items-center gap-2 min-w-0">
                    <span class="material-icons text-base shrink-0" [style.color]="s.accent" aria-hidden="true">{{ s.icon }}</span>
                    <span class="truncate text-start">{{ lang.tr(s.labelFr, s.labelAr) }}</span>
                  </span>
                  @if (sectionCount(s.key) !== null) {
                    <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#F2ECDE] text-[#4A5A50] shrink-0">
                      {{ sectionCount(s.key) }}
                    </span>
                  }
                </button>
              }
            </nav>
          </div>

          <!-- Subject facet rail -->
          <div class="bg-white rounded-2xl p-5 border border-[#E7DFCF] space-y-3">
            <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-3">
              <div class="flex items-center gap-2">
                <span class="material-icons text-[#1B4332] text-base">category</span>
                <h3 class="font-display font-semibold text-[#14251D] text-sm">{{ lang.tr('Matière', 'المادة') }}</h3>
              </div>
              @if (store.selectedSubjects().size) {
                <button
                  (click)="onClearSubjects()"
                  class="text-[11px] text-[#8A5A00] hover:text-[#C1121F] font-semibold cursor-pointer">
                  {{ lang.tr('Effacer', 'مسح') }}
                </button>
              }
            </div>

            <div class="space-y-1.5">
              @for (f of store.subjectFacets(); track f.subject) {
                <label
                  class="flex items-center justify-between gap-2 px-2 py-2.5 rounded-xl cursor-pointer transition-colors"
                  [class]="f.selected ? 'bg-[#1B4332]/10' : 'hover:bg-[#FBF8F1]'">
                  <span class="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      [checked]="f.selected"
                      (change)="onSubjectToggle(f.subject)"
                      class="w-4 h-4 rounded text-[#1B4332] focus:ring-[#1B4332] cursor-pointer shrink-0" />
                    <span class="text-xs font-medium text-[#14251D] truncate">{{ subjectLabel(f.subject) }}</span>
                  </span>
                  <span
                    class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                    [class]="f.count ? 'bg-[#F2ECDE] text-[#4A5A50]' : 'bg-[#F2ECDE]/50 text-[#B7C7BC]'">
                    {{ f.count }}
                  </span>
                </label>
              }
            </div>
          </div>

          <!-- Official programme tree: grade → subject → trimester → topic -->
          <app-curriculum-tree />
        </aside>

      </div>
      <!-- end content: subject rail + results -->

    </div>

    <!-- MODAL: COURSE VIEW -->
    @if (viewCourseModal(); as c) {
      <div class="fixed inset-0 z-50 bg-[#14251D]/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-[#FBF8F1] rounded-2xl max-w-3xl w-full p-6 space-y-4 border border-[#E7DFCF] shadow-xl max-h-[92vh] overflow-y-auto">

          <!-- Header -->
          <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="bg-[#F2ECDE] text-[#1B4332] text-[10px] font-semibold px-2.5 py-0.5 rounded-md">{{ c.subject }}</span>
                <span class="text-[10px] text-[#6B7A70]">{{ c.grade }}</span>
                @if (c.pdfUrl) {
                  <span class="bg-[#C1121F]/10 text-[#C1121F] text-[9px] font-semibold px-2 py-0.5 rounded-md border border-[#C1121F]/30 flex items-center gap-0.5">
                    <span class="material-icons text-[10px]">picture_as_pdf</span>
                    Livre Officiel CNP — Ministère de l’Éducation
                  </span>
                }
              </div>
              <h3 class="font-display font-semibold text-[#14251D] text-lg mt-1 leading-tight">{{ c.title }}</h3>
            </div>
            <button (click)="viewCourseModal.set(null)" class="text-[#6B7A70] hover:text-[#14251D] cursor-pointer ml-4 shrink-0">
              <span class="material-icons">close</span>
            </button>
          </div>

          <!-- PDF Embed for CNP books -->
          @if (c.pdfUrl) {
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-xs text-[#5B6B60] font-medium">
                  📚 {{ lang.tr('Livre scolaire officiel du Centre National Pédagogique (CNP)', 'الكتاب المدرسي الرسمي للمركز الوطني البيداغوجي') }}
                </p>
                <a
                  [href]="c.pdfUrl"
                  target="_blank"
                  download
                  class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors shrink-0">
                  <span class="material-icons text-sm">download</span>
                  {{ lang.tr('Télécharger PDF', 'تحميل PDF') }}
                </a>
              </div>

              <!-- PDF iframe preview -->
              <div class="relative w-full rounded-xl overflow-hidden border border-[#E7DFCF] bg-[#F2ECDE]" style="height: 520px;">
                <iframe
                  [src]="getSafePdfUrl(c.pdfUrl)"
                  class="w-full h-full"
                  style="border: none;"
                  title="PDF Viewer">
                </iframe>
                <!-- Fallback if iframe blocked -->
                <div class="absolute inset-0 flex flex-col items-center justify-center bg-[#FBF8F1] text-center p-6 pointer-events-none" style="display:none">
                  <span class="material-icons text-5xl text-[#BF5B34] mb-2">picture_as_pdf</span>
                  <p class="text-sm font-semibold text-[#14251D]">{{ lang.tr('Prévisualisation non disponible dans ce navigateur', 'المعاينة غير متاحة') }}</p>
                  <a [href]="c.pdfUrl" target="_blank" class="mt-3 bg-[#2D6A4F] text-[#FBF8F1] font-semibold text-xs px-4 py-2 rounded-xl pointer-events-auto">
                    {{ lang.tr('Ouvrir dans un nouvel onglet', 'فتح في تبويب جديد') }}
                  </a>
                </div>
              </div>

              <p class="text-[10px] text-[#6B7A70] text-center">
                {{ lang.tr('Document officiel — Droits réservés à la République Tunisienne — Ministère de l’Éducation', 'وثيقة رسمية — جميع الحقوق محفوظة لوزارة التربية التونسية') }}
              </p>
            </div>
          } @else {
            <!-- Text content for teacher-created courses -->
            <div class="prose max-w-none text-xs leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-[#E7DFCF] font-sans text-[#14251D]">
              {{ c.content }}
            </div>
          }

          <div class="flex justify-between items-center pt-2 border-t border-[#E7DFCF]">
            @if (findAuthor(c.teacherName, c.authorId); as author) {
              <button
                (click)="viewCourseModal.set(null); selectedTeacherModal.set(author)"
                class="text-xs text-[#1B4332] font-semibold hover:underline underline-offset-2 cursor-pointer">
                {{ lang.tr('Par', 'من إعداد') }} {{ c.teacherName }}
              </button>
            } @else {
              <span class="text-xs text-[#5B6B60]">{{ lang.tr('Par', 'من إعداد') }} {{ c.teacherName }}</span>
            }
            <button (click)="viewCourseModal.set(null)" class="bg-[#14251D] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer transition-colors">
              {{ lang.tr('Fermer', 'إغلاق') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- IMAGE DOCUMENT VIEWER & A4 PRINT MODAL -->
    @if (imageDocModal(); as c) {
      <div class="fixed inset-0 z-50 bg-[#14251D]/70 backdrop-blur-xs flex items-center justify-center p-4 print:bg-white print:p-0 print:static print:block">
        <div class="bg-[#FBF8F1] rounded-2xl max-w-3xl w-full border border-[#E7DFCF] shadow-xl max-h-[92vh] overflow-hidden flex flex-col print:max-w-none print:max-h-none print:shadow-none print:border-0 print:rounded-none">
          <!-- header (hidden on print) -->
          <div class="flex items-center justify-between border-b border-[#E7DFCF] p-4 print:hidden">
            <div class="min-w-0">
              <h3 class="font-display font-semibold text-[#14251D] text-base truncate">{{ c.title }}</h3>
              <p class="text-[11px] text-[#6B7A70]">{{ c.subject }} • {{ c.grade }}@if (c.docType) { • {{ c.docType }}}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <app-share-button
                [url]="'/discovery?doc=' + c.id"
                [title]="c.title"
                [text]="c.summary || c.title"
                variant="button"
                accent="neutral" />
              <button
                (click)="printImageDoc()"
                class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors">
                <span class="material-icons text-sm">print</span>
                {{ lang.tr('Imprimer A4', 'طباعة A4') }}
              </button>
              <button (click)="imageDocModal.set(null)" class="text-[#6B7A70] hover:text-[#14251D] cursor-pointer">
                <span class="material-icons">close</span>
              </button>
            </div>
          </div>

          <!-- printable pages -->
          <div id="image-doc-printable" class="overflow-y-auto p-4 space-y-4 print:overflow-visible print:p-0 print:space-y-0">
            @for (url of c.imageUrls; track url; let i = $index) {
              <figure class="print-page bg-white rounded-lg border border-[#E7DFCF] overflow-hidden print:border-0 print:rounded-none print:break-after-page">
                <img [src]="url" [alt]="c.title + ' — page ' + (i + 1)" class="w-full h-auto" />
              </figure>
            }
            <p class="text-center text-[10px] text-[#6B7A70] print:hidden">{{ c.watermarkText }}</p>
          </div>
        </div>
      </div>
    }

    <!-- FEATURE 3: CREDIBILITY PROFILE MODAL WITH STAR RATING BREAKDOWN -->
    @if (selectedTeacherModal(); as t) {
      <div class="fixed inset-0 z-50 bg-[#14251D]/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-[#FBF8F1] rounded-2xl max-w-lg w-full p-6 space-y-5 border border-[#E7DFCF] shadow-xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-[#1B4332] text-xl">verified</span>
              <h3 class="font-display font-semibold text-[#14251D] text-base">
                {{ lang.tr('Profil de Crédibilité Enseignant', 'الملف المهني والاعتماد التربوي') }}
              </h3>
            </div>
            <button (click)="selectedTeacherModal.set(null)" class="text-[#6B7A70] hover:text-[#14251D] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <app-teacher-card
            [teacher]="t"
            [isWatched]="store.isWatched(t.id, 'teacher')"
            (toggleWatch)="store.toggleWatchlist($event.id, 'teacher')" />
        </div>
      </div>
    }

    <!-- FEATURE 5: ONE-CLICK PDF WATERMARK & PRINT PREVIEW MODAL -->
    @if (watermarkPreviewModal(); as docEx) {
      <div id="printable-modal" class="print-container fixed inset-0 z-50 bg-[#14251D]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <div class="bg-[#FBF8F1] rounded-2xl max-w-3xl w-full p-4 sm:p-6 space-y-4 border border-[#E7DFCF] shadow-2xl max-h-[90vh] flex flex-col relative my-auto">
          
          <!-- Watermark Header Banner -->
          <div class="no-print bg-[#14251D] text-[#FBF8F1] p-4 rounded-xl flex items-center justify-between shadow-xs shrink-0">
            <div class="flex items-center gap-2">
              <span class="material-icons text-[#F2C14E]">verified</span>
              <div>
                <h4 class="font-display font-semibold text-sm text-[#FBF8F1]">MADRASATI TN — FILIGRANE ET IMPRESSION PDF</h4>
                <p class="text-[11px] text-[#9DBBA8]">
                  {{ docEx.watermarkText || 'Madrasati TN — Document Certifié — Enseignant Certifié' }}
                </p>
              </div>
            </div>
            <button (click)="watermarkPreviewModal.set(null)" class="text-[#B7C7BC] hover:text-[#FBF8F1] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <!-- Document Render Frame with Watermark Overlay -->
          <div class="overflow-y-auto flex-1 pr-1 space-y-4">
            <div id="printable-document" class="print-document bg-white rounded-xl p-6 border border-[#E7DFCF] relative overflow-hidden space-y-4 font-sans text-xs cartouche-rules">
              
              <!-- Diagonal Watermark Stamp -->
              <div class="print-watermark absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 select-none rotate-[-25deg]">
                <span class="text-4xl font-display font-semibold uppercase text-[#1B4332] tracking-widest text-center">
                  MADRASATI TN <br /> COPIE CERTIFIÉE GRATUITE
                </span>
              </div>

              <!-- Official Header -->
              <app-cartouche tone="library" [grade]="docEx.grade" sub="المندوبية الجهوية للتربية" class="pb-3 font-sans">
                <div cartoucheCenter class="font-semibold">
                  <p class="text-base text-[#1B4332] font-display font-semibold">{{ docEx.title }}</p>
                  <p class="text-xs text-[#5B6B60]">{{ docEx.grade }} • {{ docEx.subject }} • {{ docEx.trimester || 'Trimestre 1' }}</p>
                </div>
                <div cartoucheEnd class="text-xs text-[#14251D]">
                  <span class="bg-[#F2ECDE] text-[#1B4332] font-semibold px-2 py-0.5 rounded text-[10px] border border-[#E7DFCF]">
                    {{ docEx.docType || 'Devoir de Contrôle' }}
                  </span>
                  <p class="text-[10px] text-[#6B7A70] mt-1">Année : {{ docEx.schoolYear || '2025-2026' }}</p>
                </div>
              </app-cartouche>

              <!-- Exercise Body -->
              <div class="space-y-3 py-2 font-sans relative z-10">
                <h3 class="font-display font-semibold text-[#14251D] text-sm">{{ docEx.title }}</h3>
                <p class="text-[#4A5A50] leading-relaxed bg-[#FBF8F1] p-4 rounded-xl border border-[#E7DFCF] font-sans text-xs whitespace-pre-line">
                  {{ docEx.promptText }}
                </p>

                @if (docEx.solutionText) {
                  <div class="bg-[#F2ECDE] p-4 rounded-xl border border-[#E7DFCF] text-[#14251D] font-sans">
                    <span class="font-semibold text-[#1B4332]">✔️ Corrigé Certifié :</span>
                    <p class="whitespace-pre-line mt-1 text-xs text-[#4A5A50]">{{ docEx.solutionText }}</p>
                  </div>
                }
              </div>

              <!-- Official Footer Watermark Attribution -->
              <div class="border-t border-[#E7DFCF] pt-3 text-[10px] text-[#6B7A70] font-sans flex items-center justify-between">
                <span>Attribution Enseignant : {{ docEx.watermarkText }}</span>
                <span>Plateforme Madrasati TN</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="no-print flex items-center justify-between gap-3 pt-2 shrink-0">
            <button (click)="watermarkPreviewModal.set(null)" class="bg-white hover:bg-[#F2ECDE] text-[#4A5A50] font-medium px-4 py-2.5 rounded-xl text-xs border border-[#E7DFCF] cursor-pointer transition-colors">
              {{ lang.tr('Fermer', 'إغلاق') }}
            </button>

            <div class="flex items-center gap-2">
              <app-share-button
                [url]="'/discovery?doc=' + docEx.id"
                [title]="docEx.title"
                [text]="docEx.promptText || docEx.title"
                variant="button"
                accent="neutral" />
              <button
                (click)="triggerPrintDialog()"
                class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-colors">
                <span class="material-icons text-base">print</span>
                {{ lang.t('printBtn') }}
              </button>
            </div>
          </div>

        </div>
      </div>
    }
  `,
})
export class PublicDiscoveryComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  private readonly print = inject(PrintService);
  readonly firebase = inject(FirebaseService);
  readonly seo = inject(SeoService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly router = inject(Router);

  constructor() {
    // Dynamic SEO & Schema.org JSON-LD updates
    effect(() => {
      const ex = this.watermarkPreviewModal();
      if (ex) {
        this.seo.updateSeo({
          title: `${ex.title} - ${ex.grade} ${ex.subject}`,
          description: `Document et exercice d'évaluation ${ex.title} pour ${ex.grade} (${ex.subject}). Copie certifiée gratuite sur Madrasati TN.`,
          keywords: `${ex.title}, ${ex.grade}, ${ex.subject}, devoirs tunisie, امتحانات ابتدائي`,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'EducationalResource',
            name: ex.title,
            educationalLevel: ex.grade,
            learningResourceType: ex.docType || 'Worksheet',
            inLanguage: ['ar', 'fr'],
            isAccessibleForFree: true,
            provider: {
              '@type': 'Organization',
              name: 'Madrasati TN',
              url: 'https://madrastihub.com',
            },
          },
        });
      } else {
        this.seo.updateSeo({
          title: 'Bibliothèque & Guide Pédagogique (المكتبة والدليل)',
          description: '38 livres officiels du المركز الوطني للبيداجوجيا (CNP) et banque d\'exercices certifiés pour le primaire en Tunisie.',
        });
      }
    });

    // Merge community-published worksheets into the library grid + blog feed.
    this.store.loadPublishedWorksheets();
    this.store.loadBlogPosts();

    // Programme deep link (?topicId=<chapterId>) pre-selects the topic in the tree (e.g. from /programme).
    if (typeof window !== 'undefined') {
      const topicId = new URLSearchParams(window.location.search).get('topicId');
      if (topicId) this.store.selectTopic(topicId);
    }

    // Picking a topic jumps to the shelf that actually holds matches (tagged items live in courses / CNP books).
    effect(() => {
      if (!this.store.selectedTopicId()) return;
      untracked(() => {
        if (this.store.filteredCourses().length) this.activeSection.set('courses');
        else if (this.store.filteredCnpBooks().length) this.activeSection.set('cnp');
      });
    });

    // Shared BD deep link (?bd=<itemId>) lands straight on the BD tab.
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('bd')) {
      this.activeSection.set('bd');
    }

    // Auto-switch to blog tab whenever a blog post is opened (e.g. from direct URL)
    effect(() => {
      if (this.store.selectedBlogPost()) {
        this.activeSection.set('blog');
      }
    });

    // Lazy-load recitations the first time the section is activated
    effect(() => {
      if (this.activeSection() === 'recitation') {
        this.loadRecitations();
      }
    });

    // Phase 3 — when a shared link (?doc=ID) resolves, open that exercise or course's printable modal.
    effect(async () => {
      const id = this.store.pendingDocId();
      if (!id) return;

      const ex = this.store.filteredExercisesBank().find((e) => e.id === id);
      if (ex) {
        this.activeSection.set('exercises');
        this.watermarkPreviewModal.set(ex);
        this.store.pendingDocId.set(null);
        return;
      }

      const c = this.store.filteredCourses().find((item) => item.id === id) || this.store.filteredCnpBooks().find((item) => item.id === id);
      if (c) {
        this.activeSection.set(c.id.startsWith('cnp-') ? 'cnp' : 'courses');
        if (c.imageUrls && c.imageUrls.length) {
          this.imageDocModal.set(c);
        } else {
          this.viewCourseModal.set(c);
        }
        this.store.pendingDocId.set(null);
        return;
      }

      // Fallback: Fetch document from /api/docs/:id if newly published or shared
      try {
        const sheet = await this.store.getWorksheet(id);
        if (sheet) {
          const mappedEx: ExerciseItem = {
            id: sheet.id,
            sheetId: sheet.id,
            title: sheet.title,
            chapter: sheet.topic || 'Fiche d\'exercices',
            topic: sheet.topic,
            subject: (sheet.subject || 'Français') as ExerciseItem['subject'],
            grade: (sheet.grade || '1ère Année') as ExerciseItem['grade'],
            difficulty: 'Moyen',
            docType: "Série d'Exercices",
            promptText: (sheet.exercises || []).map((e, idx) => `${idx + 1}. ${e.promptText}`).join('\n\n'),
            solutionText: (sheet.exercises || []).map((e, idx) => `${idx + 1}. ${e.solutionText || ''}`).join('\n\n'),
            photoUrl: (sheet.exercises || []).find((e) => e.imageUrl)?.imageUrl,
            hasCorrection: true,
            hints: [],
            points: 20,
            teacherName: sheet.authorName || 'Enseignant Certifié',
            schoolYear: '2025-2026',
            watermarkText: sheet.customWatermark || 'Madrasati TN',
          };
          this.activeSection.set('exercises');
          this.watermarkPreviewModal.set(mappedEx);
          this.store.pendingDocId.set(null);
        }
      } catch {
        // Doc not found
      }
    });
  }

  async shareBlogCard(post: BlogPost) {
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/discovery?blog=${encodeURIComponent(post.id)}`
      : '';
    const title = this.lang.isArabic() && post.titleAr ? post.titleAr : post.title;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: post.excerpt,
          url,
        });
        return;
      } catch { /* share cancelled — fallback to clipboard */ }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      this.store.showToast(this.lang.t('toastLinkCopied'), 'info');
    }
  }

  getSafePdfUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  cleanExcerpt(text?: string): string {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/^[#\s=->]+/gm, '')
      .replace(/[*_`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  readonly activeSection = signal<'exercises' | 'courses' | 'blog' | 'cnp' | 'bd' | 'teachers' | 'watchlist' | 'recitation'>('exercises');

  /** Library shelves — data-driven: adding a content type = one entry here + one @if section. */
  readonly sections: { key: 'exercises' | 'courses' | 'blog' | 'cnp' | 'bd' | 'teachers' | 'watchlist' | 'recitation'; icon: string; labelFr: string; labelAr: string; accent: string }[] = [
    { key: 'exercises', icon: 'fitness_center', labelFr: "Banque d'Examens & Séries", labelAr: 'مكتبة الفروض والسلاسل', accent: '#1B4332' },
    { key: 'courses', icon: 'menu_book', labelFr: 'Fiches & Cours', labelAr: 'الملخصات والدروس', accent: '#2D6A4F' },
    { key: 'recitation', icon: 'record_voice_over', labelFr: 'Récitations & Poèmes', labelAr: 'المحفوظات والأناشيد', accent: '#7B4F1E' },
    { key: 'blog', icon: 'article', labelFr: 'Articles & Conseils', labelAr: 'المدونة والمقالات', accent: '#2D6A4F' },
    { key: 'cnp', icon: 'auto_stories', labelFr: 'Manuels CNP', labelAr: 'الكتب الرسمية CNP', accent: '#C1121F' },
    { key: 'bd', icon: 'photo_library', labelFr: 'Bandes Dessinées', labelAr: 'شريط مصوّر', accent: '#BF5B34' },
    { key: 'watchlist', icon: 'bookmark', labelFr: 'Ma Watchlist', labelAr: 'قائمة محفوظاتي', accent: '#8A5A00' },
  ];

  readonly activeShelf = computed(() => this.sections.find((s) => s.key === this.activeSection()) ?? null);

  readonly exercisesPage = signal(1);
  readonly exercisesPageSize = signal(12);
  readonly paginatedExercises = computed(() =>
    paginate(this.store.filteredExercisesBank(), this.exercisesPage(), this.exercisesPageSize())
  );

  readonly coursesPage = signal(1);
  readonly coursesPageSize = signal(12);
  readonly currentCoursesList = computed(() =>
    this.activeSection() === 'cnp' ? this.store.filteredCnpBooks() : this.store.filteredCourses()
  );
  readonly paginatedCourses = computed(() =>
    paginate(this.currentCoursesList(), this.coursesPage(), this.coursesPageSize())
  );

  getSubjectTheme(subject?: string): { gradient: string; icon: string; badgeBg: string } {
    switch (subject) {
      case 'Mathématiques':
        return { gradient: 'from-[#0D3B66] via-[#1D4E89] to-[#007CC2]', icon: 'calculate', badgeBg: 'bg-[#007CC2]/30' };
      case 'اللغة العربية':
        return { gradient: 'from-[#14251D] via-[#1B4332] to-[#2D6A4F]', icon: 'auto_stories', badgeBg: 'bg-[#2D6A4F]/30' };
      case 'Éveil Scientifique':
        return { gradient: 'from-[#4A2810] via-[#8A5A00] to-[#D97706]', icon: 'biotech', badgeBg: 'bg-[#D97706]/30' };
      case 'Français':
        return { gradient: 'from-[#2E1065] via-[#4C1D95] to-[#7C3AED]', icon: 'translate', badgeBg: 'bg-[#7C3AED]/30' };
      case 'Anglais':
        return { gradient: 'from-[#042F2E] via-[#115E59] to-[#0D9488]', icon: 'language', badgeBg: 'bg-[#0D9488]/30' };
      case 'Histoire & Géographie':
        return { gradient: 'from-[#422006] via-[#78350F] to-[#B45309]', icon: 'public', badgeBg: 'bg-[#B45309]/30' };
      case 'Éducation Islamique':
        return { gradient: 'from-[#064E3B] via-[#047857] to-[#10B981]', icon: 'mosque', badgeBg: 'bg-[#10B981]/30' };
      default:
        return { gradient: 'from-[#14251D] via-[#1B4332] to-[#2D6A4F]', icon: 'school', badgeBg: 'bg-[#2D6A4F]/30' };
    }
  }

  /** Resolve a resource's author to a real teacher card (by id first, then exact name). */
  findAuthor(teacherName?: string, teacherId?: string): TeacherProfile | null {
    if (!teacherName && !teacherId) return null;
    const list = this.store.teachers();
    return (
      (teacherId ? list.find((t) => t.id === teacherId) : undefined) ??
      (teacherName ? list.find((t) => t.name === teacherName) : undefined) ??
      null
    );
  }

  sectionCount(key: string): number | null {
    switch (key) {
      case 'exercises': return this.store.filteredExercisesBank().length;
      case 'courses': return this.store.filteredCourses().length;
      case 'blog': return this.store.filteredBlogPosts().length;
      case 'cnp': return this.store.filteredCnpBooks().length;
      case 'teachers': return this.store.teachers().length;
      case 'watchlist': return this.store.totalWatchlistCount();
      case 'recitation': return this.recitationItems().length;
      default: return null; // bd counts load inside its own component
    }
  }

  // ─── Recitation / محفوظات state ───────────────────────────────────────────
  readonly recitationItems = signal<RecitationItem[]>([]);
  readonly recitationLightbox = signal<string | null>(null);
  readonly recitationGradeFilter = signal<string>('Tous');
  readonly recitationTrimesterFilter = signal<number>(0);
  readonly recitationLoaded = signal(false);

  readonly filteredRecitations = computed(() => {
    const grade = this.recitationGradeFilter();
    const tri   = this.recitationTrimesterFilter();
    return this.recitationItems().filter(r =>
      (grade === 'Tous' || r.grade === grade) &&
      (tri === 0        || r.trimester === tri)
    );
  });

  async loadRecitations() {
    if (this.recitationLoaded()) return;
    try {
      const idx = await fetch('/assets/resources/index.json').then(r => r.json());
      const recManifests: string[] = (idx.manifests as string[]).filter((m: string) => m.includes('/recitation/'));
      const all: RecitationItem[] = [];
      await Promise.all(recManifests.map(async (rel) => {
        try {
          const m = await fetch(`/${rel}`).then(r => r.json());
          (m.items ?? []).forEach((item: RecitationItem) => all.push(item));
        } catch { /* skip broken manifest */ }
      }));
      this.recitationItems.set(all);
      this.recitationLoaded.set(true);
    } catch (e) {
      console.error('Recitation load failed', e);
    }
  }

  readonly viewCourseModal = signal<Course | null>(null);
  readonly imageDocModal = signal<Course | null>(null);
  readonly selectedTeacherModal = signal<TeacherProfile | null>(null);
  readonly watermarkPreviewModal = signal<ExerciseItem | null>(null);

  publicSubText(): string {
    return this.lang.tr(
      'Retrouvez instantanément vos devoirs de contrôle, de synthèse et fiches de révision filigranés.',
      'استرجع فروض المراقبة والتأليفية والسلاسل المصحوبة بالإصلاح بضغطة زر.'
    );
  }

  onSearchInput(event: Event) {
    this.activeSection.set('exercises');
    this.store.setSearchQuery((event.target as HTMLInputElement).value);
  }

  onGradeChange(event: Event) {
    this.activeSection.set('exercises');
    this.store.setGradeFilter((event.target as HTMLSelectElement).value);
  }

  subjectLabel(subject: string): string {
    switch (subject) {
      case 'Mathématiques': return this.lang.tr('Mathématiques', 'الرياضيات');
      case 'Français': return this.lang.tr('Français', 'الفرنسية');
      case 'اللغة العربية': return this.lang.tr('Langue Arabe', 'اللغة العربية');
      case 'Éveil Scientifique': return this.lang.tr('Éveil Scientifique', 'الإيقاظ العلمي');
      default: return subject;
    }
  }

  onTrimesterChange(event: Event) {
    this.activeSection.set('exercises');
    this.store.setTrimesterFilter((event.target as HTMLSelectElement).value);
  }

  onDocTypeChange(event: Event) {
    this.activeSection.set('exercises');
    this.store.setDocTypeFilter((event.target as HTMLSelectElement).value);
  }

  onSchoolYearChange(event: Event) {
    this.activeSection.set('exercises');
    this.store.setSchoolYearFilter((event.target as HTMLSelectElement).value);
  }

  onCorrectionToggle(event: Event) {
    this.activeSection.set('exercises');
    this.store.setOnlyWithCorrectionFilter((event.target as HTMLInputElement).checked);
  }

  onSubjectToggle(subject: string) {
    this.activeSection.set('exercises');
    this.store.toggleSubject(subject);
  }

  onClearSubjects() {
    this.activeSection.set('exercises');
    this.store.clearSubjects();
  }

  onResetFilters() {
    this.activeSection.set('exercises');
    this.store.resetAllFilters();
  }

  reportDocument(ex: ExerciseItem) {
    this.store.reportExercise(ex.id);
    const msg = this.lang.tr(
      '🚨 Signalement transmis à l\'équipe de modération. Merci pour votre contribution !',
      '🚨 تم إرسال الإبلاغ لفريق الإشراف. شكراً لمساهمتكم!'
    );
    alert(msg);
  }

  openWatermarkPreviewModal(ex: ExerciseItem) {
    // Library sheets only carry a one-line summary here; their real content and print layout live on their own page.
    if (ex.sheetId) {
      void this.router.navigateByUrl(ex.openUrl ?? `/generate?sheet=${ex.sheetId}`);
      return;
    }
    this.watermarkPreviewModal.set(ex);
  }

  triggerPrintDialog() {
    this.print.printPage();
  }

  openImageDoc(c: Course) {
    this.imageDocModal.set(c);
  }

  printImageDoc() {
    this.print.printCourse(this.imageDocModal());
  }

  copyLink(ex: ExerciseItem) {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}?doc=${ex.id}`);
      alert(this.lang.tr('🔗 Lien copié dans le presse-papier !', '🔗 تم نسخ رابط الوثيقة بنجاح!'));
    }
  }

  readonly copiedPostId = signal<string | null>(null);

  /** Copy a ready-to-paste social post for an exercise: title, level, subject, excerpt, link. */
  async copyExercisePost(ex: ExerciseItem) {
    if (typeof navigator === 'undefined') return;
    const url = `${window.location.origin}/?doc=${ex.id}`;
    const meta = [ex.grade, ex.subject, ex.trimester, ex.docType].filter(Boolean).join(' · ');
    const excerpt = (ex.promptText || '').slice(0, 140);
    const post = this.lang.isArabic()
      ? `📝 ${ex.title}\n🎓 ${meta}\n«${excerpt}…»\n\n${ex.hasCorrection === false ? '' : 'مع الإصلاح المفصل — '}مجانًا على مكتبة مدرستي:\n${url}`
      : `📝 ${ex.title}\n🎓 ${meta}\n« ${excerpt}… »\n\n${ex.hasCorrection === false ? '' : 'Corrigé détaillé inclus — '}gratuit sur la bibliothèque Madrasati :\n${url}`;
    try {
      await navigator.clipboard.writeText(post);
      this.copiedPostId.set(ex.id);
      setTimeout(() => this.copiedPostId.set(null), 2500);
    } catch (err) {
      console.error('Clipboard error:', err);
    }
  }

  /** Copy a ready-to-paste social post for a course: title, level, subject, summary, link. */
  async copyCoursePost(c: Course) {
    if (typeof navigator === 'undefined') return;
    const url = `${window.location.origin}/?doc=${c.id}`;
    const meta = [c.grade, c.subject, c.trimester, c.docType].filter(Boolean).join(' · ');
    const excerpt = (c.summary || c.title || '').slice(0, 140);
    const post = this.lang.isArabic()
      ? `📚 ${c.title}\n🎓 ${meta}\n«${excerpt}…»\n\n${c.hasCorrection === false ? '' : 'مع الإصلاح — '}مجانًا على مكتبة مدرستي:\n${url}`
      : `📚 ${c.title}\n🎓 ${meta}\n« ${excerpt}… »\n\n${c.hasCorrection === false ? '' : 'Corrigé inclus — '}gratuit sur la bibliothèque Madrasati :\n${url}`;
    try {
      await navigator.clipboard.writeText(post);
      this.copiedPostId.set(c.id);
      setTimeout(() => this.copiedPostId.set(null), 2500);
    } catch (err) {
      console.error('Clipboard error:', err);
    }
  }

}
