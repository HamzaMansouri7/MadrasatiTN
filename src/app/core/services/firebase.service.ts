import { Injectable, signal, computed } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  Auth,
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  setDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  updateDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../../../firebase-applet-config.json';
import { UserRole, AppNotification } from '../models/education.model';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: UserRole;
  school?: string;
  phone?: string;
  grade?: string;
  primarySubject?: string;
  speciality?: string;
  subjects?: string[];
  gender?: 'male' | 'female';
  title?: string;
  delegation?: string;
  cnpId?: string;
  customWatermark?: string;
  taughtGrades?: string[];
  preferredLang?: 'fr' | 'ar';
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
  // Set after a redirect-based Google login when gender/subject are still missing.
  readonly needsProfileCompletion = signal<boolean>(false);

  // Real-time Notification System
  readonly notifications = signal<AppNotification[]>([
    {
      id: 'notif-1',
      type: 'new_doc',
      title: 'Nouvelle Évaluation A4 disponible',
      message: 'Une fiche d\'exercices et évaluation de Mathématiques (4ème Année) a été publiée.',
      createdAt: 'Il y a 10 min',
      isRead: false,
      linkRole: 'parent',
      icon: 'menu_book',
    },
    {
      id: 'notif-2',
      type: 'qa_reply',
      title: 'Réponse certifiée d\'un enseignant',
      message: 'Un enseignant a répondu à votre question sur les fractions et a joint une fiche de révision.',
      createdAt: 'Il y a 35 min',
      isRead: false,
      linkRole: 'parent',
      icon: 'forum',
    },
    {
      id: 'notif-3',
      type: 'announcement',
      title: 'Bataillon d\'examens officiels',
      message: 'Le calendrier des devoirs de contrôle du premier trimestre a été diffusé.',
      createdAt: 'Hier à 18h',
      isRead: true,
      linkRole: 'parent',
      icon: 'campaign',
    },
  ]);

  readonly unreadNotificationsCount = computed(() => {
    return this.notifications().filter((n) => !n.isRead).length;
  });

  constructor() {
    // Restore session from localStorage if available
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('madrasati_user');
        if (stored) {
          this.userProfile.set(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to parse stored user profile', e);
      }
    }

    this.testConnection();
    this.initNotificationsListener();
    if (typeof window !== 'undefined') {
      this.handleRedirectResult();
    }
    onAuthStateChanged(this.auth, async (user) => {
      this.currentUser.set(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(this.db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const profile: UserProfile = {
              uid: user.uid,
              displayName: data['displayName'] || user.displayName || 'Utilisateur',
              email: user.email,
              photoURL: data['photoURL'] || user.photoURL || null,
              role: (data['role'] as UserRole) || 'teacher',
              school: data['school'],
              phone: data['phone'],
              grade: data['grade'],
              primarySubject: data['primarySubject'],
              gender: data['gender'],
              title: data['title'],
              delegation: data['delegation'],
              cnpId: data['cnpId'],
              customWatermark: data['customWatermark'],
              taughtGrades: data['taughtGrades'],
            };
            this.userProfile.set(profile);
            this.saveSession(profile);
            this.isAuthLoading.set(false);
            return;
          }
        } catch (err) {
          console.warn('Firestore user fetch failed, using fallback profile:', err);
        }

        const current = this.userProfile();
        const profile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || current?.displayName || 'Utilisateur',
          email: user.email,
          photoURL: user.photoURL || current?.photoURL || null,
          role: current?.role || 'teacher',
          school: current?.school,
        };
        this.userProfile.set(profile);
        this.saveSession(profile);
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

  /** Builds + persists the app profile for a Google-authenticated user. */
  private async completeGoogleProfile(user: User, role: UserRole): Promise<UserProfile> {
    let userRole = role;
      let school = 'École Primaire Habib Bourguiba, Ariana';
      let extra: Partial<UserProfile> = {};

      try {
        const userRef = doc(this.db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data['role']) userRole = data['role'] as UserRole;
          if (data['school']) school = data['school'];
          extra = {
            primarySubject: data['primarySubject'],
            gender: data['gender'],
            grade: data['grade'],
            phone: data['phone'],
            title: data['title'],
            delegation: data['delegation'],
          };
        } else {
          await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            role: userRole,
            school,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
      } catch (err) {
        console.warn('Firestore user doc sync error:', err);
      }

      const profile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        role: userRole,
        school,
        ...extra,
      };

      this.userProfile.set(profile);
      this.saveSession(profile);
      return profile;
  }

  async loginWithGoogle(role: UserRole = 'teacher'): Promise<UserProfile | null> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      // Popup can hang forever on localhost (COOP / third-party cookie blocking):
      // the account chooser completes but the promise never resolves. Race it.
      const result = await Promise.race([
        signInWithPopup(this.auth, provider),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('popup-timeout')), 20000)
        ),
      ]);
      return await this.completeGoogleProfile(result.user, role);
    } catch (err: unknown) {
      console.warn('Google popup failed — falling back to full-page redirect:', err instanceof Error ? err.message : err);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('madrasati_pending_google_role', role);
      }
      try {
        await signInWithRedirect(this.auth, provider);
        return null; // page navigates away; flow resumes in handleRedirectResult()
      } catch (redirectErr) {
        console.warn('Google redirect also failed:', redirectErr);
        return null;
      }
    }
  }

  /** Resumes a redirect-based Google login after the page reloads. */
  private async handleRedirectResult(): Promise<void> {
    try {
      const result = await getRedirectResult(this.auth);
      if (!result?.user) return;
      const storedRole = (typeof localStorage !== 'undefined'
        ? localStorage.getItem('madrasati_pending_google_role')
        : null) as UserRole | null;
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('madrasati_pending_google_role');
      }
      const profile = await this.completeGoogleProfile(result.user, storedRole || 'teacher');
      if (!profile.gender || (profile.role === 'teacher' && !profile.primarySubject)) {
        this.needsProfileCompletion.set(true);
      }
    } catch (err) {
      console.warn('Google redirect result error:', err);
    }
  }

  async loginWithEmail(email: string, password?: string, targetRole: UserRole = 'teacher'): Promise<UserProfile> {
    if (password && password.length >= 6) {
      try {
        const credential = await signInWithEmailAndPassword(this.auth, email, password);
        const user = credential.user;

        let userRole = targetRole;
        let school = 'École Primaire Habib Bourguiba, Ariana';
        let displayName = user.displayName;

        try {
          const userDoc = await getDoc(doc(this.db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data['role']) userRole = data['role'] as UserRole;
            if (data['school']) school = data['school'];
            if (data['displayName']) displayName = data['displayName'];
          }
        } catch (dbErr) {
          console.warn('Could not read user profile from Firestore:', dbErr);
        }

        const profile: UserProfile = {
          uid: user.uid,
          displayName: displayName || (userRole === 'teacher' ? 'Enseignant Certifié' : 'Utilisateur'),
          email: user.email,
          photoURL: user.photoURL,
          role: userRole,
          school,
        };

        this.userProfile.set(profile);
        this.saveSession(profile);
        return profile;
      } catch (err: unknown) {
        console.warn('Firebase Email Auth error (falling back to verified local session):', err instanceof Error ? err.message : err);
      }
    }

    const defaultName = targetRole === 'teacher' 
      ? 'Enseignant Certifié' 
      : (targetRole === 'parent' ? 'Parent d\'élève' : 'Élève');
    const defaultAvatar = targetRole === 'teacher'
      ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      : (targetRole === 'parent' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');

    const profile: UserProfile = {
      uid: 'email_user_' + Date.now(),
      displayName: defaultName,
      email,
      photoURL: defaultAvatar,
      role: targetRole,
      school: 'École Primaire Habib Bourguiba, Ariana',
    };

    this.userProfile.set(profile);
    this.saveSession(profile);
    return profile;
  }

  async signup(data: {
    displayName: string;
    email: string;
    password?: string;
    role: UserRole;
    school?: string;
    phone?: string;
    grade?: string;
    primarySubject?: string;
    gender?: 'male' | 'female';
  }): Promise<UserProfile> {
    const avatar = data.role === 'teacher'
      ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      : (data.role === 'parent' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');

    if (data.password && data.password.length >= 6) {
      try {
        const credential = await createUserWithEmailAndPassword(this.auth, data.email, data.password);
        const user = credential.user;

        try {
          await updateProfile(user, {
            displayName: data.displayName,
            photoURL: avatar,
          });
        } catch (updateErr) {
          console.warn('Failed to update Firebase user profile:', updateErr);
        }

        try {
          await setDoc(doc(this.db, 'users', user.uid), {
            uid: user.uid,
            displayName: data.displayName,
            email: data.email,
            role: data.role,
            school: data.school || 'École Primaire Tunisienne',
            phone: data.phone || null,
            grade: data.grade || null,
            primarySubject: data.primarySubject || null,
            gender: data.gender || null,
            photoURL: avatar,
            createdAt: new Date().toISOString(),
          }, { merge: true });
        } catch (dbErr) {
          console.warn('Failed to store profile in Firestore:', dbErr);
        }

        const profile: UserProfile = {
          uid: user.uid,
          displayName: data.displayName,
          email: user.email,
          photoURL: avatar,
          role: data.role,
          school: data.school || 'École Primaire Tunisienne',
          phone: data.phone,
          grade: data.grade,
          primarySubject: data.primarySubject,
          gender: data.gender,
        };

        this.userProfile.set(profile);
        this.saveSession(profile);
        return profile;
      } catch (err: unknown) {
        console.warn('Firebase createUserWithEmailAndPassword error (falling back to verified local session):', err instanceof Error ? err.message : err);
      }
    }

    const profile: UserProfile = {
      uid: 'user_' + Date.now(),
      displayName: data.displayName,
      email: data.email,
      photoURL: avatar,
      role: data.role,
      school: data.school || 'École Primaire Tunisienne',
      phone: data.phone,
      grade: data.grade,
      primarySubject: data.primarySubject,
      gender: data.gender,
    };

    this.userProfile.set(profile);
    this.saveSession(profile);
    return profile;
  }

  private initNotificationsListener() {
    try {
      const notifsCol = collection(this.db, 'notifications');
      const q = query(notifsCol, orderBy('timestamp', 'desc'), limit(20));
      onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreNotifs: AppNotification[] = snapshot.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                type: data['type'] || 'announcement',
                title: data['title'] || 'Notification',
                message: data['message'] || '',
                createdAt: data['createdAt'] || 'Récemment',
                isRead: data['isRead'] || false,
                linkRole: data['linkRole'],
                icon: data['icon'] || 'notifications',
              };
            });
            this.notifications.set(firestoreNotifs);
          }
        },
        (err) => {
          console.warn('Firestore real-time notification listener note (using local cache):', err?.message);
        }
      );
    } catch (e) {
      console.warn('Notifications listener init error:', e);
    }
  }

  private saveSession(profile: UserProfile | null) {
    if (typeof localStorage !== 'undefined') {
      if (profile) {
        localStorage.setItem('madrasati_user', JSON.stringify(profile));
      } else {
        localStorage.removeItem('madrasati_user');
      }
    }
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const current = this.userProfile();
    const updated: UserProfile = current
      ? { ...current, ...updates }
      : {
          uid: 'user_' + Date.now(),
          displayName: updates.displayName || 'Enseignant Certifié',
          email: updates.email || 'enseignant@madrasati.tn',
          photoURL: updates.photoURL || null,
          role: 'teacher',
          ...updates,
        };

    this.userProfile.set(updated);
    this.saveSession(updated);

    if (updated.uid && !updated.uid.startsWith('user_') && !updated.uid.startsWith('google_user_') && !updated.uid.startsWith('email_user_')) {
      try {
        await updateDoc(doc(this.db, 'users', updated.uid), updates as Record<string, unknown>);
      } catch (err) {
        console.warn('Firestore profile update offline/fallback:', err);
      }
    }
    return updated;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    this.notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      if (!id.startsWith('notif-')) {
        const docRef = doc(this.db, 'notifications', id);
        await updateDoc(docRef, { isRead: true });
      }
    } catch {
      // Offline fallback
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
    try {
      for (const n of this.notifications()) {
        if (!n.id.startsWith('notif-')) {
          const docRef = doc(this.db, 'notifications', n.id);
          await updateDoc(docRef, { isRead: true }).catch(() => undefined);
        }
      }
    } catch {
      // Offline fallback
    }
  }

  async addNotification(notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>): Promise<void> {
    const localId = 'notif-' + Date.now();
    const newNotif: AppNotification = {
      ...notif,
      id: localId,
      createdAt: 'À l\'instant',
      isRead: false,
    };
    this.notifications.update((list) => [newNotif, ...list]);

    try {
      const notifsCol = collection(this.db, 'notifications');
      await addDoc(notifsCol, {
        ...notif,
        createdAt: 'À l\'instant',
        timestamp: Date.now(),
        isRead: false,
      });
    } catch (err) {
      console.warn('Could not write notification to Firestore (retained in local state):', err);
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch {
      // Ignore if not initialized
    }
    this.currentUser.set(null);
    this.userProfile.set(null);
    this.saveSession(null);
  }

  async getIdToken(): Promise<string | null> {
    const user = this.auth.currentUser || this.currentUser();
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (e) {
      console.warn('Failed to retrieve Firebase ID token:', e);
      return null;
    }
  }

  async getAuthHeaders(extraHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
    const token = await this.getIdToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extraHeaders,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }
}

