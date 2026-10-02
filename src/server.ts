import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { Request, Response, NextFunction } from 'express';
import { join } from 'node:path';
import { GoogleGenAI, Type } from '@google/genai';
import { retrieveContext } from './server/knowledge-source';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const browserDistFolder = join(import.meta.dirname, '../browser');
const uploadsFolder = join(process.cwd(), 'uploads');
// Persisted shared worksheets (zero-cost JSON on disk, same pattern as /uploads).
const docsFolder = join(process.cwd(), 'docs');

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
const aiRateLimiter = createRateLimiter(30, 60 * 1000, 'Requêtes IA limitées à 30 par minute');

// Global daily guard for the shared Gemini free-tier quota (1500 RPD).
// Per-IP limits don't stop many IPs collectively draining it; this hard-caps
// server-wide AI calls with a safety margin under the free-tier ceiling.
const AI_DAILY_CAP = 1200;
let aiDailyUsage = { day: '', count: 0 };
const aiDailyGuard = (_req: Request, res: Response, next: NextFunction): void => {
  const today = new Date().toISOString().slice(0, 10);
  if (aiDailyUsage.day !== today) aiDailyUsage = { day: today, count: 0 };
  if (aiDailyUsage.count >= AI_DAILY_CAP) {
    res.status(503).json({ error: "Quota IA quotidien atteint. Réessayez demain." });
    return;
  }
  aiDailyUsage.count++;
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

app.post('/api/upload', originGuard, uploadRateLimiter, (req, res): void => {
  try {
    const rawData = req.body.base64Data || req.body.fileData;
    const rawName = req.body.filename || req.body.fileName;
    const rawType = req.body.contentType || req.body.fileType || req.body.mimeType;

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
    const filePath = join(uploadsFolder, cleanName);

    writeFileSync(filePath, buffer);

    res.json({
      success: true,
      url: `/uploads/${cleanName}`,
      filename: cleanName,
      size: buffer.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur d\'upload';
    console.error('Upload error:', err);
    res.status(500).json({ error: message });
  }
});

// Initialize Gemini Client
const apiKey = process.env['GEMINI_API_KEY'] || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Shared AI helpers — structured JSON output, retry, dual-language (AR default),
 * and official CNP curriculum grounding via the KnowledgeSource layer.
 */
type GeminiPart = { inlineData: { mimeType: string; data: string } } | { text: string };

/** JSON-mode generation with responseSchema + 1 retry on transient/parse failure. */
async function aiGenerateJSON(
  client: GoogleGenAI,
  contents: string | GeminiPart[],
  schema?: object,
  temperature = 0.4,
): Promise<Record<string, unknown>> {
  const config: Record<string, unknown> = { responseMimeType: 'application/json', temperature };
  if (schema) config['responseSchema'] = schema;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.models.generateContent({ model: 'gemini-2.5-flash', contents, config });
      const text = (response.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

/** Arabic is the primary language in Tunisia — default 'ar' unless caller asks 'fr'. */
const resolveLang = (raw: unknown): 'ar' | 'fr' => (raw === 'fr' ? 'fr' : 'ar');

/** Absolute output-language rule injected into every generative prompt. */
const langRule = (lang: 'ar' | 'fr'): string =>
  lang === 'ar'
    ? `RÈGLE LINGUISTIQUE ABSOLUE : l'arabe est la langue principale. Rédige TOUS les champs texte (titres, énoncés, consignes, corrections, indices, conseils) en ARABE LITTÉRAIRE scolaire tunisien (العربية الفصحى المدرسية). EXCEPTION : si la matière est le Français, rédige en français ; si c'est l'Anglais, en anglais.`
    : `RÈGLE LINGUISTIQUE ABSOLUE : rédige TOUS les champs texte en FRANÇAIS clair et soigné, conforme au programme tunisien. EXCEPTION : matière Anglais → anglais ; matière اللغة العربية → arabe.`;

/** Official curriculum grounding block (empty string when no match). */
const buildGrounding = (q: { grade?: string; subject?: string; trimester?: string; topic?: string; lang: 'ar' | 'fr' }): string => {
  const { block } = retrieveContext(q);
  return block ? `\n${block}\n` : '';
};

// --- Response schemas (Gemini structured output) ---
const STR = { type: Type.STRING } as const;
const NUM = { type: Type.NUMBER } as const;
const INT = { type: Type.INTEGER } as const;
const BOOL = { type: Type.BOOLEAN } as const;
const STR_ARR = { type: Type.ARRAY, items: STR } as const;

const EXERCISE_PROPS = {
  title: STR,
  promptText: STR,
  solutionText: STR,
  parentGuide: STR,
  teacherNotes: STR,
  hints: STR_ARR,
  points: NUM,
  format: { type: Type.STRING, enum: ['free', 'qcm', 'true_false', 'fill_blanks', 'matching'] },
  qcmOptions: STR_ARR,
  qcmCorrectIndex: INT,
  tfStatements: {
    type: Type.ARRAY,
    items: { type: Type.OBJECT, properties: { text: STR, answer: BOOL }, required: ['text', 'answer'] },
  },
  gapText: STR,
  matchingPairs: {
    type: Type.ARRAY,
    items: { type: Type.OBJECT, properties: { left: STR, right: STR }, required: ['left', 'right'] },
  },
};

const EXERCISE_SCHEMA = {
  type: Type.OBJECT,
  properties: EXERCISE_PROPS,
  required: ['title', 'promptText', 'solutionText', 'format'],
};

const EXAM_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    examTitle: STR,
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { heading: STR, exerciseTitle: STR, points: NUM, promptText: STR, solutionText: STR, hints: STR_ARR },
        required: ['heading', 'exerciseTitle', 'points', 'promptText', 'solutionText'],
      },
    },
  },
  required: ['examTitle', 'sections'],
};

const SOLVE_SCHEMA = {
  type: Type.OBJECT,
  properties: { solutionText: STR, teacherNotes: STR, recommendedPoints: NUM },
  required: ['solutionText', 'teacherNotes', 'recommendedPoints'],
};

const ANNOUNCE_SCHEMA = {
  type: Type.OBJECT,
  properties: { title: STR, content: STR },
  required: ['title', 'content'],
};

const EXPLAIN_SCHEMA = {
  type: Type.OBJECT,
  properties: { explanation: STR, analogy: STR, checkQuestion: STR },
  required: ['explanation', 'analogy', 'checkQuestion'],
};

const TAG_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    suggestedTitle: STR,
    grade: { type: Type.STRING, enum: ['1ère Année', '2ème Année', '3ème Année', '4ème Année', '5ème Année', '6ème Année'] },
    subject: { type: Type.STRING, enum: ['Mathématiques', 'Français', 'اللغة العربية', 'Éveil Scientifique', 'Histoire & Géographie', 'Anglais'] },
    trimester: { type: Type.STRING, enum: ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'] },
    docType: { type: Type.STRING, enum: ['Devoir de Contrôle', 'Devoir de Synthèse', 'Fiche de Révision', "Série d'Exercices"] },
    hasCorrection: BOOL,
    summary: STR,
    extractedContent: STR,
  },
  required: ['suggestedTitle', 'grade', 'subject', 'trimester', 'docType', 'hasCorrection', 'summary', 'extractedContent'],
};

