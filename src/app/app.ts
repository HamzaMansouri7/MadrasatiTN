import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { EducationStore, LanguageService, FirebaseService, UserRole } from '@core';
import { NavbarComponent, AuthModalComponent, ToastComponent, CreateTabsComponent, isCreatePath } from '@shared';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NavbarComponent,
    RouterOutlet,
    AuthModalComponent,
    ToastComponent,
    CreateTabsComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  readonly firebase = inject(FirebaseService);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: '' },
  );

  /** The creation tools share one tab bar (no hub page); parents never see it. */
  readonly showCreateTabs = computed(
    () => isCreatePath(this.url()) && this.firebase.userProfile()?.role !== 'parent',
  );

  constructor() {
    // When Google redirect authentication finishes, route to user's assigned role
    effect(() => {
      const redirectedProfile = this.firebase.onRedirectAuth();
      if (redirectedProfile) {
        this.store.switchRole(redirectedProfile.role);
      }
    });

    // Keep store currentRole synchronized when user navigates directly via URL or browser Back/Forward
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const path = event.urlAfterRedirects.split('?')[0];
        const routeToRoleMap: Record<string, UserRole> = {
          '/': 'home',
          '/teacher': 'teacher',
          '/parent': 'parent',
          '/discovery': 'public',
          '/solve': 'public',
          '/teachers': 'public',
          '/editor': 'editor',
          '/create': 'editor',
          '/generate': 'editor',
          '/ai-studio': 'editor',
          '/article-studio': 'article-editor',
          '/studio': 'editor',
        };
        const matchedRole = routeToRoleMap[path] ?? (/^\/(lesson-plan|series|parascolaire)(\/|$)/.test(path) ? ('public' as UserRole) : undefined);
        if (matchedRole && this.store.currentRole() !== matchedRole) {
          this.store.currentRole.set(matchedRole);
        }
      });

    // Phase 3 — resolve a shared deep link (?doc=ID or ?blog=ID) on initial load.
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const docId = searchParams.get('doc');
      const blogId = searchParams.get('blog');
      if (docId && !this.store.pendingDocId()) {
        this.store.openSharedDoc(docId);
      } else if (blogId && !this.store.selectedBlogPost()) {
        this.store.openSharedBlogPost(blogId);
      }
    }
  }
}

