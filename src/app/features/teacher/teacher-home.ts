import { ChangeDetectionStrategy, Component, inject, signal, effect, computed, HostListener } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { EducationStore, LanguageService, FirebaseService, NotificationService, TeacherProfileService, Course, SubjectName, GradeLevel, DocType, Trimester, BlogPost, QuestionThread, PrintService, AiClient, AiJson, PRIMARY_GRADES, buildWatermark, paginate, StorageVaultService } from '@core';
import { TeacherAvatarComponent, BlogCardComponent, CartoucheComponent, DocCardComponent, PaginationComponent, QaThreadComponent, TabBarComponent, TabItem, copySharePost, joinDetails } from '@shared';

@Component({
  selector: 'app-teacher-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TeacherAvatarComponent, BlogCardComponent, CartoucheComponent, DocCardComponent, PaginationComponent, QaThreadComponent, TabBarComponent],
  template: `
    <div class="space-y-6">

      <!-- Guest Mode Banner: teacher space is read-only until login -->
      @if (!isAuthed()) {
        <div class="rounded-[18px] bg-[#F2ECDE] border border-[#F2C14E]/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="material-icons text-[#8A5A00]">lock_person</span>
            <div>
              <p class="text-sm font-bold text-[#14251D]">
                {{ lang.tr('Mode découverte — Espace Enseignant en lecture seule', 'وضع الاستكشاف — فضاء المعلم للقراءة فقط') }}
              </p>
              <p class="text-xs text-[#5B6B60]">
                {{ lang.tr('Connectez-vous pour publier vos fiches, répondre aux parents et gérer votre profil.', 'سجّل الدخول لنشر وثائقك والإجابة على الأولياء وإدارة ملفك.') }}
              </p>
            </div>
          </div>
          <button
            (click)="store.openLoginModal()"
            class="bg-[#14251D] hover:bg-[#14251D] text-[#FBF8F1] font-bold px-5 py-2.5 rounded-[10px] text-xs cursor-pointer shadow-sm shrink-0">
            {{ lang.tr('Se connecter / Créer un compte', 'تسجيل الدخول / إنشاء حساب') }}
          </button>
        </div>
      }

      <!-- Welcome Header: Institutional Hero -->
      <div class="rounded-[24px] bg-[#14251D] text-[#FBF8F1] p-6 sm:p-8 shadow-sm">
        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10">
          <div class="space-y-3 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1.5 text-[#9DBBA8] text-xs font-medium">
                <span class="material-icons text-sm text-[#F2C14E]">verified</span>
                {{ isFemale()
                  ? lang.tr('Enseignante Certifiée — Éducation Nationale', 'معلمة معتمدة — وزارة التربية والتعليم')
                  : lang.tr('Enseignant Certifié — Éducation Nationale', 'معلم معتمد — وزارة التربية والتعليم') }}
              </span>

              @if (firebase.userProfile()?.title || editTitle()) {
                <span class="bg-[#F2C14E]/15 text-[#F2C14E] text-xs px-2.5 py-0.5 rounded-full font-semibold border border-[#F2C14E]/30">
                  {{ firebase.userProfile()?.title || editTitle() }}
                </span>
              }

              @if (firebase.userProfile()?.speciality || editSpeciality()) {
                <span class="bg-[#2D6A4F]/20 text-[#9DBBA8] text-xs px-2.5 py-0.5 rounded-full font-medium border border-[#2D6A4F]/40">
                  {{ firebase.userProfile()?.speciality || editSpeciality() }}
                </span>
              }

              <button
                (click)="openProfileModal()"
                class="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-[#FBF8F1] border border-white/15 text-xs px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ml-auto">
                <span class="material-icons text-sm text-[#F2C14E]">badge</span>
                <span>{{ lang.tr('Mon Profil Public (4.9/5)', 'ملفي المهني (4.9/5)') }}</span>
              </button>
            </div>

            <div>
              <h1 class="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#FBF8F1]">
                {{ teacherGreeting() }}
              </h1>
              <p class="text-[#B7C7BC] text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                {{ teacherHeaderSub() }}
                @if (teacherPlace(); as place) {
                  — <span class="font-semibold text-[#FBF8F1] underline decoration-[#F2C14E] underline-offset-4">{{ place }}</span>
                }
              </p>
            </div>
          </div>

          <!-- Primary actions -->
          <div class="flex flex-wrap items-center gap-2.5 lg:shrink-0">
            <button
              (click)="openModal('course')"
              class="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-bold px-5 py-3 rounded-[10px] text-sm transition-colors cursor-pointer shadow-sm">
              <span class="material-icons text-lg">cloud_upload</span>
              {{ lang.t('addCourseBtn') }}
            </button>
          </div>
        </div>

      </div>

      <!-- Metric Cards & Quick Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-[18px] border border-[#E7DFCF] shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col">
          <div class="h-1.5 bg-[#2D6A4F]"></div>
          <div class="p-5 flex flex-col justify-between grow">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-[#14251D]">{{ lang.tr('Fiches & Docs A4', 'الوثائق والامتحانات A4') }}</span>
              <div class="w-8 h-8 rounded-lg bg-[#F2ECDE] text-[#2D6A4F] flex items-center justify-center">
                <span class="material-icons text-lg">menu_book</span>
              </div>
            </div>
            <div>
              <p class="font-display text-3xl font-semibold text-[#14251D] tracking-tight">{{ filteredCourses().length }}</p>
              <p class="text-[11px] text-[#5B6B60] font-medium mt-1 flex items-center gap-1">
                <span class="material-icons text-xs text-[#2D6A4F]">print</span>
                {{ lang.tr('Prêts à imprimer', 'جاهزة للطباعة والتحميل') }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-[18px] border border-[#E7DFCF] shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col">
          <div class="h-1.5 bg-[#2D6A4F]"></div>
          <div class="p-5 flex flex-col justify-between grow">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-[#14251D]">{{ lang.tr('Articles Pédagogiques', 'المقالات البيداغوجية') }}</span>
              <div class="w-8 h-8 rounded-lg bg-[#F2ECDE] text-[#2D6A4F] flex items-center justify-center">
                <span class="material-icons text-lg">article</span>
              </div>
            </div>
            <div>
              <p class="font-display text-3xl font-semibold text-[#14251D] tracking-tight">{{ filteredBlogPosts().length }}</p>
              <p class="text-[11px] text-[#5B6B60] font-medium mt-1 flex items-center gap-1">
                <span class="material-icons text-xs text-[#2D6A4F]">groups</span>
                {{ lang.tr('Conseils publiés', 'نصائح منشورة للأولياء') }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-[18px] border border-[#E7DFCF] shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col">
          <div class="h-1.5 bg-[#D9A93C]"></div>
          <div class="p-5 flex flex-col justify-between grow">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-[#14251D]">{{ lang.tr('Questions Parents', 'أسئلة واستفسارات الأولياء') }}</span>
              <div class="w-8 h-8 rounded-lg bg-[#F2ECDE] text-[#D9A93C] flex items-center justify-center">
                <span class="material-icons text-lg">forum</span>
              </div>
            </div>
            <div>
              <p class="font-display text-3xl font-semibold text-[#14251D] tracking-tight">{{ store.questionThreads().length }}</p>
              <p class="text-[11px] text-[#5B6B60] font-medium mt-1 flex items-center gap-1">
                <span class="material-icons text-xs text-[#D9A93C]">mark_chat_read</span>
                {{ lang.tr('Demandes de fiches & soutien', 'طلبات مراجعة ووثائق') }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-[18px] border border-[#E7DFCF] shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col">
          <div class="h-1.5 bg-[#C1121F]"></div>
          <div class="p-5 flex flex-col justify-between grow">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-[#14251D]">{{ lang.t('statConfirmations') }}</span>
              <div class="w-8 h-8 rounded-lg bg-[#F2ECDE] text-[#C1121F] flex items-center justify-center">
                <span class="material-icons text-lg">verified_user</span>
              </div>
            </div>
            <div>
              <p class="font-display text-3xl font-semibold text-[#14251D] tracking-tight">86%</p>
              <p class="text-[11px] text-[#5B6B60] font-medium mt-1 flex items-center gap-1">
                <span class="material-icons text-xs text-[#C1121F]">check_circle</span>
                {{ lang.tr("Accusés de réception", 'نسبة اطلاع الأولياء') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Hub Tabs -->
      <div class="bg-white rounded-[24px] border border-[#E7DFCF] overflow-hidden shadow-xs">

        <!-- Tab Bar Header with Scope Filter Toggle -->
        <app-tab-bar
          [tabs]="teacherTabs()"
          [(active)]="activeTab"
          accent="green">
          <!-- Scope Filter: Mes Documents vs Toute la Banque CNP -->
          <div tabEnd class="mb-2 bg-[#E7DFCF]/80 p-1 rounded-xl flex items-center gap-1">
            <button
              type="button"
              (click)="docScopeFilter.set('mine')"
              [class]="docScopeFilter() === 'mine' ? 'bg-[#2D6A4F] text-[#FBF8F1] font-bold shadow-xs' : 'text-[#5B6B60] hover:text-[#14251D] font-medium'"
              class="px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all flex items-center gap-1.5">
              <span class="material-icons text-xs">folder_shared</span>
              <span>{{ lang.tr('Mes fiches uniquement', 'منشوراتي فقط') }}</span>
            </button>
            <button
              type="button"
              (click)="docScopeFilter.set('all')"
              [class]="docScopeFilter() === 'all' ? 'bg-[#2D6A4F] text-[#FBF8F1] font-bold shadow-xs' : 'text-[#5B6B60] hover:text-[#14251D] font-medium'"
              class="px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all flex items-center gap-1.5">
              <span class="material-icons text-xs">library_books</span>
              <span>{{ lang.tr('Toute la banque CNP', 'جميع وثائق CNP') }}</span>
            </button>
          </div>
        </app-tab-bar>

        <!-- Tab Body -->
        <div class="p-6">
          
          <!-- TAB 1: COURSES & A4 PRINTABLE DOCS -->
          @if (activeTab() === 'courses') {
            <div class="space-y-5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 class="font-display font-semibold text-[#14251D] text-base">
                    {{ lang.t('tabTeacherDocs') }}
                  </h3>
                  <p class="text-xs text-[#5B6B60]">
                    {{ lang.tr("Publiez des fiches conformes avec filigrane officiel et impression A4 en 1-clic.", 'نشر وثائق وامتحانات مطابقة للبرنامج مع فيليغران رسمي وطباعة A4 فورية.') }}
                  </p>
                </div>
                <button
                  (click)="openModal('course')"
                  class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-xs px-4 py-2.5 rounded-[10px] flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto">
                  <span class="material-icons text-sm">add</span> {{ lang.t('addCourseBtn') }}
                </button>
              </div>

              <div class="grid md:grid-cols-2 gap-4">
                @for (c of paginatedCourses(); track c.id) {
                  <app-doc-card
                    [course]="c"
                    accent="green"
                    (print)="openPrintCourseModal($event)"
                    (preview)="openPrintCourseModal($event)"
                    (copyLink)="copyDocLink($event)" />
                }
              </div>

              <!-- Pagination Controls -->
              <app-pagination
                [total]="filteredCourses().length"
                [pageSize]="coursesPageSize()"
                [(page)]="coursesPage"
                accent="green" />
            </div>
          }

          <!-- TAB 2: PEDAGOGICAL BLOG (WRITING & ARTICLES) -->
          @if (activeTab() === 'blog') {
            <div class="space-y-5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 class="font-display font-semibold text-[#14251D] text-base">
                    {{ lang.t('tabTeacherBlog') }}
                  </h3>
                  <p class="text-xs text-[#5B6B60]">
                    {{ lang.tr("Partagez vos méthodes d'enseignement, conseils de révision et réflexions avec la communauté des parents.", 'شارك طرائق التدريس، نصائح المراجعة والتوجيهات البيداغوجية مع مجتمع الأولياء.') }}
                  </p>
                </div>
                <button
                  (click)="openArticleStudio()"
                  class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-xs px-4 py-2.5 rounded-[10px] flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto">
                  <span class="material-icons text-sm">edit_note</span> {{ lang.t('writeArticleBtn') }}
                </button>
              </div>

              <div class="grid md:grid-cols-2 gap-5">
                @for (post of filteredBlogPosts(); track post.id) {
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

          <!-- TAB 3: PARENT Q&A INBOX -->
          @if (activeTab() === 'qa') {
            <div class="space-y-5">
              <div>
                <h3 class="font-display font-semibold text-[#14251D] text-base">
                  {{ lang.t('tabTeacherQA') }}
                </h3>
                <p class="text-xs text-[#5B6B60]">
                  {{ lang.tr("Consultez les demandes de soutien et questions des parents, et répondez-y en joignant des fiches d'exercices adaptées.", 'تصفح استفسارات الأولياء وطلبات الدعم مع إمكانية إرفاق وثيقة مراجعة جاهزة للطباعة.') }}
                </p>
              </div>

              <div class="space-y-4">
                @for (thread of store.questionThreads(); track thread.id) {
                  <app-qa-thread
                    [thread]="thread"
                    accent="green"
                    [canReply]="true"
                    (reply)="replyingThread.set($event)" />
                }
              </div>
            </div>
          }

          <!-- TAB 4: OFFICIAL ANNOUNCEMENTS -->
        </div>
      </div>

    </div>

    <!-- FULL PAGE WORKSPACE: CREATE & PUBLISH COURSE / A4 DOCUMENT -->
    @if (modalType() === 'course') {
      <div class="fixed inset-0 z-50 bg-[#F4F6F4] flex flex-col overflow-hidden animate-in fade-in duration-300">
        
        <!-- Top Sticky App Bar -->
        <header class="bg-[#14251D] text-[#FBF8F1] border-b border-[#2D6A4F]/40 h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 shadow-md">
          <div class="flex items-center gap-3">
            <button
              (click)="closeModal()"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#FBF8F1] text-xs font-semibold cursor-pointer transition-colors">
              <span class="material-icons text-base rtl:rotate-180">arrow_back</span>
              <span>{{ lang.tr('Retour au tableau de bord', 'العودة إلى فضاء المعلم') }}</span>
            </button>
            <div class="h-5 w-px bg-white/20 hidden sm:block"></div>
            <div class="flex items-center gap-2">
              <span class="material-icons text-[#F2C14E] text-lg">post_add</span>
              <h2 class="font-display font-semibold text-sm sm:text-base text-[#FBF8F1] truncate">
                {{ lang.tr('Studio de Publication & Certification A4', 'استوديو النشر وتوثيق الوثائق الرسمية A4') }}
              </h2>
            </div>
          </div>

          <div class="flex items-center gap-2 sm:gap-3">
            <button
              (click)="closeModal()"
              class="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#B7C7BC] hover:text-[#FBF8F1] hover:bg-white/10 transition-colors cursor-pointer hidden sm:block">
              {{ lang.tr('Annuler', 'إلغاء') }}
            </button>

            <button
              (click)="submitCourse()"
              class="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-bold px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm cursor-pointer shadow-sm transition-all">
              <span class="material-icons text-base sm:text-lg">verified_user</span>
              <span>{{ lang.tr('Publier le Document A4 Certifié', 'نشر وتوثيق الوثيقة الرسمية') }}</span>
            </button>
          </div>
        </header>

        <!-- Main Workspace Body (Two Columns) -->
        <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <!-- Left Column: Settings, Metadata & Upload (5 Cols) -->
            <div class="lg:col-span-5 space-y-5">
              
              <!-- 1. AI OCR & VPS Upload Card -->
              <div class="bg-white rounded-[22px] border border-[#E7DFCF] p-5 shadow-xs space-y-3">
                <div class="flex items-center justify-between pb-2 border-b border-[#E7DFCF]">
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-[#2D6A4F] text-lg">document_scanner</span>
                    <h3 class="font-display font-semibold text-[#14251D] text-sm">
                      {{ lang.tr('Numérisation & OCR Multimodal', 'المسح الضوئي والفرز الذكي') }}
                    </h3>
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F]">
                    Gemini 2.5
                  </span>
                </div>

                <div class="border-2 border-dashed border-[#2D6A4F]/30 hover:border-[#2D6A4F] rounded-[18px] p-5 text-center bg-[#FBF8F1] transition-colors">
                  <label for="fullpage-file-upload" class="cursor-pointer block">
                    <div class="w-12 h-12 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center mx-auto mb-2.5">
                      <span class="material-icons text-2xl">cloud_upload</span>
                    </div>
                    <h4 class="text-xs font-bold text-[#14251D]">
                      {{ lang.tr("Téléversez un examen, PDF ou photo d'exercice", 'ارفع امتحاناً، صورة تمرين أو ملف PDF') }}
                    </h4>
                    <p class="text-[11px] text-[#5B6B60] mt-1 max-w-xs mx-auto leading-relaxed">
                      {{ isAiScanning() ? lang.tr('Analyse OCR & classification par IA en cours...', 'جاري الفرز والتحليل الذكي بواسطة الذكاء الاصطناعي...') : (isUploading() ? lang.tr('Envoi vers le VPS...', 'جاري الرفع إلى الخادم...') : lang.tr("L'IA extrait le texte, classifie la matière/niveau et applique votre filigrane officiel", 'يقوم الذكاء الاصطناعي باستخراج النص وتصنيف المادة وتطبيق علامتك المائية')) }}
                    </p>
                    <input
                      id="fullpage-file-upload"
                      type="file"
                      (change)="handleCourseFileUpload($event)"
                      class="hidden"
                      accept="application/pdf,image/*" />
                  </label>

                  @if (isAiScanning()) {
                    <div class="flex items-center justify-center gap-2 text-xs text-[#2D6A4F] font-semibold pt-3 animate-pulse">
                      <span class="material-icons animate-spin text-sm">sync</span>
                      <span>{{ lang.tr('OCR & Classification intelligente...', 'معالجة ضوئية وفهرسة...') }}</span>
                    </div>
                  }

                  @if (aiDetectedBadge()) {
                    <div class="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2D6A4F]/15 text-[#2D6A4F] text-xs font-bold border border-[#2D6A4F]/30">
                      <span class="material-icons text-xs">auto_awesome</span>
                      <span>{{ aiDetectedBadge() }}</span>
                    </div>
                  }

                  @if (uploadedFileName()) {
                    <div class="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#E8F5FC] text-[#007CC2] text-xs font-semibold">
                      <span class="material-icons text-xs">description</span>
                      <span class="truncate max-w-[200px]">{{ uploadedFileName() }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- 2. Classification & Details Card -->
              <div class="bg-white rounded-[22px] border border-[#E7DFCF] p-5 shadow-xs space-y-4 text-xs">
                <div class="flex items-center gap-2 pb-2 border-b border-[#E7DFCF]">
                  <span class="material-icons text-[#2D6A4F] text-lg">tune</span>
                  <h3 class="font-display font-semibold text-[#14251D] text-sm">
                    {{ lang.tr('Informations & Classification Pédagogique', 'بيانات وتصنيف الوثيقة') }}
                  </h3>
                </div>

                <div>
                  <label for="course-title-full" class="block font-semibold text-[#14251D] mb-1">
                    {{ lang.tr('Titre officiel du document', 'العنوان الرسمي للوثيقة') }} *
                  </label>
                  <input
                    id="course-title-full"
                    type="text"
                    [value]="newCourseTitle()"
                    (input)="newCourseTitle.set($any($event.target).value)"
                    placeholder="Ex: Devoir de Contrôle N°1 : Mathématiques et Géométrie"
                    class="w-full bg-[#FBF8F1] border border-[#E7DFCF] focus:border-[#2D6A4F] focus:bg-white rounded-xl p-3 text-[#14251D] outline-none font-semibold transition-colors" />
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label for="course-subj-full" class="block font-semibold text-[#14251D] mb-1">
                      {{ lang.tr('Matière', 'المادة') }} *
                    </label>
                    <select
                      id="course-subj-full"
                      [value]="newCourseSubject()"
                      (change)="newCourseSubject.set($any($event.target).value)"
                      class="w-full bg-[#FBF8F1] border border-[#E7DFCF] focus:border-[#2D6A4F] rounded-xl p-2.5 text-[#14251D] outline-none">
                      <option value="Mathématiques">Mathématiques / الرياضيات</option>
                      <option value="Français">Français / الفرنسية</option>
                      <option value="اللغة العربية">اللغة العربية</option>
                      <option value="Éveil Scientifique">Éveil Scientifique / الإيقاظ</option>
                      <option value="Histoire & Géographie">Histoire & Géo / التاريخ والجغرافيا</option>
                      <option value="Anglais">Anglais / الإنجليزية</option>
                    </select>
                  </div>

                  <div>
                    <label for="course-grade-full" class="block font-semibold text-[#14251D] mb-1">
                      {{ lang.tr('Niveau', 'المستوى') }} *
                    </label>
                    <select
                      id="course-grade-full"
                      [value]="newCourseGrade()"
                      (change)="newCourseGrade.set($any($event.target).value)"
                      class="w-full bg-[#FBF8F1] border border-[#E7DFCF] focus:border-[#2D6A4F] rounded-xl p-2.5 text-[#14251D] outline-none">
                      <option value="1ère Année">1ère Année / السنة الأولى</option>
                      <option value="2ème Année">2ème Année / السنة الثانية</option>
                      <option value="3ème Année">3ème Année / السنة الثالثة</option>
                      <option value="4ème Année">4ème Année / السنة الرابعة</option>
                      <option value="5ème Année">5ème Année / السنة الخامسة</option>
                      <option value="6ème Année">6ème Année / السنة السادسة</option>
                    </select>
                  </div>

                  <div>
                    <label for="course-trim-full" class="block font-semibold text-[#14251D] mb-1">
                      {{ lang.tr('Trimestre', 'الثلاثي') }} *
                    </label>
                    <select
                      id="course-trim-full"
                      [value]="newCourseTrimester()"
                      (change)="newCourseTrimester.set($any($event.target).value)"
                      class="w-full bg-[#FBF8F1] border border-[#E7DFCF] focus:border-[#2D6A4F] rounded-xl p-2.5 text-[#14251D] outline-none">
                      <option value="Trimestre 1">Trimestre 1 / الثلاثي الأول</option>
                      <option value="Trimestre 2">Trimestre 2 / الثلاثي الثاني</option>
                      <option value="Trimestre 3">Trimestre 3 / الثلاثي الثالث</option>
                    </select>
                  </div>

                  <div>
                    <label for="course-doctype-full" class="block font-semibold text-[#14251D] mb-1">
                      {{ lang.tr('Type', 'النوع') }} *
                    </label>
                    <select
                      id="course-doctype-full"
                      [value]="newCourseDocType()"
                      (change)="newCourseDocType.set($any($event.target).value)"
                      class="w-full bg-[#FBF8F1] border border-[#E7DFCF] focus:border-[#2D6A4F] rounded-xl p-2.5 text-[#14251D] outline-none">
                      <option value="Devoir de Contrôle">Devoir de Contrôle / مراقبة</option>
                      <option value="Devoir de Synthèse">Devoir de Synthèse / تأليفي</option>
                      <option value="Fiche de Révision">Fiche de Révision / تقييم</option>
                      <option value="Série d'Exercices">Série d'Exercices / تمارين</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label for="course-summary-full" class="block font-semibold text-[#14251D] mb-1">
                    {{ lang.tr('Résumé pédagogique', 'ملخص تربوي موجز') }}
                  </label>
                  <input
                    id="course-summary-full"
                    type="text"
                    [value]="newCourseSummary()"
                    (input)="newCourseSummary.set($any($event.target).value)"
                    placeholder="Ex: Fiche d'exercices et problèmes d'évaluation pour le 1er trimestre."
                    class="w-full bg-[#FBF8F1] border border-[#E7DFCF] focus:border-[#2D6A4F] rounded-xl p-3 text-[#14251D] outline-none transition-colors" />
                </div>
              </div>

              <!-- 3. Certified Watermark Badge Card -->
              <div class="bg-white rounded-[22px] border border-[#E7DFCF] p-4 shadow-xs flex items-center justify-between gap-3 text-xs">
                <div class="flex items-center gap-2.5">
                  <div class="w-10 h-10 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">
                    <span class="material-icons text-xl">verified</span>
                  </div>
                  <div>
                    <p class="font-bold text-[#14251D] text-sm">
                      {{ getTeacherName() }}
                    </p>
                    <p class="text-[11px] text-[#5B6B60]">
                      {{ getTeacherSchool() }}
                    </p>
                    <p class="text-[10px] text-[#2D6A4F] font-semibold mt-0.5">
                      {{ lang.tr('Filigrane officiel et attribution automatique', 'العلامة المائية الرسمية وحقوق التأليف مفعلة') }}
                    </p>
                  </div>
                </div>
                <span class="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[#2D6A4F] text-[#FBF8F1] shrink-0">
                  A4 Impress 🇹🇳
                </span>
              </div>
            </div>

            <!-- Right Column: Live A4 Printable Editor & Preview (7 Cols) -->
            <div class="lg:col-span-7 bg-white rounded-[22px] border border-[#E7DFCF] p-5 sm:p-6 shadow-xs space-y-4">
              
              <!-- Tab Bar (Edit Markdown vs A4 Print Preview) -->
              <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-3">
                <div class="flex items-center gap-2">
                  <button
                    (click)="publishDocTab.set('edit')"
                    [class]="publishDocTab() === 'edit'
                      ? 'bg-[#2D6A4F] text-[#FBF8F1]'
                      : 'bg-[#FBF8F1] text-[#5B6B60] hover:text-[#14251D]'"
                    class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors">
                    <span class="material-icons text-sm">edit_note</span>
                    <span>{{ lang.tr('Éditeur de Contenu', 'تحرير محتوى الوثيقة') }}</span>
                  </button>

                  <button
                    (click)="publishDocTab.set('preview')"
                    [class]="publishDocTab() === 'preview'
                      ? 'bg-[#2D6A4F] text-[#FBF8F1]'
                      : 'bg-[#FBF8F1] text-[#5B6B60] hover:text-[#14251D]'"
                    class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors">
                    <span class="material-icons text-sm">print</span>
                    <span>{{ lang.tr('Aperçu A4 Imprimable', 'معاينة ورقة A4 للطباعة') }}</span>
                  </button>
                </div>

                <span class="text-[11px] text-[#5B6B60] hidden sm:inline">
                  {{ lang.tr('Format Markdown supporté', 'يدعم التنسيق والرموز الرياضية') }}
                </span>
              </div>

              <!-- VIEW 1: MARKDOWN TEXTAREA EDITOR -->
              @if (publishDocTab() === 'edit') {
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-xs text-[#5B6B60]">
                    <span>{{ lang.tr('Contenu transcrit ou rédigé', 'نص الامتحان أو التمارين') }}</span>
                    <span>{{ newCourseContent().length }} {{ lang.tr('caractères', 'حرف') }}</span>
                  </div>

                  <textarea
                    id="course-content-full"
                    [value]="newCourseContent()"
                    (input)="newCourseContent.set($any($event.target).value)"
                    rows="16"
                    placeholder="Rédigez ou collez le sujet ici... L'IA peut aussi transcrire automatiquement votre devoir scanné."
                    class="w-full bg-[#FBF8F1] border border-[#E7DFCF] focus:border-[#2D6A4F] focus:bg-white rounded-2xl p-4 text-[#14251D] outline-none font-mono text-xs leading-relaxed transition-colors"></textarea>

                  <div class="bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-3 text-[11px] text-[#5B6B60] flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="material-icons text-sm text-[#2D6A4F]">lightbulb</span>
                      <span>{{ lang.tr("Astuce : Utilisez les tirets (-) pour les questions et (##) pour les parties d'examen.", 'نصيحة: استخدم (-) لتعداد الأسئلة و (##) لتقسيم التمارين.') }}</span>
                    </div>
                    <button
                      (click)="publishDocTab.set('preview')"
                      class="text-[#2D6A4F] font-bold hover:underline cursor-pointer">
                      {{ lang.tr('Voir le rendu A4 →', 'معاينة النتيجة →') }}
                    </button>
                  </div>
                </div>
              }

              <!-- VIEW 2: REAL A4 SHEET LIVE PREVIEW -->
              @if (publishDocTab() === 'preview') {
                <div class="bg-[#E7DFCF]/40 p-4 sm:p-6 rounded-2xl overflow-x-auto flex justify-center">
                  <div class="bg-white w-full max-w-[595px] min-h-[700px] p-6 sm:p-8 rounded-sm shadow-md border border-[#D5CBB9] relative flex flex-col justify-between text-ink select-none">
                    
                    <!-- Top Official Ministry Header -->
                    <div>
                      <div class="border-b-2 border-black pb-2 mb-4 text-center">
                        <div class="flex items-center justify-between text-[10px] font-bold text-gray-700">
                          <span>الجمهورية التونسية<br/>وزارة التربية</span>
                          <span class="font-display font-semibold text-xs text-black">{{ getTeacherSchool() }}</span>
                          <span>السنة الدراسية<br/>2025 / 2026</span>
                        </div>
                      </div>

                      <!-- Student Info Block -->
                      <div class="grid grid-cols-3 gap-2 border border-black p-2 mb-4 text-[11px]">
                        <div>الاسم واللقب: ....................</div>
                        <div>القسم: {{ newCourseGrade() }}</div>
                        <div>العدد: ..... / 20</div>
                      </div>

                      <!-- Document Title Block -->
                      <div class="text-center my-3 pb-2 border-b border-gray-300">
                        <h4 class="font-display font-bold text-base sm:text-lg text-black">
                          {{ newCourseTitle() || lang.tr('Titre du Devoir / Examen', 'عنوان الامتحان أو الوثيقة') }}
                        </h4>
                        <div class="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-600 mt-1">
                          <span>{{ newCourseSubject() }}</span>
                          <span>•</span>
                          <span>{{ newCourseTrimester() }}</span>
                          <span>•</span>
                          <span>{{ newCourseDocType() }}</span>
                        </div>
                      </div>

                      <!-- Document Printable Content -->
                      <div class="text-xs leading-relaxed text-gray-800 whitespace-pre-wrap font-sans my-4 min-h-[220px]">
                        {{ newCourseContent() || lang.tr('Aucun contenu saisi pour le moment. Vous pouvez rédiger ou numériser une feuille pour voir la mise en page ici.', 'لم يتم إدخال نص بعد. يمكنك كتابة التمارين في خانة التحرير أو رفع وثيقة لملئها آلياً.') }}
                      </div>
                    </div>

                    <!-- Watermark Stamp & Teacher Signature Block -->
                    <div class="pt-4 border-t border-gray-300 flex items-center justify-between text-[10px] text-gray-600">
                      <div>
                        <span>إعداد الأستاذ(ة): </span>
                        <span class="font-bold text-black">{{ getTeacherName() }}</span>
                      </div>
                      <div class="font-mono text-[9px] text-gray-400">
                        MADRASATI TN • FILIGRANE OFFICIEL
                      </div>
                    </div>

                  </div>
                </div>
              }

            </div>
          </div>
        </main>
      </div>
    }

    <!-- MODAL 3: COMPOSE BLOG ARTICLE -->
    @if (modalType() === 'blogArticle') {
      <div class="fixed inset-0 z-50 bg-[#14251D]/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-[24px] max-w-lg w-full p-6 space-y-4 border border-[#E7DFCF] shadow-xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-[#2D6A4F]">edit_note</span>
              <h3 class="font-display font-semibold text-[#14251D] text-base">
                {{ lang.t('writeArticleBtn') }}
              </h3>
            </div>
            <button (click)="closeModal()" class="text-[#5B6B60] hover:text-[#14251D] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label for="article-title" class="block font-semibold text-[#14251D] mb-1">
                {{ lang.t('articleTitle') }} *
              </label>
              <input
                id="article-title"
                type="text"
                [value]="newArticleTitle()"
                (input)="newArticleTitle.set($any($event.target).value)"
                placeholder="Ex: 5 conseils pour maîtriser la division euclidienne"
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-[10px] p-2.5 text-[#14251D] outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="article-subj" class="block font-semibold text-[#14251D] mb-1">
                  {{ lang.t('articleCategory') }}
                </label>
                <select
                  id="article-subj"
                  [value]="newArticleSubject()"
                  (change)="newArticleSubject.set($any($event.target).value)"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-[10px] p-2.5 text-[#14251D] outline-none">
                  <option value="Mathématiques">Mathématiques / الرياضيات</option>
                  <option value="Français">Français / الفرنسية</option>
                  <option value="اللغة العربية">اللغة العربية</option>
                  <option value="Éveil Scientifique">Éveil Scientifique / الإيقاظ العلمي</option>
                </select>
              </div>

              <div>
                <label for="article-grade" class="block font-semibold text-[#14251D] mb-1">
                  {{ lang.tr('Niveau ciblé', 'المستوى المستهدف') }}
                </label>
                <select
                  id="article-grade"
                  [value]="newArticleGrade()"
                  (change)="newArticleGrade.set($any($event.target).value)"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-[10px] p-2.5 text-[#14251D] outline-none">
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
              <label for="article-excerpt" class="block font-semibold text-[#14251D] mb-1">
                {{ lang.tr("Résumé introductif (visible dans l'aperçu)", 'مقدمة المقال') }}
              </label>
              <input
                id="article-excerpt"
                type="text"
                [value]="newArticleExcerpt()"
                (input)="newArticleExcerpt.set($any($event.target).value)"
                placeholder="Ex: Une méthode simple en 3 étapes pour aider votre enfant à la maison..."
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-[10px] p-2.5 text-[#14251D] outline-none" />
            </div>

            <div>
              <label for="article-content" class="block font-semibold text-[#14251D] mb-1">
                {{ lang.t('articleContent') }} *
              </label>
              <textarea
                id="article-content"
                [value]="newArticleContent()"
                (input)="newArticleContent.set($any($event.target).value)"
                rows="6"
                placeholder="Rédigez vos explications et conseils pédagogiques détaillés..."
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-[10px] p-2.5 text-[#14251D] outline-none leading-relaxed"></textarea>
            </div>

            <div>
              <label for="article-tags" class="block font-semibold text-[#14251D] mb-1">
                {{ lang.tr('Mots-clés (séparés par des virgules)', 'الكلمات المفتاحية (مفصولة بفاصلة)') }}
              </label>
              <input
                id="article-tags"
                type="text"
                [value]="newArticleTags()"
                (input)="newArticleTags.set($any($event.target).value)"
                placeholder="Ex: Révision, Mathématiques, Astuces"
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-[10px] p-2.5 text-[#14251D] outline-none" />
            </div>

            <button
              (click)="submitBlogArticle()"
              class="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold py-3 rounded-[10px] cursor-pointer shadow-sm">
              {{ lang.t('publishArticleBtn') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 4: REPLY TO PARENT QUESTION -->
    @if (replyingThread(); as thread) {
      <div class="fixed inset-0 z-50 bg-[#14251D]/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-[24px] max-w-lg w-full p-6 space-y-4 border border-[#E7DFCF] shadow-xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-[#2D6A4F]">reply</span>
              <h3 class="font-display font-semibold text-[#14251D] text-base">
                {{ lang.t('replyToQuestionBtn') }}
              </h3>
            </div>
            <button (click)="replyingThread.set(null)" class="text-[#5B6B60] hover:text-[#14251D] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="bg-[#FBF8F1] p-3.5 rounded-[12px] border border-[#E7DFCF] text-xs">
            <p class="font-semibold text-[#14251D]">{{ thread.title }}</p>
            <p class="text-[#5B6B60] mt-1">{{ thread.content }}</p>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label for="reply-content" class="block font-semibold text-[#14251D] mb-1">
                {{ lang.tr('Votre réponse pédagogique', 'إجابتك وتوجيهك التربوي') }} *
              </label>
              <textarea
                id="reply-content"
                [value]="replyContent()"
                (input)="replyContent.set($any($event.target).value)"
                rows="4"
                placeholder="Rédigez votre réponse claire et bienveillante..."
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-[10px] p-2.5 text-[#14251D] outline-none"></textarea>
            </div>

            <div>
              <label for="reply-attach" class="block font-semibold text-[#14251D] mb-1">
                {{ lang.t('attachDocLabel') }}
              </label>
              <select
                id="reply-attach"
                [value]="selectedAttachCourseId()"
                (change)="selectedAttachCourseId.set($any($event.target).value)"
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-[10px] p-2.5 text-[#14251D] outline-none">
                <option value="">-- {{ lang.t('noAttachment') }} --</option>
                @for (c of store.courses(); track c.id) {
                  <option [value]="c.id">{{ c.title }} ({{ c.subject }})</option>
                }
              </select>
            </div>

            <button
              (click)="submitAnswerToQuestion()"
              class="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold py-3 rounded-[10px] cursor-pointer shadow-sm">
              {{ lang.tr('Valider et Envoyer la Réponse', 'إرسال الإجابة الرسمية') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 5: CREATE ANNOUNCEMENT -->
    <!-- MODAL 6: A4 PRINT & PDF BOOK MODAL -->
    @if (printModalCourse(); as c) {
      <div class="fixed inset-0 z-50 bg-[#14251D]/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-[24px] max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto text-[#14251D]">
          
          <div class="no-print flex items-center justify-between border-b border-[#E7DFCF] pb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-[#2D6A4F] text-xl">
                {{ c.pdfUrl ? 'menu_book' : 'print' }}
              </span>
              <div>
                <h3 class="font-display font-semibold text-base">
                  {{ c.pdfUrl ? lang.tr('Manuel Scolaire Officiel (CNP)', 'الكتاب المدرسي الرسمي (المركز الوطني البيداغوجي)') : lang.tr('Aperçu A4 Officiel (Ministère de l’Éducation)', 'معاينة وثيقة A4 الرسمية (وزارة التربية)') }}
                </h3>
                <p class="text-xs text-[#5B6B60]">
                  {{ c.pdfUrl ? lang.tr('Livre complet disponible en téléchargement direct haute qualité ou impression.', 'الكتاب المدرسي متوفر كاملاً للتحميل المباشر والطباعة عالية الدقة.') : lang.tr('Prêt pour impression papier ou export PDF haute fidélité.', 'جاهز للطباعة الورقية أو الحفظ بصيغة PDF.') }}
                </p>
              </div>
            </div>
            <button (click)="printModalCourse.set(null)" class="text-[#5B6B60] hover:text-[#14251D] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <!-- If Full PDF Book available (e.g. Official CNP Textbooks) -->
          @if (c.pdfUrl) {
            <div class="bg-[#FBF8F1] rounded-2xl p-6 border border-[#E7DFCF] space-y-4 text-center">
              <div class="w-14 h-14 rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center mx-auto shadow-inner">
                <span class="material-icons text-3xl">picture_as_pdf</span>
              </div>

              <div>
                <span class="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-[#F2C14E]/15 text-[#8A5A00] mb-2">
                  <span class="material-icons text-xs">verified</span>
                  {{ lang.tr('Édition Officielle du Centre National Pédagogique (CNP)', 'النسخة الرسمية المعتمدة من المركز الوطني البيداغوجي') }}
                </span>
                <h2 class="font-display font-bold text-lg sm:text-xl text-[#14251D]">
                  {{ c.title }}
                </h2>
                <p class="text-xs text-[#5B6B60] max-w-lg mx-auto mt-1 leading-relaxed">
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
                  class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-bold px-6 py-3.5 rounded-xl text-sm flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-102">
                  <span class="material-icons text-xl">download</span>
                  <span>{{ lang.tr('Télécharger le Manuel Complet (PDF)', 'تحميل الكتاب المدرسي كاملاً بصيغة PDF') }}</span>
                </a>

                <a
                  [href]="c.pdfUrl"
                  target="_blank"
                  rel="noopener"
                  class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-5 py-3.5 rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-colors">
                  <span class="material-icons text-base">open_in_new</span>
                  <span>{{ lang.tr('Lire / Feuilleter en ligne', 'قراءة وتصفح الكتاب مباشرة') }}</span>
                </a>
              </div>

              <!-- Quick Info Pill Strip -->
              <div class="grid grid-cols-3 gap-2 pt-3 border-t border-[#E7DFCF] max-w-md mx-auto text-xs text-[#5B6B60]">
                <div class="p-2 rounded-lg bg-white border border-[#E7DFCF]">
                  <p class="text-[10px] text-[#5B6B60]">{{ lang.tr('Niveau', 'المستوى') }}</p>
                  <p class="font-bold text-[#14251D]">{{ c.grade }}</p>
                </div>
                <div class="p-2 rounded-lg bg-white border border-[#E7DFCF]">
                  <p class="text-[10px] text-[#5B6B60]">{{ lang.tr('Matière', 'المادة') }}</p>
                  <p class="font-bold text-[#14251D]">{{ c.subject }}</p>
                </div>
                <div class="p-2 rounded-lg bg-white border border-[#E7DFCF]">
                  <p class="text-[10px] text-[#5B6B60]">{{ lang.tr('Année', 'السنة') }}</p>
                  <p class="font-bold text-[#14251D]">{{ c.schoolYear || '2025-2026' }}</p>
                </div>
              </div>
            </div>
          }

          <!-- Official Document Frame (Print Target) for custom sheets or print preview -->
          @if (!c.pdfUrl || c.content.length > 50) {
            <div id="printable-document" class="print-document bg-white rounded-xl p-8 border-2 border-[#14251D] relative overflow-hidden space-y-4">
              <div class="print-watermark absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 select-none rotate-[-25deg]">
                <span class="text-5xl font-semibold uppercase text-[#2D6A4F] tracking-widest text-center">
                  MADRASATI TN <br /> COPIE CERTIFIÉE ENSEIGNANT
                </span>
              </div>

              <!-- Dynamic Ministry Cartouche — only for text docs; scans carry their own header -->
              @if (!c.imageUrls || !c.imageUrls.length) {
                <app-cartouche tone="green" [grade]="c.grade" class="pb-3">
                  <div cartoucheCenter>
                    <p class="font-display text-base text-[#2D6A4F] font-semibold">{{ c.title }}</p>
                    <p class="text-xs text-[#5B6B60]">{{ c.grade }} • {{ c.subject }}</p>
                  </div>
                  <div cartoucheEnd class="text-xs text-[#14251D]">
                    <p>{{ c.trimester || 'الثلاثي الأول' }}</p>
                    <p>السنة الدراسية: {{ c.schoolYear || '2025-2026' }}</p>
                  </div>
                </app-cartouche>
              }

              <!-- Scanned document pages (community library) -->
              @if (c.imageUrls && c.imageUrls.length) {
                <div class="space-y-3 py-3 relative z-10">
                  @for (url of c.imageUrls; track url; let i = $index) {
                    <figure class="print-page rounded-lg overflow-hidden border border-[#E7DFCF]">
                      <img [src]="url" [alt]="c.title + ' — page ' + (i + 1)" class="w-full h-auto" />
                    </figure>
                  }
                </div>
              }

              <!-- Course Content -->
              @if (!c.imageUrls || !c.imageUrls.length) {
                <div class="text-xs leading-relaxed whitespace-pre-line py-3 relative z-10 text-[#14251D]">
                  {{ c.content }}
                </div>
              }

              <!-- Footer Attribution -->
              <div class="border-t border-[#E7DFCF] pt-3 text-[10px] text-[#5B6B60] flex items-center justify-between">
                <span>Attribution Enseignant : {{ c.watermarkText || 'Enseignant Certifié' }}</span>
                <span>Plateforme Nationale Madrasati TN</span>
              </div>
            </div>
          }

          <div class="no-print flex items-center justify-between gap-3 pt-2">
            <button (click)="printModalCourse.set(null)" class="bg-[#FBF8F1] hover:bg-[#E7DFCF] text-[#14251D] font-semibold px-4 py-2.5 rounded-[10px] text-xs cursor-pointer border border-[#E7DFCF]">
              {{ lang.tr('Fermer', 'إغلاق') }}
            </button>

            <button
              (click)="triggerPrintDialog()"
              class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-6 py-2.5 rounded-[10px] text-xs flex items-center gap-2 cursor-pointer shadow-sm">
              <span class="material-icons text-base">print</span>
              {{ lang.t('printBtn') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 7: READ ARTICLE DETAIL -->
    @if (selectedArticleDetail(); as post) {
      <div class="fixed inset-0 z-50 bg-[#14251D]/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-[24px] max-w-2xl w-full p-6 space-y-4 border border-[#E7DFCF] shadow-xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-3">
            <div class="flex items-center gap-2">
              <span class="bg-[#2D6A4F]/10 text-[#2D6A4F] text-xs font-bold px-2.5 py-0.5 rounded-full">
                {{ post.subject || 'Pédagogie' }}
              </span>
              <span class="text-xs text-[#5B6B60]">{{ post.publishedAt }}</span>
            </div>
            <button (click)="selectedArticleDetail.set(null)" class="text-[#5B6B60] hover:text-[#14251D] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div>
            <h3 class="font-display font-semibold text-[#14251D] text-xl">{{ post.title }}</h3>
            <p class="text-xs text-[#2D6A4F] font-medium mt-1">{{ post.authorName }} — {{ post.authorTitle }}</p>
          </div>

          <div class="prose prose-sm max-w-none text-xs text-[#14251D] leading-relaxed whitespace-pre-line bg-[#FBF8F1] p-5 rounded-[14px] border border-[#E7DFCF]">
            {{ post.content }}
          </div>

          <!-- Comments on article -->
          <div class="space-y-3 pt-2">
            <h4 class="font-display font-semibold text-xs text-[#14251D]">
              {{ lang.t('commentsCount') }} ({{ post.comments.length }})
            </h4>

            <div class="space-y-2">
              @for (comm of post.comments; track comm.id) {
                <div class="bg-[#FBF8F1] p-3 rounded-[10px] text-xs border border-[#E7DFCF]">
                  <div class="flex items-center justify-between">
                    <span class="font-semibold text-[#14251D]">{{ comm.authorName }}</span>
                    <span class="text-[10px] text-[#5B6B60]">{{ comm.createdAt }}</span>
                  </div>
                  <p class="text-[#14251D] mt-1">{{ comm.content }}</p>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 8: TEACHER CREDENTIALS & PROFILE / SETTINGS DRAWER -->
    @if (teacherProfileModal()) {
      <div class="fixed inset-0 z-50 bg-[#14251D]/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div class="bg-white rounded-[24px] max-w-2xl w-full p-6 space-y-5 border border-[#E7DFCF] shadow-2xl relative my-8">
          
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">
                <span class="material-icons">manage_accounts</span>
              </div>
              <div>
                <h3 class="font-display font-bold text-[#14251D] text-lg">
                  {{ lang.tr('Profil & Paramètres Enseignant', 'الملف الشخصي وإعدادات المعلم') }}
                </h3>
                <p class="text-xs text-[#5B6B60]">
                  {{ lang.tr('Identité, Filigrane A4, CNP & Préférences', 'الهوية، العلامة المائية A4، الاعتماد والإعدادات') }}
                </p>
              </div>
            </div>

            <button (click)="closeProfileModal()" class="w-8 h-8 rounded-full bg-[#FBF8F1] text-[#5B6B60] hover:text-[#14251D] flex items-center justify-center cursor-pointer transition-colors">
              <span class="material-icons text-lg">close</span>
            </button>
          </div>

          <!-- Notification Toast -->
          @if (profileSuccessMsg()) {
            <div class="p-3 bg-[#2D6A4F]/10 border border-[#2D6A4F]/30 rounded-xl text-xs text-[#2D6A4F] font-semibold flex items-center gap-2">
              <span class="material-icons text-base">check_circle</span>
              <span>{{ profileSuccessMsg() }}</span>
            </div>
          }

          <!-- Tabs Navigation -->
          <div class="flex border-b border-[#E7DFCF] gap-1 overflow-x-auto pb-1">
            <button
              (click)="profileTab.set('profile')"
              [class]="profileTab() === 'profile' 
                ? 'border-[#2D6A4F] text-[#2D6A4F] bg-[#2D6A4F]/10 font-bold' 
                : 'border-transparent text-[#5B6B60] hover:text-[#14251D] font-medium'"
              class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs border-b-2 cursor-pointer transition-all whitespace-nowrap">
              <span class="material-icons text-sm">person</span>
              <span>{{ lang.tr('Profil & Établissement', 'الهوية والمؤسسة') }}</span>
            </button>

            <button
              (click)="profileTab.set('watermark')"
              [class]="profileTab() === 'watermark' 
                ? 'border-[#2D6A4F] text-[#2D6A4F] bg-[#2D6A4F]/10 font-bold' 
                : 'border-transparent text-[#5B6B60] hover:text-[#14251D] font-medium'"
              class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs border-b-2 cursor-pointer transition-all whitespace-nowrap">
              <span class="material-icons text-sm">verified</span>
              <span>{{ lang.tr('Filigrane & CNP', 'العلامة المائية والاعتماد') }}</span>
            </button>

            <button
              (click)="profileTab.set('classes')"
              [class]="profileTab() === 'classes' 
                ? 'border-[#2D6A4F] text-[#2D6A4F] bg-[#2D6A4F]/10 font-bold' 
                : 'border-transparent text-[#5B6B60] hover:text-[#14251D] font-medium'"
              class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs border-b-2 cursor-pointer transition-all whitespace-nowrap">
              <span class="material-icons text-sm">school</span>
              <span>{{ lang.tr('Niveaux Enseignés', 'السنوات والمواد') }}</span>
            </button>

            <button
              (click)="profileTab.set('settings')"
              [class]="profileTab() === 'settings' 
                ? 'border-[#2D6A4F] text-[#2D6A4F] bg-[#2D6A4F]/10 font-bold' 
                : 'border-transparent text-[#5B6B60] hover:text-[#14251D] font-medium'"
              class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs border-b-2 cursor-pointer transition-all whitespace-nowrap">
              <span class="material-icons text-sm">settings</span>
              <span>{{ lang.tr('Paramètres', 'الإعدادات') }}</span>
            </button>
          </div>

          <!-- TAB 1: PROFIL & IDENTITE -->
          @if (profileTab() === 'profile') {
            <div class="space-y-4">
              <!-- Avatar & Header Box -->
              <div class="flex flex-col sm:flex-row items-center gap-4 p-4 bg-[#FBF8F1] rounded-2xl border border-[#E7DFCF]">
                <div class="relative shrink-0">
                  <app-teacher-avatar
                    [name]="editDisplayName() || 'Enseignant'"
                    [avatarUrl]="editAvatarUrl()"
                    size="xl" />
                  
                  <label class="absolute -bottom-1 -right-1 bg-[#2D6A4F] hover:bg-[#1B4332] text-white p-1.5 rounded-full cursor-pointer shadow-xs transition-colors flex items-center justify-center">
                    <span class="material-icons text-xs">photo_camera</span>
                    <input type="file" accept="image/*" class="hidden" (change)="onAvatarSelected($event)" />
                  </label>
                </div>

                <div class="space-y-1 text-center sm:text-start flex-1 min-w-0">
                  <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span class="font-bold text-[#14251D] text-sm">{{ editDisplayName() || lang.tr('Nom Enseignant', 'اسم المعلم') }}</span>
                    @if (editAvatarUrl()) {
                      <button
                        type="button"
                        (click)="editAvatarUrl.set('')"
                        class="text-[10px] text-[#D64545] hover:underline cursor-pointer">
                        {{ lang.tr('Supprimer la photo', 'حذف الصورة') }}
                      </button>
                    }
                  </div>
                  <p class="text-xs text-[#5B6B60]">{{ editTitle() || lang.tr('Titre professionnel', 'الصفة المهنية') }}</p>
                  
                  <!-- Completeness Meter -->
                  <div class="pt-2 space-y-1">
                    <div class="flex items-center justify-between text-[11px] font-semibold text-[#2D6A4F]">
                      <span>{{ lang.tr('Complétude du profil', 'اكتمال الملف') }}</span>
                      <span>{{ profileCompleteness() }}%</span>
                    </div>
                    <div class="w-full h-1.5 bg-[#E7DFCF] rounded-full overflow-hidden">
                      <div class="h-full bg-[#2D6A4F] transition-all duration-300" [style.width.%]="profileCompleteness()"></div>
                    </div>
                  </div>
                </div>

                @if (firebase.userProfile()?.uid) {
                  <a
                    [routerLink]="['/teachers', firebase.userProfile()?.uid]"
                    target="_blank"
                    class="px-3 py-2 bg-white hover:bg-[#E8F5FC] text-[#007CC2] border border-[#007CC2]/30 rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center gap-1 shadow-2xs">
                    <span class="material-icons text-xs">open_in_new</span>
                    <span>{{ lang.tr('Aperçu public', 'معاينة عامة') }}</span>
                  </a>
                }
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div class="space-y-1">
                  <label for="tp-display-name" class="font-semibold text-[#14251D]">{{ lang.tr('Nom et Prénom', 'الاسم واللقب') }}</label>
                  <input
                    id="tp-display-name"
                    type="text"
                    [value]="editDisplayName()"
                    (input)="editDisplayName.set($any($event.target).value)"
                    placeholder="Ex: Mohamed Ben Salem"
                    class="w-full px-3 py-2 rounded-xl bg-[#FBF8F1] border border-[#E7DFCF] text-[#14251D] focus:outline-none focus:border-[#2D6A4F]" />
                </div>

                <div class="space-y-1">
                  <label for="tp-title" class="font-semibold text-[#14251D]">{{ lang.tr('Titre & Grade Professionnel', 'الرتبة والصفة المهنية') }}</label>
                  <input
                    id="tp-title"
                    type="text"
                    [value]="editTitle()"
                    (input)="editTitle.set($any($event.target).value)"
                    placeholder="Ex: أستاذ تعليم ابتدائي أول"
                    class="w-full px-3 py-2 rounded-xl bg-[#FBF8F1] border border-[#E7DFCF] text-[#14251D] focus:outline-none focus:border-[#2D6A4F]" />
                </div>

                <div class="space-y-1">
                  <label for="tp-school" class="font-semibold text-[#14251D]">{{ lang.tr('Établissement Scolaire', 'المدرسة الإبتدائية') }}</label>
                  <input
                    id="tp-school"
                    type="text"
                    [value]="editSchool()"
                    (input)="editSchool.set($any($event.target).value)"
                    placeholder="Ex: École Primaire Habib Bourguiba"
                    class="w-full px-3 py-2 rounded-xl bg-[#FBF8F1] border border-[#E7DFCF] text-[#14251D] focus:outline-none focus:border-[#2D6A4F]" />
                </div>

                <div class="space-y-1">
                  <label for="tp-delegation" class="font-semibold text-[#14251D]">{{ lang.tr('Délégation & Gouvernorat', 'المندوبية والولاية') }}</label>
                  <input
                    id="tp-delegation"
                    type="text"
                    [value]="editDelegation()"
                    (input)="editDelegation.set($any($event.target).value)"
                    placeholder="Ex: Ariana Ville, Ariana"
                    class="w-full px-3 py-2 rounded-xl bg-[#FBF8F1] border border-[#E7DFCF] text-[#14251D] focus:outline-none focus:border-[#2D6A4F]" />
                </div>
              </div>

              <!-- Bio Field -->
              <div class="space-y-1 text-xs">
                <div class="flex items-center justify-between">
                  <label for="tp-bio" class="font-semibold text-[#14251D]">{{ lang.tr('Biographie Pédagogique', 'نبذة بيداغوجية تعريفية') }}</label>
                  <span class="text-[10px] text-[#829AB1]">{{ editBio().length }}/500</span>
                </div>
                <textarea
                  id="tp-bio"
                  rows="3"
                  maxlength="500"
                  [value]="editBio()"
                  (input)="editBio.set($any($event.target).value)"
                  [placeholder]="lang.tr('Partagez votre parcours pédagogique, vos matières de prédilection et vos objectifs éducatifs…', 'شارك مسيرتك التربوية واختصاصاتك وأهدافك التعليمية…')"
                  class="w-full p-3 rounded-xl bg-[#FBF8F1] border border-[#E7DFCF] text-[#14251D] focus:outline-none focus:border-[#2D6A4F] resize-none"></textarea>
              </div>
            </div>
          }

          <!-- TAB 2: FILIGRANE & CNP -->
          @if (profileTab() === 'watermark') {
            <div class="space-y-4 text-xs">
              <div class="p-3.5 bg-[#2D6A4F]/10 border border-[#2D6A4F]/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div class="flex items-center gap-2.5">
                  <span class="material-icons text-[#2D6A4F] text-xl">verified_user</span>
                  <div>
                    <h4 class="font-bold text-[#14251D]">{{ lang.tr("Agrément Ministère de l'Éducation", 'اعتماد وزارة التربية') }}</h4>
                    <p class="text-[11px] text-[#5B6B60]">{{ lang.tr('Matricule CNP vérifié et attribution sur feuilles A4.', 'معرف معتمد ومطابق للبرامج الرسمية.') }}</p>
                  </div>
                </div>

                @if (verificationRequested()) {
                  <span class="bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shrink-0">
                    {{ lang.tr('DEMANDE EN COURS', 'قيد المراجعة') }}
                  </span>
                } @else {
                  <button
                    type="button"
                    (click)="requestCertification()"
                    class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] text-[10px] font-bold px-3 py-1.5 rounded-xl shrink-0 cursor-pointer shadow-xs transition-colors">
                    {{ lang.tr('Demander la certification', 'طلب شارة التوثيق') }}
                  </button>
                }
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label for="tp-cnp-id" class="font-semibold text-[#14251D]">{{ lang.tr('Matricule Enseignant CNP (Privé)', 'معرف المعلم بالمركز الوطني (سري)') }}</label>
                  <input
                    id="tp-cnp-id"
                    type="text"
                    [value]="editCnpId()"
                    (input)="editCnpId.set($any($event.target).value)"
                    placeholder="Ex: CNP-TN-2024-XXXX"
                    class="w-full px-3 py-2 rounded-xl bg-[#FBF8F1] border border-[#E7DFCF] text-[#14251D] font-mono focus:outline-none focus:border-[#2D6A4F]" />
                </div>

                <div class="space-y-1">
                  <label for="tp-watermark" class="font-semibold text-[#14251D]">{{ lang.tr('Texte du Filigrane A4', 'نص العلامة المائية للطباعة') }}</label>
                  <input
                    id="tp-watermark"
                    type="text"
                    [value]="editCustomWatermark()"
                    (input)="editCustomWatermark.set($any($event.target).value)"
                    placeholder="Madrasati TN — Document Certifié"
                    class="w-full px-3 py-2 rounded-xl bg-[#FBF8F1] border border-[#E7DFCF] text-[#14251D] focus:outline-none focus:border-[#2D6A4F]" />
                </div>
              </div>

              <!-- Live Watermark Preview -->
              <div class="space-y-1.5">
                <span class="font-semibold text-[#14251D]">{{ lang.tr('Aperçu du Filigrane sur Feuille A4 :', 'معاينة العلامة المائية على ورقة الاختبار :') }}</span>
                <div class="relative p-6 bg-white rounded-xl border border-dashed border-[#2D6A4F]/40 text-center overflow-hidden">
                  <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15 rotate-[-25deg] select-none">
                    <span class="font-mono text-2xl font-semibold tracking-widest text-[#2D6A4F]">
                      {{ editCustomWatermark() || 'Madrasati TN — Document Certifié' }}
                    </span>
                  </div>
                  <div class="relative z-10 space-y-1">
                    <p class="text-[11px] font-bold text-[#14251D] uppercase tracking-wider">الجمهورية التونسية — وزارة التربية</p>
                    <p class="text-[10px] text-[#5B6B60]">Évaluation Imprimable A4 (Attribution : {{ editDisplayName() || 'Enseignant' }})</p>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- TAB 3: CLASSES & ENSEIGNEMENT -->
          @if (profileTab() === 'classes') {
            <div class="space-y-4 text-xs">
              <div class="space-y-2">
                <span class="font-semibold text-[#14251D] block">{{ lang.tr("Matières Enseignées / الإختصاصات :", 'المواد والمضامين المباشرة :') }}</span>
                <div class="flex flex-wrap gap-2">
                  @for (s of ['Mathématiques', 'Français', 'اللغة العربية', 'Éveil Scientifique', 'Histoire & Géographie', 'Anglais', 'Informatique', 'Éducation Islamique']; track s) {
                    <button
                      type="button"
                      (click)="toggleTaughtSubject(s)"
                      [class]="editTaughtSubjects().includes(s)
                        ? 'bg-[#2D6A4F] text-[#FBF8F1] font-bold border-[#2D6A4F]'
                        : 'bg-[#FBF8F1] text-[#5B6B60] border-[#E7DFCF] hover:border-[#2D6A4F]'"
                      class="px-3.5 py-1.5 rounded-xl border text-xs cursor-pointer transition-colors flex items-center gap-1">
                      @if (editTaughtSubjects().includes(s)) {
                        <span class="material-icons text-xs">check</span>
                      }
                      <span>{{ s }}</span>
                    </button>
                  }
                </div>
              </div>

              <div class="space-y-2">
                <span class="font-semibold text-[#14251D] block">{{ lang.tr("Niveaux et Années d'Enseignement Active :", 'السنوات الدراسية المباشرة :') }}</span>
                <div class="flex flex-wrap gap-2">
                  @for (g of primaryGrades; track g) {
                    <button
                      type="button"
                      (click)="toggleTaughtGrade(g)"
                      [class]="editTaughtGrades().includes(g)
                        ? 'bg-[#2D6A4F] text-[#FBF8F1] font-bold border-[#2D6A4F]'
                        : 'bg-[#FBF8F1] text-[#5B6B60] border-[#E7DFCF] hover:border-[#2D6A4F]'"
                      class="px-3.5 py-1.5 rounded-xl border text-xs cursor-pointer transition-colors flex items-center gap-1">
                      @if (editTaughtGrades().includes(g)) {
                        <span class="material-icons text-xs">check</span>
                      }
                      <span>{{ g }}</span>
                    </button>
                  }
                </div>
              </div>

              <div class="grid grid-cols-3 gap-2 text-center p-4 bg-[#FBF8F1] rounded-2xl border border-[#E7DFCF]">
                <div>
                  <p class="font-display font-bold text-[#14251D] text-base">{{ filteredCourses().length }}</p>
                  <p class="text-[10px] text-[#5B6B60]">Fiches A4 Publiées</p>
                </div>
                <div>
                  <p class="font-display font-bold text-[#14251D] text-base">{{ filteredBlogPosts().length }}</p>
                  <p class="text-[10px] text-[#5B6B60]">Articles de Conseils</p>
                </div>
                <div>
                  <p class="font-display font-bold text-[#D9A93C] text-base flex items-center justify-center gap-1">
                    <span class="material-icons text-sm text-[#F2C14E]">star</span>4.9
                  </p>
                  <p class="text-[10px] text-[#5B6B60]">128 Évaluations Parents</p>
                </div>
              </div>
            </div>
          }

          <!-- TAB 4: PARAMETRES -->
          @if (profileTab() === 'settings') {
            <div class="space-y-4 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <!-- Language Selector -->
                <div class="p-3 bg-[#FBF8F1] rounded-xl border border-[#E7DFCF] space-y-2">
                  <span class="font-semibold text-[#14251D] block">{{ lang.tr("Langue d'affichage", "لغة الواجهة") }}</span>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      (click)="lang.setLanguage('fr')"
                      [class]="lang.lang() === 'fr' ? 'bg-[#2D6A4F] text-[#FBF8F1] font-bold' : 'bg-white text-[#14251D] border border-[#E7DFCF]'"
                      class="flex-1 py-1.5 rounded-lg text-xs cursor-pointer transition-colors">
                      Français
                    </button>
                    <button
                      type="button"
                      (click)="lang.setLanguage('ar')"
                      [class]="lang.lang() === 'ar' ? 'bg-[#2D6A4F] text-[#FBF8F1] font-bold' : 'bg-white text-[#14251D] border border-[#E7DFCF]'"
                      class="flex-1 py-1.5 rounded-lg text-xs cursor-pointer transition-colors">
                      العربية
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Actions Footer -->
          <div class="flex items-center gap-3 pt-3 border-t border-[#E7DFCF]">
            <button
              (click)="saveTeacherProfileSettings()"
              class="flex-1 bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5">
              <span class="material-icons text-base">save</span>
              <span>{{ lang.tr('Enregistrer les modifications', 'حفظ التعديلات') }}</span>
            </button>
            <button
              (click)="closeProfileModal()"
              class="px-4 bg-[#FBF8F1] hover:bg-[#E7DFCF] text-[#5B6B60] font-semibold py-2.5 rounded-xl text-xs cursor-pointer transition-colors">
              {{ lang.tr('Fermer', 'إغلاق') }}
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
  private readonly print = inject(PrintService);
  private readonly ai = inject(AiClient);
  readonly firebase = inject(FirebaseService);
  readonly notifService = inject(NotificationService);
  readonly profileService = inject(TeacherProfileService);
  private readonly router = inject(Router);

  teacherGreeting(): string {
    const profile = this.firebase.userProfile();
    if (profile?.displayName) {
      return this.lang.tr(`Bonjour, ${profile.displayName}`, `مرحباً، ${profile.displayName}`);
    }
    return this.lang.tr('Espace Enseignant', 'فضاء المعلم');
  }

  readonly activeTab = signal<'courses' | 'blog' | 'qa'>('courses');
  readonly modalType = signal<'none' | 'course' | 'blogArticle'>('none');

  readonly selectedArticleDetail = signal<BlogPost | null>(null);
  readonly printModalCourse = signal<Course | null>(null);
  readonly teacherProfileModal = signal<boolean>(false);
  readonly replyingThread = signal<QuestionThread | null>(null);

  // Teacher Profile & Settings State
  readonly profileTab = signal<'profile' | 'watermark' | 'classes' | 'settings'>('profile');
  readonly profileSuccessMsg = signal<string | null>(null);

  readonly editDisplayName = signal<string>('');
  readonly editTitle = signal<string>('');
  readonly editSpeciality = signal<string>('');
  readonly editSchool = signal<string>('');
  readonly editDelegation = signal<string>('');
  readonly editBio = signal<string>('');
  readonly editAvatarUrl = signal<string>('');
  readonly editCnpId = signal<string>('');
  readonly editCustomWatermark = signal<string>('');
  readonly primaryGrades = PRIMARY_GRADES;
  readonly editTaughtGrades = signal<string[]>([...PRIMARY_GRADES]);
  readonly editTaughtSubjects = signal<string[]>(['Mathématiques', 'Éveil Scientifique', 'Français']);
  readonly isUploadingAvatar = signal<boolean>(false);
  readonly verificationRequested = signal<boolean>(false);

  readonly profileCompleteness = computed(() => {
    let score = 0;
    if (this.editDisplayName().trim()) score += 20;
    if (this.editSchool().trim()) score += 20;
    if (this.editBio().trim()) score += 25;
    if (this.editAvatarUrl()) score += 20;
    if (this.editTaughtGrades().length > 0) score += 15;
    return score;
  });

  // Document Scope Filter (Mes documents uniquement vs Toute la banque CNP)
  readonly docScopeFilter = signal<'mine' | 'all'>('mine');

  // Auth state: guest sees a read-only showcase; connected teacher gets his workspace.
  readonly isAuthed = computed(() => !!this.firebase.currentUser() || !!this.firebase.userProfile());

  // Gendered FR/AR labels (Enseignant/Enseignante, معلم/معلمة).
  readonly isFemale = computed(() => this.firebase.userProfile()?.gender === 'female');

  /** Gate creator actions behind login; opens the auth modal for guests. */
  private requireAuth(): boolean {
    if (this.isAuthed()) return true;
    this.store.openLoginModal();
    return false;
  }

  readonly filteredCourses = computed(() => {
    const list = this.store.courses();
    if (this.docScopeFilter() === 'all' || !this.isAuthed()) return list;
    const profile = this.firebase.userProfile();
    const currentUid = profile?.uid;
    const currentName = profile?.displayName?.trim().toLowerCase();

    return list.filter((c) => {
      if (currentUid && c.authorId === currentUid) return true;
      if (currentName && c.teacherName && c.teacherName.trim().toLowerCase() === currentName) return true;
      return !c.authorId && (c.teacherName === 'Enseignant Certifié' || c.teacherName === 'Prof. Habib Ben Amor');
    });
  });

  readonly coursesPage = signal(1);
  readonly coursesPageSize = signal(6);
  readonly paginatedCourses = computed(() =>
    paginate(this.filteredCourses(), this.coursesPage(), this.coursesPageSize())
  );

  readonly filteredBlogPosts = computed(() => {
    const list = this.store.blogPosts();
    if (this.docScopeFilter() === 'all' || !this.isAuthed()) return list;
    const profile = this.firebase.userProfile();
    const currentUid = profile?.uid;
    const currentName = profile?.displayName?.trim().toLowerCase();

    return list.filter((p) => {
      if (currentUid && p.authorId === currentUid) return true;
      if (currentName && p.authorName && p.authorName.trim().toLowerCase() === currentName) return true;
      return !p.authorId && (p.authorName === 'Enseignant Certifié' || p.authorName === 'Prof. Habib Ben Amor');
    });
  });

  readonly teacherTabs = computed<TabItem<'courses' | 'blog' | 'qa'>[]>(() => [
    { key: 'courses', label: this.lang.t('tabTeacherDocs'), icon: 'menu_book', count: this.filteredCourses().length },
    { key: 'blog', label: this.lang.t('tabTeacherBlog'), icon: 'article', count: this.filteredBlogPosts().length },
    { key: 'qa', label: this.lang.t('tabTeacherQA'), icon: 'forum', count: this.store.questionThreads().length },
  ]);

  private readonly route = inject(ActivatedRoute);
  private readonly vault = inject(StorageVaultService);

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent) {
    if (this.isAiScanning() || (this.modalType() === 'course' && (this.newCourseTitle() || this.newCourseContent()))) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  constructor() {
    // Restore draft and query param state on page load
    const viewParam = this.route.snapshot.queryParamMap.get('view');
    const savedDraft = this.vault.getMeta<{
      title: string;
      subject: SubjectName;
      grade: GradeLevel;
      trimester: string;
      docType: DocType;
      summary: string;
      content: string;
      fileUrl: string | null;
      fileName: string | null;
    }>('madrasati_draft_teacher_doc');

    if (savedDraft) {
      if (savedDraft.title) this.newCourseTitle.set(savedDraft.title);
      if (savedDraft.subject) this.newCourseSubject.set(savedDraft.subject);
      if (savedDraft.grade) this.newCourseGrade.set(savedDraft.grade);
      if (savedDraft.trimester) this.newCourseTrimester.set(savedDraft.trimester);
      if (savedDraft.docType) this.newCourseDocType.set(savedDraft.docType);
      if (savedDraft.summary) this.newCourseSummary.set(savedDraft.summary);
      if (savedDraft.content) this.newCourseContent.set(savedDraft.content);
      if (savedDraft.fileUrl) this.uploadedFileUrl.set(savedDraft.fileUrl);
      if (savedDraft.fileName) this.uploadedFileName.set(savedDraft.fileName);
    }

    if (viewParam === 'publish-doc' || (savedDraft && (savedDraft.title || savedDraft.content))) {
      this.modalType.set('course');
    }

    // Auto-save teacher course draft on changes
    effect(() => {
      if (this.modalType() === 'course') {
        const title = this.newCourseTitle();
        const content = this.newCourseContent();
        const fileUrl = this.uploadedFileUrl();
        if (title || content || fileUrl) {
          this.vault.setMeta('madrasati_draft_teacher_doc', {
            title,
            subject: this.newCourseSubject(),
            grade: this.newCourseGrade(),
            trimester: this.newCourseTrimester(),
            docType: this.newCourseDocType(),
            summary: this.newCourseSummary(),
            content,
            fileUrl,
            fileName: this.uploadedFileName(),
            updatedAt: Date.now(),
          });
        }
      }
    });

    effect(() => {
      if (this.store.isTeacherProfileModalOpen()) {
        this.openProfileModal();
      }
    });
  }

  openProfileModal() {
    if (!this.requireAuth()) return;
    const p = this.firebase.userProfile();
    this.editDisplayName.set(p?.displayName || '');
    this.editTitle.set(p?.title || 'أستاذ تعليم ابتدائي أول');
    this.editSpeciality.set(p?.speciality || p?.primarySubject || '');
    this.editSchool.set(p?.school || '');
    this.editDelegation.set(p?.delegation || '');
    this.editBio.set(p?.bio || '');
    this.editAvatarUrl.set(p?.photoURL || '');
    this.editCnpId.set(p?.cnpId || '');
    this.editCustomWatermark.set(p?.customWatermark || '');
    if (p?.taughtGrades) this.editTaughtGrades.set(p.taughtGrades);
    if (p?.subjects) this.editTaughtSubjects.set(p.subjects);
    this.profileSuccessMsg.set(null);
    this.verificationRequested.set(false);
    this.teacherProfileModal.set(true);
  }

  closeProfileModal() {
    this.teacherProfileModal.set(false);
    this.store.closeTeacherProfileModal();
  }

  async onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const uid = this.firebase.currentUser()?.uid || this.firebase.userProfile()?.uid;
    if (!uid) return;

    this.isUploadingAvatar.set(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const size = 400;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
            const webpBase64 = canvas.toDataURL('image/webp', 0.85);
            const url = await this.profileService.uploadAvatar(uid, webpBase64);
            this.editAvatarUrl.set(url);
            this.store.showToast(this.lang.tr('Photo de profil mise à jour !', 'تم تحديث الصورة الشخصية!'), 'success');
          }
          this.isUploadingAvatar.set(false);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      this.isUploadingAvatar.set(false);
      this.store.showToast(this.lang.tr('Erreur lors du téléversement', 'حدث خطأ أثناء رفع الصورة'), 'error');
    }
  }

  toggleTaughtGrade(grade: string) {
    const current = this.editTaughtGrades();
    if (current.includes(grade)) {
      if (current.length > 1) {
        this.editTaughtGrades.set(current.filter((g) => g !== grade));
      }
    } else {
      this.editTaughtGrades.set([...current, grade]);
    }
  }

  toggleTaughtSubject(subject: string) {
    const current = this.editTaughtSubjects();
    if (current.includes(subject)) {
      if (current.length > 1) {
        this.editTaughtSubjects.set(current.filter((s) => s !== subject));
      }
    } else {
      this.editTaughtSubjects.set([...current, subject]);
    }
  }

  async requestCertification() {
    const uid = this.firebase.currentUser()?.uid || this.firebase.userProfile()?.uid;
    if (!uid) return;
    await this.profileService.requestVerification(uid);
    this.verificationRequested.set(true);
    this.store.showToast(this.lang.tr('Demande de certification transmise avec succès.', 'تم إرسال طلب التوثيق والاعتماد بنجاح.'), 'success');
  }

  async saveTeacherProfileSettings() {
    const uid = this.firebase.currentUser()?.uid || this.firebase.userProfile()?.uid;
    if (!uid) return;

    await this.profileService.saveProfile(uid, {
      displayName: this.editDisplayName(),
      title: this.editTitle(),
      school: this.editSchool(),
      delegation: this.editDelegation(),
      bio: this.editBio(),
      avatarUrl: this.editAvatarUrl() || undefined,
      cnpId: this.editCnpId(),
      customWatermark: this.editCustomWatermark(),
      taughtGrades: this.editTaughtGrades(),
      subjects: this.editTaughtSubjects(),
    });

    this.profileSuccessMsg.set(this.lang.tr('Modifications enregistrées avec succès !', 'تم حفظ التعديلات بنجاح!'));
    setTimeout(() => this.profileSuccessMsg.set(null), 3000);
  }


  // Course / A4 Doc Form
  readonly newCourseTitle = signal('');
  readonly newCourseSubject = signal<SubjectName>('Mathématiques');
  readonly newCourseGrade = signal<GradeLevel>('4ème Année');
  readonly newCourseTrimester = signal('Trimestre 1');
  readonly newCourseDocType = signal<DocType>('Devoir de Contrôle');
  readonly newCourseSummary = signal('');
  readonly newCourseContent = signal('');
  readonly uploadedFileUrl = signal<string | null>(null);
  readonly uploadedFileName = signal<string | null>(null);
  readonly isUploading = signal<boolean>(false);
  readonly isAiScanning = signal<boolean>(false);
  readonly aiDetectedBadge = signal<string | null>(null);
  readonly publishDocTab = signal<'edit' | 'preview'>('edit');

  getTeacherName(): string {
    return this.firebase.userProfile()?.displayName || 'Enseignant Certifié';
  }

  getTeacherSchool(): string {
    return this.firebase.userProfile()?.school || 'École Primaire Habib Bourguiba, Ariana';
  }

  // Blog Article Form
  readonly newArticleTitle = signal('');
  readonly newArticleExcerpt = signal('');
  readonly newArticleContent = signal('');
  readonly newArticleSubject = signal<SubjectName>('Mathématiques');
  readonly newArticleGrade = signal<GradeLevel>('4ème Année');
  readonly newArticleTags = signal('Révision, Mathématiques, Primaire');

  // QA Reply Form
  readonly replyContent = signal('');
  readonly selectedAttachCourseId = signal<string>('');

  teacherHeaderSub(): string {
    return this.lang.tr(
      'Votre espace enseignant professionnel',
      'فضاؤك المهني للتعليم'
    );
  }

  /** The teacher's own school + region, as entered at registration. Empty if not provided. */
  teacherPlace(): string {
    const p = this.firebase.userProfile();
    return [p?.school, p?.delegation || p?.governorate].filter(Boolean).join(', ');
  }

  openModal(type: 'course' | 'blogArticle') {
    if (!this.requireAuth()) return;
    this.modalType.set(type);
    if (type === 'course') {
      this.router.navigate([], { queryParams: { view: 'publish-doc' }, queryParamsHandling: 'merge' });
    }
  }

  openArticleStudio() {
    if (!this.requireAuth()) return;
    this.store.setRole('article-editor');
  }

  closeModal() {
    this.modalType.set('none');
    this.uploadedFileUrl.set(null);
    this.uploadedFileName.set(null);
    this.isAiScanning.set(false);
    this.aiDetectedBadge.set(null);
    this.router.navigate([], { queryParams: { view: null }, queryParamsHandling: 'merge' });
  }

  copyDocLink(c: Course) {
    if (typeof window === 'undefined') return;
    void copySharePost(c.title, joinDetails([c.grade, c.subject, c.trimester]), `${window.location.origin}/discovery?doc=${c.id}`);
  }

  async handleCourseFileUpload(event: Event) {
    if (!this.requireAuth()) return;
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.isUploading.set(true);
    this.isAiScanning.set(true);
    this.aiDetectedBadge.set(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const base64Data = await base64Promise;

      // 1. Direct VPS disk storage with auth headers
      const authHeaders = await this.firebase.getAuthHeaders();
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          kind: 'courses',
          uid: this.firebase.currentUser()?.uid,
          filename: file.name,
          base64Data,
          contentType: file.type,
        }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        this.uploadedFileUrl.set(data.url);
        this.uploadedFileName.set(file.name);
      }

      // 2. Multimodal OCR & Classification
      const isImage = file.type.startsWith('image/');
      const tagRes = await this.ai.post('auto-tag-document', {
        filename: file.name,
        fileData: isImage ? base64Data : undefined,
        mimeType: file.type,
      });
      const t = (tagRes.ok ? tagRes.data['metadata'] : undefined) as AiJson | undefined;
      if (t) {
        if (t.suggestedTitle) this.newCourseTitle.set(t.suggestedTitle);
        if (t.subject) this.newCourseSubject.set(t.subject as SubjectName);
        if (t.grade) this.newCourseGrade.set(t.grade as GradeLevel);
        if (t.trimester) this.newCourseTrimester.set(t.trimester);
        if (t.docType) this.newCourseDocType.set(t.docType as DocType);
        if (t.summary) this.newCourseSummary.set(t.summary);
        if (t.extractedContent) this.newCourseContent.set(t.extractedContent);

        this.aiDetectedBadge.set(
          `${t.grade || '4ème'} • ${t.subject || 'Maths'} • ${t.docType || 'Devoir'}`
        );
      } else if (!this.newCourseTitle()) {
        this.newCourseTitle.set(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err) {
      console.error('Upload / AI OCR failed:', err);
      if (!this.newCourseTitle()) {
        this.newCourseTitle.set(file.name.replace(/\.[^/.]+$/, ''));
      }
    } finally {
      this.isUploading.set(false);
      this.isAiScanning.set(false);
    }
  }

  submitCourse() {
    if (!this.newCourseTitle()) return;
    const teacherName = this.getTeacherName();
    const school = this.getTeacherSchool();
    const watermark = buildWatermark({ authorName: teacherName, school });

    const fileUrl = this.uploadedFileUrl() || undefined;
    const isImg = fileUrl ? /\.(webp|png|jpg|jpeg|svg|gif)($|\?)/i.test(fileUrl) : false;

    const createdCourse = this.store.addCourse({
      title: this.newCourseTitle(),
      subject: this.newCourseSubject(),
      grade: this.newCourseGrade(),
      trimester: this.newCourseTrimester() as Trimester,
      docType: this.newCourseDocType(),
      schoolYear: '2025-2026',
      teacherName,
      summary: this.newCourseSummary() || `${this.newCourseSubject()} - ${this.newCourseGrade()} - Document conforme au programme tunisien.`,
      content: this.newCourseContent() || 'Document officiel conforme avec en-tête républicain et cartouche élève.',
      pdfUrl: isImg ? undefined : fileUrl,
      imageUrls: isImg && fileUrl ? [fileUrl] : undefined,
      watermarkText: watermark,
      hasCorrection: true,
    });

    void this.notifService.emit({
      category: 'activity',
      type: 'new_doc',
      titleKey: 'notifNewDocTitle',
      messageKey: 'notifNewDocMsg',
      params: {
        title: this.newCourseTitle(),
        subject: this.newCourseSubject(),
        grade: this.newCourseGrade(),
        author: teacherName,
      },
      targetRole: 'parent',
      routeUrl: '/parent',
      targetDocId: createdCourse.id,
      icon: 'menu_book',
    });

    this.vault.removeMeta('madrasati_draft_teacher_doc');
    this.newCourseTitle.set('');
    this.newCourseContent.set('');
    this.newCourseSummary.set('');
    this.closeModal();
  }

  async submitBlogArticle() {
    if (!this.newArticleTitle() || !this.newArticleContent()) return;
    const tagsArr = this.newArticleTags().split(',').map((t) => t.trim()).filter(Boolean);
    const post = await this.store.addBlogPost({
      title: this.newArticleTitle(),
      excerpt: this.newArticleExcerpt() || this.newArticleContent().slice(0, 120) + '...',
      content: this.newArticleContent(),
      subject: this.newArticleSubject(),
      grade: this.newArticleGrade(),
      tags: tagsArr,
      authorName: this.firebase.userProfile()?.displayName || 'Enseignant Certifié',
      authorTitle: 'Enseignant Certifié',
      readTimeMinutes: Math.max(2, Math.ceil(this.newArticleContent().split(' ').length / 180)),
    });
    void this.notifService.emit({
      category: 'activity',
      type: 'announcement',
      titleKey: 'notifBlogArticleTitle',
      messageKey: 'notifBlogArticleMsg',
      params: {
        title: this.newArticleTitle(),
        author: this.firebase.userProfile()?.displayName || 'Enseignant Certifié',
      },
      targetRole: 'all',
      routeUrl: '/blog',
      targetDocId: post?.id,
      icon: 'article',
    });
    this.store.showToast(this.lang.t('toastPublished'), 'success');
    this.closeModal();
  }

  submitAnswerToQuestion() {
    if (!this.requireAuth()) return;
    const thread = this.replyingThread();
    if (!thread || !this.replyContent()) return;

    let attachedDocTitle: string | undefined;
    if (this.selectedAttachCourseId()) {
      const course = this.store.courses().find((c) => c.id === this.selectedAttachCourseId());
      if (course) attachedDocTitle = course.title;
    }

    this.store.addAnswerToQuestion(thread.id, {
      teacherName: this.firebase.userProfile()?.displayName || 'Enseignant Certifié',
      teacherTitle: 'Enseignant Certifié',
      content: this.replyContent(),
      attachedDocId: this.selectedAttachCourseId() || undefined,
      attachedDocTitle,
      isVerifiedAnswer: true,
    });

    void this.notifService.emit({
      category: 'activity',
      type: 'qa_reply',
      titleKey: 'notifQaReplyTitle',
      messageKey: 'notifQaReplyMsg',
      params: {
        title: thread.title.slice(0, 45),
      },
      targetRole: 'parent',
      routeUrl: '/parent',
      targetThreadId: thread.id,
      tab: 'qa',
      icon: 'forum',
    });

    this.replyingThread.set(null);
    this.replyContent.set('');
    this.selectedAttachCourseId.set('');
  }

  openPrintCourseModal(c: Course) {
    this.printModalCourse.set(c);
  }

  triggerPrintDialog() {
    this.print.printCourse(this.printModalCourse());
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
}