const DNA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: STR,
    grade: { type: Type.STRING, enum: ['1ère Année', '2ème Année', '3ème Année', '4ème Année', '5ème Année', '6ème Année'] },
    subject: { type: Type.STRING, enum: ['Mathématiques', 'Français', 'اللغة العربية', 'Éveil Scientifique', 'Histoire & Géographie', 'Anglais'] },
    topic: STR,
    language: { type: Type.STRING, enum: ['fr', 'ar', 'en', 'mixed'] },
    palette: STR_ARR,
    layoutStyle: STR,
    illustrationStyle: STR,
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: STR,
          kind: { type: Type.STRING, enum: ['words', 'sentences', 'qcm', 'matching', 'phonics', 'commands', 'free'] },
          itemsCount: INT,
        },
        required: ['heading', 'kind'],
      },
    },
  },
  required: ['title', 'grade', 'subject', 'topic', 'language', 'palette', 'layoutStyle', 'illustrationStyle', 'sections'],
};

const SIMILAR_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    exercises: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { ...EXERCISE_PROPS, imagePrompt: STR },
        required: ['title', 'promptText', 'solutionText', 'format'],
      },
    },
  },
  required: ['exercises'],
};

const CHAT_ARTICLE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    replyText: STR,
    updatedArticle: {
      type: Type.OBJECT,
      properties: { title: STR, summary: STR, subject: STR, grade: STR, contentMarkdown: STR },
      required: ['title', 'summary', 'subject', 'grade', 'contentMarkdown'],
    },
    suggestedChips: STR_ARR,
  },
  required: ['replyText', 'updatedArticle', 'suggestedChips'],
};

/** Clamp qcmCorrectIndex into range so a model drift can never break the UI. */
function sanitizeExercise<T extends { qcmOptions?: string[]; qcmCorrectIndex?: number }>(ex: T): T {
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
    const { grade, subject, topic, difficulty, format, role, childName, language, trimester } = req.body;

    if (!ai) {
      res.status(500).json({
        error: 'Clé API Gemini non configurée dans le serveur backend.',
      });
      return;
    }

    const lang = resolveLang(language);
    const safeTopic = (topic || '').slice(0, 300);
    const validFormats = ['free', 'qcm', 'true_false', 'fill_blanks', 'matching'];
    const requestedFormat = validFormats.includes(format) ? format : undefined;
    const isParent = role === 'parent';

    const grounding = buildGrounding({ grade, subject, trimester, topic: safeTopic, lang });
    const systemContext = isParent
      ? `Tu es un guide pédagogique bienveillant aidant un parent tunisien à faire réviser son enfant (${childName || "l'élève"}). Crée un exercice stimulant, motivant et clair avec des situations concrètes du quotidien tunisien.`
      : `Tu es un inspecteur pédagogique principal du Ministère de l'Éducation en Tunisie. Conçois un exercice rigoureux conforme au programme officiel tunisien pour évaluation scolaire.`;

    const correctionGuidance = isParent
      ? `"solutionText": "Solution claire avec démarche de calcul ou règle grammaticale simple",
  "parentGuide": "Conseil pratique étape par étape pour aider l'enfant à comprendre sans le bloquer"`
      : `"solutionText": "Correction type officielle et barème de notation détaillé étape par étape",
  "teacherNotes": "Compétences officielles visées et critères d'évaluation ministériels"`;

    const prompt = `${systemContext}
${grounding}${langRule(lang)}
Génère un exercice pédagogique de haute qualité adapté pour :
- Niveau: ${grade || '4ème Année'}
- Matière: ${subject || 'Mathématiques'}
- Chapitre/Sujet: ${safeTopic || 'Résolution de problèmes'}
- Difficulté: ${difficulty || 'Moyen'}
${requestedFormat ? `- Format requis: ${requestedFormat}` : ''}

Réponds STRICTEMENT au format JSON valide suivant :
{
  "title": "Titre court de l'exercice",
  "promptText": "Texte complet de la consigne ou du problème",
  ${correctionGuidance},
  "hints": ["Indice 1 pour l'élève", "Indice 2"],
  "points": 5,
  "format": "${requestedFormat || 'free'}",
  "qcmOptions": ["Option 1", "Option 2", "Option 3"],
  "qcmCorrectIndex": 0,
  "tfStatements": [{"text": "Affirmation 1", "answer": true}, {"text": "Affirmation 2", "answer": false}],
  "gapText": "Texte explicatif avec mots à deviner entourés de [[mot1]] et [[mot2]]",
  "matchingPairs": [{"left": "Élément A", "right": "Correspondance A"}, {"left": "Élément B", "right": "Correspondance B"}]
}

Instructions par format :
- Si format est 'free' : promptText contient l'énoncé. Les champs spécifiques au format peuvent être omis.
- Si format est 'qcm' : qcmOptions contient 3 à 4 choix, qcmCorrectIndex (0-indexed) indique la bonne réponse, promptText contient l'énoncé.
- Si format est 'true_false' : tfStatements contient 3 à 5 affirmations avec 'text' et 'answer' (true/false).
- Si format est 'fill_blanks' : gapText contient le texte avec les mots à cacher entourés de [[mot]].
- Si format est 'matching' : matchingPairs contient 3 à 5 couples {left, right} appariés correctement.`;

    const data = await aiGenerateJSON(ai, prompt, EXERCISE_SCHEMA, 0.4);

    res.json({ success: true, exercise: sanitizeExercise(data as { qcmOptions?: string[]; qcmCorrectIndex?: number }) });
    return;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la génération';
    console.error('Error in /api/ai/generate-exercise:', err);
    res.status(500).json({ error: message });
    return;
  }
});

