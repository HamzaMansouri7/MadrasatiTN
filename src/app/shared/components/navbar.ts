import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { EducationStore, LanguageService, FirebaseService, UserRole } from '@core';

@Component({
  selector: 'app-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <header class="sticky top-0 z-40 bg-white border-b border-[#E6EEF3] transition-colors">
      <div class="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-[76px] gap-2 lg:gap-4">
          
          <!-- Logo & Platform Identity -->
          <div (click)="selectRole('home')" class="flex items-center gap-2.5 sm:gap-3 shrink-0 cursor-pointer group">
            <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-[12px] bg-[#0B2947] p-1 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-102 transition-transform">
              <img src="/favicon.svg" alt="Madrasati Logo" class="w-full h-full object-contain" />
            </div>
            <div>
              <div class="flex items-center gap-1.5 sm:gap-2">
                <span class="font-display font-bold text-[#102A43] text-sm sm:text-base xl:text-lg tracking-tight whitespace-nowrap">
                  {{ lang.t('brandName') }}
                </span>
                <span class="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5FC] text-[#007CC2] border border-[#007CC2]/20 shrink-0">
                  <span class="font-black">TN</span>
                </span>
              </div>
              <p class="text-[10px] sm:text-[11px] text-[#486581] font-medium leading-none hidden 2xl:block mt-0.5">
                {{ lang.t('brandSub') }}
              </p>
            </div>
          </div>

          <!-- Role Navigation (Center Clean Tabs with Bottom Indicator) -->
          <nav class="hidden lg:flex items-center gap-1 xl:gap-1.5 2xl:gap-2 shrink-0 h-[76px]">
            <!-- Home -->
            <button
              (click)="selectRole('home')"
              [class]="store.currentRole() === 'home' 
                ? 'text-[#005F96] font-semibold border-b-[3px] border-[#007CC2] bg-[#E8F5FC]/60' 
                : 'text-[#486581] hover:text-[#007CC2] hover:bg-[#F3FAFD] font-medium border-b-[3px] border-transparent'"
              class="flex items-center gap-1.5 px-2.5 xl:px-3 h-[44px] rounded-lg text-xs tracking-wide transition-all cursor-pointer">
              <span class="material-icons text-base xl:text-lg">home</span>
              <span>{{ lang.t('navHome') }}</span>
            </button>

            <!-- Teacher -->
            @if (!firebase.userProfile() || firebase.userProfile()?.role === 'teacher') {
              <button
                (click)="selectRole('teacher')"
                [class]="store.currentRole() === 'teacher' 
                  ? 'text-[#005F96] font-semibold border-b-[3px] border-[#007CC2] bg-[#E8F5FC]/60' 
                  : 'text-[#486581] hover:text-[#007CC2] hover:bg-[#F3FAFD] font-medium border-b-[3px] border-transparent'"
                class="flex items-center gap-1.5 px-2.5 xl:px-3 h-[44px] rounded-lg text-xs tracking-wide transition-all cursor-pointer">
                <span class="material-icons text-base xl:text-lg">school</span>
                <span>{{ lang.t('roleTeacher') }}</span>
              </button>
            }

            <!-- Parent -->
            @if (!firebase.userProfile() || firebase.userProfile()?.role === 'parent') {
              <button
                (click)="selectRole('parent')"
                [class]="store.currentRole() === 'parent' 
                  ? 'text-[#005F96] font-semibold border-b-[3px] border-[#007CC2] bg-[#E8F5FC]/60' 
                  : 'text-[#486581] hover:text-[#007CC2] hover:bg-[#F3FAFD] font-medium border-b-[3px] border-transparent'"
                class="flex items-center gap-1.5 px-2.5 xl:px-3 h-[44px] rounded-lg text-xs tracking-wide transition-all cursor-pointer">
                <span class="material-icons text-base xl:text-lg">family_restroom</span>
                <span>{{ lang.t('roleParent') }}</span>
              </button>
            }

            <!-- Public Discovery -->
            <button
              (click)="selectRole('public')"
              [class]="store.currentRole() === 'public' 
                ? 'text-[#005F96] font-semibold border-b-[3px] border-[#007CC2] bg-[#E8F5FC]/60' 
                : 'text-[#486581] hover:text-[#007CC2] hover:bg-[#F3FAFD] font-medium border-b-[3px] border-transparent'"
              class="flex items-center gap-1.5 px-2.5 xl:px-3 h-[44px] rounded-lg text-xs tracking-wide transition-all cursor-pointer">
              <span class="material-icons text-base xl:text-lg">explore</span>
              <span>{{ lang.t('rolePublic') }}</span>
            </button>
          </nav>

          <!-- Right Action Bar: Search + Notifications + Language + Profile Avatar -->
          <div class="flex items-center gap-1.5 sm:gap-2 xl:gap-3 ms-auto shrink-0">
            
            <!-- Global Quick Search Input -->
            <div class="hidden 2xl:flex items-center relative">
              <span class="material-icons absolute left-3.5 rtl:left-auto rtl:right-3.5 text-base text-[#829AB1] pointer-events-none">search</span>
              <input
                type="text"
                [value]="store.searchQuery()"
                (input)="store.searchQuery.set($any($event.target).value)"
                [placeholder]="lang.tr('Rechercher...', 'بحث...')"
                class="w-36 2xl:w-48 pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 h-[40px] bg-[#F7F9FB] hover:bg-white focus:bg-white text-[#102A43] text-xs rounded-[10px] border border-[#CBD9E2] focus:border-[#007CC2] focus:ring-3 focus:ring-[#E8F5FC] outline-none transition-all placeholder-[#829AB1]" />
            </div>

            <!-- Notifications Bell & Dropdown Flyout -->
            <div class="relative shrink-0">
              <button
                type="button"
                (click)="notifDropdownOpen.set(!notifDropdownOpen()); profileMenuOpen.set(false)"
                [title]="lang.tr('Notifications officielles', 'الإشعارات الرسمية')"
                class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-white hover:bg-[#F3FAFD] text-[#102A43] border border-[#CBD9E2] flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-2xs">
                <span class="material-icons text-base sm:text-lg text-[#102A43]">notifications</span>
                @if (firebase.unreadNotificationsCount() > 0) {
                  <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D64545] text-white text-[9px] font-bold flex items-center justify-center shadow-xs animate-pulse">
                    {{ firebase.unreadNotificationsCount() }}
                  </span>
                }
              </button>

              <!-- Notification Dropdown Panel -->
              @if (notifDropdownOpen()) {
                <div class="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-80 sm:w-96 bg-white border border-[#CBD9E2] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in">
                  
                  <!-- Header -->
                  <div class="p-3.5 bg-[#F7F9FB] border-b border-[#E6EEF3] flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="material-icons text-base text-[#007CC2]">notifications_active</span>
                      <span class="font-display font-bold text-xs sm:text-sm text-[#102A43]">
                        {{ lang.tr('Notifications officielles', 'الإشعارات الرسمية') }}
                      </span>
                      @if (firebase.unreadNotificationsCount() > 0) {
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5FC] text-[#007CC2]">
                          {{ firebase.unreadNotificationsCount() }} {{ lang.tr('non lues', 'غير مقروءة') }}
                        </span>
                      }
                    </div>

                    @if (firebase.unreadNotificationsCount() > 0) {
                      <button
                        type="button"
                        (click)="firebase.markAllNotificationsAsRead()"
                        class="text-[11px] text-[#007CC2] hover:underline font-semibold cursor-pointer">
                        {{ lang.tr('Tout lire', 'تحديد الكل') }}
                      </button>
                    }
                  </div>

                  <!-- Notifications List -->
                  <div class="max-h-[380px] overflow-y-auto divide-y divide-[#E6EEF3]">
                    @for (notif of firebase.notifications(); track notif.id) {
                      <div
                        (click)="handleNotificationClick(notif)"
                        [class]="notif.isRead ? 'bg-white opacity-75' : 'bg-[#F0F8FF]/70'"
                        class="p-3.5 hover:bg-[#F3FAFD] transition-colors cursor-pointer flex gap-3 items-start">
                        
                        <!-- Type Icon -->
                        <div
                          [class]="notif.type === 'new_doc' ? 'bg-[#007CC2]/10 text-[#007CC2]' : (notif.type === 'qa_reply' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600')"
                          class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <span class="material-icons text-base">{{ notif.icon || 'notifications' }}</span>
                        </div>

                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between gap-1 mb-0.5">
                            <h4 class="text-xs font-semibold text-[#102A43] truncate">
                              {{ notif.title }}
                            </h4>
                            @if (!notif.isRead) {
                              <span class="w-2 h-2 rounded-full bg-[#007CC2] shrink-0"></span>
                            }
                          </div>
                          <p class="text-[11px] text-[#486581] line-clamp-2 leading-relaxed mb-1">
                            {{ notif.message }}
                          </p>
                          <span class="text-[10px] text-[#829AB1]">
                            {{ notif.createdAt }}
                          </span>
                        </div>
                      </div>
                    } @empty {
                      <div class="p-8 text-center text-[#829AB1]">
                        <span class="material-icons text-3xl mb-1 text-[#829AB1]/60">notifications_none</span>
                        <p class="text-xs">{{ lang.tr('Aucune notification pour le moment', 'لا توجد إشعارات حالياً') }}</p>
                      </div>
                    }
                  </div>

                  <!-- Footer Broadcast Action -->
                  <div class="p-2.5 bg-[#F7F9FB] border-t border-[#E6EEF3] text-center">
                    <button
                      type="button"
                      (click)="notifDropdownOpen.set(false); selectRole('parent')"
                      class="text-xs text-[#007CC2] font-semibold hover:underline cursor-pointer">
                      {{ lang.tr('Voir la banque de documents', 'عرض بنك الوثائق الرسمي') }} →
                    </button>
                  </div>

                </div>
              }
            </div>


            <!-- Language Toggle Pill -->
            <button
              (click)="lang.toggleLanguage()"
              [title]="lang.tr('Changer de langue', 'تغيير اللغة')"
              class="flex items-center gap-1.5 sm:gap-2 bg-white hover:bg-[#F3FAFD] text-[#102A43] border border-[#CBD9E2] px-2.5 sm:px-3 h-[38px] sm:h-[40px] rounded-[10px] text-xs font-semibold cursor-pointer transition-colors shrink-0 shadow-2xs">
              <span class="text-xs font-bold">{{ lang.isArabic() ? 'العربية' : 'Français' }}</span>
              <span class="material-icons text-xs text-[#829AB1]">translate</span>
            </button>

            <!-- User Profile Avatar & Dropdown Menu OR Connexion CTA Button -->
            @if (isUserLoggedIn()) {
              <div class="relative shrink-0">
                <button
                  type="button"
                  (click)="profileMenuOpen.set(!profileMenuOpen())"
                  class="flex items-center gap-1 p-0.5 rounded-full hover:ring-2 hover:ring-[#007CC2]/30 cursor-pointer transition-all shrink-0">
                  @if (getUserAvatar()) {
                    <img
                      [src]="getUserAvatar()!"
                      alt="User Avatar"
                      class="w-8 h-8 rounded-full object-cover border border-[#CBD9E2] shadow-2xs" />
                  } @else {
                    <div class="w-8 h-8 rounded-full bg-[#007CC2] text-white flex items-center justify-center font-bold text-xs">
                      {{ getUserName().charAt(0) }}
                    </div>
                  }
                  <span class="material-icons text-xs text-[#829AB1] transition-transform" [class.rotate-180]="profileMenuOpen()">expand_more</span>
                </button>

                <!-- Profile Dropdown Flyout Card -->
                @if (profileMenuOpen()) {
                  <div class="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-64 bg-white border border-[#CBD9E2] rounded-2xl shadow-xl p-2 z-50 text-xs space-y-1 animate-in">
                    
                    <!-- Top User Identification Block -->
                    <div
                      (click)="handleProfileClick()"
                      class="flex items-center justify-between p-2 rounded-xl hover:bg-[#F7F9FB] cursor-pointer transition-colors">
                      <div class="flex items-center gap-2.5 min-w-0">
                        @if (getUserAvatar()) {
                          <img
                            [src]="getUserAvatar()!"
                            alt="User"
                            class="w-9 h-9 rounded-full object-cover border border-[#CBD9E2] shrink-0" />
                        } @else {
                          <div class="w-9 h-9 rounded-full bg-[#007CC2] text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {{ getUserName().charAt(0) }}
                          </div>
                        }
                        <div class="min-w-0 text-left rtl:text-right">
                          <p class="font-display font-semibold text-[#102A43] text-xs truncate">
                            {{ getUserName() }}
                          </p>
                          <p class="text-[10px] text-[#007CC2] font-medium truncate">
                            {{ getUserSubtitle() }}
                          </p>
                        </div>
                      </div>
                      <span class="material-icons text-sm text-[#829AB1]">chevron_right</span>
                    </div>

                    <div class="border-t border-[#E6EEF3] my-1"></div>

                    <!-- Menu Actions -->
                    <button
                      type="button"
                      (click)="handleProfileClick()"
                      class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#102A43] hover:bg-[#F7F9FB] font-semibold cursor-pointer transition-colors text-left rtl:text-right">
                      <span class="material-icons text-base text-[#007CC2]">person</span>
                      <span>{{ lang.tr('Mon profil', 'ملفي الشخصي') }}</span>
                    </button>

                    <button
                      type="button"
                      (click)="handleProfileClick()"
                      class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#102A43] hover:bg-[#F7F9FB] font-semibold cursor-pointer transition-colors text-left rtl:text-right">
                      <span class="material-icons text-base text-[#007CC2]">settings</span>
                      <span>{{ lang.tr('Paramètres', 'الإعدادات') }}</span>
                    </button>

                    <button
                      type="button"
                      (click)="profileMenuOpen.set(false); selectRole('public')"
                      class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#102A43] hover:bg-[#F7F9FB] font-semibold cursor-pointer transition-colors text-left rtl:text-right">
                      <span class="material-icons text-base text-[#007CC2]">help</span>
                      <span>{{ lang.tr('Aide & Documentation', 'المساعدة والدليل') }}</span>
                    </button>

                    <div class="border-t border-[#E6EEF3] my-1"></div>

                    <button
                      type="button"
                      (click)="profileMenuOpen.set(false); handleLogout()"
                      class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#D64545] hover:bg-rose-50 font-semibold cursor-pointer transition-colors text-left rtl:text-right">
                      <span class="material-icons text-base text-[#D64545]">logout</span>
                      <span>{{ lang.tr('Se déconnecter', 'تسجيل الخروج') }}</span>
                    </button>
                  </div>
                }
              </div>
            } @else {
              <!-- Guest / Unauthenticated State: Clean Login CTA Button -->
              <button
                type="button"
                (click)="store.openLoginModal()"
                class="flex items-center gap-1.5 bg-[#007CC2] hover:bg-[#006EAD] text-white font-semibold px-3 sm:px-3.5 h-[38px] sm:h-[40px] rounded-[10px] text-xs transition-colors cursor-pointer shrink-0 shadow-2xs">
                <span class="material-icons text-sm sm:text-base">login</span>
                <span class="font-bold">{{ lang.tr('Connexion', 'دخول') }}</span>
              </button>
            }

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
  readonly notifDropdownOpen = signal<boolean>(false);

  async handleNotificationClick(notif: any) {
    await this.firebase.markNotificationAsRead(notif.id);
    this.notifDropdownOpen.set(false);
    if (notif.linkRole) {
      this.store.switchRole(notif.linkRole);
    }
  }

  selectRole(role: UserRole) {
    this.store.switchRole(role);
  }

  isUserLoggedIn(): boolean {
    return !!(this.firebase.userProfile() || this.firebase.currentUser());
  }

  handleProfileClick() {
    this.profileMenuOpen.set(false);
    if (!this.isUserLoggedIn()) {
      this.store.openLoginModal();
      return;
    }
    const role = this.firebase.userProfile()?.role || 'teacher';
    this.store.switchRole(role);
    if (role === 'teacher') {
      this.store.openTeacherProfileModal();
    }
  }

  async handleLogout() {
    await this.firebase.logout();
    this.store.clearUserSession();
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
    return this.lang.tr('Espace Membre', 'فضاء العضوية');
  }

  getUserSubtitle(): string {
    const profile = this.firebase.userProfile();
    if (profile?.role === 'teacher') return this.lang.tr('Enseignante Certifiée', 'معلمة معتمدة');
    if (profile?.role === 'parent') return this.lang.tr('Parent Référent', 'ولي أمر متابع');
    if (profile?.role === 'student') return this.lang.tr('Élève', 'تلميذ');
    return this.lang.tr('Non connecté', 'غير متصل');
  }

  getUserAvatar(): string | null {
    const profile = this.firebase.userProfile();
    if (profile?.photoURL) return profile.photoURL;
    const user = this.firebase.currentUser();
    if (user?.photoURL) return user.photoURL;
    return null;
  }
}
