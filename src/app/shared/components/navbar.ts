import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { EducationStore, LanguageService, FirebaseService, UserRole } from '@core';

@Component({
  selector: 'app-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <header class="sticky top-0 z-40 bg-white dark:bg-[#0E1D2A] border-b border-[#E6EEF3] dark:border-[#1A3145] transition-colors">
      <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-[76px] gap-4">
          
          <!-- Logo & Platform Identity -->
          <div (click)="selectRole('home')" class="flex items-center gap-3 shrink-0 cursor-pointer group">
            <div class="w-12 h-12 rounded-[14px] bg-[#0B2947] text-white flex items-center justify-center shadow-sm font-display font-bold text-xl shrink-0 group-hover:scale-102 transition-transform">
              P
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-display font-bold text-[#102A43] dark:text-white text-base sm:text-lg tracking-tight whitespace-nowrap">
                  {{ lang.t('brandName') }}
                </span>
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5FC] text-[#007CC2] dark:bg-[#102A43] dark:text-[#168CCB] shrink-0">
                  TN ▾
                </span>
              </div>
              <p class="text-[11px] text-[#486581] dark:text-[#8CA9C4] font-medium leading-none hidden sm:block mt-0.5">
                {{ lang.t('brandSub') }}
              </p>
            </div>
          </div>

          <!-- Role Navigation (Center Clean Tabs with Bottom Indicator) -->
          <nav class="hidden lg:flex items-center gap-2 shrink-0 h-[76px]">
            <!-- Home -->
            <button
              (click)="selectRole('home')"
              [class]="store.currentRole() === 'home' 
                ? 'text-[#005F96] dark:text-[#168CCB] font-semibold border-b-[3px] border-[#007CC2] bg-[#E8F5FC]/60 dark:bg-[#102A43]/50' 
                : 'text-[#486581] dark:text-[#8CA9C4] hover:text-[#007CC2] hover:bg-[#F3FAFD] dark:hover:bg-[#152737] font-medium border-b-[3px] border-transparent'"
              class="flex items-center gap-2 px-3.5 h-[46px] rounded-lg text-xs tracking-wide transition-all cursor-pointer">
              <span class="material-icons text-lg">home</span>
              <span>{{ lang.t('navHome') }}</span>
            </button>

            <!-- Teacher -->
            @if (!firebase.userProfile() || firebase.userProfile()?.role === 'teacher') {
              <button
                (click)="selectRole('teacher')"
                [class]="store.currentRole() === 'teacher' 
                  ? 'text-[#005F96] dark:text-[#168CCB] font-semibold border-b-[3px] border-[#007CC2] bg-[#E8F5FC]/60 dark:bg-[#102A43]/50' 
                  : 'text-[#486581] dark:text-[#8CA9C4] hover:text-[#007CC2] hover:bg-[#F3FAFD] dark:hover:bg-[#152737] font-medium border-b-[3px] border-transparent'"
                class="flex items-center gap-2 px-3.5 h-[46px] rounded-lg text-xs tracking-wide transition-all cursor-pointer">
                <span class="material-icons text-lg">school</span>
                <span>{{ lang.t('roleTeacher') }}</span>
              </button>
            }

            <!-- Parent -->
            @if (!firebase.userProfile() || firebase.userProfile()?.role === 'parent') {
              <button
                (click)="selectRole('parent')"
                [class]="store.currentRole() === 'parent' 
                  ? 'text-[#005F96] dark:text-[#168CCB] font-semibold border-b-[3px] border-[#007CC2] bg-[#E8F5FC]/60 dark:bg-[#102A43]/50' 
                  : 'text-[#486581] dark:text-[#8CA9C4] hover:text-[#007CC2] hover:bg-[#F3FAFD] dark:hover:bg-[#152737] font-medium border-b-[3px] border-transparent'"
                class="flex items-center gap-2 px-3.5 h-[46px] rounded-lg text-xs tracking-wide transition-all cursor-pointer">
                <span class="material-icons text-lg">family_restroom</span>
                <span>{{ lang.t('roleParent') }}</span>
              </button>
            }

            <!-- Student -->
            @if (!firebase.userProfile() || firebase.userProfile()?.role === 'student' || firebase.userProfile()?.role === 'teacher') {
              <button
                (click)="selectRole('student')"
                [class]="store.currentRole() === 'student' 
                  ? 'text-[#005F96] dark:text-[#168CCB] font-semibold border-b-[3px] border-[#007CC2] bg-[#E8F5FC]/60 dark:bg-[#102A43]/50' 
                  : 'text-[#486581] dark:text-[#8CA9C4] hover:text-[#007CC2] hover:bg-[#F3FAFD] dark:hover:bg-[#152737] font-medium border-b-[3px] border-transparent'"
                class="flex items-center gap-2 px-3.5 h-[46px] rounded-lg text-xs tracking-wide transition-all cursor-pointer">
                <span class="material-icons text-lg">auto_stories</span>
                <span>{{ lang.t('roleStudent') }}</span>
              </button>
            }

            <!-- Public Discovery -->
            <button
              (click)="selectRole('public')"
              [class]="store.currentRole() === 'public' 
                ? 'text-[#005F96] dark:text-[#168CCB] font-semibold border-b-[3px] border-[#007CC2] bg-[#E8F5FC]/60 dark:bg-[#102A43]/50' 
                : 'text-[#486581] dark:text-[#8CA9C4] hover:text-[#007CC2] hover:bg-[#F3FAFD] dark:hover:bg-[#152737] font-medium border-b-[3px] border-transparent'"
              class="flex items-center gap-2 px-3.5 h-[46px] rounded-lg text-xs tracking-wide transition-all cursor-pointer">
              <span class="material-icons text-lg">explore</span>
              <span>{{ lang.t('rolePublic') }}</span>
            </button>
          </nav>

          <!-- Right Action Bar: Search + Notifications + Language + Profile Avatar -->
          <div class="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
            
            <!-- Global Quick Search Input -->
            <div class="hidden xl:flex items-center relative">
              <span class="material-icons absolute left-3.5 rtl:left-auto rtl:right-3.5 text-base text-[#829AB1] pointer-events-none">search</span>
              <input
                type="text"
                [value]="store.searchQuery()"
                (input)="store.searchQuery.set($any($event.target).value)"
                [placeholder]="lang.tr('Rechercher...', 'بحث...')"
                class="w-44 2xl:w-52 pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 h-[42px] bg-[#F7F9FB] dark:bg-[#152737] hover:bg-white focus:bg-white dark:hover:bg-[#1B344B] text-[#102A43] dark:text-white text-xs rounded-[10px] border border-[#CBD9E2] dark:border-[#254663] focus:border-[#007CC2] focus:ring-3 focus:ring-[#E8F5FC] outline-none transition-all placeholder-[#829AB1]" />
            </div>

            <!-- Notifications Bell -->
            <button
              type="button"
              [title]="lang.tr('Notifications officielles', 'الإشعارات الرسمية')"
              class="relative w-10 h-10 rounded-[10px] bg-white dark:bg-[#152737] hover:bg-[#F3FAFD] dark:hover:bg-[#1B344B] text-[#102A43] dark:text-white border border-[#CBD9E2] dark:border-[#254663] flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-2xs">
              <span class="material-icons text-lg text-[#102A43] dark:text-white">notifications</span>
              <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D64545] text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                3
              </span>
            </button>

            <!-- Mode Switcher Pill -->
            <button
              type="button"
              (click)="store.toggleMode()"
              [title]="store.activeMode() === 'light' ? lang.tr('Passer au mode sombre', 'الوضع الليلي') : lang.tr('Passer au mode clair', 'الوضع النهاري')"
              class="w-10 h-10 rounded-[10px] bg-white dark:bg-[#152737] hover:bg-[#F3FAFD] dark:hover:bg-[#1B344B] border border-[#CBD9E2] dark:border-[#254663] flex items-center justify-center text-[#102A43] dark:text-white cursor-pointer transition-colors shadow-2xs">
              <span class="material-icons text-base text-[#007CC2]">
                {{ store.activeMode() === 'light' ? 'dark_mode' : 'light_mode' }}
              </span>
            </button>

            <!-- Language Toggle Pill -->
            <button
              (click)="lang.toggleLanguage()"
              class="flex items-center gap-2 bg-white dark:bg-[#152737] hover:bg-[#F3FAFD] dark:hover:bg-[#1B344B] text-[#102A43] dark:text-white border border-[#CBD9E2] dark:border-[#254663] px-3 h-[42px] rounded-[10px] text-xs font-semibold cursor-pointer transition-colors shrink-0 shadow-2xs">
              <span class="text-sm leading-none">{{ lang.isArabic() ? '🇹🇳' : '🇫🇷' }}</span>
              <span class="text-xs font-bold">{{ lang.isArabic() ? 'AR' : 'FR' }}</span>
              <span class="material-icons text-xs text-[#829AB1]">expand_more</span>
            </button>

            <!-- User Profile Avatar & Dropdown Menu -->
            <div class="relative shrink-0">
              <button
                type="button"
                (click)="profileMenuOpen.set(!profileMenuOpen())"
                class="flex items-center gap-1 p-0.5 rounded-full hover:ring-2 hover:ring-[#1B4332]/20 cursor-pointer transition-all shrink-0">
                <img
                  [src]="getUserAvatar()"
                  alt="User Avatar"
                  class="w-8 h-8 rounded-full object-cover border border-[#E7DFCF] shadow-2xs" />
                <span class="material-icons text-xs text-[#5B6B60] transition-transform" [class.rotate-180]="profileMenuOpen()">expand_more</span>
              </button>

              <!-- Profile Dropdown Flyout Card -->
              @if (profileMenuOpen()) {
                <div class="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-64 bg-white border border-[#E7DFCF] rounded-2xl shadow-xl p-2 z-50 text-xs space-y-1 animate-in">
                  
                  <!-- Top User Identification Block -->
                  <div
                    (click)="handleProfileClick()"
                    class="flex items-center justify-between p-2 rounded-xl hover:bg-[#F2ECDE] cursor-pointer transition-colors">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <img
                        [src]="getUserAvatar()"
                        alt="User"
                        class="w-9 h-9 rounded-full object-cover border border-[#E7DFCF] shrink-0" />
                      <div class="min-w-0 text-left rtl:text-right">
                        <p class="font-display font-semibold text-[#14251D] text-xs truncate">
                          {{ getUserName() }}
                        </p>
                        <p class="text-[10px] text-[#2D6A4F] font-medium truncate">
                          {{ getUserSubtitle() }}
                        </p>
                      </div>
                    </div>
                    <span class="material-icons text-sm text-[#5B6B60]">chevron_right</span>
                  </div>

                  <div class="border-t border-[#E7DFCF] my-1"></div>

                  <!-- Menu Actions -->
                  <button
                    type="button"
                    (click)="handleProfileClick()"
                    class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#14251D] hover:bg-[#F2ECDE] font-semibold cursor-pointer transition-colors text-left rtl:text-right">
                    <span class="material-icons text-base text-[#1B4332]">person</span>
                    <span>{{ lang.tr('Mon profil', 'ملفي الشخصي') }}</span>
                  </button>

                  <button
                    type="button"
                    (click)="profileMenuOpen.set(false); store.openLoginModal()"
                    class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#14251D] hover:bg-[#F2ECDE] font-semibold cursor-pointer transition-colors text-left rtl:text-right">
                    <span class="material-icons text-base text-[#1B4332]">settings</span>
                    <span>{{ lang.tr('Paramètres', 'الإعدادات') }}</span>
                  </button>

                  <button
                    type="button"
                    (click)="profileMenuOpen.set(false); selectRole('public')"
                    class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#14251D] hover:bg-[#F2ECDE] font-semibold cursor-pointer transition-colors text-left rtl:text-right">
                    <span class="material-icons text-base text-[#1B4332]">help</span>
                    <span>{{ lang.tr('Aide & Documentation', 'المساعدة والدليل') }}</span>
                  </button>

                  <div class="border-t border-[#E7DFCF] my-1"></div>

                  @if (firebase.userProfile()) {
                    <button
                      type="button"
                      (click)="profileMenuOpen.set(false); handleLogout()"
                      class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#C1121F] hover:bg-rose-50 font-semibold cursor-pointer transition-colors text-left rtl:text-right">
                      <span class="material-icons text-base text-[#C1121F]">logout</span>
                      <span>{{ lang.tr('Se déconnecter', 'تسجيل الخروج') }}</span>
                    </button>
                  } @else {
                    <button
                      type="button"
                      (click)="profileMenuOpen.set(false); store.openLoginModal()"
                      class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#1B4332] hover:bg-[#F2ECDE] font-semibold cursor-pointer transition-colors text-left rtl:text-right">
                      <span class="material-icons text-base text-[#1B4332]">login</span>
                      <span>{{ lang.tr('Se connecter / S’inscrire', 'الدخول / التسجيل') }}</span>
                    </button>
                  }
                </div>
              }
            </div>

          </div>

        </div>

        <!-- Secondary/Mobile Role Selector Bar (for screens < lg) -->
        <div class="flex lg:hidden items-center justify-between overflow-x-auto py-2 gap-2 no-scrollbar border-t border-[#E7DFCF]">
          <div class="flex items-center gap-1.5 shrink-0">
            <button
              (click)="selectRole('home')"
              [class]="store.currentRole() === 'home' ? 'bg-[#1B4332] text-[#FBF8F1] font-semibold' : 'bg-white text-[#5B6B60] border border-[#E7DFCF]'"
              class="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0">
              {{ lang.t('navHome') }}
            </button>

            @if (!firebase.userProfile() || firebase.userProfile()?.role === 'teacher') {
              <button
                (click)="selectRole('teacher')"
                [class]="store.currentRole() === 'teacher' ? 'bg-[#1B4332] text-[#FBF8F1] font-semibold' : 'bg-white text-[#5B6B60] border border-[#E7DFCF]'"
                class="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0">
                {{ lang.t('roleTeacher') }}
              </button>
            }

            @if (!firebase.userProfile() || firebase.userProfile()?.role === 'parent') {
              <button
                (click)="selectRole('parent')"
                [class]="store.currentRole() === 'parent' ? 'bg-[#8A5A00] text-[#FBF8F1] font-semibold' : 'bg-white text-[#5B6B60] border border-[#E7DFCF]'"
                class="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0">
                {{ lang.t('roleParent') }}
              </button>
            }

            @if (!firebase.userProfile() || firebase.userProfile()?.role === 'student' || firebase.userProfile()?.role === 'teacher') {
              <button
                (click)="selectRole('student')"
                [class]="store.currentRole() === 'student' ? 'bg-[#BF5B34] text-[#FBF8F1] font-semibold' : 'bg-white text-[#5B6B60] border border-[#E7DFCF]'"
                class="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0">
                {{ lang.t('roleStudent') }}
              </button>
            }

            <button
              (click)="selectRole('public')"
              [class]="store.currentRole() === 'public' ? 'bg-[#2D6A4F] text-[#FBF8F1] font-semibold' : 'bg-white text-[#5B6B60] border border-[#E7DFCF]'"
              class="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0">
              {{ lang.t('rolePublic') }}
            </button>
          </div>

          @if (firebase.userProfile()) {
            <button
              (click)="handleLogout()"
              class="bg-white text-[#BF5B34] border border-[#E7DFCF] px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer">
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
  readonly profileMenuOpen = signal<boolean>(false);

  selectRole(role: UserRole) {
    this.store.switchRole(role);
  }

  handleProfileClick() {
    this.profileMenuOpen.set(false);
    if (!this.firebase.userProfile()) {
      this.store.openLoginModal();
      return;
    }
    const role = this.firebase.userProfile()?.role;
    if (role) {
      this.store.switchRole(role);
    }
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
    if (role === 'teacher') return this.lang.tr('Enseignant(e)', 'المعلم(ة)');
    if (role === 'parent') return this.lang.tr('Parent d\'élève', 'ولي أمر');
    if (role === 'student') return this.lang.tr('Élève', 'تلميذ');
    return this.lang.tr('Espace Membre', 'فضاء العضوية');
  }

  getUserSubtitle(): string {
    const profile = this.firebase.userProfile();
    if (profile?.role === 'teacher') return this.lang.tr('Enseignante Certifiée', 'معلمة معتمدة');
    if (profile?.role === 'parent') return this.lang.tr('Parent Référent', 'ولي أمر متابع');
    if (profile?.role === 'student') return this.lang.tr('Élève', 'تلميذ');

    const role = this.store.currentRole();
    if (role === 'teacher') return this.lang.tr('Enseignante', 'معلمة');
    if (role === 'parent') return this.lang.tr('Parent', 'ولي أمر');
    if (role === 'student') return this.lang.tr('Élève', 'تلميذ');
    return this.lang.tr('Compte & Sécurité', 'الحساب والأمان');
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
