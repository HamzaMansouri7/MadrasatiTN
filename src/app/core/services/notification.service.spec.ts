import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NotificationService } from './notification.service';
import { FirebaseService, UserProfile } from './firebase.service';
import { LanguageService } from './language.service';
import { AppNotification } from '../models/education.model';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockFirebase: any;
  let mockLang: any;

  const mockUserSignal = signal<{ uid: string } | null>({ uid: 'teacher-1' });
  const mockProfileSignal = signal<UserProfile | null>({
    uid: 'teacher-1',
    displayName: 'Teacher One',
    email: 'teacher1@madrasati.tn',
    photoURL: null,
    role: 'teacher',
  });

  beforeEach(() => {
    localStorage.clear();
    mockUserSignal.set({ uid: 'teacher-1' });
    mockProfileSignal.set({
      uid: 'teacher-1',
      displayName: 'Teacher One',
      email: 'teacher1@madrasati.tn',
      photoURL: null,
      role: 'teacher',
    });

    mockFirebase = {
      currentUser: mockUserSignal,
      userProfile: mockProfileSignal,
      db: null,
    };

    mockLang = {
      lang: signal('fr'),
      t: (k: string, p?: Record<string, string>) => k,
      tr: (fr: string, ar: string) => fr,
    };

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: FirebaseService, useValue: mockFirebase },
        { provide: LanguageService, useValue: mockLang },
      ],
    });

    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created and contain default local announcements', () => {
    expect(service).toBeTruthy();
    const visible = service.visible();
    expect(visible.length).toBeGreaterThan(0);
    const memoNotif = visible.find((n) => n.id === 'announce:memo-studio:v1');
    expect(memoNotif).toBeDefined();
    expect(memoNotif?.category).toBe('announcement');
  });

  it('should exclude authored notifications for the current user', () => {
    const rawNotif: AppNotification = {
      id: 'doc-123',
      category: 'activity',
      titleKey: 'notifNewDocTitle',
      messageKey: 'notifNewDocMsg',
      createdAt: Date.now(),
      authorId: 'teacher-1', // Same as current user
      targetRole: 'all',
    };

    (service as any).mergeRemoteNotifications([rawNotif]);

    const visible = service.visible();
    const found = visible.find((n) => n.id === 'doc-123');
    expect(found).toBeUndefined();
  });

  it('should include notifications authored by other users', () => {
    const rawNotif: AppNotification = {
      id: 'doc-456',
      category: 'activity',
      titleKey: 'notifNewDocTitle',
      messageKey: 'notifNewDocMsg',
      createdAt: Date.now(),
      authorId: 'teacher-2', // Different author
      targetRole: 'all',
    };

    (service as any).mergeRemoteNotifications([rawNotif]);

    const visible = service.visible();
    const found = visible.find((n) => n.id === 'doc-456');
    expect(found).toBeDefined();
    expect(found?.isRead).toBe(false);
  });

  it('should filter by recipientId when targeted to a specific user', () => {
    const forMe: AppNotification = {
      id: 'dm-1',
      category: 'activity',
      titleKey: 'notifQaReplyTitle',
      messageKey: 'notifQaReplyMsg',
      createdAt: Date.now(),
      recipientId: 'teacher-1',
      authorId: 'teacher-2',
    };

    const forOther: AppNotification = {
      id: 'dm-2',
      category: 'activity',
      titleKey: 'notifQaReplyTitle',
      messageKey: 'notifQaReplyMsg',
      createdAt: Date.now(),
      recipientId: 'parent-99',
      authorId: 'teacher-2',
    };

    (service as any).mergeRemoteNotifications([forMe, forOther]);

    const visible = service.visible();
    expect(visible.find((n) => n.id === 'dm-1')).toBeDefined();
    expect(visible.find((n) => n.id === 'dm-2')).toBeUndefined();
  });

  it('should mark an item as read per-user without modifying original payload', async () => {
    const notifId = 'announce:memo-studio:v1';
    expect(service.visible().find((n) => n.id === notifId)?.isRead).toBe(false);

    await service.markRead(notifId);

    expect(service.visible().find((n) => n.id === notifId)?.isRead).toBe(true);
  });

  it('should mark all visible notifications as read', async () => {
    expect(service.unreadCount()).toBeGreaterThan(0);

    await service.markAllRead();

    expect(service.unreadCount()).toBe(0);
    expect(service.visible().every((n) => n.isRead)).toBe(true);
  });

  it('should dismiss a notification and remove it from visible list', async () => {
    const notifId = 'announce:ocr:v1';
    expect(service.visible().find((n) => n.id === notifId)).toBeDefined();

    await service.dismiss(notifId);

    expect(service.visible().find((n) => n.id === notifId)).toBeUndefined();
  });

  it('should validate routeUrl format when emitting', async () => {
    await expect(
      service.emit({
        category: 'activity',
        titleKey: 'notifNewDocTitle',
        messageKey: 'notifNewDocMsg',
        routeUrl: 'invalid-route-no-slash',
      })
    ).rejects.toThrow(/must start with '\/'/);
  });
});
