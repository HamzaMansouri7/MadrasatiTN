import { join } from 'node:path';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
} from 'node:fs';
import { Request } from 'express';

export const uploadsFolder = process.env['UPLOAD_DIR'] || join(process.cwd(), 'uploads');
export const docsFolder = process.env['DATA_DIR'] || join(process.cwd(), 'docs');

if (!existsSync(uploadsFolder)) {
  mkdirSync(uploadsFolder, { recursive: true });
}
if (!existsSync(docsFolder)) {
  mkdirSync(docsFolder, { recursive: true });
}

// 5. Magic Byte Validation for Uploaded Files
export const validateFileMagicBytes = (buffer: Buffer, declaredExt: string): boolean => {
  if (buffer.length < 4) return false;

  // PDF: %PDF- (0x25 0x50 0x44 0x46)
  if (declaredExt === 'pdf') {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }
  // PNG: \x89PNG (0x89 0x50 0x4e 0x47)
  if (declaredExt === 'png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  // JPEG: 0xFF 0xD8 0xFF
  if (declaredExt === 'jpg' || declaredExt === 'jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  // WEBP: RIFF....WEBP (0x52 0x49 0x46 0x46)
  if (declaredExt === 'webp') {
    return (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  // DOCX / ZIP: PK\x03\x04 (0x50 0x4b 0x03 0x04)
  if (declaredExt === 'docx') {
    return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
  }

  return false;
};

export const ALLOWED_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'jpeg', 'webp', 'docx']);
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB

// AI-generated files live in uploads/generated/<yyyy-mm>/ (kept forever: saved docs link to them).
export const saveGenerated = (filename: string, data: Buffer | string): string => {
  const month = new Date().toISOString().slice(0, 7);
  const dir = join(uploadsFolder, 'generated', month);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, filename), data);
  return `/uploads/generated/${month}/${filename}`;
};

export const USER_QUOTA_BYTES = Number(process.env['UPLOAD_QUOTA_MB'] || 100) * 1024 * 1024;

export const UPLOAD_KINDS = new Set(['avatars', 'courses', 'articles', 'documents', 'notebooks']);
const SAFE_UID = /^[A-Za-z0-9_-]{1,64}$/;

export const userUsageBytes = (uid: string): number => {
  let total = 0;
  for (const kind of UPLOAD_KINDS) {
    const dir = join(uploadsFolder, kind, uid);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      try {
        total += statSync(join(dir, f)).size;
      } catch {
        /* file vanished */
      }
    }
  }
  return total;
};

export const pruneOldAvatars = (uid: string, keep: string): void => {
  const dir = join(uploadsFolder, 'avatars', uid);
  for (const f of readdirSync(dir)) {
    if (f === keep) continue;
    try {
      unlinkSync(join(dir, f));
    } catch {
      /* ignore */
    }
  }
};


const firebaseApiKey: string | undefined =
  process.env['FIREBASE_API_KEY'] ||
  (() => {
    try {
      return JSON.parse(readFileSync(join(process.cwd(), 'firebase-applet-config.json'), 'utf8')).apiKey as string;
    } catch {
      return undefined;
    }
  })();
const verifiedTokens = new Map<string, { uid: string; expires: number }>();

export const verifyFirebaseUser = async (req: Request): Promise<string | null> => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token || !firebaseApiKey) return null;

  const cached = verifiedTokens.get(token);
  if (cached && cached.expires > Date.now()) return cached.uid;

  try {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as { users?: { localId?: string }[] };
    const uid = data.users?.[0]?.localId;
    if (!uid || !SAFE_UID.test(uid)) return null;
    if (verifiedTokens.size > 500) verifiedTokens.clear();
    verifiedTokens.set(token, { uid, expires: Date.now() + 5 * 60 * 1000 });
    return uid;
  } catch {
    return null;
  }
};

export interface VerifiedTeacherResult {
  uid: string;
  isVerifiedTeacher: boolean;
  displayName: string;
}

const getFirebaseConfig = (): { projectId?: string; apiKey?: string; firestoreDatabaseId?: string } | null => {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
  } catch {
    return null;
  }
};

/**
 * A "trusted" teacher is one whose public profile (`teachers/{uid}`) has `verified === 'verified'`.
 * Firestore rules let owners move that field only none -> pending, so only an admin can grant it.
 * Fails closed: any missing config, unreadable profile or error means "not verified".
 */
export const verifyTeacherUser = async (req: Request): Promise<VerifiedTeacherResult | null> => {
  const uid = await verifyFirebaseUser(req);
  if (!uid) return null;
  const notVerified = (displayName = 'Enseignant'): VerifiedTeacherResult => ({ uid, isVerifiedTeacher: false, displayName });

  try {
    const config = getFirebaseConfig();
    if (!config?.projectId || !config.apiKey) return notVerified();

    const dbId = config.firestoreDatabaseId || '(default)';
    // `teachers` is publicly readable, so no user token is sent along.
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${dbId}/documents/teachers/${uid}?key=${config.apiKey}`;
    const r = await fetch(url);
    if (!r.ok) return notVerified();

    const doc = (await r.json()) as { fields?: Record<string, { stringValue?: string }> };
    const name = doc.fields?.['displayName']?.stringValue || 'Enseignant';
    return { uid, isVerifiedTeacher: doc.fields?.['verified']?.stringValue === 'verified', displayName: name };
  } catch {
    return notVerified();
  }
};
