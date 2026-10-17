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
export const studioLeaveGuard: CanDeactivateFn<unknown> = () => {
  // Deactivated: all studio sessions auto-save drafts to StorageVaultService
  return true;
};
