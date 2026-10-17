import { CanDeactivateFn } from '@angular/router';

/**
 * Leaving a creation tool never asks: every studio session auto-saves its draft
 * (StorageVaultService), so nothing is lost on navigation.
 */
export const studioLeaveGuard: CanDeactivateFn<unknown> = () => true;
