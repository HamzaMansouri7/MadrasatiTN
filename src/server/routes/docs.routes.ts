import { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { originGuard, uploadRateLimiter } from '../guards';
import { docsFolder, verifyFirebaseUser } from '../storage';
import { generateMemoDocx } from '../memo-docx';

export const SHEET_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
export const docsIndexPath = join(docsFolder, 'index.json');

export function readDocsIndex(): Record<string, unknown>[] {
  if (!existsSync(docsIndexPath)) return [];
  try {
    const arr = JSON.parse(readFileSync(docsIndexPath, 'utf8'));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export const docsRouter = Router();
export const memoRouter = Router();

// Word (.docx) export for visual memo
memoRouter.post('/export-docx', originGuard, uploadRateLimiter, async (req: Request, res: Response): Promise<void> => {
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

// Save a published sheet or memo
docsRouter.post('/', originGuard, async (req: Request, res: Response): Promise<void> => {
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

    if (docType === 'lesson-plan' || req.body.lessonPlanDoc) {
      const lp = req.body.lessonPlanDoc || req.body;
      const docGrade = (lp.grade || grade || '').toString().slice(0, 40);
      const docSubject = (lp.subject || subject || '').toString().slice(0, 40);
      const docTitle = (lp.title || topic || 'جذاذة بيداغوجية').toString().slice(0, 200);

      const id = randomUUID();
      const doc = {
        ownerUid,
        id,
        docType: 'lesson-plan',
        title: docTitle,
        grade: docGrade,
        subject: docSubject,
        values: lp.values || lp,
        author: {
          name: (authorName || 'المعلم').toString().slice(0, 100),
          school: (school || 'المدرسة الابتدائية التونسية').toString().slice(0, 150),
        },
        createdAt: new Date().toISOString(),
      };
      writeFileSync(join(docsFolder, `${id}.json`), JSON.stringify(doc), 'utf8');

      const index = readDocsIndex();
      index.unshift({
        id,
        docType: 'lesson-plan',
        title: doc.title,
        grade: doc.grade,
        subject: doc.subject,
        authorName: doc.author.name,
        school: doc.author.school,
        createdAt: doc.createdAt,
      });
      writeFileSync(docsIndexPath, JSON.stringify(index.slice(0, 500)), 'utf8');

      res.json({ success: true, id, shareUrl: `/lesson-plan/${id}` });
      return;
    }

    if (docType === 'series' || req.body.seriesDoc) {
      const s = req.body.seriesDoc || req.body;
      const docGrade = (s.grade || grade || '').toString().slice(0, 40);
      const docSubject = (s.subject || subject || '').toString().slice(0, 40);
      const docTitle = (s.title || topic || 'سلسلة مصورة').toString().slice(0, 200);

      const id = randomUUID();
      const doc = {
        ownerUid,
        id,
        docType: 'series',
        title: docTitle,
        grade: docGrade,
        subject: docSubject,
        bible: s.bible,
        scenes: s.scenes || [],
        author: {
          name: (authorName || 'المعلم').toString().slice(0, 100),
          school: (school || 'المدرسة الابتدائية التونسية').toString().slice(0, 150),
        },
        createdAt: new Date().toISOString(),
      };
      writeFileSync(join(docsFolder, `${id}.json`), JSON.stringify(doc), 'utf8');

      const index = readDocsIndex();
      index.unshift({
        id,
        docType: 'series',
        title: doc.title,
        grade: doc.grade,
        subject: doc.subject,
        sceneCount: (doc.scenes || []).length,
        authorName: doc.author.name,
        createdAt: doc.createdAt,
      });
      writeFileSync(docsIndexPath, JSON.stringify(index.slice(0, 500)), 'utf8');

      res.json({ success: true, id, shareUrl: `/series/${id}` });
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
docsRouter.get('/', (_req: Request, res: Response): void => {
  res.json({ success: true, docs: readDocsIndex() });
});

docsRouter.get('/:id', (req: Request, res: Response): void => {
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
