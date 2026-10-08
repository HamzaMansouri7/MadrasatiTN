import { Injectable, signal, inject } from '@angular/core';
import { LanguageService } from './language.service';
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
  getDocs,
  getDocFromServer,
  initializeFirestore,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../../../firebase-applet-config.json';
import { UserRole, TeacherProfile, BlogPost, UserProfile } from '../models/education.model';
export type { UserProfile };

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  readonly lang = inject(LanguageService);
  readonly app = initializeApp(firebaseConfig);
  // ignoreUndefinedProperties: optional fields (e.g. ownerUid when signed out) are dropped, not rejected.
  readonly db: Firestore = initializeFirestore(
    this.app,
    { ignoreUndefinedProperties: true },
    firebaseConfig.firestoreDatabaseId,
  );
  readonly auth: Auth = getAuth(this.app);

  readonly currentUser = signal<User | null>(null);
  readonly userProfile = signal<UserProfile | null>(null);
  readonly isAuthLoading = signal<boolean>(true);
  // Set after a redirect-based Google login when gender/subject are still missing.
  readonly needsProfileCompletion = signal<boolean>(false);

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
              role: (data['role'] === 'student' ? 'parent' : (data['role'] as UserRole)) || 'teacher',
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
            void this.syncTeacherCard(profile); // backfill/refresh the public directory card
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
      let school: string | undefined;
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
            school: school ?? null,
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
      const result = await signInWithPopup(this.auth, provider);
      return await this.completeGoogleProfile(result.user, role);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      console.warn('Google Auth popup error:', code, err);

      if (code === 'auth/popup-closed-by-user') {
        throw new Error(this.lang.tr('Connexion Google annulée.', 'تم إلغاء تسجيل الدخول بـ Google.'));
      }

      if (code === 'auth/unauthorized-domain') {
        throw new Error(this.lang.tr(
          'Ce domaine n\'est pas autorisé dans Firebase Console (Authentication > Settings > Authorized domains).',
          'هذا النطاق غير مصرح به في إعدادات فيربايس (Authorized domains).'
        ));
      }

      if (code === 'auth/popup-blocked') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('madrasati_pending_google_role', role);
        }
        try {
          await signInWithRedirect(this.auth, provider);
          return null;
        } catch (redirectErr) {
          throw new Error(this.formatAuthError(redirectErr));
        }
      }

      throw new Error(this.formatAuthError(err));
    }
  }

  readonly onRedirectAuth = signal<UserProfile | null>(null);

  /** Maps Firebase error codes to readable bilingual messages */
  formatAuthError(err: unknown): string {
    const code = (err as { code?: string })?.code || '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Cette adresse e-mail est déjà associée à un compte (البريد الإلكتروني مستخدم بالفعل).';
      case 'auth/invalid-email':
        return 'Adresse e-mail invalide (عنوان البريد الإلكتروني غير صالح).';
      case 'auth/weak-password':
        return 'Le mot de passe doit comporter au moins 6 caractères (كلمة المرور يجب أن تتكون من 6 أحرف على الأقل).';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Identifiants incorrects ou mot de passe erroné (البريد الإلكتروني أو كلمة المرور غير صحيحة).';
      case 'auth/too-many-requests':
        return 'Trop de tentatives infructueuses. Veuillez réessayer plus tard (محاولات كثيرة خاطئة، يرجى المحاولة لاحقاً).';
      case 'auth/network-request-failed':
        return 'Erreur de connexion au serveur Firebase (خطأ في الاتصال بالخادم).';
      default:
        return (err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'authentification.');
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
      } else {
        this.onRedirectAuth.set(profile);
      }
    } catch (err) {
      console.warn('Google redirect result error:', err);
    }
  }

  async loginWithEmail(email: string, password?: string, targetRole: UserRole = 'teacher'): Promise<UserProfile> {
    if (password !== undefined) {
      try {
        const credential = await signInWithEmailAndPassword(this.auth, email, password);
        const user = credential.user;

        let userRole = targetRole;
        let school: string | undefined;
        let displayName = user.displayName;
        let extra: Partial<UserProfile> = {};

        try {
          const userDoc = await getDoc(doc(this.db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data['role']) userRole = data['role'] as UserRole;
            if (data['school']) school = data['school'];
            if (data['displayName']) displayName = data['displayName'];
            extra = {
              primarySubject: data['primarySubject'],
              gender: data['gender'],
              grade: data['grade'],
              phone: data['phone'],
              delegation: data['delegation'],
            };
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
          ...extra,
        };

        this.userProfile.set(profile);
        this.saveSession(profile);
        return profile;
      } catch (err: unknown) {
        console.error('Firebase Email Auth error:', err);
        throw new Error(this.formatAuthError(err));
      }
    }

    // Fast 1-click Demo Account (when password is omitted)
    const defaultName = targetRole === 'teacher' 
      ? 'Enseignant Certifié' 
      : (targetRole === 'parent' ? 'Parent d\'élève' : 'Élève');
    const defaultAvatar: string | null = null;

    const profile: UserProfile = {
      uid: 'demo_user_' + targetRole + '_' + Date.now(),
      displayName: defaultName,
      email,
      photoURL: defaultAvatar,
      role: targetRole,
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
    delegation?: string;
    phone?: string;
    grade?: string;
    primarySubject?: string;
    gender?: 'male' | 'female';
  }): Promise<UserProfile> {
    const avatar: string | null = null;

    if (data.password !== undefined) {
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
            school: data.school || null,
            delegation: data.delegation || null,
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
          school: data.school,
          delegation: data.delegation,
          phone: data.phone,
          grade: data.grade,
          primarySubject: data.primarySubject,
          gender: data.gender,
        };

        this.userProfile.set(profile);
        this.saveSession(profile);
        void this.syncTeacherCard(profile);
        return profile;
      } catch (err: unknown) {
        console.error('Firebase createUserWithEmailAndPassword error:', err);
        throw new Error(this.formatAuthError(err));
      }
    }

    const profile: UserProfile = {
      uid: 'user_' + Date.now(),
      displayName: data.displayName,
      email: data.email,
      photoURL: avatar,
      role: data.role,
      school: data.school,
      delegation: data.delegation,
      phone: data.phone,
      grade: data.grade,
      primarySubject: data.primarySubject,
      gender: data.gender,
    };

    this.userProfile.set(profile);
    this.saveSession(profile);
    return profile;
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
      void this.syncTeacherCard(updated);
    }
    return updated;
  }

  /**
   * Mirror a teacher's PUBLIC card into the `teachers` collection (world-readable,
   * see firestore.rules). Called on login/signup/profile-update so the public
   * directory always reflects real registered teachers — no emails, no phone.
   */
  async syncTeacherCard(profile: UserProfile): Promise<void> {
    if (profile.role !== 'teacher' || !profile.uid) return;
    try {
      await setDoc(doc(this.db, 'teachers', profile.uid), {
        name: profile.displayName || 'Enseignant(e)',
        title: profile.title || profile.primarySubject || 'Enseignant(e) du primaire',
        school: profile.school || '',
        avatarUrl: profile.photoURL || '',
        subjects: profile.primarySubject ? [profile.primarySubject] : [],
        verifiedBadge: true,
        coursesCount: 0,
        exercisesCount: 0,
        studentsCount: 0,
        rating: 0,
        reviewsCount: 0,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.warn('Could not sync public teacher card:', err);
    }
  }

  /** Load verified teacher profiles from the `teachers` collection. Empty array if none/unreachable. */
  async fetchTeachers(): Promise<TeacherProfile[]> {
    try {
      const snap = await getDocs(collection(this.db, 'teachers'));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TeacherProfile, 'id'>) }));
    } catch (err) {
      console.warn('Could not load teachers from Firestore:', err);
      return [];
    }
  }

  /** Save blog post to Firestore collection `blog_posts`. */
  async saveBlogPost(post: BlogPost): Promise<void> {
    try {
      const sanitized = JSON.parse(JSON.stringify(post));
      await setDoc(doc(this.db, 'blog_posts', post.id), sanitized, { merge: true });
    } catch (err) {
      console.warn('Could not write blog post to Firestore (retained in local state):', err);
    }
  }

  /** Load blog posts from Firestore collection `blog_posts`. */
  async fetchBlogPosts(): Promise<BlogPost[]> {
    try {
      const snap = await getDocs(collection(this.db, 'blog_posts'));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, 'id'>) }));
    } catch (err) {
      console.warn('Could not load blog posts from Firestore:', err);
      return [];
    }
  }

  /** Persist a course doc to `courses` collection. */
  async saveCourse(course: Record<string, unknown>): Promise<void> {
    try {
      const id = course['id'] as string;
      await setDoc(doc(this.db, 'courses', id), { ...course, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('Could not write course to Firestore (retained in local state):', err);
    }
  }

  /** Generic read-back for persisted user content (courses, exercises, …). */
  async fetchUserContent(collectionName: string): Promise<Record<string, unknown>[]> {
    try {
      const snap = await getDocs(collection(this.db, collectionName));
      return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Record<string, unknown>));
    } catch (err) {
      console.warn(`Could not load ${collectionName} from Firestore:`, err);
      return [];
    }
  }

  /** Persist a homework doc to `homeworks` collection. */
  async saveHomework(hw: Record<string, unknown>): Promise<void> {
    try {
      const id = hw['id'] as string;
      await setDoc(doc(this.db, 'homeworks', id), { ...hw, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('Could not write homework to Firestore (retained in local state):', err);
    }
  }

  /** Persist an exercise to `exercises` collection. */
  async saveExercise(ex: Record<string, unknown>): Promise<void> {
    try {
      const id = ex['id'] as string;
      await setDoc(doc(this.db, 'exercises', id), { ...ex, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('Could not write exercise to Firestore (retained in local state):', err);
    }
  }

  /** Persist an announcement to `announcements` collection. */
  async saveAnnouncement(ann: Record<string, unknown>): Promise<void> {
    try {
      const id = ann['id'] as string;
      await setDoc(doc(this.db, 'announcements', id), { ...ann, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('Could not write announcement to Firestore (retained in local state):', err);
    }
  }

  /** Persist a Q&A thread (and its answers array) to `question_threads` collection. */
  async saveQuestionThread(thread: Record<string, unknown>): Promise<void> {
    try {
      const id = thread['id'] as string;
      const sanitized = JSON.parse(JSON.stringify(thread));
      await setDoc(doc(this.db, 'question_threads', id), { ...sanitized, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('Could not write question thread to Firestore (retained in local state):', err);
    }
  }

  /** Persist a submission to `submissions` collection. */
  async saveSubmission(sub: Record<string, unknown>): Promise<void> {
    try {
      const id = sub['id'] as string;
      await setDoc(doc(this.db, 'submissions', id), { ...sub, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('Could not write submission to Firestore (retained in local state):', err);
    }
  }

  /** Update a submission field (grade/feedback/status). */
  async updateSubmission(id: string, updates: Record<string, unknown>): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'submissions', id), updates);
    } catch (err) {
      console.warn('Could not update submission in Firestore:', err);
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

