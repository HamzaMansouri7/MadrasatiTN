import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EducationStore, LanguageService, FirebaseService, UserRole } from '@core';

@Component({
  selector: 'app-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div class="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div class="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          <!-- Logo & Platform Identity -->
          <div (click)="selectRole('home')" class="flex items-center gap-2 sm:gap-2.5 shrink-0 cursor-pointer group">
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-sm font-bold text-lg sm:text-xl font-arabic group-hover:scale-105 transition-transform shrink-0">
              م
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="font-extrabold text-slate-900 text-sm sm:text-base md:text-lg tracking-tight whitespace-nowrap">
                  {{ lang.t('brandName') }}
                </span>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                  TN 🇹🇳
                </span>
              </div>
              <p class="text-[10px] text-slate-500 font-medium leading-none hidden sm:block">
                {{ lang.t('brandSub') }}
              </p>
            </div>
          </div>

          <!-- Role Switcher Tabs (Desktop Only: lg+) -->
          <nav class="hidden lg:flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 shrink-0">
            <button
              (click)="selectRole('home')"
              [class]="store.currentRole() === 'home' 
                ? 'bg-white text-slate-900 shadow-xs font-bold' 
                : 'text-slate-600 hover:text-slate-900 font-medium'"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer">
              <span class="material-icons text-base text-emerald-600">home</span>
              <span>{{ lang.t('navHome') }}</span>
            </button>
            <button
              (click)="selectRole('teacher')"
              [class]="store.currentRole() === 'teacher' 
                ? 'bg-white text-emerald-800 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900 font-medium'"
              class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer">
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

          <!-- Right Action Bar: Always fully visible and unclipped -->
          <div class="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
            
            <!-- Language Toggle Pill -->
            <button
              (click)="lang.toggleLanguage()"
              class="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300/80 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-2xs shrink-0">
              <span class="material-icons text-sm text-emerald-700">translate</span>
              <span>{{ lang.isArabic() ? 'Fr' : 'عربي' }}</span>
            </button>

            <!-- Watchlist Quick Pill -->
            <button
              (click)="openWatchlist()"
              class="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-2xs shrink-0"
              [title]="lang.tr('Ma Watchlist & Favoris', 'قائمة المحفوظات')">
              <span class="material-icons text-sm text-amber-600">bookmark</span>
              <span class="hidden sm:inline">{{ lang.isArabic() ? 'محفوظاتي' : 'Favoris' }}</span>
              <span class="bg-amber-600 text-white rounded-full px-1.5 py-0.2 text-[10px] font-black leading-tight">{{ store.totalWatchlistCount() }}</span>
            </button>

            <!-- Authentication Widget -->
            @if (firebase.userProfile(); as user) {
              <div class="flex items-center gap-1.5 sm:gap-2 bg-slate-100/90 border border-slate-200/90 p-1 pl-1.5 pr-1.5 rounded-2xl shadow-2xs shrink-0">
                <img
                  [src]="user.photoURL || getUserAvatar()"
                  alt="User"
                  class="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-emerald-500 shadow-xs shrink-0" />
                <div class="text-left leading-tight max-w-[70px] sm:max-w-[100px] md:max-w-[130px] truncate">
                  <p class="text-xs font-bold text-slate-800 truncate" [title]="user.displayName || getUserName()">
                    {{ user.displayName || getUserName() }}
                  </p>
                  <p class="text-[10px] text-emerald-700 font-semibold uppercase truncate">{{ user.role }} ✔️</p>
                </div>
                <!-- Permanent Always-Visible Logout Button -->
                <button
                  type="button"
                  (click)="handleLogout()"
                  title="Se déconnecter"
                  class="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 px-2 sm:px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer transition-colors border border-rose-200/80 shadow-2xs shrink-0">
                  <span class="material-icons text-sm">logout</span>
                  <span class="text-[11px] font-bold">{{ lang.isArabic() ? 'خروج' : 'Quitter' }}</span>
                </button>
              </div>
            } @else {
              <!-- Login Button -->
              <button
                type="button"
                (click)="store.openLoginModal()"
                class="text-slate-700 hover:text-slate-950 font-bold text-xs px-2.5 py-1.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors shrink-0">
                {{ lang.t('navLogin') }}
              </button>

              <!-- Signup Button -->
              <button
                type="button"
                (click)="store.openSignupModal('teacher')"
                class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 sm:px-3 py-1.5 rounded-xl shadow-xs cursor-pointer transition-all shrink-0">
                {{ lang.t('navSignup') }}
              </button>

              <!-- Google Button -->
              <button
                type="button"
                (click)="loginGoogle()"
                title="Google Login"
                class="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl transition-all cursor-pointer shadow-xs shrink-0">
                <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span class="hidden md:inline">{{ lang.tr('Google', 'جوجل') }}</span>
              </button>
            }

          </div>

        </div>

        <!-- Secondary/Mobile Role Selector Bar (for screens < lg) -->
        <div class="flex lg:hidden items-center justify-between overflow-x-auto py-2 gap-2 no-scrollbar border-t border-slate-100">
          <div class="flex items-center gap-1.5 shrink-0">
            <button
              (click)="selectRole('home')"
              [class]="store.currentRole() === 'home' ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-100 text-slate-700'"
              class="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0">
              {{ lang.t('navHome') }}
            </button>
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

          @if (firebase.userProfile()) {
            <button
              (click)="handleLogout()"
              class="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer">
              <span class="material-icons text-xs">logout</span>
              <span>{{ lang.isArabic() ? 'خروج' : 'Déconnexion' }}</span>
            </button>
          }
        </div>

      </div>
    </header>
  `,
})
export class NavbarComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  readonly firebase = inject(FirebaseService);

  selectRole(role: UserRole) {
    this.store.switchRole(role);
  }

  async handleLogout() {
    await this.firebase.logout();
    this.store.switchRole('home');
  }

  openWatchlist() {
    this.store.switchRole('public');
  }

  onClassChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.store.setActiveClass(val);
  }

  async loginGoogle() {
    const targetRole = this.store.currentRole() === 'home' ? 'teacher' : this.store.currentRole();
    const profile = await this.firebase.loginWithGoogle(targetRole);
    if (profile) {
      this.store.switchRole(profile.role);
    }
  }

  getUserName(): string {
    const profile = this.firebase.userProfile();
    if (profile?.displayName) return profile.displayName;
    const user = this.firebase.currentUser();
    if (user?.displayName) return user.displayName;

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
    const profile = this.firebase.userProfile();
    if (profile?.photoURL) return profile.photoURL;
    const user = this.firebase.currentUser();
    if (user?.photoURL) return user.photoURL;

    const role = this.store.currentRole();
    if (role === 'teacher') return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80';
    if (role === 'parent') return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    if (role === 'student') return this.store.activeStudent().avatarUrl;
    return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
  }
}
