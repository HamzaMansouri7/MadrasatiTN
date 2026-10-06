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
import { downscaleImage } from '@core/utils/image.util';
import { MemoInput, MemoLayout, MemoDoc } from '@core/models/memo.model';
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
                  ✍️ {{ savedAuthorName() }} {{ savedSchool() ? '• ' + savedSchool() : '' }}
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
            <div class="flex flex-wrap items-center gap-2">
              <button
                (click)="resetToNew()"
                class="bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#14251D] font-medium px-3.5 py-2 rounded-xl text-xs border border-[#E7DFCF] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                + {{ lang.t('memoBtnNew') }}
              </button>

              <button
                (click)="saveMemo()"
                [disabled]="isSaving()"
                class="bg-[#8A5A00] hover:bg-[#734A00] disabled:opacity-50 text-[#FBF8F1] font-semibold px-3.5 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                💾 {{ isSaved() ? lang.t('memoBtnSaved') : lang.t('memoBtnSave') }}
              </button>

              <button
                (click)="copyShareLink()"
                class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-3.5 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                🔗 {{ shareCopied() ? lang.tr('Lien copié !', 'تم نسخ الرابط!') : lang.t('memoBtnShare') }}
              </button>

              <button
                (click)="downloadDocx()"
                [disabled]="isExportingWord()"
                class="bg-[#1E3A8A] hover:bg-[#172554] disabled:opacity-50 text-[#FBF8F1] font-semibold px-3.5 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                📄 {{ isExportingWord() ? '...' : lang.t('memoBtnDocx') }}
              </button>

              <button
                (click)="printMemo()"
                class="bg-[#14251D] hover:bg-[#0D1813] text-[#FBF8F1] font-semibold px-4 py-2 rounded-xl text-xs border border-[#2D6A4F] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                🖨️ {{ lang.t('memoBtnPrint') }}
              </button>
            </div>
          }
        </div>
      </header>

      <!-- Main Container -->
      <main class="max-w-6xl mx-auto px-4 sm:px-6">
        
        <!-- INPUT FORM VIEW (When idle / analyzing / error) -->
        @if (state() !== 'done') {
          <div class="no-print bg-white rounded-2xl border border-[#E7DFCF] shadow-sm p-6 sm:p-8 space-y-6">
            
            <!-- Mode Switcher Tabs -->
            <div class="border-b border-[#E7DFCF] flex flex-wrap gap-2 pb-2">
              <button
                (click)="activeTab.set('topic')"
                [class]="activeTab() === 'topic' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'bg-[#FBF8F1] text-[#5B6B60] hover:text-[#14251D] border border-[#E7DFCF]'"
                class="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                {{ lang.t('memoTabTopic') }}
              </button>

              <button
                (click)="activeTab.set('text')"
                [class]="activeTab() === 'text' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'bg-[#FBF8F1] text-[#5B6B60] hover:text-[#14251D] border border-[#E7DFCF]'"
                class="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                {{ lang.t('memoTabText') }}
              </button>

              <button
                (click)="activeTab.set('photo')"
                [class]="activeTab() === 'photo' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'bg-[#FBF8F1] text-[#5B6B60] hover:text-[#14251D] border border-[#E7DFCF]'"
                class="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                {{ lang.t('memoTabPhoto') }}
              </button>

              <button
                (click)="activeTab.set('file')"
                [class]="activeTab() === 'file' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'bg-[#FBF8F1] text-[#5B6B60] hover:text-[#14251D] border border-[#E7DFCF]'"
                class="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                {{ lang.t('memoTabFile') }}
              </button>

              <button
                (click)="activeTab.set('library')"
                [class]="activeTab() === 'library' ? 'bg-[#2D6A4F] text-[#FBF8F1]' : 'bg-[#FBF8F1] text-[#5B6B60] hover:text-[#14251D] border border-[#E7DFCF]'"
                class="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                {{ lang.t('memoTabLibrary') }}
              </button>
            </div>

            <!-- Metadata Pickers (Grade / Subject / Trimester / Language) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label for="memo-grade-select" class="block text-xs font-bold text-[#14251D] mb-1.5">{{ lang.t('memoGradeLabel') }}</label>
                <select
                  id="memo-grade-select"
                  [(ngModel)]="grade"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 py-2.5 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]"
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
                <label for="memo-subject-select" class="block text-xs font-bold text-[#14251D] mb-1.5">{{ lang.t('memoSubjectLabel') }}</label>
                <select
                  id="memo-subject-select"
                  [(ngModel)]="subject"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 py-2.5 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]"
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
                <label for="memo-trimester-select" class="block text-xs font-bold text-[#14251D] mb-1.5">{{ lang.t('memoTrimesterLabel') }}</label>
                <select
                  id="memo-trimester-select"
                  [(ngModel)]="trimester"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 py-2.5 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]"
                >
                  <option value="1er Trimestre">1er Trimestre (الثلاثي الأول)</option>
                  <option value="2ème Trimestre">2ème Trimestre (الثلاثي الثاني)</option>
                  <option value="3ème Trimestre">3ème Trimestre (الثلاثي الثالث)</option>
                </select>
              </div>

              <div>
                <label for="memo-lang-select" class="block text-xs font-bold text-[#14251D] mb-1.5">{{ lang.t('memoLanguageLabel') }}</label>
                <select
                  id="memo-lang-select"
                  [(ngModel)]="language"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 py-2.5 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]"
                >
                  <option value="ar">العربية (Arabe standard)</option>
                  <option value="fr">Français (Langue française)</option>
                </select>
              </div>
            </div>

            <!-- TAB 1: Topic Input -->
            @if (activeTab() === 'topic') {
              <div class="space-y-2">
                <label for="memo-topic-input" class="block text-xs font-bold text-[#14251D]">{{ lang.t('memoInputTopicLabel') }}</label>
                <input
                  id="memo-topic-input"
                  type="text"
                  [(ngModel)]="topic"
                  [placeholder]="lang.t('memoInputTopicPlaceholder')"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-4 py-3 text-sm text-[#14251D] focus:outline-none focus:border-[#2D6A4F]"
                />
              </div>
            }

            <!-- TAB 2: Text Input -->
            @if (activeTab() === 'text') {
              <div class="space-y-2">
                <label for="memo-text-input" class="block text-xs font-bold text-[#14251D]">{{ lang.t('memoInputTextLabel') }}</label>
                <textarea
                  id="memo-text-input"
                  rows="6"
                  [(ngModel)]="text"
                  [placeholder]="lang.t('memoInputTextPlaceholder')"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-4 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]"
                ></textarea>
              </div>
            }

            <!-- TAB 3: Photo / Screenshot Upload & Paste -->
            @if (activeTab() === 'photo') {
              <div class="space-y-3">
                <label for="photo-file-input" class="block text-xs font-bold text-[#14251D]">{{ lang.tr('Ajouter ou coller des captures (Ctrl+V)', 'إضافة أو لصق لقطات الشاشة') }}</label>
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
                    <img src="/assets/memo/magnifier.svg" alt="Upload" class="w-8 h-8 mx-auto text-[#2D6A4F]" />
                    <p class="text-xs text-[#5B6B60]">
                      {{ lang.tr('Glissez vos photos ici, collez avec Ctrl+V ou', 'اسحب الصور هنا، الصق بـ Ctrl+V أو') }}
                    </p>
                    <button
                      type="button"
                      (click)="photoFileInput.click()"
                      class="px-4 py-2 bg-white border border-[#E7DFCF] rounded-xl text-xs font-semibold text-[#14251D] hover:bg-[#F2ECDE] cursor-pointer"
                    >
                      {{ lang.tr('Parcourir les fichiers', 'استعراض الصور') }}
                    </button>
                  </div>
                </div>

                @if (images().length > 0) {
                  <div class="flex flex-wrap gap-2 pt-2">
                    @for (img of images(); track $index) {
                      <div class="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E7DFCF] shadow-xs group">
                        <img [src]="img.base64Data" alt="Thumbnail" class="w-full h-full object-cover" />
                        <button
                          type="button"
                          (click)="removeImage($index)"
                          class="absolute top-1 end-1 w-5 h-5 bg-[#C1121F] text-white rounded-full text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm"
                        >
                          ×
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
                <label for="doc-file-input" class="block text-xs font-bold text-[#14251D]">{{ lang.tr('Fichier PDF ou DOCX', 'ملف PDF أو DOCX') }}</label>
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
                    <img src="/assets/memo/books.svg" alt="File" class="w-8 h-8 mx-auto text-[#2D6A4F]" />
                    <p class="text-xs text-[#5B6B60]">
                      {{ file() ? file()?.filename : lang.tr('Sélectionnez un document PDF ou Word (.docx)', 'اختر وثيقة بصيغة PDF أو Word') }}
                    </p>
                    <button
                      type="button"
                      (click)="docFileInput.click()"
                      class="px-4 py-2 bg-white border border-[#E7DFCF] rounded-xl text-xs font-semibold text-[#14251D] hover:bg-[#F2ECDE] cursor-pointer"
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
                <label for="library-resource-select" class="block text-xs font-bold text-[#14251D]">{{ lang.tr('Choisir une ressource du catalogue CNP', 'اختر من معينات ودليل الكتب المدرسية') }}</label>
                @if (libraryItems().length === 0) {
                  <p class="text-xs text-[#5B6B60] italic">{{ lang.tr('Chargement des ressources du catalogue...', 'جاري تحميل المعينات...') }}</p>
                } @else {
                  <select
                    id="library-resource-select"
                    [(ngModel)]="resourceUrl"
                    class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3 py-2.5 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]"
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
              <label for="memo-instructions-input" class="block text-xs font-bold text-[#5B6B60]">{{ lang.t('memoInstructionsLabel') }}</label>
              <input
                id="memo-instructions-input"
                type="text"
                [(ngModel)]="instructions"
                [placeholder]="lang.t('memoInstructionsPlaceholder')"
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-4 py-2.5 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]"
              />
            </div>

            <!-- Error Banner -->
            @if (state() === 'error' && errorMessage()) {
              <div class="p-3 bg-[#FDF0ED] border border-[#BF5B34]/30 rounded-xl text-xs text-[#BF5B34] font-medium">
                ⚠️ {{ errorMessage() }}
              </div>
            }

            <!-- Action Button -->
            <div class="pt-2">
              <button
                (click)="generateMemo()"
                [disabled]="state() === 'analyzing'"
                class="w-full bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-50 text-[#FBF8F1] font-semibold py-3.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                @if (state() === 'analyzing') {
                  <span class="inline-block animate-spin text-sm">↻</span>
                  <span>{{ lang.t('memoBtnGenerating') }}</span>
                } @else {
                  <span>✨ {{ lang.t('memoBtnGenerate') }}</span>
                }
              </button>
            </div>

          </div>
        }

        <!-- RESULT & WORKSPACE VIEW (When done) -->
        @if (state() === 'done' && store.memo()) {
          <div class="space-y-6">
            
            <!-- Toolbar: 6 Layout Switchers & Actions (Hidden in print) -->
            <div class="no-print bg-white p-4 rounded-2xl border border-[#E7DFCF] shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-xs font-bold text-[#5B6B60] me-2">{{ lang.tr('Modèle visuel :', 'النموذج البصري :') }}</span>
                
                <button
                  (click)="setLayout('tree')"
                  [class]="store.memoLayout() === 'tree' ? 'bg-[#1B4332] text-[#FBF8F1]' : 'bg-[#FBF8F1] text-[#14251D] border border-[#E7DFCF]'"
                  class="px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  🌳 {{ lang.t('memoLayoutTree') }}
                </button>

                <button
                  (click)="setLayout('steps')"
                  [class]="store.memoLayout() === 'steps' ? 'bg-[#1B4332] text-[#FBF8F1]' : 'bg-[#FBF8F1] text-[#14251D] border border-[#E7DFCF]'"
                  class="px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  🔢 {{ lang.t('memoLayoutSteps') }}
                </button>

                <button
                  (click)="setLayout('cards')"
                  [class]="store.memoLayout() === 'cards' ? 'bg-[#1B4332] text-[#FBF8F1]' : 'bg-[#FBF8F1] text-[#14251D] border border-[#E7DFCF]'"
                  class="px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  🗂️ {{ lang.t('memoLayoutCards') }}
                </button>

                <button
                  (click)="setLayout('timeline')"
                  [class]="store.memoLayout() === 'timeline' ? 'bg-[#1B4332] text-[#FBF8F1]' : 'bg-[#FBF8F1] text-[#14251D] border border-[#E7DFCF]'"
                  class="px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  ⏳ {{ lang.t('memoLayoutTimeline') }}
                </button>

                <button
                  (click)="setLayout('table')"
                  [class]="store.memoLayout() === 'table' ? 'bg-[#1B4332] text-[#FBF8F1]' : 'bg-[#FBF8F1] text-[#14251D] border border-[#E7DFCF]'"
                  class="px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  📊 {{ lang.t('memoLayoutTable') }}
                </button>

                <button
                  (click)="setLayout('conjugation')"
                  [class]="store.memoLayout() === 'conjugation' ? 'bg-[#1B4332] text-[#FBF8F1]' : 'bg-[#FBF8F1] text-[#14251D] border border-[#E7DFCF]'"
                  class="px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  ✍️ {{ lang.t('memoLayoutConjugation') }}
                </button>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <button
                  (click)="saveMemo()"
                  [disabled]="isSaving()"
                  class="bg-[#8A5A00] hover:bg-[#734A00] disabled:opacity-50 text-[#FBF8F1] font-semibold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  💾 {{ isSaved() ? lang.t('memoBtnSaved') : lang.t('memoBtnSave') }}
                </button>

                <button
                  (click)="copyShareLink()"
                  class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  🔗 {{ shareCopied() ? lang.tr('Copié !', 'تم!') : lang.t('memoBtnShare') }}
                </button>

                <button
                  (click)="downloadDocx()"
                  [disabled]="isExportingWord()"
                  class="bg-[#1E3A8A] hover:bg-[#172554] disabled:opacity-50 text-[#FBF8F1] font-semibold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  📄 {{ isExportingWord() ? '...' : lang.t('memoBtnDocx') }}
                </button>

                <button
                  (click)="printMemo()"
                  class="bg-[#14251D] hover:bg-[#0D1813] text-[#FBF8F1] font-semibold px-3 py-1.5 rounded-xl text-xs border border-[#2D6A4F] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  🖨️ {{ lang.t('memoBtnPrint') }}
                </button>
              </div>
            </div>

            <!-- Optional Extracted Text Inspection Step (for photo/file modes) -->
            @if (extractedText()) {
              <div class="no-print bg-[#FBF8F1] p-4 rounded-2xl border border-[#E7DFCF] space-y-2">
                <div class="flex items-center justify-between">
                  <label for="memo-extracted-text-area" class="font-bold text-xs text-[#14251D]">{{ lang.t('memoExtractedTextLabel') }}</label>
                  <button
                    (click)="regenerateWithExtractedText()"
                    class="text-xs font-semibold text-[#8A5A00] hover:underline cursor-pointer"
                  >
                    ↻ {{ lang.t('memoBtnRegenWithText') }}
                  </button>
                </div>
                <textarea
                  id="memo-extracted-text-area"
                  rows="3"
                  [(ngModel)]="extractedText"
                  class="w-full bg-white border border-[#E7DFCF] rounded-xl p-3 text-xs text-[#14251D] focus:outline-none focus:border-[#2D6A4F]"
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
  private readonly route = inject(ActivatedRoute);

  readonly activeTab = signal<'topic' | 'text' | 'photo' | 'file' | 'library'>('topic');
  readonly state = signal<'idle' | 'analyzing' | 'done' | 'error'>('idle');
  readonly errorMessage = signal<string>('');

  readonly topic = signal<string>('Les déterminants');
  readonly text = signal<string>('');
  readonly grade = signal<string>('6ème Année');
  readonly subject = signal<string>('Français');
  readonly trimester = signal<string>('1er Trimestre');
  readonly language = signal<'ar' | 'fr'>('fr');
  readonly instructions = signal<string>('');

  readonly images = signal<{ base64Data: string; contentType: string }[]>([]);
  readonly file = signal<{ base64Data: string; contentType: string; filename: string } | null>(null);
  readonly resourceUrl = signal<string>('');
  readonly extractedText = signal<string>('');

  readonly libraryItems = signal<LibraryResourceItem[]>([]);

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
      const res = await fetch('/assets/resources/index.json');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.items)) {
          this.libraryItems.set(data.items.slice(0, 50));
        }
      }
    } catch {
      // Fallback
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

    const teacher = this.store.activeTeacherProfile();
    const payload = {
      memoDoc: memo,
      memoLayout: this.store.memoLayout(),
      authorName: teacher?.name || 'Enseignant Madrasati',
      authorRole: 'teacher' as const,
      school: teacher?.school || 'المدرسة الابتدائية التونسية',
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

    const author = this.savedAuthorName() || this.store.activeTeacherProfile()?.name || 'Enseignant Madrasati';
    const school = this.savedSchool() || this.store.activeTeacherProfile()?.school || 'المدرسة الابتدائية التونسية';

    const blob = await this.store.exportMemoDocx(memo, author, school);
    this.isExportingWord.set(false);

    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memo-${(memo.topic || memo.title || 'cours').replace(/\\s+/g, '_')}.docx`;
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
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
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
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) {
        const processed = await downscaleImage(files[i]);
        this.images.update((imgs) => [...imgs.slice(0, 7), processed]);
      }
    }
  }

  async onImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    for (let i = 0; i < input.files.length; i++) {
      const processed = await downscaleImage(input.files[i]);
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
