import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EducationStore, LanguageService, Scene } from '@core';
import { SeriesPanelComponent } from '@shared';

@Component({
  selector: 'app-series-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SeriesPanelComponent],
  template: `
    <div class="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      <div class="flex items-center justify-between gap-3 print:hidden">
        <a
          routerLink="/create"
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B6B60] hover:text-[#14251D] bg-white border border-[#E7DFCF] px-3.5 min-h-11 rounded-xl transition-colors cursor-pointer">
          <span class="material-icons text-sm rtl:rotate-180" aria-hidden="true">arrow_back</span>
          <span>{{ lang.tr('Retour au studio', 'العودة لمركز الإنشاء') }}</span>
        </a>

        @if (series() && approved()) {
          <button
            type="button"
            (click)="printAll()"
            class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-4 min-h-11 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer">
            <span class="material-icons text-sm" aria-hidden="true">print</span>
            <span>{{ lang.tr('Imprimer toute la série (A4)', 'طباعة كامل السلسلة (A4)') }}</span>
          </button>
        }
      </div>

      @if (series(); as s) {
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
  `,
})
export class SeriesViewerComponent implements OnInit {
  readonly lang = inject(LanguageService);
  readonly store = inject(EducationStore);
  private readonly route = inject(ActivatedRoute);

  readonly series = this.store.currentSeries;
  readonly activeSceneIndex = signal<number>(0);
  readonly loading = signal<boolean>(true);
  readonly busy = signal<boolean>(false);
  readonly progressLabel = signal<string>('');
  readonly error = signal<string | null>(null);

  /** The plan is approved once at least one panel has been written. */
  readonly approved = computed(() => !!this.series()?.scenes.some((s) => s.status === 'ready'));

  readonly currentScene = computed<Scene | null>(() => this.series()?.scenes[this.activeSceneIndex()] ?? null);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const current = this.store.currentSeries();
    if (id && current?.id !== id) {
      await this.store.getSeries(id);
    }
    this.loading.set(false);
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
    if (doc && doc.id === seriesId) await this.store.saveSeries({ doc });
  }

  printAll() {
    if (typeof window !== 'undefined') window.print();
  }
}
