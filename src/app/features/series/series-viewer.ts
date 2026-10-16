import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DRAFT_DOC_ID, EducationStore, LanguageService, Scene, SourceInput } from '@core';
import { AiStatusComponent, SeriesPanelComponent, SourceInputComponent, STUDIO_BAR_BTN, StudioBarComponent } from '@shared';

@Component({
  selector: 'app-series-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SeriesPanelComponent, SourceInputComponent, AiStatusComponent, StudioBarComponent],
  template: `
    <div class="w-full pb-16 space-y-5">
      <app-studio-bar
        [badge]="lang.tr('Série illustrée', 'سلسلة مصورة')"
        icon="auto_stories"
        [heading]="(!isNew() && series()?.title) || lang.tr('Nouvelle série illustrée', 'سلسلة مصورة جديدة')"
        [details]="isNew() ? [] : [series()?.grade ? lang.translateGrade(series()?.grade ?? '') : '', series()?.subject ? lang.translateSubject(series()?.subject ?? '') : '']"
        [status]="generating() || busy() ? lang.tr('Génération en cours', 'جارٍ التوليد') : ''"
        [busy]="generating() || busy()"
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
          <button type="button" (click)="printAll()" [class]="barBtn">
            <span class="material-icons text-base" aria-hidden="true">print</span>
            {{ lang.tr('Imprimer la série (A4)', 'طباعة السلسلة (A4)') }}
          </button>
        }
        @if (!isNew()) {
          <a routerLink="/series/new" [class]="barBtn">
            <span class="material-icons text-base" aria-hidden="true">add_circle_outline</span>
            {{ lang.tr('Nouvelle série', 'سلسلة جديدة') }}
          </a>
        }
      </app-studio-bar>

      <div [class]="panelOpen() ? 'grid grid-cols-1 lg:grid-cols-[400px_minmax(0,1fr)] gap-6 items-start' : ''">
        @if (panelOpen()) {
          <aside id="studio-settings" class="no-print space-y-4 lg:sticky lg:top-4">
            <div class="px-1">
              <h2 class="font-display font-semibold text-lg text-[#14251D]">{{ lang.tr('Contenu de la série', 'محتوى السلسلة') }}</h2>
              <p class="text-sm text-[#5B6B60] mt-1">{{ lang.tr('Collez le texte de la leçon ou choisissez le sujet : le scénario vous sera proposé avant toute planche.', 'ألصق نص الدرس أو اختر الموضوع: يُقترح عليك السيناريو قبل كتابة أي لوحة.') }}</p>
            </div>
            <app-source-input
              [initialInput]="prefill()"
              [busy]="generating()"
              [submitLabel]="lang.tr('Générer', 'توليد')"
              (submitSource)="generate($event)"></app-source-input>
            <app-ai-status [loading]="generating()" [error]="genError()" (retry)="retry()"></app-ai-status>
          </aside>
        }
        <div class="min-w-0 space-y-6">
          @if (isNew()) {
            <!-- Empty storyboard: six numbered A4 panels, filled once the scenario is approved -->
            <div class="no-print grid grid-cols-2 sm:grid-cols-3 gap-4">
              @for (n of blankPanels; track n) {
                <div class="aspect-[210/297] bg-white rounded-2xl border border-dashed border-[#E7DFCF] flex flex-col items-center justify-center gap-2 text-[#B7C7BC]">
                  <span class="font-display font-semibold text-2xl">{{ n }}</span>
                  <span class="text-xs text-[#6B7A70]">{{ lang.tr('Planche A4', 'لوحة A4') }}</span>
                </div>
              }
            </div>
          } @else if (series(); as s) {
            @if (!approved()) {
              <!-- Scene table: the teacher approves the plan before any panel is written -->
              <section class="bg-white rounded-[28px] border border-[#E7DFCF] p-5 sm:p-8 space-y-5 print:hidden" [attr.dir]="s.language === 'ar' ? 'rtl' : 'ltr'">
                <div class="space-y-1">
                  <h1 class="font-display font-semibold text-xl text-[#14251D]">{{ s.title }}</h1>
                  <p class="text-sm text-[#5B6B60]">
                    {{ lang.tr('Vérifiez le scénario : une planche A4 par ligne. Rien n’est écrit tant que vous n’approuvez pas.', 'راجع السيناريو: لوحة A4 لكل سطر. لن يُكتب شيء قبل موافقتك.') }}
                  </p>
                </div>

                <div class="overflow-x-auto rounded-2xl border border-[#E7DFCF]">
                  <table class="w-full text-sm">
                    <thead class="bg-[#FBF8F1] text-xs text-[#5B6B60]">
                      <tr>
                        <th scope="col" class="p-3 text-start font-semibold w-12">#</th>
                        <th scope="col" class="p-3 text-start font-semibold">{{ lang.tr('Titre', 'العنوان') }}</th>
                        <th scope="col" class="p-3 text-start font-semibold">{{ lang.tr('Événement', 'الحدث') }}</th>
                        <th scope="col" class="p-3 text-start font-semibold w-24">{{ lang.tr('Date', 'التاريخ') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (sc of s.scenes; track sc.n) {
                        <tr class="border-t border-[#E7DFCF] align-top">
                          <td class="p-3 font-mono text-xs text-[#5B6B60]">{{ sc.n }}</td>
                          <td class="p-3 font-semibold text-[#14251D]">{{ sc.title }}</td>
                          <td class="p-3 text-[#14251D]">{{ sc.event }}</td>
                          <td class="p-3 font-mono text-xs text-[#8A5A00]">{{ sc.year || '—' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <div class="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    [disabled]="busy()"
                    (click)="generateAll()"
                    class="bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-60 text-[#FBF8F1] font-semibold px-5 min-h-11 rounded-xl text-sm flex items-center gap-2 transition-colors cursor-pointer">
                    <span class="material-icons text-base" [class.animate-spin]="busy()" aria-hidden="true">{{ busy() ? 'sync' : 'check' }}</span>
                    <span>{{ busy() ? progressLabel() : lang.tr('Approuver et générer les planches', 'الموافقة وإنشاء اللوحات') }}</span>
                  </button>
                  @if (error()) {
                    <p role="alert" class="text-sm text-[#BF5B34]">{{ error() }}</p>
                  }
                </div>
              </section>
            } @else {
              <!-- Panel navigation -->
              <nav class="bg-white rounded-[28px] border border-[#E7DFCF] p-4 space-y-3 print:hidden" [attr.dir]="s.language === 'ar' ? 'rtl' : 'ltr'" [attr.aria-label]="lang.tr('Planches', 'اللوحات')">
                <div class="flex items-center justify-between gap-3">
                  <h1 class="font-display font-semibold text-sm text-[#14251D]">{{ s.title }}</h1>
                  <span class="text-xs text-[#5B6B60] font-mono">{{ activeSceneIndex() + 1 }} / {{ s.scenes.length }}</span>
                </div>
                <div class="flex items-center gap-2 overflow-x-auto pb-1">
                  @for (sc of s.scenes; track sc.n; let idx = $index) {
                    <button
                      type="button"
                      (click)="activeSceneIndex.set(idx)"
                      [attr.aria-current]="activeSceneIndex() === idx ? 'true' : null"
                      [class]="activeSceneIndex() === idx
                        ? 'bg-[#14251D] text-[#FBF8F1] border-[#14251D]'
                        : 'bg-[#FBF8F1] text-[#5B6B60] border-[#E7DFCF] hover:bg-[#F2ECDE]'"
                      class="flex items-center gap-2 px-3 min-h-11 rounded-xl border text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors shrink-0">
                      <span class="font-mono">{{ sc.n }}</span>
                      <span>{{ sc.title }}</span>
                      @if (sc.status !== 'ready') {
                        <span class="w-1.5 h-1.5 rounded-full bg-[#BF5B34]" [attr.title]="lang.tr('À générer', 'لم تُنشأ بعد')"></span>
                      }
                    </button>
                  }
                </div>
              </nav>

              @if (currentScene(); as active) {
                <div class="flex flex-wrap items-center gap-2 print:hidden">
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

              <!-- All panels stay in the DOM so the whole series prints; only the active one shows on screen -->
              @for (sc of s.scenes; track sc.n; let idx = $index) {
                <div [class.hidden]="idx !== activeSceneIndex()" class="print:block">
                  <app-series-panel
                    [scene]="sc"
                    [seriesTitle]="s.title"
                    [bible]="s.bible"
                    [author]="s.author ?? null"
                    [docLang]="s.language"
                    [total]="s.scenes.length"></app-series-panel>
                </div>
              }

              <div class="flex items-center justify-between gap-3 print:hidden" [attr.dir]="s.language === 'ar' ? 'rtl' : 'ltr'">
                <button
                  type="button"
                  [disabled]="activeSceneIndex() === 0"
                  (click)="activeSceneIndex.set(activeSceneIndex() - 1)"
                  class="px-4 min-h-11 rounded-xl border border-[#E7DFCF] bg-white hover:bg-[#FBF8F1] disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                  <span class="material-icons text-sm rtl:rotate-180" aria-hidden="true">arrow_back</span>
                  <span>{{ lang.tr('Planche précédente', 'اللوحة السابقة') }}</span>
                </button>
                <button
                  type="button"
                  [disabled]="activeSceneIndex() >= s.scenes.length - 1"
                  (click)="activeSceneIndex.set(activeSceneIndex() + 1)"
                  class="px-4 min-h-11 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-40 text-[#FBF8F1] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                  <span>{{ lang.tr('Planche suivante', 'اللوحة التالية') }}</span>
                  <span class="material-icons text-sm rtl:rotate-180" aria-hidden="true">arrow_forward</span>
                </button>
              </div>
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

    </div>
  `,
})
export class SeriesViewerComponent implements OnInit {
  readonly lang = inject(LanguageService);
  readonly store = inject(EducationStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly series = this.store.currentSeries;
  readonly activeSceneIndex = signal<number>(0);
  readonly loading = signal<boolean>(true);
  readonly busy = signal<boolean>(false);
  readonly progressLabel = signal<string>('');
  readonly error = signal<string | null>(null);

  /** The plan is approved once at least one panel has been written. */
  readonly approved = computed(() => !!this.series()?.scenes.some((s) => s.status === 'ready'));

  readonly currentScene = computed<Scene | null>(() => this.series()?.scenes[this.activeSceneIndex()] ?? null);

  /** /series/new: the form lives on this page; nothing is generated until the teacher submits. */
  readonly isNew = signal(false);
  readonly prefill = signal<SourceInput | null>(null);
  readonly generating = signal(false);
  readonly genError = signal<string | null>(null);
  private lastSource: SourceInput | null = null;

  readonly barBtn = STUDIO_BAR_BTN;
  /** Settings panel: always open for a new series, toggled from the studio bar otherwise. */
  readonly settingsOpen = signal(false);
  readonly panelOpen = computed(() => this.isNew() || this.settingsOpen());
  readonly blankPanels = ['01', '02', '03', '04', '05', '06'];

  ngOnInit() {
    // Same component for /series/new → /series/:id, so follow the param, not the snapshot.
    this.route.paramMap.subscribe((params) => void this.load(params.get('id')));
  }

  private async load(id: string | null) {
    this.isNew.set(id === 'new');
    this.settingsOpen.set(false);
    if (id === 'new') {
      this.prefill.set(this.store.consumePrefill());
      this.loading.set(false);
      return;
    }
    const current = this.store.currentSeries();
    if (id && id !== DRAFT_DOC_ID && current?.id !== id) {
      await this.store.getSeries(id);
    }
    const s = this.store.currentSeries();
    this.prefill.set(s ? { mode: s.sourceText ? 'text' : 'topic', topic: s.title, text: s.sourceText, grade: s.grade, subject: s.subject, language: s.language === 'fr' ? 'fr' : 'ar' } : null);
    this.loading.set(false);
  }

  async generate(source: SourceInput) {
    if (this.generating()) return;
    this.lastSource = source;
    this.generating.set(true);
    this.genError.set(null);
    try {
      const res = await this.store.createSeriesFromSource(source);
      if (res.ok && res.docId) {
        void this.router.navigate(['/series', res.docId]);
      } else {
        this.genError.set(res.error || this.lang.tr('Erreur lors de la génération de la série', 'تعذّر توليد السلسلة'));
      }
    } finally {
      this.generating.set(false);
    }
  }

  retry() {
    if (this.lastSource) void this.generate(this.lastSource);
  }

  /** A guest's series is a local draft until saved; signup resumes the save. */
  saveDraft() {
    this.store.requireAccount(async () => {
      const id = await this.store.saveCurrentSeries();
      if (id) {
        void this.router.navigate(['/series', id], { replaceUrl: true });
        this.store.showToast(this.lang.tr('Série enregistrée', 'تم حفظ السلسلة'), 'success');
      } else {
        this.store.showToast(this.lang.tr('Échec de l’enregistrement', 'تعذّر الحفظ'), 'error');
      }
    });
  }

  /** Write every pending panel (text then illustration), one at a time, saving after each panel. */
  async generateAll() {
    const s = this.series();
    if (!s || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      for (const sc of s.scenes) {
        if (sc.status === 'ready') continue;
        this.progressLabel.set(this.lang.tr(`Planche ${sc.n} / ${s.scenes.length}…`, `اللوحة ${sc.n} / ${s.scenes.length}…`));
        const ok = await this.writePanel(s.id, sc.n, true);
        if (!ok) break;
      }
    } finally {
      this.busy.set(false);
    }
  }

  async regenerate(sceneNumber: number, part: 'text' | 'image') {
    const s = this.series();
    if (!s || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.progressLabel.set(this.lang.tr('Génération en cours…', 'جارٍ الإنشاء…'));
    try {
      if (part === 'text') {
        await this.writePanel(s.id, sceneNumber, false);
      } else {
        const img = await this.store.generateSeriesImage(s.id, sceneNumber);
        if (!img.ok) this.error.set(img.error ?? null);
        await this.persist(s.id);
      }
    } finally {
      this.busy.set(false);
    }
  }

  private async writePanel(seriesId: string, sceneNumber: number, withImage: boolean): Promise<boolean> {
    const text = await this.store.generateSeriesPanel(seriesId, sceneNumber);
    if (!text.ok) {
      this.error.set(text.error ?? null);
      return false;
    }
    if (withImage) {
      const img = await this.store.generateSeriesImage(seriesId, sceneNumber);
      // A missing illustration is not fatal: the panel keeps its text and can be retried alone.
      if (!img.ok) this.error.set(img.error ?? null);
    }
    await this.persist(seriesId);
    return true;
  }

  private async persist(seriesId: string) {
    const doc = this.store.currentSeries();
    // Unsaved guest drafts (no id) stay local until the save button stores them.
    if (doc && doc.id && doc.id === seriesId) await this.store.saveSeries({ doc });
  }

  printAll() {
    if (typeof window !== 'undefined') window.print();
  }
}
