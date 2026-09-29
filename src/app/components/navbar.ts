import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EducationStore } from '../services/education-store';
import { LanguageService } from '../services/language.service';
import { UserRole } from '../models/education.model';

@Component({
  selector: 'app-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 gap-4">
          
          <!-- Logo & Platform Identity -->
          <div class="flex items-center gap-3 shrink-0">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-sm font-bold text-xl font-arabic">
              م
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="font-extrabold text-slate-900 text-lg tracking-tight">
                  {{ lang.t('brandName') }}
                </span>
                <span class="text-xs font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  TN 🇹🇳
                </span>
              </div>
              <p class="text-[11px] text-slate-500 font-medium leading-none">
                {{ lang.t('brandSub') }}
              </p>
            </div>
          </div>

          <!-- Role Switcher Tabs -->
          <nav class="hidden md:flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60">
            <button
              (click)="selectRole('teacher')"
              [class]="store.currentRole() === 'teacher' 
                ? 'bg-white text-emerald-800 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900 font-medium'"
              class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer">
              <span class="material-icons text-base text-emerald-600">school</span>
              <span>{{ lang.t('roleTeacher') }}</span>
            </button>

            <button
              (click)="selectRole('parent')"
              [class]="store.currentRole() === 'parent' 
                ? 'bg-white text-indigo-800 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900 font-medium'"
              class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer">
              <span class="material-icons text-base text-indigo-600">family_restroom</span>
              <span>{{ lang.t('roleParent') }}</span>
            </button>

            <button
              (click)="selectRole('student')"
              [class]="store.currentRole() === 'student' 
                ? 'bg-white text-amber-800 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900 font-medium'"
              class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer">
              <span class="material-icons text-base text-amber-600">auto_stories</span>
              <span>{{ lang.t('roleStudent') }}</span>
            </button>

            <button
              (click)="selectRole('public')"
              [class]="store.currentRole() === 'public' 
                ? 'bg-white text-teal-800 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900 font-medium'"
              class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer">
              <span class="material-icons text-base text-teal-600">explore</span>
              <span>{{ lang.t('rolePublic') }}</span>
            </button>
          </nav>

          <!-- Language Switcher & Active Context -->
          <div class="flex items-center gap-3">
            
            <!-- Language Toggle Pill -->
            <button
              (click)="lang.toggleLanguage()"
              class="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300/80 px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-2xs">
              <span class="material-icons text-sm text-emerald-700">translate</span>
              <span>{{ lang.isArabic() ? 'Français 🇫🇷' : 'العربية 🇹🇳' }}</span>
            </button>

            @if (store.currentRole() === 'teacher') {
              <div class="hidden sm:flex items-center gap-2">
                <label for="active-class-select" class="text-xs text-slate-500 font-medium">
                  {{ lang.t('activeClassLabel') }}
                </label>
                <select
                  id="active-class-select"
                  [value]="store.activeClassId()"
                  (change)="onClassChange($event)"
                  class="text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 cursor-pointer outline-none">
                  @for (c of store.classes(); track c.id) {
                    <option [value]="c.id">{{ c.name }}</option>
                  }
                </select>
              </div>
            } @else if (store.currentRole() === 'parent') {
              <div class="hidden sm:flex items-center gap-2">
                <label for="active-student-select" class="text-xs text-slate-500 font-medium">
                  {{ lang.tr('Enfant :', 'التلميذ:') }}
                </label>
                <select
                  id="active-student-select"
                  [value]="store.activeStudentId()"
                  (change)="onStudentChange($event)"
                  class="text-xs font-semibold bg-indigo-50 border border-indigo-200 rounded-xl px-2.5 py-1.5 text-indigo-900 cursor-pointer outline-none">
                  @for (st of store.students(); track st.id) {
                    <option [value]="st.id">{{ st.name }} ({{ st.grade }})</option>
                  }
                </select>
              </div>
            }

            <!-- User Badge -->
            <div class="flex items-center gap-2 pl-2 border-l border-slate-200">
              <img
                [src]="getUserAvatar()"
                alt="Avatar"
                class="w-9 h-9 rounded-full object-cover border-2 border-emerald-500 shadow-xs" />
              <div class="hidden lg:block text-left leading-tight">
                <p class="text-xs font-bold text-slate-800">{{ getUserName() }}</p>
                <p class="text-[10px] text-slate-500 font-medium">{{ getUserSubtitle() }}</p>
              </div>
            </div>

          </div>

        </div>

        <!-- Mobile Role Selector Bar -->
        <div class="flex md:hidden overflow-x-auto py-2 gap-1.5 no-scrollbar border-t border-slate-100">
          <button
            (click)="selectRole('teacher')"
            [class]="store.currentRole() === 'teacher' ? 'bg-emerald-600 text-white font-semibold' : 'bg-slate-100 text-slate-700'"
            class="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0">
            {{ lang.t('roleTeacher') }}
          </button>
          <button
            (click)="selectRole('parent')"
            [class]="store.currentRole() === 'parent' ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-100 text-slate-700'"
            class="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0">
            {{ lang.t('roleParent') }}
          </button>
          <button
            (click)="selectRole('student')"
            [class]="store.currentRole() === 'student' ? 'bg-amber-600 text-white font-semibold' : 'bg-slate-100 text-slate-700'"
            class="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0">
            {{ lang.t('roleStudent') }}
          </button>
          <button
            (click)="selectRole('public')"
            [class]="store.currentRole() === 'public' ? 'bg-teal-600 text-white font-semibold' : 'bg-slate-100 text-slate-700'"
            class="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0">
            {{ lang.t('rolePublic') }}
          </button>
        </div>

      </div>
    </header>
  `,
})
export class NavbarComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);

  selectRole(role: UserRole) {
    this.store.switchRole(role);
  }

  onClassChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.store.setActiveClass(val);
  }

  onStudentChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.store.setActiveStudent(val);
  }

  getUserName(): string {
    const role = this.store.currentRole();
    if (role === 'teacher') return this.lang.tr('Mme Amel Ben Ali', 'السيدة أمل بن علي');
    if (role === 'parent') return this.lang.tr('M. Youssef Mansouri', 'السيد يوسف المنصوري');
    if (role === 'student') return this.store.activeStudent().name;
    return this.lang.tr('Visiteur', 'زائر الفضاء');
  }

  getUserSubtitle(): string {
    const role = this.store.currentRole();
    if (role === 'teacher') return this.lang.tr('Enseignante 4ème A', 'معلمة السنة الرابعة أ');
    if (role === 'parent') return this.lang.tr('Parent d\'Ahmed & Sarra', 'ولي أمر أحمد وسارة');
    if (role === 'student') return this.store.activeStudent().grade;
    return 'Espace Public Free';
  }

  getUserAvatar(): string {
    const role = this.store.currentRole();
    if (role === 'teacher') return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80';
    if (role === 'parent') return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    if (role === 'student') return this.store.activeStudent().avatarUrl;
    return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
  }
}