// 1a. Transform / Refine Exercise with Contextual Prompts (A10)
app.post('/api/ai/transform-exercise', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { originalBlock, transformType, customInstruction, grade, subject, language, trimester, topic } = req.body;

    if (!ai) {
      res.status(500).json({ error: 'Clé API non configurée' });
      return;
    }

    const lang = resolveLang(language);
    const grounding = buildGrounding({ grade, subject, trimester, topic: (topic || '').slice(0, 300), lang });

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

    const prompt = `Tu es un expert pédagogique pour l'école primaire tunisienne (${grade || 'Primaire'}, ${subject || 'Général'}).
${grounding}${langRule(lang)}
NOTE : conserve la langue de l'exercice original si elle diffère (ex: exercice en français pour la matière Français).
Exercice original :
${JSON.stringify(originalBlock)}

Consigne de transformation STRICTE :
${instructionText}

Réponds STRICTEMENT au format JSON valide avec la même structure que l'original :
{
  "title": "Titre transformé",
  "promptText": "Nouvelle consigne transformée",
  "solutionText": "Nouveau corrigé adapté",
  "format": "free" | "qcm" | "true_false" | "fill_blanks" | "matching",
  "qcmOptions": [],
  "qcmCorrectIndex": 0,
  "tfStatements": [],
  "gapText": "",
  "matchingPairs": []
}`;

    const data = await aiGenerateJSON(ai, prompt, EXERCISE_SCHEMA, 0.4);

    res.json({ success: true, transformed: sanitizeExercise(data as { qcmOptions?: string[]; qcmCorrectIndex?: number }) });
    return;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la transformation';
    console.error('Error in /api/ai/transform-exercise:', err);
    res.status(500).json({ error: message });
    return;
  }
});

// 1b. Generate Full 20-Point Tunisian Exam with Multiple Blocks
app.post('/api/ai/generate-full-exam', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { grade, subject, trimester, topics, language } = req.body;

    if (!ai) {
      res.status(500).json({ error: 'Clé API non disponible' });
      return;
    }

    const lang = resolveLang(language);
    const safeTopics = (topics || '').slice(0, 300);
    const grounding = buildGrounding({ grade, subject, trimester, topic: safeTopics, lang });
    const prompt = `Tu es un inspecteur pédagogique principal du Ministère de l'Éducation en Tunisie.
${grounding}${langRule(lang)}
Génère une Évaluation Somnative / Devoir de Synthèse officiel complet pour l'enseignement primaire tunisien.
- Niveau : ${grade || '4ème Année'}
- Matière : ${subject || 'Mathématiques'}
- Période : ${trimester || 'Trimestre 1'}
- Thèmes / Chapitres : ${safeTopics || 'Programme officiel complet du trimestre'}

Le barème DOIT totaliser exactement 20 points, réparti en :
1. Exercice 1 (Connaissances directes, calcul ou grammaire) : 6 points
2. Exercice 2 (Application, géométrie ou compréhension) : 6 points
3. Exercice 3 / Situation Problème / Production écrite : 8 points

Réponds STRICTEMENT au format JSON valide suivant :
{
  "examTitle": "Titre officiel de l'évaluation (ex: Évaluation des Acquis du 1er Trimestre)",
  "sections": [
    {
      "heading": "I. Activités Numériques & Calcul",
      "exerciseTitle": "Exercice N°1 : Connaissances et Calcul",
      "points": 6,
      "promptText": "Énoncé complet et clair de l'exercice 1...",
      "solutionText": "Correction détaillée étape par étape...",
      "hints": ["Indice méthodologique"]
    },
    {
      "heading": "II. Géométrie et Mesure",
      "exerciseTitle": "Exercice N°2 : Application",
      "points": 6,
      "promptText": "Énoncé complet de l'exercice 2...",
      "solutionText": "Correction détaillée...",
      "hints": ["Indice"]
    },
    {
      "heading": "III. Résolution de Problème / Situation d'Intégration",
      "exerciseTitle": "Exercice N°3 : Situation Problème",
      "points": 8,
      "promptText": "Situation réaliste tunisienne à plusieurs étapes...",
      "solutionText": "Solution détaillée étape par étape avec calculs intermédiaires...",
      "hints": ["Indice d'aide"]
    }
  ]
}`;

    const data = await aiGenerateJSON(ai, prompt, EXAM_SCHEMA, 0.4);

    // Enforce the official 6+6+8 = 20 points barème server-side (model can drift).
    const sections = data['sections'] as { points?: number }[] | undefined;
    if (Array.isArray(sections) && sections.length === 3) {
      const total = sections.reduce((sum, s) => sum + (Number(s.points) || 0), 0);
      if (total !== 20) {
        const official = [6, 6, 8];
        sections.forEach((s, i) => (s.points = official[i]));
      }
    }

    res.json({ success: true, exam: data });
    return;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la génération de l\'examen';
    console.error('Error in /api/ai/generate-full-exam:', err);
    res.status(500).json({ error: message });
    return;
  }
});

