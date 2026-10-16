import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { createStudioSession, DRAFT_DOC_ID, EducationStore, InfographicDoc, LanguageService, SourceInput } from '@core';
import { InfographicPageComponent, SourceInputComponent, STUDIO_BAR_BTN, StudioBarComponent, StudioSessionBannerComponent } from '@shared';

@Component({
  selector: 'app-lesson-plan-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, InfographicPageComponent, SourceInputComponent, StudioBarComponent, StudioSessionBannerComponent],
  template: `
    <div class="w-full pb-16 space-y-5">
      <app-studio-bar
        [badge]="lang.tr('Fiche pédagogique', 'جذاذة بيداغوجية')"
        icon="view_timeline"
        [heading]="doc()?.title || lang.tr('Nouvelle fiche pédagogique', 'جذاذة بيداغوجية جديدة')"
        [details]="[doc()?.grade ? lang.translateGrade(doc()?.grade ?? '') : '', doc()?.subject ? lang.translateSubject(doc()?.subject ?? '') : '']"
        [status]="session.status()"
        [busy]="session.busy()"
        [showSettings]="!isNew()"
        [settingsOpen]="panelOpen()"
        (settingsToggle)="settingsOpen.set(!settingsOpen())">
        @if (doc() && !doc()?.id) {
          <button type="button" (click)="saveDraft()" [class]="barBtn">
            <span class="material-icons text-base" aria-hidden="true">save</span>
            {{ lang.tr('Enregistrer et partager', 'حفظ ومشاركة') }}
          </button>
        }
        @if (!isNew()) {
          <a routerLink="/lesson-plan/new" [class]="barBtn">
            <span class="material-icons text-base" aria-hidden="true">add_circle_outline</span>
            {{ lang.tr('Nouvelle fiche', 'جذاذة جديدة') }}
          </a>
        }
      </app-studio-bar>

      <app-studio-session-banner [session]="session" />

      <div [class]="panelOpen() ? 'grid grid-cols-1 lg:grid-cols-[400px_minmax(0,1fr)] gap-6 items-start' : ''">
        @if (panelOpen()) {
          <aside id="studio-settings" class="no-print space-y-4 lg:sticky lg:top-4">
            <div class="px-1">
              <h2 class="font-display font-semibold text-lg text-[#14251D]">{{ lang.tr('Contenu de la fiche', 'محتوى الجذاذة') }}</h2>
              <p class="text-sm text-[#5B6B60] mt-1">{{ lang.tr('Indiquez la leçon, le niveau et la matière, puis lancez la génération.', 'حدّد الدرس والمستوى والمادة، ثم ابدأ التوليد.') }}</p>
            </div>
            <app-source-input
              [initialInput]="prefill()"
              [busy]="session.busy()"
              [submitLabel]="lang.tr('Générer', 'توليد')"
              (draftChange)="session.saveDraft($event)"
              (submitSource)="generate($event)"></app-source-input>
          </aside>
        }
        <div id="lesson-plan-sheet" class="min-w-0 space-y-6 scroll-mt-4">
          @if (isNew()) {
            <!-- Blank official sheet: the page is the editor from the first second -->
            <app-infographic-page [doc]="blankDoc()" [toolbar]="false"></app-infographic-page>
          } @else if (doc(); as currentDoc) {
            <app-infographic-page [doc]="currentDoc"></app-infographic-page>
          } @else if (loading()) {
            <div class="bg-white rounded-[24px] border border-[#E7DFCF] p-16 text-center space-y-3">
              <span class="material-icons text-4xl text-[#2D6A4F] animate-spin">sync</span>
              <p class="font-display font-semibold text-[#14251D] text-sm">
                {{ lang.tr('Chargement de la fiche pédagogique…', 'جارٍ تحميل الجذاذة البيداغوجية…') }}
              </p>
            </div>
          } @else {
            <div class="bg-white rounded-[24px] border border-[#E7DFCF] p-12 text-center space-y-3">
              <span class="material-icons text-4xl text-[#BF5B34]">error_outline</span>
              <p class="font-display font-semibold text-[#14251D] text-sm">
                {{ lang.tr('Fiche introuvable ou supprimée.', 'الجذاذة غير موجودة أو تم حذفها.') }}
              </p>
            </div>
          }
        </div>
      </div>

    </div>
  `,
})
export class LessonPlanViewerComponent implements OnInit {
  readonly lang = inject(LanguageService);
  readonly store = inject(EducationStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly doc = signal<InfographicDoc | null>(null);
  readonly loading = signal<boolean>(true);

  /** /lesson-plan/new: the form lives on this page; nothing is generated until the teacher submits. */
  readonly isNew = signal(false);
  readonly prefill = signal<SourceInput | null>(null);
  private lastSource: SourceInput | null = null;

  readonly session = createStudioSession<SourceInput>('lesson-plan', {
    restore: (draft) => this.prefill.set(draft),
    retry: () => this.retry(),
    undo: (previous) => this.showPlan(previous as InfographicDoc),
  });

  readonly barBtn = STUDIO_BAR_BTN;
  /** Settings panel: always open for a new sheet, toggled from the studio bar otherwise. */
  readonly settingsOpen = signal(false);
  readonly panelOpen = computed(() => this.isNew() || this.settingsOpen());

  /** Empty official sheet shown before the first generation, labelled with the chosen level and subject. */
  readonly blankDoc = computed<InfographicDoc>(() => {
    const pre = this.prefill();
    const fr = pre?.language === 'fr';
    return {
      id: '',
      templateId: 'lesson-plan-official',
      title: pre?.topic || (fr ? 'Titre de la leçon' : 'عنوان الدرس'),
      grade: pre?.grade ?? '',
      subject: pre?.subject ?? '',
      language: fr ? 'fr' : 'ar',
      values: {
        grade: pre?.grade, subject: pre?.subject, topic: pre?.topic,
        objectives: [], outcomes: [], materials: [], stages: [], assessmentCriteria: [],
        supportActivities: [], enrichmentActivities: [], crossSubjectIntegration: [],
        targetValues: [], homework: [], reflectionQuestions: [],
      },
    };
  });

  ngOnInit() {
    // Same component for /lesson-plan/new → /lesson-plan/:id, so follow the param, not the snapshot.
    this.route.paramMap.subscribe((params) => void this.load(params.get('id')));
  }

  private async load(id: string | null) {
    this.isNew.set(id === 'new');
    this.settingsOpen.set(false);
    if (id === 'new') {
      this.doc.set(null);
      this.prefill.set(this.store.consumePrefill());
      this.loading.set(false);
      return;
    }
    const current = this.store.currentLessonPlan();
    if (id === DRAFT_DOC_ID) {
      this.doc.set(current && !current.id ? current : null);
    } else if (id) {
      this.doc.set(current?.id === id ? current : await this.store.getLessonPlan(id));
    } else {
      this.doc.set(this.store.currentLessonPlan());
    }
    this.prefill.set(this.sourceFromDoc(this.doc()));
    this.loading.set(false);
  }

  /** Regenerating from an open sheet starts from its own lesson, level and subject. */
  private sourceFromDoc(d: InfographicDoc | null): SourceInput | null {
    if (!d) return null;
    return { mode: 'topic', topic: d.title, grade: d.grade, subject: d.subject, language: d.language === 'fr' ? 'fr' : 'ar' };
  }

  async generate(source: SourceInput) {
    this.lastSource = source;
    const previous = this.doc();
    const res = await this.session.run(() => this.store.generateLessonPlan(source));
    if (!res) return;
    if (!res.ok || !res.docId) {
      this.session.fail(res.error || this.lang.tr('Erreur lors de la génération de la fiche', 'تعذّر توليد الجذاذة'));
      return;
    }
    this.session.keepUndo(previous);
    // Signed-in teachers get the sheet saved to their account; a guest's stays a local draft.
    if (res.docId !== DRAFT_DOC_ID) void this.session.clearDraft();
    this.session.succeed({ scrollTo: 'lesson-plan-sheet' });
    void this.router.navigate(['/lesson-plan', res.docId]);
  }

  retry() {
    const source = this.lastSource ?? this.session.draft();
    if (!source) return;
    this.session.dismissDraft();
    this.prefill.set(source);
    void this.generate(source);
  }

  private showPlan(d: InfographicDoc) {
    this.store.currentLessonPlan.set(d);
    this.doc.set(d);
    void this.router.navigate(['/lesson-plan', d.id || DRAFT_DOC_ID]);
  }

  /** A guest's lesson plan is a local draft until saved; signup resumes the save. */
  saveDraft() {
    this.store.requireAccount(async () => {
      const id = await this.store.saveCurrentLessonPlan();
      if (id) {
        this.doc.set(this.store.currentLessonPlan());
        void this.session.clearDraft();
        void this.router.navigate(['/lesson-plan', id], { replaceUrl: true });
        this.store.showToast(this.lang.tr('Fiche enregistrée', 'تم حفظ الجذاذة'), 'success');
      } else {
        this.store.showToast(this.lang.tr('Échec de l’enregistrement', 'تعذّر الحفظ'), 'error');
      }
    });
  }
}
