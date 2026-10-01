import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { EducationStore, LanguageService, FirebaseService, Course, BlogPost, GradeLevel, SubjectName } from '@core';

@Component({
  selector: 'app-parent-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="space-y-6">
      
      <!-- Parent Header Banner -->
      <div class="bg-[#0B2947] text-white rounded-[24px] p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-2">
            <div class="inline-flex items-center gap-2 bg-[#E0AA32]/20 text-[#E0AA32] border border-[#E0AA32]/40 text-xs px-3 py-1 rounded-full font-semibold">
              <span class="material-icons text-sm">verified_user</span> {{ lang.tr('Espace Parent & Répertoire A4', 'فضاء الولي وبنك الوثائق A4') }}
            </div>

            <h1 class="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              {{ parentGreeting() }}
            </h1>

            @if (isUserLoggedIn()) {
              <div class="flex items-center gap-3 pt-1">
                <div class="w-10 h-10 rounded-full bg-[#007CC2] text-white flex items-center justify-center font-bold">
                  {{ store.activeStudent().name.charAt(0) }}
                </div>
                <div>
                  <p class="font-semibold text-sm flex items-center gap-2 text-white">
                    <span>{{ store.activeStudent().name }}</span>
                    <span class="text-[11px] bg-[#E0AA32]/20 text-[#E0AA32] border border-[#E0AA32]/40 px-2 py-0.5 rounded-full font-semibold">
                      {{ store.activeStudent().grade }}
                    </span>
                  </p>
                  <p class="text-xs text-[#8CA9C4]">{{ store.activeStudent().school }}</p>
                </div>
              </div>
            } @else {
              <p class="text-xs sm:text-sm text-[#8CA9C4] max-w-xl leading-relaxed">
                {{ lang.tr('Banque nationale de devoirs et résumés conformes A4, conseils pédagogiques des enseignants et espace d’entraide.', 'بنك الامتحانات والملخصات الرسمية A4، نصائح المربين وفضاء طرح الأسئلة والتوجيه المدرسي.') }}
              </p>
            }
          </div>

          <!-- Sibling Switcher or Quick CTA -->
          <div class="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              (click)="openParentStudio()"
              class="flex items-center gap-1.5 bg-[#E0AA32] hover:bg-[#D19A24] text-[#0B2947] font-bold px-4 py-2.5 rounded-[10px] text-xs transition-colors cursor-pointer shadow-sm">
              <span class="material-icons text-base">auto_fix_high</span>
              <span>{{ lang.tr('Générer Fiche d’Entraînement ✨', 'توليد ورقة تمارين منزلية ✨') }}</span>
            </button>

            @if (isUserLoggedIn() && store.students().length > 1) {
              <div class="bg-white/10 p-2 rounded-[12px] border border-white/15 flex items-center gap-1.5">
                <span class="text-[11px] text-[#8CA9C4] font-medium hidden sm:inline">{{ lang.t('switchChild') }}:</span>
                @for (st of store.students(); track st.id) {
                  <button
                    (click)="store.setActiveStudent(st.id)"
                    [class]="store.activeStudentId() === st.id ? 'bg-[#007CC2] text-white font-semibold' : 'text-white/80 hover:text-white'"
                    class="px-2.5 py-1 rounded-[8px] text-xs transition-colors cursor-pointer flex items-center gap-1">
                    <span class="material-icons text-xs">face</span>
                    {{ st.name }}
                  </button>
                }
              </div>
            } @else {
              <button
                (click)="openModal('askQuestion')"
                class="flex items-center gap-1.5 bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold px-4 py-2.5 rounded-[10px] text-xs transition-colors cursor-pointer shadow-sm">
                <span class="material-icons text-base">help_outline</span>
                {{ lang.t('askQuestionBtn') }}
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Quick Category Quick-Nav -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          (click)="activeTab.set('docs')"
          [class]="activeTab() === 'docs' ? 'ring-2 ring-[#007CC2]' : ''"
          class="bg-white rounded-[18px] p-5 border border-[#E3ECF2] shadow-xs hover:shadow-md transition-all text-left rtl:text-right flex flex-col justify-between cursor-pointer">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-[#102A43]">{{ lang.t('tabParentDocs') }}</span>
            <div class="w-8 h-8 rounded-lg bg-[#E8F5FC] text-[#007CC2] flex items-center justify-center">
              <span class="material-icons text-lg">menu_book</span>
            </div>
          </div>
          <div>
            <p class="font-display text-2xl font-semibold text-[#102A43] tracking-tight">{{ store.courses().length }}</p>
            <p class="text-[11px] text-[#486581] mt-0.5">{{ lang.tr('Fiches A4 à imprimer', 'وثائق وامتحانات للطباعة') }}</p>
          </div>
        </button>

        <button
          (click)="activeTab.set('blog')"
          [class]="activeTab() === 'blog' ? 'ring-2 ring-[#23845B]' : ''"
          class="bg-white rounded-[18px] p-5 border border-[#E3ECF2] shadow-xs hover:shadow-md transition-all text-left rtl:text-right flex flex-col justify-between cursor-pointer">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-[#102A43]">{{ lang.t('tabParentBlog') }}</span>
            <div class="w-8 h-8 rounded-lg bg-[#E8F6EF] text-[#23845B] flex items-center justify-center">
              <span class="material-icons text-lg">article</span>
            </div>
          </div>
          <div>
            <p class="font-display text-2xl font-semibold text-[#102A43] tracking-tight">{{ store.blogPosts().length }}</p>
            <p class="text-[11px] text-[#486581] mt-0.5">{{ lang.tr('Conseils d’enseignants', 'نصائح وإرشادات المعلمين') }}</p>
          </div>
        </button>

        <button
          (click)="activeTab.set('qa')"
          [class]="activeTab() === 'qa' ? 'ring-2 ring-[#D19A24]' : ''"
          class="bg-white rounded-[18px] p-5 border border-[#E3ECF2] shadow-xs hover:shadow-md transition-all text-left rtl:text-right flex flex-col justify-between cursor-pointer">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-[#102A43]">{{ lang.t('tabParentQA') }}</span>
            <div class="w-8 h-8 rounded-lg bg-[#FFF4D8] text-[#D19A24] flex items-center justify-center">
              <span class="material-icons text-lg">forum</span>
            </div>
          </div>
          <div>
            <p class="font-display text-2xl font-semibold text-[#102A43] tracking-tight">{{ store.questionThreads().length }}</p>
            <p class="text-[11px] text-[#486581] mt-0.5">{{ lang.tr('Questions & Réponses', 'أسئلة واستفسارات مجابة') }}</p>
          </div>
        </button>

        <button
          (click)="activeTab.set('announcements')"
          [class]="activeTab() === 'announcements' ? 'ring-2 ring-[#007CC2]' : ''"
          class="bg-white rounded-[18px] p-5 border border-[#E3ECF2] shadow-xs hover:shadow-md transition-all text-left rtl:text-right flex flex-col justify-between cursor-pointer">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-[#102A43]">{{ lang.t('tabAnnouncements') }}</span>
            <div class="w-8 h-8 rounded-lg bg-[#E8F5FC] text-[#007CC2] flex items-center justify-center">
              <span class="material-icons text-lg">campaign</span>
            </div>
          </div>
          <div>
            <p class="font-display text-2xl font-semibold text-[#102A43] tracking-tight">{{ store.classAnnouncements().length }}</p>
            <p class="text-[11px] text-[#486581] mt-0.5">{{ lang.tr('Communications d’école', 'إعلانات وبلاغات رسمية') }}</p>
          </div>
        </button>
      </div>

      <!-- Main Workspace Section -->
      <div class="bg-white rounded-[24px] border border-[#E3ECF2] overflow-hidden shadow-xs">
        
        <!-- Tab Bar Header -->
        <div class="border-b border-[#E3ECF2] bg-[#F7F9FB] px-6 pt-3 flex flex-wrap gap-2">
          <button
            (click)="activeTab.set('docs')"
            [class]="activeTab() === 'docs' ? 'border-[#007CC2] text-[#007CC2] bg-white font-semibold shadow-xs' : 'border-transparent text-[#486581] font-medium hover:text-[#007CC2]'"
            class="px-4 py-3 border-b-2 text-xs flex items-center gap-2 transition-all cursor-pointer rounded-t-lg">
            <span class="material-icons text-base">menu_book</span>
            <span>{{ lang.t('tabParentDocs') }} ({{ filteredCourses().length }})</span>
          </button>

          <button
            (click)="activeTab.set('blog')"
            [class]="activeTab() === 'blog' ? 'border-[#007CC2] text-[#007CC2] bg-white font-semibold shadow-xs' : 'border-transparent text-[#486581] font-medium hover:text-[#007CC2]'"
            class="px-4 py-3 border-b-2 text-xs flex items-center gap-2 transition-all cursor-pointer rounded-t-lg">
            <span class="material-icons text-base">article</span>
            <span>{{ lang.t('tabParentBlog') }} ({{ store.blogPosts().length }})</span>
          </button>

          <button
            (click)="activeTab.set('qa')"
            [class]="activeTab() === 'qa' ? 'border-[#007CC2] text-[#007CC2] bg-white font-semibold shadow-xs' : 'border-transparent text-[#486581] font-medium hover:text-[#007CC2]'"
            class="px-4 py-3 border-b-2 text-xs flex items-center gap-2 transition-all cursor-pointer rounded-t-lg">
            <span class="material-icons text-base">forum</span>
            <span>{{ lang.t('tabParentQA') }} ({{ store.questionThreads().length }})</span>
          </button>

          <button
            (click)="activeTab.set('announcements')"
            [class]="activeTab() === 'announcements' ? 'border-[#007CC2] text-[#007CC2] bg-white font-semibold shadow-xs' : 'border-transparent text-[#486581] font-medium hover:text-[#007CC2]'"
            class="px-4 py-3 border-b-2 text-xs flex items-center gap-2 transition-all cursor-pointer rounded-t-lg">
            <span class="material-icons text-base">campaign</span>
            <span>{{ lang.t('tabAnnouncements') }} ({{ store.classAnnouncements().length }})</span>
          </button>
        </div>

        <!-- Tab Body -->
        <div class="p-6">

          <!-- TAB 1: A4 DOCUMENTS BANK & 1-CLICK PRINT -->
          @if (activeTab() === 'docs') {
            <div class="space-y-6">

              <!-- Exercices vs Manuels (parents look for exercises first) -->
              <div class="bg-[#EEF4F8] p-1.5 rounded-[14px] border border-[#E3ECF2] inline-flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  (click)="selectDocKind('exercices')"
                  [class]="docKind() === 'exercices' ? 'bg-[#007CC2] text-white font-semibold shadow-xs' : 'text-[#486581] hover:text-[#007CC2]'"
                  class="flex-1 sm:flex-none px-4 py-2 rounded-[10px] text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                  <span class="material-icons text-sm">assignment</span>
                  {{ lang.tr('Exercices & Devoirs', 'التمارين والامتحانات') }} ({{ exercicesCount() }})
                </button>
                <button
                  (click)="selectDocKind('books')"
                  [class]="docKind() === 'books' ? 'bg-[#23845B] text-white font-semibold shadow-xs' : 'text-[#486581] hover:text-[#23845B]'"
                  class="flex-1 sm:flex-none px-4 py-2 rounded-[10px] text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                  <span class="material-icons text-sm">menu_book</span>
                  {{ lang.tr('Manuels Officiels (CNP)', 'الكتب المدرسية الرسمية') }} ({{ booksCount() }})
                </button>
              </div>

              <!-- Filter Controls -->
              <div class="bg-[#F7F9FB] p-4 rounded-[18px] border border-[#E3ECF2] space-y-3">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="relative grow max-w-md">
                    <span class="material-icons absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-[#627D98] text-sm">search</span>
                    <input
                      type="text"
                      [value]="searchDocQuery()"
                      (input)="searchDocQuery.set($any($event.target).value); currentPage.set(1)"
                      [placeholder]="lang.t('searchDocsPlaceholder')"
                      class="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 text-xs bg-white border border-[#E3ECF2] rounded-[10px] outline-none text-[#102A43]" />
                  </div>

                  <!-- Grade Filter Pills -->
                  <div class="flex flex-wrap items-center gap-1.5">
                    @for (grade of gradesList; track grade) {
                      <button
                        (click)="selectGrade(grade)"
                        [class]="selectedGradeFilter() === grade
                          ? 'bg-[#007CC2] text-white font-semibold shadow-xs'
                          : 'bg-white text-[#486581] border border-[#E3ECF2] hover:border-[#007CC2]'"
                        class="px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer">
                        {{ grade === 'all' ? lang.t('filterGradeAll') : grade }}
                      </button>
                    }
                  </div>
                </div>

                <!-- Subject Filter Pills -->
                <div class="flex flex-wrap items-center gap-1.5 pt-1">
                  @for (subj of subjectsList; track subj) {
                    <button
                      (click)="selectSubject(subj)"
                      [class]="selectedSubjectFilter() === subj
                        ? 'bg-[#23845B] text-white font-semibold shadow-xs'
                        : 'bg-white text-[#486581] border border-[#E3ECF2] hover:border-[#23845B]'"
                      class="px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer">
                      {{ subj === 'all' ? lang.t('filterSubjectAll') : subj }}
                    </button>
                  }
                </div>

                <!-- Topic Taxonomy Pills (Book → Chapter → Topic → Exercise) -->
                @if (availableTopics().length > 1) {
                  <div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E3ECF2]">
                    <span class="text-[10px] font-semibold text-[#627D98] flex items-center gap-1 pr-1">
                      <span class="material-icons text-xs text-[#8A5A00]">sell</span>
                      {{ lang.tr('Thème / Chapitre :', 'المحور / الدرس :') }}
                    </span>
                    @for (topic of availableTopics(); track topic) {
                      <button
                        (click)="selectedTopicFilter.set(topic); currentPage.set(1)"
                        [class]="selectedTopicFilter() === topic
                          ? 'bg-[#8A5A00] text-white font-semibold shadow-xs'
                          : 'bg-white text-[#486581] border border-[#E3ECF2] hover:border-[#8A5A00]'"
                        class="px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer">
                        {{ topic === 'all' ? lang.tr('Tous les thèmes', 'كل المحاور') : topic }}
                      </button>
                    }
                  </div>
                }
              </div>

              <!-- Documents Cards Grid -->
              <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                @for (c of paginatedCourses(); track c.id) {
                  <div class="bg-[#F7F9FB] rounded-[18px] p-5 border border-[#E3ECF2] flex flex-col justify-between space-y-3 hover:shadow-md transition-all">
                    <div class="space-y-2">
                      @if (c.imageUrls && c.imageUrls.length) {
                        <button
                          (click)="openPrintCourseModal(c)"
                          class="block w-full relative rounded-[12px] overflow-hidden border border-[#E3ECF2] group cursor-pointer mb-1"
                          [title]="lang.tr('Voir & imprimer', 'عرض وطباعة')">
                          <img [src]="c.imageUrls[0]" [alt]="c.title" loading="lazy" class="w-full h-40 object-cover object-top transition-transform group-hover:scale-[1.03]" />
                          @if (c.imageUrls.length > 1) {
                            <span class="absolute top-2 right-2 bg-[#0B2947]/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span class="material-icons text-[11px]">collections</span>{{ c.imageUrls.length }}
                            </span>
                          }
                          @if (c.hasCorrection) {
                            <span class="absolute top-2 left-2 bg-[#23845B] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                              {{ lang.tr('Corrigé', 'إصلاح') }}
                            </span>
                          }
                        </button>
                      }

                      <div class="flex items-center justify-between">
                        <span class="bg-[#007CC2]/10 text-[#007CC2] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {{ c.subject }}
                        </span>
                        @if (c.grade) {
                          <span class="bg-[#E0AA32]/15 text-[#9E6A00] text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {{ c.grade }}
                          </span>
                        }
                      </div>

                      <h4 class="font-display font-semibold text-[#102A43] text-sm leading-snug">{{ c.title }}</h4>
                      @if (c.theme) {
                        <span class="inline-block bg-[#8A5A00]/10 text-[#8A5A00] text-[10px] font-semibold px-2 py-0.5 rounded-full">{{ c.theme }}</span>
                      }
                      <p class="text-xs text-[#486581] line-clamp-2 leading-relaxed">{{ c.summary }}</p>
                    </div>

                    <div class="pt-3 border-t border-[#E3ECF2] flex items-center justify-between gap-2">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        @if (c.pdfUrl) {
                          <a
                            [href]="c.pdfUrl"
                            target="_blank"
                            rel="noopener"
                            download
                            class="bg-[#23845B] hover:bg-[#1C6949] text-white font-bold px-2.5 py-1.5 rounded-[8px] text-xs flex items-center gap-1 shadow-xs transition-colors">
                            <span class="material-icons text-xs">download</span>
                            <span>{{ lang.tr('PDF', 'تحميل PDF') }}</span>
                          </a>
                        }
                        <button
                          (click)="openPrintCourseModal(c)"
                          class="bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold px-2.5 py-1.5 rounded-[8px] text-xs flex items-center gap-1 cursor-pointer shadow-xs">
                          <span class="material-icons text-xs">print</span>
                          {{ lang.t('printA4Btn') }}
                        </button>
                        <button
                          (click)="copyDocLink(c)"
                          class="bg-[#F7F9FB] hover:bg-[#E3ECF2] text-[#486581] font-semibold px-2.5 py-1.5 rounded-[8px] text-xs flex items-center gap-1 border border-[#E3ECF2] transition-colors cursor-pointer">
                          <span class="material-icons text-xs">link</span>
                          {{ lang.tr('Copier le lien', 'نسخ الرابط') }}
                        </button>
                      </div>

                      <button
                        (click)="openPrintCourseModal(c)"
                        class="text-xs font-semibold text-[#102A43] hover:text-[#007CC2] flex items-center gap-1 cursor-pointer shrink-0">
                        {{ lang.tr('Aperçu', 'معاينة') }} <span class="material-icons text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                }
              </div>

              <!-- Pagination Controls -->
              @if (filteredCourses().length > pageSize()) {
                <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E3ECF2] text-xs">
                  <span class="text-[#627D98] font-medium">
                    {{ lang.tr('Affichage de', 'عرض') }}
                    <strong class="text-[#102A43]">{{ (currentPage() - 1) * pageSize() + 1 }}</strong>
                    -
                    <strong class="text-[#102A43]">{{ getEndItemIndex() }}</strong>
                    {{ lang.tr('sur', 'من أصل') }}
                    <strong class="text-[#007CC2]">{{ filteredCourses().length }}</strong>
                    {{ lang.tr('documents', 'وثيقة') }}
                  </span>

                  <div class="flex items-center gap-1.5">
                    <button
                      (click)="goToPage(currentPage() - 1)"
                      [disabled]="currentPage() === 1"
                      class="px-3 py-1.5 rounded-[8px] border border-[#E3ECF2] text-[#102A43] hover:bg-[#F7F9FB] disabled:opacity-30 disabled:cursor-not-allowed font-medium flex items-center gap-1 cursor-pointer transition-colors">
                      <span class="material-icons text-sm rtl:rotate-180">chevron_left</span>
                      <span>{{ lang.tr('Précédent', 'السابق') }}</span>
                    </button>

                    <div class="flex items-center gap-1">
                      @for (p of pageNumbers(); track p) {
                        <button
                          (click)="goToPage(p)"
                          [class]="currentPage() === p
                            ? 'bg-[#007CC2] text-white font-bold shadow-xs'
                            : 'bg-white text-[#486581] border border-[#E3ECF2] hover:border-[#007CC2]'"
                          class="w-8 h-8 rounded-[8px] text-xs font-semibold flex items-center justify-center transition-all cursor-pointer">
                          {{ p }}
                        </button>
                      }
                    </div>

                    <button
                      (click)="goToPage(currentPage() + 1)"
                      [disabled]="currentPage() === totalPages()"
                      class="px-3 py-1.5 rounded-[8px] border border-[#E3ECF2] text-[#102A43] hover:bg-[#F7F9FB] disabled:opacity-30 disabled:cursor-not-allowed font-medium flex items-center gap-1 cursor-pointer transition-colors">
                      <span>{{ lang.tr('Suivant', 'التالي') }}</span>
                      <span class="material-icons text-sm rtl:rotate-180">chevron_right</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          }

          <!-- TAB 2: PEDAGOGICAL BLOG & ADVICE -->
          @if (activeTab() === 'blog') {
            <div class="space-y-6">
              <div>
                <h3 class="font-display font-semibold text-[#102A43] text-base">
                  {{ lang.t('tabParentBlog') }}
                </h3>
                <p class="text-xs text-[#486581]">
                  {{ lang.tr("Articles et méthodes rédigés par les enseignants du primaire tunisien pour vous guider à la maison.", 'مقالات وتوجيهات بيداغوجية موجهة للأولياء لمرافقة الأبناء في المنزل.') }}
                </p>
              </div>

              <div class="grid md:grid-cols-2 gap-5">
                @for (post of store.blogPosts(); track post.id) {
                  <div class="bg-[#F7F9FB] rounded-[20px] p-6 border border-[#E3ECF2] flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
                    <div class="space-y-3">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="bg-[#23845B]/10 text-[#23845B] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            {{ post.subject || 'Pédagogie' }}
                          </span>
                          @if (post.grade) {
                            <span class="bg-[#E0AA32]/15 text-[#9E6A00] text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {{ post.grade }}
                            </span>
                          }
                        </div>
                        <span class="text-[11px] text-[#627D98] flex items-center gap-1">
                          <span class="material-icons text-xs">schedule</span>
                          {{ post.readTimeMinutes }} min
                        </span>
                      </div>

                      <h4 class="font-display font-semibold text-[#102A43] text-base leading-snug">
                        {{ post.title }}
                      </h4>

                      <p class="text-xs text-[#486581] leading-relaxed line-clamp-3">
                        {{ post.excerpt }}
                      </p>

                      <div class="flex flex-wrap gap-1.5 pt-1">
                        @for (tag of post.tags; track tag) {
                          <span class="text-[10px] bg-white text-[#627D98] px-2 py-0.5 rounded-md border border-[#E3ECF2]">
                            #{{ tag }}
                          </span>
                        }
                      </div>
                    </div>

                    <div class="pt-4 border-t border-[#E3ECF2] flex items-center justify-between gap-3 text-xs">
                      <div class="flex items-center gap-3">
                        <button
                          (click)="store.likeBlogPost(post.id)"
                          class="flex items-center gap-1 text-[#D64545] font-semibold hover:opacity-80 cursor-pointer bg-white px-2.5 py-1 rounded-full border border-[#E3ECF2]">
                          <span class="material-icons text-sm">favorite</span>
                          <span>{{ post.likesCount }}</span>
                        </button>
                        <span class="text-[#627D98] flex items-center gap-1 font-medium">
                          <span class="material-icons text-sm">chat_bubble_outline</span>
                          {{ post.comments.length }}
                        </span>
                      </div>

                      <button
                        (click)="store.openBlogPost(post)"
                        class="text-[#007CC2] font-semibold hover:underline flex items-center gap-1 cursor-pointer">
                        {{ lang.tr('Lire l’article', 'قراءة المقال') }}
                        <span class="material-icons text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- TAB 3: POSER UNE QUESTION / DEMANDE DE FICHES -->
          @if (activeTab() === 'qa') {
            <div class="space-y-6">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 class="font-display font-semibold text-[#102A43] text-base">
                    {{ lang.t('tabParentQA') }}
                  </h3>
                  <p class="text-xs text-[#486581]">
                    {{ lang.tr("Besoin d'aide sur une notion ou d'une fiche d'exercices particulière ? Posez votre question directement aux enseignants.", 'هل تبحث عن تمارين مخصصة أو شرح لدرس معين؟ اطرح سؤالك مباشرة على الإطار التربوي.') }}
                  </p>
                </div>
                <button
                  (click)="openModal('askQuestion')"
                  class="bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold text-xs px-4 py-2.5 rounded-[10px] flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto">
                  <span class="material-icons text-sm">help_outline</span>
                  {{ lang.t('askQuestionBtn') }}
                </button>
              </div>

              <div class="space-y-4">
                @for (thread of store.questionThreads(); track thread.id) {
                  <div class="bg-[#F7F9FB] rounded-[20px] p-6 border border-[#E3ECF2] space-y-4">
                    <div class="border-b border-[#E3ECF2] pb-3 space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="bg-[#007CC2]/10 text-[#007CC2] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {{ thread.subject }}
                        </span>
                        <span class="bg-[#E0AA32]/15 text-[#9E6A00] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {{ thread.grade }}
                        </span>
                        <span class="text-[11px] text-[#627D98] font-medium">
                          • {{ thread.parentName }} • {{ thread.createdAt }}
                        </span>
                      </div>
                      <h4 class="font-display font-semibold text-[#102A43] text-base">{{ thread.title }}</h4>
                    </div>

                    <p class="text-xs text-[#334E68] bg-white p-4 rounded-[14px] border border-[#E3ECF2] leading-relaxed">
                      {{ thread.content }}
                    </p>

                    @if (thread.answers.length > 0) {
                      <div class="space-y-2 pt-1">
                        <p class="text-[11px] font-semibold text-[#102A43] flex items-center gap-1">
                          <span class="material-icons text-xs text-[#23845B]">verified</span>
                          {{ lang.tr('Réponses certifiées des enseignants :', 'الإجابات المعتمدة من المعلمين:') }}
                        </p>

                        @for (ans of thread.answers; track ans.id) {
                          <div class="bg-[#E8F6EF] rounded-[14px] p-4 border border-[#23845B]/20 space-y-2 text-xs">
                            <div class="flex items-center justify-between">
                              <div class="flex items-center gap-2">
                                <span class="font-semibold text-[#102A43]">{{ ans.teacherName }}</span>
                                <span class="text-[10px] bg-[#23845B] text-white px-2 py-0.5 rounded-full font-medium">
                                  {{ ans.teacherTitle }}
                                </span>
                              </div>
                              <span class="text-[10px] text-[#627D98]">{{ ans.createdAt }}</span>
                            </div>

                            <p class="text-[#102A43] leading-relaxed">{{ ans.content }}</p>

                            @if (ans.attachedDocTitle) {
                              <div class="inline-flex items-center gap-2 bg-white text-[#007CC2] p-2.5 rounded-[10px] border border-[#007CC2]/30 font-medium text-[11px]">
                                <span class="material-icons text-sm text-[#007CC2]">attach_file</span>
                                <span>{{ lang.t('attachedDocument') }} : <strong class="text-[#102A43]">{{ ans.attachedDocTitle }}</strong></span>
                              </div>
                            }
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="text-xs text-[#627D98] italic">
                        {{ lang.tr('En attente de réponse d’un enseignant référent...', 'في انتظار مراجعة وإجابة الإطار التربوي...') }}
                      </p>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- TAB 4: OFFICIAL ANNOUNCEMENTS -->
          @if (activeTab() === 'announcements') {
            <div class="space-y-4">
              <div>
                <h3 class="font-display font-semibold text-[#102A43] text-base">
                  {{ lang.t('announcementsTitle') }}
                </h3>
                <p class="text-xs text-[#486581]">
                  {{ lang.t('announcementsSub') }}
                </p>
              </div>

              <div class="space-y-4">
                @for (a of store.classAnnouncements(); track a.id) {
                  <div class="bg-[#F7F9FB] rounded-[18px] p-5 border border-[#E3ECF2] space-y-3">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <h4 class="font-semibold text-[#102A43] text-xs">{{ a.title }}</h4>
                        <p class="text-[10px] text-[#627D98]">{{ a.teacherName }} • {{ a.date }}</p>
                      </div>

                      @if (a.isPinned) {
                        <span class="bg-rose-100 text-rose-700 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span class="material-icons text-[12px]">push_pin</span> {{ lang.tr('Examen', 'امتحان') }}
                        </span>
                      }
                    </div>

                    <p class="text-xs text-[#334E68] bg-white p-4 rounded-[12px] border border-[#E3ECF2] leading-relaxed">
                      {{ a.content }}
                    </p>

                    <div class="flex items-center justify-between pt-1">
                      <button
                        (click)="confirmRead(a.id)"
                        [disabled]="confirmedIds().has(a.id)"
                        [class]="confirmedIds().has(a.id)
                          ? 'bg-[#E8F6EF] text-[#23845B] font-semibold'
                          : 'bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold cursor-pointer'"
                        class="text-xs px-3.5 py-1.5 rounded-[8px] flex items-center gap-1.5 transition-colors">
                        <span class="material-icons text-sm">check_circle</span>
                        {{ confirmedIds().has(a.id) ? lang.t('readConfirmed') : lang.t('confirmReadBtn') }}
                      </button>

                      <span class="text-[11px] text-[#627D98]">
                        {{ a.confirmedByParentsCount }} {{ lang.tr('parents ont validé', 'أولياء قاموا بالإعلام') }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

        </div>
      </div>

    </div>

    <!-- MODAL 1: ASK QUESTION MODAL -->
    @if (modalType() === 'askQuestion') {
      <div class="fixed inset-0 z-50 bg-[#0B2947]/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-[24px] max-w-lg w-full p-6 space-y-4 border border-[#E3ECF2] shadow-xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#E3ECF2] pb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-[#007CC2]">help_outline</span>
              <h3 class="font-display font-semibold text-[#102A43] text-base">
                {{ lang.t('askQuestionBtn') }}
              </h3>
            </div>
            <button (click)="closeModal()" class="text-[#627D98] hover:text-[#102A43] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label for="q-title" class="block font-semibold text-[#102A43] mb-1">
                {{ lang.t('questionTitle') }} *
              </label>
              <input
                id="q-title"
                type="text"
                [value]="newQTitle()"
                (input)="newQTitle.set($any($event.target).value)"
                placeholder="Ex: Demande de fiches d'exercices sur les fractions décimales"
                class="w-full bg-[#F7F9FB] border border-[#E3ECF2] rounded-[10px] p-2.5 text-[#102A43] outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="q-subj" class="block font-semibold text-[#102A43] mb-1">
                  {{ lang.tr('Matière', 'المادة') }}
                </label>
                <select
                  id="q-subj"
                  [value]="newQSubject()"
                  (change)="newQSubject.set($any($event.target).value)"
                  class="w-full bg-[#F7F9FB] border border-[#E3ECF2] rounded-[10px] p-2.5 text-[#102A43] outline-none">
                  <option value="Mathématiques">Mathématiques / الرياضيات</option>
                  <option value="Français">Français / الفرنسية</option>
                  <option value="اللغة العربية">اللغة العربية</option>
                  <option value="Éveil Scientifique">Éveil Scientifique / الإيقاظ العلمي</option>
                </select>
              </div>

              <div>
                <label for="q-grade" class="block font-semibold text-[#102A43] mb-1">
                  {{ lang.tr('Niveau', 'المستوى') }}
                </label>
                <select
                  id="q-grade"
                  [value]="newQGrade()"
                  (change)="newQGrade.set($any($event.target).value)"
                  class="w-full bg-[#F7F9FB] border border-[#E3ECF2] rounded-[10px] p-2.5 text-[#102A43] outline-none">
                  <option value="4ème Année">4ème Année / السنة الرابعة</option>
                  <option value="5ème Année">5ème Année / السنة الخامسة</option>
                  <option value="6ème Année">6ème Année / السنة السادسة</option>
                  <option value="1ère Année">1ère Année / السنة الأولى</option>
                  <option value="2ème Année">2ème Année / السنة الثانية</option>
                  <option value="3ème Année">3ème Année / السنة الثالثة</option>
                </select>
              </div>
            </div>

            <div>
              <label for="q-content" class="block font-semibold text-[#102A43] mb-1">
                {{ lang.t('questionContent') }} *
              </label>
              <textarea
                id="q-content"
                [value]="newQContent()"
                (input)="newQContent.set($any($event.target).value)"
                rows="4"
                placeholder="Décrivez votre besoin pour que les enseignants puissent vous orienter ou partager une ressource..."
                class="w-full bg-[#F7F9FB] border border-[#E3ECF2] rounded-[10px] p-2.5 text-[#102A43] outline-none leading-relaxed"></textarea>
            </div>

            <button
              (click)="submitQuestion()"
              class="w-full bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold py-3 rounded-[10px] cursor-pointer shadow-sm">
              {{ lang.t('submitQuestionBtn') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 2: A4 PRINT & PDF BOOK MODAL -->
    @if (printModalCourse(); as c) {
      <div class="fixed inset-0 z-50 bg-[#0B2947]/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-[24px] max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto text-[#102A43]">
          
          <div class="no-print flex items-center justify-between border-b border-[#E3ECF2] pb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-[#007CC2] text-xl">
                {{ c.pdfUrl ? 'menu_book' : 'print' }}
              </span>
              <div>
                <h3 class="font-display font-semibold text-base">
                  {{ c.pdfUrl ? lang.tr('Manuel Scolaire Officiel (CNP)', 'الكتاب المدرسي الرسمي (المركز الوطني البيداغوجي)') : lang.tr('Aperçu A4 Officiel (Ministère de l’Éducation)', 'معاينة وثيقة A4 الرسمية (وزارة التربية)') }}
                </h3>
                <p class="text-xs text-[#627D98]">
                  {{ c.pdfUrl ? lang.tr('Livre complet disponible en téléchargement direct haute qualité ou impression.', 'الكتاب المدرسي متوفر كاملاً للتحميل المباشر والطباعة عالية الدقة.') : lang.tr('Prêt pour impression papier ou export PDF haute fidélité.', 'جاهز للطباعة الورقية أو الحفظ بصيغة PDF.') }}
                </p>
              </div>
            </div>
            <button (click)="printModalCourse.set(null)" class="text-[#627D98] hover:text-[#102A43] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <!-- If Full PDF Book available (e.g. Official CNP Textbooks) -->
          @if (c.pdfUrl) {
            <div class="bg-[#F7F9FB] rounded-2xl p-6 border border-[#E3ECF2] space-y-4 text-center">
              <div class="w-14 h-14 rounded-2xl bg-[#007CC2]/10 text-[#007CC2] flex items-center justify-center mx-auto shadow-inner">
                <span class="material-icons text-3xl">picture_as_pdf</span>
              </div>

              <div>
                <span class="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-[#E0AA32]/15 text-[#9E6A00] mb-2">
                  <span class="material-icons text-xs">verified</span>
                  {{ lang.tr('Édition Officielle du Centre National Pédagogique (CNP)', 'النسخة الرسمية المعتمدة من المركز الوطني البيداغوجي') }}
                </span>
                <h2 class="font-display font-bold text-lg sm:text-xl text-[#102A43]">
                  {{ c.title }}
                </h2>
                <p class="text-xs text-[#486581] max-w-lg mx-auto mt-1 leading-relaxed">
                  {{ c.summary }}
                </p>
              </div>

              <!-- Action Download / Reader Buttons -->
              <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  [href]="c.pdfUrl"
                  target="_blank"
                  rel="noopener"
                  download
                  class="bg-[#23845B] hover:bg-[#1C6949] text-white font-bold px-6 py-3.5 rounded-xl text-sm flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-102">
                  <span class="material-icons text-xl">download</span>
                  <span>{{ lang.tr('Télécharger le Manuel Complet (PDF)', 'تحميل الكتاب المدرسي كاملاً بصيغة PDF') }}</span>
                </a>

                <a
                  [href]="c.pdfUrl"
                  target="_blank"
                  rel="noopener"
                  class="bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold px-5 py-3.5 rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-colors">
                  <span class="material-icons text-base">open_in_new</span>
                  <span>{{ lang.tr('Lire / Feuilleter en ligne', 'قراءة وتصفح الكتاب مباشرة') }}</span>
                </a>
              </div>

              <!-- Quick Info Pill Strip -->
              <div class="grid grid-cols-3 gap-2 pt-3 border-t border-[#E3ECF2] max-w-md mx-auto text-xs text-[#486581]">
                <div class="p-2 rounded-lg bg-white border border-[#E3ECF2]">
                  <p class="text-[10px] text-[#829AB1]">{{ lang.tr('Niveau', 'المستوى') }}</p>
                  <p class="font-bold text-[#102A43]">{{ c.grade }}</p>
                </div>
                <div class="p-2 rounded-lg bg-white border border-[#E3ECF2]">
                  <p class="text-[10px] text-[#829AB1]">{{ lang.tr('Matière', 'المادة') }}</p>
                  <p class="font-bold text-[#102A43]">{{ c.subject }}</p>
                </div>
                <div class="p-2 rounded-lg bg-white border border-[#E3ECF2]">
                  <p class="text-[10px] text-[#829AB1]">{{ lang.tr('Année', 'السنة') }}</p>
                  <p class="font-bold text-[#102A43]">{{ c.schoolYear || '2025-2026' }}</p>
                </div>
              </div>
            </div>
          }

          <!-- Official Document Frame (Print Target) for custom sheets or print preview -->
          @if (!c.pdfUrl || c.content.length > 50) {
            <div id="printable-document" class="print-document bg-white rounded-xl p-8 border-2 border-[#102A43] relative overflow-hidden space-y-4">
              <div class="print-watermark absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 select-none rotate-[-25deg]">
                <span class="text-5xl font-black uppercase text-[#007CC2] tracking-widest text-center">
                  MADRASATI TN <br /> COPIE CERTIFIÉE ENSEIGNANT
                </span>
              </div>

              <!-- Dynamic Ministry Cartouche — only for text docs; scans carry their own header -->
              @if (!c.imageUrls || !c.imageUrls.length) {
                <div class="border-b-2 border-[#102A43] pb-3">
                  <div class="flex items-center justify-between text-xs">
                    <div class="text-left font-bold text-[#102A43] leading-tight">
                      <p>الجمهورية التونسية</p>
                      <p>وزارة التربية والتعليم</p>
                    </div>
                    <div class="text-center font-bold">
                      <p class="font-display text-base text-[#007CC2] font-semibold">{{ c.title }}</p>
                      <p class="text-xs text-[#627D98]">{{ c.grade }} • {{ c.subject }}</p>
                    </div>
                    <div class="text-right text-xs text-[#334E68] leading-tight">
                      <p>{{ c.trimester || 'الثلاثي الأول' }}</p>
                      <p>السنة الدراسية: {{ c.schoolYear || '2025-2026' }}</p>
                    </div>
                  </div>

                  <!-- Student Filling Box -->
                  <div class="mt-3 pt-2 border-t border-dashed border-[#CBD2D9] grid grid-cols-3 gap-2 text-xs font-semibold">
                    <p>الاسم واللقب: ....................................</p>
                    <p>القسم: {{ c.grade }}</p>
                    <p class="text-right font-bold text-[#007CC2]">العدد: .......... / 20</p>
                  </div>
                </div>
              }

              <!-- Scanned document pages (community library) -->
              @if (c.imageUrls && c.imageUrls.length) {
                <div class="space-y-3 py-3 relative z-10">
                  @for (url of c.imageUrls; track url; let i = $index) {
                    <figure class="print-page rounded-lg overflow-hidden border border-[#E3ECF2]">
                      <img [src]="url" [alt]="c.title + ' — page ' + (i + 1)" class="w-full h-auto" />
                    </figure>
                  }
                </div>
              }

              <!-- Course Content -->
              @if (!c.imageUrls || !c.imageUrls.length) {
                <div class="text-xs leading-relaxed whitespace-pre-line py-3 relative z-10 text-[#102A43]">
                  {{ c.content }}
                </div>
              }

              <!-- Footer Attribution -->
              <div class="border-t border-[#E3ECF2] pt-3 text-[10px] text-[#627D98] flex items-center justify-between">
                <span>Attribution Enseignant : {{ c.watermarkText || 'Enseignant Certifié' }}</span>
                <span>Plateforme Nationale Madrasati TN</span>
              </div>
            </div>
          }

          <div class="no-print flex items-center justify-between gap-3 pt-2">
            <button (click)="printModalCourse.set(null)" class="bg-[#F7F9FB] hover:bg-[#E3ECF2] text-[#334E68] font-semibold px-4 py-2.5 rounded-[10px] text-xs cursor-pointer border border-[#E3ECF2]">
              {{ lang.tr('Fermer', 'إغلاق') }}
            </button>

            <button
              (click)="triggerPrintDialog()"
              class="bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold px-6 py-2.5 rounded-[10px] text-xs flex items-center gap-2 cursor-pointer shadow-sm">
              <span class="material-icons text-base">print</span>
              {{ lang.t('printBtn') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 3: ARTICLE DETAIL & COMMENTS -->
    @if (selectedArticleDetail(); as post) {
      <div class="fixed inset-0 z-50 bg-[#0B2947]/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-[24px] max-w-2xl w-full p-6 space-y-4 border border-[#E3ECF2] shadow-xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#E3ECF2] pb-3">
            <div class="flex items-center gap-2">
              <span class="bg-[#23845B]/10 text-[#23845B] text-xs font-bold px-2.5 py-0.5 rounded-full">
                {{ post.subject || 'Pédagogie' }}
              </span>
              <span class="text-xs text-[#627D98]">{{ post.publishedAt }}</span>
            </div>
            <button (click)="selectedArticleDetail.set(null)" class="text-[#627D98] hover:text-[#102A43] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div>
            <h3 class="font-display font-semibold text-[#102A43] text-xl">{{ post.title }}</h3>
            <p class="text-xs text-[#23845B] font-medium mt-1">{{ post.authorName }} — {{ post.authorTitle }}</p>
          </div>

          <div class="prose prose-sm max-w-none text-xs text-[#334E68] leading-relaxed whitespace-pre-line bg-[#F7F9FB] p-5 rounded-[14px] border border-[#E3ECF2]">
            {{ post.content }}
          </div>

          <!-- Comments Section -->
          <div class="space-y-3 pt-2">
            <h4 class="font-display font-semibold text-xs text-[#102A43]">
              {{ lang.t('commentsCount') }} ({{ post.comments.length }})
            </h4>

            <div class="space-y-2">
              @for (comm of post.comments; track comm.id) {
                <div class="bg-[#F7F9FB] p-3 rounded-[10px] text-xs border border-[#E3ECF2]">
                  <div class="flex items-center justify-between">
                    <span class="font-semibold text-[#102A43]">{{ comm.authorName }}</span>
                    <span class="text-[10px] text-[#627D98]">{{ comm.createdAt }}</span>
                  </div>
                  <p class="text-[#334E68] mt-1">{{ comm.content }}</p>
                </div>
              }
            </div>

            <!-- Add Comment Form -->
            <div class="flex items-center gap-2 pt-2">
              <input
                type="text"
                [value]="newCommentText()"
                (input)="newCommentText.set($any($event.target).value)"
                [placeholder]="lang.t('addComment')"
                class="grow bg-[#F7F9FB] border border-[#E3ECF2] rounded-[10px] p-2.5 text-xs text-[#102A43] outline-none" />
              <button
                (click)="submitComment(post.id)"
                class="bg-[#23845B] hover:bg-[#1C6949] text-white font-semibold px-4 py-2.5 rounded-[10px] text-xs cursor-pointer shadow-xs shrink-0">
                {{ lang.t('sendCommentBtn') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ParentHomeComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  readonly firebase = inject(FirebaseService);

  readonly confirmedIds = signal<Set<string>>(new Set(['ann-1']));
  readonly activeTab = signal<'docs' | 'blog' | 'qa' | 'announcements'>('docs');
  readonly modalType = signal<'none' | 'askQuestion'>('none');

  readonly searchDocQuery = signal('');
  readonly selectedGradeFilter = signal<string>('all');
  readonly selectedSubjectFilter = signal<string>('all');

  readonly printModalCourse = signal<Course | null>(null);
  readonly selectedArticleDetail = signal<BlogPost | null>(null);

  readonly gradesList: string[] = ['all', '1ère Année', '2ème Année', '3ème Année', '4ème Année', '5ème Année', '6ème Année'];
  readonly subjectsList: string[] = ['all', 'Mathématiques', 'Français', 'اللغة العربية', 'Éveil Scientifique'];

  // Ask Question Form
  readonly newQTitle = signal('');
  readonly newQSubject = signal<SubjectName>('Mathématiques');
  readonly newQGrade = signal<GradeLevel>('4ème Année');
  readonly newQContent = signal('');

  // Comment Input Form
  readonly newCommentText = signal('');

  // Pagination
  readonly pageSize = signal<number>(9);
  readonly currentPage = signal<number>(1);

  // Parents look for exercises first — split the library from official textbooks.
  readonly docKind = signal<'exercices' | 'books'>('exercices');
  // Topic taxonomy (Book → Chapter → Topic → Exercise): the resource's theme.
  readonly selectedTopicFilter = signal<string>('all');

  private isBook(c: Course): boolean {
    return !!c.pdfUrl;
  }

  readonly exercicesCount = computed(() => this.store.courses().filter((c) => !this.isBook(c)).length);
  readonly booksCount = computed(() => this.store.courses().filter((c) => this.isBook(c)).length);

  // Distinct topics available for the current kind + grade + subject selection.
  readonly availableTopics = computed(() => {
    const grade = this.selectedGradeFilter();
    const subj = this.selectedSubjectFilter();
    const kind = this.docKind();
    const topics = new Set<string>();
    for (const c of this.store.courses()) {
      const matchKind = kind === 'books' ? this.isBook(c) : !this.isBook(c);
      const matchGrade = grade === 'all' || c.grade === grade;
      const matchSubj = subj === 'all' || c.subject === subj;
      if (matchKind && matchGrade && matchSubj && c.theme) topics.add(c.theme);
    }
    return ['all', ...Array.from(topics).sort()];
  });

  readonly filteredCourses = computed(() => {
    const q = this.searchDocQuery().toLowerCase().trim();
    const grade = this.selectedGradeFilter();
    const subj = this.selectedSubjectFilter();
    const kind = this.docKind();
    const topic = this.selectedTopicFilter();

    return this.store.courses().filter((c) => {
      const matchKind = kind === 'books' ? this.isBook(c) : !this.isBook(c);
      const matchQ = !q || c.title.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q)
        || (c.theme?.toLowerCase().includes(q) ?? false);
      const matchGrade = grade === 'all' || c.grade === grade;
      const matchSubj = subj === 'all' || c.subject === subj;
      const matchTopic = topic === 'all' || c.theme === topic;
      return matchKind && matchQ && matchGrade && matchSubj && matchTopic;
    });
  });

  // Reset topic when a broader filter changes, so stale topics don't hide results.
  selectDocKind(kind: 'exercices' | 'books') {
    this.docKind.set(kind);
    this.selectedTopicFilter.set('all');
    this.currentPage.set(1);
  }
  selectGrade(grade: string) {
    this.selectedGradeFilter.set(grade);
    this.selectedTopicFilter.set('all');
    this.currentPage.set(1);
  }
  selectSubject(subj: string) {
    this.selectedSubjectFilter.set(subj);
    this.selectedTopicFilter.set('all');
    this.currentPage.set(1);
  }

  readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredCourses().length / this.pageSize()));
  });

  readonly paginatedCourses = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredCourses().slice(start, start + this.pageSize());
  });

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const maxButtons = 5;

    let start = Math.max(1, current - 2);
    const end = Math.min(total, start + maxButtons - 1);

    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getEndItemIndex(): number {
    return Math.min(this.currentPage() * this.pageSize(), this.filteredCourses().length);
  }

  isUserLoggedIn(): boolean {
    return !!(this.firebase.userProfile() || this.firebase.currentUser());
  }

  parentGreeting(): string {
    const profile = this.firebase.userProfile();
    if (profile?.displayName) {
      return this.lang.tr(`Bonjour, ${profile.displayName}`, `مرحباً، ${profile.displayName}`);
    }
    return this.lang.tr('Espace Parent & Répertoire', 'فضاء الولي وبنك الوثائق');
  }

  openModal(type: 'askQuestion') {
    this.modalType.set(type);
  }

  closeModal() {
    this.modalType.set('none');
  }

  openPrintCourseModal(c: Course) {
    this.printModalCourse.set(c);
  }

  triggerPrintDialog() {
    const course = this.printModalCourse();
    if (typeof window === 'undefined') return;

    if (course?.pdfUrl) {
      window.open(course.pdfUrl, '_blank');
      return;
    }

    if (course?.imageUrls && course.imageUrls.length > 0) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const imagesHtml = course.imageUrls
          .map(
            (url, index) => `
          <div class="print-sheet">
            <img src="${url}" alt="${course.title} — Page ${index + 1}" />
          </div>`
          )
          .join('');

        printWindow.document.write(`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${course.title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      background: #ffffff;
      width: 100%;
      height: auto;
    }
    .print-sheet {
      width: 100%;
      page-break-after: always;
      break-after: page;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    .print-sheet:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    img {
      max-width: 100%;
      max-height: 275mm;
      width: auto;
      height: auto;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  ${imagesHtml}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`);
        printWindow.document.close();
        return;
      }
    }

    window.print();
  }

  copyDocLink(c: Course) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}?doc=${c.id}`);
    }
  }

  confirmRead(id: string) {
    const next = new Set(this.confirmedIds());
    next.add(id);
    this.confirmedIds.set(next);
  }

  submitQuestion() {
    if (!this.newQTitle() || !this.newQContent()) return;
    this.store.addQuestionThread({
      title: this.newQTitle(),
      subject: this.newQSubject(),
      grade: this.newQGrade(),
      content: this.newQContent(),
      parentName: this.firebase.userProfile()?.displayName || 'Parent d’Élève',
    });
    this.closeModal();
    this.newQTitle.set('');
    this.newQContent.set('');
    this.activeTab.set('qa');
  }

  openParentStudio() {
    this.store.setRole('editor');
  }

  submitComment(postId: string) {
    if (!this.newCommentText()) return;
    this.store.addBlogComment(postId, {
      authorName: this.firebase.userProfile()?.displayName || 'Parent d’Élève',
      authorRole: 'parent',
      content: this.newCommentText(),
    });
    this.newCommentText.set('');
  }
}
