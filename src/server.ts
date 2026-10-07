import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { Request, Response, NextFunction } from 'express';
import { join, resolve } from 'node:path';
import mammoth from 'mammoth';
import { GoogleGenAI, Type } from '@google/genai';
import { retrieveContext, registerSources } from './server/knowledge-source';
import { MEMO_SCHEMA, BLOCK_SCHEMAS } from './server/memo-schema';
import { resolveLang, langRule } from './server/lang';
import { checkExercise } from './server/post-checks';
import { generateMemoDocx } from './server/memo-docx';
import { runChain } from './server/ai/chain';
import { ChainName } from './server/ai/types';
import {
  compose,
  exerciseSkill,
  exerciseTransformSkill,
  exerciseVariantSkill,
  memoSkill,
  explainSkill,
  announcementSkill,
  tagSkill,
  examSkill,
  enforceExamTotal20,
  solveSkill,
  summarizeSkill,
  articleSkill,
  worksheetDnaSkill,
  worksheetSimilarSkill,
  enforceExactExerciseCount,
} from './server/skills';
import { sanitizeSvg } from './server/ai/svg-sanitize';
import { resolveInside } from './server/safe-path';
import { wrapData, capHistory, capText, CAPS } from './server/input-caps';
import { toPublicError } from './server/ai/public-error';
import { createCache, hashKey } from './server/ai/cache';
import { generateImage } from './server/ai/image-chain';
import { FIRST_GRADE_EXERCISES, FIRST_GRADE_COURSES } from './app/core/data/first-grade-exercises.data';

const exerciseCache = createCache<Record<string, unknown>>({
  ttlMs: 24 * 60 * 60 * 1000,
  max: 500,
});
import { LIBRARY_EXERCISES } from './app/core/data/library-exercises.data';
import { CNP_PRIMARY_COURSES } from './app/core/data/cnp-books.data';
import { SEED_BANK_EXERCISES, SEED_COURSES } from './app/core/data/seed-docs.data';
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, unlinkSync, rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const browserDistFolder = join(import.meta.dirname, '../browser');
const uploadsFolder = process.env['UPLOAD_DIR'] || join(process.cwd(), 'uploads');
// Persisted shared worksheets (zero-cost JSON on disk, same pattern as /uploads).
const docsFolder = process.env['DATA_DIR'] || join(process.cwd(), 'docs');

if (!existsSync(uploadsFolder)) {
  mkdirSync(uploadsFolder, { recursive: true });
}
if (!existsSync(docsFolder)) {
  mkdirSync(docsFolder, { recursive: true });
}

// 0. Pure Google Identity Token Verification (Zero Vite SSR bundling issues)
const FIREBASE_API_KEY = process.env['FIREBASE_API_KEY'] || 'AIzaSyDUTwZiE6Wm0w4M5LUu8vB1hS-eN_1K3QY';

export interface VerifiedUser {
  uid: string;
  email?: string;
  displayName?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: VerifiedUser;
}

const verifyGoogleIdToken = async (idToken: string): Promise<VerifiedUser | null> => {
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json();
    if (data.users && data.users.length > 0) {
      const u = data.users[0];
      return {
        uid: u.localId,
        email: u.email,
        displayName: u.displayName,
      };
    }
  } catch (err) {
    console.error('Google token verification error:', err);
  }
  return null;
};

// Server-Side Token Verification Middlewares
export const verifyAuthToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env['NODE_ENV'] !== 'production' && !authHeader) {
      next();
      return;
    }
    res.status(401).json({ error: 'Authentification requise : Veuillez vous connecter avec un compte vérifié.' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];
  const user = await verifyGoogleIdToken(idToken);
  if (!user) {
    res.status(401).json({ error: 'Session expirée ou jeton d\'authentification invalide.' });
    return;
  }

  req.user = user;
  next();
};

export const optionalAuthToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1];
    const user = await verifyGoogleIdToken(idToken);
    if (user) {
      req.user = user;
    }
  }
  next();
};

const app = express();

// 1. Reduced Body Limit (16MB max to prevent memory exhaustion)
app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({ extended: true, limit: '16mb' }));

// 2. Origin & CORS Security Guard for API Endpoints
const ALLOWED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '169.58.107.183',
  'madrastihub.com',
  'www.madrastihub.com',
]);

const originGuard = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host?.split(':')[0];

  // Allow same-origin requests or direct trusted browser requests
  if (!origin && !referer) {
    if (host && ALLOWED_HOSTS.has(host)) {
      next();
      return;
    }
  }

  const checkUrl = origin || referer;
  if (checkUrl) {
    try {
      const parsedHost = new URL(checkUrl).hostname;
      if (ALLOWED_HOSTS.has(parsedHost)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
          res.sendStatus(204);
          return;
        }
        next();
        return;
      }
    } catch {
      // Invalid URL
    }
  }

  // If running locally in development without strict origin
  if (process.env['NODE_ENV'] !== 'production') {
    next();
    return;
  }

  res.status(403).json({ error: 'Accès non autorisé (Origine non reconnue)' });
};

// 3. Sliding-Window Rate Limiter
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const createRateLimiter = (maxRequests: number, windowMs: number, label: string) => {
  const ipStore = new Map<string, RateLimitRecord>();

  // Cleanup expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [ip, rec] of ipStore.entries()) {
      if (rec.resetAt <= now) ipStore.delete(ip);
    }
  }, windowMs).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    let record = ipStore.get(ip);

    if (!record || record.resetAt <= now) {
      record = { count: 1, resetAt: now + windowMs };
      ipStore.set(ip, record);
      next();
      return;
    }

    if (record.count >= maxRequests) {
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      res.status(429).json({
        error: `Trop de requêtes (${label}). Veuillez patienter ${retryAfterSec} secondes.`,
      });
      return;
    }

    record.count++;
    next();
  };
};

const uploadRateLimiter = createRateLimiter(10, 15 * 60 * 1000, 'Uploads limités à 10 par 15 min');

// Per-IP guards sized against the shared Gemini free tier (15 RPM / 1500 RPD):
// 8/min keeps two busy users under the global RPM; 60/day stops a single IP
// from draining the server-wide daily pool.
const aiPerIpMinuteLimiter = createRateLimiter(8, 60 * 1000, 'Requêtes IA limitées à 8 par minute');
const aiPerIpDailyLimiter = createRateLimiter(60, 24 * 60 * 60 * 1000, 'Quota IA personnel du jour atteint');
const aiRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  aiPerIpMinuteLimiter(req, res, () => aiPerIpDailyLimiter(req, res, next));
};

// Global guards for the shared Gemini free-tier quota (15 RPM / 1500 RPD).
// Per-IP limits don't stop many IPs collectively draining it; these hard-cap
// server-wide AI calls with a safety margin under the free-tier ceilings.
const AI_DAILY_CAP = 1200;
const AI_MINUTE_CAP = 12;
let aiDailyUsage = { day: '', count: 0 };
let aiMinuteUsage = { minute: '', count: 0 };
const aiDailyGuard = (_req: Request, res: Response, next: NextFunction): void => {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const thisMinute = now.slice(0, 16);
  if (aiDailyUsage.day !== today) aiDailyUsage = { day: today, count: 0 };
  if (aiMinuteUsage.minute !== thisMinute) aiMinuteUsage = { minute: thisMinute, count: 0 };
  if (aiDailyUsage.count >= AI_DAILY_CAP) {
    res.status(503).json({ error: "Quota IA quotidien atteint. Réessayez demain." });
    return;
  }
  if (aiMinuteUsage.count >= AI_MINUTE_CAP) {
    res.setHeader('Retry-After', 60);
    res.status(429).json({ error: 'Service IA très sollicité. Réessayez dans une minute.' });
    return;
  }
  aiDailyUsage.count++;
  aiMinuteUsage.count++;
  next();
};

// 4. Secure Static Serving of /uploads with CSP and anti-sniffing headers
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    res.setHeader('Cache-Control', 'public, max-age=86400');
    next();
  },
  express.static(uploadsFolder, {
    dotfiles: 'deny',
    index: false,
  })
);

// 5. Magic Byte Validation for Uploaded Files
const validateFileMagicBytes = (buffer: Buffer, declaredExt: string): boolean => {
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

// 6. Hardened File Upload Endpoint
const ALLOWED_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'jpeg', 'webp', 'docx']);
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB

// AI-generated files live in uploads/generated/<yyyy-mm>/ so they can be purged separately.
const saveGenerated = (filename: string, data: Buffer | string): string => {
  const month = new Date().toISOString().slice(0, 7);
  const dir = join(uploadsFolder, 'generated', month);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, filename), data);
  return `/uploads/generated/${month}/${filename}`;
};

// Per-user disk quota (all kinds together) and housekeeping.
const USER_QUOTA_BYTES = Number(process.env['UPLOAD_QUOTA_MB'] || 100) * 1024 * 1024;
const GENERATED_TTL_DAYS = Number(process.env['GENERATED_TTL_DAYS'] || 90);

