import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EducationStore, InfographicDoc, LanguageService } from '@core';
import { InfographicPageComponent } from '@shared';

@Component({
  selector: 'app-lesson-plan-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, InfographicPageComponent],
  template: `
    <div class="max-w-5xl mx-auto py-6 px-3 sm:px-6 space-y-6">
      
      <!-- Back Navigation -->
      <div class="flex items-center justify-between gap-3 print:hidden">
        <a
          routerLink="/create"
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B6B60] hover:text-[#14251D] bg-white border border-[#E7DFCF] px-3.5 py-2 rounded-xl transition-colors cursor-pointer">
          <span class="material-icons text-sm rtl:rotate-180">arrow_back</span>
          <span>{{ lang.tr('Retour au studio', 'العودة لمركز الإنشاء') }}</span>
        </a>

        <div class="flex items-center gap-2">
          <a
            routerLink="/create"
            [queryParams]="{ output: 'lesson-plan' }"
            class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer">
            <span class="material-icons text-sm">add</span>
            <span>{{ lang.tr('Nouvelle fiche', 'إنشاء جذاذة جديدة') }}</span>
          </a>
        </div>
      </div>

      <!-- Loaded Doc View -->
      @if (doc(); as currentDoc) {
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
  `,
})
export class LessonPlanViewerComponent implements OnInit {
  readonly lang = inject(LanguageService);
  readonly store = inject(EducationStore);
  private readonly route = inject(ActivatedRoute);

  readonly doc = signal<InfographicDoc | null>(null);
  readonly loading = signal<boolean>(true);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const plan = await this.store.getLessonPlan(id);
      this.doc.set(plan);
    } else {
      this.doc.set(this.store.currentLessonPlan());
    }
    this.loading.set(false);
  }
}
