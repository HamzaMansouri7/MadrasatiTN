import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EducationStore, LanguageService, TeacherProfile } from '@core';

/**
 * Dedicated teacher directory — people, kept separate from the content
 * library (courses/exercises live on /discovery). Public, no login required.
 */
@Component({
  selector: 'app-teachers-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-[#F4F6F5] py-6 px-4 sm:px-6 lg:px-8">
      <div class="max-w-6xl mx-auto space-y-6">

        <!-- Header band -->
        <header class="bg-[#14251D] text-[#FBF8F1] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="material-icons text-[#9DBBA8]">verified</span>
              <h1 class="font-display font-bold text-xl sm:text-2xl">{{ lang.tr('Annuaire des Enseignants', 'دليل المعلمين') }}</h1>
            </div>
            <p class="text-xs sm:text-sm text-[#B7C7BC] max-w-[60ch]">
              {{ lang.tr('Les enseignants certifiés qui partagent leurs ressources sur Madrasati TN.', 'المعلمون المعتمدون الذين يشاركون مواردهم على منصة مدرستي.') }}
            </p>
          </div>
          <a routerLink="/discovery"
             class="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-semibold shrink-0 transition-colors">
            <span class="material-icons text-sm">menu_book</span>
            <span>{{ lang.tr('Voir la bibliothèque', 'تصفح المكتبة') }}</span>
          </a>
        </header>

        @if (store.teachers().length === 0) {
          <div class="bg-white rounded-2xl border border-[#E7DFCF] p-12 text-center space-y-2">
            <span class="material-icons text-4xl text-[#9DBBA8]" aria-hidden="true">school</span>
            <p class="text-sm text-[#5B6B60]">
              {{ lang.tr('Les enseignants inscrits apparaîtront ici après leur prochaine connexion.', 'سيظهر المعلمون المسجّلون هنا بعد تسجيل دخولهم القادم.') }}
            </p>
          </div>
        } @else {
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (t of store.teachers(); track t.id) {
              <div class="bg-white rounded-2xl p-6 border border-[#E7DFCF] shadow-xs space-y-4 text-center hover:shadow-[0_18px_45px_-30px_rgba(20,38,29,0.5)] transition-shadow">
                <div class="relative inline-block mx-auto">
                  <img [src]="t.avatarUrl" [alt]="t.name" class="w-20 h-20 rounded-full object-cover border-2 border-[#2D6A4F] shadow-xs" />
                  @if (t.verifiedBadge) {
                    <span class="material-icons absolute bottom-0 right-0 bg-[#1B4332] text-[#FBF8F1] rounded-full text-base p-0.5 border-2 border-white" [title]="lang.tr('Enseignant Certifié Éducation Nationale', 'مربٍ معتمد لدى وزارة التربية')">
                      verified
                    </span>
                  }
                </div>

                <div>
                  <h3 class="font-display font-semibold text-[#14251D] text-base flex items-center justify-center gap-1.5">
                    {{ t.name }}
                    <span class="text-[#1B4332] font-semibold bg-[#F2ECDE] border border-[#E7DFCF] px-1.5 py-0.5 rounded text-[10px]">TN</span>
                  </h3>
                  <p class="text-xs text-[#5B6B60] font-medium">{{ t.title }}</p>
                  <p class="text-[11px] text-[#2D6A4F] font-semibold mt-0.5">{{ t.school }}</p>
                </div>

                <p class="text-xs text-[#4A5A50] line-clamp-3 bg-[#FBF8F1] p-3 rounded-xl border border-[#E7DFCF]">
                  "{{ t.bio }}"
                </p>

                <div class="grid grid-cols-3 gap-2 py-2 border-y border-[#E7DFCF] text-xs">
                  <div>
                    <p class="font-display font-semibold text-[#14251D]">{{ t.totalUploads || t.coursesCount }}</p>
                    <p class="text-[10px] text-[#6B7A70]">{{ lang.tr('Documents', 'وثائق') }}</p>
                  </div>
                  <div>
                    <p class="font-display font-semibold text-[#14251D]">{{ t.downloadableExercisesCount || t.exercisesCount }}</p>
                    <p class="text-[10px] text-[#6B7A70]">{{ lang.tr('Exercices PDF', 'تمارين PDF') }}</p>
                  </div>
                  <div>
                    <p class="font-display font-semibold text-[#8A5A00]">⭐ {{ t.rating }}</p>
                    <p class="text-[10px] text-[#6B7A70]">{{ t.reviewsCount }} {{ lang.tr('avis', 'تقييم') }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    (click)="store.toggleWatchlist(t.id, 'teacher')"
                    [class]="store.isWatched(t.id, 'teacher') ? 'bg-[#F2ECDE] text-[#8A5A00] border-[#8A5A00]/40' : 'bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] border-[#E7DFCF]'"
                    class="px-3 py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    [title]="store.isWatched(t.id, 'teacher') ? 'Ne plus suivre' : 'Suivre cet enseignant'">
                    <span class="material-icons text-sm">{{ store.isWatched(t.id, 'teacher') ? 'bookmark' : 'bookmark_border' }}</span>
                    <span>{{ store.isWatched(t.id, 'teacher') ? lang.tr('Suivi', 'متابع') : lang.tr('Suivre', 'متابعة') }}</span>
                  </button>

                  <button
                    (click)="selectedTeacher.set(t)"
                    class="flex-1 bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-xs py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-colors shadow-xs">
                    <span class="material-icons text-sm">badge</span>
                    {{ lang.tr('Profil & Avis', 'عرض الملف والتقييمات') }}
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>

    <!-- Profile modal -->
    @if (selectedTeacher(); as t) {
      <div class="fixed inset-0 z-50 bg-[#14251D]/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-[#FBF8F1] rounded-2xl max-w-lg w-full p-6 space-y-5 border border-[#E7DFCF] shadow-xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#E7DFCF] pb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-[#1B4332] text-xl">verified</span>
              <h3 class="font-display font-semibold text-[#14251D] text-base">
                {{ lang.tr('Profil de Crédibilité Enseignant', 'الملف المهني والاعتماد التربوي') }}
              </h3>
            </div>
            <button (click)="selectedTeacher.set(null)" class="text-[#6B7A70] hover:text-[#14251D] cursor-pointer">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="text-center space-y-3">
            <img [src]="t.avatarUrl" [alt]="t.name" class="w-24 h-24 rounded-full object-cover border-2 border-[#2D6A4F] mx-auto shadow-xs" />
            <div>
              <h3 class="font-display font-semibold text-[#14251D] text-lg flex items-center justify-center gap-1">
                {{ t.name }}
                <span class="material-icons text-[#1B4332] text-base">verified</span>
              </h3>
              <p class="text-xs text-[#2D6A4F] font-semibold">{{ t.title }}</p>
              <p class="text-[11px] text-[#6B7A70]">{{ t.school }}</p>
            </div>

            <div class="grid grid-cols-3 gap-2 bg-[#F2ECDE] p-3 rounded-xl border border-[#E7DFCF] text-xs">
              <div>
                <p class="font-display font-semibold text-[#14251D] text-base">{{ t.totalUploads || t.coursesCount }}</p>
                <p class="text-[10px] text-[#5B6B60] font-medium">{{ lang.tr('Documents importés', 'وثائق مرفوعة') }}</p>
              </div>
              <div>
                <p class="font-display font-semibold text-[#14251D] text-base">{{ t.downloadableExercisesCount || t.exercisesCount }}</p>
                <p class="text-[10px] text-[#5B6B60] font-medium">{{ lang.tr('Exercices Validés', 'تمارين معتمدة') }}</p>
              </div>
              <div>
                <p class="font-display font-semibold text-[#8A5A00] text-base">⭐ {{ t.rating }}</p>
                <p class="text-[10px] text-[#8A5A00] font-medium">{{ t.reviewsCount }} {{ lang.tr('avis parents', 'تقييم ولي') }}</p>
              </div>
            </div>

            <p class="text-xs text-[#4A5A50] bg-white p-3 rounded-xl border border-[#E7DFCF] leading-relaxed text-start">
              "{{ t.bio }}"
            </p>

            <div class="flex gap-2">
              <button
                (click)="store.toggleWatchlist(t.id, 'teacher')"
                [class]="store.isWatched(t.id, 'teacher') ? 'bg-[#F2ECDE] text-[#8A5A00] border border-[#8A5A00]/40' : 'bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1]'"
                class="flex-1 font-semibold py-2.5 rounded-xl text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                <span class="material-icons text-sm">{{ store.isWatched(t.id, 'teacher') ? 'bookmark' : 'bookmark_border' }}</span>
                {{ store.isWatched(t.id, 'teacher') ? lang.tr('Suivi', 'متابع') : lang.tr('Suivre cet enseignant', 'متابعة هذا المعلم') }}
              </button>
              <button (click)="selectedTeacher.set(null)" class="flex-1 bg-[#14251D] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold py-2.5 rounded-xl text-xs cursor-pointer transition-colors">
                {{ lang.tr('Fermer le profil', 'إغلاق الملف') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class TeachersHomeComponent implements OnInit {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  readonly selectedTeacher = signal<TeacherProfile | null>(null);

  ngOnInit() {
    // Fresh read on mount — the store's startup fetch runs before auth, so a
    // teacher card written at login may not be in the initial snapshot.
    void this.store.loadTeachers();
  }
}
