import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { Request, Response, NextFunction } from 'express';
import { join } from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const browserDistFolder = join(import.meta.dirname, '../browser');
const uploadsFolder = join(process.cwd(), 'uploads');

if (!existsSync(uploadsFolder)) {
  mkdirSync(uploadsFolder, { recursive: true });
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
    const { filename, base64Data, contentType } = req.body;
    if (!base64Data || typeof base64Data !== 'string') {
      res.status(400).json({ error: 'Aucun fichier transmis ou format invalide' });
      return;
    }

    // Strip base64 prefix if present
    const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    if (buffer.length > MAX_UPLOAD_BYTES) {
      res.status(413).json({ error: 'Fichier trop volumineux (limite 15 Mo)' });
      return;
    }

    let ext = (filename?.split('.').pop() || '').toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      ext = contentType?.includes('pdf') ? 'pdf' : contentType?.includes('png') ? 'png' : 'jpg';
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
 * Hardened AI Assistant Endpoints with Origin Guard & Rate Limiting
 */

// 1. Generate Exercise (Dual-Mode: Teacher vs Parent)
app.post('/api/ai/generate-exercise', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { grade, subject, topic, difficulty, format, role, childName } = req.body;

    if (!ai) {
      res.status(500).json({
        error: 'Clé API Gemini non configurée dans le serveur backend.',
      });
      return;
    }

    const safeTopic = (topic || '').slice(0, 300);
    const validFormats = ['free', 'qcm', 'true_false', 'fill_blanks', 'matching'];
    const requestedFormat = validFormats.includes(format) ? format : undefined;
    const isParent = role === 'parent';

    const systemContext = isParent
      ? `Tu es un guide pédagogique bienveillant aidant un parent tunisien à faire réviser son enfant (${childName || "l'élève"}). Crée un exercice stimulant, motivant et clair avec des situations concrètes du quotidien tunisien.`
      : `Tu es un inspecteur pédagogique principal du Ministère de l'Éducation en Tunisie. Conçois un exercice rigoureux conforme au programme officiel tunisien pour évaluation scolaire.`;

    const correctionGuidance = isParent
      ? `"solutionText": "Solution claire avec démarche de calcul ou règle grammaticale simple",
  "parentGuide": "Conseil pratique étape par étape pour aider l'enfant à comprendre sans le bloquer"`
      : `"solutionText": "Correction type officielle et barème de notation détaillé étape par étape",
  "teacherNotes": "Compétences officielles visées et critères d'évaluation ministériels"`;

    const prompt = `${systemContext}
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);

    res.json({ success: true, exercise: data });
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
    const { originalBlock, transformType, customInstruction, grade, subject } = req.body;

    if (!ai) {
      res.status(500).json({ error: 'Clé API non configurée' });
      return;
    }

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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);

    res.json({ success: true, transformed: data });
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
    const { grade, subject, trimester, topics } = req.body;

    if (!ai) {
      res.status(500).json({ error: 'Clé API non disponible' });
      return;
    }

    const safeTopics = (topics || '').slice(0, 300);
    const prompt = `Tu es un inspecteur pédagogique principal du Ministère de l'Éducation en Tunisie.
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);

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
    const { promptText, grade, subject } = req.body;

    if (!ai) {
      res.status(500).json({ error: 'Clé API non disponible' });
      return;
    }

    const safePrompt = (promptText || '').slice(0, 1500);
    const prompt = `Tu es un enseignant tunisien chevronné. Rédige le corrigé officiel, rigoureux et didactique de l'exercice suivant pour le niveau ${grade || 'Primaire'} (${subject || 'Général'}) :
"${safePrompt}"

Réponds STRICTEMENT au format JSON valide suivant :
{
  "solutionText": "Corrigé étape par étape, clair, pédagogique avec le résultat final mis en évidence",
  "teacherNotes": "Conseils pédagogiques pour l'enseignant et critères d'évaluation",
  "recommendedPoints": 5
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);

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
    const { purpose, details, targetAudience } = req.body;

    if (!ai) {
      res.status(500).json({ error: 'Clé API non disponible' });
      return;
    }

    const safePurpose = (purpose || '').slice(0, 300);
    const safeDetails = (details || '').slice(0, 500);
    const prompt = `Rédige une annonce scolaire professionnelle, bienveillante et claire en français pour un enseignant primaire en Tunisie.
Objectif: ${safePurpose || 'Devoir de synthèse à venir'}
Détails: ${safeDetails || 'Réviser la multiplication et la géométrie'}
Destinataires: ${targetAudience || 'Parents et élèves de 4ème Année'}

Format JSON requis :
{
  "title": "Titre avec emoji",
  "content": "Message clair, poli et structuré"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);

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
    const { concept, grade, subject } = req.body;

    if (!ai) {
      res.status(500).json({ error: 'Clé API non disponible' });
      return;
    }

    const safeConcept = (concept || '').slice(0, 300);
    const prompt = `Tu es un tuteur pédagogique très encouragant pour un enfant tunisien en ${grade || '4ème année'}.
Explique la notion suivante de façon très simple et captivante :
Matière: ${subject || 'Sciences'}
Notion: ${safeConcept || 'La photosynthèse'}

Format JSON :
{
  "explanation": "Texte explicatif adapté aux enfants",
  "analogy": "Analogie visuelle ou métaphore",
  "checkQuestion": "Question rapide avec réponse"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);

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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
    });

    const text = response.text || '';
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);

    res.json({ success: true, tags: data });
    return;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de l\'analyse du document';
    console.error('Error in /api/ai/auto-tag-document:', err);
    res.status(500).json({ error: message });
    return;
  }
});

// 5. Variant Exercise Generator (Idea 11 — Variante IA)
app.post('/api/ai/variant', originGuard, aiRateLimiter, aiDailyGuard, async (req, res): Promise<void> => {
  try {
    const { grade, subject, topic, format, originalPromptText, role } = req.body;

    if (!ai) {
      res.status(500).json({ error: 'Clé API Gemini non configurée.' });
      return;
    }

    const safeOriginal = (originalPromptText || '').slice(0, 1500);
    const safeTopic = (topic || '').slice(0, 200);
    const validFormats = ['free', 'qcm', 'true_false', 'fill_blanks', 'matching'];
    const targetFormat = validFormats.includes(format) ? format : 'free';
    const isParent = role === 'parent';

    const prompt = `Tu es un expert pédagogique tunisien. Génère une VARIANTE de l'exercice suivant pour le niveau ${grade || '4ème Année'} (${subject || 'Mathématiques'}).

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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);

    res.json({ success: true, variant: data });
    return;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la génération de la variante';
    console.error('Error in /api/ai/variant:', err);
    res.status(500).json({ error: message });
    return;
  }
});

