import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { EducationStore, LanguageService, FirebaseService, GradeLevel, SubjectName, InteractionService } from '@core';
import { EditorBlock, EditorBlockType, DocumentType, ExerciseFormat } from './editor.model';

@Component({
  selector: 'app-editor-studio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="space-y-6">

      <!-- Studio Top Navigation & Publishing Bar -->
      <div class="bg-[#0B2947] text-white rounded-[24px] p-6 shadow-sm">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <button
              (click)="exitStudio()"
              class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white">
              <span class="material-icons text-xl rtl:rotate-180">arrow_back</span>
            </button>

            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <!-- Shell A = Exam/Exercise/Course ; Shell B = Article Medium -->
                @if (studioShell() === 'A') {
                  <span class="bg-[#E0AA32] text-[#0B2947] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                    Studio A4 — {{ lang.tr('Exam / Exercice', 'امتحان / تمرين') }}
                  </span>
                } @else {
                  <span class="bg-[#7C3AED] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                    Studio B — {{ lang.tr('Article Medium', 'مقال تربوي') }}
                  </span>
                }
                <span class="text-[11px] text-[#8CA9C4] inline-flex items-center gap-1 whitespace-nowrap">
                  <span class="w-1.5 h-1.5 rounded-full" [class]="isAutoSaved() ? 'bg-[#4ADE80]' : 'bg-[#E0AA32] animate-pulse'"></span>
                  {{ isAutoSaved() ? lang.tr('Enregistré', 'تم الحفظ') : lang.tr('Modifications...', 'تعديلات جارية...') }}
                </span>
              </div>
              <h1 dir="auto" class="font-display text-xl sm:text-2xl font-semibold text-white mt-1 truncate max-w-[60vw] lg:max-w-md">
                {{ docTitle() || lang.tr('Document sans titre', 'وثيقة جديدة بدون عنوان') }}
              </h1>
            </div>
          </div>

          <!-- Studio Actions -->
          <div class="flex flex-wrap items-center gap-2">
            <!-- View Mode Switcher -->
            <div class="bg-white/10 p-1 rounded-xl flex items-center gap-1 border border-white/15">
              <button
                (click)="viewMode.set('editor')"
                [class]="viewMode() === 'editor' ? 'bg-[#007CC2] text-white font-semibold shadow-xs' : 'text-[#8CA9C4] hover:text-white'"
                class="px-3 py-1.5 rounded-[8px] text-xs flex items-center gap-1.5 transition-all cursor-pointer">
                <span class="material-icons text-sm">edit_note</span>
                <span>{{ lang.tr('Éditeur', 'التحرير') }}</span>
              </button>

              <button
                (click)="viewMode.set('split')"
                [class]="viewMode() === 'split' ? 'bg-[#007CC2] text-white font-semibold shadow-xs' : 'text-[#8CA9C4] hover:text-white'"
                class="hidden md:flex px-3 py-1.5 rounded-[8px] text-xs items-center gap-1.5 transition-all cursor-pointer">
                <span class="material-icons text-sm">vertical_split</span>
                <span>{{ lang.tr('Côte à côte', 'عرض مزدوج') }}</span>
              </button>

              <button
                (click)="viewMode.set('preview')"
                [class]="viewMode() === 'preview' ? 'bg-[#007CC2] text-white font-semibold shadow-xs' : 'text-[#8CA9C4] hover:text-white'"
                class="px-3 py-1.5 rounded-[8px] text-xs flex items-center gap-1.5 transition-all cursor-pointer">
                <span class="material-icons text-sm">print</span>
                <span>{{ lang.tr('Aperçu A4', 'معاينة A4') }}</span>
              </button>
            </div>

            <!-- Print Trigger -->
            <button
              (click)="triggerPrintDialog()"
              class="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
              <span class="material-icons text-sm">print</span>
              <span>{{ lang.t('printBtn') }}</span>
            </button>

            <!-- Publish Button Dropdown Trigger -->
            <button
              (click)="publishModalOpen.set(true)"
              class="bg-[#23845B] hover:bg-[#1C6949] text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm">
              <span class="material-icons text-sm">publish</span>
              <span>{{ lang.tr('Publier & Partager', 'نشر ومشاركة') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Document Metadata Header -->
      <div class="bg-white dark:bg-[#0E1D2A] rounded-[20px] p-5 border border-[#E3ECF2] dark:border-[#1A3145] shadow-xs space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div>
            <span class="block font-semibold text-[#102A43] dark:text-white mb-1">
              {{ lang.tr('Type de document', 'نوع الوثيقة') }}
            </span>
            <div class="grid grid-cols-2 gap-2" role="radiogroup" [attr.aria-label]="lang.tr('Type de document', 'نوع الوثيقة')">
              @for (opt of docTypeOptions; track opt.value) {
                <button
                  type="button"
                  role="radio"
                  [attr.aria-checked]="docType() === opt.value"
                  (click)="setDocType(opt.value)"
                  [class]="docType() === opt.value
                    ? 'border-[#007CC2] bg-[#007CC2]/8 text-[#102A43] ring-1 ring-[#007CC2]'
                    : 'border-[#E3ECF2] dark:border-[#1A3145] bg-[#F7F9FB] dark:bg-[#152737] text-[#486581] dark:text-[#9DBBD4] hover:border-[#007CC2]/50'"
                  class="flex items-center gap-2 rounded-[10px] border p-2.5 text-right transition-all cursor-pointer min-h-11">
                  <span
                    [class]="docType() === opt.value ? 'bg-[#007CC2] text-white' : 'bg-white dark:bg-[#1A3145] text-[#007CC2]'"
                    class="material-icons text-base rounded-lg p-1 shrink-0 transition-colors">{{ opt.icon }}</span>
                  <span class="min-w-0">
                    <span class="block text-xs font-semibold leading-tight dark:text-white">{{ lang.tr(opt.fr, opt.ar) }}</span>
                    <span class="block text-[10px] opacity-70 leading-tight">{{ opt.sub }}</span>
                  </span>
                </button>
              }
            </div>
          </div>

          <div>
            <span class="block font-semibold text-[#102A43] dark:text-white mb-1">
              {{ lang.tr('Matière', 'المادة') }}
            </span>
            <div class="grid grid-cols-2 gap-2" role="radiogroup" [attr.aria-label]="lang.tr('Matière', 'المادة')">
              @for (opt of docSubjectOptions; track opt.value) {
                <button
                  type="button"
                  role="radio"
                  [attr.aria-checked]="docSubject() === opt.value"
                  (click)="setDocSubject(opt.value)"
                  [class]="docSubject() === opt.value
                    ? 'border-[#007CC2] bg-[#007CC2]/8 text-[#102A43] ring-1 ring-[#007CC2]'
                    : 'border-[#E3ECF2] dark:border-[#1A3145] bg-[#F7F9FB] dark:bg-[#152737] text-[#486581] dark:text-[#9DBBD4] hover:border-[#007CC2]/50'"
                  class="flex items-center gap-2 rounded-[10px] border p-2 text-right transition-all cursor-pointer min-h-11">
                  <span
                    [class]="docSubject() === opt.value ? 'bg-[#007CC2] text-white' : 'bg-white dark:bg-[#1A3145] text-[#007CC2]'"
                    class="material-icons text-base rounded-lg p-1 shrink-0 transition-colors">{{ opt.icon }}</span>
                  <span class="text-xs font-semibold leading-tight dark:text-white min-w-0 truncate">{{ lang.tr(opt.fr, opt.ar) }}</span>
                </button>
              }
            </div>
          </div>

          <div>
            <span class="block font-semibold text-[#102A43] dark:text-white mb-1">
              {{ lang.tr('Niveau Scolaire', 'المستوى الدراسي') }}
            </span>
            <div class="grid grid-cols-2 gap-2" role="radiogroup" [attr.aria-label]="lang.tr('Niveau Scolaire', 'المستوى الدراسي')">
              @for (opt of docGradeOptions; track opt.value) {
                <button
                  type="button"
                  role="radio"
                  [attr.aria-checked]="docGrade() === opt.value"
                  (click)="setDocGrade(opt.value)"
                  [class]="docGrade() === opt.value
                    ? 'border-[#007CC2] bg-[#007CC2]/8 text-[#102A43] ring-1 ring-[#007CC2]'
                    : 'border-[#E3ECF2] dark:border-[#1A3145] bg-[#F7F9FB] dark:bg-[#152737] text-[#486581] dark:text-[#9DBBD4] hover:border-[#007CC2]/50'"
                  class="flex items-center gap-2 rounded-[10px] border p-2 text-right transition-all cursor-pointer min-h-11">
                  <span
                    [class]="docGrade() === opt.value ? 'bg-[#007CC2] text-white' : 'bg-white dark:bg-[#1A3145] text-[#007CC2]'"
                    class="material-icons text-base rounded-lg p-1 shrink-0 transition-colors">{{ opt.icon }}</span>
                  <span class="text-xs font-semibold leading-tight dark:text-white min-w-0 truncate">{{ lang.tr(opt.fr, opt.ar) }}</span>
                </button>
              }
            </div>
          </div>
        </div>

        <div class="text-xs">
          <label for="doc-title-input" class="block font-semibold text-[#102A43] dark:text-white mb-1">
            {{ lang.tr('Titre du Document / Article', 'عنوان الوثيقة أو المقال') }} *
          </label>
          <input
            id="doc-title-input"
            type="text"
            [value]="docTitle()"
            (input)="onDocTitleInput($event)"
            placeholder="Ex: Évaluation Trimestrielle N°1 : Mathématiques et Problèmes"
            class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2.5 text-[#102A43] dark:text-white font-semibold outline-none" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-[#E3ECF2] dark:border-[#1A3145]">
          <div>
            <label for="doc-trimester-select" class="block font-semibold text-[#627D98] dark:text-[#8CA9C4] mb-1">
              {{ lang.tr('Période / Trimestre', 'الثلاثي') }}
            </label>
            <select
              id="doc-trimester-select"
              [value]="docTrimester()"
              (change)="onDocTrimesterChange($event)"
              class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2 text-[#102A43] dark:text-white outline-none">
              <option value="Trimestre 1">Trimestre 1 / الثلاثي الأول</option>
              <option value="Trimestre 2">Trimestre 2 / الثلاثي الثاني</option>
              <option value="Trimestre 3">Trimestre 3 / الثلاثي الثالث</option>
            </select>
          </div>

          <div>
            <label for="doc-school-input" class="block font-semibold text-[#627D98] dark:text-[#8CA9C4] mb-1">
              {{ lang.tr('Établissement / École', 'المدرسة الابتدائية') }}
            </label>
            <input
              id="doc-school-input"
              type="text"
              [value]="docSchool()"
              (input)="onDocSchoolInput($event)"
              placeholder="Ex: École Primaire Habib Bourguiba"
              class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2 text-[#102A43] dark:text-white outline-none" />
          </div>

          <div>
            <label for="doc-watermark-input" class="block font-semibold text-[#627D98] dark:text-[#8CA9C4] mb-1">
              {{ lang.tr('Filigrane officiel & Attribution', 'العلامة المائية والإسناد') }}
            </label>
            <input
              id="doc-watermark-input"
              type="text"
              [value]="docWatermark()"
              (input)="onDocWatermarkInput($event)"
              placeholder="Madrasati TN — Document Certifié"
              class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2 text-[#007CC2] font-semibold outline-none" />
          </div>
        </div>

        <!-- Quick Templates -->
        <div class="flex flex-wrap items-center gap-2 pt-3 border-t border-[#E3ECF2] dark:border-[#1A3145]">
          <span class="text-[11px] font-semibold text-[#627D98] dark:text-[#8CA9C4]">
            {{ lang.tr('Modèles rapides :', 'قوالب جاهزة :') }}
          </span>
          <button
            (click)="loadTemplatePreset('exam_full')"
            class="bg-[#E8F5FC] dark:bg-[#102A43] hover:bg-[#D7E7F2] text-[#007CC2] px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer">
            {{ lang.tr('Examen complet', 'امتحان كامل') }}
          </button>
          <button
            (click)="loadTemplatePreset('course_summary')"
            class="bg-[#E8F6EF] dark:bg-[#153B2D] hover:bg-[#D0EFE2] text-[#23845B] px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer">
            {{ lang.tr('Fiche de cours', 'ملخص درس') }}
          </button>
          <button
            (click)="loadTemplatePreset('exercise_sheet')"
            class="bg-[#FFF4D8] dark:bg-[#3D2E10] hover:bg-[#FFE8B2] text-[#9E6A00] dark:text-[#E0AA32] px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer">
            {{ lang.tr("Série d'exercices", 'سلسلة تمارين') }}
          </button>
        </div>
      </div>

      <!-- Studio Work Area -->
      <div class="grid" [class]="viewMode() === 'split' ? 'lg:grid-cols-2 gap-6' : 'grid-cols-1'">

        <!-- LEFT COLUMN: BLOCK EDITOR CANVAS -->
        @if (viewMode() === 'editor' || viewMode() === 'split') {
          <div class="space-y-4">
            
            <!-- Floating Quick Block Insertion Toolbar -->
            <!-- Shell-A: all blocks | Shell-B: text/heading/callout/quote/image/divider only -->
            <div class="bg-white dark:bg-[#0E1D2A] rounded-[18px] p-3 border border-[#E3ECF2] dark:border-[#1A3145] shadow-xs flex flex-wrap items-center gap-1.5 sticky top-4 z-20">
              <span class="text-[11px] font-semibold text-[#627D98] dark:text-[#8CA9C4] px-2 flex items-center gap-1">
                <span class="material-icons text-sm text-[#007CC2]">add_circle</span>
                {{ lang.tr('Ajouter un Bloc :', 'إضافة عنصر :') }}
              </span>

              <button
                (click)="addBlock('paragraph')"
                class="bg-[#F7F9FB] dark:bg-[#152737] hover:bg-[#E3ECF2] dark:hover:bg-[#1E364B] text-[#102A43] dark:text-white px-2.5 py-1.5 rounded-[8px] text-xs flex items-center gap-1 font-medium transition-colors cursor-pointer">
                <span class="material-icons text-xs">notes</span>
                {{ lang.tr('Texte', 'نص') }}
              </button>

              <button
                (click)="addBlock('heading1')"
                class="bg-[#F7F9FB] dark:bg-[#152737] hover:bg-[#E3ECF2] dark:hover:bg-[#1E364B] text-[#102A43] dark:text-white px-2.5 py-1.5 rounded-[8px] text-xs flex items-center gap-1 font-medium transition-colors cursor-pointer">
                <span class="material-icons text-xs">title</span>
                {{ lang.tr('Titre H1', 'عنوان رئيسي') }}
              </button>

              <button
                (click)="addBlock('heading2')"
                class="bg-[#F7F9FB] dark:bg-[#152737] hover:bg-[#E3ECF2] dark:hover:bg-[#1E364B] text-[#102A43] dark:text-white px-2.5 py-1.5 rounded-[8px] text-xs flex items-center gap-1 font-medium transition-colors cursor-pointer">
                <span class="material-icons text-xs">title</span>
                {{ lang.tr('Titre H2', 'عنوان فرعي') }}
              </button>

              <button
                (click)="addBlock('divider')"
                class="bg-[#F7F9FB] dark:bg-[#152737] hover:bg-[#E3ECF2] dark:hover:bg-[#1E364B] text-[#102A43] dark:text-white px-2.5 py-1.5 rounded-[8px] text-xs flex items-center gap-1 font-medium transition-colors cursor-pointer">
                <span class="material-icons text-xs">horizontal_rule</span>
                {{ lang.tr('Séparateur', 'فاصل') }}
              </button>

              <!-- Shell-A only: Exam/Exercise-specific blocks -->
              @if (studioShell() === 'A') {
                <button
                  (click)="addBlock('exercise')"
                  class="bg-[#E8F5FC] dark:bg-[#102A43] hover:bg-[#D7E7F2] text-[#007CC2] px-2.5 py-1.5 rounded-[8px] text-xs flex items-center gap-1 font-semibold transition-colors cursor-pointer">
                  <span class="material-icons text-xs">assignment</span>
                  {{ lang.tr('Exercice + Barème', 'تمرين مع عدد') }}
                </button>

                <button
                  (click)="addBlock('callout')"
                  class="bg-[#E8F6EF] dark:bg-[#153B2D] hover:bg-[#D0EFE2] text-[#23845B] px-2.5 py-1.5 rounded-[8px] text-xs flex items-center gap-1 font-semibold transition-colors cursor-pointer">
                  <span class="material-icons text-xs">lightbulb</span>
                  {{ lang.tr('Encadré / Conseil', 'ملاحظة بيداغوجية') }}
                </button>

                <button
                  (click)="addBlock('cartouche')"
                  class="bg-[#FFF4D8] dark:bg-[#3D2E10] hover:bg-[#FFE8B2] text-[#9E6A00] dark:text-[#E0AA32] px-2.5 py-1.5 rounded-[8px] text-xs flex items-center gap-1 font-semibold transition-colors cursor-pointer">
                  <span class="material-icons text-xs">badge</span>
                  {{ lang.tr('En-tête Ministère', 'كارتوش الوزارة') }}
                </button>
              }

              <!-- Shell-B only: Article-specific blocks -->
              @if (studioShell() === 'B') {
                <button
                  (click)="addBlock('callout')"
                  class="bg-[#EEE8FF] hover:bg-[#DDD0FF] text-[#7C3AED] px-2.5 py-1.5 rounded-[8px] text-xs flex items-center gap-1 font-semibold transition-colors cursor-pointer">
                  <span class="material-icons text-xs">format_quote</span>
                  {{ lang.tr('Encadré Citation', 'اقتباس بيداغوجي') }}
                </button>
              }

              <button
                (click)="addBlock('image')"
                class="bg-[#F7F9FB] dark:bg-[#152737] hover:bg-[#E3ECF2] dark:hover:bg-[#1E364B] text-[#102A43] dark:text-white px-2.5 py-1.5 rounded-[8px] text-xs flex items-center gap-1 font-medium transition-colors cursor-pointer">
                <span class="material-icons text-xs">image</span>
                {{ lang.tr('Image VPS', 'صورة') }}
              </button>

              <!-- AI Assistance Trigger -->
              <button
                (click)="openAiPromptModal()"
                class="bg-[#E0AA32] hover:bg-[#D19A24] text-[#0B2947] px-3 py-1.5 rounded-[8px] text-xs flex items-center gap-1 font-bold shadow-xs transition-colors cursor-pointer ms-auto">
                <span class="material-icons text-xs">auto_awesome</span>
                <span>IA Gemini</span>
              </button>
            </div>

            <!-- Block List Canvas -->
            <div class="space-y-3">
              @for (block of blocks(); track block.id; let idx = $index) {
                <div class="group bg-white dark:bg-[#0E1D2A] rounded-[18px] p-4 border border-[#E3ECF2] dark:border-[#1A3145] shadow-xs hover:border-[#007CC2]/50 transition-all relative">
                  
                  <!-- Block Top Action Strip -->
                  <div class="flex items-center justify-between pb-2 mb-2 border-b border-[#E3ECF2]/60 dark:border-[#1A3145]/60 text-xs">
                    <div class="flex items-center gap-1.5">
                      <span class="w-5 h-5 rounded-full bg-[#E3ECF2] dark:bg-[#152737] text-[#627D98] dark:text-[#8CA9C4] flex items-center justify-center font-mono text-[10px] font-bold">
                        {{ idx + 1 }}
                      </span>
                      <span class="text-[10px] font-semibold text-[#627D98] dark:text-[#8CA9C4] uppercase tracking-wider">
                        {{ getBlockTypeLabel(block.type) }}
                      </span>
                    </div>

                    <!-- Block Reordering & Deletion -->
                    <div class="flex items-center gap-1 opacity-40 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                      <button
                        (click)="moveBlockUp(idx)"
                        [disabled]="idx === 0"
                        class="p-1 text-[#627D98] hover:text-[#102A43] dark:hover:text-white disabled:opacity-30 cursor-pointer">
                        <span class="material-icons text-sm">arrow_upward</span>
                      </button>

                      <button
                        (click)="moveBlockDown(idx)"
                        [disabled]="idx === blocks().length - 1"
                        class="p-1 text-[#627D98] hover:text-[#102A43] dark:hover:text-white disabled:opacity-30 cursor-pointer">
                        <span class="material-icons text-sm">arrow_downward</span>
                      </button>

                      <button
                        (click)="duplicateBlock(idx)"
                        class="p-1 text-[#627D98] hover:text-[#007CC2] cursor-pointer"
                        title="Dupliquer">
                        <span class="material-icons text-sm">content_copy</span>
                      </button>

                      <button
                        (click)="deleteBlock(block.id)"
                        class="p-1 text-[#D64545] hover:opacity-80 cursor-pointer"
                        title="Supprimer">
                        <span class="material-icons text-sm">delete</span>
                      </button>
                    </div>
                  </div>

                  <!-- BLOCK CONTENT RENDERING BY TYPE -->
                  @switch (block.type) {

                    <!-- PARAGRAPH -->
                    @case ('paragraph') {
                      <textarea dir="auto"
                        [value]="block.content"
                        (input)="updateBlockContent(block.id, $any($event.target).value)"
                        rows="3"
                        [placeholder]="lang.tr('Rédigez votre paragraphe de cours, explications ou consigne...', 'اكتب فقرة الدرس، الشرح أو التعليمة...')"
                        class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-3 text-xs text-[#102A43] dark:text-white outline-none leading-relaxed"></textarea>
                    }

                    <!-- HEADING 1 -->
                    @case ('heading1') {
                      <input dir="auto"
                        type="text"
                        [value]="block.content"
                        (input)="updateBlockContent(block.id, $any($event.target).value)"
                        [placeholder]="lang.tr('Titre Principal (H1)...', 'عنوان رئيسي (H1)...')"
                        class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-3 text-base font-bold text-[#102A43] dark:text-white outline-none" />
                    }

                    <!-- HEADING 2 -->
                    @case ('heading2') {
                      <input dir="auto"
                        type="text"
                        [value]="block.content"
                        (input)="updateBlockContent(block.id, $any($event.target).value)"
                        [placeholder]="lang.tr('Sous-titre de Chapitre (H2)...', 'عنوان فرعي للفصل (H2)...')"
                        class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2.5 text-sm font-semibold text-[#007CC2] outline-none" />
                    }

                    <!-- HEADING 3 -->
                    @case ('heading3') {
                      <input dir="auto"
                        type="text"
                        [value]="block.content"
                        (input)="updateBlockContent(block.id, $any($event.target).value)"
                        [placeholder]="lang.tr('Section / Étape (H3)...', 'قسم / مرحلة (H3)...')"
                        class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2 text-xs font-semibold text-[#102A43] dark:text-white outline-none" />
                    }

                    <!-- EXERCISE WITH POINTS & STRUCTURED FORMATS -->
                    @case ('exercise') {
                      <div class="space-y-3 bg-[#F7F9FB] dark:bg-[#152737] p-3.5 rounded-[12px] border border-[#E3ECF2] dark:border-[#1A3145]">
                        <div class="flex items-center justify-between gap-3">
                          <input dir="auto"
                            type="text"
                            [value]="block.exerciseTitle || 'Exercice N°' + (idx + 1)"
                            (input)="updateBlockField(block.id, 'exerciseTitle', $any($event.target).value)"
                            [placeholder]="lang.t('editorExerciseTitlePlaceholder')"
                            class="grow bg-white dark:bg-[#0E1D2A] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[8px] p-2 text-xs font-semibold text-[#102A43] dark:text-white outline-none" />
                          
                          <div class="flex items-center gap-1.5 shrink-0">
                            <span class="text-[11px] font-semibold text-[#23845B]">{{ lang.tr('Barème :', 'العدد :') }}</span>
                            <input
                              type="number"
                              [value]="block.exercisePoints || 5"
                              (input)="updateBlockField(block.id, 'exercisePoints', +$any($event.target).value)"
                              min="1"
                              max="20"
                              class="w-16 bg-white dark:bg-[#0E1D2A] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[8px] p-2 text-xs font-bold text-center text-[#23845B] outline-none" />
                            <span class="text-xs text-[#627D98] font-bold">pts</span>
                          </div>
                        </div>

                        <!-- Format Selector Pills -->
                        <div class="flex flex-wrap items-center gap-1 pt-1 border-t border-[#E3ECF2] dark:border-[#1A3145]">
                          <span class="text-[10px] font-semibold text-[#627D98] dark:text-[#8CA9C4] me-1">{{ lang.tr('Format :', 'النوع :') }}</span>
                          <button
                            (click)="setExerciseFormat(block.id, 'free')"
                            [class]="(block.exerciseFormat || 'free') === 'free' ? 'bg-[#007CC2] text-white font-semibold' : 'bg-white dark:bg-[#0E1D2A] text-[#627D98] dark:text-[#8CA9C4] border border-[#E3ECF2] dark:border-[#1A3145]'"
                            class="px-2 py-0.5 rounded-md text-[11px] transition-colors cursor-pointer">
                            {{ lang.tr('Libre', 'حر') }}
                          </button>
                          <button
                            (click)="setExerciseFormat(block.id, 'qcm')"
                            [class]="block.exerciseFormat === 'qcm' ? 'bg-[#007CC2] text-white font-semibold' : 'bg-white dark:bg-[#0E1D2A] text-[#627D98] dark:text-[#8CA9C4] border border-[#E3ECF2] dark:border-[#1A3145]'"
                            class="px-2 py-0.5 rounded-md text-[11px] transition-colors cursor-pointer">
                            {{ lang.tr('QCM', 'خيارات') }}
                          </button>
                          <button
                            (click)="setExerciseFormat(block.id, 'true_false')"
                            [class]="block.exerciseFormat === 'true_false' ? 'bg-[#007CC2] text-white font-semibold' : 'bg-white dark:bg-[#0E1D2A] text-[#627D98] dark:text-[#8CA9C4] border border-[#E3ECF2] dark:border-[#1A3145]'"
                            class="px-2 py-0.5 rounded-md text-[11px] transition-colors cursor-pointer">
                            {{ lang.tr('Vrai-Faux', 'صواب-خطأ') }}
                          </button>
                          <button
                            (click)="setExerciseFormat(block.id, 'fill_blanks')"
                            [class]="block.exerciseFormat === 'fill_blanks' ? 'bg-[#007CC2] text-white font-semibold' : 'bg-white dark:bg-[#0E1D2A] text-[#627D98] dark:text-[#8CA9C4] border border-[#E3ECF2] dark:border-[#1A3145]'"
                            class="px-2 py-0.5 rounded-md text-[11px] transition-colors cursor-pointer">
                            {{ lang.tr('Trous', 'فراغات') }}
                          </button>
                          <button
                            (click)="setExerciseFormat(block.id, 'matching')"
                            [class]="block.exerciseFormat === 'matching' ? 'bg-[#007CC2] text-white font-semibold' : 'bg-white dark:bg-[#0E1D2A] text-[#627D98] dark:text-[#8CA9C4] border border-[#E3ECF2] dark:border-[#1A3145]'"
                            class="px-2 py-0.5 rounded-md text-[11px] transition-colors cursor-pointer">
                            {{ lang.tr('Flèches', 'أسهم') }}
                          </button>
                        </div>

                        <!-- Per-format inputs -->
                        @switch (block.exerciseFormat || 'free') {
                          @case ('free') {
                            <textarea dir="auto"
                              [value]="block.content"
                              (input)="updateBlockContent(block.id, $any($event.target).value)"
                              rows="3"
                              [placeholder]="lang.t('editorPromptPlaceholder')"
                              class="w-full bg-white dark:bg-[#0E1D2A] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[8px] p-2.5 text-xs text-[#102A43] dark:text-white outline-none"></textarea>
                          }

                          @case ('qcm') {
                            <div class="space-y-2">
                              <textarea dir="auto"
                                [value]="block.content"
                                (input)="updateBlockContent(block.id, $any($event.target).value)"
                                rows="2"
                                [placeholder]="lang.tr('Énoncé de la question QCM...', 'نص سؤال الخيارات المتعددة...')"
                                class="w-full bg-white dark:bg-[#0E1D2A] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[8px] p-2 text-xs text-[#102A43] dark:text-white outline-none"></textarea>

                              <div class="space-y-1.5">
                                <span class="text-[11px] font-semibold text-[#627D98] dark:text-[#8CA9C4]">{{ lang.tr('Options de réponse (choisir la bonne réponse) :', 'خيارات الإجابة (اختر الإجابة الصحيحة) :') }}</span>
                                @for (opt of block.qcmOptions || []; track $index; let optIdx = $index) {
                                  <div class="flex items-center gap-2">
                                    <button
                                      (click)="setQcmCorrect(block.id, optIdx)"
                                      [class]="(block.qcmCorrectIndex ?? 0) === optIdx ? 'bg-[#23845B] text-white' : 'bg-gray-100 text-gray-500 dark:bg-[#152737] hover:bg-gray-200'"
                                      class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors cursor-pointer"
                                      title="Marquer comme bonne réponse">
                                      {{ getOptionLetter(optIdx) }}
                                    </button>
                                    <input
                                      [id]="'qcm-opt-' + block.id + '-' + optIdx"
                                      type="text"
                                      [value]="opt"
                                      (input)="updateQcmOption(block.id, optIdx, $any($event.target).value)"
                                      [placeholder]="'Option ' + getOptionLetter(optIdx)"
                                      class="grow bg-white dark:bg-[#0E1D2A] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[6px] p-1.5 text-xs text-[#102A43] dark:text-white outline-none" />
                                    @if ((block.qcmOptions || []).length > 2) {
                                      <button
                                        (click)="removeQcmOption(block.id, optIdx)"
                                        class="text-[#D64545] hover:opacity-80 p-1 cursor-pointer">
                                        <span class="material-icons text-sm">close</span>
                                      </button>
                                    }
                                  </div>
                                }
                                @if ((block.qcmOptions || []).length < 5) {
                                  <button
                                    (click)="addQcmOption(block.id)"
                                    class="text-[11px] font-semibold text-[#007CC2] flex items-center gap-1 cursor-pointer pt-1">
                                    <span class="material-icons text-xs">add</span>
                                    <span>{{ lang.tr('Ajouter une option (max 5)', 'إضافة خيار (أقصى 5)') }}</span>
                                  </button>
                                }
                              </div>
                            </div>
                          }

                          @case ('true_false') {
                            <div class="space-y-2">
                              <textarea dir="auto"
                                [value]="block.content"
                                (input)="updateBlockContent(block.id, $any($event.target).value)"
                                rows="2"
                                [placeholder]="lang.tr('Consigne (ex: Réponds par Vrai ou Faux)...', 'التعليمة (مثال: أجب بصواب أو خطأ)...')"
                                class="w-full bg-white dark:bg-[#0E1D2A] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[8px] p-2 text-xs text-[#102A43] dark:text-white outline-none"></textarea>

                              <div class="space-y-1.5">
                                <span class="text-[11px] font-semibold text-[#627D98] dark:text-[#8CA9C4]">{{ lang.tr('Affirmations :', 'الإفادات :') }}</span>
                                @for (st of block.tfStatements || []; track $index; let stIdx = $index) {
                                  <div class="flex items-center gap-2">
                                    <span class="text-xs font-mono text-[#627D98] shrink-0">{{ stIdx + 1 }}.</span>
                                    <input
                                      [id]="'tf-st-' + block.id + '-' + stIdx"
                                      type="text"
                                      [value]="st.text"
                                      (input)="updateTfStatement(block.id, stIdx, $any($event.target).value)"
                                      [placeholder]="lang.t('editorTfStatementPlaceholder')"
                                      class="grow bg-white dark:bg-[#0E1D2A] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[6px] p-1.5 text-xs text-[#102A43] dark:text-white outline-none" />
                                    <button
                                      (click)="toggleTfAnswer(block.id, stIdx)"
                                      [class]="st.answer ? 'bg-[#23845B] text-white' : 'bg-[#D64545] text-white'"
                                      class="px-2 py-1 rounded text-[10px] font-bold shrink-0 cursor-pointer">
                                      {{ st.answer ? 'Vrai (صواب)' : 'Faux (خطأ)' }}
                                    </button>
                                    @if ((block.tfStatements || []).length > 1) {
                                      <button
                                        (click)="removeTfStatement(block.id, stIdx)"
                                        class="text-[#D64545] hover:opacity-80 p-1 cursor-pointer">
                                        <span class="material-icons text-sm">close</span>
                                      </button>
                                    }
                                  </div>
                                }
                                <button
                                  (click)="addTfStatement(block.id)"
                                  class="text-[11px] font-semibold text-[#007CC2] flex items-center gap-1 cursor-pointer pt-1">
                                  <span class="material-icons text-xs">add</span>
                                  <span>{{ lang.tr('Ajouter une affirmation', 'إضافة إفادة') }}</span>
                                </button>
                              </div>
                            </div>
                          }

                          @case ('fill_blanks') {
                            <div class="space-y-2">
                              <label [for]="'gap-text-' + block.id" class="block text-[11px] font-semibold text-[#627D98] dark:text-[#8CA9C4]">
                                {{ lang.tr('Texte avec mots à cacher :', 'نص به كلمات مخفية :') }}
                              </label>
                              <textarea dir="auto"
                                [id]="'gap-text-' + block.id"
                                [value]="block.gapText || block.content"
                                (input)="updateBlockField(block.id, 'gapText', $any($event.target).value); updateBlockContent(block.id, $any($event.target).value)"
                                rows="3"
                                [placeholder]="lang.t('editorGapTextPlaceholder')"
                                class="w-full bg-white dark:bg-[#0E1D2A] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[8px] p-2 text-xs text-[#102A43] dark:text-white outline-none leading-relaxed"></textarea>
                              <p class="text-[11px] text-[#007CC2] italic">
                                💡 {{ lang.tr('Entourez les mots à cacher avec [[mot]]', 'أحط الكلمات المخفية بـ [[كلمة]]') }}
                              </p>
                            </div>
                          }

                          @case ('matching') {
                            <div class="space-y-2">
                              <textarea dir="auto"
                                [value]="block.content"
                                (input)="updateBlockContent(block.id, $any($event.target).value)"
                                rows="2"
                                placeholder="Consigne (ex: Relie chaque élément de gauche à sa correspondance à droite)..."
                                class="w-full bg-white dark:bg-[#0E1D2A] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[8px] p-2 text-xs text-[#102A43] dark:text-white outline-none"></textarea>

                              <div class="space-y-2">
                                <span class="text-[11px] font-semibold text-[#627D98] dark:text-[#8CA9C4]">Paires d'appariement (Gauche ↔ Droite) :</span>
                                @for (pair of block.matchingPairs || []; track $index; let pairIdx = $index) {
                                  <div class="flex items-center gap-2">
                                    <input
                                      [id]="'match-left-' + block.id + '-' + pairIdx"
                                      type="text"
                                      [value]="pair.left"
                                      (input)="updateMatchingPair(block.id, pairIdx, 'left', $any($event.target).value)"
                                      placeholder="Élément Gauche"
                                      class="w-1/2 bg-white dark:bg-[#0E1D2A] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[6px] p-1.5 text-xs text-[#102A43] dark:text-white outline-none" />
                                    <span class="text-[#007CC2] font-bold">↔</span>
                                    <input
                                      [id]="'match-right-' + block.id + '-' + pairIdx"
                                      type="text"
                                      [value]="pair.right"
                                      (input)="updateMatchingPair(block.id, pairIdx, 'right', $any($event.target).value)"
                                      placeholder="Élément Droite"
                                      class="w-1/2 bg-white dark:bg-[#0E1D2A] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[6px] p-1.5 text-xs text-[#102A43] dark:text-white outline-none" />
                                    @if ((block.matchingPairs || []).length > 1) {
                                      <button
                                        (click)="removeMatchingPair(block.id, pairIdx)"
                                        class="text-[#D64545] hover:opacity-80 p-1 cursor-pointer">
                                        <span class="material-icons text-sm">close</span>
                                      </button>
                                    }
                                  </div>
                                }
                                <button
                                  (click)="addMatchingPair(block.id)"
                                  class="text-[11px] font-semibold text-[#007CC2] flex items-center gap-1 cursor-pointer pt-1">
                                  <span class="material-icons text-xs">add</span>
                                  <span>Ajouter une paire</span>
                                </button>
                              </div>
                            </div>
                          }
                        }

                        <!-- Teacher Solution & Hints Accordion -->
                        <div class="space-y-1.5 pt-1">
                          <button
                            (click)="toggleSolution(block.id)"
                            class="text-[11px] font-semibold text-[#007CC2] flex items-center gap-1 cursor-pointer">
                            <span class="material-icons text-xs">{{ block.showSolution ? 'expand_less' : 'expand_more' }}</span>
                            <span>{{ block.showSolution ? lang.tr('Masquer le corrigé enseignant', 'إخفاء الإصلاح') : lang.tr('+ Ajouter / Voir le corrigé enseignant', '+ إضافة / تعديل الإصلاح النموذجي') }}</span>
                          </button>

                          @if (block.showSolution) {
                            <textarea dir="auto"
                              [value]="block.exerciseSolution || ''"
                              (input)="updateBlockField(block.id, 'exerciseSolution', $any($event.target).value)"
                              rows="2"
                              placeholder="Corrigé modèle et méthode de résolution (visible uniquement pour validation ou corrigé type)..."
                              class="w-full bg-[#E8F6EF] dark:bg-[#153B2D]/40 border border-[#23845B]/30 rounded-[8px] p-2.5 text-xs text-[#23845B] dark:text-[#68D391] outline-none font-mono"></textarea>
                          }
                        </div>

                        <!-- Variante IA (Idea 11) -->
                        <div class="flex items-center justify-between pt-2 border-t border-[#E3ECF2] dark:border-[#1A3145]">
                          <button
                            (click)="generateVariant(block)"
                            [disabled]="isVariantLoading()"
                            class="flex items-center gap-1.5 bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] disabled:opacity-50 text-white px-3 py-1.5 rounded-[8px] text-[11px] font-bold cursor-pointer transition-all shadow-sm">
                            @if (isVariantLoading()) {
                              <span class="material-icons text-xs animate-spin">refresh</span>
                              <span>{{ lang.tr('Génération...', 'جارٍ التوليد...') }}</span>
                            } @else {
                              <span class="material-icons text-xs">auto_awesome</span>
                              <span>{{ lang.tr('Générer une variante ✨', 'توليد نسخة مشابهة ✨') }}</span>
                            }
                          </button>
                          @if (lastVariantBlockId() === block.id) {
                            <span class="text-[10px] text-[#23845B] flex items-center gap-1 font-semibold">
                              <span class="material-icons text-xs">check_circle</span>
                              {{ lang.tr('Variante ajoutée ↓', 'تمت الإضافة ↓') }}
                            </span>
                          }
                        </div>
                      </div>
                    }

                    <!-- CALLOUT / PEDAGOGICAL ADVICE -->
                    @case ('callout') {
                      <div class="space-y-2 bg-[#E8F6EF] dark:bg-[#153B2D]/40 p-3.5 rounded-[12px] border border-[#23845B]/30">
                        <div class="flex items-center gap-2">
                          <span class="material-icons text-[#23845B] text-base">lightbulb</span>
                          <input dir="auto"
                            type="text"
                            [value]="block.calloutTitle || 'Conseil Pédagogique pour les Parents & Élèves'"
                            (input)="updateBlockField(block.id, 'calloutTitle', $any($event.target).value)"
                            placeholder="Titre de l'encadré..."
                            class="grow bg-white dark:bg-[#0E1D2A] border border-[#23845B]/30 rounded-[8px] p-1.5 text-xs font-semibold text-[#23845B] outline-none" />
                        </div>

                        <textarea dir="auto"
                          [value]="block.content"
                          (input)="updateBlockContent(block.id, $any($event.target).value)"
                          rows="2"
                          placeholder="Rédigez la règle essentielle, l'astuce de calcul ou le conseil aux parents..."
                          class="w-full bg-white dark:bg-[#0E1D2A] border border-[#23845B]/30 rounded-[8px] p-2.5 text-xs text-[#102A43] dark:text-white outline-none"></textarea>
                      </div>
                    }

                    <!-- CARTOUCHE MINISTERE -->
                    @case ('cartouche') {
                      <div class="bg-[#F7F9FB] dark:bg-[#152737] p-4 rounded-[12px] border-2 border-dashed border-[#007CC2]/40 text-xs space-y-2">
                        <div class="flex items-center justify-between text-[#007CC2] font-semibold">
                          <span class="flex items-center gap-1">
                            <span class="material-icons text-sm">badge</span>
                            {{ lang.tr('Cartouche Officiel du Ministère Tunisien', 'كارتوش الوزارة الرسمي') }}
                          </span>
                          <span class="text-[10px] bg-[#007CC2]/10 px-2 py-0.5 rounded">A4 Standard</span>
                        </div>
                        <p class="text-[#627D98] dark:text-[#8CA9C4] text-[11px]">
                          {{ lang.tr("Ce bloc génère automatiquement l'en-tête républicain (الجمهورية التونسية - وزارة التربية), le cadre d'identification de l'élève (الاسم / القسم / العدد) et le filigrane certifié.", 'يقوم هذا العنصر بتوليد الترويسة الرسمية التونسية، خانات تعمير اسم التلميذ والعدد / 20.') }}
                        </p>
                      </div>
                    }

                    <!-- IMAGE WITH VPS UPLOAD -->
                    @case ('image') {
                      <div class="space-y-3 bg-[#F7F9FB] dark:bg-[#152737] p-3.5 rounded-[12px] border border-[#E3ECF2] dark:border-[#1A3145]">
                        @if (block.imageUrl) {
                          <div class="relative rounded-lg overflow-hidden border border-[#E3ECF2]">
                            <img [src]="block.imageUrl" alt="Illustration" class="w-full h-48 object-cover" />
                            <button
                              (click)="updateBlockField(block.id, 'imageUrl', '')"
                              class="absolute top-2 right-2 bg-black/60 hover:bg-black text-white p-1 rounded-full cursor-pointer">
                              <span class="material-icons text-xs">close</span>
                            </button>
                          </div>
                        } @else {
                          <div class="border-2 border-dashed border-[#E3ECF2] dark:border-[#1A3145] rounded-lg p-4 text-center bg-white dark:bg-[#0E1D2A]">
                            <label class="cursor-pointer block">
                              <span class="material-icons text-2xl text-[#007CC2]">add_photo_alternate</span>
                              <p class="text-xs font-semibold text-[#102A43] dark:text-white mt-1">
                                {{ lang.tr('Uploader une illustration (Stockage VPS direct)', 'رفع صورة توضيحية من الجهاز') }}
                              </p>
                              <input
                                type="file"
                                (change)="handleBlockImageUpload(block.id, $event)"
                                accept="image/png,image/jpeg,image/webp"
                                class="hidden" />
                            </label>
                          </div>
                          @if (imageUploadError()) {
                            <p class="text-[11px] text-[#D64545] font-semibold mt-2 text-center">{{ imageUploadError() }}</p>
                          }
                        }

                        <input dir="auto"
                          type="text"
                          [value]="block.imageCaption || ''"
                          (input)="updateBlockField(block.id, 'imageCaption', $any($event.target).value)"
                          placeholder="Légende de l'image (Ex: Figure 1 : Schéma géométrique)..."
                          class="w-full bg-white dark:bg-[#0E1D2A] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[8px] p-2 text-xs text-[#102A43] dark:text-white outline-none" />
                      </div>
                    }

                    <!-- DIVIDER -->
                    @case ('divider') {
                      <div class="py-2">
                        <hr class="border-t-2 border-dashed border-[#E3ECF2] dark:border-[#1A3145]" />
                      </div>
                    }
                  }
                </div>
              }
            </div>

            <!-- Bottom Add Block Button -->
            <button
              (click)="addBlock('paragraph')"
              class="w-full py-3.5 rounded-[18px] border-2 border-dashed border-[#E3ECF2] dark:border-[#1A3145] hover:border-[#007CC2] text-[#627D98] hover:text-[#007CC2] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-white/50 dark:bg-[#0E1D2A]/50">
              <span class="material-icons text-sm">add</span>
              {{ lang.tr('Ajouter un paragraphe suivant', 'إضافة فقرة جديدة') }}
            </button>
          </div>
        }

        <!-- RIGHT COLUMN: LIVE A4 PRINT CANVAS PREVIEW -->
        @if (viewMode() === 'preview' || viewMode() === 'split') {
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-icons text-[#007CC2]">print</span>
                <h3 class="font-display font-semibold text-[#102A43] dark:text-white text-base">
                  {{ lang.tr('Rendu Impression A4 Officiel', 'المعاينة المطابقة للطباعة A4') }}
                </h3>
              </div>
              <button
                (click)="triggerPrintDialog()"
                class="bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] flex items-center gap-1 cursor-pointer shadow-xs">
                <span class="material-icons text-xs">print</span>
                {{ lang.t('printBtn') }}
              </button>
            </div>

            <!-- LIVE A4 PAPER CONTAINER -->
            <div id="printable-document" class="print-document bg-white rounded-sm p-8 sm:p-10 border border-[#CBD2D9] text-[#102A43] relative overflow-hidden min-h-[700px] space-y-5 shadow-[0_1px_2px_rgba(16,42,67,0.08),0_16px_48px_-16px_rgba(16,42,67,0.35)]">
              
              <!-- 45 DEGREE WATERMARK -->
              <div class="print-watermark absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 select-none rotate-[-25deg]">
                <span class="text-5xl font-black uppercase text-[#007CC2] tracking-widest text-center leading-tight">
                  MADRASATI TN <br /> {{ docWatermark() }}
                </span>
              </div>

              <!-- REPUBLICAN CARTOUCHE -->
              @if (hasCartoucheBlock()) {
                <div class="border-b-2 border-[#102A43] pb-4">
                  <div class="flex items-center justify-between text-xs">
                    <div class="text-left font-bold leading-tight">
                      <p>الجمهورية التونسية</p>
                      <p>وزارة التربية والتعليم</p>
                      <p class="text-[10px] text-[#486581] font-normal">{{ docSchool() }}</p>
                    </div>

                    <div class="text-center font-bold">
                      <p class="font-display text-lg text-[#007CC2] font-semibold">{{ docTitle() || 'Évaluation & Devoir' }}</p>
                      <p class="text-xs text-[#486581]">{{ docGrade() }} • {{ docSubject() }}</p>
                      @if (totalExamPoints() > 0) {
                        <p class="text-[11px] font-bold text-[#23845B] mt-0.5">{{ lang.tr('Total', 'المجموع') }} : {{ totalExamPoints() }} / 20</p>
                      }
                    </div>

                    <div class="text-right text-xs text-[#334E68] leading-tight">
                      <p>{{ docTrimester() }}</p>
                      <p>السنة الدراسية: {{ docSchoolYear() }}</p>
                    </div>
                  </div>

                  <!-- Student Identification Box -->
                  <div class="mt-4 pt-2.5 border-t border-dashed border-[#CBD2D9] grid grid-cols-3 gap-2 text-xs font-semibold">
                    <p>الاسم واللقب: ....................................</p>
                    <p>القسم: {{ docGrade() }}</p>
                    <p class="text-right font-bold text-[#007CC2]">العدد: .......... / 20</p>
                  </div>
                </div>
              } @else {
                <!-- Standard Header if no Cartouche -->
                <div class="border-b border-[#E3ECF2] pb-3 flex items-center justify-between text-xs">
                  <div>
                    <h2 class="font-display font-bold text-lg text-[#102A43]">{{ docTitle() || 'Document Pédagogique' }}</h2>
                    <p class="text-[#627D98]">{{ docSubject() }} — {{ docGrade() }}</p>
                  </div>
                  <div class="text-right">
                    <span class="text-[11px] text-[#627D98] block">{{ docTrimester() }}</span>
                    @if (totalExamPoints() > 0) {
                      <span class="text-[11px] font-bold text-[#23845B]">{{ lang.tr('Total', 'المجموع') }} : {{ totalExamPoints() }} / 20</span>
                    }
                  </div>
                </div>
              }

              <!-- RENDERED BLOCKS PREVIEW — click any block to edit it in place -->
              <div class="space-y-4 text-xs leading-relaxed relative z-10">
                @for (b of blocks(); track b.id) {
                  <div
                    (click)="startInlineEdit(b)"
                    (keydown.enter)="startInlineEdit(b)"
                    [tabindex]="editingBlockId() === b.id ? -1 : 0"
                    role="button"
                    [class.cursor-text]="isInlineEditable(b)"
                    class="group/pv relative rounded-md outline-none transition-shadow print:shadow-none"
                    [class.hover:ring-1]="isInlineEditable(b) && editingBlockId() !== b.id"
                    [class.hover:ring-[#007CC2]]="isInlineEditable(b) && editingBlockId() !== b.id"
                    [class.ring-2]="editingBlockId() === b.id"
                    [class.ring-[#007CC2]]="editingBlockId() === b.id"
                    [attr.data-editing]="editingBlockId() === b.id ? 'true' : null">

                    @if (isInlineEditable(b) && editingBlockId() !== b.id) {
                      <span class="absolute -top-2 -right-2 z-20 hidden group-hover/pv:flex w-5 h-5 rounded-full bg-[#007CC2] text-white items-center justify-center shadow print:hidden">
                        <span class="material-icons text-[12px]">edit</span>
                      </span>
                    }

                    @switch (b.type) {
                      @case ('paragraph') {
                        @if (editingBlockId() === b.id) {
                          <textarea dir="auto"
                            [value]="b.content"
                            (input)="updateBlockContent(b.id, $any($event.target).value)"
                            (blur)="stopInlineEdit()"
                            (keydown.escape)="stopInlineEdit()"
                            (click)="$event.stopPropagation()"
                            rows="3"
                            class="w-full bg-[#F3FAFD] border border-[#007CC2]/40 rounded p-2 text-xs text-[#102A43] outline-none leading-relaxed"></textarea>
                        } @else {
                          <p dir="auto" class="text-[#102A43] whitespace-pre-line min-h-[1em]">{{ b.content || '…' }}</p>
                        }
                      }
                      @case ('heading1') {
                        @if (editingBlockId() === b.id) {
                          <input dir="auto"
                            type="text"
                            [value]="b.content"
                            (input)="updateBlockContent(b.id, $any($event.target).value)"
                            (blur)="stopInlineEdit()"
                            (keydown.escape)="stopInlineEdit()"
                            (keydown.enter)="stopInlineEdit()"
                            (click)="$event.stopPropagation()"
                            class="w-full bg-[#F3FAFD] border border-[#007CC2]/40 rounded p-1.5 font-display font-bold text-base text-[#102A43] outline-none" />
                        } @else {
                          <h2 dir="auto" class="font-display font-bold text-base text-[#102A43] pt-2 border-b border-[#102A43]/20 pb-1">{{ b.content || '…' }}</h2>
                        }
                      }
                      @case ('heading2') {
                        @if (editingBlockId() === b.id) {
                          <input dir="auto"
                            type="text"
                            [value]="b.content"
                            (input)="updateBlockContent(b.id, $any($event.target).value)"
                            (blur)="stopInlineEdit()"
                            (keydown.escape)="stopInlineEdit()"
                            (keydown.enter)="stopInlineEdit()"
                            (click)="$event.stopPropagation()"
                            class="w-full bg-[#F3FAFD] border border-[#007CC2]/40 rounded p-1.5 font-display font-semibold text-sm text-[#007CC2] outline-none" />
                        } @else {
                          <h3 dir="auto" class="font-display font-semibold text-sm text-[#007CC2] pt-1">{{ b.content || '…' }}</h3>
                        }
                      }
                      @case ('heading3') {
                        @if (editingBlockId() === b.id) {
                          <input dir="auto"
                            type="text"
                            [value]="b.content"
                            (input)="updateBlockContent(b.id, $any($event.target).value)"
                            (blur)="stopInlineEdit()"
                            (keydown.escape)="stopInlineEdit()"
                            (keydown.enter)="stopInlineEdit()"
                            (click)="$event.stopPropagation()"
                            class="w-full bg-[#F3FAFD] border border-[#007CC2]/40 rounded p-1.5 font-semibold text-xs text-[#102A43] outline-none" />
                        } @else {
                          <h4 dir="auto" class="font-semibold text-xs text-[#102A43]">{{ b.content || '…' }}</h4>
                        }
                      }
                      @case ('exercise') {
                        <div class="bg-[#F7F9FB] rounded-lg p-3.5 border border-[#CBD2D9] space-y-2">
                          @if (editingBlockId() === b.id) {
                            <div class="flex items-center justify-between gap-2">
                              <input dir="auto"
                                type="text"
                                [value]="b.exerciseTitle || ''"
                                (input)="updateBlockField(b.id, 'exerciseTitle', $any($event.target).value)"
                                (keydown.escape)="stopInlineEdit()"
                                (click)="$event.stopPropagation()"
                                class="grow bg-[#F3FAFD] border border-[#007CC2]/40 rounded p-1.5 text-xs font-semibold text-[#102A43] outline-none" />
                              <input
                                type="number"
                                [value]="b.exercisePoints || 5"
                                (input)="updateBlockField(b.id, 'exercisePoints', +$any($event.target).value)"
                                (click)="$event.stopPropagation()"
                                min="1"
                                max="20"
                                class="w-14 bg-[#F3FAFD] border border-[#007CC2]/40 rounded p-1.5 text-xs font-bold text-center text-[#23845B] outline-none" />
                            </div>
                            <textarea dir="auto"
                              [value]="(b.exerciseFormat === 'fill_blanks' ? b.gapText : b.content) || ''"
                              (input)="updateBlockContent(b.id, $any($event.target).value); b.exerciseFormat === 'fill_blanks' && updateBlockField(b.id, 'gapText', $any($event.target).value)"
                              (blur)="stopInlineEdit()"
                              (keydown.escape)="stopInlineEdit()"
                              (click)="$event.stopPropagation()"
                              rows="3"
                              class="w-full bg-[#F3FAFD] border border-[#007CC2]/40 rounded p-2 text-xs text-[#334E68] outline-none"></textarea>
                          } @else {
                            <div class="flex items-center justify-between font-semibold">
                              <span class="text-[#102A43]">{{ b.exerciseTitle || 'Exercice' }}</span>
                              <span class="text-[#23845B] font-bold">({{ b.exercisePoints || 5 }} points)</span>
                            </div>

                            <!-- Format specific preview rendering -->
                            @switch (b.exerciseFormat || 'free') {
                              @case ('free') {
                                <p dir="auto" class="text-[#334E68] whitespace-pre-line">{{ b.content || '…' }}</p>
                              }

                              @case ('qcm') {
                                @if (b.content) {
                                  <p dir="auto" class="text-[#334E68] whitespace-pre-line font-medium mb-1">{{ b.content }}</p>
                                }
                                <div class="grid grid-cols-2 gap-2 text-xs pt-1">
                                  @for (opt of b.qcmOptions || []; track $index) {
                                    <div class="flex items-start gap-1.5">
                                      <span class="text-sm text-[#486581]">☐</span>
                                      <span class="font-semibold text-[#102A43]">{{ getOptionLetter($index) }})</span>
                                      <span class="text-[#334E68]">{{ opt }}</span>
                                    </div>
                                  }
                                </div>
                              }

                              @case ('true_false') {
                                @if (b.content) {
                                  <p dir="auto" class="text-[#334E68] whitespace-pre-line font-medium mb-1.5">{{ b.content }}</p>
                                }
                                <div class="space-y-1.5 text-xs">
                                  @for (st of b.tfStatements || []; track $index) {
                                    <div class="flex items-center justify-between py-1 border-b border-dashed border-[#CBD2D9]/60">
                                      <span class="text-[#102A43]">{{ $index + 1 }}. {{ st.text }}</span>
                                      <span class="font-semibold text-[#627D98] shrink-0 ms-2">( صواب / خطأ )</span>
                                    </div>
                                  }
                                </div>
                              }

                              @case ('fill_blanks') {
                                <p dir="auto" class="text-[#334E68] whitespace-pre-line leading-relaxed font-mono">
                                  {{ renderGapTextPreview(b.gapText || b.content) }}
                                </p>
                              }

                              @case ('matching') {
                                @if (b.content) {
                                  <p dir="auto" class="text-[#334E68] whitespace-pre-line font-medium mb-2">{{ b.content }}</p>
                                }
                                <div class="grid grid-cols-2 gap-6 text-xs pt-1">
                                  <div class="space-y-3">
                                    @for (pair of b.matchingPairs || []; track $index) {
                                      <div class="p-2 bg-white rounded border border-[#E3ECF2] font-semibold text-[#102A43]">
                                        {{ $index + 1 }}. {{ pair.left }}
                                      </div>
                                    }
                                  </div>
                                  <div class="space-y-3">
                                    @for (rightText of getShuffledMatchingRights(b.id, b.matchingPairs); track $index) {
                                      <div class="p-2 bg-white rounded border border-[#E3ECF2] text-[#334E68]">
                                        • {{ rightText }}
                                      </div>
                                    }
                                  </div>
                                </div>
                              }
                            }

                            <!-- Corrigé / Teacher Solution Rendering -->
                            @if (b.showSolution || b.exerciseSolution) {
                              <div class="mt-2 pt-2 border-t border-dashed border-[#23845B]/30 bg-[#E8F6EF]/50 p-2 rounded text-[11px] text-[#23845B] space-y-1 font-mono">
                                <p class="font-bold uppercase tracking-wider">Solution / Corrigé :</p>
                                @switch (b.exerciseFormat || 'free') {
                                  @case ('qcm') {
                                    <p>Réponse correcte : {{ getOptionLetter(b.qcmCorrectIndex ?? 0) }}) {{ (b.qcmOptions || [])[b.qcmCorrectIndex ?? 0] }}</p>
                                  }
                                  @case ('true_false') {
                                    <div class="flex flex-wrap gap-2">
                                      @for (st of b.tfStatements || []; track $index) {
                                        <span>{{ $index + 1 }}) {{ st.answer ? 'Vrai' : 'Faux' }}</span>
                                      }
                                    </div>
                                  }
                                  @case ('fill_blanks') {
                                    <p>Mots cachés : {{ extractGapWords(b.gapText || b.content).join(', ') }}</p>
                                  }
                                  @case ('matching') {
                                    <div class="space-y-0.5">
                                      @for (pair of b.matchingPairs || []; track $index) {
                                        <p>{{ pair.left }} ↔ {{ pair.right }}</p>
                                      }
                                    </div>
                                  }
                                }
                                @if (b.exerciseSolution) {
                                  <p class="whitespace-pre-line pt-1 border-t border-[#23845B]/20">{{ b.exerciseSolution }}</p>
                                }
                              </div>
                            }
                          }
                        </div>
                      }
                      @case ('callout') {
                        <div class="bg-[#E8F6EF] rounded-lg p-3 border-s-4 border-[#23845B] space-y-1">
                          @if (editingBlockId() === b.id) {
                            <input dir="auto"
                              type="text"
                              [value]="b.calloutTitle || ''"
                              (input)="updateBlockField(b.id, 'calloutTitle', $any($event.target).value)"
                              (keydown.escape)="stopInlineEdit()"
                              (click)="$event.stopPropagation()"
                              class="w-full bg-white border border-[#23845B]/40 rounded p-1.5 text-xs font-semibold text-[#23845B] outline-none" />
                            <textarea dir="auto"
                              [value]="b.content"
                              (input)="updateBlockContent(b.id, $any($event.target).value)"
                              (blur)="stopInlineEdit()"
                              (keydown.escape)="stopInlineEdit()"
                              (click)="$event.stopPropagation()"
                              rows="2"
                              class="w-full bg-white border border-[#23845B]/40 rounded p-2 text-xs text-[#102A43] outline-none"></textarea>
                          } @else {
                            <p class="font-semibold text-[#23845B]">{{ b.calloutTitle || 'Remarque Pédagogique' }}</p>
                            <p dir="auto" class="text-[#102A43]">{{ b.content || '…' }}</p>
                          }
                        </div>
                      }
                      @case ('image') {
                        @if (b.imageUrl) {
                          <div class="text-center py-2">
                            <img [src]="b.imageUrl" alt="Illustration" class="max-h-48 rounded mx-auto border border-[#E3ECF2]" />
                            @if (b.imageCaption) {
                              <p class="text-[10px] text-[#627D98] mt-1 italic">{{ b.imageCaption }}</p>
                            }
                          </div>
                        }
                      }
                      @case ('divider') {
                        <hr class="border-t border-[#E3ECF2]" />
                      }
                    }
                  </div>
                }
              </div>

              <!-- FOOTER WATERMARK & ATTRIBUTION -->
              <div class="border-t border-[#E3ECF2] pt-3 text-[10px] text-[#627D98] flex items-center justify-between">
                <span>Attribution : {{ docWatermark() }}</span>
                <span>Plateforme Nationale Madrasati TN</span>
              </div>
            </div>
          </div>
        }

      </div>
    </div>

    <!-- PUBLISH MODAL -->
    @if (publishModalOpen()) {
      <div class="fixed inset-0 z-50 bg-[#0B2947]/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white dark:bg-[#0E1D2A] rounded-[24px] max-w-md w-full p-6 space-y-4 border border-[#E3ECF2] dark:border-[#1A3145] shadow-xl">
          <div class="flex items-center justify-between border-b border-[#E3ECF2] dark:border-[#1A3145] pb-3">
            <h3 class="font-display font-semibold text-[#102A43] dark:text-white text-base">
              {{ lang.tr('Publier le Document', 'تأكيد نشر الوثيقة') }}
            </h3>
            <button (click)="publishModalOpen.set(false)" class="text-[#627D98] hover:text-[#102A43] dark:hover:text-white cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <p class="text-[#486581] dark:text-[#8CA9C4]">
              {{ lang.tr("Choisissez l'emplacement de publication dans l'écosystème Madrasati TN :", 'اختر مكان النشر على منصة مدرستي تونس:') }}
            </p>

            <button
              (click)="publishAsDocumentBank()"
              class="w-full p-3.5 rounded-[12px] bg-[#E8F5FC] dark:bg-[#102A43] hover:bg-[#D7E7F2] text-left rtl:text-right flex items-center gap-3 cursor-pointer border border-[#007CC2]/30 transition-colors">
              <div class="w-9 h-9 rounded-full bg-[#007CC2] text-white flex items-center justify-center shrink-0">
                <span class="material-icons text-base">print</span>
              </div>
              <div>
                <p class="font-semibold text-[#007CC2]">{{ lang.tr('Banque de Documents & Impression A4', 'بنك الوثائق والامتحانات A4') }}</p>
                <p class="text-[11px] text-[#486581] dark:text-[#8CA9C4]">{{ lang.tr('Accessible pour les parents avec impression 1-clic', 'متاح للأولياء للتحميل والطباعة الفورية') }}</p>
              </div>
            </button>

            <button
              (click)="publishAsBlogArticle()"
              class="w-full p-3.5 rounded-[12px] bg-[#E8F6EF] dark:bg-[#153B2D] hover:bg-[#D0EFE2] text-left rtl:text-right flex items-center gap-3 cursor-pointer border border-[#23845B]/30 transition-colors">
              <div class="w-9 h-9 rounded-full bg-[#23845B] text-white flex items-center justify-center shrink-0">
                <span class="material-icons text-base">article</span>
              </div>
              <div>
                <p class="font-semibold text-[#23845B]">{{ lang.tr('Blog & Conseils Pédagogiques', 'المدونة والمقالات البيداغوجية') }}</p>
                <p class="text-[11px] text-[#486581] dark:text-[#8CA9C4]">{{ lang.tr('Publié pour lecture et commentaires des parents', 'متاح للقراءة وتفاعل الأولياء بالتعليقات') }}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    }

    <!-- AI GENERATION MODAL -->
    @if (aiModalOpen()) {
      <div class="fixed inset-0 z-50 bg-[#0B2947]/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white dark:bg-[#0E1D2A] rounded-[24px] max-w-lg w-full p-6 space-y-4 border border-[#E3ECF2] dark:border-[#1A3145] shadow-xl">
          <div class="flex items-center justify-between border-b border-[#E3ECF2] dark:border-[#1A3145] pb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-[#E0AA32]">auto_awesome</span>
              <h3 class="font-display font-semibold text-[#102A43] dark:text-white text-base">
                {{ lang.tr('Assistant de Rédaction IA Gemini', 'المساعد الذكي لكتابة التمارين والمقالات') }}
              </h3>
            </div>
            <button (click)="aiModalOpen.set(false)" class="text-[#627D98] hover:text-[#102A43] dark:hover:text-white cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label for="ai-prompt-input" class="block font-semibold text-[#102A43] dark:text-white mb-1">
                {{ lang.tr('Que souhaitez-vous générer ou reformuler ?', 'ما الذي تريد توليده أو تحسين صياغته ؟') }}
              </label>
              <textarea dir="auto"
                id="ai-prompt-input"
                [value]="aiPromptQuery()"
                (input)="aiPromptQuery.set($any($event.target).value)"
                rows="3"
                placeholder="Ex: Génère un problème de calcul mental avec solution pour 4ème année primaire..."
                class="w-full bg-[#F7F9FB] dark:bg-[#152737] border border-[#E3ECF2] dark:border-[#1A3145] rounded-[10px] p-2.5 text-[#102A43] dark:text-white outline-none"></textarea>
            </div>

            <div class="flex flex-wrap gap-2 pt-1">
              <button
                (click)="aiPromptQuery.set('Génère une série de 3 exercices gradués sur la multiplication et la division avec corrigé')"
                class="bg-[#E8F5FC] dark:bg-[#102A43] text-[#007CC2] px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer">
                💡 3 Exercices gradués
              </button>
              <button
                (click)="aiPromptQuery.set('Rédige 4 conseils concrets pour aider un parent à faire réviser la dictée arabe à la maison')"
                class="bg-[#E8F6EF] dark:bg-[#153B2D] text-[#23845B] px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer">
                💡 Conseils parents dictée
              </button>
            </div>

            <button
              [disabled]="isAiLoading() || !aiPromptQuery()"
              (click)="generateWithGemini()"
              class="w-full bg-[#E0AA32] hover:bg-[#D19A24] text-[#0B2947] font-semibold py-2.5 rounded-[10px] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm">
              @if (isAiLoading()) {
                <span class="material-icons animate-spin text-sm">sync</span>
                <span>{{ lang.tr('Génération en cours...', 'جاري التوليد...') }}</span>
              } @else {
                <span class="material-icons text-sm">auto_awesome</span>
                <span>{{ lang.tr('Insérer le résultat dans l’éditeur', 'توليد وإدراج المحتوى') }}</span>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class EditorStudioComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  readonly firebase = inject(FirebaseService);
  readonly interactionSvc = inject(InteractionService);

  readonly viewMode = signal<'editor' | 'split' | 'preview'>('split');

  // Phase 3: Studio shell derived from docType
  // Shell A = exam / exercise_sheet / course / summary → 3-col A4 layout
  // Shell B = article → Medium-style centered prose canvas
  readonly studioShell = computed<'A' | 'B'>(() =>
    this.docType() === 'article' ? 'B' : 'A'
  );

  // Variante IA state (Idea 11)
  readonly isVariantLoading = signal<boolean>(false);
  readonly lastVariantBlockId = signal<string | null>(null);

  // Click-to-edit directly inside the A4 preview (Gamma-style ergonomics).
  readonly editingBlockId = signal<string | null>(null);


  isInlineEditable(b: EditorBlock): boolean {
    return b.type !== 'image' && b.type !== 'divider' && b.type !== 'cartouche';
  }

  startInlineEdit(b: EditorBlock) {
    if (!this.isInlineEditable(b)) return;
    this.editingBlockId.set(b.id);
    // Focus the freshly rendered inline control (autofocus attr is a11y-banned).
    if (typeof document !== 'undefined') {
      setTimeout(() => {
        const el = document.querySelector<HTMLElement>('[data-editing="true"] textarea, [data-editing="true"] input');
        el?.focus();
      });
    }
  }

  stopInlineEdit() {
    this.editingBlockId.set(null);
  }
  readonly isAutoSaved = signal<boolean>(true);
  readonly publishModalOpen = signal<boolean>(false);
  readonly aiModalOpen = signal<boolean>(false);
  readonly isAiLoading = signal<boolean>(false);
  readonly aiPromptQuery = signal<string>('');
  readonly imageUploadError = signal<string>('');

  private readonly MAX_IMAGE_BYTES = 15 * 1024 * 1024;
  private readonly ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

  // Document Metadata
  readonly docTitle = signal<string>('Évaluation de Mathématiques — Trimestre 1');
  readonly docType = signal<DocumentType>('exam');
  readonly docSubject = signal<SubjectName>('Mathématiques');
  readonly docGrade = signal<GradeLevel>('4ème Année');
  readonly docTrimester = signal<'Trimestre 1' | 'Trimestre 2' | 'Trimestre 3'>('Trimestre 1');
  readonly docSchoolYear = signal<string>('2025-2026');
  readonly docSchool = signal<string>('École Primaire Habib Bourguiba');
  readonly docWatermark = signal<string>('Madrasati TN — Document Certifié');

  // Computed live exam points sum
  readonly totalExamPoints = computed(() => {
    return this.blocks()
      .filter((b) => b.type === 'exercise')
      .reduce((sum, b) => sum + (b.exercisePoints || 0), 0);
  });

  // Blocks
  readonly blocks = signal<EditorBlock[]>([
    {
      id: 'b-cartouche',
      type: 'cartouche',
      content: '',
    },
    {
      id: 'b-h1',
      type: 'heading1',
      content: 'I. Activités Numériques & Opérations',
    },
    {
      id: 'b-ex1',
      type: 'exercise',
      exerciseTitle: 'Exercice N°1 : Calcul posé',
      exercisePoints: 8,
      content: 'Pose et effectue les opérations suivantes :\na) 4 825 + 3 947 = ............\nb) 9 000 - 4 382 = ............\nc) 348 × 26 = ............',
      exerciseSolution: 'a) 8 772\nb) 4 618\nc) 9 048',
      showSolution: false,
    },
    {
      id: 'b-callout',
      type: 'callout',
      calloutTitle: 'Rappel pour la retenue',
      content: "N'oublie pas d'ajouter la retenue sur la colonne suivante lors de l'addition et de la multiplication.",
    },
    {
      id: 'b-h2',
      type: 'heading1',
      content: 'II. Résolution de Problème',
    },
    {
      id: 'b-ex2',
      type: 'exercise',
      exerciseTitle: 'Exercice N°2 : Situation Problème',
      exercisePoints: 12,
      content: 'Un agriculteur récolte 1 450 kg d\'olives le matin et 980 kg l\'après-midi.\n1) Calcule la masse totale d\'olives récoltées.\n2) Il vend les olives à 3 dinars le kg. Quel est le montant total de la vente ?',
      exerciseSolution: '1) 1 450 + 980 = 2 430 kg\n2) 2 430 × 3 = 7 290 DT',
      showSolution: false,
    },
  ]);

  private draftLoaded = false;

  constructor() {
    this.loadDraft();
    const user = this.firebase.userProfile() || this.firebase.currentUser();
    if (user?.displayName) {
      this.docWatermark.set(`Madrasati TN — Enseignant : ${user.displayName}`);
    }
    this.draftLoaded = true;

    // Auto-persist any metadata/block change to localStorage.
    effect(() => {
      // Track every persisted field so the effect re-runs on any edit.
      this.docTitle();
      this.docType();
      this.docSubject();
      this.docGrade();
      this.docTrimester();
      this.docSchool();
      this.docWatermark();
      this.blocks();
      if (this.draftLoaded) this.saveDraft();
    });
  }

  saveDraft() {
    if (typeof localStorage !== 'undefined') {
      const draft = {
        title: this.docTitle(),
        type: this.docType(),
        subject: this.docSubject(),
        grade: this.docGrade(),
        trimester: this.docTrimester(),
        school: this.docSchool(),
        watermark: this.docWatermark(),
        blocks: this.blocks(),
      };
      localStorage.setItem('madrasati_studio_draft', JSON.stringify(draft));
      this.isAutoSaved.set(true);
    }
  }

  loadDraft() {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('madrasati_studio_draft');
      if (raw) {
        try {
          const draft = JSON.parse(raw);
          if (draft.title) this.docTitle.set(draft.title);
          if (draft.type) this.docType.set(draft.type);
          if (draft.subject) this.docSubject.set(draft.subject);
          if (draft.grade) this.docGrade.set(draft.grade);
          if (draft.trimester) this.docTrimester.set(draft.trimester);
          if (draft.school) this.docSchool.set(draft.school);
          if (draft.watermark) this.docWatermark.set(draft.watermark);
          if (Array.isArray(draft.blocks) && draft.blocks.length > 0) this.blocks.set(draft.blocks);
        } catch (e) {
          console.error('Failed to parse draft', e);
        }
      }
    }
  }

  loadTemplatePreset(type: 'exam_full' | 'course_summary' | 'exercise_sheet') {
    if (type === 'exam_full') {
      this.docType.set('exam');
      this.docTitle.set(`Évaluation Trimestrielle : ${this.docSubject()} (${this.docGrade()})`);
      this.blocks.set([
        { id: 'b-' + Date.now() + '-1', type: 'cartouche', content: '' },
        { id: 'b-' + Date.now() + '-2', type: 'heading1', content: 'I. Connaissances & Application' },
        { id: 'b-' + Date.now() + '-3', type: 'exercise', exerciseTitle: 'Exercice 1', exercisePoints: 8, content: 'Consigne et énoncé du premier exercice...', exerciseSolution: 'Corrigé type de l\'exercice 1...', showSolution: false },
        { id: 'b-' + Date.now() + '-4', type: 'heading1', content: 'II. Raisonnement & Résolution de Problème' },
        { id: 'b-' + Date.now() + '-5', type: 'exercise', exerciseTitle: 'Exercice 2 (Situation Problème)', exercisePoints: 12, content: 'Texte du problème avec mise en situation...', exerciseSolution: 'Solution détaillée et étapes de calcul...', showSolution: false },
      ]);
    } else if (type === 'course_summary') {
      this.docType.set('course');
      this.docTitle.set(`Fiche de Synthèse : ${this.docSubject()} (${this.docGrade()})`);
      this.blocks.set([
        { id: 'b-' + Date.now() + '-1', type: 'heading1', content: 'Objectifs d\'apprentissage' },
        { id: 'b-' + Date.now() + '-2', type: 'paragraph', content: 'Ce résumé regroupe les notions clés et les règles essentielles du programme officiel.' },
        { id: 'b-' + Date.now() + '-3', type: 'callout', calloutTitle: 'Règle Fondamentale', content: 'Définition ou formule à retenir par cœur.' },
        { id: 'b-' + Date.now() + '-4', type: 'exercise', exerciseTitle: 'Exemple d\'Application', exercisePoints: 5, content: 'Application directe de la règle...', exerciseSolution: 'Corrigé explicatif...', showSolution: true },
      ]);
    } else if (type === 'exercise_sheet') {
      this.docType.set('exercise_sheet');
      this.docTitle.set(`Série d'Entraînement : ${this.docSubject()} (${this.docGrade()})`);
      this.blocks.set([
        { id: 'b-' + Date.now() + '-1', type: 'heading1', content: 'Série d\'Exercices Pratiques' },
        { id: 'b-' + Date.now() + '-2', type: 'exercise', exerciseTitle: 'Exercice 1 : Entraînement de base', exercisePoints: 10, content: 'Exercices d\'assimilation rapide...', showSolution: false },
        { id: 'b-' + Date.now() + '-3', type: 'exercise', exerciseTitle: 'Exercice 2 : Approfondissement', exercisePoints: 10, content: 'Questions d\'analyse et de réflexion...', showSolution: false },
      ]);
    }
    this.saveDraft();
  }

  readonly hasCartoucheBlock = computed(() => {
    return this.blocks().some((b) => b.type === 'cartouche');
  });

  getBlockTypeLabel(type: EditorBlockType): string {
    switch (type) {
      case 'paragraph':
        return 'Paragraphe';
      case 'heading1':
        return 'Titre H1';
      case 'heading2':
        return 'Sous-titre H2';
      case 'heading3':
        return 'Section H3';
      case 'exercise':
        return 'Exercice & Barème';
      case 'callout':
        return 'Encadré Conseil';
      case 'cartouche':
        return 'En-tête Officiel';
      case 'image':
        return 'Image VPS';
      case 'divider':
        return 'Séparateur';
      default:
        return 'Bloc';
    }
  }

  addBlock(type: EditorBlockType) {
    const exerciseCount = this.blocks().filter((b) => b.type === 'exercise').length;
    const newBlock: EditorBlock = {
      id: 'b-' + Date.now(),
      type,
      content: '',
      exerciseTitle: type === 'exercise' ? 'Exercice N°' + (exerciseCount + 1) : undefined,
      exercisePoints: type === 'exercise' ? 5 : undefined,
      calloutTitle: type === 'callout' ? 'Conseil Pédagogique' : undefined,
    };
    this.blocks.update((list) => [...list, newBlock]);
  }

  updateBlockContent(id: string, content: string) {
    this.blocks.update((list) =>
      list.map((b) => (b.id === id ? { ...b, content } : b))
    );
  }

  updateBlockField(id: string, field: keyof EditorBlock, value: string | number | boolean) {
    this.blocks.update((list) =>
      list.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  }

  toggleSolution(id: string) {
    this.blocks.update((list) =>
      list.map((b) => (b.id === id ? { ...b, showSolution: !b.showSolution } : b))
    );
  }

  moveBlockUp(idx: number) {
    if (idx <= 0) return;
    this.blocks.update((list) => {
      const copy = [...list];
      const temp = copy[idx - 1];
      copy[idx - 1] = copy[idx];
      copy[idx] = temp;
      return copy;
    });
  }

  moveBlockDown(idx: number) {
    if (idx >= this.blocks().length - 1) return;
    this.blocks.update((list) => {
      const copy = [...list];
      const temp = copy[idx + 1];
      copy[idx + 1] = copy[idx];
      copy[idx] = temp;
      return copy;
    });
  }

  duplicateBlock(idx: number) {
    const target = this.blocks()[idx];
    const cloned: EditorBlock = {
      ...target,
      id: 'b-' + Date.now(),
    };
    this.blocks.update((list) => {
      const copy = [...list];
      copy.splice(idx + 1, 0, cloned);
      return copy;
    });
  }

  deleteBlock(id: string) {
    this.blocks.update((list) => list.filter((b) => b.id !== id));
  }

  onDocTitleInput(e: Event) {
    this.docTitle.set((e.target as HTMLInputElement).value);
  }

  readonly docTypeOptions: { value: DocumentType; icon: string; fr: string; ar: string; sub: string }[] = [
    { value: 'exam', icon: 'assignment', fr: 'Examen A4', ar: 'امتحان رسمي', sub: 'Évaluation / Examen' },
    { value: 'course', icon: 'menu_book', fr: 'Cours & Résumé', ar: 'درس وتلخيص', sub: 'Cours A4' },
    { value: 'exercise_sheet', icon: 'fact_check', fr: "Fiche d'Exercices", ar: 'تمارين تطبيقية', sub: 'Exercices' },
    { value: 'article', icon: 'article', fr: 'Article de Blog', ar: 'مقال توجيهي', sub: 'Blog pédagogique' },
  ];

  setDocType(t: DocumentType) {
    this.docType.set(t);
  }

  onDocTypeChange(e: Event) {
    this.docType.set((e.target as HTMLSelectElement).value as DocumentType);
  }

  readonly docSubjectOptions: { value: SubjectName; icon: string; fr: string; ar: string }[] = [
    { value: 'Mathématiques', icon: 'calculate', fr: 'Mathématiques', ar: 'الرياضيات' },
    { value: 'Français', icon: 'translate', fr: 'Français', ar: 'الفرنسية' },
    { value: 'اللغة العربية', icon: 'auto_stories', fr: 'Langue Arabe', ar: 'اللغة العربية' },
    { value: 'Éveil Scientifique', icon: 'science', fr: 'Éveil Scientifique', ar: 'الإيقاظ العلمي' },
    { value: 'Histoire & Géographie', icon: 'public', fr: 'Histoire-Géo', ar: 'التاريخ والجغرافيا' },
    { value: 'Anglais', icon: 'language', fr: 'Anglais', ar: 'الإنجليزية' },
  ];

  readonly docGradeOptions: { value: GradeLevel; icon: string; fr: string; ar: string }[] = [
    { value: '1ère Année', icon: 'looks_one', fr: '1ère Année', ar: 'الأولى ابتدائي' },
    { value: '2ème Année', icon: 'looks_two', fr: '2ème Année', ar: 'الثانية ابتدائي' },
    { value: '3ème Année', icon: 'looks_3', fr: '3ème Année', ar: 'الثالثة ابتدائي' },
    { value: '4ème Année', icon: 'looks_4', fr: '4ème Année', ar: 'الرابعة ابتدائي' },
    { value: '5ème Année', icon: 'looks_5', fr: '5ème Année', ar: 'الخامسة ابتدائي' },
    { value: '6ème Année', icon: 'looks_6', fr: '6ème Année', ar: 'السادسة (مناظرة)' },
  ];

  setDocSubject(s: SubjectName) {
    this.docSubject.set(s);
  }

  setDocGrade(g: GradeLevel) {
    this.docGrade.set(g);
  }

  onDocSubjectChange(e: Event) {
    this.docSubject.set((e.target as HTMLSelectElement).value as SubjectName);
  }

  onDocGradeChange(e: Event) {
    this.docGrade.set((e.target as HTMLSelectElement).value as GradeLevel);
  }

  onDocTrimesterChange(e: Event) {
    this.docTrimester.set((e.target as HTMLSelectElement).value as 'Trimestre 1' | 'Trimestre 2' | 'Trimestre 3');
  }

  onDocSchoolInput(e: Event) {
    this.docSchool.set((e.target as HTMLInputElement).value);
  }

  onDocWatermarkInput(e: Event) {
    this.docWatermark.set((e.target as HTMLInputElement).value);
  }

  async handleBlockImageUpload(blockId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.imageUploadError.set('');

    if (!this.ALLOWED_IMAGE_TYPES.has(file.type)) {
      this.imageUploadError.set(this.lang.tr('Format non autorisé (PNG, JPG, WEBP).', 'صيغة غير مدعومة (PNG, JPG, WEBP).'));
      input.value = '';
      return;
    }
    if (file.size > this.MAX_IMAGE_BYTES) {
      this.imageUploadError.set(this.lang.tr('Image trop volumineuse (limite 15 Mo).', 'الصورة كبيرة جداً (الحد 15 ميغا).'));
      input.value = '';
      return;
    }

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const base64Data = await base64Promise;

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
        this.updateBlockField(blockId, 'imageUrl', data.url);
      } else {
        this.imageUploadError.set(data.error || this.lang.tr('Échec du téléversement.', 'فشل الرفع.'));
      }
    } catch (err) {
      console.error('Upload failed:', err);
      this.imageUploadError.set(this.lang.tr('Échec du téléversement. Réessayez.', 'فشل الرفع. حاول مجدداً.'));
    } finally {
      input.value = '';
    }
  }

  triggerPrintDialog() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  openAiPromptModal() {
    this.aiModalOpen.set(true);
  }

  async generateWithGemini() {
    const prompt = this.aiPromptQuery();
    if (!prompt) return;
    this.isAiLoading.set(true);

    // Prose documents (blog / course / summary) draft a heading + paragraph;
    // exams and exercise sheets generate a graded exercise block.
    const isProse = this.docType() === 'article' || this.docType() === 'course' || this.docType() === 'summary';

    try {
      if (isProse) {
        const res = await fetch('/api/ai/draft-announcement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            purpose: prompt,
            details: `${this.docSubject()} - ${this.docGrade()}`,
            targetAudience: `${this.docGrade()} — parents et élèves`,
          }),
        });
        const data = await res.json();
        if (data.success && data.result) {
          this.addBlock('heading1');
          const heading = this.blocks()[this.blocks().length - 1];
          this.updateBlockContent(heading.id, data.result.title || prompt);
          this.addBlock('paragraph');
          const para = this.blocks()[this.blocks().length - 1];
          this.updateBlockContent(para.id, data.result.content || '');
          this.aiModalOpen.set(false);
          this.aiPromptQuery.set('');
        }
      } else {
        const res = await fetch('/api/ai/generate-exercise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grade: this.docGrade(),
            subject: this.docSubject(),
            topic: prompt,
            difficulty: 'Moyen',
          }),
        });
        const data = await res.json();
        if (data.success && data.exercise) {
          const generated = data.exercise;
          this.addBlock('exercise');
          const lastBlock = this.blocks()[this.blocks().length - 1];
          this.updateBlockField(lastBlock.id, 'exerciseTitle', generated.title);
          this.updateBlockContent(lastBlock.id, generated.promptText || '');
          this.updateBlockField(lastBlock.id, 'exerciseSolution', generated.solutionText || '');
          this.updateBlockField(lastBlock.id, 'exercisePoints', generated.points || 5);
          if (generated.format) this.updateBlockField(lastBlock.id, 'exerciseFormat', generated.format);
          if (generated.qcmOptions) this.updateBlockField(lastBlock.id, 'qcmOptions', generated.qcmOptions);
          if (typeof generated.qcmCorrectIndex === 'number') this.updateBlockField(lastBlock.id, 'qcmCorrectIndex', generated.qcmCorrectIndex);
          if (generated.tfStatements) this.updateBlockField(lastBlock.id, 'tfStatements', generated.tfStatements);
          if (generated.gapText) this.updateBlockField(lastBlock.id, 'gapText', generated.gapText);
          if (generated.matchingPairs) this.updateBlockField(lastBlock.id, 'matchingPairs', generated.matchingPairs);
          this.aiModalOpen.set(false);
          this.aiPromptQuery.set('');
        }
      }
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      this.isAiLoading.set(false);
    }
  }

  async generateVariant(sourceBlock: EditorBlock) {
    if (this.isVariantLoading()) return;
    this.isVariantLoading.set(true);
    this.lastVariantBlockId.set(null);

    try {
      const res = await fetch('/api/ai/variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: this.docGrade(),
          subject: this.docSubject(),
          topic: sourceBlock.exerciseTitle || '',
          format: sourceBlock.exerciseFormat || 'free',
          originalPromptText: sourceBlock.content || '',
          role: 'teacher',
        }),
      });
      const data = await res.json();

      if (data.success && data.variant) {
        const v = data.variant;
        this.addBlock('exercise');
        const newBlock = this.blocks()[this.blocks().length - 1];
        this.updateBlockField(newBlock.id, 'exerciseTitle', `${v.title} (Variante IA ✨)`);
        this.updateBlockContent(newBlock.id, v.promptText || '');
        this.updateBlockField(newBlock.id, 'exerciseSolution', v.solutionText || '');
        this.updateBlockField(newBlock.id, 'exercisePoints', v.points || sourceBlock.exercisePoints || 5);
        if (v.format) this.updateBlockField(newBlock.id, 'exerciseFormat', v.format);
        if (v.qcmOptions?.length) this.updateBlockField(newBlock.id, 'qcmOptions', v.qcmOptions);
        if (typeof v.qcmCorrectIndex === 'number') this.updateBlockField(newBlock.id, 'qcmCorrectIndex', v.qcmCorrectIndex);
        if (v.tfStatements?.length) this.updateBlockField(newBlock.id, 'tfStatements', v.tfStatements);
        if (v.gapText) this.updateBlockField(newBlock.id, 'gapText', v.gapText);
        if (v.matchingPairs?.length) this.updateBlockField(newBlock.id, 'matchingPairs', v.matchingPairs);
        this.lastVariantBlockId.set(sourceBlock.id);
      }
    } catch (err) {
      console.error('Variant generation error:', err);
    } finally {
      this.isVariantLoading.set(false);
    }
  }

  setExerciseFormat(blockId: string, format: ExerciseFormat) {

    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const updated: EditorBlock = { ...b, exerciseFormat: format };
        if (format === 'qcm' && (!updated.qcmOptions || updated.qcmOptions.length === 0)) {
          updated.qcmOptions = ['Option A', 'Option B', 'Option C'];
          updated.qcmCorrectIndex = 0;
        } else if (format === 'true_false' && (!updated.tfStatements || updated.tfStatements.length === 0)) {
          updated.tfStatements = [
            { text: 'Affirmation 1', answer: true },
            { text: 'Affirmation 2', answer: false },
          ];
        } else if (format === 'fill_blanks' && !updated.gapText) {
          updated.gapText = updated.content || 'Texte avec [[mot]] à cacher.';
        } else if (format === 'matching' && (!updated.matchingPairs || updated.matchingPairs.length === 0)) {
          updated.matchingPairs = [
            { left: 'Élément A', right: 'Correspondance 1' },
            { left: 'Élément B', right: 'Correspondance 2' },
          ];
        }
        return updated;
      })
    );
  }

  updateQcmOption(blockId: string, idx: number, value: string) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const options = [...(b.qcmOptions || ['Option A', 'Option B'])];
        options[idx] = value;
        return { ...b, qcmOptions: options };
      })
    );
  }

  addQcmOption(blockId: string) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const options = [...(b.qcmOptions || ['Option A', 'Option B'])];
        if (options.length < 5) options.push(`Option ${this.getOptionLetter(options.length).toUpperCase()}`);
        return { ...b, qcmOptions: options };
      })
    );
  }

  removeQcmOption(blockId: string, idx: number) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const options = [...(b.qcmOptions || [])];
        if (options.length > 2) {
          options.splice(idx, 1);
          let correct = b.qcmCorrectIndex ?? 0;
          if (correct >= options.length) correct = options.length - 1;
          return { ...b, qcmOptions: options, qcmCorrectIndex: correct };
        }
        return b;
      })
    );
  }

  setQcmCorrect(blockId: string, idx: number) {
    this.updateBlockField(blockId, 'qcmCorrectIndex', idx);
  }

  updateTfStatement(blockId: string, idx: number, text: string) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const st = [...(b.tfStatements || [])];
        if (st[idx]) st[idx] = { ...st[idx], text };
        return { ...b, tfStatements: st };
      })
    );
  }

  toggleTfAnswer(blockId: string, idx: number) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const st = [...(b.tfStatements || [])];
        if (st[idx]) st[idx] = { ...st[idx], answer: !st[idx].answer };
        return { ...b, tfStatements: st };
      })
    );
  }

  addTfStatement(blockId: string) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const st = [...(b.tfStatements || [])];
        st.push({ text: `Affirmation ${st.length + 1}`, answer: true });
        return { ...b, tfStatements: st };
      })
    );
  }

  removeTfStatement(blockId: string, idx: number) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const st = [...(b.tfStatements || [])];
        if (st.length > 1) st.splice(idx, 1);
        return { ...b, tfStatements: st };
      })
    );
  }

  updateMatchingPair(blockId: string, idx: number, field: 'left' | 'right', val: string) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const pairs = [...(b.matchingPairs || [])];
        if (pairs[idx]) pairs[idx] = { ...pairs[idx], [field]: val };
        return { ...b, matchingPairs: pairs };
      })
    );
  }

  addMatchingPair(blockId: string) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const pairs = [...(b.matchingPairs || [])];
        pairs.push({ left: `Élément ${pairs.length + 1}`, right: `Correspondance ${pairs.length + 1}` });
        return { ...b, matchingPairs: pairs };
      })
    );
  }

  removeMatchingPair(blockId: string, idx: number) {
    this.blocks.update((list) =>
      list.map((b) => {
        if (b.id !== blockId) return b;
        const pairs = [...(b.matchingPairs || [])];
        if (pairs.length > 1) pairs.splice(idx, 1);
        return { ...b, matchingPairs: pairs };
      })
    );
  }

  getOptionLetter(idx: number): string {
    return String.fromCharCode(97 + idx);
  }

  renderGapTextPreview(text: string): string {
    if (!text) return '…';
    return text.replace(/\[\[(.*?)\]\]/g, (_match, word) => {
      const len = Math.max(8, word.length * 2);
      return '.'.repeat(len);
    });
  }

  extractGapWords(text: string): string[] {
    if (!text) return [];
    const matches = [...text.matchAll(/\[\[(.*?)\]\]/g)];
    return matches.map((m) => m[1]);
  }

  getShuffledMatchingRights(blockId: string, pairs?: { left: string; right: string }[]): string[] {
    if (!pairs || pairs.length === 0) return [];
    const rights = pairs.map((p) => p.right);
    let hash = 0;
    for (let i = 0; i < blockId.length; i++) {
      hash = (hash << 5) - hash + blockId.charCodeAt(i);
      hash |= 0;
    }
    const shuffled = [...rights];
    for (let i = shuffled.length - 1; i > 0; i--) {
      hash = (hash * 9301 + 49297) % 233280;
      const j = Math.floor((hash / 233280) * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }
    return shuffled;
  }

  getCompiledContentText(): string {
    return this.blocks()
      .map((b) => {
        if (b.type === 'exercise') {
          let details = `### ${b.exerciseTitle || 'Exercice'} (${b.exercisePoints || 5} pts)\n`;
          const fmt = b.exerciseFormat || 'free';
          if (fmt === 'free') {
            details += b.content;
          } else if (fmt === 'qcm') {
            if (b.content) details += `${b.content}\n`;
            (b.qcmOptions || []).forEach((opt, idx) => {
              const isCorrect = idx === (b.qcmCorrectIndex ?? 0);
              details += `[${isCorrect ? 'x' : ' '}] ${this.getOptionLetter(idx)}) ${opt}\n`;
            });
          } else if (fmt === 'true_false') {
            if (b.content) details += `${b.content}\n`;
            (b.tfStatements || []).forEach((st, idx) => {
              details += `${idx + 1}. ${st.text} (${st.answer ? 'Vrai' : 'Faux'})\n`;
            });
          } else if (fmt === 'fill_blanks') {
            const raw = b.gapText || b.content || '';
            details += raw.replace(/\[\[(.*?)\]\]/g, '___');
          } else if (fmt === 'matching') {
            if (b.content) details += `${b.content}\n`;
            (b.matchingPairs || []).forEach((pair) => {
              details += `${pair.left} ↔ ${pair.right}\n`;
            });
          }
          if (b.exerciseSolution) {
            details += `\nCorrigé : ${b.exerciseSolution}`;
          }
          return details;
        }
        if (b.type === 'callout') {
          return `> [!NOTE]\n> **${b.calloutTitle || 'Conseil'}**\n> ${b.content}`;
        }
        if (b.type === 'heading1') return `# ${b.content}`;
        if (b.type === 'heading2') return `## ${b.content}`;
        return b.content;
      })
      .join('\n\n');
  }

  publishAsDocumentBank() {
    const content = this.getCompiledContentText();
    this.store.addCourse({
      title: this.docTitle(),
      subject: this.docSubject(),
      grade: this.docGrade(),
      trimester: this.docTrimester(),
      schoolYear: this.docSchoolYear(),
      summary: `${this.docSubject()} - ${this.docGrade()} - Document préparé avec l'en-tête officiel républicain.`,
      content,
      watermarkText: this.docWatermark(),
    });

    this.firebase.addNotification({
      type: 'new_doc',
      title: `Nouveau document : ${this.docTitle()}`,
      message: `${this.docSubject()} (${this.docGrade()}) - Prêt pour impression A4 et téléchargement.`,
      linkRole: 'parent',
      icon: 'menu_book',
    });

    // Bug 2 fix: record publication in interaction journal for publicationsCount ledger
    this.interactionSvc.recordPublication(this.docTitle());

    this.publishModalOpen.set(false);
    this.store.setRole('teacher');
  }

  publishAsBlogArticle() {
    const content = this.getCompiledContentText();
    this.store.addBlogPost({
      title: this.docTitle(),
      excerpt: content.slice(0, 150) + '...',
      content,
      subject: this.docSubject(),
      grade: this.docGrade(),
      tags: [this.docSubject(), this.docGrade(), 'Pédagogie'],
      authorName: this.firebase.userProfile()?.displayName || 'Enseignant Certifié',
      authorTitle: 'Enseignant Certifié',
      readTimeMinutes: Math.max(2, Math.ceil(content.split(' ').length / 180)),
    });

    this.firebase.addNotification({
      type: 'announcement',
      title: `Nouvel article pédagogique : ${this.docTitle()}`,
      message: `Publié par ${this.firebase.userProfile()?.displayName || 'un enseignant certifié'}.`,
      linkRole: 'teacher',
      icon: 'article',
    });

    // Bug 2 fix: record publication in interaction journal for publicationsCount ledger
    this.interactionSvc.recordPublication(this.docTitle());

    this.publishModalOpen.set(false);
    this.store.setRole('teacher');
  }

  exitStudio() {
    this.store.setRole('teacher');
  }
}

