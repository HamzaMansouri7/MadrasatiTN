import { Injectable, signal } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  Auth,
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  Firestore,
  doc,
  getDocFromServer,
  getFirestore,
} from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';
import { UserRole } from '../models/education.model';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: UserRole;
  school?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  readonly app = initializeApp(firebaseConfig);
  readonly db: Firestore = getFirestore(this.app, firebaseConfig.firestoreDatabaseId);
  readonly auth: Auth = getAuth(this.app);

  readonly currentUser = signal<User | null>(null);
  readonly userProfile = signal<UserProfile | null>(null);
  readonly isAuthLoading = signal<boolean>(true);

  constructor() {
    this.testConnection();
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
      if (user) {
        this.userProfile.set({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: 'teacher',
        });
      } else {
        this.userProfile.set(null);
      }
      this.isAuthLoading.set(false);
    });
  }

  async testConnection(): Promise<void> {
    try {
      await getDocFromServer(doc(this.db, 'test', 'connection'));
      console.log('Firebase Firestore connection verified.');
    } catch (error) {
      if (error instanceof Error && error.message.includes('offline')) {
        console.error('Please check your Firebase configuration.');
      }
    }
  }

  async loginWithGoogle(role: UserRole = 'teacher'): Promise<UserProfile | null> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;
      
      const profile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        role,
        school: 'École Primaire Habib Bourguiba, Ariana',
      };

      this.userProfile.set(profile);
      return profile;
    } catch (err) {
      console.error('Error signing in with Google:', err);
      return null;
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }
}
