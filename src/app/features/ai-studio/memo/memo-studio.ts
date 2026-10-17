import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  inject,
  HostListener,
  OnInit,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { EducationStore } from '@core/services/education-store';
import { LanguageService } from '@core/services/language.service';
import { FirebaseService } from '@core/services/firebase.service';
import { StorageVaultService } from '@core/services/storage-vault.service';
import { createStudioSession } from '@core/services/studio-session';
import { downscaleImage } from '@core/utils/image.util';
import { MemoDoc, MemoInput, SummaryLength } from '@core/models/memo.model';
import { SUMMARY_MAX_IMAGES, summarySections } from '@core/utils/summary.util';
import { CurriculumChapter } from '@core/data/curriculum-chapters.data';
import { chapterTitle } from '@core/utils/curriculum.util';
import { TopicPickerComponent } from '@shared/components/topic-picker';
import { StudioSessionBannerComponent } from '@shared/components/studio-session-banner';
import { SummaryDocumentComponent } from './summary-document';

type SourceTab = 'topic' | 'text' | 'photo' | 'file' | 'library';
type MemoPanel = 'source' | 'settings' | 'options';

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
    TopicPickerComponent,
    StudioSessionBannerComponent,
    SummaryDocumentComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="text-[#14251D] pb-16">

      <!-- Main Container -->
      <main id="memo-main" class="w-full space-y-5 scroll-mt-4">
        <!-- Studio bar: same as the infographic studio, Cartouche tokens -->
        <div class="no-print bg-[#14251D] text-[#FBF8F1] rounded-2xl px-5 py-3">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center gap-1 bg-[#F2C14E] text-[#14251D] text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  <span class="material-icons text-xs" aria-hidden="true">note_alt</span>
                  {{ lang.tr('Fiche de révision', 'ملف مراجعة') }}
                </span>
                <span class="text-xs text-[#B7C7BC] whitespace-nowrap">{{ lang.translateGrade(store.memo()?.grade || grade()) }}</span>
                <span class="text-xs text-[#B7C7BC] whitespace-nowrap">{{ lang.translateSubject(store.memo()?.subject || subject()) }}</span>
                <span class="text-xs text-[#9DBBA8] inline-flex items-center gap-1.5 whitespace-nowrap" aria-live="polite">
                  <span class="w-1.5 h-1.5 rounded-full" [class]="busy() ? 'bg-[#F2C14E] animate-pulse' : 'bg-[#9DBBA8]'"></span>
                  {{ busy() ? lang.tr('Génération en cours', 'جارٍ التوليد') : autoSaving() ? lang.tr('Enregistrement…', 'جارٍ الحفظ…') : isSaved() || autoSaved() ? lang.tr('Enregistré', 'تم الحفظ') : lang.tr('Prêt', 'جاهز') }}
                </span>
              </div>
              <h1 dir="auto" class="font-display text-lg sm:text-xl font-semibold mt-0.5 truncate max-w-[70vw] lg:max-w-xl">
                {{ store.memo()?.title || topic() || lang.tr('Nouvelle fiche de révision', 'ملف مراجعة جديد') }}
              </h1>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              @if (state() === 'done' && store.memo()) {
                <label class="flex items-center gap-2 px-3 min-h-11 rounded-xl border border-[#FBF8F1]/20 bg-[#FBF8F1]/10 text-sm font-semibold cursor-pointer">
                  <input type="checkbox" [checked]="teacherCopy()" (change)="teacherCopy.set($any($event.target).checked)" class="w-4 h-4 accent-[#F2C14E]" />
                  {{ lang.tr('Copie enseignant', 'نسخة المعلّم') }}
                </label>
                <button type="button" (click)="saveMemo()" [disabled]="isSaving()" [attr.aria-label]="lang.t('memoBtnSave')" class="bg-[#FBF8F1]/10 hover:bg-[#FBF8F1]/20 border border-[#FBF8F1]/20 min-h-11 rounded-xl text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-colors text-[#FBF8F1] disabled:opacity-50 disabled:cursor-default px-3.5">
                  <span class="material-icons text-base" aria-hidden="true">{{ isSaved() ? 'bookmark_added' : 'bookmark_add' }}</span>
                  <span class="hidden sm:inline">{{ isSaved() ? lang.t('memoBtnSaved') : lang.t('memoBtnSave') }}</span>
                </button>
                <button type="button" (click)="copyShareLink()" [attr.aria-label]="lang.t('memoBtnShare')" class="bg-[#FBF8F1]/10 hover:bg-[#FBF8F1]/20 border border-[#FBF8F1]/20 min-h-11 rounded-xl text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-colors text-[#FBF8F1] disabled:opacity-50 disabled:cursor-default px-3.5">
                  <span class="material-icons text-base" aria-hidden="true">link</span>
                  <span class="hidden sm:inline">{{ shareCopied() ? lang.tr('Lien copié', 'تم نسخ الرابط') : lang.t('memoBtnShare') }}</span>
                </button>
                <button type="button" (click)="downloadDocx()" [disabled]="isExportingWord()" [attr.aria-label]="lang.t('memoBtnDocx')" class="bg-[#FBF8F1]/10 hover:bg-[#FBF8F1]/20 border border-[#FBF8F1]/20 min-h-11 rounded-xl text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-colors text-[#FBF8F1] disabled:opacity-50 disabled:cursor-default px-3.5">
                  <span class="material-icons text-base" aria-hidden="true">description</span>
                  <span class="hidden sm:inline">{{ isExportingWord() ? lang.tr('Export…', 'جارٍ التصدير…') : lang.t('memoBtnDocx') }}</span>
                </button>
              } @else {
                <div role="group" [attr.aria-label]="lang.tr('Panneau en haut', 'اللوحة في الأعلى')" class="flex items-center gap-1 p-1 rounded-xl border border-[#FBF8F1]/20 bg-[#FBF8F1]/10">
                  @for (panel of panels; track panel.id) {
                    <button
                      type="button"
                      (click)="topPanel.set(panel.id)"
                      [attr.aria-pressed]="topPanel() === panel.id"
                      [attr.aria-label]="lang.tr(panel.fr, panel.ar)"
                      [class]="topPanel() === panel.id ? 'bg-[#FBF8F1] text-[#14251D]' : 'text-[#FBF8F1] hover:bg-[#FBF8F1]/15'"
                      class="px-3 min-h-9 rounded-lg text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[#F2C14E]">
                      <span class="material-icons text-base" aria-hidden="true">{{ panel.icon }}</span>
                      <span class="hidden md:inline">{{ lang.tr(panel.fr, panel.ar) }}</span>
                    </button>
                  }
                </div>
              }
              <button type="button" (click)="generateMemo()" [disabled]="busy() || !store.memo()" class="bg-[#FBF8F1]/10 hover:bg-[#FBF8F1]/20 border border-[#FBF8F1]/20 min-h-11 rounded-xl text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-colors text-[#FBF8F1] disabled:opacity-50 disabled:cursor-default px-4">
                <span class="material-icons text-base" [class.animate-spin]="busy()" aria-hidden="true">refresh</span>
                {{ lang.tr('Régénérer', 'إعادة التوليد') }}
              </button>
              <button type="button" (click)="startNew()" [attr.aria-label]="lang.tr('Créer un nouveau', 'مشروع جديد')" class="bg-[#FBF8F1]/10 hover:bg-[#FBF8F1]/20 border border-[#FBF8F1]/20 min-h-11 rounded-xl text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-colors text-[#FBF8F1] disabled:opacity-50 disabled:cursor-default px-3.5">
                <span class="material-icons text-base" aria-hidden="true">add_circle_outline</span>
                <span class="hidden sm:inline">{{ lang.tr('Nouveau', 'جديد') }}</span>
              </button>
              @if (state() === 'done' && store.memo()) {
                <button type="button" (click)="printMemo()" class="bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#14251D] px-4 min-h-11 rounded-xl text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                  <span class="material-icons text-base" aria-hidden="true">print</span>
                  {{ lang.t('memoBtnPrint') }}
                </button>
              }
            </div>
          </div>
        </div>

        <app-studio-session-banner [session]="session" />

        <!-- Workspace: form panels on the start side (right in Arabic), preview or document beside them -->
        <div [class]="workspaceGrid()">
          <div [class]="formColumn()" [attr.inert]="session.busy() ? '' : null" [attr.aria-busy]="session.busy()">
            
            <fieldset class="bg-white rounded-2xl border border-[#E7DFCF] p-4 sm:p-5 space-y-4 [&>*:not(legend)]:clear-both" [style.order]="panelOrder('source')">
            <legend class="float-start w-full font-display font-semibold text-sm text-[#14251D] flex items-center gap-2">
              <span class="w-6 h-6 rounded-md bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">
                <span class="material-icons text-sm" aria-hidden="true">source</span>
              </span>
              <span>{{ lang.tr('Source', 'المصدر') }}</span>
            </legend>
            <div role="tablist" [attr.aria-label]="lang.tr('Source du cours', 'مصدر الدرس')" class="flex flex-wrap gap-1.5 p-1.5 rounded-2xl border border-[#E7DFCF] bg-[#FBF8F1]">
              @for (tab of sourceTabs; track tab.id) {
                <button
                  type="button"
                  role="tab"
                  [attr.aria-selected]="activeTab() === tab.id"
                  (click)="activeTab.set(tab.id)"
                  [class]="activeTab() === tab.id ? 'bg-[#14251D] text-[#FBF8F1] shadow-xs font-semibold' : 'text-[#5B6B60] hover:bg-[#F2ECDE] hover:text-[#14251D] font-medium'"
                  class="px-3 min-h-10 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
                  <span class="material-icons text-base" aria-hidden="true">{{ tab.icon }}</span>
                  <span>{{ lang.t(tab.key) }}</span>
                </button>
              }
            </div>

            <!-- TAB 1: Topic Input -->
            @if (activeTab() === 'topic') {
              <div class="space-y-2">
                <label for="memo-topic-input" class="block text-sm font-semibold text-[#14251D]">{{ lang.t('memoInputTopicLabel') }}</label>
                <textarea
                  id="memo-topic-input"
                  rows="2"
                  [(ngModel)]="topic"
                  (ngModelChange)="session.clearFieldError('memo-topic-input')"
                  [attr.aria-invalid]="!!session.fieldError('memo-topic-input')"
                  [placeholder]="lang.t('memoInputTopicPlaceholder')"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] aria-invalid:border-[#BF5B34] rounded-xl p-3 text-sm text-[#14251D] leading-relaxed resize-y focus:bg-white focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F] transition-all shadow-2xs"
                ></textarea>
                @if (session.fieldError('memo-topic-input'); as msg) {
                  <p class="text-xs font-medium text-[#BF5B34]">{{ msg }}</p>
                }
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
                <label for="memo-text-input" class="block text-sm font-semibold text-[#14251D]">{{ lang.t('memoInputTextLabel') }}</label>
                <textarea
                  id="memo-text-input"
                  rows="6"
                  [(ngModel)]="text"
                  (ngModelChange)="session.clearFieldError('memo-text-input')"
                  [attr.aria-invalid]="!!session.fieldError('memo-text-input')"
                  [placeholder]="lang.t('memoInputTextPlaceholder')"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] aria-invalid:border-[#BF5B34] rounded-xl p-3.5 text-sm text-[#14251D] leading-relaxed resize-y focus:bg-white focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F] transition-all shadow-2xs"
                ></textarea>
                @if (session.fieldError('memo-text-input'); as msg) {
                  <p class="text-xs font-medium text-[#BF5B34]">{{ msg }}</p>
                }
              </div>
            }

            <!-- TAB 3: Photo / Screenshot Upload & Paste -->
            @if (activeTab() === 'photo') {
              <div class="space-y-3">
                <label for="photo-file-input" class="block text-sm font-semibold text-[#14251D]">{{ lang.tr('Ajouter ou coller des captures (Ctrl+V)', 'إضافة أو لصق لقطات الشاشة') }}</label>
                <div
                  (dragover)="onDragOver($event)"
                  (drop)="onDrop($event)"
                  class="border-2 border-dashed border-[#E7DFCF] rounded-lg p-6 text-center bg-[#FBF8F1] hover:bg-[#F2ECDE] transition-colors"
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
                      id="photo-browse"
                      (click)="photoFileInput.click()"
                      class="px-5 min-h-11 bg-[#FBF8F1] border border-[#E7DFCF] rounded-md text-sm font-medium text-[#4A5A50] hover:bg-[#F2ECDE] transition-colors cursor-pointer"
                    >
                      {{ lang.tr('Parcourir les fichiers', 'استعراض الصور') }}
                    </button>
                  </div>
                </div>

                @if (images().length > 0) {
                  <div class="flex flex-wrap gap-2 pt-2">
                    @for (img of images(); track $index) {
                      <div class="relative w-20 h-20 rounded-md overflow-hidden border border-[#E7DFCF] group">
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
                <div class="border-2 border-dashed border-[#E7DFCF] rounded-lg p-6 text-center bg-[#FBF8F1]">
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
                      id="doc-browse"
                      (click)="docFileInput.click()"
                      class="px-5 min-h-11 bg-[#FBF8F1] border border-[#E7DFCF] rounded-md text-sm font-medium text-[#4A5A50] hover:bg-[#F2ECDE] transition-colors cursor-pointer"
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
                    (ngModelChange)="session.clearFieldError('library-resource-select')"
                    [attr.aria-invalid]="!!session.fieldError('library-resource-select')"
                    class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-md px-3 min-h-11 text-sm text-[#14251D] focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
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
              <label for="memo-instructions-input" class="block text-sm font-semibold text-[#14251D] flex items-center justify-between">
                <span>{{ lang.t('memoInstructionsLabel') }}</span>
                <span class="text-xs font-normal text-[#5B6B60]">{{ lang.tr('Optionnel', 'اختياري') }}</span>
              </label>
              <textarea
                id="memo-instructions-input"
                rows="3"
                [(ngModel)]="instructions"
                [placeholder]="lang.t('memoInstructionsPlaceholder')"
                class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl p-3 text-sm text-[#14251D] leading-relaxed resize-y focus:bg-white focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F] transition-all shadow-2xs"
              ></textarea>
            </div>

            </fieldset>

            <fieldset class="bg-white rounded-2xl border border-[#E7DFCF] p-4 sm:p-5 space-y-4 [&>*:not(legend)]:clear-both" [style.order]="panelOrder('settings')">
            <legend class="float-start w-full font-display font-semibold text-sm text-[#14251D] flex items-center gap-2">
              <span class="w-6 h-6 rounded-md bg-[#8A5A00]/10 text-[#8A5A00] flex items-center justify-center">
                <span class="material-icons text-sm" aria-hidden="true">tune</span>
              </span>
              <span>{{ lang.tr('Paramètres pédagogiques', 'الإعدادات البيداغوجية') }}</span>
            </legend>
            <!-- Metadata Pickers (Grade / Subject / Trimester / Language) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label for="memo-grade-select" class="block text-xs font-semibold text-[#5B6B60] mb-1.5">{{ lang.t('memoGradeLabel') }}</label>
                <select
                  id="memo-grade-select"
                  [(ngModel)]="grade"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3.5 min-h-11 text-sm text-[#14251D] focus:bg-white focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F] transition-colors"
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
                <label for="memo-subject-select" class="block text-xs font-semibold text-[#5B6B60] mb-1.5">{{ lang.t('memoSubjectLabel') }}</label>
                <select
                  id="memo-subject-select"
                  [(ngModel)]="subject"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3.5 min-h-11 text-sm text-[#14251D] focus:bg-white focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F] transition-colors"
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
                <label for="memo-trimester-select" class="block text-xs font-semibold text-[#5B6B60] mb-1.5">{{ lang.t('memoTrimesterLabel') }}</label>
                <select
                  id="memo-trimester-select"
                  [(ngModel)]="trimester"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3.5 min-h-11 text-sm text-[#14251D] focus:bg-white focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F] transition-colors"
                >
                  <option value="Trimestre 1">Trimestre 1 (الثلاثي الأول)</option>
                  <option value="Trimestre 2">Trimestre 2 (الثلاثي الثاني)</option>
                  <option value="Trimestre 3">Trimestre 3 (الثلاثي الثالث)</option>
                </select>
              </div>

              <div>
                <label for="memo-lang-select" class="block text-xs font-semibold text-[#5B6B60] mb-1.5">{{ lang.t('memoLanguageLabel') }}</label>
                <select
                  id="memo-lang-select"
                  [(ngModel)]="language"
                  class="w-full bg-[#FBF8F1] border border-[#E7DFCF] rounded-xl px-3.5 min-h-11 text-sm text-[#14251D] focus:bg-white focus:border-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F] transition-colors"
                >
                  <option value="ar">العربية (Arabe standard)</option>
                  <option value="fr">Français (Langue française)</option>
                </select>
              </div>
            </div>

            </fieldset>

            <fieldset class="bg-white rounded-2xl border border-[#E7DFCF] p-4 sm:p-5 space-y-4 [&>*:not(legend)]:clear-both" [style.order]="panelOrder('options')">
            <legend class="float-start w-full font-display font-semibold text-sm text-[#14251D] flex items-center gap-2">
              <span class="w-6 h-6 rounded-md bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">
                <span class="material-icons text-sm" aria-hidden="true">checklist</span>
              </span>
              <span>{{ lang.tr('Longueur et exercices', 'الطول والتمارين') }}</span>
            </legend>
            <!-- Document length and practice exercises -->
            <div class="space-y-3">
              <div>
                <p class="block text-xs font-semibold text-[#5B6B60] mb-1.5">{{ lang.tr('Longueur du document', 'طول الملف') }}</p>
                <div class="grid grid-cols-2 gap-2">
                  @for (opt of lengthOptions; track opt.key) {
                    <button
                      type="button"
                      (click)="length.set(opt.key)"
                      [attr.aria-pressed]="length() === opt.key"
                      [class]="length() === opt.key ? 'border-[#2D6A4F] bg-[#1B4332]/5 text-[#1B4332] font-semibold ring-2 ring-[#2D6A4F]/20' : 'border-[#E7DFCF] bg-[#FBF8F1] text-[#5B6B60] hover:bg-[#F2ECDE] font-medium'"
                      class="border rounded-xl px-3 min-h-11 text-xs sm:text-sm cursor-pointer transition-all text-center">
                      {{ lang.tr(opt.fr, opt.ar) }}
                    </button>
                  }
                </div>
              </div>
              <label class="flex items-center gap-3 min-h-12 px-3.5 rounded-xl border border-[#E7DFCF] bg-[#FBF8F1] hover:bg-[#F2ECDE] transition-colors cursor-pointer">
                <input type="checkbox" [checked]="withPractice()" (change)="withPractice.set($any($event.target).checked)" class="w-4 h-4 accent-[#2D6A4F] rounded cursor-pointer" />
                <div class="flex flex-col">
                  <span class="text-sm font-semibold text-[#14251D]">{{ lang.tr('Avec exercices et corrigé', 'مع تمارين وإصلاحها') }}</span>
                  <span class="text-[11px] text-[#5B6B60]">{{ lang.tr('Génère une série d’exercices avec solutions', 'توليد أنشطة تدريبية مصحوبة بحلولها') }}</span>
                </div>
              </label>
            </div>

            </fieldset>

            <div class="space-y-3" style="order: 10">
            @if (missingSourceMessage(); as msg) {
              <p role="alert" class="text-sm font-medium text-[#BF5B34]">{{ msg }}</p>
            }

            <!-- Action Button -->
            <div class="pt-2">
              <button
                (click)="generateMemo()"
                class="w-full bg-[#1B4332] hover:bg-[#14251D] disabled:opacity-50 disabled:cursor-not-allowed text-[#FBF8F1] font-semibold min-h-12 px-6 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
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

          </div>

          @if (state() === 'done' && store.memo()) {
          <div class="min-w-0 space-y-6">
            
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

            <!-- Revision document -->
            <div class="print-document sd-print-flow">
              <app-summary-document
                [memo]="store.memo()!"
                [author]="savedAuthorName() || watermarkName()"
                [editable]="true"
                [busyIndex]="busySection()"
                [pictureBusyIndex]="busyPicture()"
                [teacherCopy]="teacherCopy()"
                (regenerate)="regenerateSection($event)"
                (addPicture)="pickPicture($event)"
                (generatePicture)="generatePicture($event)"
                (resizePicture)="resizePicture($event.index, $event.width)"
                (removePicture)="removePicture($event)" />
              <input #pictureInput type="file" accept="image/*" class="hidden" (change)="onPictureSelected($event)" />
            </div>

          </div>
          } @else {
          <aside class="no-print lg:sticky lg:top-6" [attr.aria-label]="lang.tr('Aperçu du document', 'معاينة الملف')">
            <p class="text-sm font-semibold text-[#5B6B60] mb-2">{{ lang.tr('Aperçu du document', 'معاينة الملف') }}</p>
            <div class="relative bg-white border border-[#E7DFCF] rounded-md shadow-sm aspect-[210/297] w-full overflow-hidden p-5 sm:p-6 flex flex-col">
              <div aria-hidden="true" class="absolute inset-0 flex items-center justify-center pointer-events-none select-none -rotate-45 font-display text-3xl font-semibold text-[#0B2947]/[0.07] text-center px-6">
                {{ watermarkName() }}
              </div>

              <div class="border-b border-[#E7DFCF] pb-2 mb-3 relative">
                <p class="font-display text-sm font-semibold text-[#14251D] line-clamp-2">
                  {{ topic() || lang.tr('Titre de votre leçon', 'عنوان درسك') }}
                </p>
                <p class="text-xs text-[#5B6B60] mt-0.5 flex gap-2">
                  <span>{{ grade() }}</span>
                  <span>{{ subject() }}</span>
                </p>
              </div>

              <div aria-hidden="true" class="relative flex-1 space-y-4 overflow-hidden">
                @for (i of previewSections(); track i) {
                  <div class="space-y-1.5">
                    <div class="flex items-center gap-2"><div class="w-4 h-4 rounded-full bg-[#2D6A4F]/25"></div><div class="h-2 rounded-sm bg-[#CBD9E2] w-1/3"></div></div>
                    <div class="h-1.5 rounded-sm bg-[#E7DFCF]"></div>
                    <div class="h-1.5 rounded-sm bg-[#E7DFCF] w-5/6"></div>
                    <div class="h-1.5 rounded-sm bg-[#E7DFCF] w-2/3"></div>
                  </div>
                }
              </div>

              <p class="relative text-xs text-[#5B6B60] border-t border-[#E7DFCF] pt-2 mt-3">
                {{ watermarkName() }}
              </p>
            </div>
            <p class="text-sm text-[#5B6B60] mt-2">{{ lang.tr('Votre nom est imprimé sur chaque fiche.', 'اسمك يُطبع على كل بطاقة.') }}</p>
          </aside>
          }
        </div>

      </main>
    </div>
  `,
})
export class MemoStudioComponent implements OnInit {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  readonly firebase = inject(FirebaseService);
  private readonly route = inject(ActivatedRoute);

  readonly activeTab = signal<SourceTab>('topic');
  readonly sourceTabs: { id: SourceTab; icon: string; key: string }[] = [
    { id: 'topic', icon: 'menu_book', key: 'memoTabTopic' },
    { id: 'text', icon: 'notes', key: 'memoTabText' },
    { id: 'photo', icon: 'photo_camera', key: 'memoTabPhoto' },
    { id: 'file', icon: 'upload_file', key: 'memoTabFile' },
    { id: 'library', icon: 'auto_stories', key: 'memoTabLibrary' },
  ];
  readonly panels: { id: MemoPanel; icon: string; fr: string; ar: string }[] = [
    { id: 'source', icon: 'source', fr: 'Source', ar: 'المصدر' },
    { id: 'settings', icon: 'tune', fr: 'Paramètres', ar: 'الإعدادات' },
    { id: 'options', icon: 'checklist', fr: 'Longueur et exercices', ar: 'الطول والتمارين' },
  ];
  /** Once the document exists it takes most of the width; the panels stay beside it. */
  readonly workspaceGrid = computed(() =>
    this.state() === 'done' && this.store.memo()
      ? 'grid gap-4 items-start lg:grid-cols-[minmax(26rem,31rem)_minmax(0,1fr)] xl:grid-cols-[minmax(28rem,34rem)_minmax(0,1fr)]'
      : 'grid gap-8 items-start lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]',
  );
  readonly formColumn = computed(() =>
    this.state() === 'done' && this.store.memo()
      ? 'no-print flex flex-col gap-3'
      : 'no-print flex flex-col gap-3',
  );
  /** Form card shown first; the others keep their usual order below it. */
  readonly topPanel = signal<MemoPanel>('source');
  readonly state = signal<'idle' | 'analyzing' | 'done' | 'error'>('idle');
  readonly errorMessage = signal<string>('');
  private readonly vault = inject(StorageVaultService);

  readonly session = createStudioSession<MemoDraft>('memo', {
    restore: (draft) => this.applyDraft(draft),
    retry: () => void this.generateMemo(),
    undo: (previous) => this.applyResult(previous as { memo: MemoDoc }),
  });

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

  readonly length = signal<SummaryLength>('short');
  readonly withPractice = signal<boolean>(true);
  readonly teacherCopy = signal<boolean>(false);
  /** 1-based index of the section being rewritten, 0 = none. */
  readonly busySection = signal<number>(0);
  /** 1-based index of the section whose AI picture is being drawn, 0 = none. */
  readonly busyPicture = signal<number>(0);
  readonly busy = computed(() => this.state() === 'analyzing' || this.busySection() > 0);
  private pictureTarget = -1;
  private readonly pictureInput = viewChild<ElementRef<HTMLInputElement>>('pictureInput');

  readonly lengthOptions: { key: SummaryLength; fr: string; ar: string }[] = [
    { key: 'short', fr: 'Courte (1–2 pages)', ar: 'قصير (1–2 صفحة)' },
    { key: 'full', fr: 'Complète (3–4 pages)', ar: 'كامل (3–4 صفحات)' },
  ];
  readonly previewSections = computed(() => (this.length() === 'full' ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4]));

  readonly watermarkName = computed(
    () => this.firebase.userProfile()?.displayName || this.lang.tr('Votre nom', 'اسمك'),
  );

  readonly libraryItems = signal<LibraryResourceItem[]>([]);
  readonly libraryLoaded = signal(false);

  readonly isSaving = signal<boolean>(false);
  readonly isSaved = signal<boolean>(false);
  readonly autoSaving = signal<boolean>(false);
  readonly autoSaved = signal<boolean>(false);
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  readonly shareCopied = signal<boolean>(false);
  readonly isExportingWord = signal<boolean>(false);

  readonly savedMemoId = signal<string | null>(null);
  readonly savedAuthorName = signal<string | null>(null);
  readonly savedSchool = signal<string | null>(null);

  /** Form fields kept as a local draft while the memo is not saved in the library. */
  private readonly formDraft = computed<MemoDraft>(() => ({
    tab: this.activeTab(),
    topic: this.topic(),
    topicId: this.topicId(),
    text: this.text(),
    grade: this.grade(),
    subject: this.subject(),
    trimester: this.trimester(),
    language: this.language(),
    instructions: this.instructions(),
    length: this.length(),
    withPractice: this.withPractice(),
    images: this.images(),
    file: this.file(),
    resourceUrl: this.resourceUrl(),
  }));

  /** Required-field message for the photo, file and library tabs; it clears once the source is given. */
  readonly missingSourceMessage = computed(() => {
    const tab = this.activeTab();
    if (tab === 'photo' && !this.images().length) return this.session.fieldError('photo-browse');
    if (tab === 'file' && !this.file()) return this.session.fieldError('doc-browse');
    if (tab === 'library' && !this.resourceUrl()) return this.session.fieldError('library-resource-select');
    return '';
  });

  constructor() {
    effect(() => {
      const d = this.formDraft();
      const hasContent = !!(d.topic.trim() || d.text.trim() || d.images.length || d.file || d.resourceUrl);
      if (hasContent && !this.isSaved()) this.session.saveDraft(d);
    });
  }

  private applyDraft(d: MemoDraft) {
    this.activeTab.set(d.tab);
    this.topic.set(d.topic);
    this.topicId.set(d.topicId);
    this.pickedTitle = d.topicId ? d.topic : '';
    this.text.set(d.text);
    this.grade.set(d.grade);
    this.subject.set(d.subject);
    this.trimester.set(d.trimester);
    this.language.set(d.language);
    this.instructions.set(d.instructions);
    this.length.set(d.length ?? 'short');
    this.withPractice.set(d.withPractice ?? true);
    this.images.set(d.images);
    this.file.set(d.file);
    this.resourceUrl.set(d.resourceUrl);
  }

  private applyResult(r: { memo: MemoDoc }) {
    this.store.memo.set(r.memo);
    this.state.set('done');
  }

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
          this.savedMemoId.set(loaded.id);
          this.savedAuthorName.set(loaded.authorName || null);
          this.savedSchool.set(loaded.school || null);
          this.isSaved.set(true);
          this.state.set('done');
          return;
        }
      }

      // Restore unsaved draft from IndexedDB on page reload
      const cached = await this.vault.getAsset<{
        memo: MemoDoc;
        topic: string;
        grade: string;
        subject: string;
        trimester: string;
        extractedText: string;
      }>('madrasati_draft_memo');

      if (cached && cached.memo) {
        this.store.memo.set(cached.memo);
        if (cached.topic) this.topic.set(cached.topic);
        if (cached.grade) this.grade.set(cached.grade);
        if (cached.subject) this.subject.set(cached.subject);
        if (cached.trimester) this.trimester.set(cached.trimester);
        if (cached.extractedText) this.extractedText.set(cached.extractedText);
        this.state.set('done');
      }
    });
  }

  async resetMemoStudio() {
    await this.vault.deleteAsset('madrasati_draft_memo');
    void this.session.clearDraft();
    this.store.memo.set(null);
    this.state.set('idle');
    this.topic.set('');
    this.text.set('');
    this.extractedText.set('');
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

  panelOrder(id: MemoPanel): number {
    return id === this.topPanel() ? 0 : this.panels.findIndex((p) => p.id === id) + 1;
  }

  async startNew() {
    await this.resetMemoStudio();
    this.resetToNew();
  }

  resetToNew() {
    this.state.set('idle');
    this.errorMessage.set('');
    this.savedMemoId.set(null);
    this.savedAuthorName.set(null);
    this.isSaved.set(false);
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaved.set(false);
  }

  printMemo() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  /** Saving stores the memo in the library, so it needs an account (signup resumes the save). */
  saveMemo() {
    this.store.requireAccount(() => this.persistMemo());
  }

  private async persistMemo() {
    const memo = this.store.memo();
    if (!memo) return;
    this.isSaving.set(true);

    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    const payload = this.savePayload(memo);
    const saved = await this.store.saveMemo({ ...payload, id: this.savedMemoId() ?? undefined, published: true });
    this.isSaving.set(false);

    if (saved && saved.id) {
      this.savedMemoId.set(saved.id);
      this.isSaved.set(true);
      void this.session.clearDraft();
      this.savedAuthorName.set(payload.authorName);
      this.savedSchool.set(payload.school);
      this.store.showToast(this.lang.tr('Fiche de révision enregistrée !', 'تم حفظ ملف المراجعة!'), 'success');
    } else {
      this.store.showToast(this.lang.tr('Erreur lors de l\'enregistrement', 'تعذر حفظ ملف المراجعة'), 'error');
    }
  }

  copyShareLink() {
    this.store.requireAccount(() => this.copySavedMemoLink());
  }

  private async copySavedMemoLink() {
    if (!this.savedMemoId()) await this.persistMemo();
    const memoId = this.savedMemoId();
    const url = memoId ? `${window.location.origin}/ai-studio?tab=memo&memo=${memoId}` : '';

    if (url && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      this.shareCopied.set(true);
      this.store.showToast(this.lang.tr('Lien de partage copié !', 'تم نسخ رابط ملف المراجعة!'), 'success');
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

    const blob = await this.store.exportMemoDocx(memo, author, school, this.teacherCopy());
    this.isExportingWord.set(false);

    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revision-${(memo.topic || memo.title || 'cours').replace(/\s+/g, '_')}.docx`;
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
    if (this.session.busy()) return;
    const tab = this.activeTab();
    const t = (fr: string, ar: string) => this.lang.tr(fr, ar);
    const valid = this.session.validate([
      { id: 'memo-topic-input', ok: tab !== 'topic' || !!this.topic().trim(), message: t('Indiquez le sujet de la leçon.', 'اكتب موضوع الدرس.') },
      { id: 'memo-text-input', ok: tab !== 'text' || !!this.text().trim(), message: t('Collez le texte du cours.', 'الصق نص الدرس.') },
      { id: 'photo-browse', ok: tab !== 'photo' || this.images().length > 0, message: t('Ajoutez au moins une photo.', 'أضف صورة واحدة على الأقل.') },
      { id: 'doc-browse', ok: tab !== 'file' || !!this.file(), message: t('Choisissez un fichier PDF ou Word.', 'اختر ملف PDF أو Word.') },
      { id: 'library-resource-select', ok: tab !== 'library' || !!this.resourceUrl(), message: t('Choisissez un document officiel.', 'اختر وثيقة رسمية.') },
    ]);
    if (!valid) return;

    const previous = this.store.memo();
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
      length: this.length(),
      withPractice: this.withPractice(),
    };

    const res = await this.session.run(() => this.store.generateMemo(inputData));
    if (!res) {
      this.state.set(previous ? 'done' : 'idle');
      return;
    }

    if (res.ok) {
      this.session.keepUndo(previous ? { memo: previous } : null);
      this.session.succeed({ scrollTo: 'memo-main' });
      this.state.set('done');
      this.isSaved.set(false);
      this.savedMemoId.set(null);
      if (res.extractedText) this.extractedText.set(res.extractedText);
      this.cacheDraft();
    } else {
      this.errorMessage.set(res.error || 'Erreur lors de la génération.');
      this.session.fail(res.error);
      this.state.set('error');
    }
  }

  private cacheDraft() {
    void this.vault.saveAsset('madrasati_draft_memo', {
      memo: this.store.memo(),
      topic: this.topic(),
      grade: this.grade(),
      subject: this.subject(),
      trimester: this.trimester(),
      extractedText: this.extractedText(),
    });
    this.scheduleAutoSave();
  }

  /** Every change is kept: on this device always, and in the account (private) when signed in. */
  private scheduleAutoSave() {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaved.set(false);
    if (!this.store.isSignedIn()) return;
    this.autoSaveTimer = setTimeout(() => void this.autoSave(), 1500);
  }

  private async autoSave() {
    const memo = this.store.memo();
    if (!memo) return;
    this.autoSaving.set(true);
    const saved = await this.store.saveMemo({ ...this.savePayload(memo), id: this.savedMemoId() ?? undefined, published: false });
    this.autoSaving.set(false);
    if (saved?.id && this.store.memo() === memo) {
      this.savedMemoId.set(saved.id);
      this.autoSaved.set(true);
    }
  }

  private savePayload(memo: MemoDoc) {
    const userProfile = this.firebase.userProfile();
    return {
      memoDoc: memo,
      authorName: userProfile?.displayName || 'Enseignant Madrasati',
      authorRole: 'teacher' as const,
      school: userProfile?.school || 'المدرسة الابتدائية التونسية',
    };
  }

  async regenerateSection(index: number) {
    if (this.busySection()) return;
    this.busySection.set(index + 1);
    const res = await this.store.regenerateMemoSection(index, this.instructions() || undefined);
    this.busySection.set(0);
    if (res.ok) {
      this.cacheDraft();
    } else {
      this.store.showToast(res.error || this.lang.tr('Échec de la réécriture', 'تعذّرت إعادة الكتابة'), 'error');
    }
  }

  /** Pictures are uploaded to the teacher's storage, so adding one needs an account. */
  pickPicture(index: number) {
    this.store.requireAccount(() => {
      this.pictureTarget = index;
      this.pictureInput()?.nativeElement.click();
    });
  }

  /** FLUX only (no Gemini): draws the section's picture idea, then keeps it as WebP in the teacher's uploads. */
  generatePicture(index: number) {
    this.store.requireAccount(() => void this.drawPicture(index));
  }

  private async drawPicture(index: number) {
    const doc = this.store.memo();
    if (!doc || this.busyPicture()) return;
    const sections = summarySections(doc);
    const section = sections[index];
    if (!section || sections.filter((s) => s.imageUrl).length >= SUMMARY_MAX_IMAGES) return;
    // Written picture idea when the model gave one; otherwise the section itself (the server turns it into an English scene).
    const raw = !!section.imagePrompt;
    const prompt = section.imagePrompt || [doc.topic, section.heading, section.text, ...(section.items ?? [])].filter(Boolean).join('. ').slice(0, 600);
    this.busyPicture.set(index + 1);
    const res = await this.store.generateFluxPicture(prompt, doc, raw);
    const url = res ? await this.uploadWebp(res) : null;
    this.busyPicture.set(0);
    if (!url || this.store.memo() !== doc) {
      if (!url) this.store.showToast(this.lang.tr('Image indisponible pour le moment', 'تعذّر توليد الصورة حاليًا'), 'error');
      return;
    }
    this.store.setMemoSections(sections.map((s, i) => (i === index ? { ...s, imageUrl: url } : s)));
    this.cacheDraft();
  }

  async onPictureSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    const doc = this.store.memo();
    if (!f || !doc || this.pictureTarget < 0) return;
    const sections = summarySections(doc);
    if (sections.filter((s) => s.imageUrl).length >= SUMMARY_MAX_IMAGES) return;
    const url = await this.uploadWebp(f);
    if (!url) {
      this.store.showToast(this.lang.tr('Échec de l’envoi de l’image', 'تعذّر رفع الصورة'), 'error');
      return;
    }
    this.store.setMemoSections(sections.map((s, i) => (i === this.pictureTarget ? { ...s, imageUrl: url } : s)));
    this.cacheDraft();
  }

  resizePicture(index: number, width: number) {
    const doc = this.store.memo();
    if (!doc) return;
    this.store.setMemoSections(summarySections(doc).map((s, i) => (i === index ? { ...s, imageWidth: width } : s)));
    this.cacheDraft();
  }

  removePicture(index: number) {
    const doc = this.store.memo();
    if (!doc) return;
    this.store.setMemoSections(summarySections(doc).map((s, i) => (i === index ? { ...s, imageUrl: undefined } : s)));
    this.cacheDraft();
  }

  /** Re-encodes to WebP (max 1600 px) and stores it under the teacher's uploads. */
  private async uploadWebp(file: Blob): Promise<string | null> {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: await this.firebase.getAuthHeaders(),
        body: JSON.stringify({
          kind: 'courses',
          fileName: `revision_${Date.now()}.webp`,
          fileBase64: canvas.toDataURL('image/webp', 0.85),
          mimeType: 'image/webp',
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return (data.url as string) || null;
    } catch {
      return null;
    }
  }

  async regenerateWithExtractedText() {
    this.text.set(this.extractedText());
    this.activeTab.set('text');
    await this.generateMemo();
  }
}

interface MemoDraft {
  tab: 'topic' | 'text' | 'photo' | 'file' | 'library';
  topic: string;
  topicId: string | null;
  text: string;
  grade: string;
  subject: string;
  trimester: string;
  language: 'ar' | 'fr';
  instructions: string;
  length?: SummaryLength;
  withPractice?: boolean;
  images: { base64Data: string; contentType: string }[];
  file: { base64Data: string; contentType: string; filename: string } | null;
  resourceUrl: string;
}
