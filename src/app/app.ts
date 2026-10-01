import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { EducationStore, LanguageService, UserRole } from '@core';
import { NavbarComponent, AuthModalComponent } from '@shared';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NavbarComponent,
    RouterOutlet,
    AuthModalComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly store = inject(EducationStore);
  readonly lang = inject(LanguageService);
  private readonly router = inject(Router);

  constructor() {
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
          '/editor': 'editor',
          '/article-studio': 'article-editor',
          '/studio': 'article-editor',
        };
        const matchedRole = routeToRoleMap[path];
        if (matchedRole && this.store.currentRole() !== matchedRole) {
          this.store.currentRole.set(matchedRole);
        }
      });
  }
}

