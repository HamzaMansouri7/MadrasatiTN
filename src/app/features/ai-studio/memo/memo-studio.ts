import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  inject,
  OnInit,
  untracked,
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
import { MemoDoc, MemoInput, SummaryLength, SummarySection } from '@core/models/memo.model';
import { SUMMARY_MAX_IMAGES, summarySections } from '@core/utils/summary.util';
import { SourceCardComponent, SourceFormState, sourceChecks } from '@shared/components/source-card';
import { StudioSessionBannerComponent } from '@shared/components/studio-session-banner';
import { SummaryDocumentComponent } from './summary-document';

/** Everything the section says, flattened for the server's English scene rewrite. */
function sectionPictureText(topic: string, s: SummarySection): string {
  return [
    topic,
    s.heading,
    s.text,
    ...(s.items ?? []),
    ...(s.steps ?? []).map((st) => `${st.heading}: ${st.body}`),
    s.solution,
    ...(s.table?.rows ?? []).map((r) => [r.label, ...r.cells].join(' ')),
    ...(s.timeline ?? []).map((t) => `${t.title}: ${t.description}`),
    ...(s.exercises ?? []).map((e) => e.question),
  ]
    .filter(Boolean)
    .join('. ')
    .slice(0, 600);
}

type SourceTab = 'topic' | 'text' | 'photo' | 'file' | 'library';
type MemoPanel = 'source' | 'settings' | 'options';

@Component({
  selector: 'app-memo-studio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SourceCardComponent,
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
            <app-source-card [state]="sourceState" [grade]="grade()" [subject]="subject()" [trimester]="trimester()" [errors]="session" />

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
  readonly text = signal<string>('');
  readonly grade = signal<string>('6ème Année');
  readonly subject = signal<string>('Français');
  readonly trimester = signal<string>('Trimestre 1');
  readonly language = signal<'ar' | 'fr'>('fr');
  readonly instructions = signal<string>('');

  readonly images = signal<{ base64Data: string; contentType: string }[]>([]);
  readonly file = signal<{ base64Data: string; contentType: string; filename: string } | null>(null);
  readonly resourceUrl = signal<string>('');
  readonly extractedText = signal<string>('');
  /** The source card edits these same signals. */
  readonly sourceState: SourceFormState = {
    tab: this.activeTab,
    topic: this.topic,
    topicId: this.topicId,
    text: this.text,
    images: this.images,
    file: this.file,
    resourceUrl: this.resourceUrl,
    instructions: this.instructions,
  };

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

  constructor() {
    // The document language follows the subject: French lesson -> French document, other subjects -> Arabic.
    // Still changeable by hand afterwards (only a subject change resets it).
    effect(() => {
      const subject = this.subject();
      untracked(() => {
        if (subject === 'Français') this.language.set('fr');
        else if (subject !== 'Anglais') this.language.set('ar');
      });
    });
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

  async generateMemo() {
    if (this.session.busy()) return;
    const t = (fr: string, ar: string) => this.lang.tr(fr, ar);
    const valid = this.session.validate(sourceChecks(this.sourceState, t));
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
      topicId: this.topicId() ?? undefined,
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
    const prompt = section.imagePrompt || sectionPictureText(doc.topic, section);
    this.busyPicture.set(index + 1);
    const res = await this.store.generateFluxPicture(prompt, doc, raw);
    const url = 'blob' in res ? await this.uploadWebp(res.blob) : null;
    this.busyPicture.set(0);
    if (!url) {
      this.store.showToast('error' in res ? res.error : this.uploadError, 'error');
      return;
    }
    if (this.store.memo() !== doc) return;
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
      this.store.showToast(this.uploadError, 'error');
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
      const data = await res.json().catch(() => null);
      if (res.ok && data?.url) return data.url as string;
      this.uploadError = this.uploadErrorMessage(res.status, data?.error);
      return null;
    } catch {
      this.uploadError = this.uploadErrorMessage(0);
      return null;
    }
  }

  /** Last upload failure, in words the teacher can act on. */
  private uploadError = '';

  private uploadErrorMessage(status: number, serverMessage?: string): string {
    const t = (fr: string, ar: string) => this.lang.tr(fr, ar);
    if (status === 0 || status === 502 || status === 503 || status === 504 || (status === 500 && !serverMessage)) {
      return t('Serveur indisponible pour le moment. Réessayez dans un instant.', 'الخادم غير متاح حاليًا. أعد المحاولة بعد قليل.');
    }
    if (status === 401) return t('Connectez-vous pour ajouter une image.', 'سجّل الدخول لإضافة صورة.');
    if (status === 413) return t('Image trop lourde. Choisissez une image plus petite.', 'الصورة كبيرة جدًا. اختر صورة أصغر.');
    if (status === 429) return t('Trop d’envois. Réessayez dans une minute.', 'محاولات كثيرة. أعد المحاولة بعد دقيقة.');
    return serverMessage || t('Échec de l’envoi de l’image.', 'تعذّر رفع الصورة.');
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