// 1c. Solve / Correct Exercise with Step-by-Step AI Explanation
app.post('/api/ai/solve-exercise', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { promptText, grade, subject, language, trimester, topic } = req.body;

    if (!ai) {
      res.status(500).json({ error: 'Clé API non disponible' });
      return;
    }

    const lang = resolveLang(language);
    const safePrompt = (promptText || '').slice(0, 1500);
    const grounding = buildGrounding({ grade, subject, trimester, topic: (topic || safePrompt).slice(0, 300), lang });
    const prompt = `Tu es un enseignant tunisien chevronné. Rédige le corrigé officiel, rigoureux et didactique de l'exercice suivant pour le niveau ${grade || 'Primaire'} (${subject || 'Général'}) :
${grounding}${langRule(lang)}
"${safePrompt}"

AUTO-VÉRIFICATION OBLIGATOIRE : avant de répondre, refais chaque calcul / vérifie chaque réponse une deuxième fois. Si un résultat intermédiaire ne colle pas, corrige-le. Le corrigé final doit être exact à 100%.

Réponds STRICTEMENT au format JSON valide suivant :
{
  "solutionText": "Corrigé étape par étape, clair, pédagogique avec le résultat final mis en évidence",
  "teacherNotes": "Conseils pédagogiques pour l'enseignant et critères d'évaluation",
  "recommendedPoints": 5
}`;

    const data = await aiGenerateJSON(ai, prompt, SOLVE_SCHEMA, 0.2);

    res.json({ success: true, result: data });
    return;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la résolution';
    console.error('Error in /api/ai/solve-exercise:', err);
    res.status(500).json({ error: message });
    return;
  }
});

// 2. Draft Announcement for Teacher
app.post('/api/ai/draft-announcement', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { purpose, details, targetAudience, language, grade, subject, trimester } = req.body;

    if (!ai) {
      res.status(500).json({ error: 'Clé API non disponible' });
      return;
    }

    const lang = resolveLang(language);
    const safePurpose = (purpose || '').slice(0, 300);
    const safeDetails = (details || '').slice(0, 500);
    // Prose docs (editor) pass grade/subject → ground them; pure announcements skip.
    const grounding = grade || subject ? buildGrounding({ grade, subject, trimester, topic: safePurpose, lang }) : '';
    const prompt = `Rédige un texte scolaire professionnel, bienveillant et clair pour un enseignant primaire en Tunisie.
${grounding}${langRule(lang)}
Objectif: ${safePurpose || 'Devoir de synthèse à venir'}
Détails: ${safeDetails || 'Réviser la multiplication et la géométrie'}
Destinataires: ${targetAudience || 'Parents et élèves de 4ème Année'}

Format JSON requis :
{
  "title": "Titre avec emoji",
  "content": "Message clair, poli et structuré"
}`;

    const data = await aiGenerateJSON(ai, prompt, ANNOUNCE_SCHEMA, 0.6);

    res.json({ success: true, result: data });
    return;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la rédaction';
    console.error('Error in /api/ai/draft-announcement:', err);
    res.status(500).json({ error: message });
    return;
  }
});

// 3. Explain Concept for Student (Tutor AI)
app.post('/api/ai/explain-concept', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { concept, grade, subject, language, trimester } = req.body;

    if (!ai) {
      res.status(500).json({ error: 'Clé API non disponible' });
      return;
    }

    const lang = resolveLang(language);
    const safeConcept = (concept || '').slice(0, 300);
    const grounding = buildGrounding({ grade, subject, trimester, topic: safeConcept, lang });
    const prompt = `Tu es un tuteur pédagogique très encouragant pour un enfant tunisien en ${grade || '4ème année'}.
${grounding}${langRule(lang)}
Explique la notion suivante de façon très simple et captivante :
Matière: ${subject || 'Sciences'}
Notion: ${safeConcept || 'La photosynthèse'}

Format JSON :
{
  "explanation": "Texte explicatif adapté aux enfants",
  "analogy": "Analogie visuelle ou métaphore",
  "checkQuestion": "Question rapide avec réponse"
}`;

    const data = await aiGenerateJSON(ai, prompt, EXPLAIN_SCHEMA, 0.6);

    res.json({ success: true, result: data });
    return;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de l\'explication';
    console.error('Error in /api/ai/explain-concept:', err);
    res.status(500).json({ error: message });
    return;
  }
});

