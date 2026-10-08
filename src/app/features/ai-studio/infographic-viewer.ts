import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EducationStore, InfographicDoc, LanguageService } from '@core';
import { InfographicSpecComponent } from '@shared';

@Component({
  selector: 'app-infographic-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, InfographicSpecComponent],
  template: `
    <div class="max-w-[900px] mx-auto py-6 px-3 sm:px-6 space-y-6">
      <div class="flex items-center justify-between gap-3 print:hidden">
        <a
          routerLink="/ai-studio"
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B6B60] hover:text-[#14251D] bg-white border border-[#E7DFCF] px-3.5 min-h-11 rounded-md transition-colors cursor-pointer">
          <span class="material-icons text-sm rtl:rotate-180" aria-hidden="true">arrow_back</span>
          <span>{{ lang.tr('Retour au studio', 'العودة إلى الاستوديو') }}</span>
        </a>
        @if (doc()) {
          <button
            type="button"
            (click)="print()"
            class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-5 min-h-11 rounded-md text-sm transition-colors cursor-pointer flex items-center gap-2">
            <span class="material-icons text-base" aria-hidden="true">print</span>
            {{ lang.tr('Imprimer A4', 'طباعة A4') }}
          </button>
        }
      </div>

      @if (doc(); as current) {
        <app-infographic-spec [doc]="current"></app-infographic-spec>
      } @else if (loading()) {
        <div class="bg-white rounded-lg border border-[#E7DFCF] p-16 text-center">
          <span class="material-icons text-4xl text-[#2D6A4F] animate-spin" aria-hidden="true">sync</span>
          <p class="font-display font-semibold text-sm mt-3">{{ lang.tr('Chargement…', 'جارٍ التحميل…') }}</p>
        </div>
      } @else {
        <div class="bg-white rounded-lg border border-[#E7DFCF] p-12 text-center">
          <span class="material-icons text-4xl text-[#BF5B34]" aria-hidden="true">error_outline</span>
          <p class="font-display font-semibold text-sm mt-3">
            {{ lang.tr('Infographie introuvable ou supprimée.', 'الإنفوغرافيك غير موجود أو تم حذفه.') }}
          </p>
        </div>
      }
    </div>
  `,
})
export class InfographicViewerComponent implements OnInit {
  readonly lang = inject(LanguageService);
  private readonly store = inject(EducationStore);
  private readonly route = inject(ActivatedRoute);

  readonly doc = signal<InfographicDoc | null>(null);
  readonly loading = signal(true);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.doc.set(await this.store.getInfographic(id));
    this.loading.set(false);
  }

  print() {
    if (typeof window !== 'undefined') window.print();
  }
}
