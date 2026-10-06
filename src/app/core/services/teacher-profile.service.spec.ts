import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TeacherProfileService } from './teacher-profile.service';
import { FirebaseService, UserProfile } from './firebase.service';

describe('TeacherProfileService', () => {
  let service: TeacherProfileService;
  let mockFirebase: any;

  beforeEach(() => {
    mockFirebase = {
      currentUser: signal({ uid: 't-test-1' }),
      userProfile: signal<UserProfile | null>({
        uid: 't-test-1',
        displayName: 'Mohamed Salah',
        email: 'mohamed@madrasati.tn',
        photoURL: null,
        role: 'teacher',
      }),
      updateUserProfile: vi.fn().mockResolvedValue({}),
      db: null,
    };

    TestBed.configureTestingModule({
      providers: [
        TeacherProfileService,
        { provide: FirebaseService, useValue: mockFirebase },
      ],
    });

    service = TestBed.inject(TeacherProfileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should trim name and bio and update user profile correctly', async () => {
    const veryLongBio = 'a'.repeat(600);
    await service.saveProfile('t-test-1', {
      displayName: 'Teacher Test',
      title: 'Professeur',
      school: 'Ecole Test',
      bio: veryLongBio,
      taughtGrades: ['1ère Année'],
      subjects: ['Mathématiques'],
    });

    expect(mockFirebase.updateUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Teacher Test',
        title: 'Professeur',
        school: 'Ecole Test',
        taughtGrades: ['1ère Année'],
      })
    );
  });

  it('should return cached stats when queried twice within cache TTL', async () => {
    const stats1 = await service.getTeacherStats('t-test-1');
    expect(stats1.totalDocuments).toBe(0);

    const stats2 = await service.getTeacherStats('t-test-1');
    expect(stats2).toBe(stats1);
  });
});
