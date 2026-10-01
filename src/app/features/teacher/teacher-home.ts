import { ChangeDetectionStrategy, Component, inject, signal, effect, computed } from '@angular/core';
import { EducationStore, LanguageService, FirebaseService, Course, SubjectName, GradeLevel, DocType, Trimester, BlogPost, QuestionThread } from '@core';

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
      <div class="rounded-[24px] bg-[#14251D] text-[#FBF8F1] p-6 sm:p-7 shadow-sm">
        <div class="space-y-5">
          <div class="space-y-3">
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
                <span class="font-semibold text-[#FBF8F1] underline decoration-[#F2C14E] underline-offset-4">{{ store.activeClass().name }}</span>
                — {{ store.activeClass().schoolName }}.
              </p>
            </div>
          </div>

          <!-- Quick Actions Bar -->
          <div class="flex flex-wrap items-center gap-2.5 pt-5 border-t border-white/10">
            <button
              (click)="openStudio()"
              class="flex items-center gap-1.5 bg-[#F2C14E] hover:bg-[#D9A93C] text-[#14251D] font-bold px-4 py-2.5 rounded-[10px] text-xs transition-colors cursor-pointer shadow-sm">
              <span class="material-icons text-base">auto_fix_high</span>
              {{ lang.tr('Studio Examens A4', 'استوديو التحرير والطباعة A4') }}
            </button>

            <button
              (click)="openArticleStudio()"
              class="flex items-center gap-1.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-bold px-4 py-2.5 rounded-[10px] text-xs transition-colors cursor-pointer shadow-sm">
              <span class="material-icons text-base">article</span>
              {{ lang.tr('Rédiger un Article', 'كتابة مقال بيداغوجي') }}
            </button>

            <button
              (click)="openGenerator()"
              class="flex items-center gap-1.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-bold px-4 py-2.5 rounded-[10px] text-xs transition-colors cursor-pointer shadow-sm">
              <span class="material-icons text-base">auto_awesome</span>
              {{ lang.tr('Fiches similaires IA', 'أوراق مشابهة بالذكاء') }}
            </button>

            <button
              (click)="openStudio()"
              class="flex items-center gap-1.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-4 py-2.5 rounded-[10px] text-xs transition-colors cursor-pointer shadow-sm">
              <span class="material-icons text-base">cloud_upload</span>
              {{ lang.t('addCourseBtn') }}
            </button>

            <button
              (click)="openModal('ai')"
              class="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-[#FBF8F1] font-semibold px-4 py-2.5 rounded-[10px] text-xs border border-white/15 transition-colors cursor-pointer shadow-sm">
              <span class="material-icons text-base">auto_awesome</span>
              {{ lang.t('aiAssistantBtn') }}
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
        <div class="border-b border-[#E7DFCF] bg-[#FBF8F1] px-6 pt-3 flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap gap-2">
            <button
              (click)="activeTab.set('courses')"
              [class]="activeTab() === 'courses' ? 'border-[#2D6A4F] text-[#2D6A4F] bg-white font-semibold shadow-xs' : 'border-transparent text-[#5B6B60] font-medium hover:text-[#2D6A4F]'"
              class="px-4 py-3 border-b-2 text-xs flex items-center gap-2 transition-all cursor-pointer rounded-t-lg">
              <span class="material-icons text-base">menu_book</span>
              <span>{{ lang.t('tabTeacherDocs') }} ({{ filteredCourses().length }})</span>
            </button>

            <button
              (click)="activeTab.set('blog')"
              [class]="activeTab() === 'blog' ? 'border-[#2D6A4F] text-[#2D6A4F] bg-white font-semibold shadow-xs' : 'border-transparent text-[#5B6B60] font-medium hover:text-[#2D6A4F]'"
              class="px-4 py-3 border-b-2 text-xs flex items-center gap-2 transition-all cursor-pointer rounded-t-lg">
              <span class="material-icons text-base">article</span>
              <span>{{ lang.t('tabTeacherBlog') }} ({{ filteredBlogPosts().length }})</span>
            </button>

            <button
              (click)="activeTab.set('qa')"
              [class]="activeTab() === 'qa' ? 'border-[#2D6A4F] text-[#2D6A4F] bg-white font-semibold shadow-xs' : 'border-transparent text-[#5B6B60] font-medium hover:text-[#2D6A4F]'"
              class="px-4 py-3 border-b-2 text-xs flex items-center gap-2 transition-all cursor-pointer rounded-t-lg">
              <span class="material-icons text-base">forum</span>
              <span>{{ lang.t('tabTeacherQA') }} ({{ store.questionThreads().length }})</span>
            </button>
          </div>

          <!-- Scope Filter: Mes Documents vs Toute la Banque CNP -->
          <div class="mb-2 bg-[#E7DFCF]/80 p-1 rounded-xl flex items-center gap-1">
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
        </div>

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
                  (click)="openStudio()"
                  class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-xs px-4 py-2.5 rounded-[10px] flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto">
                  <span class="material-icons text-sm">add</span> {{ lang.t('addCourseBtn') }}
                </button>
              </div>

              <div class="grid md:grid-cols-2 gap-4">
                @for (c of filteredCourses(); track c.id) {
                  <div class="bg-[#FBF8F1] rounded-[18px] p-5 border border-[#E7DFCF] flex flex-col justify-between space-y-3 hover:border-[#2D6A4F]/40 transition-colors">
                    <div class="space-y-2">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                          <span class="bg-[#2D6A4F]/10 text-[#2D6A4F] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            {{ c.subject }}
                          </span>
                          @if (c.grade) {
                            <span class="bg-[#F2C14E]/15 text-[#8A5A00] text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {{ c.grade }}
                            </span>
                          }
                        </div>
                        <span class="text-[11px] text-[#5B6B60]">{{ c.createdAt }}</span>
                      </div>
                      <h4 class="font-display font-semibold text-[#14251D] text-sm leading-snug">{{ c.title }}</h4>
                      <p class="text-xs text-[#5B6B60] line-clamp-2 leading-relaxed">{{ c.summary }}</p>

                      @if (c.pdfUrl) {
                        <div class="inline-flex items-center gap-1 text-[11px] text-[#2D6A4F] font-semibold bg-[#F2ECDE] px-2.5 py-1 rounded-md border border-[#2D6A4F]/20">
                          <span class="material-icons text-xs">picture_as_pdf</span>
                          <span>{{ lang.tr('Fichier VPS / Document joint', 'ملف مرفق على الخادم') }}</span>
                        </div>
                      }
                    </div>

                    <div class="pt-3 border-t border-[#E7DFCF] flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2">
                        <button
                          (click)="openPrintCourseModal(c)"
                          class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-3 py-1.5 rounded-[8px] text-xs flex items-center gap-1 cursor-pointer shadow-xs">
                          <span class="material-icons text-xs">print</span>
                          {{ lang.t('printA4Btn') }}
                        </button>
                        <button
                          (click)="copyDocLink(c)"
                          class="bg-[#FBF8F1] hover:bg-[#E7DFCF] text-[#5B6B60] font-semibold px-3 py-1.5 rounded-[8px] text-xs flex items-center gap-1 border border-[#E7DFCF] transition-colors cursor-pointer">
                          <span class="material-icons text-xs">link</span>
                          {{ lang.tr('Copier le lien', 'نسخ الرابط') }}
                        </button>
                      </div>

                      <button
                        (click)="openPrintCourseModal(c)"
                        class="text-xs font-semibold text-[#14251D] hover:text-[#2D6A4F] flex items-center gap-1 cursor-pointer">
                        {{ lang.tr('Aperçu', 'معاينة') }} <span class="material-icons text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                }
              </div>
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
                  (click)="openStudio()"
                  class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-xs px-4 py-2.5 rounded-[10px] flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto">
                  <span class="material-icons text-sm">edit_note</span> {{ lang.t('writeArticleBtn') }}
                </button>
              </div>

              <div class="grid md:grid-cols-2 gap-5">
                @for (post of filteredBlogPosts(); track post.id) {
                  <div class="bg-[#FBF8F1] rounded-[20px] border border-[#E7DFCF] overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
                    @if (post.coverImage) {
                      <div class="h-40 w-full overflow-hidden bg-[#F2ECDE] border-b border-[#E7DFCF]">
                        <img [src]="post.coverImage" [alt]="post.title" class="w-full h-full object-cover transition-transform hover:scale-105 duration-300" />
                      </div>
                    }
                    <div class="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div class="space-y-3">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <span class="bg-[#2D6A4F]/10 text-[#2D6A4F] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                              {{ post.subject || 'Pédagogie' }}
                            </span>
                            @if (post.grade) {
                              <span class="bg-[#F2C14E]/15 text-[#8A5A00] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {{ post.grade }}
                              </span>
                            }
                          </div>
                          <span class="text-[11px] text-[#5B6B60] flex items-center gap-1">
                            <span class="material-icons text-xs">schedule</span>
                            {{ post.readTimeMinutes }} min {{ lang.tr('de lecture', 'قراءة') }}
                          </span>
                        </div>

                        <h4 class="font-display font-semibold text-[#14251D] text-base leading-snug">
                          {{ post.title }}
                        </h4>

                        <p class="text-xs text-[#5B6B60] leading-relaxed line-clamp-3">
                          {{ cleanExcerpt(post.excerpt) }}
                        </p>

                        <!-- Tags -->
                        <div class="flex flex-wrap gap-1.5 pt-1">
                          @for (tag of post.tags; track tag) {
                            <span class="text-[10px] bg-white text-[#5B6B60] px-2 py-0.5 rounded-md border border-[#E7DFCF]">
                              #{{ tag }}
                            </span>
                          }
                        </div>
                      </div>

                    <!-- Post Footer -->
                    <div class="pt-4 border-t border-[#E7DFCF] flex items-center justify-between gap-3 text-xs">
                      <div class="flex items-center gap-3">
                        <button
                          (click)="store.likeBlogPost(post.id)"
                          class="flex items-center gap-1 text-[#C1121F] font-semibold hover:opacity-80 cursor-pointer bg-white px-2.5 py-1 rounded-full border border-[#E7DFCF]">
                          <span class="material-icons text-sm">favorite</span>
                          <span>{{ post.likesCount }}</span>
                        </button>
                        <span class="text-[#5B6B60] flex items-center gap-1 font-medium">
                          <span class="material-icons text-sm">chat_bubble_outline</span>
                          {{ post.comments.length }} {{ lang.tr('commentaires', 'تعليقات') }}
                        </span>
                      </div>

                      <button
                        (click)="selectedArticleDetail.set(post)"
                        class="text-[#2D6A4F] font-semibold hover:underline flex items-center gap-1 cursor-pointer">
                        {{ lang.tr('Lire l’article', 'قراءة المقال') }}
                        <span class="material-icons text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
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
                  <div class="bg-[#FBF8F1] rounded-[20px] p-6 border border-[#E7DFCF] space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7DFCF] pb-3">
                      <div class="space-y-1">
                        <div class="flex items-center gap-2">
                          <span class="bg-[#2D6A4F]/10 text-[#2D6A4F] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            {{ thread.subject }}
                          </span>
                          <span class="bg-[#F2C14E]/15 text-[#8A5A00] text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {{ thread.grade }}
                          </span>
                          <span class="text-[11px] text-[#5B6B60] font-medium">
                            • {{ thread.parentName }} • {{ thread.createdAt }}
                          </span>
                        </div>
                        <h4 class="font-display font-semibold text-[#14251D] text-base">{{ thread.title }}</h4>
                      </div>

                      <button
                        (click)="replyingThread.set(thread)"
                        class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-xs px-3.5 py-2 rounded-[10px] flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto">
                        <span class="material-icons text-sm">reply</span>
                        {{ lang.t('replyToQuestionBtn') }}
                      </button>
                    </div>

                    <!-- Question Body -->
                    <p class="text-xs text-[#14251D] bg-white p-4 rounded-[14px] border border-[#E7DFCF] leading-relaxed">
                      {{ thread.content }}
                    </p>

                    <!-- Existing Answers -->
                    @if (thread.answers.length > 0) {
                      <div class="space-y-2 pt-1">
                        <p class="text-[11px] font-semibold text-[#14251D] flex items-center gap-1">
                          <span class="material-icons text-xs text-[#2D6A4F]">verified</span>
                          {{ lang.tr('Réponses des enseignants :', 'إجابات الإطار التربوي:') }}
                        </p>

                        @for (ans of thread.answers; track ans.id) {
                          <div class="bg-[#F2ECDE] rounded-[14px] p-4 border border-[#2D6A4F]/20 space-y-2 text-xs">
                            <div class="flex items-center justify-between">
                              <div class="flex items-center gap-2">
                                <span class="font-semibold text-[#14251D]">{{ ans.teacherName }}</span>
                                <span class="text-[10px] bg-[#2D6A4F] text-[#FBF8F1] px-2 py-0.5 rounded-full font-medium">
                                  {{ ans.teacherTitle }}
                                </span>
                              </div>
                              <span class="text-[10px] text-[#5B6B60]">{{ ans.createdAt }}</span>
                            </div>

                            <p class="text-[#14251D] leading-relaxed">{{ ans.content }}</p>

                            @if (ans.attachedDocTitle) {
                              <div class="inline-flex items-center gap-2 bg-white text-[#2D6A4F] p-2.5 rounded-[10px] border border-[#2D6A4F]/30 font-medium text-[11px]">
                                <span class="material-icons text-sm text-[#2D6A4F]">attach_file</span>
                                <span>{{ lang.t('attachedDocument') }} : <strong class="text-[#14251D]">{{ ans.attachedDocTitle }}</strong></span>
                              </div>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- TAB 4: OFFICIAL ANNOUNCEMENTS -->
        </div>
      </div>

    </div>

    <!-- MODAL 1: AI ASSISTANT -->
    @if (modalType() === 'ai') {
      <div class="fixed inset-0 z-50 bg-[#14251D]/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-[24px] max-w-2xl w-full p-6 space-y-5 border border-[#E7DFCF] shadow-xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-[#F2C14E] text-2xl">auto_awesome</span>
              <div>
                <h3 class="font-display font-semibold text-[#14251D] text-lg">
                  {{ lang.tr('Assistant Pédagogique IA Tunisie', 'المساعد البيداغوجي الذكي في تونس') }}
                </h3>
                <p class="text-xs text-[#5B6B60]">
                  {{ lang.tr("Générez un exercice ou une évaluation alignée au programme officiel tunisien.", 'توليد تمارين واختبارات متطابقة مع البرنامج الرسمي التونسي.') }}
                </p>
              </div>
            </div>
            <button (click)="closeModal()" class="text-[#5B6B60] hover:text-[#14251D] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-4 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="ai-subject" class="block font-semibold text-[#14251D] mb-1">
                  {{ lang.tr('Matière', 'المادة') }}
                </label>
                <select
                  id="ai-subject"
                  [value]="aiFormSubject()"
                  (change)="onAiSubjectChange($event)"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-[10px] p-2.5 text-[#14251D] outline-none">
                  <option value="Mathématiques">Mathématiques / الرياضيات</option>
                  <option value="Français">Français / الفرنسية</option>
                  <option value="اللغة العربية">اللغة العربية</option>
                  <option value="Éveil Scientifique">Éveil Scientifique / الإيقاظ العلمي</option>
                </select>
              </div>

              <div>
                <label for="ai-diff" class="block font-semibold text-[#14251D] mb-1">
                  {{ lang.tr('Difficulté', 'درجة الصعوبة') }}
                </label>
                <select
                  id="ai-diff"
                  [value]="aiFormDifficulty()"
                  (change)="onAiDifficultyChange($event)"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-[10px] p-2.5 text-[#14251D] outline-none">
                  <option value="Facile">Facile / سهل</option>
                  <option value="Moyen">Moyen / متوسط</option>
                  <option value="Avancé">Avancé (Concours 6ème) / متقدم (مناظرة السادسة)</option>
                </select>
              </div>
            </div>

            <div>
              <label for="ai-topic" class="block font-semibold text-[#14251D] mb-1">
                {{ lang.tr('Thème / Chapitre précis', 'المحور أو الدرس') }}
              </label>
              <input
                id="ai-topic"
                type="text"
                [value]="aiFormTopic()"
                (input)="onAiTopicInput($event)"
                placeholder="Ex: La multiplication, الجملة الاسمية..."
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-[10px] p-2.5 text-[#14251D] outline-none" />
            </div>

            <button
              [disabled]="isAiLoading()"
              (click)="generateAiExercise()"
              class="w-full bg-[#F2C14E] hover:bg-[#D9A93C] text-[#14251D] font-semibold py-3 rounded-[10px] flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50">
              @if (isAiLoading()) {
                <span class="material-icons animate-spin text-sm">sync</span>
                <span>{{ lang.tr("Génération par l'IA Gemini en cours...", 'جاري التوليد باستخدام الذكاء الاصطناعي...') }}</span>
              } @else {
                <span class="material-icons text-sm">auto_awesome</span>
                <span>{{ lang.tr("Générer l'exercice et la solution", 'توليد التمرين والإصلاح') }}</span>
              }
            </button>

            @if (generatedAiResult(); as result) {
              <div class="bg-[#FBF8F1] rounded-[18px] p-4 border border-[#E7DFCF] space-y-3 mt-4">
                <div class="flex items-center justify-between">
                  <h4 class="font-display font-semibold text-[#14251D] text-sm">{{ result.title }}</h4>
                  <span class="bg-[#2D6A4F]/10 text-[#2D6A4F] font-semibold px-2 py-0.5 rounded-md text-[10px]">
                    {{ lang.tr('Généré avec succès', 'تم التوليد بنجاح') }}
                  </span>
                </div>

                <p class="text-[#14251D] bg-white p-3 rounded-[10px] border border-[#E7DFCF] leading-relaxed font-mono text-[11px]">
                  {{ result.promptText }}
                </p>

                <div class="bg-[#2D6A4F]/10 p-3 rounded-[10px] text-[#2D6A4F]">
                  <span class="font-semibold">{{ lang.tr('Solution :', 'الإصلاح:') }}</span> {{ result.solutionText }}
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- MODAL 2: CREATE COURSE / A4 DOCUMENT -->
    @if (modalType() === 'course') {
      <div class="fixed inset-0 z-50 bg-[#14251D]/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-[24px] max-w-lg w-full p-6 space-y-4 border border-[#E7DFCF] shadow-xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-[#2D6A4F]">post_add</span>
              <h3 class="font-display font-semibold text-[#14251D] text-base">
                {{ lang.tr('Publier un Document ou Examen A4', 'نشر وثيقة، تلخيص أو امتحان A4') }}
              </h3>
            </div>
            <button (click)="closeModal()" class="text-[#5B6B60] hover:text-[#14251D] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <!-- VPS Direct Upload & AI Multimodal Scanner Zone -->
            <div class="border-2 border-dashed border-[#2D6A4F]/40 rounded-[18px] p-4 text-center bg-[#F2ECDE] space-y-2">
              <label for="file-upload" class="cursor-pointer block">
                <div class="w-12 h-12 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center mx-auto mb-2">
                  <span class="material-icons text-2xl">document_scanner</span>
                </div>
                <h4 class="text-xs font-bold text-[#14251D]">
                  {{ lang.tr("Numériser un devoir / capture d'écran / PDF", 'مسح ضوئي للامتحان أو الصورة أو PDF') }}
                </h4>
                <p class="text-[11px] text-[#5B6B60] mt-0.5">
                  {{ isAiScanning() ? lang.tr('Analyse OCR & classification par Gemini 2.5 en cours...', 'جاري الفرز والتحليل الذكي بواسطة الذكاء الاصطناعي...') : (isUploading() ? lang.tr('Envoi vers le VPS...', 'جاري الرفع إلى الخادم...') : lang.tr("L'IA extrait le texte, classifie la matière/niveau et applique votre filigrane officiel", 'يقوم الذكاء الاصطناعي باستخراج النص وتصنيف المادة وتطبيق علامتك المائية')) }}
                </p>
                <input
                  id="file-upload"
                  type="file"
                  (change)="handleCourseFileUpload($event)"
                  class="hidden"
                  accept="application/pdf,image/*" />
              </label>

              @if (isAiScanning()) {
                <div class="flex items-center justify-center gap-2 text-xs text-[#2D6A4F] font-semibold py-1 animate-pulse">
                  <span class="material-icons animate-spin text-sm">sync</span>
                  <span>{{ lang.tr('OCR & Classification intelligente...', 'معالجة ضوئية وفهرسة...') }}</span>
                </div>
              }

              @if (aiDetectedBadge()) {
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] text-[11px] font-bold border border-[#2D6A4F]/20">
                  <span class="material-icons text-xs">auto_awesome</span>
                  <span>{{ aiDetectedBadge() }}</span>
                </div>
              }

              @if (uploadedFileName()) {
                <span class="text-[11px] text-[#2D6A4F] font-semibold block">✓ {{ uploadedFileName() }}</span>
              }
            </div>

            <div>
              <label for="course-title" class="block font-semibold text-[#14251D] mb-1">
                {{ lang.tr('Titre officiel du document', 'العنوان الرسمي للوثيقة') }} *
              </label>
              <input
                id="course-title"
                type="text"
                [value]="newCourseTitle()"
                (input)="newCourseTitle.set($any($event.target).value)"
                placeholder="Ex: Devoir de Contrôle N°1 : Mathématiques et Géométrie"
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-[10px] p-2.5 text-[#14251D] outline-none font-semibold" />
            </div>

            <!-- 4-Facet Strict Classification Matrix to Protect Library -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label for="course-subj" class="block font-semibold text-[#14251D] mb-1">
                  {{ lang.tr('Matière', 'المادة') }} *
                </label>
                <select
                  id="course-subj"
                  [value]="newCourseSubject()"
                  (change)="newCourseSubject.set($any($event.target).value)"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-[10px] p-2 text-[#14251D] outline-none">
                  <option value="Mathématiques">Mathématiques / الرياضيات</option>
                  <option value="Français">Français / الفرنسية</option>
                  <option value="اللغة العربية">اللغة العربية</option>
                  <option value="Éveil Scientifique">Éveil Scientifique / الإيقاظ</option>
                  <option value="Histoire & Géographie">Histoire & Géo / التاريخ والجغرافيا</option>
                  <option value="Anglais">Anglais / الإنجليزية</option>
                </select>
              </div>

              <div>
                <label for="course-grade" class="block font-semibold text-[#14251D] mb-1">
                  {{ lang.tr('Niveau', 'المستوى') }} *
                </label>
                <select
                  id="course-grade"
                  [value]="newCourseGrade()"
                  (change)="newCourseGrade.set($any($event.target).value)"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-[10px] p-2 text-[#14251D] outline-none">
                  <option value="1ère Année">1ère Année / السنة الأولى</option>
                  <option value="2ème Année">2ème Année / السنة الثانية</option>
                  <option value="3ème Année">3ème Année / السنة الثالثة</option>
                  <option value="4ème Année">4ème Année / السنة الرابعة</option>
                  <option value="5ème Année">5ème Année / السنة الخامسة</option>
                  <option value="6ème Année">6ème Année / السنة السادسة</option>
                </select>
              </div>

              <div>
                <label for="course-trim" class="block font-semibold text-[#14251D] mb-1">
                  {{ lang.tr('Trimestre', 'الثلاثي') }} *
                </label>
                <select
                  id="course-trim"
                  [value]="newCourseTrimester()"
                  (change)="newCourseTrimester.set($any($event.target).value)"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-[10px] p-2 text-[#14251D] outline-none">
                  <option value="Trimestre 1">Trimestre 1 / الثلاثي الأول</option>
                  <option value="Trimestre 2">Trimestre 2 / الثلاثي الثاني</option>
                  <option value="Trimestre 3">Trimestre 3 / الثلاثي الثالث</option>
                </select>
              </div>

              <div>
                <label for="course-doctype" class="block font-semibold text-[#14251D] mb-1">
                  {{ lang.tr('Type', 'النوع') }} *
                </label>
                <select
                  id="course-doctype"
                  [value]="newCourseDocType()"
                  (change)="newCourseDocType.set($any($event.target).value)"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-[10px] p-2 text-[#14251D] outline-none">
                  <option value="Devoir de Contrôle">Devoir de Contrôle / مراقبة</option>
                  <option value="Devoir de Synthèse">Devoir de Synthèse / تأليفي</option>
                  <option value="Fiche de Révision">Fiche de Révision / تقييم</option>
                  <option value="Série d'Exercices">Série d'Exercices / تمارين</option>
                </select>
              </div>
            </div>

            <div>
              <label for="course-summary" class="block font-semibold text-[#14251D] mb-1">
                {{ lang.tr('Résumé pédagogique', 'ملخص تربوي موجز') }}
              </label>
              <input
                id="course-summary"
                type="text"
                [value]="newCourseSummary()"
                (input)="newCourseSummary.set($any($event.target).value)"
                placeholder="Ex: Fiche d'exercices et problèmes d'évaluation pour le 1er trimestre."
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-[10px] p-2.5 text-[#14251D] outline-none" />
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label for="course-content" class="block font-semibold text-[#14251D]">
                  {{ lang.tr('Contenu A4 imprimable & transcrit par OCR', 'المحتوى المستخرج القابل للطباعة A4') }}
                </label>
                <span class="text-[10px] text-[#5B6B60]">
                  {{ lang.tr('Format Markdown supporté', 'يدعم التنسيق المتقدم') }}
                </span>
              </div>
              <textarea
                id="course-content"
                [value]="newCourseContent()"
                (input)="newCourseContent.set($any($event.target).value)"
                rows="5"
                placeholder="Rédigez ou laissez l'IA transcrire automatiquement les exercices depuis votre photo..."
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-[10px] p-2.5 text-[#14251D] outline-none font-mono text-[11px] leading-relaxed"></textarea>
            </div>

            <!-- Identity Attribution & Watermark Badge Preview -->
            <div class="p-3 bg-[#F2ECDE]/80 border border-[#2D6A4F]/20 rounded-[12px] flex items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-2">
                <span class="material-icons text-base text-[#2D6A4F]">verified_user</span>
                <div>
                  <p class="font-bold text-[#14251D]">
                    {{ getTeacherName() }}
                  </p>
                  <p class="text-[10px] text-[#5B6B60]">
                    {{ getTeacherSchool() }} • {{ lang.tr('Filigrane officiel appliqué automatiquement', 'العلامة المائية تطبق تلقائياً') }}
                  </p>
                </div>
              </div>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#2D6A4F] text-[#FBF8F1]">
                A4 Impress
              </span>
            </div>

            <button
              (click)="submitCourse()"
              class="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold py-3 rounded-[10px] cursor-pointer shadow-sm">
              {{ lang.tr('Publier le Document A4 Certifié', 'نشر وتوثيق الوثيقة الرسمية') }}
            </button>
          </div>
        </div>
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
                <div class="border-b-2 border-[#14251D] pb-3">
                  <div class="flex items-center justify-between text-xs">
                    <div class="text-left font-bold text-[#14251D] leading-tight">
                      <p>الجمهورية التونسية</p>
                      <p>وزارة التربية والتعليم</p>
                    </div>
                    <div class="text-center font-bold">
                      <p class="font-display text-base text-[#2D6A4F] font-semibold">{{ c.title }}</p>
                      <p class="text-xs text-[#5B6B60]">{{ c.grade }} • {{ c.subject }}</p>
                    </div>
                    <div class="text-right text-xs text-[#14251D] leading-tight">
                      <p>{{ c.trimester || 'الثلاثي الأول' }}</p>
                      <p>السنة الدراسية: {{ c.schoolYear || '2025-2026' }}</p>
                    </div>
                  </div>

                  <!-- Student Filling Box -->
                  <div class="mt-3 pt-2 border-t border-dashed border-[#E7DFCF] grid grid-cols-3 gap-2 text-xs font-semibold">
                    <p>الاسم واللقب: ....................................</p>
                    <p>القسم: {{ c.grade }}</p>
                    <p class="text-right font-bold text-[#2D6A4F]">العدد: .......... / 20</p>
                  </div>
                </div>
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
              <div class="flex items-center gap-4 p-3 bg-[#FBF8F1] rounded-2xl border border-[#E7DFCF]">
                <div class="w-14 h-14 rounded-full bg-[#2D6A4F] text-[#FBF8F1] flex items-center justify-center text-xl font-bold shrink-0 shadow-md">
                  {{ editDisplayName().substring(0, 1) || 'م' }}
                </div>
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-[#14251D] text-sm">{{ editDisplayName() }}</span>
                    <span class="text-[10px] bg-[#2D6A4F]/10 text-[#2D6A4F] font-semibold px-2 py-0.5 rounded-full">
                      ✓ {{ lang.tr('Compte Vérifié', 'حساب معتمد') }}
                    </span>
                  </div>
                  <p class="text-xs text-[#5B6B60]">{{ editTitle() }}</p>
                  <p class="text-[11px] text-[#2D6A4F] font-semibold">{{ editSchool() }}</p>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div class="space-y-1">
                  <label for="tp-display-name" class="font-semibold text-[#14251D]">{{ lang.tr('Nom et Prénom', 'الاسم واللقب') }}</label>
                  <input
                    id="tp-display-name"
                    type="text"
                    [value]="editDisplayName()"
                    (input)="editDisplayName.set($any($event.target).value)"
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
                  <label for="tp-speciality" class="font-semibold text-[#14251D]">{{ lang.tr('Spécialité & Discipline Principale', 'الإختصاص والتخصص الرئيسي') }}</label>
                  <input
                    id="tp-speciality"
                    type="text"
                    [value]="editSpeciality()"
                    (input)="editSpeciality.set($any($event.target).value)"
                    placeholder="Ex: Mathématiques & Éveil Scientifique"
                    class="w-full px-3 py-2 rounded-xl bg-[#FBF8F1] border border-[#E7DFCF] text-[#14251D] focus:outline-none focus:border-[#2D6A4F]" />
                </div>

                <div class="space-y-1">
                  <label for="tp-school" class="font-semibold text-[#14251D]">{{ lang.tr('Établissement Scolaire', 'المدرسة الإبتدائية') }}</label>
                  <input
                    id="tp-school"
                    type="text"
                    [value]="editSchool()"
                    (input)="editSchool.set($any($event.target).value)"
                    class="w-full px-3 py-2 rounded-xl bg-[#FBF8F1] border border-[#E7DFCF] text-[#14251D] focus:outline-none focus:border-[#2D6A4F]" />
                </div>

                <div class="space-y-1">
                  <label for="tp-delegation" class="font-semibold text-[#14251D]">{{ lang.tr('Délégation & Gouvernorat', 'المندوبية والولاية') }}</label>
                  <input
                    id="tp-delegation"
                    type="text"
                    [value]="editDelegation()"
                    (input)="editDelegation.set($any($event.target).value)"
                    class="w-full px-3 py-2 rounded-xl bg-[#FBF8F1] border border-[#E7DFCF] text-[#14251D] focus:outline-none focus:border-[#2D6A4F]" />
                </div>
              </div>
            </div>
          }

          <!-- TAB 2: FILIGRANE & CNP -->
          @if (profileTab() === 'watermark') {
            <div class="space-y-4 text-xs">
              <div class="p-3.5 bg-[#2D6A4F]/10 border border-[#2D6A4F]/20 rounded-2xl flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="material-icons text-[#2D6A4F] text-xl">verified_user</span>
                  <div>
                    <h4 class="font-bold text-[#14251D]">{{ lang.tr("Agrément Ministère de l'Éducation", 'اعتماد وزارة التربية') }}</h4>
                    <p class="text-[11px] text-[#5B6B60]">{{ lang.tr('Matricule CNP vérifié et conforme au programme officiel.', 'معرف معتمد ومطابق للبرامج الرسمية.') }}</p>
                  </div>
                </div>
                <span class="bg-[#2D6A4F] text-[#FBF8F1] font-mono text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0">VALIDE</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label for="tp-cnp-id" class="font-semibold text-[#14251D]">{{ lang.tr('Matricule Enseignant CNP', 'معرف المعلم بالمركز الوطني') }}</label>
                  <input
                    id="tp-cnp-id"
                    type="text"
                    [value]="editCnpId()"
                    (input)="editCnpId.set($any($event.target).value)"
                    class="w-full px-3 py-2 rounded-xl bg-[#FBF8F1] border border-[#E7DFCF] text-[#14251D] font-mono focus:outline-none focus:border-[#2D6A4F]" />
                </div>

                <div class="space-y-1">
                  <label for="tp-watermark" class="font-semibold text-[#14251D]">{{ lang.tr('Texte du Filigrane A4', 'نص العلامة المائية للطباعة') }}</label>
                  <input
                    id="tp-watermark"
                    type="text"
                    [value]="editCustomWatermark()"
                    (input)="editCustomWatermark.set($any($event.target).value)"
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
                    <p class="text-[10px] text-[#5B6B60]">Évaluation Imprimable A4 (Attribution : {{ editDisplayName() }})</p>
                    <div class="mt-2 inline-flex items-center gap-1 text-[10px] text-[#2D6A4F] bg-[#2D6A4F]/10 px-2 py-0.5 rounded-full font-semibold">
                      <span class="material-icons text-[12px]">lock</span>
                      {{ editCnpId() }}
                    </div>
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
                  @for (g of ['1ère Année', '2ème Année', '3ème Année', '4ème Année', '5ème Année', '6ème Année']; track g) {
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
  readonly firebase = inject(FirebaseService);

  teacherGreeting(): string {
    const profile = this.firebase.userProfile();
    if (profile?.displayName) {
      return this.lang.tr(`Bonjour, ${profile.displayName}`, `مرحباً، ${profile.displayName}`);
    }
    return this.lang.tr('Espace Enseignant', 'فضاء المعلم');
  }

  readonly activeTab = signal<'courses' | 'blog' | 'qa'>('courses');
  readonly modalType = signal<'none' | 'course' | 'blogArticle' | 'ai'>('none');
  
  readonly selectedArticleDetail = signal<BlogPost | null>(null);
  readonly printModalCourse = signal<Course | null>(null);
  readonly teacherProfileModal = signal<boolean>(false);
  readonly replyingThread = signal<QuestionThread | null>(null);

  // Teacher Profile & Settings State
  readonly profileTab = signal<'profile' | 'watermark' | 'classes' | 'settings'>('profile');
  readonly profileSuccessMsg = signal<string | null>(null);

  readonly editDisplayName = signal<string>('Enseignant Certifié');
  readonly editTitle = signal<string>('أستاذ تعليم ابتدائي أول');
  readonly editSpeciality = signal<string>('Mathématiques & Éveil Scientifique');
  readonly editSchool = signal<string>('École Primaire Habib Bourguiba, Ariana');
  readonly editDelegation = signal<string>('Ariana Ville');
  readonly editCnpId = signal<string>('CNP-TN-2024-8841');
  readonly editCustomWatermark = signal<string>('Madrasati TN — Document Certifié');
  readonly editTaughtGrades = signal<string[]>(['1ère Année', '2ème Année', '3ème Année', '4ème Année', '5ème Année', '6ème Année']);
  readonly editTaughtSubjects = signal<string[]>(['Mathématiques', 'Éveil Scientifique', 'Français']);

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

  constructor() {
    effect(() => {
      if (this.store.isTeacherProfileModalOpen()) {
        this.openProfileModal();
      }
    });
  }

  openProfileModal() {
    if (!this.requireAuth()) return;
    const p = this.firebase.userProfile();
    this.editDisplayName.set(p?.displayName || 'Enseignant Certifié');
    this.editTitle.set(p?.title || 'أستاذ تعليم ابتدائي أول');
    this.editSpeciality.set(p?.speciality || p?.primarySubject || 'Mathématiques & Éveil Scientifique');
    this.editSchool.set(p?.school || 'École Primaire Habib Bourguiba, Ariana');
    this.editDelegation.set(p?.delegation || 'Ariana Ville');
    this.editCnpId.set(p?.cnpId || 'CNP-TN-2024-8841');
    this.editCustomWatermark.set(p?.customWatermark || 'Madrasati TN — Document Certifié');
    if (p?.taughtGrades) this.editTaughtGrades.set(p.taughtGrades);
    if (p?.subjects) this.editTaughtSubjects.set(p.subjects);
    this.profileSuccessMsg.set(null);
    this.teacherProfileModal.set(true);
  }

  closeProfileModal() {
    this.teacherProfileModal.set(false);
    this.store.closeTeacherProfileModal();
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

  async saveTeacherProfileSettings() {
    await this.firebase.updateUserProfile({
      displayName: this.editDisplayName(),
      title: this.editTitle(),
      speciality: this.editSpeciality(),
      primarySubject: this.editSpeciality(),
      school: this.editSchool(),
      delegation: this.editDelegation(),
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

  // AI Assistant Form
  readonly aiFormSubject = signal('Mathématiques');
  readonly aiFormDifficulty = signal('Moyen');
  readonly aiFormTopic = signal('La résolution de problèmes à deux étapes');
  readonly isAiLoading = signal<boolean>(false);
  readonly generatedAiResult = signal<GeneratedExerciseResult | null>(null);

  teacherHeaderSub(): string {
    return this.lang.tr(
      'Votre espace enseignant professionnel pour la classe ',
      'فضاؤك المهني للتعليم الخاص بفصل '
    );
  }

  openModal(type: 'course' | 'blogArticle' | 'ai') {
    if (!this.requireAuth()) return;
    this.modalType.set(type);
  }

  openStudio() {
    if (!this.requireAuth()) return;
    this.store.setRole('editor');
  }

  openArticleStudio() {
    if (!this.requireAuth()) return;
    this.store.setRole('article-editor');
  }

  openGenerator() {
    if (!this.requireAuth()) return;
    this.store.openGenerator();
  }

  closeModal() {
    this.modalType.set('none');
    this.uploadedFileUrl.set(null);
    this.uploadedFileName.set(null);
    this.isAiScanning.set(false);
    this.aiDetectedBadge.set(null);
  }

  copyDocLink(c: Course) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}?doc=${c.id}`);
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

      // 2. Multimodal OCR & Classification by Gemini 2.5 Flash
      const tagRes = await fetch('/api/ai/auto-tag-document', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          documentName: file.name,
          base64Data: file.type.startsWith('image/') ? base64Data : undefined,
          contentType: file.type,
        }),
      });
      const tagData = await tagRes.json();
      if (tagData.success && tagData.tags) {
        const t = tagData.tags;
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
    const watermark = `Madrasati TN — Document Certifié — ${teacherName} (${school})`;

    this.store.addCourse({
      title: this.newCourseTitle(),
      subject: this.newCourseSubject(),
      grade: this.newCourseGrade(),
      trimester: this.newCourseTrimester() as Trimester,
      docType: this.newCourseDocType(),
      schoolYear: '2025-2026',
      teacherName,
      summary: this.newCourseSummary() || `${this.newCourseSubject()} - ${this.newCourseGrade()} - Document conforme au programme tunisien.`,
      content: this.newCourseContent() || 'Document officiel conforme avec en-tête républicain et cartouche élève.',
      pdfUrl: this.uploadedFileUrl() || undefined,
      watermarkText: watermark,
      hasCorrection: true,
    });

    this.firebase.addNotification({
      type: 'new_doc',
      title: `Nouvelle fiche : ${this.newCourseTitle()}`,
      message: `${this.newCourseSubject()} (${this.newCourseGrade()}) • ${this.newCourseDocType()} - Publié par ${teacherName}.`,
      linkRole: 'parent',
      icon: 'menu_book',
    });

    this.closeModal();
  }

  submitBlogArticle() {
    if (!this.newArticleTitle() || !this.newArticleContent()) return;
    const tagsArr = this.newArticleTags().split(',').map((t) => t.trim()).filter(Boolean);
    this.store.addBlogPost({
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
    this.firebase.addNotification({
      type: 'announcement',
      title: `Article : ${this.newArticleTitle()}`,
      message: `Publié sur le blog pédagogique de la plateforme.`,
      linkRole: 'teacher',
      icon: 'article',
    });
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

    this.firebase.addNotification({
      type: 'qa_reply',
      title: `Réponse d'un enseignant à votre question`,
      message: `Sujet : ${thread.subject} - ${thread.title.slice(0, 45)}...`,
      linkRole: 'parent',
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

  async generateAiExercise() {
    this.isAiLoading.set(true);
    try {
      const res = await fetch('/api/ai/generate-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: this.newCourseGrade(),
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