// 4. AI Auto-Tagger & Multimodal Screenshot/Photo OCR
app.post('/api/ai/auto-tag-document', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { documentName, rawText, base64Data, contentType } = req.body;

    if (!ai) {
      const name = (documentName || '').toLowerCase();
      let grade = '4ème Année';
      if (name.includes('1') || name.includes('premiere')) grade = '1ère Année';
      else if (name.includes('2') || name.includes('deuxieme')) grade = '2ème Année';
      else if (name.includes('3') || name.includes('troisieme')) grade = '3ème Année';
      else if (name.includes('5') || name.includes('cinquieme')) grade = '5ème Année';
      else if (name.includes('6') || name.includes('sixieme')) grade = '6ème Année';

      let subject = 'Mathématiques';
      if (name.includes('arabe') || name.includes('عربي') || name.includes('قراءة')) subject = 'اللغة العربية';
      else if (name.includes('francais') || name.includes('français') || name.includes('lecture')) subject = 'Français';
      else if (name.includes('eveil') || name.includes('scientifique') || name.includes('ايقاظ')) subject = 'Éveil Scientifique';

      let docType = 'Devoir de Contrôle';
      if (name.includes('synthese') || name.includes('synthèse')) docType = 'Devoir de Synthèse';
      else if (name.includes('fiche') || name.includes('revision')) docType = 'Fiche de Révision';
      else if (name.includes('serie') || name.includes('série') || name.includes('exercice')) docType = 'Série d\'Exercices';

      res.json({
        success: true,
        tags: {
          suggestedTitle: documentName ? documentName.replace(/\.[^/.]+$/, '') : 'Document Pédagogique',
          grade,
          subject,
          trimester: 'Trimestre 1',
          docType,
          hasCorrection: true,
          summary: `${subject} - ${grade} - Document officiel conforme au programme tunisien.`,
          extractedContent: rawText || 'Document numérisé conforme au programme officiel du Ministère de l\'Éducation.',
        },
      });
      return;
    }

    const safeDocName = (documentName || '').slice(0, 200);
    const safeRawText = (rawText || '').slice(0, 2000);
    const prompt = `Tu es un système expert de reconnaissance optique (OCR) et de classification automatique de documents pédagogiques pour l'enseignement primaire en Tunisie (1ère à 6ème année).
Analyse minutieusement cette capture d'écran / photo de devoir ou fichier scolaire :
Nom du fichier / extrait : "${safeDocName} - ${safeRawText}"

Extrais avec une précision absolue les métadonnées de classification stricte pour la bibliothèque nationale, et transcris fidèlement le texte des exercices au format Markdown.

Réponds STRICTEMENT au format JSON valide suivant :
{
  "suggestedTitle": "Titre officiel propre et clair (ex: Devoir de Contrôle N°1 : Mathématiques et Géométrie)",
  "grade": "1ère Année" | "2ème Année" | "3ème Année" | "4ème Année" | "5ème Année" | "6ème Année",
  "subject": "Mathématiques" | "Français" | "اللغة العربية" | "Éveil Scientifique" | "Histoire & Géographie" | "Anglais",
  "trimester": "Trimestre 1" | "Trimestre 2" | "Trimestre 3",
  "docType": "Devoir de Contrôle" | "Devoir de Synthèse" | "Fiche de Révision" | "Série d'Exercices",
  "hasCorrection": true ou false,
  "summary": "Résumé pédagogique concis (1-2 phrases)",
  "extractedContent": "Transcription textuelle complète et propre des exercices, questions, consignes et barème au format Markdown (avec ### Exercice 1, listes, formules)"
}`;

    const contents: ({ inlineData: { mimeType: string; data: string } } | { text: string })[] = [];
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

    const data = await aiGenerateJSON(ai, contents, TAG_SCHEMA, 0.2);

    res.json({ success: true, tags: data });
    return;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de l\'analyse du document';
    console.error('Error in /api/ai/auto-tag-document:', err);
    res.status(500).json({ error: message });
    return;
  }
});

// 4b. Worksheet Style Analyzer (Phase 1a) — vision reads an uploaded worksheet image
// and extracts its "design DNA": topic, palette, layout, so we can clone the style.
app.post('/api/ai/analyze-worksheet', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { base64Data, contentType, documentName } = req.body;

    if (!ai) {
      res.status(500).json({ error: 'Clé API Gemini non configurée dans le serveur backend.' });
      return;
    }

    if (!base64Data || typeof base64Data !== 'string') {
      res.status(400).json({ error: 'Image requise (base64Data) pour analyser la fiche.' });
      return;
    }

    const safeDocName = (documentName || '').slice(0, 200);
    const prompt = `Tu es un expert en design pédagogique pour l'école primaire tunisienne (1ère à 6ème année).
Analyse cette image de fiche d'exercices / affiche scolaire et extrais son "ADN visuel" afin de pouvoir générer d'autres fiches dans EXACTEMENT le même style.
Nom du fichier : "${safeDocName}"

Réponds STRICTEMENT au format JSON valide suivant :
{
  "title": "Titre de la fiche détecté",
  "grade": "1ère Année" | "2ème Année" | "3ème Année" | "4ème Année" | "5ème Année" | "6ème Année",
  "subject": "Mathématiques" | "Français" | "اللغة العربية" | "Éveil Scientifique" | "Histoire & Géographie" | "Anglais",
  "topic": "Thème/chapitre précis (ex: Addition jusqu'à 10, Greetings, Phonics Tt)",
  "language": "fr" | "ar" | "en" | "mixed",
  "palette": ["#RRGGBB", "#RRGGBB", "#RRGGBB", "#RRGGBB"],
  "layoutStyle": "Description courte de la mise en page (ex: grille de 4 cartes colorées arrondies, en-tête festif, clipart par mot)",
  "illustrationStyle": "Style des dessins (ex: cartoon mignon, contours arrondis, couleurs vives, fond blanc)",
  "sections": [
    { "heading": "Titre de section détecté", "kind": "words" | "sentences" | "qcm" | "matching" | "phonics" | "commands" | "free", "itemsCount": 3 }
  ]
}

Instructions :
- palette : 3 à 6 couleurs HEX dominantes réellement présentes dans l'image.
- sections : liste fidèle des blocs/leçons visibles, dans l'ordre.`;

    const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, '');
    const mime = contentType || (base64Data.startsWith('data:image/png') ? 'image/png' : 'image/jpeg');
    const contents: ({ inlineData: { mimeType: string; data: string } } | { text: string })[] = [
      { inlineData: { mimeType: mime.startsWith('image/') ? mime : 'image/jpeg', data: base64Clean } },
      { text: prompt },
    ];

    const data = await aiGenerateJSON(ai, contents, DNA_SCHEMA, 0.2);

    res.json({ success: true, dna: data });
    return;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de l\'analyse de la fiche';
    console.error('Error in /api/ai/analyze-worksheet:', err);
    res.status(500).json({ error: message });
    return;
  }
});

