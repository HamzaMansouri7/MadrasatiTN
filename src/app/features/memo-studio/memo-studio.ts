import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  HostListener,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { EducationStore } from '@core/services/education-store';
import { LanguageService } from '@core/services/language.service';
import { FirebaseService } from '@core/services/firebase.service';
import { downscaleImage } from '@core/utils/image.util';
import { MemoInput, MemoLayout } from '@core/models/memo.model';
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
      
      <!-- Top Studio Hero / Toolbar (Hidden in print) -->
      <header class="no-print bg-[#14251D] text-[#FBF8F1] border-b border-[#2D6A4F] px-4 sm:px-8 py-6 mb-8 shadow-sm">
        <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2.5 py-0.5 rounded-full bg-[#2D6A4F] text-[#FBF8F1] text-xs font-semibold">
                Studio IA
              </span>
              <span class="text-xs text-[#9DBBA8] font-medium">
                {{ lang.tr('Supports Visuels A4', 'معينات بصرية A4') }}
              </span>
              @if (savedAuthorName()) {
                <span class="text-xs text-[#F2C14E] font-medium border-s border-[#2D6A4F] ps-2">
                  {{ savedAuthorName() }} {{ savedSchool() ? '• ' + savedSchool() : '' }}
                </span>
              }
            </div>
            <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#FBF8F1]">
              {{ lang.t('memoStudioTitle') }}
            </h1>
            <p class="text-sm text-[#B7C7BC] mt-1 max-w-2xl">
              {{ lang.t('memoStudioSub') }}
            </p>
          </div>

          @if (state() === 'done' && store.memo()) {
            <button
              type="button"
              (click)="resetToNew()"
              class="bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#14251D] font-semibold px-5 min-h-11 rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-2"
            >
              <span class="material-icons text-base" aria-hidden="true">add</span>
              {{ lang.t('memoBtnNew') }}
            </button>
          }
        </div>
      </header>

      <!-- Main Container -->
      <main class="max-w-6xl mx-auto px-4 sm:px-6">
        
        <!-- INPUT FORM VIEW (When idle / analyzing / error) -->
        @if (state() !== 'done') {
          <div class="no-print bg-white rounded-2xl border border-[#E7DFCF] shadow-sm p-6 sm:p-8 space-y-6">
            
            <!-- Mode Switcher Tabs -->
            <div role="tablist" class="border-b border-[#E7DFCF] flex flex-wrap gap-x-1">
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="activeTab() === 'topic'"
                (click)="activeTab.set('topic')"
                [class]="activeTab() === 'topic' ? 'text-[#1B4332] border-[#2D6A4F]' : 'text-[#5B6B60] hover:text-[#14251D] border-transparent'"
                class="px-4 min-h-11 text-sm font-semibold cursor-pointer transition-colors border-b-2 -mb-px"
              >
                {{ lang.t('memoTabTopic') }}
              </button>
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="activeTab() === 'text'"
                (click)="activeTab.set('text')"
                [class]="activeTab() === 'text' ? 'text-[#1B4332] border-[#2D6A4F]' : 'text-[#5B6B60] hover:text-[#14251D] border-transparent'"
                class="px-4 min-h-11 text-sm font-semibold cursor-pointer transition-colors border-b-2 -mb-px"
              >
                {{ lang.t('memoTabText') }}
              </button>
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="activeTab() === 'photo'"
                (click)="activeTab.set('photo')"
                [class]="activeTab() === 'photo' ? 'text-[#1B4332] border-[#2D6A4F]' : 'text-[#5B6B60] hover:text-[#14251D] border-transparent'"
                class="px-4 min-h-11 text-sm font-semibold cursor-pointer transition-colors border-b-2 -mb-px"
              >
                {{ lang.t('memoTabPhoto') }}
              </button>
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="activeTab() === 'file'"
                (click)="activeTab.set('file')"
                [class]="activeTab() === 'file' ? 'text-[#1B4332] border-[#2D6A4F]' : 'text-[#5B6B60] hover:text-[#14251D] border-transparent'"
                class="px-4 min-h-11 text-sm font-semibold cursor-pointer transition-colors border-b-2 -mb-px"
              >
                {{ lang.t('memoTabFile') }}
              </button>
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="activeTab() === 'library'"
                (click)="activeTab.set('library')"
                [class]="activeTab() === 'library' ? 'text-[#1B4332] border-[#2D6A4F]' : 'text-[#5B6B60] hover:text-[#14251D] border-transparent'"
                class="px-4 min-h-11 text-sm font-semibold cursor-pointer transition-colors border-b-2 -mb-px"
              >
                {{ lang.t('memoTabLibrary') }}
              </button>
            </div>

            <!-- Metadata Pickers (Grade / Subject / Trimester / Language) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label for="memo-grade-select" class="block text-sm font-semibold text-[#14251D] mb-1.5">{{ lang.t('memoGradeLabel') }}</label>
                <select
                  id="memo-grade-select"
                  [(ngModel)]="grade"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 min-h-11 text-sm text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
                >
                  <option value="1ère Année">1ère Année (السنة الأولى)</option>
                  <option value="2ème Année">2ème Année (السنة الثانية)</option>
                  <option value="3ème Année">3ème Année (السنة الثالثة)</option>
                  <option value="4ème Année">4ème Année (السنة الرابعة)</option>
                  <option value="5ème Année">5ème Année (السنة الخامسة)</option>
                  <option value="6ème Année">6ème Année (السنة السادسة)</option>
                </select>
              </div>

              <div>
                <label for="memo-subject-select" class="block text-sm font-semibold text-[#14251D] mb-1.5">{{ lang.t('memoSubjectLabel') }}</label>
                <select
                  id="memo-subject-select"
                  [(ngModel)]="subject"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 min-h-11 text-sm text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
                >
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
                <label for="memo-trimester-select" class="block text-sm font-semibold text-[#14251D] mb-1.5">{{ lang.t('memoTrimesterLabel') }}</label>
                <select
                  id="memo-trimester-select"
                  [(ngModel)]="trimester"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 min-h-11 text-sm text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
                >
                  <option value="1er Trimestre">1er Trimestre (الثلاثي الأول)</option>
                  <option value="2ème Trimestre">2ème Trimestre (الثلاثي الثاني)</option>
                  <option value="3ème Trimestre">3ème Trimestre (الثلاثي الثالث)</option>
                </select>
              </div>

              <div>
                <label for="memo-lang-select" class="block text-sm font-semibold text-[#14251D] mb-1.5">{{ lang.t('memoLanguageLabel') }}</label>
                <select
                  id="memo-lang-select"
                  [(ngModel)]="language"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 min-h-11 text-sm text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
                >
                  <option value="ar">العربية (Arabe standard)</option>
                  <option value="fr">Français (Langue française)</option>
                </select>
              </div>
            </div>

            <!-- TAB 1: Topic Input -->
            @if (activeTab() === 'topic') {
              <div class="space-y-2">
                <label for="memo-topic-input" class="block text-sm font-semibold text-[#14251D]">{{ lang.t('memoInputTopicLabel') }}</label>
                <input
                  id="memo-topic-input"
                  type="text"
                  [(ngModel)]="topic"
                  [placeholder]="lang.t('memoInputTopicPlaceholder')"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-4 min-h-11 text-sm text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
                />
              </div>
            }

            <!-- TAB 2: Text Input -->
            @if (activeTab() === 'text') {
              <div class="space-y-2">
                <label for="memo-text-input" class="block text-sm font-semibold text-[#14251D]">{{ lang.t('memoInputTextLabel') }}</label>
                <textarea
                  id="memo-text-input"
                  rows="6"
                  [(ngModel)]="text"
                  [placeholder]="lang.t('memoInputTextPlaceholder')"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-4 text-sm text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
                ></textarea>
              </div>
            }

            <!-- TAB 3: Photo / Screenshot Upload & Paste -->
            @if (activeTab() === 'photo') {
              <div class="space-y-3">
                <label for="photo-file-input" class="block text-sm font-semibold text-[#14251D]">{{ lang.tr('Ajouter ou coller des captures (Ctrl+V)', 'إضافة أو لصق لقطات الشاشة') }}</label>
                <div
                  (dragover)="onDragOver($event)"
                  (drop)="onDrop($event)"
                  class="border-2 border-dashed border-[#E7DFCF] rounded-2xl p-6 text-center bg-[#FBF8F1] hover:bg-[#F2ECDE] transition-colors"
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    (change)="onImageSelect($event)"
                    class="hidden"
                    #photoFileInput
                    id="photo-file-input"
                  />
                  <div class="space-y-2">
                    <img src="/assets/memo/magnifier.svg" alt="" aria-hidden="true" class="w-8 h-8 mx-auto" />
                    <p class="text-sm text-[#5B6B60]">
                      {{ lang.tr('Glissez vos photos ici, collez avec Ctrl+V ou', 'اسحب الصور هنا، الصق بـ Ctrl+V أو') }}
                    </p>
                    <button
                      type="button"
                      (click)="photoFileInput.click()"
                      class="px-5 min-h-11 bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl text-sm font-medium text-[#4A5A50] hover:bg-[#F2ECDE] transition-colors cursor-pointer"
                    >
                      {{ lang.tr('Parcourir les fichiers', 'استعراض الصور') }}
                    </button>
                  </div>
                </div>

                @if (images().length > 0) {
                  <div class="flex flex-wrap gap-2 pt-2">
                    @for (img of images(); track $index) {
                      <div class="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E7DFCF] group">
                        <img [src]="img.base64Data" alt="" class="w-full h-full object-cover" />
                        <button
                          type="button"
                          (click)="removeImage($index)"
                          class="absolute top-1 end-1 w-7 h-7 bg-[#14251D] hover:bg-[#C1121F] text-[#FBF8F1] rounded-full flex items-center justify-center cursor-pointer transition-colors" [attr.aria-label]="lang.tr('Retirer la photo', 'إزالة الصورة')"
                        >
                          <span class="material-icons text-base" aria-hidden="true">close</span>
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <!-- TAB 4: File Upload (PDF/DOCX) -->
            @if (activeTab() === 'file') {
              <div class="space-y-3">
                <label for="doc-file-input" class="block text-sm font-semibold text-[#14251D]">{{ lang.tr('Fichier PDF ou DOCX', 'ملف PDF أو DOCX') }}</label>
                <div class="border-2 border-dashed border-[#E7DFCF] rounded-2xl p-6 text-center bg-[#FBF8F1]">
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    (change)="onFileSelect($event)"
                    class="hidden"
                    #docFileInput
                    id="doc-file-input"
                  />
                  <div class="space-y-2">
                    <img src="/assets/memo/books.svg" alt="" aria-hidden="true" class="w-8 h-8 mx-auto" />
                    <p class="text-sm text-[#5B6B60]">
                      {{ file() ? file()?.filename : lang.tr('Sélectionnez un document PDF ou Word (.docx)', 'اختر وثيقة بصيغة PDF أو Word') }}
                    </p>
                    <button
                      type="button"
                      (click)="docFileInput.click()"
                      class="px-5 min-h-11 bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl text-sm font-medium text-[#4A5A50] hover:bg-[#F2ECDE] transition-colors cursor-pointer"
                    >
                      {{ file() ? lang.tr('Changer de fichier', 'تغيير الملف') : lang.tr('Parcourir', 'اختيار ملف') }}
                    </button>
                  </div>
                </div>
              </div>
            }

            <!-- TAB 5: Library Resource Picker -->
            @if (activeTab() === 'library') {
              <div class="space-y-3">
                <label for="library-resource-select" class="block text-sm font-semibold text-[#14251D]">{{ lang.tr('Choisir une ressource du catalogue CNP', 'اختر من معينات ودليل الكتب المدرسية') }}</label>
                @if (libraryItems().length === 0) {
                  <p class="text-sm text-[#5B6B60]">
                    {{ libraryLoaded()
                      ? lang.tr('Aucune ressource disponible pour le moment.', 'لا توجد معينات متاحة حاليًا.')
                      : lang.tr('Chargement des ressources du catalogue...', 'جاري تحميل المعينات...') }}
                  </p>
                } @else {
                  <select
                    id="library-resource-select"
                    [(ngModel)]="resourceUrl"
                    class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 min-h-11 text-sm text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
                  >
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
            <div class="space-y-1.5">
              <label for="memo-instructions-input" class="block text-sm font-semibold text-[#5B6B60]">{{ lang.t('memoInstructionsLabel') }}</label>
              <input
                id="memo-instructions-input"
                type="text"
                [(ngModel)]="instructions"
                [placeholder]="lang.t('memoInstructionsPlaceholder')"
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-4 min-h-11 text-sm text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
              />
            </div>

            <!-- Error Banner -->
            @if (state() === 'error' && errorMessage()) {
              <div role="alert" class="p-3 bg-[#FDF0ED] border border-[#BF5B34]/30 rounded-xl text-sm text-[#8F3F1F] font-medium flex items-start gap-2">
                <span class="material-icons text-base mt-0.5" aria-hidden="true">error_outline</span>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <!-- Action Button -->
            <div class="pt-2">
              <button
                (click)="generateMemo()"
                [disabled]="state() === 'analyzing'"
                class="w-full bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-50 disabled:cursor-not-allowed text-[#FBF8F1] font-semibold min-h-12 px-6 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                @if (state() === 'analyzing') {
                  <span class="material-icons text-base animate-spin" aria-hidden="true">sync</span>
                  <span>{{ lang.t('memoBtnGenerating') }}</span>
                } @else {
                  <span class="material-icons text-base" aria-hidden="true">auto_awesome</span>
                  <span>{{ lang.t('memoBtnGenerate') }}</span>
                }
              </button>
            </div>

          </div>
        }

        <!-- RESULT & WORKSPACE VIEW (When done) -->
        @if (state() === 'done' && store.memo()) {
          <div class="space-y-6">
            
            <!-- Toolbar: layout switcher + actions (hidden in print) -->
            <div class="no-print bg-white p-4 rounded-2xl border border-[#E7DFCF] flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
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
                  class="bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] font-medium px-4 min-h-11 rounded-xl text-sm border border-[#E7DFCF] transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <span class="material-icons text-base" aria-hidden="true">{{ isSaved() ? 'bookmark_added' : 'bookmark_add' }}</span>
                  {{ isSaved() ? lang.t('memoBtnSaved') : lang.t('memoBtnSave') }}
                </button>

                <button
                  type="button"
                  (click)="copyShareLink()"
                  class="bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] font-medium px-4 min-h-11 rounded-xl text-sm border border-[#E7DFCF] transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <span class="material-icons text-base" aria-hidden="true">link</span>
                  {{ shareCopied() ? lang.tr('Lien copié', 'تم نسخ الرابط') : lang.t('memoBtnShare') }}
                </button>

                <button
                  type="button"
                  (click)="downloadDocx()"
                  [disabled]="isExportingWord()"
                  class="bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] font-medium px-4 min-h-11 rounded-xl text-sm border border-[#E7DFCF] transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <span class="material-icons text-base" aria-hidden="true">description</span>
                  {{ isExportingWord() ? lang.tr('Export…', 'جارٍ التصدير…') : lang.t('memoBtnDocx') }}
                </button>

                <button
                  type="button"
                  (click)="printMemo()"
                  class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-5 min-h-11 rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <span class="material-icons text-base" aria-hidden="true">print</span>
                  {{ lang.t('memoBtnPrint') }}
                </button>
              </div>
            </div>

            <!-- Optional Extracted Text Inspection Step (for photo/file modes) -->
            @if (extractedText()) {
              <div class="no-print bg-[#FBF8F1] p-4 rounded-2xl border border-[#E7DFCF] space-y-2">
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
                  class="w-full bg-white border border-[#E7DFCF] rounded-xl p-3 text-sm text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
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
  readonly text = signal<string>('');
  readonly grade = signal<string>('6ème Année');
  readonly subject = signal<string>('Français');
  readonly trimester = signal<string>('1er Trimestre');
  readonly language = signal<'ar' | 'fr'>('ar');
  readonly instructions = signal<string>('');

  readonly images = signal<{ base64Data: string; contentType: string }[]>([]);
  readonly file = signal<{ base64Data: string; contentType: string; filename: string } | null>(null);
  readonly resourceUrl = signal<string>('');
  readonly extractedText = signal<string>('');

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

    if (res) {
      this.state.set('done');
      this.isSaved.set(false);
      this.savedMemoId.set(null);
    } else {
      this.errorMessage.set('Erreur lors de la génération.');
      this.state.set('error');
    }
  }

  async regenerateWithExtractedText() {
    this.text.set(this.extractedText());
    this.activeTab.set('text');
    await this.generateMemo();
  }
}
