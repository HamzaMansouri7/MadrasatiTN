import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  HostListener,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EducationStore } from '@core/services/education-store';
import { LanguageService } from '@core/services/language.service';
import { FirebaseService } from '@core/services/firebase.service';
import { downscaleImage } from '@core/utils/image.util';
import { MemoInput, MemoLayout } from '@core/models/memo.model';
import { CurriculumChapter } from '@core/data/curriculum-chapters.data';
import { chapterTitle } from '@core/utils/curriculum.util';
import { TopicPickerComponent } from '@shared/components/topic-picker';
import {
  MemoTreeLayoutComponent,
  MemoStepsLayoutComponent,
  MemoCardsLayoutComponent,
  MemoTimelineLayoutComponent,
  MemoTableLayoutComponent,
  MemoConjugationLayoutComponent,
} from './layouts';

interface LibraryResourceItem {
  id: string;
  title: string;
  grade: string;
  subject: string;
  relPath: string;
}

@Component({
  selector: 'app-memo-studio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TopicPickerComponent,
    MemoTreeLayoutComponent,
    MemoStepsLayoutComponent,
    MemoCardsLayoutComponent,
    MemoTimelineLayoutComponent,
    MemoTableLayoutComponent,
    MemoConjugationLayoutComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-[#FBF8F1] text-[#14251D] pb-16">

      <header class="no-print w-full px-3 sm:px-5 lg:px-6 pt-6 pb-4">
        <div class="bg-[#14251D] text-[#FBF8F1] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div class="flex items-center gap-3 min-w-0">
            <a
              routerLink="/create"
              [queryParams]="{ output: 'memo' }"
              [attr.aria-label]="lang.tr('Retour au centre de création', 'العودة إلى مركز الإنشاء')"
              class="w-10 h-10 shrink-0 rounded-full bg-[#FBF8F1]/10 hover:bg-[#FBF8F1]/20 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#F2C14E]">
              <span class="material-icons text-lg rtl:rotate-180" aria-hidden="true">arrow_back</span>
            </a>
            <div class="min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="inline-flex items-center gap-1 bg-[#F2C14E] text-[#14251D] text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  <span class="material-icons text-xs" aria-hidden="true">account_tree</span>
                  {{ lang.tr('Memo Studio', 'استوديو التلخيص البصري') }}
                </span>
                @if (savedAuthorName()) {
                  <span class="text-xs text-[#B7C7BC] truncate">
                    {{ savedAuthorName() }} @if (savedSchool()) { | {{ savedSchool() }} }
                  </span>
                }
              </div>
              <h1 class="font-display text-xl sm:text-2xl font-semibold text-[#FBF8F1] truncate">
                {{ lang.t('memoStudioTitle') }}
              </h1>
              <p class="text-xs text-[#9DBBA8] mt-0.5 truncate">
                {{ lang.t('memoStudioSub') }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <a
              routerLink="/create"
              class="bg-[#FBF8F1]/10 hover:bg-[#FBF8F1]/20 border border-[#FBF8F1]/20 text-[#FBF8F1] font-semibold px-3.5 h-10 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5">
              <span class="material-icons text-sm" aria-hidden="true">grid_view</span>
              <span>{{ lang.tr('Centre de création', 'مركز الإنشاء') }}</span>
            </a>

            <a
              routerLink="/ai-studio"
              class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-3.5 h-10 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs">
              <span class="material-icons text-sm" aria-hidden="true">auto_awesome</span>
              <span>{{ lang.tr('Infographies IA', 'إنفوغرافيك بالذكاء الاصطناعي') }}</span>
            </a>

            <a
              routerLink="/editor"
              class="bg-[#FBF8F1]/10 hover:bg-[#FBF8F1]/20 border border-[#FBF8F1]/20 text-[#FBF8F1] font-semibold px-3.5 h-10 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5">
              <span class="material-icons text-sm" aria-hidden="true">quiz</span>
              <span>{{ lang.tr('Éditeur', 'محرر الامتحانات') }}</span>
            </a>

            @if (state() === 'done' && store.memo()) {
              <button
                type="button"
                (click)="resetToNew()"
                class="bg-[#F2C14E] hover:bg-[#E5B23E] text-[#14251D] font-semibold px-4 h-10 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5">
                <span class="material-icons text-sm" aria-hidden="true">add</span>
                <span>{{ lang.t('memoBtnNew') }}</span>
              </button>
            }
          </div>
        </div>
      </header>

      <!-- Main Container -->
      <main class="w-full px-3 sm:px-5 lg:px-6">

        <!-- INPUT FORM VIEW (When idle / analyzing / error) -->
        @if (state() !== 'done') {
          <div class="no-print grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start">
            <div class="bg-white rounded-2xl border border-[#E7DFCF] p-4 sm:p-6 space-y-5 shadow-xs">
              
              <!-- Segmented Pill Tabs -->
              <div role="tablist" [attr.aria-label]="lang.tr('Source du contenu', 'مصدر المحتوى')" class="flex items-center gap-1 p-1 bg-[#FBF8F1] rounded-xl border border-[#E7DFCF] overflow-x-auto">
                <button
                  type="button"
                  role="tab"
                  [attr.aria-selected]="activeTab() === 'topic'"
                  (click)="activeTab.set('topic')"
                  [class]="activeTab() === 'topic' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'text-[#5B6B60] hover:text-[#14251D] hover:bg-[#F2ECDE]'"
                  class="flex-1 min-w-20 h-9 px-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <span class="material-icons text-xs" aria-hidden="true">title</span>
                  <span>{{ lang.t('memoTabTopic') }}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  [attr.aria-selected]="activeTab() === 'text'"
                  (click)="activeTab.set('text')"
                  [class]="activeTab() === 'text' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'text-[#5B6B60] hover:text-[#14251D] hover:bg-[#F2ECDE]'"
                  class="flex-1 min-w-20 h-9 px-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <span class="material-icons text-xs" aria-hidden="true">edit_note</span>
                  <span>{{ lang.t('memoTabText') }}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  [attr.aria-selected]="activeTab() === 'photo'"
                  (click)="activeTab.set('photo')"
                  [class]="activeTab() === 'photo' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'text-[#5B6B60] hover:text-[#14251D] hover:bg-[#F2ECDE]'"
                  class="flex-1 min-w-20 h-9 px-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <span class="material-icons text-xs" aria-hidden="true">photo_camera</span>
                  <span>{{ lang.t('memoTabPhoto') }}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  [attr.aria-selected]="activeTab() === 'file'"
                  (click)="activeTab.set('file')"
                  [class]="activeTab() === 'file' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'text-[#5B6B60] hover:text-[#14251D] hover:bg-[#F2ECDE]'"
                  class="flex-1 min-w-20 h-9 px-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <span class="material-icons text-xs" aria-hidden="true">upload_file</span>
                  <span>{{ lang.t('memoTabFile') }}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  [attr.aria-selected]="activeTab() === 'library'"
                  (click)="activeTab.set('library')"
                  [class]="activeTab() === 'library' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'text-[#5B6B60] hover:text-[#14251D] hover:bg-[#F2ECDE]'"
                  class="flex-1 min-w-20 h-9 px-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <span class="material-icons text-xs" aria-hidden="true">menu_book</span>
                  <span>{{ lang.t('memoTabLibrary') }}</span>
                </button>
              </div>

              <!-- Metadata Pickers (Grade / Subject / Trimester / Language) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                <div>
                  <label for="memo-grade-select" class="block text-xs font-medium text-[#5B6B60] mb-1">{{ lang.t('memoGradeLabel') }}</label>
                  <select
                    id="memo-grade-select"
                    [(ngModel)]="grade"
                    class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 py-2 text-xs text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
                    <option value="1ère Année">1ère Année (السنة الأولى)</option>
                    <option value="2ème Année">2ème Année (السنة الثانية)</option>
                    <option value="3ème Année">3ème Année (السنة الثالثة)</option>
                    <option value="4ème Année">4ème Année (السنة الرابعة)</option>
                    <option value="5ème Année">5ème Année (السنة الخامسة)</option>
                    <option value="6ème Année">6ème Année (السنة السادسة)</option>
                  </select>
                </div>

                <div>
                  <label for="memo-subject-select" class="block text-xs font-medium text-[#5B6B60] mb-1">{{ lang.t('memoSubjectLabel') }}</label>
                  <select
                    id="memo-subject-select"
                    [(ngModel)]="subject"
                    class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 py-2 text-xs text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
                    <option value="Français">Français (اللغة الفرنسية)</option>
                    <option value="اللغة العربية">اللغة العربية (Arabe)</option>
                    <option value="Mathématiques">Mathématiques (الرياضيات)</option>
                    <option value="الإيقاظ العلمي">الإيقاظ العلمي (Éveil Scientifique)</option>
                    <option value="Histoire & Géo">التاريخ والجغرافيا (Histoire & Géo)</option>
                    <option value="Éducation Islamique">التربية الإسلامية</option>
                    <option value="Anglais">Anglais (الإنجليزية)</option>
                  </select>
                </div>

                <div>
                  <label for="memo-trimester-select" class="block text-xs font-medium text-[#5B6B60] mb-1">{{ lang.t('memoTrimesterLabel') }}</label>
                  <select
                    id="memo-trimester-select"
                    [(ngModel)]="trimester"
                    class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 py-2 text-xs text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
                    <option value="Trimestre 1">Trimestre 1 (الثلاثي الأول)</option>
                    <option value="Trimestre 2">Trimestre 2 (الثلاثي الثاني)</option>
                    <option value="Trimestre 3">Trimestre 3 (الثلاثي الثالث)</option>
                  </select>
                </div>

                <div>
                  <label for="memo-lang-select" class="block text-xs font-medium text-[#5B6B60] mb-1">{{ lang.t('memoLanguageLabel') }}</label>
                  <select
                    id="memo-lang-select"
                    [(ngModel)]="language"
                    class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 py-2 text-xs text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
                    <option value="ar">العربية (Arabe standard)</option>
                    <option value="fr">Français (Langue française)</option>
                  </select>
                </div>
              </div>

              <!-- Visual model chooser -->
              <fieldset class="space-y-1.5 pt-1 border-t border-[#F2ECDE]">
                <legend class="block text-xs font-semibold text-[#14251D] mb-1">{{ lang.tr('Modèle visuel', 'النموذج البصري') }}</legend>
                <div class="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  @for (opt of layoutOptions; track opt.key) {
                    <button
                      type="button"
                      (click)="setLayout(opt.key)"
                      [attr.aria-pressed]="store.memoLayout() === opt.key"
                      [class]="store.memoLayout() === opt.key ? 'border-[#2D6A4F] ring-1 ring-[#2D6A4F] bg-[#2D6A4F]/5 text-[#14251D]' : 'border-[#E7DFCF] bg-white text-[#5B6B60] hover:bg-[#FBF8F1]'"
                      class="border rounded-xl p-2 min-h-[52px] text-xs font-semibold flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-colors">
                      <span class="material-icons text-sm" aria-hidden="true">{{ opt.icon }}</span>
                      <span class="text-[11px] leading-tight truncate w-full">{{ lang.t(opt.label) }}</span>
                    </button>
                  }
                </div>
              </fieldset>

              <!-- TAB 1: Topic Input -->
              @if (activeTab() === 'topic') {
                <div class="space-y-2">
                  <label for="memo-topic-input" class="block text-xs font-semibold text-[#14251D]">{{ lang.t('memoInputTopicLabel') }}</label>
                  <input
                    id="memo-topic-input"
                    type="text"
                    [(ngModel)]="topic"
                    [placeholder]="lang.t('memoInputTopicPlaceholder')"
                    class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]"
                  />
                  <app-topic-picker
                    selectId="memo-topic-picker"
                    [grade]="grade()"
                    [subject]="subject()"
                    [trimester]="trimester()"
                    [value]="topicId()"
                    (topicChange)="onTopicPicked($event)" />
                </div>
              }

              <!-- TAB 2: Text Input -->
              @if (activeTab() === 'text') {
                <div class="space-y-2">
                  <label for="memo-text-input" class="block text-xs font-semibold text-[#14251D]">{{ lang.t('memoInputTextLabel') }}</label>
                  <textarea
                    id="memo-text-input"
                    rows="5"
                    [(ngModel)]="text"
                    [placeholder]="lang.t('memoInputTextPlaceholder')"
                    class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-3.5 text-xs sm:text-sm text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]"
                  ></textarea>
                </div>
              }

              <!-- TAB 3: Photo -->
              @if (activeTab() === 'photo') {
                <div class="space-y-3">
                  <label for="photo-file-input" class="block text-xs font-semibold text-[#14251D]">{{ lang.tr('Ajouter ou coller des captures (Ctrl+V)', 'إضافة أو لصق لقطات الشاشة') }}</label>
                  <div
                    (dragover)="onDragOver($event)"
                    (drop)="onDrop($event)"
                    class="border-2 border-dashed border-[#E7DFCF] rounded-2xl p-5 text-center bg-[#FBF8F1] hover:bg-[#F2ECDE] transition-colors cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      (change)="onImageSelect($event)"
                      class="hidden"
                      #photoFileInput
                      id="photo-file-input"
                    />
                    <div class="space-y-1.5">
                      <span class="material-icons text-3xl text-[#2D6A4F]" aria-hidden="true">add_a_photo</span>
                      <p class="text-xs font-semibold text-[#14251D]">
                        {{ lang.tr('Glissez vos photos ici, collez avec Ctrl+V ou', 'اسحب الصور هنا، الصق بـ Ctrl+V أو') }}
                      </p>
                      <button
                        type="button"
                        (click)="photoFileInput.click()"
                        class="px-4 h-9 bg-white border border-[#E7DFCF] rounded-xl text-xs font-semibold text-[#4A5A50] hover:bg-[#F2ECDE] transition-colors cursor-pointer">
                        {{ lang.tr('Parcourir les fichiers', 'استعراض الصور') }}
                      </button>
                    </div>
                  </div>

                  @if (images().length > 0) {
                    <div class="flex flex-wrap gap-2 pt-1">
                      @for (img of images(); track $index) {
                        <div class="relative w-16 h-16 rounded-xl overflow-hidden border border-[#E7DFCF] group">
                          <img [src]="img.base64Data" alt="" class="w-full h-full object-cover" />
                          <button
                            type="button"
                            (click)="removeImage($index)"
                            class="absolute top-1 end-1 w-5 h-5 bg-[#14251D] hover:bg-[#C1121F] text-[#FBF8F1] rounded-full flex items-center justify-center cursor-pointer transition-colors" [attr.aria-label]="lang.tr('Retirer la photo', 'إزالة الصورة')">
                            <span class="material-icons text-xs" aria-hidden="true">close</span>
                          </button>
                        </div>
                      }
                    </div>
                  }
                </div>
              }

              <!-- TAB 4: File Upload -->
              @if (activeTab() === 'file') {
                <div class="space-y-3">
                  <label for="doc-file-input" class="block text-xs font-semibold text-[#14251D]">{{ lang.tr('Fichier PDF ou DOCX', 'ملف PDF أو DOCX') }}</label>
                  <div class="border-2 border-dashed border-[#E7DFCF] rounded-2xl p-5 text-center bg-[#FBF8F1]">
                    <input
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      (change)="onFileSelect($event)"
                      class="hidden"
                      #docFileInput
                      id="doc-file-input"
                    />
                    <div class="space-y-1.5">
                      <span class="material-icons text-3xl text-[#2D6A4F]" aria-hidden="true">upload_file</span>
                      <p class="text-xs font-semibold text-[#14251D]">
                        {{ file() ? file()?.filename : lang.tr('Sélectionnez un document PDF ou Word (.docx)', 'اختر وثيقة بصيغة PDF أو Word') }}
                      </p>
                      <button
                        type="button"
                        (click)="docFileInput.click()"
                        class="px-4 h-9 bg-white border border-[#E7DFCF] rounded-xl text-xs font-semibold text-[#4A5A50] hover:bg-[#F2ECDE] transition-colors cursor-pointer">
                        {{ file() ? lang.tr('Changer de fichier', 'تغيير الملف') : lang.tr('Parcourir', 'اختيار ملف') }}
                      </button>
                    </div>
                  </div>
                </div>
              }

              <!-- TAB 5: Library Resource Picker -->
              @if (activeTab() === 'library') {
                <div class="space-y-2">
                  <label for="library-resource-select" class="block text-xs font-semibold text-[#14251D]">{{ lang.tr('Choisir une ressource du catalogue CNP', 'اختر من معينات ودليل الكتب المدرسية') }}</label>
                  @if (libraryItems().length === 0) {
                    <p class="text-xs text-[#5B6B60]">
                      {{ libraryLoaded()
                        ? lang.tr('Aucune ressource disponible pour le moment.', 'لا توجد معينات متاحة حاليًا.')
                        : lang.tr('Chargement des ressources du catalogue...', 'جاري تحميل المعينات...') }}
                    </p>
                  } @else {
                    <select
                      id="library-resource-select"
                      [(ngModel)]="resourceUrl"
                      class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 py-2.5 text-xs text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
                      <option value="">-- {{ lang.tr('Sélectionner un document officiel', 'اختر وثيقة رسمية') }} --</option>
                      @for (item of libraryItems(); track item.id) {
                        <option [value]="item.relPath">
                          [{{ item.grade }}] {{ item.subject }} - {{ item.title }}
                        </option>
                      }
                    </select>
                  }
                </div>
              }

              <!-- Optional Instructions Field -->
              <div class="space-y-1 pt-1 border-t border-[#F2ECDE]">
                <label for="memo-instructions-input" class="block text-xs font-medium text-[#5B6B60]">{{ lang.t('memoInstructionsLabel') }}</label>
                <input
                  id="memo-instructions-input"
                  type="text"
                  [(ngModel)]="instructions"
                  [placeholder]="lang.t('memoInstructionsPlaceholder')"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3.5 py-2 text-xs text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]"
                />
              </div>

              <!-- Error Banner -->
              @if (state() === 'error' && errorMessage()) {
                <div role="alert" class="p-3 bg-[#FDF0ED] border border-[#BF5B34]/30 rounded-xl text-xs text-[#8F3F1F] font-medium flex items-start gap-2">
                  <span class="material-icons text-base mt-0.5" aria-hidden="true">error_outline</span>
                  <span>{{ errorMessage() }}</span>
                </div>
              }

              <!-- Action Button -->
              <div class="pt-1">
                <button
                  (click)="generateMemo()"
                  [disabled]="state() === 'analyzing'"
                  class="w-full bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-50 disabled:cursor-not-allowed text-[#FBF8F1] font-semibold h-11 px-6 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs">
                  @if (state() === 'analyzing') {
                    <span class="material-icons text-base animate-spin" aria-hidden="true">sync</span>
                    <span>{{ lang.t('memoBtnGenerating') }}</span>
                  } @else {
                    <span class="material-icons text-base" aria-hidden="true">note_add</span>
                    <span>{{ lang.t('memoBtnGenerate') }}</span>
                  }
                </button>
              </div>

            </div>

            <!-- RIGHT PANEL: Live Card Preview -->
            <aside class="lg:sticky lg:top-6 space-y-2" [attr.aria-label]="lang.tr('Aperçu de la fiche', 'معاينة البطاقة')">
              <p class="text-xs font-semibold text-[#5B6B60] flex items-center gap-1.5 ms-1">
                <span class="material-icons text-sm text-[#2D6A4F]" aria-hidden="true">preview</span>
                {{ lang.tr('Aperçu de la fiche', 'معاينة البطاقة') }}
              </p>
              <div class="relative bg-white border border-[#E7DFCF] rounded-2xl shadow-xs aspect-[210/297] lg:max-h-[calc(100vh-6rem)] w-full mx-auto overflow-hidden p-5 flex flex-col">
                <div aria-hidden="true" class="absolute inset-0 flex items-center justify-center pointer-events-none select-none -rotate-45 font-display text-2xl font-semibold text-[#0B2947]/[0.07] text-center px-6">
                  {{ watermarkName() }}
                </div>

                <div class="border-b border-[#E7DFCF] pb-2 mb-3 relative">
                  <p class="font-display text-xs sm:text-sm font-semibold text-[#14251D] line-clamp-2">
                    {{ topic() || lang.tr('Titre de votre leçon', 'عنوان درسك') }}
                  </p>
                  <p class="text-[11px] text-[#5B6B60] mt-0.5 flex gap-2">
                    <span>{{ grade() }}</span>
                    <span>{{ subject() }}</span>
                  </p>
                </div>

                <div aria-hidden="true" class="relative flex-1">
                  @switch (store.memoLayout()) {
                    @case ('tree') {
                      <div class="h-full flex flex-col gap-3">
                        <div class="rounded-lg bg-[#E8F5FC] border border-[#CBD9E2] h-12"></div>
                        <div class="grid grid-cols-2 gap-3 flex-1">
                          @for (i of [1, 2, 3, 4]; track i) {
                            <div class="rounded-lg border border-[#E7DFCF] p-2 space-y-1.5"><div class="h-1.5 rounded-sm bg-[#E7DFCF] w-2/3"></div><div class="h-1.5 rounded-sm bg-[#E7DFCF]"></div><div class="h-1.5 rounded-sm bg-[#E7DFCF] w-1/2"></div></div>
                          }
                        </div>
                      </div>
                    }
                    @case ('steps') {
                      <div class="space-y-3">
                        @for (i of [1, 2, 3, 4]; track i) {
                          <div class="flex items-center gap-2"><div class="w-5 h-5 rounded-full bg-[#007CC2]/20 shrink-0"></div><div class="flex-1 space-y-1.5"><div class="h-1.5 rounded-sm bg-[#E7DFCF] w-1/2"></div><div class="h-1.5 rounded-sm bg-[#E7DFCF]"></div></div></div>
                        }
                      </div>
                    }
                    @case ('cards') {
                      <div class="grid grid-cols-2 gap-3">
                        @for (i of [1, 2, 3, 4]; track i) {
                          <div class="rounded-lg border border-[#E7DFCF] border-t-2 border-t-[#007CC2] p-2 space-y-1.5 h-20"><div class="h-1.5 rounded-sm bg-[#E7DFCF] w-2/3"></div><div class="h-1.5 rounded-sm bg-[#E7DFCF]"></div><div class="h-1.5 rounded-sm bg-[#E7DFCF] w-1/2"></div></div>
                        }
                      </div>
                    }
                    @case ('timeline') {
                      <div class="border-s-2 border-[#E7DFCF] ps-4 space-y-4 ms-2">
                        @for (i of [1, 2, 3, 4]; track i) {
                          <div class="relative"><div class="absolute -start-[1.4rem] top-0 w-2.5 h-2.5 rounded-full bg-[#007CC2]"></div><div class="space-y-1.5"><div class="h-1.5 rounded-sm bg-[#E7DFCF] w-1/3"></div><div class="h-1.5 rounded-sm bg-[#E7DFCF]"></div></div></div>
                        }
                      </div>
                    }
                    @case ('table') {
                      <div class="grid grid-cols-3 border border-[#E7DFCF] rounded-lg">
                        @for (i of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; track i) {
                          <div class="p-2 border-[#E7DFCF] border-b border-e" [class.bg-[#F3FAFD]]="i <= 3"><div class="h-1.5 rounded-sm bg-[#E7DFCF]"></div></div>
                        }
                      </div>
                    }
                    @case ('conjugation') {
                      <div class="grid grid-cols-2 gap-x-3 gap-y-2">
                        @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
                          <div class="flex items-center gap-2"><div class="w-6 h-1.5 rounded-sm bg-[#E7DFCF]"></div><div class="h-1.5 rounded-sm bg-[#E7DFCF] flex-1"></div></div>
                        }
                      </div>
                    }
                  }
                </div>

                <p class="relative text-[11px] text-[#5B6B60] border-t border-[#E7DFCF] pt-2 mt-3">
                  {{ watermarkName() }}
                </p>
              </div>
              <p class="text-[11px] text-[#5B6B60] mt-1.5 text-center">{{ lang.tr('Votre nom est imprimé sur chaque fiche.', 'اسمك يُطبع على كل بطاقة.') }}</p>
            </aside>
          </div>
        }

        <!-- RESULT & WORKSPACE VIEW (When done) -->
        @if (state() === 'done' && store.memo()) {
          <div class="space-y-6">
            
            <!-- Toolbar: layout switcher + actions (hidden in print) -->
            <div class="no-print bg-white p-4 rounded-lg border border-[#E7DFCF] flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div role="tablist" [attr.aria-label]="lang.tr('Modèle visuel', 'النموذج البصري')" class="flex flex-wrap items-center gap-x-1 border-b border-[#E7DFCF]">
                <button
                  type="button"
                  role="tab"
                  [attr.aria-selected]="store.memoLayout() === 'tree'"
                  (click)="setLayout('tree')"
                  [class]="store.memoLayout() === 'tree' ? 'text-[#1B4332] border-[#2D6A4F]' : 'text-[#5B6B60] hover:text-[#14251D] border-transparent'"
                  class="px-3 min-h-11 text-sm font-semibold cursor-pointer transition-colors border-b-2 flex items-center gap-1.5"
                >
                  <span class="material-icons text-base" aria-hidden="true">account_tree</span>
                  {{ lang.t('memoLayoutTree') }}
                </button>
                <button
                  type="button"
                  role="tab"
                  [attr.aria-selected]="store.memoLayout() === 'steps'"
                  (click)="setLayout('steps')"
                  [class]="store.memoLayout() === 'steps' ? 'text-[#1B4332] border-[#2D6A4F]' : 'text-[#5B6B60] hover:text-[#14251D] border-transparent'"
                  class="px-3 min-h-11 text-sm font-semibold cursor-pointer transition-colors border-b-2 flex items-center gap-1.5"
                >
                  <span class="material-icons text-base" aria-hidden="true">format_list_numbered</span>
                  {{ lang.t('memoLayoutSteps') }}
                </button>
                <button
                  type="button"
                  role="tab"
                  [attr.aria-selected]="store.memoLayout() === 'cards'"
                  (click)="setLayout('cards')"
                  [class]="store.memoLayout() === 'cards' ? 'text-[#1B4332] border-[#2D6A4F]' : 'text-[#5B6B60] hover:text-[#14251D] border-transparent'"
                  class="px-3 min-h-11 text-sm font-semibold cursor-pointer transition-colors border-b-2 flex items-center gap-1.5"
                >
                  <span class="material-icons text-base" aria-hidden="true">view_agenda</span>
                  {{ lang.t('memoLayoutCards') }}
                </button>
                <button
                  type="button"
                  role="tab"
                  [attr.aria-selected]="store.memoLayout() === 'timeline'"
                  (click)="setLayout('timeline')"
                  [class]="store.memoLayout() === 'timeline' ? 'text-[#1B4332] border-[#2D6A4F]' : 'text-[#5B6B60] hover:text-[#14251D] border-transparent'"
                  class="px-3 min-h-11 text-sm font-semibold cursor-pointer transition-colors border-b-2 flex items-center gap-1.5"
                >
                  <span class="material-icons text-base" aria-hidden="true">timeline</span>
                  {{ lang.t('memoLayoutTimeline') }}
                </button>
                <button
                  type="button"
                  role="tab"
                  [attr.aria-selected]="store.memoLayout() === 'table'"
                  (click)="setLayout('table')"
                  [class]="store.memoLayout() === 'table' ? 'text-[#1B4332] border-[#2D6A4F]' : 'text-[#5B6B60] hover:text-[#14251D] border-transparent'"
                  class="px-3 min-h-11 text-sm font-semibold cursor-pointer transition-colors border-b-2 flex items-center gap-1.5"
                >
                  <span class="material-icons text-base" aria-hidden="true">table_chart</span>
                  {{ lang.t('memoLayoutTable') }}
                </button>
                <button
                  type="button"
                  role="tab"
                  [attr.aria-selected]="store.memoLayout() === 'conjugation'"
                  (click)="setLayout('conjugation')"
                  [class]="store.memoLayout() === 'conjugation' ? 'text-[#1B4332] border-[#2D6A4F]' : 'text-[#5B6B60] hover:text-[#14251D] border-transparent'"
                  class="px-3 min-h-11 text-sm font-semibold cursor-pointer transition-colors border-b-2 flex items-center gap-1.5"
                >
                  <span class="material-icons text-base" aria-hidden="true">edit_note</span>
                  {{ lang.t('memoLayoutConjugation') }}
                </button>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  (click)="saveMemo()"
                  [disabled]="isSaving()"
                  class="bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] font-medium px-4 min-h-11 rounded-md text-sm border border-[#E7DFCF] transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <span class="material-icons text-base" aria-hidden="true">{{ isSaved() ? 'bookmark_added' : 'bookmark_add' }}</span>
                  {{ isSaved() ? lang.t('memoBtnSaved') : lang.t('memoBtnSave') }}
                </button>

                <button
                  type="button"
                  (click)="copyShareLink()"
                  class="bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] font-medium px-4 min-h-11 rounded-md text-sm border border-[#E7DFCF] transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <span class="material-icons text-base" aria-hidden="true">link</span>
                  {{ shareCopied() ? lang.tr('Lien copié', 'تم نسخ الرابط') : lang.t('memoBtnShare') }}
                </button>

                <button
                  type="button"
                  (click)="downloadDocx()"
                  [disabled]="isExportingWord()"
                  class="bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] font-medium px-4 min-h-11 rounded-md text-sm border border-[#E7DFCF] transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <span class="material-icons text-base" aria-hidden="true">description</span>
                  {{ isExportingWord() ? lang.tr('Export…', 'جارٍ التصدير…') : lang.t('memoBtnDocx') }}
                </button>

                <button
                  type="button"
                  (click)="printMemo()"
                  class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-5 min-h-11 rounded-md text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <span class="material-icons text-base" aria-hidden="true">print</span>
                  {{ lang.t('memoBtnPrint') }}
                </button>
              </div>
            </div>

            <!-- Optional Extracted Text Inspection Step (for photo/file modes) -->
            @if (extractedText()) {
              <div class="no-print bg-[#FBF8F1] p-4 rounded-lg border border-[#E7DFCF] space-y-2">
                <div class="flex items-center justify-between">
                  <label for="memo-extracted-text-area" class="font-semibold text-sm text-[#14251D]">{{ lang.t('memoExtractedTextLabel') }}</label>
                  <button
                    (click)="regenerateWithExtractedText()"
                    class="text-sm font-semibold text-[#8A5A00] hover:text-[#C1121F] underline underline-offset-4 decoration-[#E7DFCF] cursor-pointer flex items-center gap-1 min-h-11"
                  >
                    <span class="material-icons text-base" aria-hidden="true">refresh</span>
                    {{ lang.t('memoBtnRegenWithText') }}
                  </button>
                </div>
                <textarea
                  id="memo-extracted-text-area"
                  rows="3"
                  [(ngModel)]="extractedText"
                  class="w-full bg-white border border-[#E7DFCF] rounded-md p-3 text-sm text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
                ></textarea>
              </div>
            }

            <!-- Render Selected Layout -->
            <div class="print-document">
              @switch (store.memoLayout()) {
                @case ('tree') {
                  <app-memo-tree-layout [memo]="store.memo()!" />
                }
                @case ('steps') {
                  <app-memo-steps-layout [memo]="store.memo()!" />
                }
                @case ('cards') {
                  <app-memo-cards-layout [memo]="store.memo()!" />
                }
                @case ('timeline') {
                  <app-memo-timeline-layout [memo]="store.memo()!" />
                }
                @case ('table') {
                  <app-memo-table-layout [memo]="store.memo()!" />
                }
                @case ('conjugation') {
                  <app-memo-conjugation-layout [memo]="store.memo()!" />
                }
              }
            </div>

          </div>
        }

      </main>
    </div>
  `,
})
export class MemoStudioComponent implements OnInit {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  readonly firebase = inject(FirebaseService);
  private readonly route = inject(ActivatedRoute);

  readonly activeTab = signal<'topic' | 'text' | 'photo' | 'file' | 'library'>('topic');
  readonly state = signal<'idle' | 'analyzing' | 'done' | 'error'>('idle');
  readonly errorMessage = signal<string>('');

  readonly topic = signal<string>('');
  readonly topicId = signal<string | null>(null);
  private pickedTitle = '';
  readonly text = signal<string>('');
  readonly grade = signal<string>('6ème Année');
  readonly subject = signal<string>('Français');
  readonly trimester = signal<string>('Trimestre 1');
  readonly language = signal<'ar' | 'fr'>('ar');
  readonly instructions = signal<string>('');

  readonly images = signal<{ base64Data: string; contentType: string }[]>([]);
  readonly file = signal<{ base64Data: string; contentType: string; filename: string } | null>(null);
  readonly resourceUrl = signal<string>('');
  readonly extractedText = signal<string>('');

  readonly layoutOptions: { key: MemoLayout; label: string; icon: string }[] = [
    { key: 'tree', label: 'memoLayoutTree', icon: 'account_tree' },
    { key: 'steps', label: 'memoLayoutSteps', icon: 'format_list_numbered' },
    { key: 'cards', label: 'memoLayoutCards', icon: 'view_agenda' },
    { key: 'timeline', label: 'memoLayoutTimeline', icon: 'timeline' },
    { key: 'table', label: 'memoLayoutTable', icon: 'table_chart' },
    { key: 'conjugation', label: 'memoLayoutConjugation', icon: 'edit_note' },
  ];

  readonly watermarkName = computed(
    () => this.firebase.userProfile()?.displayName || this.lang.tr('Votre nom', 'اسمك'),
  );

  readonly libraryItems = signal<LibraryResourceItem[]>([]);
  readonly libraryLoaded = signal(false);

  readonly isSaving = signal<boolean>(false);
  readonly isSaved = signal<boolean>(false);
  readonly shareCopied = signal<boolean>(false);
  readonly isExportingWord = signal<boolean>(false);

  readonly savedMemoId = signal<string | null>(null);
  readonly savedAuthorName = signal<string | null>(null);
  readonly savedSchool = signal<string | null>(null);

  ngOnInit() {
    this.loadLibraryIndex();
    this.checkRouteMemoParam();
  }

  private async checkRouteMemoParam() {
    this.route.queryParams.subscribe(async (params) => {
      const memoId = params['memo'];
      if (memoId && typeof memoId === 'string') {
        const loaded = await this.store.getMemo(memoId);
        if (loaded && loaded.memoDoc) {
          this.store.memo.set(loaded.memoDoc);
          if (loaded.memoLayout) {
            this.store.memoLayout.set(loaded.memoLayout);
          }
          this.savedMemoId.set(loaded.id);
          this.savedAuthorName.set(loaded.authorName || null);
          this.savedSchool.set(loaded.school || null);
          this.isSaved.set(true);
          this.state.set('done');
        }
      }
    });
  }

  private async loadLibraryIndex() {
    try {
      // index.json lists manifest paths ({ manifests: [...] }); each manifest holds the items.
      const res = await fetch('/assets/resources/index.json');
      if (!res.ok) return;
      const idx = await res.json();
      const paths: string[] = Array.isArray(idx?.manifests) ? idx.manifests : [];
      const manifests = await Promise.all(
        paths.map(async (p) => {
          try {
            const r = await fetch('/' + p.replace(/^\//, ''));
            return r.ok ? ((await r.json()) as { items?: LibraryResourceItem[] }) : null;
          } catch {
            return null;
          }
        }),
      );
      this.libraryItems.set(manifests.flatMap((m) => m?.items ?? []));
      this.libraryLoaded.set(true);
    } catch {
      this.libraryLoaded.set(true);
    }
  }

  setLayout(layout: MemoLayout) {
    this.store.memoLayout.set(layout);
  }

  resetToNew() {
    this.state.set('idle');
    this.errorMessage.set('');
    this.savedMemoId.set(null);
    this.savedAuthorName.set(null);
    this.isSaved.set(false);
  }

  printMemo() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  async saveMemo() {
    const memo = this.store.memo();
    if (!memo) return;
    this.isSaving.set(true);

    const userProfile = this.firebase.userProfile();
    const payload = {
      memoDoc: memo,
      memoLayout: this.store.memoLayout(),
      authorName: userProfile?.displayName || 'Enseignant Madrasati',
      authorRole: 'teacher' as const,
      school: userProfile?.school || 'المدرسة الابتدائية التونسية',
    };

    const saved = await this.store.saveMemo(payload);
    this.isSaving.set(false);

    if (saved && saved.id) {
      this.savedMemoId.set(saved.id);
      this.isSaved.set(true);
      this.savedAuthorName.set(payload.authorName);
      this.savedSchool.set(payload.school);
      this.store.showToast(this.lang.tr('Fiche mémo enregistrée dans la bibliothèque !', 'تم حفظ المذكرة بنجاح!'), 'success');
    } else {
      this.store.showToast(this.lang.tr('Erreur lors de l\'enregistrement', 'تعذر حفظ المذكرة'), 'error');
    }
  }

  async copyShareLink() {
    const memoId = this.savedMemoId();
    let url = '';
    if (memoId) {
      url = `${window.location.origin}/memo-studio?memo=${memoId}`;
    } else {
      // Save first
      await this.saveMemo();
      const newId = this.savedMemoId();
      if (newId) {
        url = `${window.location.origin}/memo-studio?memo=${newId}`;
      }
    }

    if (url && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      this.shareCopied.set(true);
      this.store.showToast(this.lang.tr('Lien de partage copié !', 'تم نسخ رابط المذكرة!'), 'success');
      setTimeout(() => this.shareCopied.set(false), 3000);
    }
  }

  async downloadDocx() {
    const memo = this.store.memo();
    if (!memo) return;
    this.isExportingWord.set(true);

    const userProfile = this.firebase.userProfile();
    const author = this.savedAuthorName() || userProfile?.displayName || 'Enseignant Madrasati';
    const school = this.savedSchool() || userProfile?.school || 'المدرسة الابتدائية التونسية';

    const blob = await this.store.exportMemoDocx(memo, author, school);
    this.isExportingWord.set(false);

    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memo-${(memo.topic || memo.title || 'cours').replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      this.store.showToast(this.lang.tr('Document Word téléchargé !', 'تم تحميل ملف Word!'), 'success');
    } else {
      this.store.showToast(this.lang.tr('Erreur lors de l\'export Word', 'تعذر تصدير ملف Word'), 'error');
    }
  }

  // Handle Ctrl+V paste of images
  @HostListener('window:paste', ['$event'])
  async onPaste(event: ClipboardEvent) {
    if (this.activeTab() !== 'photo') return;
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const processed = await downscaleImage(file);
          this.images.update((imgs) => [...imgs.slice(0, 7), processed]);
        }
      }
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (!files) return;
    for (const f of Array.from(files)) {
      if (f.type.startsWith('image/')) {
        const processed = await downscaleImage(f);
        this.images.update((imgs) => [...imgs.slice(0, 7), processed]);
      }
    }
  }

  async onImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    for (const f of Array.from(input.files)) {
      const processed = await downscaleImage(f);
      this.images.update((imgs) => [...imgs.slice(0, 7), processed]);
    }
  }

  removeImage(index: number) {
    this.images.update((imgs) => imgs.filter((_, i) => i !== index));
  }

  async onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.file.set({
        base64Data: dataUrl,
        contentType: f.type || 'application/pdf',
        filename: f.name,
      });
    };
    reader.readAsDataURL(f);
  }

  onTopicPicked(ch: CurriculumChapter | null) {
    this.topicId.set(ch?.id ?? null);
    this.pickedTitle = ch ? chapterTitle(ch, this.lang.isArabic() ? 'ar' : 'fr') : '';
    if (ch) this.topic.set(this.pickedTitle);
  }

  async generateMemo() {
    this.state.set('analyzing');
    this.errorMessage.set('');

    const modeMap: Record<string, 'topic' | 'text' | 'image' | 'file' | 'resource'> = {
      topic: 'topic',
      text: 'text',
      photo: 'image',
      file: 'file',
      library: 'resource',
    };

    const inputData: MemoInput = {
      mode: modeMap[this.activeTab()] || 'topic',
      topic: this.topic(),
      // Only keep the programme topic while the text still is the picked title.
      topicId: this.topicId() && this.topic() === this.pickedTitle ? this.topicId()! : undefined,
      text: this.text(),
      grade: this.grade(),
      subject: this.subject(),
      trimester: this.trimester(),
      language: this.language(),
      instructions: this.instructions(),
      images: this.images().length > 0 ? this.images() : undefined,
      file: this.file() ?? undefined,
      resourceUrl: this.resourceUrl() || undefined,
    };

    const res = await this.store.generateMemo(inputData);

    if (res.ok) {
      this.state.set('done');
      this.isSaved.set(false);
      this.savedMemoId.set(null);
    } else {
      this.errorMessage.set(res.error || 'Erreur lors de la génération.');
      this.state.set('error');
    }
  }

  async regenerateWithExtractedText() {
    this.text.set(this.extractedText());
    this.activeTab.set('text');
    await this.generateMemo();
  }
}