// 4c. Similar Worksheet Generator (Phase 1b) — takes the design DNA and generates
// N new exercises on the same topic, reusing the detected palette/style.
app.post('/api/ai/generate-similar', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { dna, count } = req.body;

    if (!ai) {
      res.status(500).json({ error: 'Clé API Gemini non configurée dans le serveur backend.' });
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
    const grounding = buildGrounding({ grade, subject, topic, lang: dnaLang });
    const originalSections = Array.isArray(dna.sections)
      ? dna.sections.map((s: { heading?: string }) => s.heading).filter(Boolean).join(' | ').slice(0, 400)
      : '';

    const prompt = `Tu es un inspecteur pédagogique principal du Ministère de l'Éducation en Tunisie.
${grounding}
Génère ${n} exercices NOUVEAUX et variés, du même style et du même thème qu'une fiche existante, pour l'école primaire tunisienne.
${originalSections ? `IMPORTANT — ANTI-DOUBLON : la fiche originale contient déjà ces sections : "${originalSections}". Tes exercices doivent être DIFFÉRENTS (autres valeurs, autres mots, autres situations), jamais des copies.` : ''}
- Niveau: ${grade}
- Matière: ${subject}
- Thème: ${topic || 'conforme au programme officiel'}
- Palette de couleurs à réutiliser: ${palette.join(', ') || 'couleurs vives et enfantines'}
- Style d'illustration: ${(dna.illustrationStyle || 'cartoon mignon, couleurs vives').toString().slice(0, 200)}
- Langue de rédaction : Si la matière est l'Arabe (اللغة العربية), l'Éducation Islamique (التربية الإسلامية), l'Histoire, l'Éveil Scientifique en 1ère/2ème année, ou si le thème est en arabe, TOUS les titres ("title"), énoncés ("promptText"), consignes, options et corrections DOIVENT être rédigés en langue arabe tunisienne standard (العربية الفصحى). Si la matière est le Français, rédige en français adapté au programme tunisien.

Réponds STRICTEMENT au format JSON valide suivant :
{
  "exercises": [
    {
      "title": "Titre court de l'exercice",
      "promptText": "Énoncé complet et clair adapté au niveau",
      "solutionText": "Correction type",
      "hints": ["Indice 1"],
      "points": 5,
      "format": "free" | "qcm" | "true_false" | "fill_blanks" | "matching",
      "qcmOptions": ["Option 1", "Option 2", "Option 3"],
      "qcmCorrectIndex": 0,
      "tfStatements": [{"text": "Affirmation", "answer": true}],
      "gapText": "Texte avec [[mot]] à deviner",
      "matchingPairs": [{"left": "A", "right": "B"}],
      "imagePrompt": "Description en anglais d'une illustration cartoon pour cet exercice (sans texte dans l'image)"
    }
  ]
}

Instructions :
- Fournis exactement ${n} exercices dans "exercises".
- Varie les formats quand c'est pertinent ; remplis uniquement les champs utiles au format choisi.
- imagePrompt : courte description en anglais, style enfant, fond blanc, PAS de texte dans l'image.`;

    const data = await aiGenerateJSON(ai, prompt, SIMILAR_SCHEMA, 0.6);
    const exercises = Array.isArray(data['exercises'])
      ? (data['exercises'] as { qcmOptions?: string[]; qcmCorrectIndex?: number }[]).map(sanitizeExercise)
      : [];

    res.json({ success: true, exercises, palette, grade, subject, topic });
    return;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la génération des exercices similaires';
    console.error('Error in /api/ai/generate-similar:', err);
    res.status(500).json({ error: message });
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
    const { title, grade, subject, topic, palette, exercises, authorName, customWatermark, school } = req.body;
    if (!Array.isArray(exercises) || exercises.length === 0) {
      res.status(400).json({ error: 'Aucun exercice à enregistrer.' });
      return;
    }
    const id = randomUUID();
    const doc = {
      id,
      title: (title || 'Fiche Madrasati TN').toString().slice(0, 200),
      grade: (grade || '').toString().slice(0, 40),
      subject: (subject || '').toString().slice(0, 40),
      topic: (topic || '').toString().slice(0, 200),
      palette: Array.isArray(palette) ? palette.slice(0, 6) : [],
      exercises: exercises.slice(0, 20),
      authorName: (authorName || 'Enseignant Certifié').toString().slice(0, 100),
      customWatermark: (customWatermark || 'Madrasati TN — Document Certifié').toString().slice(0, 150),
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
    const { grade, subject, topic, format, originalPromptText, role, language, trimester } = req.body;

    if (!ai) {
      res.status(500).json({ error: 'Clé API Gemini non configurée.' });
      return;
    }

    const lang = resolveLang(language);

    const safeOriginal = (originalPromptText || '').slice(0, 1500);
    const safeTopic = (topic || '').slice(0, 200);
    const validFormats = ['free', 'qcm', 'true_false', 'fill_blanks', 'matching'];
    const targetFormat = validFormats.includes(format) ? format : 'free';
    const isParent = role === 'parent';

    const prompt = `Tu es un expert pédagogique tunisien. Génère une VARIANTE de l'exercice suivant pour le niveau ${grade || '4ème Année'} (${subject || 'Mathématiques'}).
${buildGrounding({ grade, subject, trimester, topic: safeTopic, lang })}NOTE LINGUISTIQUE : rédige la variante dans la MÊME langue que l'exercice original.

Exercice original :
"${safeOriginal || safeTopic}"

Règles STRICTES pour la variante :
- MÊME format : ${targetFormat}
- MÊME niveau de difficulté et MÊME compétence ciblée
- Change uniquement : les chiffres, les noms propres, les quantités, la mise en situation
- NE change PAS la structure ni le type de raisonnement requis
${isParent ? '- Variante immédiate non publiée : "aiVerified": false' : '- Pour validation enseignant avant publication : "aiVerified": false'}

Réponds STRICTEMENT au format JSON valide :
{
  "title": "Titre court de la variante",
  "promptText": "Texte complet de la consigne variante",
  "solutionText": "Correction détaillée de la variante",
  "hints": ["Indice 1"],
  "points": 5,
  "format": "${targetFormat}",
  "qcmOptions": [],
  "qcmCorrectIndex": 0,
  "tfStatements": [],
  "gapText": "",
  "matchingPairs": [],
  "aiGenerated": true,
  "aiVerified": false
}

Instructions par format :
- free : promptText complet. Champs spécifiques omis.
- qcm : qcmOptions (3-4 choix), qcmCorrectIndex, promptText.
- true_false : tfStatements (3-5 affirmations {text, answer}).
- fill_blanks : gapText avec [[mot]] pour les mots cachés.
- matching : matchingPairs (3-5 couples {left, right}).`;

    const data = await aiGenerateJSON(ai, prompt, EXERCISE_SCHEMA, 0.5);
    data['aiGenerated'] = true;
    data['aiVerified'] = false;

    res.json({ success: true, variant: sanitizeExercise(data as { qcmOptions?: string[]; qcmCorrectIndex?: number }) });
    return;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la génération de la variante';
    console.error('Error in /api/ai/variant:', err);
    res.status(500).json({ error: message });
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
      language = 'ar',
      chapter = '',
      isFreeTopic = false,
      tags = [],
    } = req.body;
    if (!ai) {
      res.status(500).json({ error: 'Clé API Gemini non configurée.' });
      return;
    }

    const conversationHistoryStr = messages
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Enseignant' : 'Assistant IA'}: ${m.content}`)
      .join('\n');

    const isArabicMode = language === 'ar' || /[\u0600-\u06FF]/.test(userPrompt);
    const activeChapter = chapter || currentArticle.chapter || '';
    const tagsStr = Array.isArray(tags) && tags.length > 0 ? tags.map((t: string) => `#${t}`).join(', ') : '';

    const frameworkSection = isFreeTopic
      ? `MODE : BLOG PÉDAGOGIQUE LIBRE & ORIENTATION ÉDUCATIVE (Non contraint à un exercice unique de manuel)
- Thématiques & الوسوم (Tags) ciblés : ${tagsStr || 'نصائح_تربوية, توجيه_الأولياء, مهارات_التعلم'}
- Public visé : Familles, parents et élèves de l'école primaire tunisienne.
Concentre tes conseils, méthodes d'apprentissage, gestion du temps et remédiations sur ces thématiques libres et pratiques.`
      : `CADRE CURRICULAIRE OFFICIEL TUNISIEN (CNP) :
- Matière : ${currentArticle.subject || 'Général'}
- Niveau scolaire : ${currentArticle.grade || 'Primaire'}
${activeChapter ? `- Chapitre / Axe ciblé du programme : "${activeChapter}"` : ''}
${tagsStr ? `- Tags associés : ${tagsStr}` : ''}
${buildGrounding({ grade: currentArticle.grade, subject: currentArticle.subject, topic: activeChapter || (userPrompt || '').slice(0, 300), lang: isArabicMode ? 'ar' : 'fr' })}
Tu dois fonder tes explications, exemples, remédiations et activités sur les compétences requises par le programme officiel du Ministère de l'Éducation tunisien.`;

    const prompt = `Tu es un conseiller pédagogique senior pour l'enseignement primaire en Tunisie (Madrasati TN).
Tu dialogues avec un enseignant pour co-rédiger un article de blog pédagogique percutant, clair et inspirant, destiné soit à d'autres enseignants, soit aux parents d'élèves.

${frameworkSection}

RÈGLE LINGUISTIQUE CRITIQUE ET ABSOLUE :
${isArabicMode
  ? `- L'ENSEIGNANT UTILISE L'INTERFACE EN ARABE. TOUT DOIT ÊTRE EN ARABE LITTÉRAIRE TUNISIEN ÉDUCATIF.
- "replyText" DOIT être en Arabe élégant et bienveillant.
- "updatedArticle.title", "updatedArticle.summary", "updatedArticle.subject", "updatedArticle.grade" et "updatedArticle.contentMarkdown" DOIVENT ÊTRE EN ARABE.
- Les puces d'actions "suggestedChips" DOIVENT ÊTRE EN ARABE.`
  : `- L'ENSEIGNANT UTILISE L'INTERFACE EN FRANÇAIS.
- Rédige "replyText", l'article et les "suggestedChips" en FRANÇAIS soigné.`
}

Historique de la conversation :
${conversationHistoryStr}

Demande actuelle de l'enseignant :
"${userPrompt}"

État actuel de l'article en cours de rédaction :
- Titre : ${currentArticle.title || 'Sans titre'}
- Matière : ${currentArticle.subject || 'Général'}
- Niveau scolaire : ${currentArticle.grade || 'Primaire'}
- Chapitre : ${activeChapter || 'Général'}
- Résumé : ${currentArticle.summary || ''}
- Contenu Markdown actuel :
${currentArticle.contentMarkdown || '(Vide)'}

Mission :
1. Réponds cordialement et de façon constructive à la demande de l'enseignant dans le champ "replyText" (dans la même langue : Arabe ou Français).
2. Mets à jour et enrichis l'article dans le champ "updatedArticle" (utilise le format Markdown soigné avec titres ##, listes, encadrés > [!TIP] ou > [!NOTE], et exemples concrets de la réalité tunisienne).
3. Propose 3 à 4 puces d'actions suivantes sous "suggestedChips" dans la langue correspondante.

Format de sortie STRICT : JSON uniquement, sans markdown wrapper :
{
  "replyText": "...",
  "updatedArticle": {
    "title": "...",
    "summary": "...",
    "subject": "...",
    "grade": "...",
    "contentMarkdown": "..."
  },
  "suggestedChips": ["...", "...", "..."]
}`;

    const data = await aiGenerateJSON(ai, prompt, CHAT_ARTICLE_SCHEMA, 0.7);

    res.json({ success: true, ...data });
    return;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la génération de l\'article';
    console.error('Error in /api/ai/chat-article:', err);
    res.status(500).json({ error: message });
    return;
  }
});

// Endpoint: AI Illustration Generator (Google Imagen 3 / SVG fallbacks)
app.post('/api/ai/generate-illustration', originGuard, aiRateLimiter, aiDailyGuard, async (req: Request, res: Response) => {
  try {
    const { promptText = '' } = req.body;
    if (!ai) {
      res.status(500).json({ error: 'Clé API Gemini non configurée.' });
      return;
    }

    // Try Imagen 3 first
    try {
      const imgResponse = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: `Educational illustration for Tunisian primary school students. High quality, clear, colorful, friendly: ${promptText}`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
      });

      const firstImage = imgResponse.generatedImages?.[0];
      const base64Data = firstImage?.image?.imageBytes;
      if (base64Data) {
        const filename = `illustration_${randomUUID()}.jpg`;
        const filepath = join(uploadsFolder, filename);
        writeFileSync(filepath, Buffer.from(base64Data, 'base64'));

        const imageUrl = `/uploads/${filename}`;
        res.json({ success: true, imageUrl });
        return;
      }
    } catch (imagenErr) {
      console.warn('Imagen 3 direct call fallback, generating high-res curated SVG illustration:', imagenErr);
    }

    // Fallback: Gemini creates a rich SVG vector illustration saved as .svg
    const svgPrompt = `Create a clean, modern, pedagogical SVG illustration for Tunisian school children about: "${promptText}".
Output ONLY raw valid SVG code starting with <svg and ending with </svg>. Use viewBox="0 0 800 450", smooth gradients, friendly rounded shapes. No markdown formatting.`;

    const svgResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: svgPrompt,
    });

    const rawSvg = (svgResponse.text || '').replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
    const filename = `illustration_${randomUUID()}.svg`;
    const filepath = join(uploadsFolder, filename);
    writeFileSync(filepath, rawSvg, 'utf8');

    res.json({ success: true, imageUrl: `/uploads/${filename}` });
    return;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la création de l\'illustration';
    console.error('Error in /api/ai/generate-illustration:', err);
    res.status(500).json({ error: message });
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

// OG tags for shared BD pages (/bd?p=ITEM_ID) — same crawler-only pattern as /generate.
const BD_ID_RE = /^[A-Za-z0-9_-]{4,80}$/;
interface BdManifestItem { id: string; title?: string; grade?: string; subject?: string; topic?: string; relPath?: string }
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

app.get('/bd', (req: Request, res: Response, next): void => {
  const ua = req.get('user-agent') || '';
  const itemId = String((req.query['p'] as string) || '');
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
    const descParts = [item.grade, item.subject, item.topic].filter(Boolean).join(' · ');
    const description = escapeHtmlAttr(
      descParts
        ? `${descParts}. Planche officielle du manuel CNP — Madrasati TN.`
        : 'Bande dessinée officielle pour l\'école primaire tunisienne — Madrasati TN.',
    );
    const imageUrl = escapeHtmlAttr(item.relPath ? `${origin}/${item.relPath}` : `${origin}/favicon.svg`);
    const pageUrl = escapeHtmlAttr(`${origin}/bd?p=${itemId}`);

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
    const imageUrl = escapeHtmlAttr(firstImg ? `${origin}${firstImg}` : `${origin}/favicon.svg`);
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

app.get(['/favicon.ico', '/favicon.svg'], (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');
  const fileName = req.path.endsWith('.svg') ? 'favicon.svg' : 'favicon.ico';
  res.sendFile(join(browserDistFolder, fileName));
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
