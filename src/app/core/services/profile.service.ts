import { Injectable, computed, inject, signal, effect } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { EducationStore } from './education-store';
import {
  UserProfile,
  UserRole,
  ChildProfile,
  GradeLevel,
  TeacherProfile,
} from '../models/education.model';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';

export interface ProfileCompleteness {
  score: number; // 0 to 100
  missingSteps: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly firebase = inject(FirebaseService);
  private readonly store = inject(EducationStore);

  // Re-export profile signal from Firebase
  readonly userProfile = this.firebase.userProfile;

  // Real-time / loaded children list for parent accounts
  readonly children = signal<ChildProfile[]>([]);
  readonly isChildrenLoading = signal<boolean>(false);

  // Role-aware profile completeness meter (computed, not stored)
  readonly completeness = computed<ProfileCompleteness>(() => {
    const p = this.userProfile();
    if (!p) return { score: 0, missingSteps: [] };

    const missing: string[] = [];
    let totalChecks = 0;
    let passedChecks = 0;

    const check = (name: string, ok: boolean) => {
      totalChecks++;
      if (ok) passedChecks++;
      else missing.push(name);
    };

    const role = p.activeRole || p.role || 'parent';

    if (role === 'teacher') {
      check('Nom complet & Titre', Boolean(p.displayName && p.displayName.trim().length >= 3));
      check('Photo de profil', Boolean(p.photoURL));
      check('Établissement scolaire', Boolean(p.school && p.school.trim().length > 0));
      check('Niveaux & Matières', Boolean(p.taughtGrades && p.taughtGrades.length > 0 && p.subjects && p.subjects.length > 0));
      check('Présentation & Biographie', Boolean(p.bio && p.bio.trim().length >= 10));
    } else if (role === 'parent') {
      check('Nom complet', Boolean(p.displayName && p.displayName.trim().length >= 3));
      check('Numéro de téléphone', Boolean(p.phone && p.phone.trim().length >= 8));
      check('Au moins un enfant ajouté', this.children().length > 0);
      check('Gouvernorat', Boolean(p.governorate || p.delegation));
    } else if (role === 'student') {
      check('Pseudo élève', Boolean(p.displayName && p.displayName.trim().length >= 2));
      check('Classe / Niveau scolaire', Boolean(p.grade));
      check('Avatar illustré choisi', Boolean(p.photoURL));
    } else {
      check('Nom d\'affichage', Boolean(p.displayName));
    }

    const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;
    return { score, missingSteps: missing };
  });

  constructor() {
    // Watch auth user changes and sync children & watchlist
    effect(() => {
      const p = this.userProfile();
      if (p?.uid && !p.uid.startsWith('demo_user_')) {
        void this.loadChildren(p.uid);
        void this.syncWatchlistWithFirestore(p.uid);
      } else {
        this.children.set([]);
      }
    });
  }

  /**
   * Update current user profile fields in `users/{uid}`
   */
  async update(partial: Partial<UserProfile>): Promise<void> {
    const current = this.userProfile();
    if (!current) throw new Error('User not logged in');

    const updatedData: Partial<UserProfile> = {
      ...partial,
      updatedAt: Date.now(),
    };

    await this.firebase.updateUserProfile(updatedData);

    // If teacher, also mirror public fields to `teachers/{uid}`
    if (current.role === 'teacher' || current.activeRole === 'teacher') {
      if (this.firebase.db && !current.uid.startsWith('demo_user_')) {
        try {
          const publicFields: Partial<TeacherProfile> = {
            updatedAt: Date.now(),
          };
          if (partial.displayName !== undefined) {
            const cleanName = partial.displayName || '';
            publicFields.displayName = cleanName;
            publicFields.name = cleanName;
          }
          if (partial.title !== undefined) publicFields.title = partial.title;
          if (partial.school !== undefined) publicFields.school = partial.school;
          if (partial.delegation !== undefined) publicFields.delegation = partial.delegation;
          if (partial.bio !== undefined) publicFields.bio = partial.bio.slice(0, 500);
          if (partial.photoURL !== undefined) publicFields.avatarUrl = partial.photoURL || '';
          if (partial.taughtGrades !== undefined) publicFields.taughtGrades = partial.taughtGrades;
          if (partial.subjects !== undefined) publicFields.subjects = partial.subjects;

          await setDoc(doc(this.firebase.db, 'teachers', current.uid), publicFields, { merge: true });
        } catch (err) {
          console.warn('ProfileService: Failed to mirror public teacher card:', err);
        }
      }
    }
  }

