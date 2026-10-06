import { Injectable, computed, effect, inject, signal } from '@angular/core';
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  Unsubscribe,
} from 'firebase/firestore';
import {
  AppNotification,
  UserNotificationState,
  UserRole,
} from '../models/education.model';
import { FirebaseService } from './firebase.service';
import { LanguageService } from './language.service';

/**
 * Required Firestore Composite Indexes for production deployment:
 * 1. Collection: 'notifications' | Fields: recipientId ASC, createdAt DESC
 * 2. Collection: 'notifications' | Fields: targetRole ASC, createdAt DESC
 */

const LOCAL_STORAGE_STATE_KEY = 'madrasati_notif_state';
const ONBOARDED_TEACHER_KEY = 'madrasati_teacher_onboarded';

const LOCAL_SEEDS: AppNotification[] = [
  {
    id: 'announce:memo-studio:v1',
    category: 'announcement',
    source: 'local',
    type: 'announcement',
    titleKey: 'notifAnnounceMemoTitle',
    messageKey: 'notifAnnounceMemoMsg',
    createdAt: 1770000000000,
    icon: 'auto_stories',
    priority: 'high',
    targetRole: 'all',
    routeUrl: '/teacher/memo-studio',
  },
  {
    id: 'announce:ocr:v1',
    category: 'announcement',
    source: 'local',
    type: 'announcement',
    titleKey: 'notifAnnounceOcrTitle',
    messageKey: 'notifAnnounceOcrMsg',
    createdAt: 1769900000000,
    icon: 'document_scanner',
    priority: 'normal',
    targetRole: 'all',
    routeUrl: '/parent',
  },
];

export interface NotificationItem extends AppNotification {
  isRead: boolean;
  isDismissed: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly firebase = inject(FirebaseService);
  private readonly lang = inject(LanguageService);

  // Raw notification sources
  private readonly remoteNotifications = signal<AppNotification[]>([]);
  private readonly localSeeds = signal<AppNotification[]>(LOCAL_SEEDS);

  // Per-user state map: notifId -> UserNotificationState
  private readonly userStateMap = signal<Record<string, UserNotificationState>>(this.loadInitialGuestState());

  private unsubs: Unsubscribe[] = [];

  // Public Signal: Visible notifications for the current user
  readonly visible = computed<NotificationItem[]>(() => {
    const user = this.firebase.currentUser();
    const profile = this.firebase.userProfile();
    const currentUid = user?.uid || profile?.uid;
    const currentRole: UserRole = profile?.role || 'parent';
    const stateMap = this.userStateMap();

    // 1. Build teacher welcome seed if applicable
    const teacherWelcomeSeeds: AppNotification[] = [];
    if (currentRole === 'teacher' && !this.isTeacherOnboarded()) {
      teacherWelcomeSeeds.push({
        id: 'seed:welcome-teacher',
        category: 'announcement',
        source: 'local',
        type: 'announcement',
        titleKey: 'notifWelcomeTeacherTitle',
        messageKey: 'notifWelcomeTeacherMsg',
        createdAt: Date.now(),
        icon: 'school',
        priority: 'high',
        targetRole: 'teacher',
        routeUrl: '/teacher/memo-studio',
      });
    }

    // 2. Merge all sources
    const all = [...teacherWelcomeSeeds, ...this.localSeeds(), ...this.remoteNotifications()];

    // 3. Deduplicate by ID
    const dedupedMap = new Map<string, AppNotification>();
    for (const item of all) {
      if (!dedupedMap.has(item.id)) {
        dedupedMap.set(item.id, item);
      }
    }

    // 4. Filter audience, drop authored items & dismissed
    const result: NotificationItem[] = [];
    for (const item of dedupedMap.values()) {
      // Author exclusion: never see own authored notifications
      if (currentUid && item.authorId && item.authorId === currentUid) {
        continue;
      }

      // Audience check
      if (item.recipientId && item.recipientId !== currentUid) {
        continue;
      }
      if (!item.recipientId && item.targetRole && item.targetRole !== 'all' && item.targetRole !== currentRole) {
        continue;
      }

      const st = stateMap[item.id] || { read: false, dismissed: false };
      if (st.dismissed) {
        continue;
      }

      result.push({
        ...item,
        isRead: st.read,
        isDismissed: st.dismissed,
      });
    }

    // Sort by createdAt descending
    return result.sort((a, b) => b.createdAt - a.createdAt);
  });

