import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { EducationStore, LanguageService, FirebaseService, UserRole } from '@core';
import { NavbarComponent, AuthModalComponent, ToastComponent } from '@shared';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NavbarComponent,
    RouterOutlet,
    AuthModalComponent,
    ToastComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  readonly firebase = inject(FirebaseService);
  private readonly router = inject(Router);

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
          '/student': 'student',
          '/discovery': 'public',
          '/bd': 'public',
          '/editor': 'editor',
          '/generate': 'editor',
          '/article-studio': 'article-editor',
          '/studio': 'article-editor',
        };
        const matchedRole = routeToRoleMap[path];
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

