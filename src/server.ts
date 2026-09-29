import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { GoogleGenAI } from '@google/genai';

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const browserDistFolder = join(import.meta.dirname, '../browser');
const uploadsFolder = join(process.cwd(), 'uploads');

if (!existsSync(uploadsFolder)) {
  mkdirSync(uploadsFolder, { recursive: true });
}

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(uploadsFolder));

const angularApp = new AngularNodeAppEngine();

// Free VPS Storage: Direct File Upload
app.post('/api/upload', (req, res): void => {
  try {
    const { filename, base64Data, contentType } = req.body;
    if (!base64Data) {
      res.status(400).json({ error: 'Aucun fichier transmis' });
      return;
    }

    const ext = filename?.split('.').pop() || (contentType?.includes('pdf') ? 'pdf' : 'jpg');
    const cleanName = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    const filePath = join(uploadsFolder, cleanName);

    // Strip base64 prefix if present
    const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, '');
    writeFileSync(filePath, Buffer.from(base64Clean, 'base64'));

    res.json({
      success: true,
      url: `/uploads/${cleanName}`,
      filename: cleanName,
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
 * AI Assistant Endpoints for Tunisian Primary Education
 */

// 1. Generate Exercise
app.post('/api/ai/generate-exercise', async (req, res): Promise<void> => {
  try {
    const { grade, subject, topic, difficulty } = req.body;

    if (!ai) {
      res.status(500).json({
        error: 'Clé API Gemini non configurée dans le serveur backend.',
      });
      return;
    }

    const prompt = `Tu es un expert pédagogique tunisien spécialisé dans le programme de l'enseignement primaire (1ère à 6ème année).
Génère un exercice pédagogique de haute qualité adapté pour :
- Niveau: ${grade || '4ème Année'}
- Matière: ${subject || 'Mathématiques'}
- Chapitre/Sujet: ${topic || 'Résolution de problèmes'}
- Difficulté: ${difficulty || 'Moyen'}

Réponds STRICTEMENT au format JSON valide suivant :
{
  "title": "Titre court de l'exercice",
  "promptText": "Texte complet du problème ou de la question avec contexte réaliste (ex: marché, école, ferme en Tunisie)",
  "solutionText": "Correction détaillée étape par étape avec le résultat final",
  "hints": ["Indice 1 pour aider l'élève sans donner la réponse", "Indice 2"],
  "points": 10
}`;

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

// 2. Draft Announcement for Teacher
app.post('/api/ai/draft-announcement', async (req, res): Promise<void> => {
  try {
    const { purpose, details, targetAudience } = req.body;

    if (!ai) {
      res.status(500).json({ error: 'Clé API non disponible' });
      return;
    }

    const prompt = `Rédige une annonce scolaire professionnelle, bienveillante et claire en français pour un enseignant primaire en Tunisie.
Objectif: ${purpose || 'Devoir de synthèse à venir'}
Détails: ${details || 'Réviser la multiplication et la géométrie'}
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
app.post('/api/ai/explain-concept', async (req, res): Promise<void> => {
  try {
    const { concept, grade, subject } = req.body;

    if (!ai) {
      res.status(500).json({ error: 'Clé API non disponible' });
      return;
    }

    const prompt = `Tu es un tuteur pédagogique très encouragant pour un enfant tunisien en ${grade || '4ème année'}.
Explique la notion suivante de façon très simple et captivante :
Matière: ${subject || 'Sciences'}
Notion: ${concept || 'La photosynthèse'}

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

// 4. AI Auto-Tagger for Bulk Uploads
app.post('/api/ai/auto-tag-document', async (req, res): Promise<void> => {
  try {
    const { documentName, rawText } = req.body;

    if (!ai) {
      res.status(500).json({ error: 'Clé API non disponible' });
      return;
    }

    const prompt = `Tu es un système de reconnaissance automatique de documents scolaires pour le primaire tunisien.
Analyse le document suivant (nom de fichier ou extrait de texte) :
Nom/Extrait: "${documentName || ''} - ${rawText || ''}"

Extrais les métadonnées exactes au format JSON suivant :
{
  "suggestedTitle": "Titre propre et bien formaté",
  "grade": "1ère Année" | "2ème Année" | "3ème Année" | "4ème Année" | "5ème Année" | "6ème Année",
  "subject": "Mathématiques" | "Français" | "اللغة العربية" | "Éveil Scientifique" | "Histoire & Géographie" | "Anglais",
  "trimester": "Trimestre 1" | "Trimestre 2" | "Trimestre 3",
  "docType": "Devoir de Contrôle" | "Devoir de Synthèse" | "Fiche de Révision" | "Série d'Exercices",
  "hasCorrection": true ou false,
  "summary": "Brève description du contenu"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);

    res.json({ success: true, tags: data });
    return;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de l\'auto-tagging';
    console.error('Error in /api/ai/auto-tag-document:', err);
    res.status(500).json({ error: message });
    return;
  }
});

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
