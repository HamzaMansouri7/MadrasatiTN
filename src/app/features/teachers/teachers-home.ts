import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EducationStore, LanguageService, TeacherProfile } from '@core';
import { TeacherAvatarComponent } from '@shared';

/**
 * Dedicated teacher directory — people, kept separate from the content
 * library (courses/exercises live on /discovery). Public, no login required.
 */
@Component({
  selector: 'app-teachers-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TeacherAvatarComponent],
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
              {{ lang.tr('Les enseignants certifiés qui partagent leurs ressources pédagogiques sur Madrasati TN.', 'المعلمون الذين يشاركون مواردهم البيداغوجية على منصة مدرستي.') }}
            </p>
          </div>
          <a routerLink="/discovery"
             class="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-semibold shrink-0 transition-colors">
            <span class="material-icons text-sm">menu_book</span>
            <span>{{ lang.tr('Voir la bibliothèque', 'تصفح المكتبة') }}</span>
          </a>
        </header>

        <!-- Search & Filter Controls -->
        <div class="bg-white rounded-2xl border border-[#E7DFCF] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <!-- Search input -->
          <div class="relative w-full sm:w-72">
            <span class="material-icons absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-base text-[#829AB1]">search</span>
            <input
              type="text"
              [value]="searchQuery()"
              (input)="searchQuery.set($any($event.target).value)"
              [placeholder]="lang.tr('Rechercher un enseignant…', 'البحث عن اسم المعلم…')"
              class="w-full pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 h-10 bg-[#F7F9FB] rounded-xl border border-[#CBD9E2] text-xs text-[#14251D] outline-none focus:border-[#2D6A4F]" />
          </div>

          <!-- Grade & Subject Filters -->
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <select
              [value]="selectedSubjectFilter()"
              (change)="selectedSubjectFilter.set($any($event.target).value)"
              class="bg-[#F7F9FB] text-xs font-semibold text-[#14251D] border border-[#CBD9E2] rounded-xl px-3 py-2 outline-none">
              <option value="Tous">{{ lang.tr('Toutes matières', 'جميع المواد') }}</option>
              <option value="Mathématiques">{{ lang.tr('Mathématiques', 'الرياضيات') }}</option>
              <option value="Français">{{ lang.tr('Français', 'اللغة الفرنسية') }}</option>
              <option value="اللغة العربية">{{ lang.tr('Arabe', 'اللغة العربية') }}</option>
              <option value="Éveil Scientifique">{{ lang.tr('Éveil Scientifique', 'الإيقاظ العلمي') }}</option>
            </select>
          </div>
        </div>

        @if (filteredTeachers().length === 0) {
          <div class="bg-white rounded-2xl border border-[#E7DFCF] p-12 text-center space-y-2">
            <span class="material-icons text-4xl text-[#9DBBA8]" aria-hidden="true">school</span>
            <p class="text-sm text-[#5B6B60]">
              {{ lang.tr('Aucun enseignant ne correspond à votre recherche.', 'لا يوجد معلم مطابق لمعايير البحث.') }}
            </p>
          </div>
        } @else {
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (t of filteredTeachers(); track t.id) {
              <div class="bg-white rounded-2xl p-6 border border-[#E7DFCF] shadow-xs space-y-4 text-center hover:shadow-[0_18px_45px_-30px_rgba(20,38,29,0.5)] transition-shadow flex flex-col justify-between">
                <div class="space-y-4">
                  <div class="relative inline-block mx-auto">
                    <app-teacher-avatar
                      [name]="t.displayName || t.name"
                      [avatarUrl]="t.avatarUrl"
                      size="xl" />
                    
                    @if (t.verified === 'verified') {
                      <span class="material-icons absolute bottom-0 right-0 rtl:right-auto rtl:left-0 bg-[#2D6A4F] text-[#FBF8F1] rounded-full text-base p-0.5 border-2 border-white"
                            [title]="lang.tr('Enseignant Certifié Éducation Nationale', 'مربٍ معتمد وموثق لدى المنصة')">
                        verified
                      </span>
                    }
                  </div>

                  <div>
                    <h3 class="font-display font-semibold text-[#14251D] text-base flex items-center justify-center gap-1.5">
                      {{ t.displayName || t.name }}
                      <span class="text-[#2D6A4F] font-semibold bg-[#E8F5FC] border border-[#2D6A4F]/20 px-1.5 py-0.5 rounded text-[10px]">TN</span>
                    </h3>
                    <p class="text-xs text-[#5B6B60] font-medium">{{ t.title }}</p>
                    <p class="text-[11px] text-[#2D6A4F] font-semibold mt-0.5">{{ t.school }}</p>
                  </div>

                  @if (t.bio && t.bio.trim().length > 0) {
                    <p class="text-xs text-[#4A5A50] line-clamp-3 bg-[#FBF8F1] p-3 rounded-xl border border-[#E7DFCF] text-start">
                      {{ t.bio }}
                    </p>
                  }

                  <!-- Subject tags -->
                  @if (t.subjects && t.subjects.length > 0) {
                    <div class="flex flex-wrap justify-center gap-1.5 pt-1">
                      @for (s of t.subjects.slice(0, 3); track s) {
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E8F5FC] text-[#007CC2]">
                          {{ lang.translateSubject(s) }}
                        </span>
                      }
                    </div>
                  }
                </div>

                <div class="flex items-center gap-2 pt-3 border-t border-[#E7DFCF]">
                  <button
                    type="button"
                    (click)="store.toggleWatchlist(t.id, 'teacher')"
                    [class]="store.isWatched(t.id, 'teacher') ? 'bg-[#F2ECDE] text-[#8A5A00] border-[#8A5A00]/40' : 'bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] border-[#E7DFCF]'"
                    class="px-3 py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    [title]="store.isWatched(t.id, 'teacher') ? 'Ne plus suivre' : 'Suivre cet enseignant'">
                    <span class="material-icons text-sm">{{ store.isWatched(t.id, 'teacher') ? 'bookmark' : 'bookmark_border' }}</span>
                    <span>{{ store.isWatched(t.id, 'teacher') ? lang.tr('Suivi', 'متابع') : lang.tr('Suivre', 'متابعة') }}</span>
                  </button>

                  <a
                    [routerLink]="['/teachers', t.id]"
                    class="flex-1 bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold text-xs py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-colors shadow-xs">
                    <span class="material-icons text-sm">badge</span>
                    <span>{{ lang.tr('Voir le profil', 'عرض الملف') }}</span>
                  </a>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class TeachersHomeComponent implements OnInit {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);

  readonly searchQuery = signal<string>('');
  readonly selectedSubjectFilter = signal<string>('Tous');

  readonly filteredTeachers = computed<TeacherProfile[]>(() => {
    let list = this.store.teachers();
    const query = this.searchQuery().trim().toLowerCase();
    const subject = this.selectedSubjectFilter();

    if (query) {
      list = list.filter((t) => {
        const name = (t.displayName || t.name || '').toLowerCase();
        const school = (t.school || '').toLowerCase();
        return name.includes(query) || school.includes(query);
      });
    }

    if (subject !== 'Tous') {
      list = list.filter((t) => t.subjects && t.subjects.includes(subject));
    }

    return list;
  });

  ngOnInit() {
    void this.store.loadTeachers();
  }
}
