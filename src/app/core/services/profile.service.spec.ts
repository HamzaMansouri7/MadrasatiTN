import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ProfileService } from './profile.service';
import { FirebaseService } from './firebase.service';
import { EducationStore } from './education-store';
import { signal } from '@angular/core';
import { UserProfile } from '../models/education.model';

describe('ProfileService', () => {
  let service: ProfileService;
  let mockUserProfile: ReturnType<typeof signal<UserProfile | null>>;

  beforeEach(() => {
    mockUserProfile = signal<UserProfile | null>(null);

    const firebaseMock = {
      userProfile: mockUserProfile,
      db: null,
      updateUserProfile: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
    };

    const storeMock = {
      watchlist: signal({ courses: [], exercises: [], teachers: [] }),
      showToast: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ProfileService,
        { provide: FirebaseService, useValue: firebaseMock },
        { provide: EducationStore, useValue: storeMock },
      ],
    });

    service = TestBed.inject(ProfileService);
  });

  it('should calculate 0% completeness when profile is null', () => {
    expect(service.completeness().score).toBe(0);
    expect(service.completeness().missingSteps.length).toBe(0);
  });

  it('should correctly calculate completeness for teacher role', () => {
    mockUserProfile.set({
      uid: 't-123',
      displayName: 'Moncef Trabelsi',
      email: 'moncef@test.tn',
      photoURL: 'https://storage/avatar.webp',
      role: 'teacher',
      activeRole: 'teacher',
      school: 'École Habib Bourguiba',
      taughtGrades: ['4ème Année', '5ème Année'],
      subjects: ['Mathématiques'],
      bio: 'Enseignant expérimenté de mathématiques.',
    });

    const comp = service.completeness();
    expect(comp.score).toBe(100);
    expect(comp.missingSteps.length).toBe(0);
  });

  it('should flag missing steps for incomplete teacher profile', () => {
    mockUserProfile.set({
      uid: 't-123',
      displayName: 'Moncef',
      email: 'moncef@test.tn',
      photoURL: null,
      role: 'teacher',
      activeRole: 'teacher',
      school: '',
      taughtGrades: [],
      subjects: [],
      bio: '',
    });

    const comp = service.completeness();
    expect(comp.score).toBeLessThan(100);
    expect(comp.missingSteps).toContain('Photo de profil');
    expect(comp.missingSteps).toContain('Établissement scolaire');
  });

  it('should correctly calculate completeness for parent role', () => {
    mockUserProfile.set({
      uid: 'p-123',
      displayName: 'Sami Parent',
      email: 'sami@test.tn',
      photoURL: null,
      role: 'parent',
      activeRole: 'parent',
      phone: '+216 98 123 456',
      governorate: 'Ariana',
    });

    expect(service.completeness().score).toBe(100);
  });

  it('should export user data as valid JSON package', async () => {
    mockUserProfile.set({
      uid: 'p-123',
      displayName: 'Sami Parent',
      email: 'sami@test.tn',
      photoURL: null,
      role: 'parent',
      phone: '+216 98 123 456',
    });

    const json = await service.exportUserData();
    const parsed = JSON.parse(json);
    expect(parsed.userProfile.uid).toBe('p-123');
    expect(parsed.platform).toContain('Madrasati TN');
  });
});
