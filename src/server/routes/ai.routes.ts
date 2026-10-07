import { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import mammoth from 'mammoth';
import { GoogleGenAI, Type } from '@google/genai';
import { retrieveContext } from '../knowledge-source';
import { BLOCK_SCHEMAS } from '../memo-schema';
import { resolveLang, langRule } from '../lang';
import { checkExercise } from '../post-checks';
import { runChain } from '../ai/chain';
import { ChainName } from '../ai/types';
import { toPublicError } from '../ai/public-error';
import { createCache, hashKey } from '../ai/cache';
import { sanitizeSvg } from '../ai/svg-sanitize';
import { generateImage } from '../ai/image-chain';
import { resolveInside } from '../safe-path';
import { capText, capHistory, wrapData, CAPS } from '../input-caps';
import { originGuard, aiRateLimiter, aiDailyGuard } from '../guards';
import { saveGenerated } from '../storage';
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
} from '../skills';

// Initialize Gemini Client(s) with multi-key pooling & dynamic rotation
const rawApiKeys = [
  ...new Set(
    Object.entries(process.env)
      .filter(([k, v]) => k.startsWith('GEMINI_API_KEY') && typeof v === 'string')
      .map(([, v]) => v as string)
      .join(',')
      .split(/[,\n]/)
      .map((k) => k.trim().replace(/^["']|["']$/g, ''))
      .filter((k) => k.length > 0),
  ),
];

// 60 s per call so a hung request fails over to the next key/model instead of stalling the chain.
const aiClients: GoogleGenAI[] = rawApiKeys.map((key) => new GoogleGenAI({ apiKey: key, httpOptions: { timeout: 60000 } }));

type GeminiPart = { inlineData: { mimeType: string; data: string } } | { text: string };

const openRouterKey = (process.env['OPENROUTER_API_KEY'] || '').trim().replace(/^["']|["']$/g, '');
export const aiReady = () => aiClients.length > 0 || !!openRouterKey;

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

// In-memory exercise response cache (1h TTL, max 200 items)
const exerciseCache = createCache<Record<string, unknown>>({ max: 200, ttlMs: 60 * 60 * 1000 });

// Image generation configuration
type ImageCategory = 'science' | 'math' | 'history' | 'geography' | 'arabic' | 'french' | 'reading' | 'article' | 'generic';
const IMAGE_CATEGORIES: ImageCategory[] = [
  'science',
  'math',
  'history',
  'geography',
  'arabic',
  'french',
  'reading',
  'article',
  'generic',
];

const IMAGE_STYLES: Record<ImageCategory, string> = {
  science: 'clear botanical or anatomical educational diagram style, clean outlines, labelled parts, soft pastel colors, white background',
  math: 'geometric shapes and colorful counting objects, isometric flat design, crisp outlines, high contrast on white',
  history: 'Tunisian cultural heritage illustration, warm Mediterranean tones, respectful historical depiction, gouache style',
  geography: 'clean educational cartography and landscape illustration, subtle textures, vibrant Mediterranean palette',
  arabic: 'warm traditional Tunisian home or school setting, calligraphy-friendly composition, soft watercolor tones',
  french: 'playful modern European children book style, expressive friendly characters, pastel gouache',
  reading: 'storybook illustration, imaginative warm atmosphere, gentle colors, charming child protagonist',
  article: 'wide editorial cover illustration, flat vector, one clear central subject, friendly modern style, balanced composition',
  generic: 'friendly flat children book illustration, clean composition, bright colors',
};

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

export const aiRouter = Router();

// 1. Generate Exercise (Dual-Mode: Teacher vs Parent)
aiRouter.post('/generate-exercise', originGuard, aiRateLimiter, aiDailyGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      grade,
      subject,
      topic,
      difficulty,
      mode = 'teacher',
      format = 'free',
      trimester = 'Trimestre 1',
      points = 5,
      language,
    } = req.body;
    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible. Aucune clé API configurée.' });
      return;
    }

    const lang = resolveLang(language);
    const cacheKey = hashKey({ grade, subject, topic, difficulty, format, trimester, points, lang });
    const cached = exerciseCache.get(cacheKey);
    if (cached) {
      res.json({ success: true, exercise: cached, cached: true });
      return;
    }

    const prompt = compose(exerciseSkill, {
      grade,
      subject,
      topic,
      difficulty,
      mode,
      format,
      trimester,
      points,
      lang,
      contextBlockStr: contextBlock({ grade, subject, trimester, topic, lang }),
    });

    const data = await aiGenerateJSON(exerciseSkill.chain, prompt, exerciseSkill.schema, exerciseSkill.temperature);
    const sanitized = sanitizeExercise(data);
    exerciseCache.set(cacheKey, sanitized);

    res.json({ success: true, exercise: sanitized });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/generate-exercise:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 1a. Transform Existing Exercise (QCM / Vrai-Faux / Math Story / Fill Blank)
aiRouter.post('/transform-exercise', originGuard, aiRateLimiter, aiDailyGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const { exercise, targetFormat, grade = '3ème Année', subject = 'Mathématiques', language } = req.body;
    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }
    if (!exercise?.title || !targetFormat) {
      res.status(400).json({ error: 'Exercice source et targetFormat requis.' });
      return;
    }

    const lang = resolveLang(language);
    const prompt = compose(exerciseTransformSkill, {
      exercise,
      targetFormat,
      grade,
      subject,
      lang,
    });

    const data = await aiGenerateJSON(
      exerciseTransformSkill.chain,
      prompt,
      exerciseTransformSkill.schema,
      exerciseTransformSkill.temperature,
    );

    res.json({ success: true, exercise: sanitizeExercise(data) });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/transform-exercise:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 1b. Generate Full Official Exam (3 Progressive Sections totaling exactly 20 Points)
aiRouter.post('/generate-full-exam', originGuard, aiRateLimiter, aiDailyGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const { grade, subject, trimester, topics, topic, language } = req.body;
    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }

    const lang = resolveLang(language);
    const safeTopic = topic || topics || 'Révision générale';
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
aiRouter.post('/solve-exercise', originGuard, aiRateLimiter, aiDailyGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const { exerciseTitle, exerciseInstructions, grade = '4ème Année', subject = 'Mathématiques', language } = req.body;
    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }
    if (!exerciseTitle && !exerciseInstructions) {
      res.status(400).json({ error: 'Titre ou énoncé requis.' });
      return;
    }

    const lang = resolveLang(language);
    const prompt = compose(solveSkill, {
      exerciseTitle,
      exerciseInstructions,
      grade,
      subject,
      lang,
    });

    const data = await aiGenerateJSON(solveSkill.chain, prompt, solveSkill.schema, solveSkill.temperature);
    res.json({ success: true, solution: data });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/solve-exercise:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 1d. Draft Teacher Parent Announcement (WhatsApp / SMS)
aiRouter.post('/draft-announcement', originGuard, aiRateLimiter, aiDailyGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const { purpose, grade, details, language } = req.body;
    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }
    if (!purpose) {
      res.status(400).json({ error: 'Objectif du message requis.' });
      return;
    }

    const lang = resolveLang(language);
    const prompt = compose(announcementSkill, {
      purpose,
      grade,
      details,
      lang,
    });

    const data = await aiGenerateJSON(announcementSkill.chain, prompt, announcementSkill.schema, announcementSkill.temperature);
    res.json({ success: true, announcement: data });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/draft-announcement:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 1e. Explain Pedagogical Concept (Student / Parent Tutor)
aiRouter.post('/explain-concept', originGuard, aiRateLimiter, aiDailyGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const { concept, grade = '3ème Année', language } = req.body;
    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }
    if (!concept) {
      res.status(400).json({ error: 'Concept à expliquer requis.' });
      return;
    }

    const lang = resolveLang(language);
    const prompt = compose(explainSkill, {
      concept,
      grade,
      lang,
    });

    const data = await aiGenerateJSON(explainSkill.chain, prompt, explainSkill.schema, explainSkill.temperature);
    res.json({ success: true, explanation: data });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/explain-concept:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 2. Auto-Tag and Extract Metadata from Uploaded Documents
aiRouter.post('/auto-tag-document', originGuard, aiRateLimiter, aiDailyGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename, fileData, mimeType } = req.body;
    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }
    if (!fileData) {
      res.status(400).json({ error: 'fileData requis.' });
      return;
    }

    const isImage = mimeType?.startsWith('image/');
    const isPdf = mimeType === 'application/pdf';
    const isDocx =
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      filename?.endsWith('.docx');

    let contents: string | GeminiPart[];

    if (isDocx) {
      try {
        const buffer = Buffer.from(fileData, 'base64');
        const extracted = await mammoth.extractRawText({ buffer });
        const docxText = extracted.value.slice(0, 3000);
        const prompt = compose(tagSkill, { filename, previewText: docxText });
        contents = prompt;
      } catch (e) {
        console.warn('Docx extraction failed in auto-tag, falling back to name analysis:', e);
        contents = compose(tagSkill, { filename, previewText: '' });
      }
    } else if (isImage || isPdf) {
      const prompt = compose(tagSkill, { filename, previewText: '' });
      contents = [
        {
          inlineData: {
            mimeType: isPdf ? 'application/pdf' : mimeType,
            data: fileData,
          },
        },
        { text: prompt },
      ];
    } else {
      contents = compose(tagSkill, { filename, previewText: '' });
    }

    const data = await aiGenerateJSON(tagSkill.chain, contents, tagSkill.schema, tagSkill.temperature);
    res.json({ success: true, metadata: data });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/auto-tag-document:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 3. Student Homework Solver (Camera / Photo Upload)
aiRouter.post('/photo-solve', originGuard, aiRateLimiter, aiDailyGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const { photoBase64, mimeType = 'image/jpeg', grade = '4ème Année', subject = 'Mathématiques', studentNotes } = req.body;
    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }
    if (!photoBase64) {
      res.status(400).json({ error: 'Photo requise.' });
      return;
    }

    const cleanBase64 = photoBase64.replace(/^data:[^;]+;base64,/, '');
    const lang = resolveLang(undefined);
    const prompt = compose(solveSkill, {
      exerciseTitle: 'Photo de devoir / cahier',
      exerciseInstructions: studentNotes || '',
      grade,
      subject,
      lang,
    });

    const contents: GeminiPart[] = [
      {
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      },
      { text: prompt },
    ];

    const data = await aiGenerateJSON(solveSkill.chain, contents, solveSkill.schema, solveSkill.temperature);
    res.json({ success: true, solution: data });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/photo-solve:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 4. Summarize Uploaded Documents / Synthesize Study Guide
aiRouter.post('/summarize-docs', originGuard, aiRateLimiter, aiDailyGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const { files, grade = '4ème Année', subject = 'Éveil Scientifique', topic, language } = req.body;
    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }
    if (!Array.isArray(files) || files.length === 0) {
      res.status(400).json({ error: 'Au moins un document requis.' });
      return;
    }

    const lang = resolveLang(language);
    const prompt = compose(summarizeSkill, {
      grade,
      subject,
      topic: topic || 'Synthèse de cours',
      lang,
      docCount: files.length,
    });

    const parts: GeminiPart[] = [];
    for (const f of files.slice(0, 8)) {
      if (!f.data) continue;
      const cleanData = f.data.replace(/^data:[^;]+;base64,/, '');
      if (f.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || f.name?.endsWith('.docx')) {
        try {
          const buffer = Buffer.from(cleanData, 'base64');
          const ext = await mammoth.extractRawText({ buffer });
          parts.push({ text: `[Document ${f.name}]:\n${ext.value.slice(0, 3000)}` });
        } catch {
          // ignore docx error
        }
      } else {
        parts.push({
          inlineData: {
            mimeType: f.mimeType || 'image/jpeg',
            data: cleanData,
          },
        });
      }
    }

    parts.push({ text: prompt });
    const data = await aiGenerateJSON(summarizeSkill.chain, parts, summarizeSkill.schema, summarizeSkill.temperature);
    res.json({ success: true, summary: data });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/summarize-docs:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 4a. Visual Memo Generator (Studio Fiche Mémo)
aiRouter.post('/generate-memo', originGuard, aiRateLimiter, aiDailyGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      topic,
      grade,
      subject,
      trimester,
      targetBlocks = 5,
      language,
      sourceFiles,
      teacherNotes,
      existingMemo,
      userInstruction,
    } = req.body;

    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }
    if (!topic && !teacherNotes && (!Array.isArray(sourceFiles) || sourceFiles.length === 0)) {
      res.status(400).json({ error: 'Un thème, des notes ou au moins un document source sont requis.' });
      return;
    }

    const lang: 'ar' | 'fr' = resolveLang(language);
    let resolvedGrade = (grade || '').trim();
    let resolvedSubject = (subject || '').trim();
    let resolvedTrimester = (trimester || '').trim();

    if (!resolvedGrade || !resolvedSubject) {
      const probe = retrieveContext({ topic, lang });
      if (probe.sources.length > 0) {
        const top = probe.sources[0];
        if (!resolvedGrade) resolvedGrade = top.grade;
        if (!resolvedSubject) resolvedSubject = top.subject;
        if (!resolvedTrimester) resolvedTrimester = top.trimester;
      }
    }

    const prompt = compose(memoSkill, {
      topic,
      grade: resolvedGrade,
      subject: resolvedSubject,
      trimester: resolvedTrimester,
      lang,
      targetBlocks,
      teacherNotes,
      existingMemo,
      userInstruction,
      contextBlockStr: contextBlock({
        grade: resolvedGrade,
        subject: resolvedSubject,
        trimester: resolvedTrimester,
        topic,
        lang,
      }),
    });

    const parts: GeminiPart[] = [];
    if (Array.isArray(sourceFiles)) {
      for (const f of sourceFiles.slice(0, 6)) {
        if (!f) continue;
        if (typeof f.url === 'string' && f.url.startsWith('/uploads/')) {
          try {
            const fsPath = resolveInside(process.env['UPLOAD_DIR'] || 'uploads', f.url.slice('/uploads/'.length));
            if (!fsPath) continue;
            const buffer = await (await import('node:fs/promises')).readFile(fsPath);
            const mime = f.url.endsWith('.png') ? 'image/png' : f.url.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
            parts.push({
              inlineData: {
                mimeType: mime,
                data: buffer.toString('base64'),
              },
            });
          } catch (e) {
            console.warn('[generate-memo] Could not attach file from url:', f.url, e);
          }
        } else if (f.data && f.mimeType) {
          const clean = f.data.replace(/^data:[^;]+;base64,/, '');
          parts.push({
            inlineData: {
              mimeType: f.mimeType,
              data: clean,
            },
          });
        }
      }
    }
    parts.push({ text: prompt });

    const data = await aiGenerateJSON(memoSkill.chain, parts, memoSkill.schema, memoSkill.temperature);

    const doc = (data['memoDoc'] || data) as Record<string, unknown>;
    if (!doc['grade'] && resolvedGrade) doc['grade'] = resolvedGrade;
    if (!doc['subject'] && resolvedSubject) doc['subject'] = resolvedSubject;
    if (!doc['trimester'] && resolvedTrimester) doc['trimester'] = resolvedTrimester;

    if (Array.isArray(doc['blocks'])) {
      for (const block of doc['blocks'] as Record<string, unknown>[]) {
        const type = String(block['type'] || '');
        if (type && type in BLOCK_SCHEMAS && typeof block['data'] !== 'object') {
          block['data'] = {};
        }
      }
    }

    res.json({
      success: true,
      memoDoc: doc,
      appliedLayout: data['suggestedLayout'] || 'tree',
    });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/generate-memo:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 4b. Worksheet Style Analyzer — vision reads an uploaded worksheet image
aiRouter.post('/analyze-worksheet', originGuard, aiRateLimiter, aiDailyGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }
    if (!imageBase64) {
      res.status(400).json({ error: 'Image de la fiche requise.' });
      return;
    }

    const cleanBase64 = String(imageBase64).replace(/^data:[^;]+;base64,/, '');
    const prompt = compose(worksheetDnaSkill, {});

    const contents: GeminiPart[] = [
      {
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      },
      { text: prompt },
    ];

    const data = await aiGenerateJSON(worksheetDnaSkill.chain, contents, worksheetDnaSkill.schema, worksheetDnaSkill.temperature);
    res.json({ success: true, dna: data });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/analyze-worksheet:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 4c. Worksheet Generator from DNA (Clone Style, New Pedagogical Content)
aiRouter.post('/generate-similar', originGuard, aiRateLimiter, aiDailyGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const { dna, count = 3, language } = req.body;
    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }
    if (!dna || typeof dna !== 'object') {
      res.status(400).json({ error: 'DNA de la fiche requis.' });
      return;
    }

    const safeCount = Math.min(Math.max(Number(count) || 3, 1), 6);
    const lang = resolveLang(language);
    const prompt = compose(worksheetSimilarSkill, {
      dna,
      count: safeCount,
      lang,
      contextBlockStr: contextBlock({
        grade: dna.grade,
        subject: dna.subject,
        trimester: dna.trimester,
        topic: dna.topic,
        lang,
      }),
    });

    const data = await aiGenerateJSON(
      worksheetSimilarSkill.chain,
      prompt,
      worksheetSimilarSkill.schema,
      worksheetSimilarSkill.temperature,
    );
    const list = Array.isArray(data['exercises']) ? (data['exercises'] as Record<string, unknown>[]) : [];
    const clampedList = enforceExactExerciseCount(list, safeCount);
    const sanitized = clampedList.map((e) => sanitizeExercise(e));

    res.json({
      success: true,
      title: data['title'] || dna.title || 'Fiche d\'exercices',
      exercises: sanitized,
    });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/generate-similar:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 5. Variant Exercise Generator
aiRouter.post('/variant', originGuard, aiRateLimiter, aiDailyGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      exercise,
      variantType = 'numbers',
      language,
    } = req.body;
    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }
    if (!exercise || (!exercise.title && !exercise.question && !exercise.instructions)) {
      res.status(400).json({ error: 'Exercice source requis.' });
      return;
    }

    const lang = resolveLang(language);
    const cacheKey = hashKey({ exercise, variantType, lang });
    const cached = exerciseCache.get(cacheKey);
    if (cached) {
      res.json({ success: true, exercise: cached, cached: true });
      return;
    }

    const prompt = compose(exerciseVariantSkill, {
      targetFormat: variantType || 'free',
      role: 'teacher',
      originalText: exercise.question || exercise.promptText || exercise.instructions || exercise.title || '',
      originalSolution: exercise.solution || exercise.solutionText || '',
    });

    const data = await aiGenerateJSON(
      exerciseVariantSkill.chain,
      prompt,
      exerciseVariantSkill.schema,
      exerciseVariantSkill.temperature,
    );
    const sanitized = sanitizeExercise(data);
    exerciseCache.set(cacheKey, sanitized);

    res.json({ success: true, exercise: sanitized });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/variant:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 6. Article Studio Chat Assistant
aiRouter.post('/chat-article', originGuard, aiRateLimiter, aiDailyGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      messages = [],
      currentArticle = {},
      userPrompt = '',
      grade = '3ème Année',
      subject = 'Éveil Scientifique',
      language,
      chapter = '',
      isFreeTopic = false,
      tags = [],
    } = req.body;
    if (!aiReady()) {
      res.status(500).json({ error: 'Service IA non disponible.' });
      return;
    }

    const lang: 'ar' | 'fr' = language ? resolveLang(language) : /[\u0600-\u06FF]/.test(userPrompt) ? 'ar' : 'fr';
    const safeUserPrompt = capText(userPrompt, CAPS.instruction);
    const recentMessages = capHistory(messages, CAPS.history, CAPS.historyEach);
    const safeArticle = {
      ...currentArticle,
      title: capText(currentArticle?.title, CAPS.short),
      summary: capText(currentArticle?.summary, CAPS.short),
      contentMarkdown: capText(currentArticle?.contentMarkdown, CAPS.article),
    };

    const prompt = compose(articleSkill, {
      userPrompt: safeUserPrompt,
      history: recentMessages,
      article: safeArticle,
      grade,
      subject,
      chapter,
      isFreeTopic,
      tags,
      lang,
      wrappedPrompt: wrapData('user_instruction', safeUserPrompt, CAPS.instruction),
    });

    const data = await aiGenerateJSON(articleSkill.chain, prompt, articleSkill.schema, articleSkill.temperature);
    res.json({
      success: true,
      assistantMessage: data['assistantMessage'] || 'Voici la mise à jour.',
      updatedArticle: data['updatedArticle'] || currentArticle,
    });
    return;
  } catch (err: unknown) {
    console.error('Error in /api/ai/chat-article:', err);
    const pub = toPublicError(err);
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});

// 7. Illustration Generator
aiRouter.post('/generate-illustration', originGuard, aiRateLimiter, aiDailyGuard, async (req: Request, res: Response): Promise<void> => {
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
    const pub = toPublicError(err, 'Erreur lors de la création de l\'illustration');
    res.status(pub.status).json({ error: pub.message });
    return;
  }
});