  /**
   * Switch active role for dual-role accounts
   */
  async switchRole(newRole: UserRole): Promise<void> {
    const p = this.userProfile();
    if (!p) return;

    const roles = p.roles && p.roles.length > 0 ? Array.from(new Set([...p.roles, newRole, p.role])) : [p.role, newRole];
    await this.update({ activeRole: newRole, roles });
  }

  /**
   * Upload an avatar with client-side 400x400 square crop to WebP (<=80KB)
   */
  async uploadAvatar(file: File): Promise<string> {
    const user = this.userProfile();
    if (!user) throw new Error('User not logged in');

    // 1. Process client-side: 400x400 WebP square crop
    const base64WebP = await this.cropImageToWebP(file, 400, 0.82);

    // 2. Upload to VPS disk storage endpoint /api/upload
    const authHeaders = await this.firebase.getAuthHeaders();
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        kind: 'avatars',
        uid: user.uid,
        fileName: `avatar_${user.uid}_${Date.now()}.webp`,
        fileBase64: base64WebP,
        mimeType: 'image/webp',
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to upload avatar to server storage');
    }

    const data = await res.json();
    const publicUrl = data.url || data.fileUrl;
    if (!publicUrl) {
      throw new Error('Upload succeeded but no public URL was returned');
    }

