import { BlogCardComponent, CartoucheComponent, DocCardComponent, FilterBarComponent, PaginationComponent, QaThreadComponent, TabBarComponent, TabItem, copySharePost, joinDetails } from '@shared';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { EducationStore, LanguageService, FirebaseService, Course, BlogPost, GradeLevel, SubjectName, PrintService, PRIMARY_GRADES, paginate } from '@core';

@Component({
  selector: 'app-parent-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BlogCardComponent, CartoucheComponent, DocCardComponent, FilterBarComponent, PaginationComponent, QaThreadComponent, TabBarComponent],
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

            @if (isUserLoggedIn() && store.activeStudent(); as st) {
              <div class="flex items-center gap-3 pt-1">
                <div class="w-10 h-10 rounded-full bg-[#007CC2] text-white flex items-center justify-center font-bold">
                  {{ st.name.charAt(0) }}
                </div>
                <div>
                  <p class="font-semibold text-sm flex items-center gap-2 text-white">
                    <span>{{ st.name }}</span>
                    <span class="text-[11px] bg-[#E0AA32]/20 text-[#E0AA32] border border-[#E0AA32]/40 px-2 py-0.5 rounded-full font-semibold">
                      {{ st.grade }}
                    </span>
                  </p>
                  <p class="text-xs text-[#8CA9C4]">{{ st.school }}</p>
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
              (click)="router.navigate(['/solve'])"
              class="flex items-center gap-1.5 bg-[#007CC2] hover:bg-[#006EAD] text-white font-bold px-4 py-2.5 rounded-[10px] text-xs transition-colors cursor-pointer shadow-sm">
              <span class="material-icons text-base">photo_camera</span>
              <span>{{ lang.tr('Résoudre un exercice', 'حلّ تمرين بالصورة') }}</span>
            </button>

            <button
              (click)="openParentStudio()"
              class="flex items-center gap-1.5 bg-[#E0AA32] hover:bg-[#D19A24] text-[#0B2947] font-bold px-4 py-2.5 rounded-[10px] text-xs transition-colors cursor-pointer shadow-sm">
              <span class="material-icons text-base">auto_fix_high</span>
              <span>{{ lang.tr('Générer Fiche d’Entraînement', 'توليد ورقة تمارين منزلية') }}</span>
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
        <app-tab-bar
          [tabs]="parentTabs()"
          [(active)]="activeTab"
          accent="blue" />

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
              <app-filter-bar
                [(search)]="searchDocQuery"
                [(selectedGrade)]="selectedGradeFilter"
                [(selectedSubject)]="selectedSubjectFilter"
                [(selectedTopic)]="selectedTopicFilter"
                [grades]="gradesList"
                [subjects]="subjectsList"
                [topics]="availableTopics()"
                (filterChange)="onFilterChange()" />

              <!-- Documents Cards Grid -->
              <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                @for (c of paginatedCourses(); track c.id) {
                  <app-doc-card
                    [course]="c"
                    accent="blue"
                    (print)="openPrintCourseModal($event)"
                    (preview)="openPrintCourseModal($event)"
                    (copyLink)="copyDocLink($event)" />
                }
              </div>

              <!-- Pagination Controls -->
              <app-pagination
                [total]="filteredCourses().length"
                [pageSize]="pageSize()"
                [(page)]="currentPage"
                accent="blue" />
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
                  <app-blog-card
                    [post]="post"
                    accent="blue"
                    [showCover]="false"
                    (open)="store.openBlogPost($event)"
                    (like)="store.likeBlogPost($event)" />
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
                  <app-qa-thread [thread]="thread" accent="blue" />
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
                <app-cartouche tone="blue" [grade]="c.grade" class="pb-3">
                  <div cartoucheCenter>
                    <p class="font-display text-base text-[#007CC2] font-semibold">{{ c.title }}</p>
                    <p class="text-xs text-[#627D98]">{{ c.grade }} • {{ c.subject }}</p>
                  </div>
                  <div cartoucheEnd class="text-xs text-[#334E68]">
                    <p>{{ c.trimester || 'الثلاثي الأول' }}</p>
                    <p>السنة الدراسية: {{ c.schoolYear || '2025-2026' }}</p>
                  </div>
                </app-cartouche>
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
  private readonly print = inject(PrintService);
  readonly firebase = inject(FirebaseService);
  readonly router = inject(Router);

  readonly confirmedIds = signal<Set<string>>(new Set(['ann-1']));
  readonly activeTab = signal<'docs' | 'blog' | 'qa' | 'announcements'>('docs');
  readonly modalType = signal<'none' | 'askQuestion'>('none');

  readonly searchDocQuery = signal('');
  readonly selectedGradeFilter = signal<string>('all');
  readonly selectedSubjectFilter = signal<string>('all');

  readonly printModalCourse = signal<Course | null>(null);
  readonly selectedArticleDetail = signal<BlogPost | null>(null);

  readonly gradesList: string[] = ['all', ...PRIMARY_GRADES];
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

  readonly parentTabs = computed<TabItem<'docs' | 'blog' | 'qa' | 'announcements'>[]>(() => [
    { key: 'docs', label: this.lang.t('tabParentDocs'), icon: 'menu_book', count: this.filteredCourses().length },
    { key: 'blog', label: this.lang.t('tabParentBlog'), icon: 'article', count: this.store.blogPosts().length },
    { key: 'qa', label: this.lang.t('tabParentQA'), icon: 'forum', count: this.store.questionThreads().length },
    { key: 'announcements', label: this.lang.t('tabAnnouncements'), icon: 'campaign', count: this.store.classAnnouncements().length },
  ]);

  onFilterChange() {
    this.currentPage.set(1);
  }

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

  readonly paginatedCourses = computed(() =>
    paginate(this.filteredCourses(), this.currentPage(), this.pageSize())
  );

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
    // Public-first: browsing is free; asking a question is the gated action.
    if (!this.isUserLoggedIn()) {
      this.store.openLoginModal();
      return;
    }
    this.modalType.set(type);
  }

  closeModal() {
    this.modalType.set('none');
  }

  openPrintCourseModal(c: Course) {
    this.printModalCourse.set(c);
  }

  triggerPrintDialog() {
    this.print.printCourse(this.printModalCourse());
  }

  copyDocLink(c: Course) {
    if (typeof window === 'undefined') return;
    void copySharePost(c.title, joinDetails([c.grade, c.subject, c.trimester]), `${window.location.origin}/discovery?doc=${c.id}`);
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
    if (!this.isUserLoggedIn()) {
      this.store.openLoginModal();
      return;
    }
    if (!this.newCommentText()) return;
    this.store.addBlogComment(postId, {
      authorName: this.firebase.userProfile()?.displayName || 'Parent d’Élève',
      authorRole: 'parent',
      content: this.newCommentText(),
    });
    this.newCommentText.set('');
  }
}
