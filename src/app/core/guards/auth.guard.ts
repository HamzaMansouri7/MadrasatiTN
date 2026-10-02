import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { EducationStore } from '../services/education-store';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const authGuard: CanActivateFn = (_route, _state) => {
  const firebase = inject(FirebaseService);
  const store = inject(EducationStore);
  const router = inject(Router);

  const user = firebase.userProfile() || firebase.currentUser();

  if (user) {
    return true;
  }

  // Preserve intended destination & prompt authentication
  store.openLoginModal();
  router.navigateByUrl('/');
  return false;
};
