import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EducationStore, LanguageService, Scene, SeriesDoc } from '@core';
import { SeriesPanelComponent } from '@shared';

@Component({
  selector: 'app-series-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SeriesPanelComponent],
  template: `
    <div class="max-w-5xl mx-auto py-6 px-3 sm:px-6 space-y-6">
      
      <!-- Top Action Bar (Screen Only) -->
      <div class="flex items-center justify-between gap-3 print:hidden">
        <a
          routerLink="/create"
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B6B60] hover:text-[#14251D] bg-white border border-[#E7DFCF] px-3.5 py-2 rounded-xl transition-colors cursor-pointer">
          <span class="material-icons text-sm rtl:rotate-180">arrow_back</span>
          <span>{{ lang.tr('Retour au studio', 'العودة لمركز الإنشاء') }}</span>
        </a>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="printWholeSeries()"
            class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer">
            <span class="material-icons text-sm">print</span>
            <span>{{ lang.tr('Imprimer toute la série A4', 'طباعة كامل السلسلة A4') }}</span>
          </button>
        </div>
      </div>

      <!-- Loaded Series -->
      @if (series(); as s) {
        
        <!-- Timeline Navigation Strip across top (Right to Left) -->
        <div dir="rtl" class="bg-white rounded-[24px] border border-[#E7DFCF] p-4 space-y-3 print:hidden shadow-xs">
          <div class="flex items-center justify-between">
            <h3 class="font-display font-bold text-sm text-[#14251D]">{{ s.title }}</h3>
            <span class="text-xs text-[#5B6B60] font-mono">لوحة {{ activeSceneIndex() + 1 }} من {{ s.scenes.length }}</span>
          </div>

          <!-- Thumbnails Strip -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1">
            @for (sc of s.scenes; track sc.n; let idx = $index) {
              <button
                type="button"
                (click)="activeSceneIndex.set(idx)"
                [class]="activeSceneIndex() === idx
                  ? 'bg-[#14251D] text-[#FBF8F1] border-[#14251D] shadow-xs'
                  : 'bg-[#FBF8F1] text-[#5B6B60] border-[#E7DFCF] hover:bg-[#F2ECDE]'"
                class="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap cursor-pointer transition-all shrink-0">
                <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-white/20">
                  {{ sc.n }}
                </span>
                <span>{{ sc.title }}</span>
                @if (sc.year) {
                  <span class="text-[10px] opacity-75 font-mono">({{ sc.year }})</span>
                }
              </button>
            }
          </div>
        </div>

        <!-- Active Scene Panel -->
        @if (currentScene(); as activeScene) {
          <div class="space-y-4">
            <app-series-panel
              [scene]="activeScene"
              [seriesTitle]="s.title"
              [bible]="s.bible"
              [author]="s.author ?? null"></app-series-panel>

            <!-- Navigation Controls (Previous / Next - RTL) -->
            <div dir="rtl" class="flex items-center justify-between bg-white rounded-2xl border border-[#E7DFCF] p-3.5 print:hidden">
              <button
                type="button"
                [disabled]="activeSceneIndex() === 0"
                (click)="prevScene()"
                class="px-4 py-2 rounded-xl border border-[#E7DFCF] bg-[#FBF8F1] hover:bg-[#F2ECDE] disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                <span class="material-icons text-sm">arrow_forward</span>
                <span>{{ lang.tr('Planche précédente', 'اللوحة السابقة') }}</span>
              </button>

              <span class="font-mono text-xs text-[#5B6B60]">
                {{ activeSceneIndex() + 1 }} / {{ s.scenes.length }}
              </span>

              <button
                type="button"
                [disabled]="activeSceneIndex() >= s.scenes.length - 1"
                (click)="nextScene()"
                class="px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-40 text-[#FBF8F1] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm">
                <span>{{ lang.tr('Planche suivante', 'اللوحة التالية') }}</span>
                <span class="material-icons text-sm">arrow_back</span>
              </button>
            </div>
          </div>
        }

      } @else if (loading()) {
        <div class="bg-white rounded-[24px] border border-[#E7DFCF] p-16 text-center space-y-3">
          <span class="material-icons text-4xl text-[#BF5B34] animate-spin">sync</span>
          <p class="font-display font-semibold text-[#14251D] text-sm">
            {{ lang.tr('Chargement de la série historique…', 'جارٍ تحميل السلسلة التاريخية…') }}
          </p>
        </div>
      } @else {
        <div class="bg-white rounded-[24px] border border-[#E7DFCF] p-12 text-center space-y-3">
          <span class="material-icons text-4xl text-[#BF5B34]">error_outline</span>
          <p class="font-display font-semibold text-[#14251D] text-sm">
            {{ lang.tr('Série introuvable ou inexistante.', 'السلسلة غير موجودة أو تم حذفها.') }}
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

  readonly series = signal<SeriesDoc | null>(null);
  readonly activeSceneIndex = signal<number>(0);
  readonly loading = signal<boolean>(true);

  readonly currentScene = computed<Scene | null>(() => {
    const s = this.series();
    if (!s || !s.scenes.length) return null;
    return s.scenes[this.activeSceneIndex()] ?? null;
  });

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const s = await this.store.getSeries(id);
      this.series.set(s);
    }
    this.loading.set(false);
  }

  nextScene() {
    const s = this.series();
    if (s && this.activeSceneIndex() < s.scenes.length - 1) {
      this.activeSceneIndex.update((n) => n + 1);
    }
  }

  prevScene() {
    if (this.activeSceneIndex() > 0) {
      this.activeSceneIndex.update((n) => n - 1);
    }
  }

  printWholeSeries() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