const userUsageBytes = (uid: string): number => {
  let total = 0;
  for (const kind of UPLOAD_KINDS) {
    const dir = join(uploadsFolder, kind, uid);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      try {
        total += statSync(join(dir, f)).size;
      } catch { /* file vanished */ }
    }
  }
  return total;
};

/** An avatar replaces the previous one: keep only the file just written. */
const pruneOldAvatars = (uid: string, keep: string): void => {
  const dir = join(uploadsFolder, 'avatars', uid);
  for (const f of readdirSync(dir)) {
    if (f === keep) continue;
    try {
      unlinkSync(join(dir, f));
    } catch { /* ignore */ }
  }
};

/** Delete AI-generated files older than GENERATED_TTL_DAYS, then empty month folders. */
const purgeGenerated = (): void => {
  const root = join(uploadsFolder, 'generated');
  if (!existsSync(root)) return;
  const cutoff = Date.now() - GENERATED_TTL_DAYS * 24 * 60 * 60 * 1000;
  for (const month of readdirSync(root)) {
    const dir = join(root, month);
    try {
      for (const f of readdirSync(dir)) {
        const fp = join(dir, f);
        if (statSync(fp).mtimeMs < cutoff) unlinkSync(fp);
      }
      if (readdirSync(dir).length === 0) rmSync(dir, { recursive: true });
    } catch { /* ignore */ }
  }
};
purgeGenerated();
setInterval(purgeGenerated, 24 * 60 * 60 * 1000).unref();

// Storage layout: uploads/<kind>/<uid>/<file>. Legacy flat files in uploads/ stay served as-is.
const UPLOAD_KINDS = new Set(['avatars', 'courses', 'articles', 'documents', 'notebooks']);
const SAFE_UID = /^[A-Za-z0-9_-]{1,64}$/;

// Firebase ID-token check without a service account: Identity Toolkit resolves the token to its uid.
// The web API key is public (same value the client ships), so no secret is needed on the VPS.
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

