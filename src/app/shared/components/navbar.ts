import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { EducationStore, LanguageService, FirebaseService, NotificationService, NotificationItem, UserRole } from '@core';
import { TimeAgoPipe } from '../pipes/time-ago.pipe';
import { TeacherAvatarComponent } from './teacher-avatar';

interface NavItem {
  path: string;
  /** URL prefixes that mark this link as the current page. */
  match: string[];
  icon: string;
  fr: string;
  ar: string;
  compact?: boolean;
}

function stripUrl(url: string): string {
  return url.split(/[?#]/)[0] || '/';
}

@Component({
  selector: 'app-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TimeAgoPipe, TeacherAvatarComponent],
  template: `
    <header class="sticky top-0 z-40 bg-white border-b border-[#E7DFCF] transition-colors">
      <div class="w-full max-w-full mx-auto px-3 sm:px-6 lg:px-8 xl:px-10">
        <div class="flex items-center justify-between h-[76px] gap-2 lg:gap-4">
          
          <!-- Logo & Platform Identity -->
          <a routerLink="/" [attr.aria-label]="lang.t('brandName')" class="flex items-center gap-2.5 sm:gap-3 shrink-0 cursor-pointer group rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]">
            <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-[12px] overflow-hidden flex items-center justify-center shadow-sm shrink-0 group-hover:scale-102 transition-transform border border-[#E7DFCF]">
              <img src="/logo.jpg" alt="Madrasati Logo" class="w-full h-full object-cover" />
            </div>
            <div>
              <div class="flex items-center gap-1.5 sm:gap-2">
                <span class="font-display font-bold text-[#14251D] text-sm sm:text-base xl:text-lg tracking-tight whitespace-nowrap">
                  {{ lang.t('brandName') }}
                </span>
                <span class="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F2ECDE] text-[#2D6A4F] border border-[#2D6A4F]/20 shrink-0">
                  <span class="font-black">TN</span>
                </span>
              </div>
              <p class="text-[10px] sm:text-[11px] text-[#5B6B60] font-medium leading-none hidden 2xl:block mt-0.5">
                {{ lang.t('brandSub') }}
              </p>
            </div>
          </a>

          <!-- Main navigation: real links, active state from the URL -->
          <nav [attr.aria-label]="lang.tr('Navigation principale', 'التصفح الرئيسي')" class="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0 h-[76px]">
            @for (item of navItems; track item.path) {
              <a
                [routerLink]="item.path"
                [attr.aria-current]="isActive(item.match) ? 'page' : null"
                [attr.title]="lang.tr(item.fr, item.ar)"
                [class]="isActive(item.match) ? tabActive : tabIdle"
                class="flex items-center gap-1.5 px-2.5 xl:px-3 h-[44px] rounded-lg text-xs transition-colors focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
                <span class="material-icons text-base xl:text-lg" aria-hidden="true">{{ item.icon }}</span>
                <span [class]="item.compact ? 'sr-only 2xl:not-sr-only' : ''">{{ lang.tr(item.fr, item.ar) }}</span>
              </a>
            }

            @if (firebase.userProfile()?.role === 'teacher') {
              <a
                routerLink="/create"
                [attr.aria-current]="isActive(studioPaths) ? 'page' : null"
                [class]="isActive(studioPaths) ? 'bg-[#1B4332]' : 'bg-[#2D6A4F] hover:bg-[#1B4332]'"
                class="flex items-center gap-1.5 px-3.5 h-[40px] rounded-xl text-xs font-semibold text-[#FBF8F1] shadow-sm transition-colors mx-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]">
                <span class="material-icons text-base" aria-hidden="true">auto_fix_high</span>
                <span>{{ lang.tr('Créer / Studio', 'مركز الإنشاء') }}</span>
              </a>
            }

            <a
              routerLink="/teacher"
              [attr.aria-current]="isActive(['/teacher']) ? 'page' : null"
              [class]="isActive(['/teacher']) ? tabActive : tabIdle"
              class="flex items-center gap-1.5 px-2.5 xl:px-3 h-[44px] rounded-lg text-xs transition-colors focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
              <span class="material-icons text-base xl:text-lg" aria-hidden="true">school</span>
              <span>{{ lang.t('roleTeacher') }}</span>
            </a>

            <a
              routerLink="/parent"
              [attr.aria-current]="isActive(['/parent']) ? 'page' : null"
              [class]="isActive(['/parent'])
                ? 'text-[#8A5A00] font-semibold border-b-[3px] border-[#8A5A00] bg-[#8A5A00]/10'
                : tabIdle"
              class="flex items-center gap-1.5 px-2.5 xl:px-3 h-[44px] rounded-lg text-xs transition-colors focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
              <span class="material-icons text-base xl:text-lg" aria-hidden="true">family_restroom</span>
              <span>{{ lang.t('roleParent') }}</span>
            </a>
          </nav>

          <!-- Right Action Bar: Search + Notifications + Language + Profile Avatar -->
          <div class="flex items-center gap-1.5 sm:gap-2 xl:gap-3 ms-auto shrink-0">
            
            <!-- Global Quick Search Input -->
            <div class="hidden 2xl:flex items-center relative">
              <span class="material-icons absolute left-3.5 rtl:left-auto rtl:right-3.5 text-base text-[#6B7A70] pointer-events-none">search</span>
              <input
                type="text"
                [value]="store.searchQuery()"
                (input)="store.searchQuery.set($any($event.target).value)"
                [placeholder]="lang.tr('Rechercher...', 'بحث...')"
                class="w-36 2xl:w-48 pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 h-[40px] bg-[#FBF8F1] hover:bg-white focus:bg-white text-[#14251D] text-xs rounded-[10px] border border-[#E7DFCF] focus:border-[#2D6A4F] focus:ring-3 focus:ring-[#F2ECDE] outline-none transition-all placeholder-[#6B7A70]" />
            </div>

            <!-- Notifications Bell & Dropdown Flyout -->
            <div class="relative shrink-0">
              <button
                type="button"
                (click)="notifDropdownOpen.set(!notifDropdownOpen()); profileMenuOpen.set(false)"
                [title]="lang.t('notifTitleOfficial')"
                [attr.aria-label]="lang.t('notifTitleOfficial') + ' (' + notifService.unreadCount() + ')'"
                class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-white hover:bg-[#F2ECDE] text-[#14251D] border border-[#E7DFCF] flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-2xs">
                <span class="material-icons text-base sm:text-lg text-[#14251D]">notifications</span>
                @if (notifService.unreadCount() > 0) {
                  <span class="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#BF5B34] text-white text-[9px] font-bold flex items-center justify-center shadow-xs motion-safe:animate-pulse">
                    {{ unreadBadgeText() }}
                  </span>
                }
              </button>

              <!-- Notification Dropdown Panel -->
              @if (notifDropdownOpen()) {
                <div class="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-84 sm:w-96 bg-white border border-[#E7DFCF] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in">
                  
                  <!-- Header -->
                  <div class="p-3 bg-[#FBF8F1] border-b border-[#E7DFCF]">
                    <div class="flex items-center justify-between gap-2 mb-2">
                      <div class="flex items-center gap-1.5">
                        <span class="material-icons text-base text-[#2D6A4F]">notifications_active</span>
                        <span class="font-display font-bold text-xs sm:text-sm text-[#14251D]">
                          {{ lang.t('notifTitleOfficial') }}
                        </span>
                        @if (notifService.unreadCount() > 0) {
                          <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F2ECDE] text-[#2D6A4F]">
                            {{ notifService.unreadCount() }} {{ lang.t('notifTabUnread') }}
                          </span>
                        }
                      </div>

                      @if (notifService.unreadCount() > 0) {
                        <button
                          type="button"
                          (click)="notifService.markAllRead()"
                          class="text-[11px] text-[#2D6A4F] hover:underline font-semibold cursor-pointer">
                          {{ lang.t('notifMarkAllRead') }}
                        </button>
                      }
                    </div>

                    <!-- Filter Tabs -->
                    <div class="flex items-center gap-1 bg-[#F2ECDE]/80 p-0.5 rounded-lg text-[11px]">
                      <button
                        type="button"
                        (click)="activeNotifTab.set('all')"
                        [class]="activeNotifTab() === 'all' ? 'bg-white text-[#14251D] font-bold shadow-xs' : 'text-[#5B6B60] hover:text-[#14251D]'"
                        class="flex-1 py-1 rounded-md text-center transition-all cursor-pointer">
                        {{ lang.t('notifTabAll') }}
                      </button>
                      <button
                        type="button"
                        (click)="activeNotifTab.set('unread')"
                        [class]="activeNotifTab() === 'unread' ? 'bg-white text-[#14251D] font-bold shadow-xs' : 'text-[#5B6B60] hover:text-[#14251D]'"
                        class="flex-1 py-1 rounded-md text-center transition-all cursor-pointer">
                        {{ lang.t('notifTabUnread') }}
                      </button>
                      <button
                        type="button"
                        (click)="activeNotifTab.set('announcements')"
                        [class]="activeNotifTab() === 'announcements' ? 'bg-white text-[#14251D] font-bold shadow-xs' : 'text-[#5B6B60] hover:text-[#14251D]'"
                        class="flex-1 py-1 rounded-md text-center transition-all cursor-pointer">
                        {{ lang.t('notifTabAnnounce') }}
                      </button>
                    </div>
                  </div>

                  <!-- Notifications List -->
                  <div class="max-h-[380px] overflow-y-auto divide-y divide-[#E7DFCF]">
                    @for (notif of filteredNotifications(); track notif.id) {
                      <div
                        (click)="handleNotificationClick(notif)"
                        (keydown.enter)="handleNotificationClick(notif)"
                        role="button"
                        tabindex="0"
                        [class]="notif.isRead ? 'bg-white opacity-75' : 'bg-[#FBF8F1]/80 font-medium'"
                        class="group p-3 hover:bg-[#F2ECDE] transition-colors cursor-pointer flex gap-2.5 items-start text-start">
                        
                        <!-- Type Icon -->
                        <div
                          [class]="notif.category === 'announcement' ? 'bg-amber-500/10 text-amber-600' : 'bg-[#2D6A4F]/10 text-[#2D6A4F]'"
                          class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <span class="material-icons text-base">{{ notif.icon || 'notifications' }}</span>
                        </div>

                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between gap-1 mb-0.5">
                            <div class="flex items-center gap-1.5 truncate">
                              <h4 class="text-xs font-semibold text-[#14251D] truncate">
                                {{ lang.t(notif.titleKey, notif.params) }}
                              </h4>
                              @if (!notif.isRead && notif.category === 'announcement') {
                                <span class="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-[#BF5B34] text-white uppercase tracking-wider shrink-0">
                                  {{ lang.t('notifBadgeNew') }}
                                </span>
                              }
                            </div>
                            @if (!notif.isRead) {
                              <span class="w-2 h-2 rounded-full bg-[#2D6A4F] shrink-0"></span>
                            }
                          </div>
                          <p class="text-[11px] text-[#5B6B60] line-clamp-2 leading-relaxed mb-1">
                            {{ lang.t(notif.messageKey, notif.params) }}
                          </p>
                          <div class="flex items-center justify-between text-[10px] text-[#6B7A70]">
                            <span>{{ notif.createdAt | timeAgo }}</span>
                            <!-- Dismiss Action -->
                            <button
                              type="button"
                              (click)="$event.stopPropagation(); notifService.dismiss(notif.id)"
                              [title]="lang.t('notifDismiss')"
                              class="opacity-0 group-hover:opacity-100 text-[#6B7A70] hover:text-[#BF5B34] transition-opacity cursor-pointer p-0.5">
                              <span class="material-icons text-xs">close</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    } @empty {
                      <div class="p-8 text-center text-[#6B7A70]">
                        <span class="material-icons text-3xl mb-1 text-[#6B7A70]/60">notifications_none</span>
                        <p class="text-xs">{{ lang.t('notifEmpty') }}</p>
                      </div>
                    }
                  </div>

                  <!-- Footer Broadcast Action -->
                  <div class="p-2.5 bg-[#FBF8F1] border-t border-[#E7DFCF] text-center">
                    <a
                      routerLink="/discovery"
                      (click)="notifDropdownOpen.set(false)"
                      class="text-xs text-[#8A5A00] hover:text-[#C1121F] font-semibold underline underline-offset-4 decoration-[#E7DFCF]">
                      {{ lang.tr('Voir la banque de documents', 'عرض بنك الوثائق الرسمي') }}
                    </a>
                  </div>

                </div>
              }
            </div>


            <!-- Language Toggle Pill -->
            <button
              type="button"
              (click)="lang.toggleLanguage()"
              [title]="lang.t('changeLanguage')"
              class="flex items-center gap-1.5 bg-white hover:bg-[#F2ECDE] text-[#14251D] border border-[#E7DFCF] px-2.5 sm:px-3 h-[38px] sm:h-[40px] rounded-[10px] text-xs font-semibold cursor-pointer transition-colors shrink-0 shadow-2xs">
              <span [class.text-[#2D6A4F]]="lang.isArabic()" [class.font-bold]="lang.isArabic()" [class.opacity-50]="!lang.isArabic()">عربي</span>
              <span class="text-[#E7DFCF]">|</span>
              <span [class.text-[#2D6A4F]]="!lang.isArabic()" [class.font-bold]="!lang.isArabic()" [class.opacity-50]="lang.isArabic()">FR</span>
              <span class="material-icons text-xs text-[#6B7A70] ml-0.5">translate</span>
            </button>

            <!-- User Profile Avatar & Dropdown Menu OR Connexion CTA Button -->
            @if (isUserLoggedIn()) {
              <div class="relative shrink-0">
                <button
                  type="button"
                  (click)="profileMenuOpen.set(!profileMenuOpen())"
                  class="flex items-center gap-1 p-0.5 rounded-full hover:ring-2 hover:ring-[#2D6A4F]/30 cursor-pointer transition-all shrink-0">
                  <app-user-avatar [avatarUrl]="getUserAvatar()" [name]="getUserName()" size="sm" />
                  <span class="material-icons text-xs text-[#6B7A70] transition-transform" [class.rotate-180]="profileMenuOpen()">expand_more</span>
                </button>

                <!-- Profile Dropdown Flyout Card -->
                @if (profileMenuOpen()) {
                  <div class="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-64 bg-white border border-[#E7DFCF] rounded-2xl shadow-sm p-2 z-50 text-xs space-y-1 animate-in">
                    
                    <!-- Top User Identification Block -->
                    <div
                      (click)="handleProfileClick()"
                      (keydown.enter)="handleProfileClick()"
                      role="button"
                      tabindex="0"
                      class="flex items-center justify-between p-2 rounded-xl hover:bg-[#FBF8F1] cursor-pointer transition-colors">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <app-user-avatar [avatarUrl]="getUserAvatar()" [name]="getUserName()" size="md" />
                        <div class="min-w-0 text-left rtl:text-right">
                          <p class="font-display font-semibold text-[#14251D] text-xs truncate">
                            {{ getUserName() }}
                          </p>
                          <p class="text-[10px] text-[#2D6A4F] font-medium truncate">
                            {{ getUserSubtitle() }}
                          </p>
                        </div>
                      </div>
                      <span class="material-icons text-sm text-[#6B7A70]">chevron_right</span>
                    </div>

                    <div class="border-t border-[#E7DFCF] my-1"></div>

                    <!-- Menu Actions -->
                    <button
                      type="button"
                      (click)="handleProfileClick('profile')"
                      class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#14251D] hover:bg-[#FBF8F1] font-semibold cursor-pointer transition-colors text-left rtl:text-right">
                      <span class="material-icons text-base text-[#2D6A4F]">person</span>
                      <span>{{ lang.tr('Mon profil', 'ملفي الشخصي') }}</span>
                    </button>

                    <button
                      type="button"
                      (click)="handleProfileClick('settings')"
                      class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#14251D] hover:bg-[#FBF8F1] font-semibold cursor-pointer transition-colors text-left rtl:text-right">
                      <span class="material-icons text-base text-[#2D6A4F]">settings</span>
                      <span>{{ lang.tr('Paramètres', 'الإعدادات') }}</span>
                    </button>

                    <div class="border-t border-[#E7DFCF] my-1"></div>

                    <button
                      type="button"
                      (click)="profileMenuOpen.set(false); handleLogout()"
                      class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#BF5B34] hover:bg-[#BF5B34]/10 font-semibold cursor-pointer transition-colors text-left rtl:text-right">
                      <span class="material-icons text-base text-[#BF5B34]">logout</span>
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
                class="flex items-center gap-1.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold px-3 sm:px-3.5 h-[38px] sm:h-[40px] rounded-[10px] text-xs transition-colors cursor-pointer shrink-0 shadow-2xs">
                <span class="material-icons text-sm sm:text-base">login</span>
                <span class="font-bold">{{ lang.tr('Connexion', 'دخول') }}</span>
              </button>
            }

          </div>

        </div>

        <!-- Mobile navigation bar (44px touch targets) -->
        <nav [attr.aria-label]="lang.tr('Navigation principale', 'التصفح الرئيسي')" class="flex lg:hidden items-center justify-around py-1.5 gap-1 border-t border-[#E7DFCF] text-xs">
          @for (item of mobileItems(); track item.path) {
            <a
              [routerLink]="item.path"
              [attr.aria-current]="isActive(item.match) ? 'page' : null"
              [class]="isActive(item.match) ? 'text-[#1B4332] font-semibold bg-[#2D6A4F]/10' : 'text-[#5B6B60]'"
              class="flex flex-col items-center justify-center min-h-[44px] min-w-[54px] rounded-lg px-2 transition-colors focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
              <span class="material-icons text-base" aria-hidden="true">{{ item.icon }}</span>
              <span class="text-[11px] leading-tight">{{ lang.tr(item.fr, item.ar) }}</span>
            </a>
          }
        </nav>

      </div>
    </header>
  `,
})
export class NavbarComponent {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  readonly firebase = inject(FirebaseService);
  readonly notifService = inject(NotificationService);
  readonly router = inject(Router);
  readonly profileMenuOpen = signal<boolean>(false);
  readonly notifDropdownOpen = signal<boolean>(false);
  readonly activeNotifTab = signal<'all' | 'unread' | 'announcements'>('all');

  readonly filteredNotifications = computed<NotificationItem[]>(() => {
    const tab = this.activeNotifTab();
    const all = this.notifService.visible();
    if (tab === 'unread') return all.filter((n) => !n.isRead);
    if (tab === 'announcements') return all.filter((n) => n.category === 'announcement');
    return all;
  });

  readonly unreadBadgeText = computed<string>(() => {
    const count = this.notifService.unreadCount();
    return count > 99 ? '99+' : count.toString();
  });

  private knownNotifIds = new Set<string>();
  private initialNotifsLoaded = false;

  constructor() {
    effect(() => {
      const items = this.notifService.visible();
      if (!this.initialNotifsLoaded) {
        items.forEach((i) => this.knownNotifIds.add(i.id));
        this.initialNotifsLoaded = true;
        return;
      }

      // Notify only for newly arrived items
      for (const item of items) {
        if (!this.knownNotifIds.has(item.id)) {
          this.knownNotifIds.add(item.id);
          if (!item.isRead) {
            const title = this.lang.t(item.titleKey, item.params);
            this.store.showToast(title, 'info');
          }
        }
      }
    });
  }

  readonly tabActive = 'text-[#1B4332] font-semibold border-b-[3px] border-[#2D6A4F] bg-[#2D6A4F]/10';
  readonly tabIdle = 'text-[#5B6B60] hover:text-[#14251D] hover:bg-[#F2ECDE] font-medium border-b-[3px] border-transparent';
  readonly studioPaths = ['/create', '/editor', '/ai-studio', '/memo-studio', '/article-studio', '/generate'];

  /** Desktop links. `compact` items show only their icon below 2xl (label kept for screen readers). */
  readonly navItems: NavItem[] = [
    { path: '/discovery', match: ['/discovery'], icon: 'explore', fr: 'Bibliothèque CNP', ar: 'المكتبة والدليل' },
    { path: '/programme', match: ['/programme'], icon: 'account_tree', fr: 'Programme officiel', ar: 'البرنامج البيداغوجي' },
    { path: '/solve', match: ['/solve'], icon: 'photo_camera', fr: 'Photo-solution', ar: 'حلّ تمرين بالصورة', compact: true },
    { path: '/teachers', match: ['/teachers'], icon: 'groups', fr: 'Enseignants', ar: 'المعلمون', compact: true },
  ];

  readonly mobileItems = computed<NavItem[]>(() => {
    const role = this.firebase.userProfile()?.role;
    const items: NavItem[] = [
      { path: '/', match: ['/'], icon: 'home', fr: 'Accueil', ar: 'الرئيسية' },
      { path: '/discovery', match: ['/discovery'], icon: 'explore', fr: 'Bibliothèque', ar: 'المكتبة' },
      { path: '/solve', match: ['/solve'], icon: 'photo_camera', fr: 'Solution', ar: 'حلّ تمرين' },
    ];
    if (role === 'teacher') {
      items.push({ path: '/create', match: this.studioPaths, icon: 'auto_fix_high', fr: 'Créer', ar: 'إنشاء' });
    }
    const space = role === 'parent' ? '/parent' : '/teacher';
    items.push({ path: space, match: [space], icon: 'person', fr: 'Mon espace', ar: 'فضاءك' });
    return items;
  });

  /** Current path without query string or fragment, updated on every navigation. */
  private readonly path = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => stripUrl(e.urlAfterRedirects)),
    ),
    { initialValue: stripUrl(this.router.url) },
  );

  isActive(prefixes: string[]): boolean {
    const path = this.path();
    return prefixes.some((p) => (p === '/' ? path === '/' : path === p || path.startsWith(p + '/')));
  }

  async handleNotificationClick(notif: NotificationItem) {
    await this.notifService.markRead(notif.id);
    this.notifDropdownOpen.set(false);

    if (notif.routeUrl) {
      const queryParams: Record<string, string> = {};
      if (notif.targetDocId) queryParams['doc'] = notif.targetDocId;
      if (notif.targetThreadId) {
        queryParams['thread'] = notif.targetThreadId;
        queryParams['tab'] = notif.tab || 'qa';
      }
      this.router.navigate([notif.routeUrl], { queryParams });
      return;
    }

    if (notif.targetRole && notif.targetRole !== 'all') {
      this.store.switchRole(notif.targetRole);
    }
  }

  selectRole(role: UserRole) {
    // Public-first: parent space is free browsing — no signup wall on entry;
    // login is prompted inside only for gated actions (ask question, comment).
    if (role === 'home' || role === 'public' || role === 'parent') {
      this.store.switchRole(role);
      return;
    }
    if (!this.isUserLoggedIn()) {
      this.store.openSignupModal(role as 'teacher' | 'parent');
      return;
    }
    this.store.switchRole(role);
  }

  isUserLoggedIn(): boolean {
    return !!(this.firebase.userProfile() || this.firebase.currentUser());
  }

  handleProfileClick(tab?: string) {
    this.profileMenuOpen.set(false);
    if (!this.isUserLoggedIn()) {
      this.store.openLoginModal();
      return;
    }
    if (tab) {
      void this.router.navigate(['/profile'], { queryParams: { tab } });
    } else {
      void this.router.navigate(['/profile']);
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