    // 3. Update user profile photoURL
    await this.update({ photoURL: publicUrl });
    return publicUrl;
  }

  /**
   * Remove profile avatar
   */
  async removeAvatar(): Promise<void> {
    await this.update({ photoURL: null });
  }

  /**
   * Load children list from Firestore for parent accounts
   */
  async loadChildren(parentUid: string): Promise<ChildProfile[]> {
    if (!this.firebase.db || parentUid.startsWith('demo_user_')) {
      return [];
    }

    this.isChildrenLoading.set(true);
    try {
      const q = query(
        collection(this.firebase.db, 'children'),
        where('parentUid', '==', parentUid)
      );
      const snap = await getDocs(q);
      const list: ChildProfile[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          parentUid: data['parentUid'] || parentUid,
          nickname: data['nickname'] || '',
          grade: data['grade'] || '1ère Année',
          avatarId: data['avatarId'] || 'avatar-1',
          school: data['school'] || '',
          createdAt: data['createdAt'] || Date.now(),
          updatedAt: data['updatedAt'],
        };
      });

      this.children.set(list);

      // Update EducationStore student representations
      this.syncStoreStudents(list);

      return list;
    } catch (err) {
      console.warn('ProfileService: Could not load children from Firestore:', err);
      return [];
    } finally {
      this.isChildrenLoading.set(false);
    }
  }

  /**
   * Add a child record to `children/{childId}`
   */
  async addChild(data: {
    nickname: string;
    grade: GradeLevel;
    avatarId: string;
    school?: string;
  }): Promise<string> {
    const user = this.userProfile();
    if (!user) throw new Error('Must be logged in to add a child');

    const childId = 'ch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newChild: ChildProfile = {
      id: childId,
      parentUid: user.uid,
      nickname: data.nickname.trim(),
      grade: data.grade,
      avatarId: data.avatarId || 'avatar-1',
      school: data.school?.trim() || '',
      createdAt: Date.now(),
    };

    if (this.firebase.db && !user.uid.startsWith('demo_user_')) {
      await setDoc(doc(this.firebase.db, 'children', childId), newChild);
    }

    this.children.update((curr) => [...curr, newChild]);
    this.syncStoreStudents(this.children());

    // Auto-select as active student if first child
    if (this.children().length === 1) {
      this.store.setActiveStudent(childId);
    }

    return childId;
  }

  /**
   * Update child record
   */
  async updateChild(childId: string, partial: Partial<ChildProfile>): Promise<void> {
    const user = this.userProfile();
    if (!user) throw new Error('Must be logged in');

    if (this.firebase.db && !user.uid.startsWith('demo_user_')) {
      await updateDoc(doc(this.firebase.db, 'children', childId), {
        ...partial,
        updatedAt: Date.now(),
      });
    }

    this.children.update((curr) =>
      curr.map((c) => (c.id === childId ? { ...c, ...partial, updatedAt: Date.now() } : c))
    );
    this.syncStoreStudents(this.children());
  }

  /**
   * Delete child record and remove associated activity
   */
  async deleteChild(childId: string): Promise<void> {
    const user = this.userProfile();
    if (!user) throw new Error('Must be logged in');

    if (this.firebase.db && !user.uid.startsWith('demo_user_')) {
      await deleteDoc(doc(this.firebase.db, 'children', childId));
    }

    this.children.update((curr) => curr.filter((c) => c.id !== childId));
    this.syncStoreStudents(this.children());

    if (this.store.activeStudentId() === childId) {
      const remaining = this.children();
      this.store.setActiveStudent(remaining.length > 0 ? remaining[0].id : '');
    }
  }

  /**
   * Sync Watchlist with Firestore `users/{uid}/watchlist/{itemId}` and merge local cache
   */
  async syncWatchlistWithFirestore(uid: string): Promise<void> {
    if (!this.firebase.db || uid.startsWith('demo_user_')) return;

    try {
      const snap = await getDocs(collection(this.firebase.db, 'users', uid, 'watchlist'));
      const remoteCourses: string[] = [];
      const remoteExercises: string[] = [];
      const remoteTeachers: string[] = [];

      snap.forEach((d) => {
        const item = d.data();
        if (item['type'] === 'course') remoteCourses.push(item['id'] || d.id);
        else if (item['type'] === 'exercise') remoteExercises.push(item['id'] || d.id);
        else if (item['type'] === 'teacher') remoteTeachers.push(item['id'] || d.id);
      });

      // Merge with current in-memory / local storage watchlist
      const local = this.store.watchlist();
      const mergedCourses = Array.from(new Set([...local.courses, ...remoteCourses]));
      const mergedExercises = Array.from(new Set([...local.exercises, ...remoteExercises]));
      const mergedTeachers = Array.from(new Set([...local.teachers, ...remoteTeachers]));

      const merged = {
        courses: mergedCourses,
        exercises: mergedExercises,
        teachers: mergedTeachers,
      };

      this.store.watchlist.set(merged);

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('madrasati_watchlist', JSON.stringify(merged));
      }
    } catch (err) {
      console.warn('ProfileService: Watchlist sync error:', err);
    }
  }

  /**
   * Export user data package as JSON (GDPR / privacy right)
   */
  async exportUserData(): Promise<string> {
    const user = this.userProfile();
    const children = this.children();
    const watchlist = this.store.watchlist();

    const dataPackage = {
      exportDate: new Date().toISOString(),
      userProfile: user,
      children,
      watchlist,
      platform: 'Madrasati TN (مدرستي تونس)',
    };

    return JSON.stringify(dataPackage, null, 2);
  }

  /**
   * Delete entire user account and related records
   */
  async deleteAccount(): Promise<void> {
    const user = this.userProfile();
    if (!user) return;

    if (this.firebase.db && !user.uid.startsWith('demo_user_')) {
      // 1. Delete all children
      for (const child of this.children()) {
        try {
          await deleteDoc(doc(this.firebase.db, 'children', child.id));
        } catch {
          // continue
        }
      }

      // 2. Delete teacher card if exists
      try {
        await deleteDoc(doc(this.firebase.db, 'teachers', user.uid));
      } catch {
        // continue
      }

      // 3. Delete user doc
      try {
        await deleteDoc(doc(this.firebase.db, 'users', user.uid));
      } catch {
        // continue
      }
    }

    // 4. Logout & clear session
    await this.firebase.logout();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('madrasati_user');
      localStorage.removeItem('madrasati_watchlist');
    }
  }

  /**
   * Keep EducationStore students signal in sync with real ChildProfile records
   */
  private syncStoreStudents(childList: ChildProfile[]): void {
    if (childList.length === 0) {
      this.store.students.set([]);
      return;
    }

    const students = childList.map((c) => ({
      id: c.id,
      name: c.nickname,
      grade: c.grade,
      school: c.school || 'École Primaire Tunisienne',
      avatarUrl: `/assets/avatars/${c.avatarId || 'avatar-1'}.svg`,
      avatarId: c.avatarId || 'avatar-1',
      parentId: c.parentUid,
      streakDays: 0,
      totalPoints: 0,
      completedExercisesCount: 0,
      subjectsProgress: [
        { subject: 'Mathématiques' as const, score: 0, color: '#10b981' },
        { subject: 'Français' as const, score: 0, color: '#6366f1' },
        { subject: 'اللغة العربية' as const, score: 0, color: '#f59e0b' },
        { subject: 'Éveil Scientifique' as const, score: 0, color: '#06b6d4' },
      ],
    }));

    this.store.students.set(students);
  }

  /**
   * Client-side square crop and WebP conversion
   */
  private cropImageToWebP(file: File, targetSize: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }

          // Calculate center square crop
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
          const webpBase64 = canvas.toDataURL('image/webp', quality);
          resolve(webpBase64);
        };
        img.onerror = () => reject(new Error('Failed to load image for cropping'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  }
}
