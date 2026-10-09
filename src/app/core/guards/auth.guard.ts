import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { EducationStore } from '../services/education-store';

export const authGuard: CanActivateFn = (_route, _state) => {
  const firebase = inject(FirebaseService);
  const store = inject(EducationStore);
  const router = inject(Router);

  // Allow read-only access to shared resources without login gate
  if (
    _route.queryParamMap.has('sheet') ||
    _route.queryParamMap.has('memo') ||
    _route.queryParamMap.has('doc') ||
    _route.queryParamMap.has('topicId')
  ) {
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
