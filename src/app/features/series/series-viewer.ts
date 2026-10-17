import { ChangeDetectionStrategy, Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { createStudioSession, DRAFT_DOC_ID, EducationStore, LanguageService, PRIMARY_GRADES, Scene, SeriesDoc, SourceInput, SubjectName } from '@core';
import { SeriesPanelComponent, SourceInputComponent, STUDIO_BAR_BTN, StudioBarComponent, StudioSessionBannerComponent, nativeSharePost, joinDetails } from '@shared';

@Component({
  selector: 'app-series-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SeriesPanelComponent, SourceInputComponent, StudioBarComponent, StudioSessionBannerComponent],
  template: `
    <div class="w-full pb-16 space-y-5">
      <app-studio-bar
        [badge]="lang.tr('قصة الدرس المصورة', 'قصة الدرس المصورة')"
        icon="auto_stories"
        [heading]="(!isNew() && series()?.title) || lang.tr('Nouvelle histoire de leçon', 'قصة درس مصورة جديدة')"
        [details]="isNew() ? [] : [series()?.grade ? lang.translateGrade(series()?.grade ?? '') : '', series()?.subject ? lang.translateSubject(series()?.subject ?? '') : '']"
        [status]="session.status()"
        [busy]="session.busy()"
        [showSettings]="!isNew()"
        [settingsOpen]="panelOpen()"
        (settingsToggle)="settingsOpen.set(!settingsOpen())">
        @if (!isNew() && series() && !series()?.id) {
          <button type="button" (click)="saveDraft()" [class]="barBtn">
            <span class="material-icons text-base" aria-hidden="true">save</span>
            {{ lang.tr('Enregistrer dans mon compte', 'حفظ في حسابي') }}
          </button>
        }
        @if (!isNew() && series() && approved()) {
          <button
            type="button"
            (click)="showTeacherKey.set(!showTeacherKey())"
            [class]="showTeacherKey() ? 'bg-[#2D6A4F] text-[#FBF8F1] px-3 py-1.5 rounded-xl border border-[#2D6A4F] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer' : barBtn">
            <span class="material-icons text-base" aria-hidden="true">{{ showTeacherKey() ? 'visibility' : 'visibility_off' }}</span>
            {{ showTeacherKey() ? lang.tr('Masquer le corrigé', 'إخفاء ورقة الإصلاح') : lang.tr('Afficher le corrigé', 'ورقة الإصلاح (للمعلم)') }}
          </button>
          <button type="button" (click)="openProjector()" [class]="barBtn">
            <span class="material-icons text-base" aria-hidden="true">slideshow</span>
            {{ lang.tr('Mode Projecteur', 'عرض العاكس الضوئي') }}
          </button>
          <button type="button" (click)="printAll()" [class]="barBtn">
            <span class="material-icons text-base" aria-hidden="true">picture_as_pdf</span>
            {{ lang.tr('تحميل PDF (A4)', 'تحميل PDF (A4)') }}
          </button>
          <button type="button" (click)="shareSeries()" [class]="barBtn">
            <span class="material-icons text-base" aria-hidden="true">share</span>
            {{ lang.tr('Partager', 'مشاركة') }}
          </button>
        }
        @if (!isNew()) {
          <a routerLink="/series/new" [class]="barBtn">
            <span class="material-icons text-base" aria-hidden="true">add_circle_outline</span>
            {{ lang.tr('Nouvelle série', 'سلسلة جديدة') }}
          </a>
        }
      </app-studio-bar>

      <app-studio-session-banner [session]="session" />

      <div [class]="panelOpen() ? 'grid grid-cols-1 lg:grid-cols-[400px_minmax(0,1fr)] gap-6 items-start' : ''">
        @if (panelOpen()) {
          <aside id="studio-settings" class="no-print space-y-4 lg:sticky lg:top-4">
            <div class="px-1">
              <h2 class="font-display font-semibold text-lg text-[#14251D]">{{ lang.tr('قصة الدرس والأنشطة', 'قصة الدرس والأنشطة') }}</h2>
              <p class="text-sm text-[#5B6B60] mt-1">{{ lang.tr('Collez le texte du cours ou de lecture (arabe, français, histoire) : le scénario vous sera proposé avant génération.', 'ألصق نص الدرس أو قراءة الكتاب المدرسي: يُقترح عليك السيناريو والأنشطة للموافقة أولاً.') }}</p>
            </div>
            <app-source-input
              [initialInput]="prefill()"
              [allowedSubjects]="allowedSubjects"
              [busy]="session.busy()"
              [submitLabel]="lang.tr('Générer la قصة الدرس', 'توليد قصة الدرس')"
              (draftChange)="session.saveDraft($event)"
              (submitSource)="generate($event)"></app-source-input>
          </aside>
        }
        <div id="series-sheet" class="min-w-0 space-y-6 scroll-mt-4">
          @if (isNew()) {
            <!-- 3-step pedagogical onboarding hint: lesson -> scenes -> panels & activities -->
            <div class="no-print bg-white rounded-[28px] border border-[#E7DFCF] p-6 sm:p-10 space-y-8" [attr.dir]="lang.isArabic() ? 'rtl' : 'ltr'">
              <div class="max-w-xl space-y-2">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#2D6A4F]/10 text-[#2D6A4F]">
                  <span class="material-icons text-sm">auto_stories</span>
                  {{ lang.tr('قصة الدرس البيداغوجية', 'قصة الدرس البيداغوجية') }}
                </span>
                <h2 class="font-display font-bold text-2xl text-[#14251D]">
                  {{ lang.tr('قصة الدرس في 3 خطوات', 'قصة الدرس في 3 خطوات : قصة + ورقة تمارين جاهزة') }}
                </h2>
                <p class="text-sm text-[#5B6B60] leading-relaxed">
                  {{ lang.tr('حوّل نص القراءة أو درس التاريخ إلى قصة مصورة تفاعلية تنتهي بأنشطة وتمارين مطبوعة جاهزة للفصل.', 'حوّل نص القراءة أو درس التاريخ إلى قصة مصورة تفاعلية تنتهي بأنشطة وتمارين مطبوعة جاهزة للفصل.') }}
                </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                <!-- Step 1 -->
                <div class="bg-[#FBF8F1] rounded-2xl border border-[#E7DFCF] p-5 space-y-3 relative overflow-hidden">
                  <div class="w-10 h-10 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center font-display font-bold text-sm">
                    1
                  </div>
                  <h3 class="font-display font-semibold text-base text-[#14251D]">
                    {{ lang.tr('1. الدرس أو النص', '1. الدرس أو نص القراءة') }}
                  </h3>
                  <p class="text-xs text-[#5B6B60] leading-relaxed">
                    {{ lang.tr('اختر الموضوع أو الصق نص القراءة الرسمي من الكتاب المدرسي CNP (عربية، فرنسية، تاريخ).', 'اختر الموضوع أو الصق نص القراءة الرسمي من الكتاب المدرسي CNP (عربية، فرنسية، تاريخ).') }}
                  </p>
                </div>

                <!-- Step 2 -->
                <div class="bg-[#FBF8F1] rounded-2xl border border-[#E7DFCF] p-5 space-y-3 relative overflow-hidden">
                  <div class="w-10 h-10 rounded-xl bg-[#14251D] text-white flex items-center justify-center font-display font-bold text-sm">
                    2
                  </div>
                  <h3 class="font-display font-semibold text-base text-[#14251D]">
                    {{ lang.tr('2. المشاهد والأحداث', '2. المشاهد والشخصيات') }}
                  </h3>
                  <p class="text-xs text-[#5B6B60] leading-relaxed">
                    {{ lang.tr('يقترح الذكاء الاصطناعي تسلسلاً درامياً للمشاهد والشخصيات للمراجعة قبل إنشاء اللوحات.', 'يقترح الذكاء الاصطناعي تسلسلاً درامياً للمشاهد والشخصيات للمراجعة قبل إنشاء اللوحات.') }}
                  </p>
                </div>

                <!-- Step 3 -->
                <div class="bg-[#FBF8F1] rounded-2xl border border-[#E7DFCF] p-5 space-y-3 relative overflow-hidden">
                  <div class="w-10 h-10 rounded-xl bg-[#8A5A00] text-white flex items-center justify-center font-display font-bold text-sm">
                    3
                  </div>
                  <h3 class="font-display font-semibold text-base text-[#14251D]">
                    {{ lang.tr('3. اللوحات والأنشطة', '3. اللوحات والأنشطة الفصلية') }}
                  </h3>
                  <p class="text-xs text-[#5B6B60] leading-relaxed">
                    {{ lang.tr('قصة مصورة كاملة + فقاعات حوارية + سؤال استيعاب تحت كل لوحة + تمرين ترتيب الأحداث + ورقة إصلاح.', 'قصة مصورة كاملة + فقاعات حوارية + سؤال استيعاب تحت كل لوحة + تمرين ترتيب الأحداث + ورقة إصلاح.') }}
                  </p>
                </div>
              </div>
            </div>
          } @else if (series(); as s) {
            @if (!approved()) {
              <!-- Scene table: the teacher approves the plan before any panel is written -->
              <section class="bg-white rounded-[28px] border border-[#E7DFCF] p-5 sm:p-8 space-y-5 print:hidden" [attr.dir]="s.language === 'ar' ? 'rtl' : 'ltr'">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2D6A4F]/10 text-[#2D6A4F]">
                      {{ s.mode === 'history' ? lang.tr('Histoire', 'تاريخ') : lang.tr('Lecture / قصة الدرس', 'قراءة / قصة الدرس') }}
                    </span>
                    <h1 class="font-display font-semibold text-xl text-[#14251D]">{{ s.title }}</h1>
                  </div>
                  <p class="text-sm text-[#5B6B60]">
                    {{ lang.tr('Voici le plan (outline) : chaque carte deviendra une planche A4 illustrée + une question. Modifiez le texte avant de générer — rien n’est écrit tant que vous n’approuvez pas.', 'هذا مخطّط القصة: كل بطاقة ستصبح لوحة A4 مصورة + سؤال. يمكنك تعديل النصوص قبل الإنشاء — لن يُكتب شيء قبل موافقتك.') }}
                  </p>
                </div>

                <!-- Editable outline: one card per planned scene -->
                <ol class="space-y-3">
                  @for (sc of s.scenes; track sc.n) {
                    <li class="rounded-2xl border border-[#E7DFCF] bg-[#FBF8F1] p-4 space-y-3">
                      <div class="flex items-center justify-between gap-3">
                        <span class="inline-flex items-center gap-2 text-xs font-semibold text-[#5B6B60]">
                          <span class="w-7 h-7 rounded-lg bg-[#14251D] text-[#FBF8F1] font-mono flex items-center justify-center">{{ sc.n }}</span>
                          {{ lang.tr('Planche', 'اللوحة') }} {{ sc.n }}
                        </span>
                        @if (s.scenes.length > 2) {
                          <button type="button" (click)="store.removeOutlineScene(sc.n)" [attr.aria-label]="lang.tr('Supprimer cette planche', 'حذف هذه اللوحة')"
                            class="w-9 h-9 rounded-lg text-[#8F3F1F] hover:bg-[#BF5B34]/10 flex items-center justify-center cursor-pointer">
                            <span class="material-icons text-base">delete_outline</span>
                          </button>
                        }
                      </div>

                      <label class="block">
                        <span class="block text-[11px] font-semibold text-[#5B6B60] mb-1">{{ lang.tr('Titre', 'العنوان') }}</span>
                        <input type="text" [value]="sc.title"
                          (input)="store.updateOutlineScene(sc.n, { title: $any($event.target).value })"
                          class="w-full bg-white border border-[#E7DFCF] rounded-xl px-3 py-2 text-sm font-semibold text-[#14251D] outline-none focus:border-[#2D6A4F]" />
                      </label>

                      <label class="block">
                        <span class="block text-[11px] font-semibold text-[#5B6B60] mb-1">{{ lang.tr('Événement', 'الحدث') }}</span>
                        <textarea rows="2" [value]="sc.event"
                          (input)="store.updateOutlineScene(sc.n, { event: $any($event.target).value })"
                          class="w-full resize-y bg-white border border-[#E7DFCF] rounded-xl px-3 py-2 text-sm text-[#14251D] outline-none focus:border-[#2D6A4F]"></textarea>
                      </label>

                      <label class="block">
                        <span class="block text-[11px] font-semibold text-[#2D6A4F] mb-1">{{ lang.tr('Question d’activité', 'سؤال النشاط') }}</span>
                        <input type="text" [value]="sc.question || ''"
                          (input)="store.updateOutlineScene(sc.n, { question: $any($event.target).value })"
                          [placeholder]="lang.tr('Optionnel', 'اختياري')"
                          class="w-full bg-white border border-[#E7DFCF] rounded-xl px-3 py-2 text-sm text-[#14251D] outline-none focus:border-[#2D6A4F]" />
                      </label>
                    </li>
                  }
                </ol>

                <button type="button" (click)="store.addOutlineScene()"
                  class="w-full border-2 border-dashed border-[#E7DFCF] rounded-2xl py-3 text-sm font-semibold text-[#2D6A4F] hover:bg-[#F2ECDE] flex items-center justify-center gap-2 cursor-pointer">
                  <span class="material-icons text-base">add</span>
                  {{ lang.tr('Ajouter une planche', 'إضافة لوحة') }}
                </button>

                <div class="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    [disabled]="busy()"
                    (click)="generateAll()"
                    class="bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-60 text-[#FBF8F1] font-semibold px-5 min-h-11 rounded-xl text-sm flex items-center gap-2 transition-colors cursor-pointer">
                    <span class="material-icons text-base" [class.animate-spin]="busy()" aria-hidden="true">{{ busy() ? 'sync' : 'check' }}</span>
                    <span>{{ busy() ? progressLabel() : lang.tr('Approuver et générer les planches & activités', 'الموافقة وإنشاء اللوحات والتمارين') }}</span>
                  </button>
                  @if (error()) {
                    <p role="alert" class="text-sm text-[#BF5B34]">{{ error() }}</p>
                  }
                </div>
              </section>
            } @else {
              <!-- Two-pane studio once generated: a sticky navigation rail on the side fills the
                   space next to the centred A4 sheet instead of leaving empty gutters. -->
              <div class="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6 lg:items-start">
              <!-- Panel navigation (left rail) -->
              <nav class="bg-white rounded-[28px] border border-[#E7DFCF] p-4 space-y-3 print:hidden mb-4 lg:mb-0 lg:sticky lg:top-4" [attr.dir]="s.language === 'ar' ? 'rtl' : 'ltr'" [attr.aria-label]="lang.tr('Planches', 'اللوحات')">
                <div class="flex items-center justify-between gap-3">
                  <h1 class="font-display font-semibold text-sm text-[#14251D] truncate">{{ s.title }}</h1>
                  <span class="text-xs text-[#5B6B60] font-mono shrink-0">
                    {{ activeSceneIndex() < s.scenes.length ? (activeSceneIndex() + 1 + ' / ' + s.scenes.length) : lang.tr('Fiche d’activités', 'ورقة الأنشطة') }}
                  </span>
                </div>
                <div class="flex lg:flex-col items-stretch gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
                  @for (sc of s.scenes; track sc.n; let idx = $index) {
                    <button
                      type="button"
                      (click)="activeSceneIndex.set(idx)"
                      [attr.aria-current]="activeSceneIndex() === idx ? 'true' : null"
                      [class]="activeSceneIndex() === idx
                        ? 'bg-[#14251D] text-[#FBF8F1] border-[#14251D]'
                        : 'bg-[#FBF8F1] text-[#5B6B60] border-[#E7DFCF] hover:bg-[#F2ECDE]'"
                      class="flex items-center gap-2 px-3 min-h-11 rounded-xl border text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors shrink-0 lg:w-full lg:justify-start">
                      <span class="font-mono">{{ sc.n }}</span>
                      <span class="truncate">{{ sc.title }}</span>
                      @if (sc.status !== 'ready') {
                        <span class="w-1.5 h-1.5 rounded-full bg-[#BF5B34] shrink-0" [attr.title]="lang.tr('À générer', 'لم تُنشأ بعد')"></span>
                      }
                    </button>
                  }
                  <!-- Activity Worksheet Tab Button -->
                  <button
                    type="button"
                    (click)="activeSceneIndex.set(s.scenes.length)"
                    [attr.aria-current]="activeSceneIndex() === s.scenes.length ? 'true' : null"
                    [class]="activeSceneIndex() === s.scenes.length
                      ? 'bg-[#2D6A4F] text-[#FBF8F1] border-[#2D6A4F]'
                      : 'bg-[#FBF8F1] text-[#2D6A4F] border-[#2D6A4F]/30 hover:bg-[#F2ECDE]'"
                    class="flex items-center gap-2 px-3.5 min-h-11 rounded-xl border text-xs font-bold whitespace-nowrap cursor-pointer transition-colors shrink-0 lg:w-full lg:justify-start">
                    <span class="material-icons text-sm">format_list_numbered</span>
                    <span>{{ lang.tr('تمرين: رتّب الأحداث', 'تمرين: رتّب الأحداث') }}</span>
                  </button>
                </div>
              </nav>

              <!-- Right pane: actions + the A4 sheets -->
              <div class="min-w-0 space-y-4">

              @if (currentScene(); as active) {
                <div class="flex flex-wrap items-center gap-2 print:hidden w-full max-w-[800px] mx-auto">
                  <button
                    type="button"
                    [disabled]="busy()"
                    (click)="regenerate(active.n, 'text')"
                    class="px-4 min-h-11 rounded-xl border border-[#E7DFCF] bg-white hover:bg-[#FBF8F1] disabled:opacity-60 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                    <span class="material-icons text-sm" aria-hidden="true">edit_note</span>
                    <span>{{ active.status === 'ready' ? lang.tr('Réécrire le texte', 'إعادة كتابة النص') : lang.tr('Écrire le texte', 'كتابة النص') }}</span>
                  </button>
                  <button
                    type="button"
                    [disabled]="busy() || active.status !== 'ready'"
                    (click)="regenerate(active.n, 'image')"
                    class="px-4 min-h-11 rounded-xl border border-[#E7DFCF] bg-white hover:bg-[#FBF8F1] disabled:opacity-60 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                    <span class="material-icons text-sm" aria-hidden="true">image</span>
                    <span>{{ active.imageUrl ? lang.tr('Nouvelle illustration', 'صورة جديدة') : lang.tr('Générer l’illustration', 'إنشاء الصورة') }}</span>
                  </button>
                  @if (busy()) {
                    <span role="status" class="text-xs text-[#5B6B60]">{{ progressLabel() }}</span>
                  }
                  @if (error()) {
                    <span role="alert" class="text-xs text-[#BF5B34]">{{ error() }}</span>
                  }
                </div>
              }

              <!-- Panels: stay in DOM for print, active scene shown on screen -->
              @for (sc of s.scenes; track sc.n; let idx = $index) {
                <div [class.hidden]="idx !== activeSceneIndex()" class="print:block">
                  <app-series-panel
                    [scene]="sc"
                    [seriesTitle]="s.title"
                    [seriesMode]="s.mode ?? 'story'"
                    [showAnswer]="showTeacherKey()"
                    [bible]="s.bible"
                    [author]="s.author ?? null"
                    [docLang]="s.language"
                    [total]="s.scenes.length"></app-series-panel>
                </div>
              }

              <!-- Phase 2 Activity Sheet: "رتّب الأحداث" -->
              <div [class.hidden]="activeSceneIndex() !== s.scenes.length" class="print:block">
                <article
                  [attr.dir]="s.language === 'ar' ? 'rtl' : 'ltr'"
                  [attr.lang]="s.language"
                  class="print-sheet w-full max-w-[800px] mx-auto bg-white rounded-[28px] border border-[#E7DFCF] p-6 sm:p-10 space-y-6 shadow-sm min-h-[1050px] flex flex-col justify-between relative text-[#14251D]">

                  <div class="space-y-6">
                    <header class="border-b-2 border-[#14251D] pb-3.5 flex items-center justify-between gap-4">
                      <div class="flex items-center gap-3">
                        <span class="w-10 h-10 rounded-xl bg-[#2D6A4F] text-[#FBF8F1] flex items-center justify-center font-display font-bold text-base">
                          <span class="material-icons text-xl">format_list_numbered</span>
                        </span>
                        <div>
                          <p class="text-xs text-[#5B6B60] font-semibold">{{ lang.tr('ورقة التمارين والأنشطة', 'ورقة التمارين والأنشطة') }} · {{ s.title }}</p>
                          <h2 class="font-display font-semibold text-lg sm:text-xl text-[#14251D] tracking-tight">
                            {{ lang.tr('Activité : Remets les événements dans l’ordre', 'نشاط القصة: رتّب أحداث النص') }}
                          </h2>
                        </div>
                      </div>
                      <span class="bg-[#2D6A4F]/10 text-[#2D6A4F] text-xs font-semibold px-3 py-1 rounded-full border border-[#2D6A4F]/20">
                        {{ lang.tr('تمرين استيعاب', 'تمرين استيعاب') }}
                      </span>
                    </header>

                    <!-- Instruction Card -->
                    <div class="bg-[#FBF8F1] rounded-2xl border border-[#E7DFCF] p-4 flex items-center gap-3 text-sm font-semibold text-[#14251D]">
                      <span class="material-icons text-[#2D6A4F] text-xl">help_outline</span>
                      <p>{{ lang.tr('رقّم المشاهد التالية من 1 إلى ' + s.scenes.length + ' حسب التسلسل الزمني لأحداث القصة:', 'رقّم المشاهد التالية من 1 إلى ' + s.scenes.length + ' حسب التسلسل الزمني لأحداث القصة:') }}</p>
                    </div>

                    <!-- Shuffled Panels Grid -->
                    <div class="grid grid-cols-2 gap-4">
                      @for (sc of shuffledScenes(); track sc.n; let i = $index) {
                        <div class="bg-white rounded-2xl border border-[#E7DFCF] p-3.5 flex flex-col justify-between gap-3 shadow-xs">
                          <div class="space-y-2">
                            @if (sc.imageUrl) {
                              <div class="aspect-16/10 rounded-xl overflow-hidden border border-[#E7DFCF] bg-[#FBF8F1]">
                                <img [src]="sc.imageUrl" [alt]="sc.title" class="w-full h-full object-cover" />
                              </div>
                            } @else {
                              <div class="aspect-16/10 rounded-xl border border-dashed border-[#E7DFCF] bg-[#FBF8F1] flex items-center justify-center text-xs text-[#5B6B60]">
                                <span>{{ sc.title }}</span>
                              </div>
                            }
                            <p class="text-xs font-medium text-[#14251D] line-clamp-2 leading-relaxed">{{ sc.event }}</p>
                          </div>

                          <!-- Answer Box -->
                          <div class="pt-2 border-t border-[#E7DFCF] flex items-center justify-between">
                            <span class="text-xs font-bold text-[#5B6B60]">{{ lang.tr('الترتيب:', 'الترتيب:') }}</span>
                            <div class="w-10 h-10 rounded-xl border-2 border-dashed border-[#14251D] flex items-center justify-center font-bold text-base text-[#14251D]">
                              @if (showTeacherKey()) {
                                <span class="text-[#2D6A4F] font-mono">{{ sc.n }}</span>
                              }
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  </div>

                  <footer class="border-t border-[#14251D] pt-3 flex items-center justify-between gap-3 text-xs text-[#5B6B60]">
                    <div>
                      <span>{{ lang.tr('Plateforme Madrasati TN', 'منصة مدرستي تونس') }}</span>
                    </div>
                    <span class="font-mono">{{ s.scenes.length + 1 }} / {{ s.scenes.length + (showTeacherKey() ? 2 : 1) }} · Madrasati TN</span>
                  </footer>
                </article>
              </div>

              <!-- Phase 2: Teacher-only Answer Page (ورقة الإصلاح - دليل المعلم) -->
              @if (showTeacherKey()) {
                <div class="print:block">
                  <article
                    [attr.dir]="s.language === 'ar' ? 'rtl' : 'ltr'"
                    [attr.lang]="s.language"
                    class="print-sheet w-full max-w-[800px] mx-auto bg-white rounded-[28px] border-2 border-[#2D6A4F] p-6 sm:p-10 space-y-6 shadow-sm min-h-[1050px] flex flex-col justify-between relative text-[#14251D]">

                    <div class="space-y-6">
                      <header class="border-b-2 border-[#2D6A4F] pb-3.5 flex items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                          <span class="w-10 h-10 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center font-display font-bold text-base">
                            <span class="material-icons text-xl">fact_check</span>
                          </span>
                          <div>
                            <p class="text-xs text-[#2D6A4F] font-bold">{{ lang.tr('وثيقة المعلم (خاص بالإطار التربوي)', 'وثيقة المعلم (خاص بالإطار التربوي)') }}</p>
                            <h2 class="font-display font-semibold text-lg sm:text-xl text-[#14251D] tracking-tight">
                              {{ lang.tr('Corrigé type : قصة الدرس والأنشطة', 'ورقة الإصلاح النموذجية : قصة الدرس والأنشطة') }}
                            </h2>
                          </div>
                        </div>
                        <span class="bg-[#2D6A4F] text-white text-xs font-bold px-3 py-1 rounded-full">
                          {{ lang.tr('دليل المعلم', 'دليل المعلم') }}
                        </span>
                      </header>

                      <!-- Key 1: Chronological Order -->
                      <section class="space-y-3">
                        <h3 class="font-display font-bold text-sm text-[#14251D] flex items-center gap-2">
                          <span class="material-icons text-base text-[#2D6A4F]">format_list_numbered</span>
                          <span>{{ lang.tr('1. الحل النموذجي لتمرين ترتيب الأحداث :', '1. الحل النموذجي لتمرين ترتيب الأحداث :') }}</span>
                        </h3>
                        <div class="bg-[#FBF8F1] rounded-2xl border border-[#E7DFCF] p-4">
                          <ol class="space-y-2 text-xs">
                            @for (sc of s.scenes; track sc.n) {
                              <li class="flex items-start gap-2">
                                <span class="w-6 h-6 rounded-lg bg-[#2D6A4F] text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">{{ sc.n }}</span>
                                <span class="font-semibold text-[#14251D]">{{ sc.title }}:</span>
                                <span class="text-[#5B6B60]">{{ sc.event }}</span>
                              </li>
                            }
                          </ol>
                        </div>
                      </section>

                      <!-- Key 2: Questions and Answers -->
                      <section class="space-y-3">
                        <h3 class="font-display font-bold text-sm text-[#14251D] flex items-center gap-2">
                          <span class="material-icons text-base text-[#2D6A4F]">quiz</span>
                          <span>{{ lang.tr('2. إجابات أسئلة الفهم والاستيعاب :', '2. إجابات أسئلة الفهم والاستيعاب :') }}</span>
                        </h3>
                        <div class="space-y-2.5">
                          @for (sc of s.scenes; track sc.n) {
                            <div class="bg-[#FBF8F1] rounded-2xl border border-[#E7DFCF] p-3.5 space-y-1.5 text-xs">
                              <div class="flex items-center gap-2 font-bold text-[#14251D]">
                                <span class="text-[#2D6A4F]">#{{ sc.n }} - {{ sc.title }}</span>
                              </div>
                              <p class="font-semibold text-[#14251D]">س: {{ sc.question || '—' }}</p>
                              <p class="text-[#2D6A4F] font-bold">ج: {{ sc.answer || '—' }}</p>
                            </div>
                          }
                        </div>
                      </section>
                    </div>

                    <footer class="border-t border-[#14251D] pt-3 flex items-center justify-between gap-3 text-xs text-[#5B6B60]">
                      <div>
                        <span>{{ lang.tr('دليل المعلم المصاحب · منصة مدرستي تونس', 'دليل المعلم المصاحب · منصة مدرستي تونس') }}</span>
                      </div>
                      <span class="font-mono">Corrigé · Madrasati TN</span>
                    </footer>
                  </article>
                </div>
              }

              <!-- Pagination buttons -->
              <div class="flex items-center justify-between gap-3 print:hidden" [attr.dir]="s.language === 'ar' ? 'rtl' : 'ltr'">
                <button
                  type="button"
                  [disabled]="activeSceneIndex() === 0"
                  (click)="prevScene()"
                  class="px-4 min-h-11 rounded-xl border border-[#E7DFCF] bg-white hover:bg-[#FBF8F1] disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                  <span class="material-icons text-sm rtl:rotate-180" aria-hidden="true">arrow_back</span>
                  <span>{{ lang.tr('Planche précédente', 'اللوحة السابقة') }}</span>
                </button>
                <button
                  type="button"
                  [disabled]="activeSceneIndex() >= s.scenes.length"
                  (click)="nextScene()"
                  class="px-4 min-h-11 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-40 text-[#FBF8F1] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                  <span>{{ activeSceneIndex() === s.scenes.length - 1 ? lang.tr('ورقة التمارين', 'ورقة التمارين والأنشطة') : lang.tr('Planche suivante', 'اللوحة التالية') }}</span>
                  <span class="material-icons text-sm rtl:rotate-180" aria-hidden="true">arrow_forward</span>
                </button>
              </div>
              </div><!-- /right pane -->
              </div><!-- /two-pane grid -->
            }
          } @else if (loading()) {
            <div class="bg-white rounded-[28px] border border-[#E7DFCF] p-16 text-center space-y-3" role="status">
              <span class="material-icons text-4xl text-[#BF5B34] animate-spin motion-reduce:animate-none" aria-hidden="true">sync</span>
              <p class="font-display font-semibold text-[#14251D] text-sm">
                {{ lang.tr('Chargement de la série…', 'جارٍ تحميل السلسلة…') }}
              </p>
            </div>
          } @else {
            <div class="bg-white rounded-[28px] border border-[#E7DFCF] p-12 text-center space-y-3">
              <span class="material-icons text-4xl text-[#BF5B34]" aria-hidden="true">error_outline</span>
              <p class="font-display font-semibold text-[#14251D] text-sm">
                {{ lang.tr('Série introuvable ou supprimée.', 'السلسلة غير موجودة أو تم حذفها.') }}
              </p>
            </div>
          }
        </div>
      </div>

      <!-- Phase 4: Fullscreen Projector Modal -->
      @if (projectorOpen() && currentScene(); as active) {
        <div class="fixed inset-0 z-50 bg-[#14251D] text-[#FBF8F1] flex flex-col justify-between p-6 sm:p-10 select-none no-print" [attr.dir]="series()?.language === 'ar' ? 'rtl' : 'ltr'">
          <!-- Header -->
          <div class="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div class="flex items-center gap-3">
              <span class="px-3 py-1 rounded-full bg-[#2D6A4F] text-xs font-mono font-bold">{{ active.n }} / {{ series()?.scenes?.length }}</span>
              <h2 class="font-display font-semibold text-lg text-white truncate">{{ active.title }}</h2>
            </div>
            <button type="button" (click)="projectorOpen.set(false)" class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors">
              <span class="material-icons text-white">close</span>
            </button>
          </div>

          <!-- Main scene presentation -->
          <div class="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 py-6 max-w-6xl mx-auto w-full min-h-0 overflow-y-auto">
            @if (active.imageUrl) {
              <div class="max-w-2xl w-full aspect-16/10 rounded-2xl overflow-hidden border border-white/20 shadow-2xl relative shrink-0">
                <img [src]="active.imageUrl" [alt]="active.title" class="w-full h-full object-cover" />
                @if (active.speechBubble?.text) {
                  <div class="absolute bottom-4 start-4 max-w-[80%] bg-white/95 text-[#14251D] backdrop-blur-md rounded-2xl p-4 shadow-xl border border-black/10 text-sm">
                    @if (active.speechBubble?.speaker) {
                      <div class="text-xs font-bold text-[#8A5A00] mb-1">{{ active.speechBubble?.speaker }}</div>
                    }
                    <p class="font-semibold italic leading-relaxed">« {{ active.speechBubble?.text }} »</p>
                  </div>
                }
              </div>
            }
            <div class="space-y-4 max-w-xl text-start">
              <h3 class="font-display font-bold text-2xl text-white">{{ active.title }}</h3>
              <p class="text-lg leading-loose text-[#E7DFCF] font-medium">{{ active.text }}</p>
              @if (active.question) {
                <div class="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-[#FBF8F1]">
                  <span class="text-xs font-bold text-[#A7C4B5] block mb-1">❓ {{ lang.tr('Question', 'سؤال الاستيعاب') }}:</span>
                  <p>{{ active.question }}</p>
                </div>
              }
            </div>
          </div>

          <!-- Footer navigation -->
          <div class="flex items-center justify-between border-t border-white/10 pt-4">
            <button
              type="button"
              [disabled]="activeSceneIndex() === 0"
              (click)="prevScene()"
              class="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 cursor-pointer flex items-center gap-2 text-sm font-semibold">
              <span class="material-icons text-sm rtl:rotate-180">arrow_back</span>
              <span>{{ lang.tr('Précédente', 'السابقة') }}</span>
            </button>
            <span class="text-xs text-[#E7DFCF]/60 font-mono">استخدم مفاتيح الأسهم للتبديل (← / →) أو Esc للإغلاق</span>
            <button
              type="button"
              [disabled]="activeSceneIndex() >= (series()?.scenes?.length ?? 1) - 1"
              (click)="nextScene()"
              class="px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-30 cursor-pointer flex items-center gap-2 text-sm font-semibold">
              <span>{{ lang.tr('Suivante', 'التالية') }}</span>
              <span class="material-icons text-sm rtl:rotate-180">arrow_forward</span>
            </button>
          </div>
        </div>
      }

    </div>
  `,
})
export class SeriesViewerComponent implements OnInit {
  readonly lang = inject(LanguageService);
  readonly store = inject(EducationStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** Phase 1: Limit subjects to History, Arabic reading, and French reading */
  readonly allowedSubjects = ['Histoire & Géographie', 'اللغة العربية', 'Français'] as const;

  readonly series = this.store.currentSeries;
  readonly activeSceneIndex = signal<number>(0);
  readonly loading = signal<boolean>(true);
  readonly busy = computed(() => this.session.busy());
  readonly progressLabel = signal<string>('');
  readonly error = signal<string | null>(null);

  /** Phase 2: Teacher key visibility toggle */
  readonly showTeacherKey = signal<boolean>(false);

  /** Phase 4: Fullscreen projector mode */
  readonly projectorOpen = signal<boolean>(false);

  /** The plan is approved once at least one panel has been written. */
  readonly approved = computed(() => !!this.series()?.scenes.some((s) => s.status === 'ready'));

  readonly currentScene = computed<Scene | null>(() => this.series()?.scenes[this.activeSceneIndex()] ?? null);

  /** Phase 2: Deterministic shuffled scenes for "رتّب الأحداث" worksheet */
  readonly shuffledScenes = computed<Scene[]>(() => {
    const sc = this.series()?.scenes ?? [];
    if (sc.length <= 1) return sc;
    const n = sc.length;
    // Permutation with step 3
    const step = n % 2 === 0 ? 3 : 2;
    const result: Scene[] = [];
    const seen = new Set<number>();
    let ptr = 1;
    for (let i = 0; i < n; i++) {
      while (seen.has(ptr % n)) ptr++;
      const idx = ptr % n;
      seen.add(idx);
      result.push(sc[idx]);
      ptr = (ptr + step) % n;
    }
    return result;
  });

  /** /series/new: the form lives on this page; nothing is generated until the teacher submits. */
  readonly isNew = signal(false);
  readonly prefill = signal<SourceInput | null>(null);
  private lastSource: SourceInput | null = null;

  readonly session = createStudioSession<SourceInput>('series', {
    restore: (draft) => this.prefill.set(draft),
    retry: () => this.retry(),
    undo: (previous) => this.showSeries(previous as SeriesDoc),
  });

  readonly barBtn = STUDIO_BAR_BTN;
  /** Settings panel: always open for a new series, toggled from the studio bar otherwise. */
  readonly settingsOpen = signal(false);
  readonly panelOpen = computed(() => this.isNew() || this.settingsOpen());

  ngOnInit() {
    this.route.paramMap.subscribe((params) => void this.load(params.get('id')));
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent) {
    if (!this.projectorOpen()) return;
    if (event.key === 'Escape') {
      this.projectorOpen.set(false);
    } else if (event.key === 'ArrowRight') {
      if (this.series()?.language === 'ar') this.prevScene();
      else this.nextScene();
    } else if (event.key === 'ArrowLeft') {
      if (this.series()?.language === 'ar') this.nextScene();
      else this.prevScene();
    }
  }

  openProjector() {
    this.projectorOpen.set(true);
  }

  prevScene() {
    if (this.activeSceneIndex() > 0) {
      this.activeSceneIndex.set(this.activeSceneIndex() - 1);
    }
  }

  nextScene() {
    const total = (this.series()?.scenes?.length ?? 1) - 1;
    if (this.activeSceneIndex() < total) {
      this.activeSceneIndex.set(this.activeSceneIndex() + 1);
    }
  }

  private async load(id: string | null) {
    this.isNew.set(id === 'new');
    this.settingsOpen.set(false);
    if (id === 'new') {
      this.prefill.set(this.store.consumePrefill() ?? {
        mode: 'topic',
        grade: PRIMARY_GRADES[3],
        subject: 'اللغة العربية' as SubjectName,
        language: 'ar',
      });
      this.loading.set(false);
      return;
    }
    const current = this.store.currentSeries();
    if (id && id !== DRAFT_DOC_ID && current?.id !== id) {
      await this.store.getSeries(id);
    }
    const s = this.store.currentSeries();
    this.prefill.set(s ? {
      mode: s.sourceText ? 'text' : 'topic',
      topic: s.title,
      text: s.sourceText,
      grade: s.grade,
      subject: s.subject,
      language: s.language === 'fr' ? 'fr' : 'ar',
    } : null);
    this.loading.set(false);
  }

  async generate(source: SourceInput) {
    this.lastSource = source;
    const previous = this.isNew() ? null : this.series();
    const res = await this.session.run(() => this.store.createSeriesFromSource(source));
    if (!res) return;
    if (!res.ok || !res.docId) {
      this.session.fail(res.error || this.lang.tr('Erreur lors de la génération de la série', 'تعذّر توليد السلسلة'));
      return;
    }
    this.session.keepUndo(previous);
    if (res.docId !== DRAFT_DOC_ID) void this.session.clearDraft();
    this.session.succeed({ scrollTo: 'series-sheet' });
    void this.router.navigate(['/series', res.docId]);
  }

  retry() {
    const source = this.lastSource ?? this.session.draft();
    if (!source) return;
    this.session.dismissDraft();
    this.prefill.set(source);
    void this.generate(source);
  }

  private showSeries(d: SeriesDoc) {
    this.store.currentSeries.set(d);
    void this.router.navigate(['/series', d.id || DRAFT_DOC_ID]);
  }

  saveDraft() {
    this.store.requireAccount(async () => {
      const id = await this.store.saveCurrentSeries();
      if (id) {
        void this.session.clearDraft();
        void this.router.navigate(['/series', id], { replaceUrl: true });
        this.store.showToast(this.lang.tr('Série enregistrée', 'تم حفظ السلسلة'), 'success');
      } else {
        this.store.showToast(this.lang.tr('Échec de l’enregistrement', 'تعذّر الحفظ'), 'error');
      }
    });
  }

  async generateAll() {
    const s = this.series();
    if (!s || this.busy()) return;
    this.error.set(null);
    const pending = s.scenes.filter((sc) => sc.status !== 'ready');
    if (pending.length === 0) return;
    const total = pending.length;
    let done = 0;
    const failed: number[] = [];
    const setProgress = () => {
      const label = this.lang.tr(`${done} / ${total} planches prêtes`, `${done} / ${total} لوحات جاهزة`);
      this.session.progress.set(label);
      this.progressLabel.set(label);
    };

    await this.session.run(async (signal) => {
      setProgress();
      // Panels are independent, so write them all at once instead of one after another:
      // the whole series finishes in about the time of a single panel. Each panel reveals
      // itself the moment it is ready (patchScene updates the signal), and one failure
      // never stops the others.
      await Promise.allSettled(
        pending.map(async (sc) => {
          const ok = await this.writePanel(s.id, sc.n, true);
          if (!ok && !signal.aborted) failed.push(sc.n);
          done++;
          setProgress();
        }),
      );
      await this.persist(s.id);
      if (failed.length && !signal.aborted) {
        failed.sort((a, b) => a - b);
        this.error.set(
          this.lang.tr(
            `Échec des planches ${failed.join(', ')}. Réessayez-les individuellement.`,
            `تعذّر توليد اللوحات ${failed.join('، ')}. أعد المحاولة لكل لوحة على حدة.`,
          ),
        );
      }
    }, { timeoutMs: 0 });
  }

  async regenerate(sceneNumber: number, part: 'text' | 'image') {
    const s = this.series();
    if (!s || this.busy()) return;
    this.error.set(null);
    this.progressLabel.set(this.lang.tr('Génération en cours…', 'جارٍ الإنشاء…'));
    await this.session.run(async () => {
      if (part === 'text') {
        await this.writePanel(s.id, sceneNumber, false);
      } else {
        const img = await this.store.generateSeriesImage(s.id, sceneNumber);
        if (!img.ok) this.error.set(img.error ?? null);
      }
      await this.persist(s.id);
    });
  }

  /** Writes one panel's text (and image). Does NOT persist — the caller saves once. */
  private async writePanel(seriesId: string, sceneNumber: number, withImage: boolean): Promise<boolean> {
    const text = await this.store.generateSeriesPanel(seriesId, sceneNumber);
    if (!text.ok) {
      this.error.set(text.error ?? null);
      return false;
    }
    if (withImage) {
      const img = await this.store.generateSeriesImage(seriesId, sceneNumber);
      if (!img.ok) this.error.set(img.error ?? null);
    }
    return true;
  }

  private async persist(seriesId: string) {
    const doc = this.store.currentSeries();
    if (doc && doc.id && doc.id === seriesId) await this.store.saveSeries({ doc });
  }

  printAll() {
    if (typeof window !== 'undefined') window.print();
  }

  /** Share the series: saves it first if it has no id yet, then opens the native share sheet. */
  async shareSeries() {
    if (typeof window === 'undefined') return;
    const s = this.series();
    if (!s) return;
    let id = s.id;
    if (!id) {
      id = (await this.store.saveCurrentSeries()) ?? '';
      if (!id) {
        this.store.showToast(this.lang.tr('Enregistrez d’abord la série', 'احفظ السلسلة أولاً'), 'info');
        return;
      }
    }
    const url = `${window.location.origin}/series/${id}`;
    const details = joinDetails([this.lang.translateGrade(s.grade ?? ''), this.lang.translateSubject(s.subject ?? '')]);
    const result = await nativeSharePost(s.title, details, url);
    if (result === 'copied') this.store.showToast(this.lang.tr('Lien copié', 'تم نسخ الرابط'), 'success');
  }
}
