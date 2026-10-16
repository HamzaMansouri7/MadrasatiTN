import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { LanguageService, StudioSessionRegistry } from '@core';
import { CREATE_TABS } from './components/create-tabs';

/** Creation tool a URL belongs to (same keys as the studio sessions), or null. */
function toolKeyOf(url: string): string | null {
  const [path, query = ''] = url.split('?');
  const params = new URLSearchParams(query.split('#')[0]);
  return CREATE_TABS.find((t) => t.match(path, params))?.key ?? null;
}

/**
 * Asks before leaving a creation tool that holds unsaved input or a running generation.
 * Moves that stay inside the same tool (e.g. /lesson-plan/new → /lesson-plan/:id) pass.
 */
export const studioLeaveGuard: CanDeactivateFn<unknown> = (_component, _route, _current, next) => {
  if (typeof window === 'undefined') return true;
  const target = toolKeyOf(next.url);
  const pending = inject(StudioSessionRegistry).unsaved().filter((s) => s.key !== target);
  if (pending.length === 0) return true;

  const lang = inject(LanguageService);
  const message = pending.some((s) => s.busy())
    ? lang.tr('Une génération est en cours. Quitter la page l’arrêtera. Quitter quand même ?', 'التوليد جارٍ. مغادرة الصفحة ستوقفه. هل تريد المغادرة؟')
    : lang.tr('Votre travail n’est pas enregistré dans votre compte. Quitter quand même ?', 'عملك غير محفوظ في حسابك. هل تريد المغادرة؟');
  return window.confirm(message);
};
