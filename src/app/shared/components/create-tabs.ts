import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { LanguageService } from '@core';

interface CreateTab {
  key: string;
  icon: string;
  fr: string;
  ar: string;
  path: string;
  query?: Record<string, string>;
  /** True when the current path + query belong to this tool. */
  match: (path: string, params: URLSearchParams) => boolean;
}

/** Tools reachable from "مركز الإنشاء". Each is its own page; this bar is the only way between them. */
export const CREATE_TABS: CreateTab[] = [
  {
    key: 'infographic', icon: 'dashboard_customize', fr: 'Infographie', ar: 'إنفوغرافيا',
    path: '/ai-studio', query: { tab: 'infographic' },
    match: (p, q) => p === '/ai-studio' && q.get('tab') !== 'memo',
  },
  {
    key: 'memo', icon: 'note_alt', fr: 'Synthèse', ar: 'ملخّص',
    path: '/ai-studio', query: { tab: 'memo' },
    match: (p, q) => p === '/ai-studio' && q.get('tab') === 'memo',
  },
  {
    key: 'lesson-plan', icon: 'view_timeline', fr: 'Fiche pédagogique', ar: 'جذاذة',
    path: '/lesson-plan/new',
    match: (p) => p.startsWith('/lesson-plan'),
  },
  {
    key: 'exercises', icon: 'quiz', fr: 'Devoirs & exercices', ar: 'امتحانات وتمارين',
    path: '/editor', query: { type: 'exercise_sheet' },
    match: (p) => p === '/editor',
  },
  {
    key: 'series', icon: 'auto_stories', fr: 'Série illustrée', ar: 'سلسلة مصورة',
    path: '/series/new',
    match: (p) => p.startsWith('/series'),
  },
  {
    key: 'article', icon: 'article', fr: 'Article', ar: 'مقال',
    path: '/article-studio',
    match: (p) => p === '/article-studio',
  },
  {
    key: 'solve', icon: 'photo_camera', fr: 'Résoudre en photo', ar: 'حلّ بالصورة',
    path: '/solve',
    match: (p) => p === '/solve',
  },
  {
    key: 'similar', icon: 'auto_fix_high', fr: 'Fiche similaire', ar: 'ورقة مشابهة',
    path: '/generate',
    match: (p) => p === '/generate',
  },
];

/** Paths that show the creation tab bar (see app.html). */
export function isCreatePath(url: string): boolean {
  const [path, query = ''] = url.split('?');
  const params = new URLSearchParams(query);
  return CREATE_TABS.some((t) => t.match(path, params));
}

@Component({
  selector: 'app-create-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <nav class="no-print -mt-2 mb-5 border-b border-[#E7DFCF] overflow-x-auto" [attr.aria-label]="lang.tr('Outils de création', 'أدوات الإنشاء')">
      <div class="flex gap-x-1 min-w-max">
        @for (t of tabs; track t.key) {
          <a
            [routerLink]="t.path"
            [queryParams]="t.query ?? null"
            [attr.aria-current]="activeKey() === t.key ? 'page' : null"
            [class]="activeKey() === t.key ? 'text-[#1B4332] border-[#2D6A4F]' : 'text-[#5B6B60] hover:text-[#14251D] border-transparent'"
            class="px-4 min-h-11 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-[#2D6A4F]">
            <span class="material-icons text-base" aria-hidden="true">{{ t.icon }}</span>
            {{ lang.tr(t.fr, t.ar) }}
          </a>
        }
      </div>
    </nav>
  `,
})
export class CreateTabsComponent {
  readonly lang = inject(LanguageService);
  private readonly router = inject(Router);

  readonly tabs = CREATE_TABS;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly activeKey = computed(() => {
    const [path, query = ''] = this.url().split('?');
    const params = new URLSearchParams(query);
    return this.tabs.find((t) => t.match(path, params))?.key ?? null;
  });
}
