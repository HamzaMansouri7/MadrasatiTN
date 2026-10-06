import { Injectable, inject } from '@angular/core';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getCountFromServer,
} from 'firebase/firestore';
import { TeacherProfile, TeacherVerificationStatus } from '../models/education.model';
import { FirebaseService, UserProfile } from './firebase.service';

export interface TeacherStats {
  coursesCount: number;
  exercisesCount: number;
  totalDocuments: number;
}

@Injectable({
  providedIn: 'root',
})
export class TeacherProfileService {
  private readonly firebase = inject(FirebaseService);
  private statsCache = new Map<string, { data: TeacherStats; timestamp: number }>();

  /**
   * Fetch a public teacher card by UID from Firestore
   */
  async getTeacherProfile(uid: string): Promise<TeacherProfile | null> {
    if (!this.firebase.db) return null;
    try {
      const snap = await getDoc(doc(this.firebase.db, 'teachers', uid));
      if (snap.exists()) {
        const d = snap.data();
        return {
          id: snap.id,
          displayName: d['displayName'] || d['name'] || 'Enseignant(e)',
          name: d['name'] || d['displayName'] || 'Enseignant(e)',
          title: d['title'] || 'Enseignant(e) du primaire',
          school: d['school'] || 'École Primaire Tunisienne',
          delegation: d['delegation'],
          bio: d['bio'],
          avatarUrl: d['avatarUrl'],
          taughtGrades: Array.isArray(d['taughtGrades']) ? d['taughtGrades'] : [],
          subjects: Array.isArray(d['subjects']) ? d['subjects'] : [],
          languages: Array.isArray(d['languages']) ? d['languages'] : ['ar', 'fr'],
          verified: (d['verified'] as TeacherVerificationStatus) || 'none',
          joinedAt: d['joinedAt'],
          updatedAt: d['updatedAt'],
        };
      }
    } catch (err) {
      console.warn('Could not fetch teacher profile:', err);
    }
    return null;
  }

  /**
   * Derive real document and exercise counts for an author.
   * Zero-cost cached in-memory per session.
   */
  async getTeacherStats(uid: string): Promise<TeacherStats> {
    const cached = this.statsCache.get(uid);
    if (cached && Date.now() - cached.timestamp < 60000) {
      return cached.data;
    }

    let coursesCount = 0;
    let exercisesCount = 0;

    if (this.firebase.db) {
      try {
        const coursesQuery = query(collection(this.firebase.db, 'courses'), where('authorId', '==', uid));
        const coursesSnap = await getCountFromServer(coursesQuery);
        coursesCount = coursesSnap.data().count;
      } catch {
        // fallback
      }

      try {
        const exercisesQuery = query(collection(this.firebase.db, 'exercises'), where('authorId', '==', uid));
        const exercisesSnap = await getCountFromServer(exercisesQuery);
        exercisesCount = exercisesSnap.data().count;
      } catch {
        // fallback
      }
    }

    const result: TeacherStats = {
      coursesCount,
      exercisesCount,
      totalDocuments: coursesCount + exercisesCount,
    };

    this.statsCache.set(uid, { data: result, timestamp: Date.now() });
    return result;
  }

  /**
   * Save teacher profile with strict segregation:
   * - Private fields go to `users/{uid}`
   * - Whitelisted public fields go to `teachers/{uid}`
   */
  async saveProfile(
    uid: string,
    data: {
      displayName: string;
      title: string;
      school: string;
      delegation?: string;
      bio?: string;
      avatarUrl?: string;
      taughtGrades: string[];
      subjects: string[];
      cnpId?: string;
      customWatermark?: string;
    }
  ): Promise<void> {
    const trimmedBio = data.bio ? data.bio.slice(0, 500) : '';
    const trimmedName = data.displayName.slice(0, 80);

    // 1. Update private user doc
    const userUpdates: Partial<UserProfile> = {
      displayName: trimmedName,
      title: data.title,
      school: data.school,
      delegation: data.delegation,
      photoURL: data.avatarUrl || null,
      cnpId: data.cnpId,
      customWatermark: data.customWatermark,
      taughtGrades: data.taughtGrades,
      primarySubject: data.subjects[0] || undefined,
    };

    await this.firebase.updateUserProfile(userUpdates);

    // 2. Update public teacher card (whitelist only)
    if (this.firebase.db) {
      try {
        const publicCard = {
          displayName: trimmedName,
          name: trimmedName,
          title: data.title,
          school: data.school,
          delegation: data.delegation || '',
          bio: trimmedBio,
          avatarUrl: data.avatarUrl || '',
          taughtGrades: data.taughtGrades,
          subjects: data.subjects,
          updatedAt: Date.now(),
        };

        await setDoc(doc(this.firebase.db, 'teachers', uid), publicCard, { merge: true });
      } catch (err) {
        console.warn('Failed to update public teacher card in Firestore:', err);
      }
    }
  }

  /**
   * Request official certification for a teacher
   */
  async requestVerification(uid: string): Promise<void> {
    if (!this.firebase.db) return;
    try {
      await setDoc(
        doc(this.firebase.db, 'teachers', uid),
        { verified: 'pending', updatedAt: Date.now() },
        { merge: true }
      );
    } catch (err) {
      console.warn('Failed to submit verification request:', err);
    }
  }

  /**
   * Upload an avatar WebP base64 image to VPS disk storage (/api/upload)
   */
  async uploadAvatar(uid: string, base64Data: string): Promise<string> {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: `avatar_${uid}_${Date.now()}.webp`,
        fileBase64: base64Data,
        mimeType: 'image/webp',
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to upload avatar image to VPS storage');
    }

    const data = await res.json();
    const publicUrl = data.url || data.fileUrl;

    if (!publicUrl) {
      throw new Error('Upload succeeded but no public URL returned');
    }

    // Save avatar URL to profile
    await this.firebase.updateUserProfile({ photoURL: publicUrl });

    if (this.firebase.db) {
      try {
        await setDoc(
          doc(this.firebase.db, 'teachers', uid),
          { avatarUrl: publicUrl, updatedAt: Date.now() },
          { merge: true }
        );
      } catch (err) {
        console.warn('Failed to mirror avatarUrl to teacher card:', err);
      }
    }

    return publicUrl;
  }
}
