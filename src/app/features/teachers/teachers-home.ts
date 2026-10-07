import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EducationStore, LanguageService, TeacherProfile } from '@core';
import { TeacherCardComponent } from '@shared';

/**
 * Dedicated teacher directory — people, kept separate from the content
 * library (courses/exercises live on /discovery). Public, no login required.
 */
@Component({
  selector: 'app-teachers-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TeacherCardComponent],
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
              <app-teacher-card
                [teacher]="t"
                [isWatched]="store.isWatched(t.id, 'teacher')"
                (toggleWatch)="store.toggleWatchlist($event.id, 'teacher')" />
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
