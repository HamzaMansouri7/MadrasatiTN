import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Request } from 'express';

/** `storage` reads the Firebase config from the working directory, so a missing config is a cwd without the file. */
async function loadStorage(configPresent: boolean) {
  vi.resetModules();
  if (!configPresent) vi.spyOn(process, 'cwd').mockReturnValue(mkdtempSync(join(tmpdir(), 'no-firebase-config-')));
  return import('./storage');
}

const req = { headers: { authorization: 'Bearer token-123' } } as unknown as Request;

/** First fetch = token lookup (gives the uid), second = the teachers/{uid} profile. */
function mockFetch(profile: { ok: boolean; body?: unknown } | 'throw') {
  const fetchMock = vi.fn(async (url: string) => {
    if (String(url).includes('identitytoolkit')) {
      return { ok: true, json: async () => ({ users: [{ localId: 'uid1' }] }) } as Response;
    }
    if (profile === 'throw') throw new Error('network');
    return { ok: profile.ok, json: async () => profile.body } as Response;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('verifyTeacherUser', () => {
  beforeEach(() => {
    process.env['FIREBASE_API_KEY'] = 'k';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('accepts a profile whose verified field is "verified"', async () => {
    mockFetch({ ok: true, body: { fields: { verified: { stringValue: 'verified' }, displayName: { stringValue: 'Mme Salma' } } } });
    const { verifyTeacherUser } = await loadStorage(true);
    const res = await verifyTeacherUser(req);
    expect(res).toMatchObject({ uid: 'uid1', isVerifiedTeacher: true, displayName: 'Mme Salma' });
  });

  it('rejects a pending or unverified profile', async () => {
    mockFetch({ ok: true, body: { fields: { verified: { stringValue: 'pending' } } } });
    const { verifyTeacherUser } = await loadStorage(true);
    const res = await verifyTeacherUser(req);
    expect(res).toMatchObject({ uid: 'uid1', isVerifiedTeacher: false });
  });

  it('fails closed when the Firebase config is missing', async () => {
    mockFetch({ ok: true, body: { fields: { verified: { stringValue: 'verified' } } } });
    const { verifyTeacherUser } = await loadStorage(false);
    const res = await verifyTeacherUser(req);
    expect(res).toMatchObject({ uid: 'uid1', isVerifiedTeacher: false });
  });

  it('fails closed when the profile cannot be read', async () => {
    mockFetch({ ok: false });
    const { verifyTeacherUser } = await loadStorage(true);
    const res = await verifyTeacherUser(req);
    expect(res).toMatchObject({ uid: 'uid1', isVerifiedTeacher: false });
  });

  it('fails closed when the profile request throws', async () => {
    mockFetch('throw');
    const { verifyTeacherUser } = await loadStorage(true);
    const res = await verifyTeacherUser(req);
    expect(res).toMatchObject({ uid: 'uid1', isVerifiedTeacher: false });
  });
});