const verifyFirebaseUser = async (req: Request): Promise<string | null> => {
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

app.post('/api/upload', originGuard, uploadRateLimiter, async (req, res): Promise<void> => {
  try {
    const uid = await verifyFirebaseUser(req);
    if (!uid) {
      res.status(401).json({ error: 'Connexion requise pour envoyer un fichier.' });
      return;
    }
    const rawData = req.body.base64Data || req.body.fileData || req.body.fileBase64;
    const rawName = req.body.filename || req.body.fileName;
    const rawType = req.body.contentType || req.body.fileType || req.body.mimeType;
    const kind = UPLOAD_KINDS.has(req.body.kind) ? (req.body.kind as string) : 'documents';

    if (!rawData || typeof rawData !== 'string') {
      res.status(400).json({ error: 'Aucun fichier transmis ou format invalide' });
      return;
    }

    // Strip base64 prefix if present
    const base64Clean = rawData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    if (buffer.length > MAX_UPLOAD_BYTES) {
      res.status(413).json({ error: 'Fichier trop volumineux (limite 15 Mo)' });
      return;
    }

    let ext = ((rawName || '').split('.').pop() || '').toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      ext = rawType?.includes('pdf') ? 'pdf' : rawType?.includes('png') ? 'png' : 'jpg';
    }

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      res.status(400).json({ error: 'Format de fichier non autorisé. Formats acceptés : PDF, PNG, JPG, WEBP, DOCX.' });
      return;
    }

    // Sniff Magic Bytes
    if (!validateFileMagicBytes(buffer, ext)) {
      res.status(400).json({ error: 'Contenu du fichier corrompu ou ne correspondant pas à son extension.' });
      return;
    }

    const cleanName = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    if (userUsageBytes(uid) + buffer.length > USER_QUOTA_BYTES) {
      res.status(413).json({ error: `Quota de stockage atteint (${Math.round(USER_QUOTA_BYTES / 1024 / 1024)} Mo). Supprimez d'anciens fichiers.` });
      return;
    }

    const targetDir = join(uploadsFolder, kind, uid);
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(join(targetDir, cleanName), buffer);
    if (kind === 'avatars') pruneOldAvatars(uid, cleanName);

    res.json({
      success: true,
      url: `/uploads/${kind}/${uid}/${cleanName}`,
      filename: cleanName,
      size: buffer.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur d\'upload';
    console.error('Upload error:', err);
    res.status(500).json({ error: message });
  }
});

// Initialize Gemini Client(s) with multi-key pooling & dynamic rotation
const rawApiKeys = [
  ...new Set(
    Object.entries(process.env)
      .filter(([k, v]) => k.startsWith('GEMINI_API_KEY') && typeof v === 'string')
      .map(([, v]) => v as string)
      .join(',')
      .split(/[,\n]/)
      .map(k => k.trim().replace(/^["']|["']$/g, ''))
      .filter(k => k.length > 0),
  ),
];

// 60 s per call so a hung request fails over to the next key/model instead of stalling the chain.
const aiClients: GoogleGenAI[] = rawApiKeys.map(key => new GoogleGenAI({ apiKey: key, httpOptions: { timeout: 60000 } }));

/**
 * Shared AI helpers — structured JSON output, retry, dual-language (AR default),
 * and official CNP curriculum grounding via the KnowledgeSource layer.
 */
type GeminiPart = { inlineData: { mimeType: string; data: string } } | { text: string };

const openRouterKey = (process.env['OPENROUTER_API_KEY'] || '').trim().replace(/^["']|["']$/g, '');
const aiReady = () => aiClients.length > 0 || !!openRouterKey;

/** Plain-text generation (used for SVG fallback) */
async function aiGenerateText(prompt: string): Promise<string> {
  if (aiClients.length === 0) throw new Error('Aucune clé Gemini disponible');
  const response = await aiClients[0].models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  if (!response.text) throw new Error('Réponse vide');
  return response.text;
}

/** Executes structured JSON generation across the specified provider fallback chain. */
async function aiGenerateJSON(
  chain: ChainName,
  contents: string | GeminiPart[],
  schema?: object,
  temperature = 0.4,
): Promise<Record<string, unknown>> {
  return runChain(chain, contents, schema, temperature);
}

/** Official curriculum grounding block (empty string when no match). */
const buildGrounding = (q: { grade?: string; subject?: string; trimester?: string; topic?: string; lang: 'ar' | 'fr' }): string => {
  const { block } = retrieveContext(q);
  return block ? `\n${block}\n` : '';
};

/** Official curriculum grounding + strict language instruction block */
const contextBlock = (q: { grade?: string; subject?: string; trimester?: string; topic?: string; lang: 'ar' | 'fr' }): string =>
  `${buildGrounding(q)}${langRule(q.lang)}`;

// Schemas and response contracts are encapsulated in src/server/skills/

/** Clamp qcmCorrectIndex into range so a model drift can never break the UI. */
function sanitizeExercise<T extends { qcmOptions?: string[]; qcmCorrectIndex?: number }>(ex: T): T {
  const check = checkExercise(ex as Record<string, unknown>);
  if (!check.valid) {
    console.warn('[sanitizeExercise] Post-check warning:', check.errors.join('; '));
  }
  if (Array.isArray(ex.qcmOptions) && ex.qcmOptions.length > 0) {
    const idx = typeof ex.qcmCorrectIndex === 'number' ? ex.qcmCorrectIndex : 0;
    ex.qcmCorrectIndex = Math.min(Math.max(idx, 0), ex.qcmOptions.length - 1);
  }
  return ex;
}

/**
 * Hardened AI Assistant Endpoints with Origin Guard & Rate Limiting
 */

// 1. Generate Exercise (Dual-Mode: Teacher vs Parent)
app.post('/api/ai/generate-exercise', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { grade, subject, topic, difficulty, format, role, childName, language, trimester, points } = req.body;

    if (!grade || !subject) {
      res.status(400).json({ error: 'Le niveau (grade) et la matière (subject) sont requis.' });
      return;
    }

    if (!aiReady()) {
      res.status(500).json({
        error: 'Service IA non configuré dans le serveur backend.',
      });
      return;
    }

    const lang = resolveLang(language);
    const safeTopic = (topic || '').slice(0, 300);
    const validFormats = ['free', 'qcm', 'true_false', 'fill_blanks', 'matching'];
    const requestedFormat = validFormats.includes(format) ? format : undefined;
    const isParent = role === 'parent';

    const cacheKey = hashKey({ grade, subject, topic: safeTopic, difficulty, format: requestedFormat, role, language: lang, trimester, points });
    const cached = exerciseCache.get(cacheKey);
    if (cached) {
      res.json({ success: true, exercise: cached['exercise'], cached: true });
      return;
    }

    const prompt = compose(exerciseSkill, {
      grade,
      subject,
      trimester,
      topic: safeTopic,
      lang,
      contextBlockStr: contextBlock({ grade, subject, trimester, topic: safeTopic, lang }),
      difficulty,
      format: requestedFormat,
      points: typeof points === 'number' ? points : 5,
      dataTags: {
        topic: safeTopic,
        child_context: isParent ? `Enfant : ${childName || "l'élève"}` : '',
      },
    });

    const data = await aiGenerateJSON('A', prompt, exerciseSkill.schema, exerciseSkill.temperature);
    const sanitized = sanitizeExercise(data as { qcmOptions?: string[]; qcmCorrectIndex?: number });
    exerciseCache.set(cacheKey, { exercise: sanitized });

    res.json({ success: true, exercise: sanitized });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/generate-exercise:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 1a. Transform / Refine Exercise with Contextual Prompts (A10)
app.post('/api/ai/transform-exercise', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { originalBlock, transformType, customInstruction, grade, subject, language, trimester, topic } = req.body;

    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }

    const lang = resolveLang(language);

    let instructionText = '';
    switch (transformType) {
      case 'tunisian_context':
        instructionText = 'Adapte le contexte à la vie quotidienne tunisienne (utiliser des villes tunisiennes comme Sfax, Sousse, Bizerte, des dinars et millimes, ou des prénoms tunisiens comme Youssef, Mariem, Aziz). Garde la même structure pédagogique.';
        break;
      case 'simplify_vocab':
        instructionText = 'Simplifie le vocabulaire et les consignes pour un élève qui a des difficultés de lecture ou de compréhension, tout en conservant le niveau mathématique/disciplinaire.';
        break;
      case 'add_trap':
        instructionText = 'Ajoute un piège classique ou une subtilité fréquente d\'examen trimestriel tunisien pour pousser l\'élève à réfléchir avec plus d\'attention.';
        break;
      case 'to_qcm':
        instructionText = 'Transforme cet exercice en QCM à choix multiples (3 ou 4 options avec 1 seule bonne réponse claire).';
        break;
      default:
        instructionText = customInstruction || 'Améliore la formulation pédagogique.';
    }

    const prompt = compose(exerciseTransformSkill, {
      grade,
      subject,
      trimester,
      topic: (topic || '').slice(0, 300),
      lang,
      contextBlockStr: contextBlock({ grade, subject, trimester, topic: (topic || '').slice(0, 300), lang }),
      transformationType: transformType,
      targetFormat: transformType === 'to_qcm' ? 'qcm' : undefined,
      customInstruction: instructionText,
      dataTags: {
        original_exercise: typeof originalBlock === 'string' ? originalBlock : JSON.stringify(originalBlock),
        instruction: instructionText,
      },
    });

    const data = await aiGenerateJSON('A', prompt, exerciseTransformSkill.schema, exerciseTransformSkill.temperature);

    res.json({ success: true, transformed: sanitizeExercise(data as { qcmOptions?: string[]; qcmCorrectIndex?: number }) });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/transform-exercise:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 1b. Generate Full 20-Point Tunisian Exam with Multiple Blocks
app.post('/api/ai/generate-full-exam', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { grade, subject, trimester, topic, topics, language } = req.body;

    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }

    const lang = resolveLang(language);
    const safeTopic = (topic || topics || '').slice(0, 300);
    const prompt = compose(examSkill, {
      grade,
      subject,
      trimester,
      topic: safeTopic,
      topics: safeTopic,
      lang,
      contextBlockStr: contextBlock({ grade, subject, trimester, topic: safeTopic, lang }),
    });

    const data = await aiGenerateJSON(examSkill.chain, prompt, examSkill.schema, examSkill.temperature);
    enforceExamTotal20(data as { sections?: { points?: number }[] });

    res.json({ success: true, exam: data });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/generate-full-exam:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 1c. Solve / Correct Exercise with Step-by-Step AI Explanation
app.post('/api/ai/solve-exercise', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { promptText, grade, subject, language, trimester, topic } = req.body;

    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }

    const lang = resolveLang(language);
    const safePrompt = (promptText || '').slice(0, 1500);
    const prompt = compose(solveSkill, {
      grade,
      subject,
      language,
      trimester,
      topic,
      promptText: safePrompt,
      contextBlockStr: contextBlock({ grade, subject, trimester, topic: (topic || safePrompt).slice(0, 300), lang }),
    });

    const data = await aiGenerateJSON('A', prompt, solveSkill.schema, solveSkill.temperature);

    res.json({ success: true, result: data });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/solve-exercise:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 2. Draft Announcement for Teacher
app.post('/api/ai/draft-announcement', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { purpose, details, targetAudience, language, grade, subject, trimester } = req.body;

    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }

    const lang = resolveLang(language);
    const safePurpose = (purpose || '').slice(0, 300);
    const safeDetails = (details || '').slice(0, 500);
    const context = grade || subject ? contextBlock({ grade, subject, trimester, topic: safePurpose, lang }) : langRule(lang);

    const prompt = compose(announcementSkill, {
      grade,
      purpose: safePurpose,
      details: safeDetails,
      contextBlockStr: context,
      dataTags: {
        objectif: safePurpose,
        details: safeDetails,
        destinataires: targetAudience || '',
      },
    });

    const data = await aiGenerateJSON('B', prompt, announcementSkill.schema, announcementSkill.temperature);

    res.json({ success: true, result: data });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/draft-announcement:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 3. Explain Concept for Student (Tutor AI)
app.post('/api/ai/explain-concept', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { concept, grade, subject, language, trimester } = req.body;

    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }

    const lang = resolveLang(language);
    const safeConcept = (concept || '').slice(0, 300);

    const prompt = compose(explainSkill, {
      grade,
      subject,
      concept: safeConcept,
      contextBlockStr: contextBlock({ grade, subject, trimester, topic: safeConcept, lang }),
      dataTags: {
        matiere: subject || 'Sciences',
        notion: safeConcept,
      },
    });

    const data = await aiGenerateJSON('B', prompt, explainSkill.schema, explainSkill.temperature);

    res.json({ success: true, result: data });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/explain-concept:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 4. AI Auto-Tagger & Multimodal Screenshot/Photo OCR
app.post('/api/ai/auto-tag-document', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { documentName, rawText, base64Data, contentType } = req.body;

    if (!aiReady()) {
      const name = (documentName || '').toLowerCase();
      let grade = 'unknown';
      if (name.includes('1') || name.includes('premiere')) grade = '1ère Année';
      else if (name.includes('2') || name.includes('deuxieme')) grade = '2ème Année';
      else if (name.includes('3') || name.includes('troisieme')) grade = '3ème Année';
      else if (name.includes('4') || name.includes('quatrieme')) grade = '4ème Année';
      else if (name.includes('5') || name.includes('cinquieme')) grade = '5ème Année';
      else if (name.includes('6') || name.includes('sixieme')) grade = '6ème Année';

      let subject = 'unknown';
      if (name.includes('arabe') || name.includes('عربي') || name.includes('قراءة')) subject = 'اللغة العربية';
      else if (name.includes('francais') || name.includes('français') || name.includes('lecture')) subject = 'Français';
      else if (name.includes('eveil') || name.includes('scientifique') || name.includes('ايقاظ')) subject = 'Éveil Scientifique';
      else if (name.includes('math') || name.includes('calcul')) subject = 'Mathématiques';

      let docType = 'unknown';
      if (name.includes('synthese') || name.includes('synthèse')) docType = 'Devoir de Synthèse';
      else if (name.includes('controle') || name.includes('contrôle')) docType = 'Devoir de Contrôle';
      else if (name.includes('fiche') || name.includes('revision')) docType = 'Fiche de Révision';
      else if (name.includes('serie') || name.includes('série') || name.includes('exercice')) docType = "Série d'Exercices";

      res.json({
        success: true,
        tags: {
          suggestedTitle: documentName ? documentName.replace(/\.[^/.]+$/, '') : 'Document Pédagogique',
          grade,
          subject,
          trimester: 'unknown',
          docType,
          hasCorrection: false,
          summary: `Document numérisé conforme au programme tunisien.`,
          extractedContent: rawText || '',
        },
      });
      return;
    }

    const safeDocName = (documentName || '').slice(0, 200);
    const safeRawText = (rawText || '').slice(0, 2000);

    const prompt = compose(tagSkill, {
      dataTags: {
        nom_document: safeDocName,
        extrait_texte: safeRawText,
      },
    });

    const contents: GeminiPart[] = [];
    if (base64Data && typeof base64Data === 'string' && base64Data.length < 16 * 1024 * 1024) {
      const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, '');
      const mime = contentType || (base64Data.startsWith('data:image/png') ? 'image/png' : 'image/jpeg');
      contents.push({
        inlineData: {
          mimeType: mime.startsWith('image/') ? mime : 'image/jpeg',
          data: base64Clean,
        },
      });
    }
    contents.push({ text: prompt });

    const data = await aiGenerateJSON('B', contents, tagSkill.schema, tagSkill.temperature);

    res.json({ success: true, tags: data });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/auto-tag-document:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 3b. Photo-Solve (public, zero-friction): parent snaps a photo of an exercise →
// one multimodal call extracts the text and produces a verified step-by-step solution
// 3b. Photo-Solve (public, zero-friction): parent snaps a photo of an exercise →
// one multimodal call extracts the text and produces a verified step-by-step solution
// + a parent guide.
app.post('/api/ai/photo-solve', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { base64Data, contentType, language } = req.body;

    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }
    if (!base64Data || typeof base64Data !== 'string' || base64Data.length > 16 * 1024 * 1024) {
      res.status(400).json({ error: 'Photo requise (base64Data, max 16 Mo).' });
      return;
    }

    const lang = resolveLang(language);
    const prompt = compose(solveSkill, {
      language,
      isImageInput: true,
      contextBlockStr: langRule(lang),
    });

    const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, '');
    const mime = (contentType || 'image/jpeg').startsWith('image/') ? (contentType || 'image/jpeg') : 'image/jpeg';
    const contents: GeminiPart[] = [
      { inlineData: { mimeType: mime, data: base64Clean } },
      { text: prompt },
    ];

    const data = await aiGenerateJSON('C', contents, solveSkill.schema, solveSkill.temperature);

    res.json({ success: true, result: data });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/photo-solve:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

app.post('/api/ai/summarize-docs', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { images, base64Data, contentType, language, grade, subject, title, trimester } = req.body;

    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }

    const rawImages: { base64Data: string; contentType?: string }[] = Array.isArray(images) && images.length > 0
      ? images
      : (base64Data ? [{ base64Data, contentType }] : []);

    if (rawImages.length === 0 || rawImages.length > 8) {
      res.status(400).json({ error: 'Entre 1 et 8 images sont requises.' });
      return;
    }

    const lang = resolveLang(language);
    const context = (grade || subject) ? contextBlock({ grade, subject, trimester, lang }) : langRule(lang);

    const safeTitle = (title || '').slice(0, 200);
    const prompt = compose(summarizeSkill, {
      grade,
      subject,
      trimester,
      title: safeTitle,
      lang,
      contextBlockStr: context,
    });

    const contents: GeminiPart[] = [];
    for (const img of rawImages) {
      if (!img.base64Data || typeof img.base64Data !== 'string') continue;
      const base64Clean = img.base64Data.replace(/^data:[^;]+;base64,/, '');
      const mime = (img.contentType || 'image/jpeg').startsWith('image/') ? (img.contentType || 'image/jpeg') : 'image/jpeg';
      contents.push({ inlineData: { mimeType: mime, data: base64Clean } });
    }

    if (contents.length === 0) {
      res.status(400).json({ error: 'Images invalides.' });
      return;
    }

    contents.push({ text: prompt });

    const data = await aiGenerateJSON(summarizeSkill.chain, contents, summarizeSkill.schema, summarizeSkill.temperature);

    res.json({ success: true, result: data });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/summarize-docs:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 4a-2. Memo Studio — AI structured pedagogical memo sheet generator
app.post('/api/ai/generate-memo', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const {
      mode,
      topic,
      text,
      images,
      file,
      resourceUrl,
      grade,
      subject,
      trimester,
      language,
      instructions,
      blockToRegenerate,
      currentMemo,
    } = req.body;

    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }

    const validModes = ['topic', 'text', 'image', 'file', 'resource'];
    if (!mode || !validModes.includes(mode)) {
      res.status(400).json({ error: 'Mode de génération invalide (topic, text, image, file, resource requis).' });
      return;
    }

    if (topic && typeof topic === 'string' && topic.length > 300) {
      res.status(400).json({ error: 'Le sujet ne doit pas dépasser 300 caractères.' });
      return;
    }

    if (text && typeof text === 'string' && text.length > 8000) {
      res.status(400).json({ error: 'Le texte ne doit pas dépasser 8000 caractères.' });
      return;
    }

    const maxBase64Len = 16 * 1024 * 1024; // 16MB string limit

    if (Array.isArray(images)) {
      if (images.length > 8) {
        res.status(400).json({ error: 'Au maximum 8 images sont autorisées.' });
        return;
      }
      for (const img of images) {
        if (img?.base64Data && typeof img.base64Data === 'string' && img.base64Data.length > maxBase64Len) {
          res.status(400).json({ error: 'Une image dépasse la taille limite autorisée de 16 Mo.' });
          return;
        }
        if (img?.contentType && !img.contentType.startsWith('image/')) {
          res.status(400).json({ error: 'Format d\'image non supporté.' });
          return;
        }
      }
    }

    if (file?.base64Data && typeof file.base64Data === 'string') {
      if (file.base64Data.length > maxBase64Len) {
        res.status(400).json({ error: 'Le fichier dépasse la taille limite autorisée de 16 Mo.' });
        return;
      }
      const ct = file.contentType || '';
      const fn = (file.filename || '').toLowerCase();
      const isAllowedFile =
        ct === 'application/pdf' ||
        fn.endsWith('.pdf') ||
        ct.includes('wordprocessingml') ||
        fn.endsWith('.docx') ||
        ct.startsWith('image/');
      if (!isAllowedFile) {
        res.status(400).json({ error: 'Type de fichier non supporté (PDF, DOCX ou image uniquement).' });
        return;
      }
    }

    let targetResourcePath: string | null = null;
    if (mode === 'resource') {
      if (!resourceUrl || typeof resourceUrl !== 'string') {
        res.status(400).json({ error: 'Chemin de ressource manquant.' });
        return;
      }
      const allowedRoots = [
        resolve(process.cwd(), 'public', 'assets', 'resources'),
        resolve(uploadsFolder),
      ];
      const cleanRel = resourceUrl.replace(/^[/\\]+/, '');
      const subPath = cleanRel.replace(/^uploads[/\\]/, '');
      let candidatePath: string | null = null;
      for (const root of allowedRoots) {
        candidatePath = resolveInside(root, cleanRel) || resolveInside(root, subPath);
        if (candidatePath && existsSync(candidatePath)) break;
      }
      if (!candidatePath || !existsSync(candidatePath)) {
        res.status(400).json({ error: 'Ressource introuvable ou non autorisée.' });
        return;
      }
      targetResourcePath = candidatePath;
    }

    let extractedText: string | undefined = undefined;
    const contents: GeminiPart[] = [];

    const pushPart = (dataStr: string, mime: string) => {
      const clean = dataStr.replace(/^data:[^;]+;base64,/, '');
      contents.push({ inlineData: { mimeType: mime, data: clean } });
    };

    if (mode === 'image' && Array.isArray(images)) {
      for (const img of images) {
        if (!img?.base64Data) continue;
        const mime = img.contentType && img.contentType.startsWith('image/') ? img.contentType : 'image/jpeg';
        pushPart(img.base64Data, mime);
      }
    } else if (mode === 'file' && file?.base64Data) {
      const cleanBase64 = file.base64Data.replace(/^data:[^;]+;base64,/, '');
      const ct = file.contentType || '';
      const fn = (file.filename || '').toLowerCase();

      if (ct === 'application/pdf' || fn.endsWith('.pdf')) {
        pushPart(cleanBase64, 'application/pdf');
      } else if (ct.includes('wordprocessingml') || fn.endsWith('.docx')) {
        const buffer = Buffer.from(cleanBase64, 'base64');
        const docxResult = await mammoth.extractRawText({ buffer });
        extractedText = docxResult.value;
      } else if (ct.startsWith('image/')) {
        pushPart(cleanBase64, ct);
      }
    } else if (mode === 'resource' && targetResourcePath) {
      const lower = targetResourcePath.toLowerCase();
      if (lower.endsWith('.pdf')) {
        const fileBuf = readFileSync(targetResourcePath);
        pushPart(fileBuf.toString('base64'), 'application/pdf');
      } else if (lower.endsWith('.docx')) {
        const buffer = readFileSync(targetResourcePath);
        const docxResult = await mammoth.extractRawText({ buffer });
        extractedText = docxResult.value;
      } else if (lower.endsWith('.png')) {
        const fileBuf = readFileSync(targetResourcePath);
        pushPart(fileBuf.toString('base64'), 'image/png');
      } else if (lower.endsWith('.webp')) {
        const fileBuf = readFileSync(targetResourcePath);
        pushPart(fileBuf.toString('base64'), 'image/webp');
      } else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
        const fileBuf = readFileSync(targetResourcePath);
        pushPart(fileBuf.toString('base64'), 'image/jpeg');
      } else if (lower.endsWith('.json') || lower.endsWith('.txt') || lower.endsWith('.md')) {
        extractedText = readFileSync(targetResourcePath, 'utf-8');
      }
    }

    const lang = resolveLang(language);

    const promptText = compose(memoSkill, {
      grade,
      subject,
      trimester,
      topic,
      lang,
      contextBlockStr: contextBlock({ grade, subject, trimester, topic, lang }),
      mode,
      instructions,
      blockToRegenerate,
      extractedText,
      dataTags: {
        sujet: topic || '',
        instructions: instructions || '',
        texte_fourni: text || '',
        texte_extrait: extractedText || '',
        fiche_actuelle: currentMemo ? JSON.stringify(currentMemo) : '',
      },
    });

    contents.push({ text: promptText });

    const schema = (blockToRegenerate && BLOCK_SCHEMAS[blockToRegenerate])
      ? BLOCK_SCHEMAS[blockToRegenerate]
      : MEMO_SCHEMA;

    const data = await aiGenerateJSON('A', contents, schema, 0.3);

    if (!extractedText && typeof data['extractedText'] === 'string') {
      extractedText = data['extractedText'];
    }

    res.json({ success: true, result: data, extractedText });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/generate-memo:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// Word (.docx) export for visual memo
app.post('/api/memo/export-docx', originGuard, uploadRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { memo, authorName, school } = req.body;
    if (!memo || typeof memo !== 'object' || !memo.title) {
      res.status(400).json({ error: 'Contenu de la fiche mémo requis.' });
      return;
    }
    const buffer = await generateMemoDocx(memo, authorName, school);
    const filename = `memo-${encodeURIComponent((memo.topic || memo.title || 'cours').replace(/\s+/g, '_'))}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
    return;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de l\'export Word';
    console.error('Error in /api/memo/export-docx:', err);
    res.status(500).json({ error: message });
    return;
  }
});

// 4b. Worksheet Style Analyzer (Phase 1a) — vision reads an uploaded worksheet image
// and extracts its "design DNA": topic, palette, layout, so we can clone the style.
app.post('/api/ai/analyze-worksheet', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { base64Data, contentType, documentName } = req.body;

    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }

    if (!base64Data || typeof base64Data !== 'string') {
      res.status(400).json({ error: 'Image requise (base64Data) pour analyser la fiche.' });
      return;
    }

    const safeDocName = (documentName || '').slice(0, 200);
    const prompt = compose(worksheetDnaSkill, {
      documentName: safeDocName,
    });

    const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, '');
    const mime = contentType || (base64Data.startsWith('data:image/png') ? 'image/png' : 'image/jpeg');
    const contents: ({ inlineData: { mimeType: string; data: string } } | { text: string })[] = [
      { inlineData: { mimeType: mime.startsWith('image/') ? mime : 'image/jpeg', data: base64Clean } },
      { text: prompt },
    ];

    const data = await aiGenerateJSON(worksheetDnaSkill.chain, contents, worksheetDnaSkill.schema, worksheetDnaSkill.temperature);

    res.json({ success: true, dna: data });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/analyze-worksheet:', err);
    res.status(500).json({ error: 'Service IA temporairement indisponible pour l\'analyse de fiche.' });
    return;
  }
});

// 4c. Similar Worksheet Generator (Phase 1b) — takes the design DNA and generates
// N new exercises on the same topic, reusing the detected palette/style.
app.post('/api/ai/generate-similar', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { dna, count } = req.body;

    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }

    if (!dna || typeof dna !== 'object') {
      res.status(400).json({ error: 'ADN visuel requis (dna) — appelle /api/ai/analyze-worksheet d\'abord.' });
      return;
    }

    const n = Math.min(Math.max(parseInt(count, 10) || 3, 1), 8);
    const grade = (dna.grade || '1ère Année').toString().slice(0, 40);
    const subject = (dna.subject || 'Mathématiques').toString().slice(0, 40);
    const topic = (dna.topic || '').toString().slice(0, 200);
    const palette = Array.isArray(dna.palette) ? dna.palette.slice(0, 6) : [];
    const dnaLang = dna.language === 'fr' ? 'fr' as const : 'ar' as const;

    const prompt = compose(worksheetSimilarSkill, {
      dna,
      count: n,
      contextBlockStr: contextBlock({ grade, subject, topic, lang: dnaLang }),
    });

    const data = await aiGenerateJSON(worksheetSimilarSkill.chain, prompt, worksheetSimilarSkill.schema, worksheetSimilarSkill.temperature);
    let exercises = Array.isArray(data['exercises'])
      ? (data['exercises'] as { qcmOptions?: string[]; qcmCorrectIndex?: number }[]).map(sanitizeExercise)
      : [];
    exercises = enforceExactExerciseCount(exercises, n);

    res.json({ success: true, exercises, palette, grade, subject, topic });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/generate-similar:', err);
    res.status(500).json({ error: 'Service IA temporairement indisponible pour la génération d\'exercices similaires.' });
    return;
  }
});

// 4d. Persist a shared worksheet (Phase 3b) so a ?sheet=ID link resolves for any visitor.
const SHEET_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
// Lightweight published index: lets the library + blog list shared worksheets
// without reading every doc file.
const docsIndexPath = join(docsFolder, 'index.json');

function readDocsIndex(): Record<string, unknown>[] {
  if (!existsSync(docsIndexPath)) return [];
  try {
    const arr = JSON.parse(readFileSync(docsIndexPath, 'utf8'));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

app.post('/api/docs', originGuard, async (req, res): Promise<void> => {
  try {
    // Optional login: when a valid token is sent the creator is recorded; anonymous publishing still works.
    const ownerUid = (await verifyFirebaseUser(req)) ?? undefined;
    const {
      docType,
      memoDoc,
      memoLayout,
      title,
      grade,
      subject,
      topic,
      palette,
      exercises,
      authorName,
      authorRole,
      customWatermark,
      school,
    } = req.body;

    const role = ['teacher', 'parent', 'ai', 'community'].includes(authorRole) ? authorRole : 'community';
    const isMemo = docType === 'memo' || (memoDoc && typeof memoDoc === 'object');

    if (isMemo) {
      if (!memoDoc || typeof memoDoc !== 'object') {
        res.status(400).json({ error: 'Contenu mémo manquant.' });
        return;
      }
      const docGrade = (memoDoc.grade || grade || '').toString().slice(0, 40);
      const docSubject = (memoDoc.subject || subject || '').toString().slice(0, 40);
      const docTitle = (memoDoc.title || memoDoc.topic || title || 'Fiche Mémo').toString().slice(0, 200);
      const docTopic = (memoDoc.topic || topic || '').toString().slice(0, 200);

      const id = randomUUID();
      const doc = {
        ownerUid,
        id,
        docType: 'memo',
        title: docTitle,
        grade: docGrade,
        subject: docSubject,
        topic: docTopic,
        memoDoc,
        memoLayout: memoLayout || 'tree',
        authorName: (authorName || 'Communauté Madrasati').toString().slice(0, 100),
        authorRole: role,
        school: (school || 'المدرسة الابتدائية التونسية').toString().slice(0, 150),
        customWatermark: (customWatermark || 'Madrasati TN — Fiche Mémo').toString().slice(0, 150),
        createdAt: new Date().toISOString(),
      };
      writeFileSync(join(docsFolder, `${id}.json`), JSON.stringify(doc), 'utf8');

      const index = readDocsIndex();
      index.unshift({
        id,
        docType: 'memo',
        title: doc.title,
        grade: doc.grade,
        subject: doc.subject,
        topic: doc.topic,
        palette: ['#1B4332', '#2D6A4F', '#FBF8F1'],
        thumb: '/assets/memo/apple.svg',
        authorName: doc.authorName,
        authorRole: doc.authorRole,
        school: doc.school,
        memoLayout: doc.memoLayout,
        createdAt: doc.createdAt,
      });
      writeFileSync(docsIndexPath, JSON.stringify(index.slice(0, 500)), 'utf8');

      res.json({ success: true, id, shareUrl: `/memo-studio?memo=${id}` });
      return;
    }

    if (!Array.isArray(exercises) || exercises.length === 0) {
      res.status(400).json({ error: 'Aucun exercice à enregistrer.' });
      return;
    }
    // Library hygiene: nothing unclassified enters the index.
    if (!grade || !String(grade).trim() || !subject || !String(subject).trim()) {
      res.status(400).json({ error: 'Niveau et matière sont obligatoires pour classer la fiche.' });
      return;
    }
    // Idempotency: re-publishing the same sheet (same title/grade/subject)
    // within 15 min returns the existing entry instead of duplicating it.
    const existingIndex = readDocsIndex();
    const dup = existingIndex.find(
      (e) =>
        e['title'] === String(title || 'Fiche Madrasati TN').slice(0, 200) &&
        e['grade'] === String(grade).slice(0, 40) &&
        e['subject'] === String(subject).slice(0, 40) &&
        typeof e['createdAt'] === 'string' &&
        Date.now() - new Date(e['createdAt']).getTime() < 15 * 60 * 1000,
    );
    if (dup) {
      res.json({ success: true, id: dup['id'], shareUrl: `/generate?sheet=${dup['id']}`, deduplicated: true });
      return;
    }
    const id = randomUUID();
    const doc = {
      ownerUid,
      id,
      title: (title || 'Fiche Madrasati TN').toString().slice(0, 200),
      grade: (grade || '').toString().slice(0, 40),
      subject: (subject || '').toString().slice(0, 40),
      topic: (topic || '').toString().slice(0, 200),
      palette: Array.isArray(palette) ? palette.slice(0, 6) : [],
      exercises: exercises.slice(0, 20),
      authorName: (authorName || 'Communauté Madrasati').toString().slice(0, 100),
      authorRole: role,
      customWatermark: (customWatermark || 'Madrasati TN — Fiche Communautaire').toString().slice(0, 150),
      school: (school || 'المدرسة الابتدائية التونسية').toString().slice(0, 150),
      createdAt: new Date().toISOString(),
    };
    writeFileSync(join(docsFolder, `${id}.json`), JSON.stringify(doc), 'utf8');

    // Append a summary to the published index (newest first), with a thumbnail.
    const thumb = (doc.exercises as { imageUrl?: string }[]).find((e) => e.imageUrl)?.imageUrl || '';
    const index = readDocsIndex();
    index.unshift({
      id,
      title: doc.title,
      grade: doc.grade,
      subject: doc.subject,
      topic: doc.topic,
      palette: doc.palette,
      thumb,
      authorName: doc.authorName,
      authorRole: doc.authorRole,
      exerciseCount: doc.exercises.length,
      createdAt: doc.createdAt,
    });
    writeFileSync(docsIndexPath, JSON.stringify(index.slice(0, 500)), 'utf8');

    res.json({ success: true, id, shareUrl: `/generate?sheet=${id}` });
    return;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement de la fiche';
    console.error('Error in POST /api/docs:', err);
    res.status(500).json({ error: message });
    return;
  }
});

// List published worksheets for the library grid + blog feed.
app.get('/api/docs', (_req: Request, res: Response): void => {
  res.json({ success: true, docs: readDocsIndex() });
});

app.get('/api/docs/:id', (req: Request, res: Response): void => {
  const id = String(req.params['id'] || '');
  if (!SHEET_ID_RE.test(id)) {
    res.status(400).json({ error: 'Identifiant invalide.' });
    return;
  }
  const filePath = join(docsFolder, `${id}.json`);
  if (!existsSync(filePath)) {
    res.status(404).json({ error: 'Fiche introuvable.' });
    return;
  }
  try {
    const doc = JSON.parse(readFileSync(filePath, 'utf8'));
    res.json({ success: true, doc });
  } catch (err: unknown) {
    console.error('Error in GET /api/docs/:id:', err);
    res.status(500).json({ error: 'Erreur lors de la lecture de la fiche.' });
  }
});

// 5. Variant Exercise Generator (Idea 11 — Variante IA)
app.post('/api/ai/variant', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { grade, subject, topic, format, originalPromptText, role, trimester } = req.body;

    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }

    const safeOriginal = (originalPromptText || '').slice(0, 1500);
    const safeTopic = (topic || '').slice(0, 200);
    const validFormats = ['free', 'qcm', 'true_false', 'fill_blanks', 'matching'];
    const targetFormat = validFormats.includes(format) ? format : 'free';
    const lang: 'ar' | 'fr' = /[\u0600-\u06FF]/.test(originalPromptText || '') ? 'ar' : 'fr';

    const cacheKey = hashKey({ grade, subject, topic: safeTopic, format: targetFormat, originalPromptText: safeOriginal, role, trimester });
    const cached = exerciseCache.get(cacheKey);
    if (cached) {
      res.json({ success: true, variant: cached['variant'], cached: true });
      return;
    }

    const prompt = compose(exerciseVariantSkill, {
      grade,
      subject,
      trimester,
      topic: safeTopic,
      lang,
      contextBlockStr: contextBlock({ grade, subject, trimester, topic: safeTopic, lang }),
      targetFormat,
      role,
      dataTags: {
        original_exercise: safeOriginal || safeTopic,
      },
    });

    const data = await aiGenerateJSON('A', prompt, exerciseVariantSkill.schema, exerciseVariantSkill.temperature);
    data['aiGenerated'] = true;
    data['aiVerified'] = false;

    const sanitized = sanitizeExercise(data as { qcmOptions?: string[]; qcmCorrectIndex?: number });
    exerciseCache.set(cacheKey, { variant: sanitized });

    res.json({ success: true, variant: sanitized });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/variant:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// Endpoint: Conversational Article Assistant Co-Pilot
app.post('/api/ai/chat-article', originGuard, aiRateLimiter, aiDailyGuard, async (req: Request, res: Response) => {
  try {
    const {
      messages = [],
      currentArticle = {},
      userPrompt = '',
      language,
      chapter = '',
      isFreeTopic = false,
      tags = [],
    } = req.body;
    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }

    const lang: 'ar' | 'fr' = language
      ? resolveLang(language)
      : (/[\u0600-\u06FF]/.test(userPrompt) ? 'ar' : 'fr');
    const safeUserPrompt = capText(userPrompt, CAPS.instruction);
    const recentMessages = capHistory(messages, CAPS.history, CAPS.historyEach);
    const safeArticle = {
      ...currentArticle,
      title: capText(currentArticle?.title, CAPS.short),
      summary: capText(currentArticle?.summary, CAPS.short),
      contentMarkdown: capText(currentArticle?.contentMarkdown, CAPS.article),
    };

    const prompt = compose(articleSkill, {
      messages: recentMessages,
      currentArticle: safeArticle,
      userPrompt: safeUserPrompt,
      language: lang,
      chapter: capText(chapter || currentArticle?.chapter, CAPS.topic),
      isFreeTopic,
      tags: Array.isArray(tags) ? tags.map((t: string) => capText(t, 50)) : [],
      lang,
      contextBlockStr: isFreeTopic
        ? langRule(lang)
        : contextBlock({
            grade: currentArticle?.grade,
            subject: currentArticle?.subject,
            topic: chapter || currentArticle?.chapter || safeUserPrompt.slice(0, 300),
            lang,
          }),
      dataTags: {
        user_prompt: wrapData('user_prompt', safeUserPrompt, CAPS.instruction),
        article_content: wrapData('article_content', safeArticle.contentMarkdown, CAPS.article),
      },
    });

    const data = await aiGenerateJSON(articleSkill.chain, prompt, articleSkill.schema, articleSkill.temperature);

    res.json({ success: true, ...data });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/chat-article:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// Endpoint: AI Illustration Generator (Google Imagen 3 / SVG fallbacks)
// ---- Illustrations: context-aware prompt + image provider chain ----------------------------------------------
type ImageCategory = 'math' | 'science' | 'arabic' | 'french' | 'english' | 'islamic' | 'history_geo' | 'article' | 'generic';
const IMAGE_CATEGORIES: ImageCategory[] = ['math', 'science', 'arabic', 'french', 'english', 'islamic', 'history_geo', 'article', 'generic'];

// One style per teaching context: the scenario decides the look, not a single global prompt.
const IMAGE_STYLES: Record<ImageCategory, string> = {
  math: 'clean flat vector illustration, a few large simple objects laid out so they are easy to count, bold outlines, plain light background, primary colors',
  science: 'clear educational illustration in the style of a school science book, one main subject drawn with accurate simple shapes, soft natural colors',
  arabic: 'warm friendly children storybook illustration, one simple everyday scene, expressive characters, soft pastel colors',
  french: 'warm friendly children storybook illustration, one simple everyday scene, expressive characters, soft pastel colors',
  english: 'flat icon-style illustration of one clear object or action, centered, vocabulary flashcard look, bright colors',
  islamic: 'gentle respectful illustration, modest clothing, calm warm colors, no depiction of prophets or sacred figures',
  history_geo: 'warm flat illustration with a Tunisian landscape or heritage setting, map-like clarity, earthy colors',
  article: 'wide editorial cover illustration, flat vector, one clear central subject, friendly modern style, balanced composition',
  generic: 'friendly flat children book illustration, clean composition, bright colors',
};
// Image models cannot render Arabic or numbers reliably, so text is always excluded.
const IMAGE_COMMON = 'child-friendly, bright and clean, simple background, no text, no letters, no numbers, no captions, no watermark, no logo';

const IMAGE_PROMPT_SCHEMA = {
  type: Type.OBJECT,
  properties: { category: { type: Type.STRING, enum: IMAGE_CATEGORIES }, scene: { type: Type.STRING } },
  required: ['category', 'scene'],
};

const seedFor = (s: string): number => {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) % 1000000;
};

async function buildImagePrompt(input: {
  promptText: string;
  subject?: string;
  grade?: string;
  kind?: string;
  style?: string;
}): Promise<{ prompt: string; scene: string; category: ImageCategory }> {
  const text = input.promptText.replace(/\s+/g, ' ').trim().slice(0, 600);
  let category: ImageCategory = input.kind === 'article-cover' ? 'article' : 'generic';
  let scene = '';
  if (aiReady()) {
    try {
      const out = await aiGenerateJSON(
        'B',
        `Tu prépares l'illustration d'un support scolaire pour enfants tunisiens (niveau : ${input.grade || 'primaire'}, matière : ${input.subject || 'non précisée'}).
Texte source (arabe, français ou anglais) :
"""${text}"""
Réponds en JSON : "category" = la catégorie visuelle la plus proche ; "scene" = UNE phrase en ANGLAIS (35 mots maximum) qui décrit concrètement ce qu'il faut dessiner : personnages, objets, lieu, action.
Règles : dessine le contexte ou la situation, jamais la question ni la réponse ; aucun texte, lettre ou chiffre dans l'image ; aucun personnage sacré ; personnages tunisiens, tenue modeste et neutre ; indique un nombre d'objets uniquement s'il est donné dans le texte.`,
        IMAGE_PROMPT_SCHEMA,
        0.3,
      );
      scene = String(out['scene'] || '').trim().slice(0, 300);
      const c = out['category'] as ImageCategory;
      if (input.kind !== 'article-cover' && IMAGE_CATEGORIES.includes(c)) category = c;
    } catch (err) {
      console.warn('[image] prompt rewrite failed, using raw text:', err instanceof Error ? err.message : err);
    }
  }
  if (!scene) scene = text.slice(0, 200) || 'a friendly school scene for children';
  const customStyle = input.style ? `${input.style}. ` : '';
  return { prompt: `${scene}. ${customStyle}${IMAGE_STYLES[category]}. ${IMAGE_COMMON}`, scene, category };
}

async function generateIllustrationFile(prompt: string, scene: string, seed: number): Promise<string> {
  try {
    const res = await generateImage({ prompt, seed });
    return saveGenerated(`illustration_${randomUUID()}.${res.ext}`, res.data);
  } catch (err) {
    console.warn('[image] generateImage chain exhausted, attempting SVG fallback:', err instanceof Error ? err.message : err);
    try {
      const svgText = await aiGenerateText(
        `Create a clean, modern, pedagogical SVG illustration for Tunisian school children. Scene: "${scene}".
Output ONLY raw valid SVG code starting with <svg and ending with </svg>. Use viewBox="0 0 800 450", smooth gradients, friendly rounded shapes. No text, no markdown formatting.`,
      );
      const cleanSvg = sanitizeSvg(svgText);
      if (!cleanSvg) throw new Error('Generated SVG failed sanitization check');
      return saveGenerated(`illustration_${randomUUID()}.svg`, cleanSvg);
    } catch (svgErr) {
      console.warn('[image] SVG fallback also failed:', svgErr instanceof Error ? svgErr.message : svgErr);
      throw new Error("Aucun service d'illustration disponible pour le moment.");
    }
  }
}

app.post('/api/ai/generate-illustration', originGuard, aiRateLimiter, aiDailyGuard, async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    const promptText = String(body.promptText ?? '').trim();
    if (!promptText) {
      res.status(400).json({ error: 'promptText requis.' });
      return;
    }
    const { prompt, scene, category } = await buildImagePrompt({
      promptText,
      subject: String(body.subject ?? '').slice(0, 60),
      grade: String(body.grade ?? '').slice(0, 30),
      kind: String(body.kind ?? '').slice(0, 30),
      style: body.style ? String(body.style).slice(0, 150) : undefined,
    });
    const imageUrl = await generateIllustrationFile(prompt, scene, seedFor(promptText));
    res.json({ success: true, imageUrl, category });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/generate-illustration:', err);
    const pub = toPublicError(err, "Erreur lors de la création de l'illustration");
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

const angularApp = new AngularNodeAppEngine();


/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Phase 4 — per-document Open Graph tags for social crawlers (Facebook, etc.).
 * When a crawler fetches /generate?sheet=ID we inject the worksheet's title + preview
 * image so the shared link renders a polished card. Humans fall through to normal SSR.
 */
const CRAWLER_UA_RE = /facebookexternalhit|facebot|twitterbot|whatsapp|linkedinbot|slackbot|telegrambot|discordbot|pinterest|embedly|redditbot|google-inspectiontool|bingbot/i;

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// OG tags for shared BD pages (/discovery?bd=ITEM_ID) — same crawler-only pattern as /generate.
const BD_ID_RE = /^[A-Za-z0-9_-]{4,80}$/;
interface BdManifestItem {
  id: string;
  title?: string;
  grade?: string;
  subject?: string;
  topic?: string;
  relPath?: string;
  trimester?: number;
  ref?: string;
  pedagogy?: { keywords?: string[]; structures?: string[]; verifiedBy?: string | null };
}
let bdItemsCache: BdManifestItem[] | null = null;

function loadBdItems(): BdManifestItem[] {
  if (bdItemsCache) return bdItemsCache;
  try {
    const idx = JSON.parse(readFileSync(join(browserDistFolder, 'assets/resources/index.json'), 'utf8'));
    const paths: string[] = Array.isArray(idx.manifests) ? idx.manifests : [];
    bdItemsCache = paths.flatMap((p) => {
      try {
        const m = JSON.parse(readFileSync(join(browserDistFolder, p), 'utf8'));
        return Array.isArray(m.items) ? (m.items as BdManifestItem[]) : [];
      } catch {
        return [];
      }
    });
  } catch {
    bdItemsCache = [];
  }
  return bdItemsCache;
}

// Annotated BD pages feed the AI grounding layer: an exercise about "الحديقة"
// can cite the official silent-comic page that teaches those exact words.
const BD_GRADE_LABELS: Record<string, string> = {
  '1ere-annee': '1ère Année', '2eme-annee': '2ème Année', '3eme-annee': '3ème Année',
  '4eme-annee': '4ème Année', '5eme-annee': '5ème Année', '6eme-annee': '6ème Année',
};
const BD_SUBJECT_LABELS: Record<string, string> = {
  'arabe': 'اللغة العربية', 'francais': 'Français', 'maths': 'Mathématiques',
  'eveil-scientifique': 'Éveil Scientifique', 'anglais': 'Anglais',
  'histoire-geo': 'Histoire & Géographie',
};
try {
  registerSources(
    loadBdItems()
      .filter((i) => (i.pedagogy?.keywords?.length ?? 0) > 0)
      .map((i) => ({
        id: `bdpage-${i.id}`,
        origin: 'bd-page',
        grade: BD_GRADE_LABELS[i.grade || ''] || i.grade || '',
        subject: BD_SUBJECT_LABELS[i.subject || ''] || i.subject || '',
        trimester: i.trimester ? `Trimestre ${i.trimester}` : undefined,
        lang: 'ar' as const,
        title: i.title || i.id,
        text: [...(i.pedagogy?.keywords || []), ...(i.pedagogy?.structures || [])].join('، '),
        ref: i.ref,
      })),
  );
} catch (err) {
  console.warn('BD grounding registration skipped:', err);
}

app.get('/discovery', (req: Request, res: Response, next): void => {
  const ua = req.get('user-agent') || '';
  const itemId = String((req.query['bd'] as string) || '');
  if (!CRAWLER_UA_RE.test(ua) || !BD_ID_RE.test(itemId)) {
    next();
    return;
  }

  const item = loadBdItems().find((i) => i.id === itemId);
  if (!item) {
    next();
    return;
  }

  try {
    const indexPath = join(browserDistFolder, 'index.html');
    let html = readFileSync(indexPath, 'utf8');

    const proto = (req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0];
    const host = req.get('x-forwarded-host') || req.get('host') || '';
    const origin = `${proto}://${host}`;

    const title = escapeHtmlAttr(`${item.title || 'Bande dessinée'} — Madrasati TN`);
    const keywords = item.pedagogy?.keywords?.length ? ` المفردات: ${item.pedagogy.keywords.join('، ')}.` : '';
    const descParts = [item.grade, item.subject, item.topic].filter(Boolean).join(' · ');
    const description = escapeHtmlAttr(
      descParts
        ? `${descParts}. Planche officielle du manuel CNP — Madrasati TN.${keywords}`
        : `Bande dessinée officielle pour l'école primaire tunisienne — Madrasati TN.${keywords}`,
    );
    const imageUrl = escapeHtmlAttr(item.relPath ? `${origin}/${item.relPath}` : `${origin}/logo.jpg`);
    const pageUrl = escapeHtmlAttr(`${origin}/discovery?bd=${itemId}`);

    html = html.replace(/\s*<meta\s+(?:property="og:(?:title|description|image|url|type)"|name="twitter:(?:card|title|description|image)")[^>]*>/gi, '');

    const ogBlock = `
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${pageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />`;

    html = html.replace('</head>', `${ogBlock}\n  </head>`);

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Error injecting OG tags for BD page:', err);
    next();
  }
});

// OG tags for shared document/course links (/?doc=ID) — crawler-only, generic fallback when unknown.
app.get('/', (req: Request, res: Response, next): void => {
  const ua = req.get('user-agent') || '';
  const docId = String((req.query['doc'] as string) || '');
  if (!CRAWLER_UA_RE.test(ua) || !docId || !BD_ID_RE.test(docId)) {
    next();
    return;
  }

  try {
    const allDocs: {
      id: string;
      title: string;
      grade?: string;
      subject?: string;
      trimester?: string;
      docType?: string;
      promptText?: string;
      summary?: string;
      photoUrl?: string;
      imageUrls?: string[];
      hasCorrection?: boolean;
    }[] = [
      ...FIRST_GRADE_EXERCISES,
      ...FIRST_GRADE_COURSES,
      ...LIBRARY_EXERCISES,
      ...CNP_PRIMARY_COURSES,
      ...SEED_BANK_EXERCISES,
      ...SEED_COURSES,
    ];

    const doc = allDocs.find((d) => d.id === docId);
    const indexPath = join(browserDistFolder, 'index.html');
    let html = readFileSync(indexPath, 'utf8');

    const proto = (req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0];
    const host = req.get('x-forwarded-host') || req.get('host') || '';
    const origin = `${proto}://${host}`;

    const title = escapeHtmlAttr(`${doc?.title || 'Document officiel'} — Madrasati TN`);
    const descParts = doc ? [doc.grade, doc.subject, doc.trimester, doc.docType].filter(Boolean).join(' · ') : '';
    const textSnippet = doc?.promptText ? ` ${doc.promptText.slice(0, 120)}…` : doc?.summary ? ` ${doc.summary.slice(0, 120)}…` : '';
    const description = escapeHtmlAttr(
      descParts
        ? `${descParts}.${textSnippet} ${doc?.hasCorrection ? 'Corrigé inclus — ' : ''}Madrasati TN.`
        : 'Document pédagogique officiel avec corrigé pour l\'école primaire tunisienne — Madrasati TN.',
    );
    const docImg = doc?.photoUrl || (doc?.imageUrls && doc.imageUrls[0]);
    const imageUrl = escapeHtmlAttr(docImg ? `${origin}${docImg.startsWith('/') ? '' : '/'}${docImg}` : `${origin}/logo.jpg`);
    const pageUrl = escapeHtmlAttr(`${origin}/?doc=${docId}`);

    html = html.replace(/\s*<meta\s+(?:property="og:(?:title|description|image|url|type)"|name="twitter:(?:card|title|description|image)")[^>]*>/gi, '');

    const ogBlock = `
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${pageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />`;

    html = html.replace('</head>', `${ogBlock}\n  </head>`);

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Error injecting OG tags for shared document:', err);
    next();
  }
});

app.get('/generate', (req: Request, res: Response, next): void => {
  const ua = req.get('user-agent') || '';
  const sheetId = String((req.query['sheet'] as string) || '');
  if (!CRAWLER_UA_RE.test(ua) || !SHEET_ID_RE.test(sheetId)) {
    next();
    return;
  }

  const filePath = join(docsFolder, `${sheetId}.json`);
  if (!existsSync(filePath)) {
    next();
    return;
  }

  try {
    const doc = JSON.parse(readFileSync(filePath, 'utf8'));
    const indexPath = join(browserDistFolder, 'index.html');
    let html = readFileSync(indexPath, 'utf8');

    const proto = (req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0];
    const host = req.get('x-forwarded-host') || req.get('host') || '';
    const origin = `${proto}://${host}`;

    const title = escapeHtmlAttr(`${doc.title || 'Fiche d\'exercices'} — Madrasati TN`);
    const descParts = [doc.grade, doc.subject, doc.topic].filter(Boolean).join(' · ');
    const description = escapeHtmlAttr(
      descParts
        ? `${descParts}. Fiche d'exercices gratuite — Madrasati TN.`
        : 'Fiche d\'exercices gratuite pour l\'école primaire tunisienne — Madrasati TN.',
    );
    const firstImg = (doc.exercises || []).find((e: { imageUrl?: string }) => e.imageUrl)?.imageUrl;
    const imageUrl = escapeHtmlAttr(firstImg ? `${origin}${firstImg}` : `${origin}/logo.jpg`);
    const pageUrl = escapeHtmlAttr(`${origin}/generate?sheet=${sheetId}`);

    // Drop the generic OG/twitter tags, then inject the per-document ones.
    html = html.replace(/\s*<meta\s+(?:property="og:(?:title|description|image|url|type)"|name="twitter:(?:card|title|description|image)")[^>]*>/gi, '');

    const ogBlock = `
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${pageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />`;

    html = html.replace('</head>', `${ogBlock}\n  </head>`);

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Error injecting OG tags for sheet:', err);
    next();
  }
});

app.get('/memo-studio', (req: Request, res: Response, next): void => {
  const ua = req.get('user-agent') || '';
  const memoId = String((req.query['memo'] as string) || '');
  if (!CRAWLER_UA_RE.test(ua) || !SHEET_ID_RE.test(memoId)) {
    next();
    return;
  }

  const filePath = join(docsFolder, `${memoId}.json`);
  if (!existsSync(filePath)) {
    next();
    return;
  }

  try {
    const doc = JSON.parse(readFileSync(filePath, 'utf8'));
    const indexPath = join(browserDistFolder, 'index.html');
    let html = readFileSync(indexPath, 'utf8');

    const proto = (req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0];
    const host = req.get('x-forwarded-host') || req.get('host') || '';
    const origin = `${proto}://${host}`;

    const title = escapeHtmlAttr(`${doc.title || doc.memoDoc?.title || 'Fiche Mémo'} — Madrasati TN`);
    const descParts = [doc.grade, doc.subject, doc.memoDoc?.subtitle || doc.memoDoc?.topic].filter(Boolean).join(' · ');
    const description = escapeHtmlAttr(
      descParts
        ? `${descParts}. Fiche mémo visuelle interactive pour l'école primaire tunisienne — Madrasati TN.`
        : 'Fiche mémo visuelle interactive pour l\'école primaire tunisienne — Madrasati TN.',
    );
    const imageUrl = escapeHtmlAttr(`${origin}/assets/memo/apple.svg`);
    const pageUrl = escapeHtmlAttr(`${origin}/memo-studio?memo=${memoId}`);

    html = html.replace(/\s*<meta\s+(?:property="og:(?:title|description|image|url|type)"|name="twitter:(?:card|title|description|image)")[^>]*>/gi, '');

    const ogBlock = `
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${pageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />`;

    html = html.replace('</head>', `${ogBlock}\n  </head>`);

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Error injecting OG tags for memo:', err);
    next();
  }
});

app.get('/robots.txt', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  const robotsTxt = `User-agent: *
Allow: /
Allow: /discovery
Allow: /generate
Allow: /summarize
Allow: /blog
Disallow: /teacher
Disallow: /parent
Disallow: /student

Sitemap: https://madrastihub.com/sitemap.xml
`;
  res.send(robotsTxt);
});

app.get('/sitemap.xml', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  const baseUrl = 'https://madrastihub.com';
  const lastMod = new Date().toISOString().split('T')[0];

  const staticUrls = [
    { url: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
    { url: `${baseUrl}/discovery`, priority: '0.9', changefreq: 'daily' },
    { url: `${baseUrl}/generate`, priority: '0.8', changefreq: 'weekly' },
    { url: `${baseUrl}/summarize`, priority: '0.8', changefreq: 'weekly' },
    { url: `${baseUrl}/teachers`, priority: '0.7', changefreq: 'weekly' },
  ];

  // Dynamic CNP Books
  const cnpUrls = (CNP_PRIMARY_COURSES || []).map((c: { id: string }) => ({
    url: `${baseUrl}/discovery?book=${encodeURIComponent(c.id)}`,
    priority: '0.8',
    changefreq: 'monthly',
  }));

  // Dynamic Exercises
  const allExercises = [...(LIBRARY_EXERCISES || []), ...(FIRST_GRADE_EXERCISES || [])];
  
  // Read disk-persisted community documents
  if (existsSync(docsFolder)) {
    try {
      const files = readdirSync(docsFolder);
      for (const f of files) {
        if (f.endsWith('.json')) {
          const raw = readFileSync(join(docsFolder, f), 'utf-8');
          const doc = JSON.parse(raw);
          if (doc && doc.id) {
            allExercises.push(doc);
          }
        }
      }
    } catch (e) {
      console.error('Error reading docs for sitemap:', e);
    }
  }

  const exerciseUrls = allExercises.map((ex: { id: string }) => ({
    url: `${baseUrl}/discovery?ex=${encodeURIComponent(ex.id)}`,
    priority: '0.7',
    changefreq: 'weekly',
  }));

  const allUrls = [...staticUrls, ...cnpUrls, ...exerciseUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (item) => `  <url>
    <loc>${item.url}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  res.send(xml);
});

app.get('/favicon.ico', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');
  res.sendFile(join(browserDistFolder, 'favicon.ico'));
});

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