  // Public Signal: Unread count of visible notifications
  readonly unreadCount = computed<number>(() => {
    return this.visible().filter((n) => !n.isRead).length;
  });

  constructor() {
    // Re-bind listeners when auth state changes
    effect(() => {
      const user = this.firebase.currentUser();
      const profile = this.firebase.userProfile();
      this.setupSubscriptions(user?.uid || profile?.uid, profile?.role || 'parent');
    });
  }

  private loadInitialGuestState(): Record<string, UserNotificationState> {
    if (typeof localStorage === 'undefined') return {};
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_STATE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private saveGuestState(map: Record<string, UserNotificationState>) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(map));
    } catch {
      // SSR / quota fallback
    }
  }

  private isTeacherOnboarded(): boolean {
    if (typeof localStorage === 'undefined') return false;
    try {
      return localStorage.getItem(ONBOARDED_TEACHER_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private markTeacherOnboarded() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(ONBOARDED_TEACHER_KEY, 'true');
    } catch {
      // SSR fallback
    }
  }

  private setupSubscriptions(uid?: string, role: UserRole = 'parent') {
    // Teardown existing Firestore listeners
    this.unsubs.forEach((unsub) => unsub());
    this.unsubs = [];

    if (!this.firebase.db) return;

    try {
      const notifsCol = collection(this.firebase.db, 'notifications');

      // Query 1: Targeted role or broadcast 'all'
      const roleQuery = query(
        notifsCol,
        where('targetRole', 'in', [role, 'all']),
        orderBy('createdAt', 'desc'),
        limit(30)
      );

      const unsubRole = onSnapshot(
        roleQuery,
        (snapshot) => {
          const fetched = snapshot.docs.map((d) => this.mapDocToNotification(d.id, d.data()));
          this.mergeRemoteNotifications(fetched);
        },
        (err) => {
          console.warn('NotificationService role query warning:', err.message);
        }
      );
      this.unsubs.push(unsubRole);

      // Query 2: Direct recipient notifications (if logged in)
      if (uid) {
        const directQuery = query(
          notifsCol,
          where('recipientId', '==', uid),
          orderBy('createdAt', 'desc'),
          limit(30)
        );

        const unsubDirect = onSnapshot(
          directQuery,
          (snapshot) => {
            const fetched = snapshot.docs.map((d) => this.mapDocToNotification(d.id, d.data()));
            this.mergeRemoteNotifications(fetched);
          },
          (err) => {
            console.warn('NotificationService direct recipient query warning:', err.message);
          }
        );
        this.unsubs.push(unsubDirect);

        // Subscribe to user notification states: users/{uid}/notificationState
        const statesCol = collection(this.firebase.db, 'users', uid, 'notificationState');
        const unsubState = onSnapshot(
          statesCol,
          (snapshot) => {
            const serverStateMap: Record<string, UserNotificationState> = { ...this.loadInitialGuestState() };
            snapshot.docs.forEach((docSnap) => {
              const d = docSnap.data();
              serverStateMap[docSnap.id] = {
                read: !!d['read'],
                dismissed: !!d['dismissed'],
                readAt: d['readAt'],
                dismissedAt: d['dismissedAt'],
              };
            });
            this.userStateMap.set(serverStateMap);
          },
          (err) => {
            console.warn('NotificationService state listener warning:', err.message);
          }
        );
        this.unsubs.push(unsubState);
      }
    } catch (e) {
      console.warn('NotificationService listener initialization skipped/fallback:', e);
    }
  }

  private mapDocToNotification(id: string, data: Partial<AppNotification> & { timestamp?: number }): AppNotification {
    return {
      id,
      category: data['category'] || 'activity',
      source: 'remote',
      type: data['type'] || 'announcement',
      titleKey: data['titleKey'] || 'notifTitleOfficial',
      messageKey: data['messageKey'] || '',
      params: data['params'] || {},
      createdAt: typeof data['createdAt'] === 'number' ? data['createdAt'] : (data['timestamp'] || Date.now()),
      icon: data['icon'] || 'notifications',
      priority: data['priority'] || 'normal',
      authorId: data['authorId'],
      recipientId: data['recipientId'],
      targetRole: data['targetRole'] || 'all',
      routeUrl: data['routeUrl'],
      targetDocId: data['targetDocId'],
      targetThreadId: data['targetThreadId'],
      tab: data['tab'],
    };
  }

  private mergeRemoteNotifications(newItems: AppNotification[]) {
    this.remoteNotifications.update((existing) => {
      const map = new Map<string, AppNotification>();
      existing.forEach((item) => map.set(item.id, item));
      newItems.forEach((item) => map.set(item.id, item));
      return Array.from(map.values());
    });
  }

  /**
   * Mark a single notification as read for the current user
   */
  async markRead(id: string): Promise<void> {
    const updatedMap = {
      ...this.userStateMap(),
      [id]: {
        ...(this.userStateMap()[id] || { dismissed: false }),
        read: true,
        readAt: Date.now(),
      },
    };
    this.userStateMap.set(updatedMap);
    this.saveGuestState(updatedMap);

    if (id === 'seed:welcome-teacher') {
      this.markTeacherOnboarded();
    }

    const uid = this.firebase.currentUser()?.uid || this.firebase.userProfile()?.uid;
    if (uid && this.firebase.db) {
      try {
        const stateDoc = doc(this.firebase.db, 'users', uid, 'notificationState', id);
        await setDoc(stateDoc, { read: true, readAt: Date.now() }, { merge: true });
      } catch (err) {
        console.warn('Failed to sync notification read state to Firestore:', err);
      }
    }
  }

  /**
   * Mark all visible notifications as read for current user
   */
  async markAllRead(): Promise<void> {
    const currentList = this.visible();
    const updatedMap = { ...this.userStateMap() };
    const now = Date.now();

    for (const item of currentList) {
      updatedMap[item.id] = {
        ...(updatedMap[item.id] || { dismissed: false }),
        read: true,
        readAt: now,
      };
      if (item.id === 'seed:welcome-teacher') {
        this.markTeacherOnboarded();
      }
    }

    this.userStateMap.set(updatedMap);
    this.saveGuestState(updatedMap);

    const uid = this.firebase.currentUser()?.uid || this.firebase.userProfile()?.uid;
    if (uid && this.firebase.db) {
      try {
        for (const item of currentList) {
          const stateDoc = doc(this.firebase.db, 'users', uid, 'notificationState', item.id);
          await setDoc(stateDoc, { read: true, readAt: now }, { merge: true }).catch(() => undefined);
        }
      } catch (err) {
        console.warn('Failed to batch sync notification read states:', err);
      }
    }
  }

  /**
   * Dismiss a notification (hide from visible list)
   */
  async dismiss(id: string): Promise<void> {
    const updatedMap = {
      ...this.userStateMap(),
      [id]: {
        ...(this.userStateMap()[id] || { read: true }),
        dismissed: true,
        dismissedAt: Date.now(),
      },
    };
    this.userStateMap.set(updatedMap);
    this.saveGuestState(updatedMap);

    if (id === 'seed:welcome-teacher') {
      this.markTeacherOnboarded();
    }

    const uid = this.firebase.currentUser()?.uid || this.firebase.userProfile()?.uid;
    if (uid && this.firebase.db) {
      try {
        const stateDoc = doc(this.firebase.db, 'users', uid, 'notificationState', id);
        await setDoc(stateDoc, { dismissed: true, dismissedAt: Date.now() }, { merge: true });
      } catch (err) {
        console.warn('Failed to sync dismiss state to Firestore:', err);
      }
    }
  }

  /**
   * Emit a new notification to Firestore
   */
  async emit(payload: Omit<AppNotification, 'id' | 'createdAt' | 'source'>): Promise<string> {
    // Validate routeUrl format if provided
    if (payload.routeUrl && !payload.routeUrl.startsWith('/')) {
      throw new Error(`Notification routeUrl must start with '/': received '${payload.routeUrl}'`);
    }

    const currentUid = this.firebase.currentUser()?.uid || this.firebase.userProfile()?.uid;
    const authorId = payload.authorId || currentUid;

    const notifData: Omit<AppNotification, 'id'> = {
      ...payload,
      authorId,
      createdAt: Date.now(),
      source: 'remote',
    };

    if (this.firebase.db) {
      try {
        const notifsCol = collection(this.firebase.db, 'notifications');
        const docRef = await addDoc(notifsCol, notifData);
        return docRef.id;
      } catch (err) {
        console.warn('Firestore addDoc fallback (offline/permission):', err);
      }
    }

    // Local fallback if offline
    const localId = 'local-' + Date.now();
    this.remoteNotifications.update((list) => [{ ...notifData, id: localId }, ...list]);
    return localId;
  }
}
