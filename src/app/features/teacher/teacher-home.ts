import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { EducationStore, LanguageService, FirebaseService, Course, SubjectName, GradeLevel, DocType, BlogPost, QuestionThread } from '@core';

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
      
      <!-- Welcome Header: Institutional Hero -->
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
              (click)="store.setRole('editor')"
              class="flex items-center gap-1.5 bg-[#E0AA32] hover:bg-[#D19A24] text-[#0B2947] font-bold px-4 py-2.5 rounded-[10px] text-xs transition-colors cursor-pointer shadow-sm">
              <span class="material-icons text-base">auto_fix_high</span>
              {{ lang.tr('Studio de Rédaction A4', 'استوديو التحرير والطباعة A4') }}
            </button>

            <button
              (click)="openModal('course')"
              class="flex items-center gap-1.5 bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold px-4 py-2.5 rounded-[10px] text-xs transition-colors cursor-pointer shadow-sm">
              <span class="material-icons text-base">cloud_upload</span>
              {{ lang.t('addCourseBtn') }}
            </button>

            <button
              (click)="openModal('announcement')"
              class="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white font-semibold px-4 py-2.5 rounded-[10px] text-xs border border-white/15 transition-colors cursor-pointer">
              <span class="material-icons text-base">campaign</span>
              {{ lang.t('addAnnouncementBtn') }}
            </button>

            <button
              (click)="openModal('ai')"
              class="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white font-semibold px-4 py-2.5 rounded-[10px] text-xs border border-white/15 transition-colors cursor-pointer shadow-sm">
              <span class="material-icons text-base">auto_awesome</span>
              {{ lang.t('aiAssistantBtn') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Metric Cards & Quick Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-[#0E1D2A] rounded-[18px] border border-[#E3ECF2] dark:border-[#1A3145] shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col">
          <div class="h-1.5 bg-[#007CC2]"></div>
          <div class="p-5 flex flex-col justify-between grow">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-[#102A43] dark:text-white">{{ lang.tr('Fiches & Docs A4', 'الوثائق والامتحانات A4') }}</span>
              <div class="w-8 h-8 rounded-lg bg-[#E8F5FC] dark:bg-[#102A43] text-[#007CC2] flex items-center justify-center">
                <span class="material-icons text-lg">menu_book</span>
              </div>
            </div>
            <div>
              <p class="font-display text-3xl font-semibold text-[#102A43] dark:text-white tracking-tight">{{ store.courses().length }}</p>
              <p class="text-[11px] text-[#486581] dark:text-[#8CA9C4] font-medium mt-1 flex items-center gap-1">
                <span class="material-icons text-xs text-[#007CC2]">print</span>
                {{ lang.tr('Prêts à imprimer', 'جاهزة للطباعة والتحميل') }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-[#0E1D2A] rounded-[18px] border border-[#E3ECF2] dark:border-[#1A3145] shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col">
          <div class="h-1.5 bg-[#23845B]"></div>
          <div class="p-5 flex flex-col justify-between grow">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-[#102A43] dark:text-white">{{ lang.tr('Articles Pédagogiques', 'المقالات البيداغوجية') }}</span>
              <div class="w-8 h-8 rounded-lg bg-[#E8F6EF] dark:bg-[#153B2D] text-[#23845B] flex items-center justify-center">
                <span class="material-icons text-lg">article</span>
              </div>
            </div>
            <div>
              <p class="font-display text-3xl font-semibold text-[#102A43] dark:text-white tracking-tight">{{ store.blogPosts().length }}</p>
              <p class="text-[11px] text-[#486581] dark:text-[#8CA9C4] font-medium mt-1 flex items-center gap-1">
                <span class="material-icons text-xs text-[#23845B]">groups</span>
                {{ lang.tr('Conseils publiés', 'نصائح منشورة للأولياء') }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-[#0E1D2A] rounded-[18px] border border-[#E3ECF2] dark:border-[#1A3145] shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col">
          <div class="h-1.5 bg-[#D19A24]"></div>
          <div class="p-5 flex flex-col justify-between grow">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-[#102A43] dark:text-white">{{ lang.tr('Questions Parents', 'أسئلة واستفسارات الأولياء') }}</span>
              <div class="w-8 h-8 rounded-lg bg-[#FFF4D8] dark:bg-[#3D2E10] text-[#D19A24] flex items-center justify-center">
                <span class="material-icons text-lg">forum</span>
              </div>
            </div>
            <div>
              <p class="font-display text-3xl font-semibold text-[#102A43] dark:text-white tracking-tight">{{ store.questionThreads().length }}</p>
              <p class="text-[11px] text-[#486581] dark:text-[#8CA9C4] font-medium mt-1 flex items-center gap-1">
                <span class="material-icons text-xs text-[#D19A24]">mark_chat_read</span>
                {{ lang.tr('Demandes de fiches & soutien', 'طلبات مراجعة ووثائق') }}
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
              <p class="font-display text-3xl font-semibold text-[#102A43] dark:text-white tracking-tight">86%</p>
              <p class="text-[11px] text-[#486581] dark:text-[#8CA9C4] font-medium mt-1 flex items-center gap-1">
                <span class="material-icons text-xs text-[#D64545]">check_circle</span>
                {{ lang.tr("Accusés de réception", 'نسبة اطلاع الأولياء') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Hub Tabs -->
      <div class="bg-white dark:bg-[#0E1D2A] rounded-[24px] border border-[#E3ECF2] dark:border-[#1A3145] overflow-hidden shadow-xs">

        <!-- Tab Bar Header -->
        <div class="border-b border-[#E3ECF2] dark:border-[#1A3145] bg-[#F7F9FB] dark:bg-[#152737] px-6 pt-3 flex flex-wrap gap-2">
          <button
            (click)="activeTab.set('courses')"
            [class]="activeTab() === 'courses' ? 'border-[#007CC2] text-[#007CC2] bg-white dark:bg-[#0E1D2A] font-semibold shadow-xs' : 'border-transparent text-[#486581] dark:text-[#8CA9C4] font-medium hover:text-[#007CC2]'"
            class="px-4 py-3 border-b-2 text-xs flex items-center gap-2 transition-all cursor-pointer rounded-t-lg">
            <span class="material-icons text-base">menu_book</span>
            <span>{{ lang.t('tabTeacherDocs') }} ({{ store.courses().length }})</span>
          </button>

          <button
            (click)="activeTab.set('blog')"
            [class]="activeTab() === 'blog' ? 'border-[#007CC2] text-[#007CC2] bg-white dark:bg-[#0E1D2A] font-semibold shadow-xs' : 'border-transparent text-[#486581] dark:text-[#8CA9C4] font-medium hover:text-[#007CC2]'"
            class="px-4 py-3 border-b-2 text-xs flex items-center gap-2 transition-all cursor-pointer rounded-t-lg">
            <span class="material-icons text-base">article</span>
            <span>{{ lang.t('tabTeacherBlog') }} ({{ store.blogPosts().length }})</span>
          </button>

          <button
            (click)="activeTab.set('qa')"
            [class]="activeTab() === 'qa' ? 'border-[#007CC2] text-[#007CC2] bg-white dark:bg-[#0E1D2A] font-semibold shadow-xs' : 'border-transparent text-[#486581] dark:text-[#8CA9C4] font-medium hover:text-[#007CC2]'"
            class="px-4 py-3 border-b-2 text-xs flex items-center gap-2 transition-all cursor-pointer rounded-t-lg">
            <span class="material-icons text-base">forum</span>
            <span>{{ lang.t('tabTeacherQA') }} ({{ store.questionThreads().length }})</span>
          </button>

          <button
            (click)="activeTab.set('announcements')"
            [class]="activeTab() === 'announcements' ? 'border-[#007CC2] text-[#007CC2] bg-white dark:bg-[#0E1D2A] font-semibold shadow-xs' : 'border-transparent text-[#486581] dark:text-[#8CA9C4] font-medium hover:text-[#007CC2]'"
            class="px-4 py-3 border-b-2 text-xs flex items-center gap-2 transition-all cursor-pointer rounded-t-lg">
            <span class="material-icons text-base">campaign</span>
            <span>{{ lang.t('tabAnnouncements') }} ({{ store.classAnnouncements().length }})</span>
          </button>
        </div>

        <!-- Tab Body -->
        <div class="p-6">
          
          <!-- TAB 1: COURSES & A4 PRINTABLE DOCS -->
          @if (activeTab() === 'courses') {
            <div class="space-y-5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 class="font-display font-semibold text-[#102A43] dark:text-white text-base">
                    {{ lang.t('tabTeacherDocs') }}
                  </h3>
                  <p class="text-xs text-[#486581] dark:text-[#8CA9C4]">
                    {{ lang.tr("Publiez des fiches conformes avec filigrane officiel et impression A4 en 1-clic.", 'نشر وثائق وامتحانات مطابقة للبرنامج مع فيليغران رسمي وطباعة A4 فورية.') }}
                  </p>
                </div>
                <button
                  (click)="openModal('course')"
                  class="bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold text-xs px-4 py-2.5 rounded-[10px] flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto">
                  <span class="material-icons text-sm">add</span> {{ lang.t('addCourseBtn') }}
                </button>
              </div>

              <div class="grid md:grid-cols-2 gap-4">
                @for (c of store.courses(); track c.id) {
                  <div class="bg-[#F7F9FB] dark:bg-[#152737] rounded-[18px] p-5 border border-[#E3ECF2] dark:border-[#1A3145] flex flex-col justify-between space-y-3 hover:border-[#007CC2]/40 transition-colors">
                    <div class="space-y-2">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                          <span class="bg-[#007CC2]/10 text-[#007CC2] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            {{ c.subject }}
                          </span>
                          @if (c.grade) {
                            <span class="bg-[#E0AA32]/15 text-[#9E6A00] dark:text-[#E0AA32] text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {{ c.grade }}
                            </span>
                          }
                        </div>
                        <span class="text-[11px] text-[#627D98] dark:text-[#8CA9C4]">{{ c.createdAt }}</span>
                      </div>
                      <h4 class="font-display font-semibold text-[#102A43] dark:text-white text-sm leading-snug">{{ c.title }}</h4>
                      <p class="text-xs text-[#486581] dark:text-[#8CA9C4] line-clamp-2 leading-relaxed">{{ c.summary }}</p>

                      @if (c.pdfUrl) {
                        <div class="inline-flex items-center gap-1 text-[11px] text-[#007CC2] font-semibold bg-[#E8F5FC] dark:bg-[#102A43] px-2.5 py-1 rounded-md border border-[#007CC2]/20">
                          <span class="material-icons text-xs">picture_as_pdf</span>
                          <span>{{ lang.tr('Fichier VPS / Document joint', 'ملف مرفق على الخادم') }}</span>
                        </div>
                      }
                    </div>

                    <div class="pt-3 border-t border-[#E3ECF2] dark:border-[#1A3145] flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2">
                        <button
                          (click)="openPrintCourseModal(c)"
                          class="bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold px-3 py-1.5 rounded-[8px] text-xs flex items-center gap-1 cursor-pointer shadow-xs">
                          <span class="material-icons text-xs">print</span>
                          {{ lang.t('printA4Btn') }}
                        </button>
                        <a
                          [href]="getWhatsAppShareUrl(c)"
                          target="_blank"
                          rel="noopener"
                          class="bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] font-semibold px-3 py-1.5 rounded-[8px] text-xs flex items-center gap-1 transition-colors">
                          <span class="material-icons text-xs">share</span>
                          WhatsApp
                        </a>
                      </div>

                      <button
                        (click)="selectedCourseDetail.set(c)"
                        class="text-xs font-semibold text-[#102A43] dark:text-white hover:text-[#007CC2] flex items-center gap-1 cursor-pointer">
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
                  <h3 class="font-display font-semibold text-[#102A43] dark:text-white text-base">
                    {{ lang.t('tabTeacherBlog') }}
                  </h3>
                  <p class="text-xs text-[#486581] dark:text-[#8CA9C4]">
                    {{ lang.tr("Partagez vos méthodes d'enseignement, conseils de révision et réflexions avec la communauté des parents.", 'شارك طرائق التدريس، نصائح المراجعة والتوجيهات البيداغوجية مع مجتمع الأولياء.') }}
                  </p>
                </div>
                <button
                  (click)="store.setRole('editor')"
                  class="bg-[#23845B] hover:bg-[#1C6949] text-white font-semibold text-xs px-4 py-2.5 rounded-[10px] flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto">
                  <span class="material-icons text-sm">edit_note</span> {{ lang.t('writeArticleBtn') }}
                </button>
              </div>

              <div class="grid md:grid-cols-2 gap-5">
                @for (post of store.blogPosts(); track post.id) {
                  <div class="bg-[#F7F9FB] dark:bg-[#152737] rounded-[20px] p-6 border border-[#E3ECF2] dark:border-[#1A3145] flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
                    <div class="space-y-3">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="bg-[#23845B]/10 text-[#23845B] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            {{ post.subject || 'Pédagogie' }}
                          </span>
                          @if (post.grade) {
                            <span class="bg-[#E0AA32]/15 text-[#9E6A00] dark:text-[#E0AA32] text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {{ post.grade }}
                            </span>
                          }
                        </div>
                        <span class="text-[11px] text-[#627D98] dark:text-[#8CA9C4] flex items-center gap-1">
                          <span class="material-icons text-xs">schedule</span>
                          {{ post.readTimeMinutes }} min {{ lang.tr('de lecture', 'قراءة') }}
                        </span>
                      </div>

                      <h4 class="font-display font-semibold text-[#102A43] dark:text-white text-base leading-snug">
                        {{ post.title }}
                      </h4>

                      <p class="text-xs text-[#486581] dark:text-[#8CA9C4] leading-relaxed line-clamp-3">
                        {{ post.excerpt }}
                      </p>

                      <!-- Tags -->
                      <div class="flex flex-wrap gap-1.5 pt-1">
                        @for (tag of post.tags; track tag) {
                          <span class="text-[10px] bg-white dark:bg-[#0E1D2A] text-[#627D98] dark:text-[#8CA9C4] px-2 py-0.5 rounded-md border border-[#E3ECF2] dark:border-[#1A3145]">
                            #{{ tag }}
                          </span>
                        }
                      </div>
                    </div>

                    <!-- Post Footer -->
                    <div class="pt-4 border-t border-[#E3ECF2] dark:border-[#1A3145] flex items-center justify-between gap-3 text-xs">
                      <div class="flex items-center gap-3">
                        <button
                          (click)="store.likeBlogPost(post.id)"
                          class="flex items-center gap-1 text-[#D64545] font-semibold hover:opacity-80 cursor-pointer bg-white dark:bg-[#0E1D2A] px-2.5 py-1 rounded-full border border-[#E3ECF2] dark:border-[#1A3145]">
                          <span class="material-icons text-sm">favorite</span>
                          <span>{{ post.likesCount }}</span>
                        </button>
                        <span class="text-[#627D98] dark:text-[#8CA9C4] flex items-center gap-1 font-medium">
                          <span class="material-icons text-sm">chat_bubble_outline</span>
                          {{ post.comments.length }} {{ lang.tr('commentaires', 'تعليقات') }}
                        </span>
                      </div>

                      <button
                        (click)="selectedArticleDetail.set(post)"
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

          <!-- TAB 3: PARENT Q&A INBOX -->
          @if (activeTab() === 'qa') {
            <div class="space-y-5">
              <div>
                <h3 class="font-display font-semibold text-[#102A43] dark:text-white text-base">
                  {{ lang.t('tabTeacherQA') }}
                </h3>
                <p class="text-xs text-[#486581] dark:text-[#8CA9C4]">
                  {{ lang.tr("Consultez les demandes de soutien et questions des parents, et répondez-y en joignant des fiches d'exercices adaptées.", 'تصفح استفسارات الأولياء وطلبات الدعم مع إمكانية إرفاق وثيقة مراجعة جاهزة للطباعة.') }}
                </p>
              </div>

              <div class="space-y-4">
                @for (thread of store.questionThreads(); track thread.id) {
                  <div class="bg-[#F7F9FB] dark:bg-[#152737] rounded-[20px] p-6 border border-[#E3ECF2] dark:border-[#1A3145] space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3ECF2] dark:border-[#1A3145] pb-3">
                      <div class="space-y-1">
                        <div class="flex items-center gap-2">
                          <span class="bg-[#007CC2]/10 text-[#007CC2] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            {{ thread.subject }}
                          </span>
                          <span class="bg-[#E0AA32]/15 text-[#9E6A00] dark:text-[#E0AA32] text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {{ thread.grade }}
                          </span>
                          <span class="text-[11px] text-[#627D98] dark:text-[#8CA9C4] font-medium">
                            • {{ thread.parentName }} • {{ thread.createdAt }}
                          </span>
                        </div>
                        <h4 class="font-display font-semibold text-[#102A43] dark:text-white text-base">{{ thread.title }}</h4>
                      </div>

                      <button
                        (click)="replyingThread.set(thread)"
                        class="bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold text-xs px-3.5 py-2 rounded-[10px] flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto">
                        <span class="material-icons text-sm">reply</span>
                        {{ lang.t('replyToQuestionBtn') }}
                      </button>
                    </div>

                    <!-- Question Body -->
                    <p class="text-xs text-[#334E68] dark:text-[#D7E7F2] bg-white dark:bg-[#0E1D2A] p-4 rounded-[14px] border border-[#E3ECF2] dark:border-[#1A3145] leading-relaxed">
                      {{ thread.content }}
                    </p>

                    <!-- Existing Answers -->
                    @if (thread.answers.length > 0) {
                      <div class="space-y-2 pt-1">
                        <p class="text-[11px] font-semibold text-[#102A43] dark:text-white flex items-center gap-1">
                          <span class="material-icons text-xs text-[#23845B]">verified</span>
                          {{ lang.tr('Réponses des enseignants :', 'إجابات الإطار التربوي:') }}
                        </p>

                        @for (ans of thread.answers; track ans.id) {
                          <div class="bg-[#E8F6EF] dark:bg-[#153B2D]/40 rounded-[14px] p-4 border border-[#23845B]/20 space-y-2 text-xs">
                            <div class="flex items-center justify-between">
                              <div class="flex items-center gap-2">
                                <span class="font-semibold text-[#102A43] dark:text-white">{{ ans.teacherName }}</span>
                                <span class="text-[10px] bg-[#23845B] text-white px-2 py-0.5 rounded-full font-medium">
                                  {{ ans.teacherTitle }}
                                </span>
                              </div>
                              <span class="text-[10px] text-[#627D98] dark:text-[#8CA9C4]">{{ ans.createdAt }}</span>
                            </div>

                            <p class="text-[#102A43] dark:text-white leading-relaxed">{{ ans.content }}</p>

                            @if (ans.attachedDocTitle) {
                              <div class="inline-flex items-center gap-2 bg-white dark:bg-[#0E1D2A] text-[#007CC2] p-2.5 rounded-[10px] border border-[#007CC2]/30 font-medium text-[11px]">
                                <span class="material-icons text-sm text-[#007CC2]">attach_file</span>
                                <span>{{ lang.t('attachedDocument') }} : <strong class="text-[#102A43] dark:text-white">{{ ans.attachedDocTitle }}</strong></span>
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
          @if (activeTab() === 'announcements') {
            <div class="space-y-5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 class="font-display font-semibold text-[#102A43] dark:text-white text-base">
                    {{ lang.tr('Annonces diffusées aux parents', 'البلاغات والإشعارات الرسمية للأولياء') }}
                  </h3>
                  <p class="text-xs text-[#486581] dark:text-[#8CA9C4]">
                    {{ lang.tr('Chaque annonce est datée, archivée et traçable avec accusé de lecture.', 'كل إعلان مؤرخ وموثق مع إمكانية متابعة نسبة اطلاع الأولياء.') }}
                  </p>
                </div>
                <button
                  (click)="openModal('announcement')"
                  class="bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold text-xs px-4 py-2.5 rounded-[10px] flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto">
                  <span class="material-icons text-sm">add</span> {{ lang.t('addAnnouncementBtn') }}
                </button>
              </div>

              <div class="space-y-4">
                @for (a of store.classAnnouncements(); track a.id) {
                  <div class="bg-[#F7F9FB] dark:bg-[#152737] rounded-[18px] p-5 border border-[#E3ECF2] dark:border-[#1A3145] space-y-3">
                    <div class="flex items-start justify-between gap-4">
                      <div>
                        <div class="flex items-center gap-2">
                          <h4 class="font-display font-semibold text-[#102A43] dark:text-white text-sm">{{ a.title }}</h4>
                          @if (a.isPinned) {
                            <span class="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span class="material-icons text-[12px]">push_pin</span>
                              {{ lang.tr('Épinglé', 'مثبت') }}
                            </span>
                          }
                        </div>
                        <p class="text-[11px] text-[#627D98] dark:text-[#8CA9C4] font-medium mt-0.5">{{ a.teacherName }} • {{ a.date }}</p>
                      </div>

                      <span [class]="getCategoryBadgeClass(a.category)" class="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {{ a.category }}
                      </span>
                    </div>

                    <p class="text-xs text-[#334E68] dark:text-[#D7E7F2] leading-relaxed whitespace-pre-line bg-white dark:bg-[#0E1D2A] p-4 rounded-[12px] border border-[#E3ECF2] dark:border-[#1A3145]">
                      {{ a.content }}
                    </p>

                    <div class="flex items-center justify-between text-xs text-[#627D98] dark:text-[#8CA9C4] pt-1">
                      <span class="flex items-center gap-1 text-[#23845B] font-medium">
                        <span class="material-icons text-sm">check_circle</span>
                        {{ a.confirmedByParentsCount }} {{ lang.tr('parents ont confirmé la lecture', 'أولياء أكدوا اطلاعهم') }}
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

    <!-- MODAL 1: AI ASSISTANT -->
    @if (modalType() === 'ai') {
      <div class="fixed inset-0 z-50 bg-[#0B2947]/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white dark:bg-[#0E1D2A] rounded-[24px] max-w-2xl w-full p-6 space-y-5 border border-[#E3ECF2] dark:border-[#1A3145] shadow-xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#E3ECF2] dark:border-[#1A3145] pb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-[#E0AA32] text-2xl">auto_awesome</span>
              <div>
                <h3 class="font-display font-semibold text-[#102A43] dark:text-white text-lg">
                  {{ lang.tr('Assistant Pédagogique IA Tunisie', 'المساعد البيداغوجي الذكي في تونس') }}
                </h3>
                <p class="text-xs text-[#627D98] dark:text-[#8CA9C4]">
                  {{ lang.tr("Générez un exercice ou une évaluation alignée au programme officiel tunisien.", 'توليد تمارين واختبارات متطابقة مع البرنامج الرسمي التونسي.') }}
                </p>
              </div>
            </div>
            <button (click)="closeModal()" class="text-[#627D98] hover:text-[#102A43] dark:hover:text-white cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-4 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="ai-subject" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                  {{ lang.tr('Matière', 'المادة') }}
                </label>
                <select
                  id="ai-subject"
                  [value]="aiFormSubject()"
                  (change)="onAiSubjectChange($event)"
                  class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2.5 text-[#102A43] dark:text-white outline-none">
                  <option value="Mathématiques">Mathématiques / الرياضيات</option>
                  <option value="Français">Français / الفرنسية</option>
                  <option value="اللغة العربية">اللغة العربية</option>
                  <option value="Éveil Scientifique">Éveil Scientifique / الإيقاظ العلمي</option>
                </select>
              </div>

              <div>
                <label for="ai-diff" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                  {{ lang.tr('Difficulté', 'درجة الصعوبة') }}
                </label>
                <select
                  id="ai-diff"
                  [value]="aiFormDifficulty()"
                  (change)="onAiDifficultyChange($event)"
                  class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2.5 text-[#102A43] dark:text-white outline-none">
                  <option value="Facile">Facile / سهل</option>
                  <option value="Moyen">Moyen / متوسط</option>
                  <option value="Avancé">Avancé (Concours 6ème) / متقدم (مناظرة السادسة)</option>
                </select>
              </div>
            </div>

            <div>
              <label for="ai-topic" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                {{ lang.tr('Thème / Chapitre précis', 'المحور أو الدرس') }}
              </label>
              <input
                id="ai-topic"
                type="text"
                [value]="aiFormTopic()"
                (input)="onAiTopicInput($event)"
                placeholder="Ex: La multiplication, الجملة الاسمية..."
                class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2.5 text-[#102A43] dark:text-white outline-none" />
            </div>

            <button
              [disabled]="isAiLoading()"
              (click)="generateAiExercise()"
              class="w-full bg-[#E0AA32] hover:bg-[#D19A24] text-[#102A43] font-semibold py-3 rounded-[10px] flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50">
              @if (isAiLoading()) {
                <span class="material-icons animate-spin text-sm">sync</span>
                <span>{{ lang.tr("Génération par l'IA Gemini en cours...", 'جاري التوليد باستخدام الذكاء الاصطناعي...') }}</span>
              } @else {
                <span class="material-icons text-sm">auto_awesome</span>
                <span>{{ lang.tr("Générer l'exercice et la solution", 'توليد التمرين والإصلاح') }}</span>
              }
            </button>

            @if (generatedAiResult(); as result) {
              <div class="bg-[#F7F9FB] dark:bg-[#152737] rounded-[18px] p-4 border border-[#E3ECF2] dark:border-[#1A3145] space-y-3 mt-4">
                <div class="flex items-center justify-between">
                  <h4 class="font-display font-semibold text-[#102A43] dark:text-white text-sm">{{ result.title }}</h4>
                  <span class="bg-[#23845B]/10 text-[#23845B] font-semibold px-2 py-0.5 rounded-md text-[10px]">
                    {{ lang.tr('Généré avec succès', 'تم التوليد بنجاح') }}
                  </span>
                </div>

                <p class="text-[#102A43] dark:text-white bg-white dark:bg-[#0E1D2A] p-3 rounded-[10px] border border-[#E3ECF2] dark:border-[#1A3145] leading-relaxed font-mono text-[11px]">
                  {{ result.promptText }}
                </p>

                <div class="bg-[#23845B]/10 p-3 rounded-[10px] text-[#23845B]">
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
      <div class="fixed inset-0 z-50 bg-[#0B2947]/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white dark:bg-[#0E1D2A] rounded-[24px] max-w-lg w-full p-6 space-y-4 border border-[#E3ECF2] dark:border-[#1A3145] shadow-xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#E3ECF2] dark:border-[#1A3145] pb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-[#007CC2]">post_add</span>
              <h3 class="font-display font-semibold text-[#102A43] dark:text-white text-base">
                {{ lang.tr('Publier un Document ou Examen A4', 'نشر وثيقة، تلخيص أو امتحان A4') }}
              </h3>
            </div>
            <button (click)="closeModal()" class="text-[#627D98] hover:text-[#102A43] dark:hover:text-white cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <!-- VPS Direct Upload & AI Multimodal Scanner Zone -->
            <div class="border-2 border-dashed border-[#007CC2]/40 rounded-[18px] p-4 text-center bg-[#F3FAFD] dark:bg-[#102A43]/40 space-y-2">
              <label for="file-upload" class="cursor-pointer block">
                <div class="w-12 h-12 rounded-full bg-[#007CC2]/10 text-[#007CC2] flex items-center justify-center mx-auto mb-2">
                  <span class="material-icons text-2xl">document_scanner</span>
                </div>
                <h4 class="text-xs font-bold text-[#102A43] dark:text-white">
                  {{ lang.tr('Numériser un devoir / capture d\'écran / PDF', 'مسح ضوئي للامتحان أو الصورة أو PDF') }}
                </h4>
                <p class="text-[11px] text-[#486581] dark:text-[#8CA9C4] mt-0.5">
                  {{ isAiScanning() ? lang.tr('Analyse OCR & classification par Gemini 2.5 en cours...', 'جاري الفرز والتحليل الذكي بواسطة الذكاء الاصطناعي...') : (isUploading() ? lang.tr('Envoi vers le VPS...', 'جاري الرفع إلى الخادم...') : lang.tr('L\'IA extrait le texte, classifie la matière/niveau et applique votre filigrane officiel', 'يقوم الذكاء الاصطناعي باستخراج النص وتصنيف المادة وتطبيق علامتك المائية')) }}
                </p>
                <input
                  id="file-upload"
                  type="file"
                  (change)="handleCourseFileUpload($event)"
                  class="hidden"
                  accept="application/pdf,image/*" />
              </label>

              @if (isAiScanning()) {
                <div class="flex items-center justify-center gap-2 text-xs text-[#007CC2] font-semibold py-1 animate-pulse">
                  <span class="material-icons animate-spin text-sm">sync</span>
                  <span>{{ lang.tr('OCR & Classification intelligente...', 'معالجة ضوئية وفهرسة...') }}</span>
                </div>
              }

              @if (aiDetectedBadge()) {
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-500/20">
                  <span class="material-icons text-xs">auto_awesome</span>
                  <span>{{ aiDetectedBadge() }}</span>
                </div>
              }

              @if (uploadedFileName()) {
                <span class="text-[11px] text-[#23845B] font-semibold block">✓ {{ uploadedFileName() }}</span>
              }
            </div>

            <div>
              <label for="course-title" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                {{ lang.tr('Titre officiel du document', 'العنوان الرسمي للوثيقة') }} *
              </label>
              <input
                id="course-title"
                type="text"
                [value]="newCourseTitle()"
                (input)="newCourseTitle.set($any($event.target).value)"
                placeholder="Ex: Devoir de Contrôle N°1 : Mathématiques et Géométrie"
                class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2.5 text-[#102A43] dark:text-white outline-none font-semibold" />
            </div>

            <!-- 4-Facet Strict Classification Matrix to Protect Library -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label for="course-subj" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                  {{ lang.tr('Matière', 'المادة') }} *
                </label>
                <select
                  id="course-subj"
                  [value]="newCourseSubject()"
                  (change)="newCourseSubject.set($any($event.target).value)"
                  class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2 text-[#102A43] dark:text-white outline-none">
                  <option value="Mathématiques">Mathématiques / الرياضيات</option>
                  <option value="Français">Français / الفرنسية</option>
                  <option value="اللغة العربية">اللغة العربية</option>
                  <option value="Éveil Scientifique">Éveil Scientifique / الإيقاظ</option>
                  <option value="Histoire & Géographie">Histoire & Géo / التاريخ والجغرافيا</option>
                  <option value="Anglais">Anglais / الإنجليزية</option>
                </select>
              </div>

              <div>
                <label for="course-grade" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                  {{ lang.tr('Niveau', 'المستوى') }} *
                </label>
                <select
                  id="course-grade"
                  [value]="newCourseGrade()"
                  (change)="newCourseGrade.set($any($event.target).value)"
                  class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2 text-[#102A43] dark:text-white outline-none">
                  <option value="1ère Année">1ère Année / السنة الأولى</option>
                  <option value="2ème Année">2ème Année / السنة الثانية</option>
                  <option value="3ème Année">3ème Année / السنة الثالثة</option>
                  <option value="4ème Année">4ème Année / السنة الرابعة</option>
                  <option value="5ème Année">5ème Année / السنة الخامسة</option>
                  <option value="6ème Année">6ème Année / السنة السادسة</option>
                </select>
              </div>

              <div>
                <label for="course-trim" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                  {{ lang.tr('Trimestre', 'الثلاثي') }} *
                </label>
                <select
                  id="course-trim"
                  [value]="newCourseTrimester()"
                  (change)="newCourseTrimester.set($any($event.target).value)"
                  class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2 text-[#102A43] dark:text-white outline-none">
                  <option value="Trimestre 1">Trimestre 1 / الثلاثي الأول</option>
                  <option value="Trimestre 2">Trimestre 2 / الثلاثي الثاني</option>
                  <option value="Trimestre 3">Trimestre 3 / الثلاثي الثالث</option>
                </select>
              </div>

              <div>
                <label for="course-doctype" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                  {{ lang.tr('Type', 'النوع') }} *
                </label>
                <select
                  id="course-doctype"
                  [value]="newCourseDocType()"
                  (change)="newCourseDocType.set($any($event.target).value)"
                  class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2 text-[#102A43] dark:text-white outline-none">
                  <option value="Devoir de Contrôle">Devoir de Contrôle / مراقبة</option>
                  <option value="Devoir de Synthèse">Devoir de Synthèse / تأليفي</option>
                  <option value="Fiche de Révision">Fiche de Révision / تقييم</option>
                  <option value="Série d'Exercices">Série d'Exercices / تمارين</option>
                </select>
              </div>
            </div>

            <div>
              <label for="course-summary" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                {{ lang.tr('Résumé pédagogique', 'ملخص تربوي موجز') }}
              </label>
              <input
                id="course-summary"
                type="text"
                [value]="newCourseSummary()"
                (input)="newCourseSummary.set($any($event.target).value)"
                placeholder="Ex: Fiche d'exercices et problèmes d'évaluation pour le 1er trimestre."
                class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2.5 text-[#102A43] dark:text-white outline-none" />
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label for="course-content" class="block font-semibold text-[#102A43] dark:text-white">
                  {{ lang.tr('Contenu A4 imprimable & transcrit par OCR', 'المحتوى المستخرج القابل للطباعة A4') }}
                </label>
                <span class="text-[10px] text-[#829AB1]">
                  {{ lang.tr('Format Markdown supporté', 'يدعم التنسيق المتقدم') }}
                </span>
              </div>
              <textarea
                id="course-content"
                [value]="newCourseContent()"
                (input)="newCourseContent.set($any($event.target).value)"
                rows="5"
                placeholder="Rédigez ou laissez l'IA transcrire automatiquement les exercices depuis votre photo..."
                class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2.5 text-[#102A43] dark:text-white outline-none font-mono text-[11px] leading-relaxed"></textarea>
            </div>

            <!-- Identity Attribution & Watermark Badge Preview -->
            <div class="p-3 bg-[#E8F5FC]/80 dark:bg-[#102A43]/50 border border-[#007CC2]/20 rounded-[12px] flex items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-2">
                <span class="material-icons text-base text-[#007CC2]">verified_user</span>
                <div>
                  <p class="font-bold text-[#102A43] dark:text-white">
                    {{ getTeacherName() }}
                  </p>
                  <p class="text-[10px] text-[#486581] dark:text-[#8CA9C4]">
                    {{ getTeacherSchool() }} • {{ lang.tr('Filigrane officiel appliqué automatiquement', 'العلامة المائية تطبق تلقائياً') }}
                  </p>
                </div>
              </div>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#007CC2] text-white">
                A4 Impress
              </span>
            </div>

            <button
              (click)="submitCourse()"
              class="w-full bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold py-3 rounded-[10px] cursor-pointer shadow-sm">
              {{ lang.tr('Publier le Document A4 Certifié', 'نشر وتوثيق الوثيقة الرسمية') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 3: COMPOSE BLOG ARTICLE -->
    @if (modalType() === 'blogArticle') {
      <div class="fixed inset-0 z-50 bg-[#0B2947]/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white dark:bg-[#0E1D2A] rounded-[24px] max-w-lg w-full p-6 space-y-4 border border-[#E3ECF2] dark:border-[#1A3145] shadow-xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#E3ECF2] dark:border-[#1A3145] pb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-[#23845B]">edit_note</span>
              <h3 class="font-display font-semibold text-[#102A43] dark:text-white text-base">
                {{ lang.t('writeArticleBtn') }}
              </h3>
            </div>
            <button (click)="closeModal()" class="text-[#627D98] hover:text-[#102A43] dark:hover:text-white cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label for="article-title" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                {{ lang.t('articleTitle') }} *
              </label>
              <input
                id="article-title"
                type="text"
                [value]="newArticleTitle()"
                (input)="newArticleTitle.set($any($event.target).value)"
                placeholder="Ex: 5 conseils pour maîtriser la division euclidienne"
                class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2.5 text-[#102A43] dark:text-white outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="article-subj" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                  {{ lang.t('articleCategory') }}
                </label>
                <select
                  id="article-subj"
                  [value]="newArticleSubject()"
                  (change)="newArticleSubject.set($any($event.target).value)"
                  class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2.5 text-[#102A43] dark:text-white outline-none">
                  <option value="Mathématiques">Mathématiques / الرياضيات</option>
                  <option value="Français">Français / الفرنسية</option>
                  <option value="اللغة العربية">اللغة العربية</option>
                  <option value="Éveil Scientifique">Éveil Scientifique / الإيقاظ العلمي</option>
                </select>
              </div>

              <div>
                <label for="article-grade" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                  {{ lang.tr('Niveau ciblé', 'المستوى المستهدف') }}
                </label>
                <select
                  id="article-grade"
                  [value]="newArticleGrade()"
                  (change)="newArticleGrade.set($any($event.target).value)"
                  class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2.5 text-[#102A43] dark:text-white outline-none">
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
              <label for="article-excerpt" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                {{ lang.tr("Résumé introductif (visible dans l'aperçu)", 'مقدمة المقال') }}
              </label>
              <input
                id="article-excerpt"
                type="text"
                [value]="newArticleExcerpt()"
                (input)="newArticleExcerpt.set($any($event.target).value)"
                placeholder="Ex: Une méthode simple en 3 étapes pour aider votre enfant à la maison..."
                class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2.5 text-[#102A43] dark:text-white outline-none" />
            </div>

            <div>
              <label for="article-content" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                {{ lang.t('articleContent') }} *
              </label>
              <textarea
                id="article-content"
                [value]="newArticleContent()"
                (input)="newArticleContent.set($any($event.target).value)"
                rows="6"
                placeholder="Rédigez vos explications et conseils pédagogiques détaillés..."
                class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2.5 text-[#102A43] dark:text-white outline-none leading-relaxed"></textarea>
            </div>

            <div>
              <label for="article-tags" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                {{ lang.tr('Mots-clés (séparés par des virgules)', 'الكلمات المفتاحية (مفصولة بفاصلة)') }}
              </label>
              <input
                id="article-tags"
                type="text"
                [value]="newArticleTags()"
                (input)="newArticleTags.set($any($event.target).value)"
                placeholder="Ex: Révision, Mathématiques, Astuces"
                class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2.5 text-[#102A43] dark:text-white outline-none" />
            </div>

            <button
              (click)="submitBlogArticle()"
              class="w-full bg-[#23845B] hover:bg-[#1C6949] text-white font-semibold py-3 rounded-[10px] cursor-pointer shadow-sm">
              {{ lang.t('publishArticleBtn') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 4: REPLY TO PARENT QUESTION -->
    @if (replyingThread(); as thread) {
      <div class="fixed inset-0 z-50 bg-[#0B2947]/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white dark:bg-[#0E1D2A] rounded-[24px] max-w-lg w-full p-6 space-y-4 border border-[#E3ECF2] dark:border-[#1A3145] shadow-xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#E3ECF2] dark:border-[#1A3145] pb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-[#007CC2]">reply</span>
              <h3 class="font-display font-semibold text-[#102A43] dark:text-white text-base">
                {{ lang.t('replyToQuestionBtn') }}
              </h3>
            </div>
            <button (click)="replyingThread.set(null)" class="text-[#627D98] hover:text-[#102A43] dark:hover:text-white cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="bg-[#F7F9FB] dark:bg-[#152737] p-3.5 rounded-[12px] border border-[#E3ECF2] dark:border-[#1A3145] text-xs">
            <p class="font-semibold text-[#102A43] dark:text-white">{{ thread.title }}</p>
            <p class="text-[#627D98] dark:text-[#8CA9C4] mt-1">{{ thread.content }}</p>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label for="reply-content" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                {{ lang.tr('Votre réponse pédagogique', 'إجابتك وتوجيهك التربوي') }} *
              </label>
              <textarea
                id="reply-content"
                [value]="replyContent()"
                (input)="replyContent.set($any($event.target).value)"
                rows="4"
                placeholder="Rédigez votre réponse claire et bienveillante..."
                class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2.5 text-[#102A43] dark:text-white outline-none"></textarea>
            </div>

            <div>
              <label for="reply-attach" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                {{ lang.t('attachDocLabel') }}
              </label>
              <select
                id="reply-attach"
                [value]="selectedAttachCourseId()"
                (change)="selectedAttachCourseId.set($any($event.target).value)"
                class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2.5 text-[#102A43] dark:text-white outline-none">
                <option value="">-- {{ lang.t('noAttachment') }} --</option>
                @for (c of store.courses(); track c.id) {
                  <option [value]="c.id">{{ c.title }} ({{ c.subject }})</option>
                }
              </select>
            </div>

            <button
              (click)="submitAnswerToQuestion()"
              class="w-full bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold py-3 rounded-[10px] cursor-pointer shadow-sm">
              {{ lang.tr('Valider et Envoyer la Réponse', 'إرسال الإجابة الرسمية') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 5: CREATE ANNOUNCEMENT -->
    @if (modalType() === 'announcement') {
      <div class="fixed inset-0 z-50 bg-[#0B2947]/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white dark:bg-[#0E1D2A] rounded-[24px] max-w-lg w-full p-6 space-y-4 border border-[#E3ECF2] dark:border-[#1A3145] shadow-xl">
          <div class="flex items-center justify-between border-b border-[#E3ECF2] dark:border-[#1A3145] pb-3">
            <h3 class="font-display font-semibold text-[#102A43] dark:text-white text-base">
              {{ lang.tr('Publier une Annonce Officielle', 'نشر إعلان رسمي') }}
            </h3>
            <button (click)="closeModal()" class="text-[#627D98] hover:text-[#102A43] dark:hover:text-white cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label for="announce-title" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                {{ lang.tr("Titre de l'annonce", 'عنوان الإعلان') }}
              </label>
              <input
                id="announce-title"
                type="text"
                [value]="newAnnounceTitle()"
                (input)="newAnnounceTitle.set($any($event.target).value)"
                placeholder="Ex: 📌 Devoir de contrôle à venir"
                class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2.5 text-[#102A43] dark:text-white outline-none" />
            </div>

            <div>
              <label for="announce-cat" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                {{ lang.tr('Catégorie', 'الصنف') }}
              </label>
              <select
                id="announce-cat"
                [value]="newAnnounceCategory()"
                (change)="newAnnounceCategory.set($any($event.target).value)"
                class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2.5 text-[#102A43] dark:text-white outline-none">
                <option value="exam">Examen / Devoir de Synthèse - فرض تأليفي</option>
                <option value="homework">Devoir à domicile - واجب منزلي</option>
                <option value="supply">Fournitures & Matériel - أدوات ومستلزمات</option>
                <option value="urgent">Urgent - عاجل</option>
                <option value="general">Général - عام</option>
              </select>
            </div>

            <div>
              <label for="announce-content" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                {{ lang.tr('Contenu détaillé', 'تفاصيل الإعلان') }}
              </label>
              <textarea
                id="announce-content"
                [value]="newAnnounceContent()"
                (input)="newAnnounceContent.set($any($event.target).value)"
                rows="4"
                placeholder="Rédigez clairement votre information..."
                class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2.5 text-[#102A43] dark:text-white outline-none"></textarea>
            </div>

            <button
              (click)="submitAnnouncement()"
              class="w-full bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold py-2.5 rounded-[10px] cursor-pointer">
              {{ lang.tr("Diffuser l'Annonce", 'نشر الإعلان الآن') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 6: A4 PRINT & PDF BOOK MODAL -->
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

              <!-- Official Ministry Header -->
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

              <!-- Course Content -->
              <div class="text-xs leading-relaxed whitespace-pre-line py-3 relative z-10 text-[#102A43]">
                {{ c.content }}
              </div>

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

    <!-- MODAL 7: READ ARTICLE DETAIL -->
    @if (selectedArticleDetail(); as post) {
      <div class="fixed inset-0 z-50 bg-[#0B2947]/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white dark:bg-[#0E1D2A] rounded-[24px] max-w-2xl w-full p-6 space-y-4 border border-[#E3ECF2] dark:border-[#1A3145] shadow-xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#E3ECF2] dark:border-[#1A3145] pb-3">
            <div class="flex items-center gap-2">
              <span class="bg-[#23845B]/10 text-[#23845B] text-xs font-bold px-2.5 py-0.5 rounded-full">
                {{ post.subject || 'Pédagogie' }}
              </span>
              <span class="text-xs text-[#627D98] dark:text-[#8CA9C4]">{{ post.publishedAt }}</span>
            </div>
            <button (click)="selectedArticleDetail.set(null)" class="text-[#627D98] hover:text-[#102A43] dark:hover:text-white cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div>
            <h3 class="font-display font-semibold text-[#102A43] dark:text-white text-xl">{{ post.title }}</h3>
            <p class="text-xs text-[#23845B] font-medium mt-1">{{ post.authorName }} — {{ post.authorTitle }}</p>
          </div>

          <div class="prose prose-sm dark:prose-invert max-w-none text-xs text-[#334E68] dark:text-[#D7E7F2] leading-relaxed whitespace-pre-line bg-[#F7F9FB] dark:bg-[#152737] p-5 rounded-[14px] border border-[#E3ECF2] dark:border-[#1A3145]">
            {{ post.content }}
          </div>

          <!-- Comments on article -->
          <div class="space-y-3 pt-2">
            <h4 class="font-display font-semibold text-xs text-[#102A43] dark:text-white">
              {{ lang.t('commentsCount') }} ({{ post.comments.length }})
            </h4>

            <div class="space-y-2">
              @for (comm of post.comments; track comm.id) {
                <div class="bg-[#F7F9FB] dark:bg-[#152737] p-3 rounded-[10px] text-xs border border-[#E3ECF2] dark:border-[#1A3145]">
                  <div class="flex items-center justify-between">
                    <span class="font-semibold text-[#102A43] dark:text-white">{{ comm.authorName }}</span>
                    <span class="text-[10px] text-[#627D98] dark:text-[#8CA9C4]">{{ comm.createdAt }}</span>
                  </div>
                  <p class="text-[#334E68] dark:text-[#D7E7F2] mt-1">{{ comm.content }}</p>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 8: TEACHER CREDENTIALS & PROFILE DRAWER -->
    @if (teacherProfileModal()) {
      <div class="fixed inset-0 z-50 bg-[#0B2947]/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white dark:bg-[#0E1D2A] rounded-[24px] max-w-md w-full p-6 space-y-5 border border-[#E3ECF2] dark:border-[#1A3145] shadow-xl relative">
          <div class="flex items-center justify-between border-b border-[#E3ECF2] dark:border-[#1A3145] pb-3">
            <span class="inline-flex items-center gap-1 text-[#23845B] font-semibold text-xs uppercase tracking-wider bg-[#23845B]/10 px-3 py-1 rounded-full">
              <span class="material-icons text-xs">verified</span>
              {{ lang.tr('Enseignante Agréée Ministère', 'معلمة معتمدة من وزارة التربية') }}
            </span>
            <button (click)="teacherProfileModal.set(false)" class="text-[#627D98] hover:text-[#102A43] dark:hover:text-white cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-[#007CC2] text-white flex items-center justify-center text-xl font-bold">
              م
            </div>
            <div>
              <h3 class="font-display font-semibold text-[#102A43] dark:text-white text-base">{{ lang.tr('Enseignant Certifié', 'معلم معتمد') }}</h3>
              <p class="text-xs text-[#627D98] dark:text-[#8CA9C4] font-medium">{{ lang.tr('Enseignante Principale', 'أستاذ تعليم ابتدائي أول') }}</p>
              <p class="text-[11px] text-[#007CC2] font-semibold mt-0.5">École Primaire Habib Bourguiba, Ariana</p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 text-center p-3 bg-[#F7F9FB] dark:bg-[#152737] rounded-[14px] border border-[#E3ECF2] dark:border-[#1A3145]">
            <div>
              <p class="font-display font-semibold text-[#102A43] dark:text-white text-sm">{{ store.courses().length }}</p>
              <p class="text-[10px] text-[#627D98] dark:text-[#8CA9C4]">Fiches A4</p>
            </div>
            <div>
              <p class="font-display font-semibold text-[#102A43] dark:text-white text-sm">{{ store.blogPosts().length }}</p>
              <p class="text-[10px] text-[#627D98] dark:text-[#8CA9C4]">Articles</p>
            </div>
            <div>
              <p class="font-display font-semibold text-[#D19A24] text-sm flex items-center justify-center gap-1">
                <span class="material-icons text-sm text-[#E0AA32]">star</span>4.9
              </p>
              <p class="text-[10px] text-[#627D98] dark:text-[#8CA9C4]">128 avis</p>
            </div>
          </div>

          <div class="space-y-2 text-xs text-[#334E68] dark:text-[#D7E7F2]">
            <h4 class="font-semibold text-[#102A43] dark:text-white">{{ lang.tr('Filigrane Officiel :', 'العلامة المائية المعتمدة :') }}</h4>
            <div class="p-3 bg-[#007CC2]/10 border border-[#007CC2]/20 rounded-[10px] font-mono text-[11px] text-[#007CC2] flex items-center justify-between">
              <span>Madrasati TN — Document Certifié</span>
              <span class="material-icons text-sm">lock</span>
            </div>
          </div>

          <button
            (click)="teacherProfileModal.set(false)"
            class="w-full bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold py-2.5 rounded-[10px] text-xs cursor-pointer shadow-sm">
            {{ lang.tr('Fermer', 'إغلاق') }}
          </button>
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

  readonly activeTab = signal<'courses' | 'blog' | 'qa' | 'announcements'>('courses');
  readonly modalType = signal<'none' | 'announcement' | 'course' | 'blogArticle' | 'ai'>('none');
  
  readonly selectedCourseDetail = signal<Course | null>(null);
  readonly selectedArticleDetail = signal<BlogPost | null>(null);
  readonly printModalCourse = signal<Course | null>(null);
  readonly teacherProfileModal = signal<boolean>(false);
  readonly replyingThread = signal<QuestionThread | null>(null);

  // Announcement Form
  readonly newAnnounceTitle = signal('📌 Rappel : Devoir de Mathématiques');
  readonly newAnnounceCategory = signal<'exam' | 'homework' | 'supply' | 'urgent' | 'general'>('homework');
  readonly newAnnounceContent = signal('N\'oubliez pas d\'effectuer la série N°3 sur la multiplication pour demain.');

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

  openModal(type: 'announcement' | 'course' | 'blogArticle' | 'ai') {
    this.modalType.set(type);
  }

  closeModal() {
    this.modalType.set('none');
    this.uploadedFileUrl.set(null);
    this.uploadedFileName.set(null);
    this.isAiScanning.set(false);
    this.aiDetectedBadge.set(null);
  }

  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'exam':
        return 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200';
      case 'homework':
        return 'bg-[#E0AA32]/10 text-[#9E6A00] dark:text-[#E0AA32] border border-[#E0AA32]/30';
      case 'supply':
        return 'bg-[#23845B]/10 text-[#23845B] border border-[#23845B]/30';
      case 'urgent':
        return 'bg-red-500 text-white font-bold';
      default:
        return 'bg-[#E3ECF2] dark:bg-[#1A3145] text-[#102A43] dark:text-white';
    }
  }

  getWhatsAppShareUrl(c: Course): string {
    const text = encodeURIComponent(`📘 Madrasati TN - ${c.title} (${c.subject} - ${c.grade || 'Primaire'})\nDocument conforme téléchargeable et imprimable sur la plateforme.`);
    return `https://api.whatsapp.com/send?text=${text}`;
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

  submitAnnouncement() {
    this.store.addAnnouncement({
      title: this.newAnnounceTitle(),
      category: this.newAnnounceCategory(),
      content: this.newAnnounceContent(),
      isPinned: this.newAnnounceCategory() === 'exam',
    });
    this.firebase.addNotification({
      type: this.newAnnounceCategory() === 'exam' ? 'exam' : 'announcement',
      title: this.newAnnounceTitle(),
      message: this.newAnnounceContent(),
      linkRole: 'parent',
      icon: this.newAnnounceCategory() === 'exam' ? 'event_note' : 'campaign',
    });
    this.closeModal();
  }

  async handleCourseFileUpload(event: Event) {
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

      // 1. Direct VPS disk storage
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
      }

      // 2. Multimodal OCR & Classification by Gemini 2.5 Flash
      const tagRes = await fetch('/api/ai/auto-tag-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      trimester: this.newCourseTrimester() as any,
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
    if (course?.pdfUrl && typeof window !== 'undefined') {
      window.open(course.pdfUrl, '_blank');
    } else if (typeof window !== 'undefined') {
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
}