// Endpoint: Conversational Article Assistant Co-Pilot
app.post('/api/ai/chat-article', async (req: Request, res: Response) => {
  try {
    const { messages = [], currentArticle = {}, userPrompt = '' } = req.body;
    if (!ai) {
      res.status(500).json({ error: 'Clé API Gemini non configurée.' });
      return;
    }

    const conversationHistoryStr = messages
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Enseignant' : 'Assistant IA'}: ${m.content}`)
      .join('\n');

    const prompt = `Tu es un conseiller pédagogique senior pour l'enseignement primaire en Tunisie (Madrasati TN).
Tu dialogues avec un enseignant pour co-rédiger un article de blog pédagogique percutant, clair et inspirant, destiné soit à d'autres enseignants, soit aux parents d'élèves.

RÈGLE LINGUISTIQUE ESSENTIELLE :
- Si la demande de l'enseignant est en ARABE (ou que l'interface est en Arabe), réponds OBLIGATOIREMENT en ARABE littéraire clair, et rédige l'article et les suggestions (suggestedChips) en ARABE.
- Si la demande est en FRANÇAIS, réponds et rédige en FRANÇAIS.

Historique de la conversation :
${conversationHistoryStr}

Demande actuelle de l'enseignant :
"${userPrompt}"

État actuel de l'article en cours de rédaction :
- Titre : ${currentArticle.title || 'Sans titre'}
- Matière : ${currentArticle.subject || 'Général'}
- Niveau scolaire : ${currentArticle.grade || 'Primaire'}
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);

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
app.post('/api/ai/generate-illustration', async (req: Request, res: Response) => {
  try {
    const { promptText = '', style = 'educational' } = req.body;
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
