import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { EducationStore } from '../services/education-store';
import { guestMayOpen } from './guest-share';

export const authGuard: CanActivateFn = (route) => {
  const firebase = inject(FirebaseService);
  const store = inject(EducationStore);
  const router = inject(Router);

  // Shared links stay viewable without login, but only on the page that serves them.
  if (guestMayOpen(route.routeConfig?.path, (name) => route.queryParamMap.has(name))) {
    return true;
  }

  const user = firebase.userProfile() || firebase.currentUser();

  if (user) {
    return true;
  }

  // Preserve intended destination & prompt authentication
  store.openLoginModal();
  router.navigateByUrl('/');
  return false;
};
