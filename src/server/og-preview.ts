import { Request, Response, NextFunction } from 'express';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { docsFolder } from './storage';
import { chapterById, chapterTitle } from '../app/core/utils/curriculum.util';
import { FIRST_GRADE_EXERCISES, FIRST_GRADE_COURSES } from '../app/core/data/first-grade-exercises.data';
import { LIBRARY_EXERCISES } from '../app/core/data/library-exercises.data';
import { CNP_PRIMARY_COURSES } from '../app/core/data/cnp-books.data';
import { SEED_BANK_EXERCISES, SEED_COURSES } from '../app/core/data/seed-docs.data';
import { Course, ExerciseItem } from '../app/core/models/education.model';

export const CRAWLER_UA_RE =
  /facebookexternalhit|facebot|twitterbot|whatsapp|linkedinbot|slackbot|telegrambot|discordbot|pinterest|embedly|redditbot|google-inspectiontool|bingbot/i;

export const SHEET_ID_RE = /^[A-Za-z0-9_-]{4,80}$/;

export interface BdManifestItem {
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

export function loadBdItems(browserDistFolder: string): BdManifestItem[] {
  if (bdItemsCache) return bdItemsCache;
  try {
    const idxPath = join(browserDistFolder, 'assets/resources/index.json');
    if (!existsSync(idxPath)) {
      bdItemsCache = [];
      return bdItemsCache;
    }
    const idx = JSON.parse(readFileSync(idxPath, 'utf8'));
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

export function escapeHtmlAttr(value: string): string {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export interface OgMetaPayload {
  title: string;
  description: string;
  imageUrl: string;
  pageUrl: string;
  type?: 'website' | 'article' | 'profile';
}

export function renderOgHtml(html: string, payload: OgMetaPayload): string {
  const cleanHtml = html.replace(
    /\s*<meta\s+(?:property="og:(?:title|description|image|url|type)"|name="twitter:(?:card|title|description|image)")[^>]*>/gi,
    '',
  );

  const title = escapeHtmlAttr(payload.title);
  const desc = escapeHtmlAttr(payload.description);
  const image = escapeHtmlAttr(payload.imageUrl);
  const url = escapeHtmlAttr(payload.pageUrl);
  const type = escapeHtmlAttr(payload.type || 'website');

  const ogBlock = `
    <meta property="og:type" content="${type}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${url}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${image}" />`;

  return cleanHtml.replace('</head>', `${ogBlock}\n  </head>`);
}

/** Resolves metadata and image for any shared entity on Madrasati TN */
export function resolveOgPayload(
  req: Request,
  browserDistFolder: string,
): OgMetaPayload {
  const proto = (req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0];
  const host = req.get('x-forwarded-host') || req.get('host') || 'madrastihub.com';
  const origin = `${proto}://${host}`;

  const queryDoc = (req.query['doc'] as string) || (req.query['sheet'] as string) || (req.query['memo'] as string) || '';
  const queryTopic = (req.query['topicId'] as string) || '';
  const queryBd = (req.query['bd'] as string) || '';
  const queryBlog = (req.query['blog'] as string) || (req.query['article'] as string) || '';

  // 1. Direct path matches like /lesson-plan/:id, /infographic/:id, /series/:id, /teachers/:id
  const pathParts = req.path.split('/').filter(Boolean);
  const directType = pathParts[0];
  const directId = pathParts[1] || '';

  const docId = queryDoc || (['lesson-plan', 'infographic', 'series'].includes(directType) ? directId : '');

  // A. Check Persisted Disk Documents (/docs/${id}.json)
  if (docId && SHEET_ID_RE.test(docId)) {
    const docPath = join(docsFolder, `${docId}.json`);
    if (existsSync(docPath)) {
      try {
        const fileDoc = JSON.parse(readFileSync(docPath, 'utf8'));
        const title = `${fileDoc.title || fileDoc.memoDoc?.title || "Document Pédagogique"} — Madrasati TN`;
        const metaParts = [fileDoc.grade, fileDoc.subject, fileDoc.topic || fileDoc.memoDoc?.topic].filter(Boolean).join(' · ');
        const description = metaParts
          ? `${metaParts}. Ressource éducative conforme au programme officiel tunisien.`
          : 'Ressource éducative gratuite — Madrasati TN.';
        
        let img = fileDoc.thumb;
        if (!img && fileDoc.memoDoc?.blocks) {
          img = fileDoc.memoDoc.blocks.find((b: { type?: string; data?: { imageUrl?: string } }) => b?.data?.imageUrl)?.data?.imageUrl;
        }
        if (!img && Array.isArray(fileDoc.exercises)) {
          img = fileDoc.exercises.find((e: { imageUrl?: string }) => e.imageUrl)?.imageUrl;
        }
        if (!img && fileDoc.values) {
          const v = fileDoc.values;
          img = v.hero?.imageUrl || v.problem?.imageUrl;
        }

        const imageUrl = img ? (img.startsWith('http') ? img : `${origin}${img.startsWith('/') ? '' : '/'}${img}`) : `${origin}/facebook_cover.jpg`;
        const pageUrl = `${origin}/discovery?doc=${docId}`;

        return { title, description, imageUrl, pageUrl, type: 'article' };
      } catch {
        // Fallback to static lookup
      }
    }
  }

  // B. Check Static Exercise Bank
  if (docId) {
    const allExercises: ExerciseItem[] = [
      ...FIRST_GRADE_EXERCISES,
      ...SEED_BANK_EXERCISES,
    ];
    const ex = allExercises.find((e) => e.id === docId);
    if (ex) {
      const title = `${ex.title} — Madrasati TN`;
      const meta = [ex.grade, ex.subject, ex.trimester, ex.docType].filter(Boolean).join(' · ');
      const desc = `${meta}. ${ex.promptText?.slice(0, 160) || 'Exercice certifié pour le primaire tunisien.'}`;
      let img = ex.photoUrl;
      if (!img && ex.topicId) {
        const thumbFile = join(browserDistFolder, `assets/thumbs/curriculum/${ex.topicId}.webp`);
        if (existsSync(thumbFile)) img = `/assets/thumbs/curriculum/${ex.topicId}.webp`;
      }
      const imageUrl = img ? (img.startsWith('http') ? img : `${origin}${img.startsWith('/') ? '' : '/'}${img}`) : `${origin}/facebook_cover.jpg`;
      const pageUrl = `${origin}/discovery?doc=${docId}`;
      return { title, description: desc, imageUrl, pageUrl, type: 'article' };
    }

    // C. Check Static Courses Bank & CNP Books
    const allCourses: Course[] = [
      ...FIRST_GRADE_COURSES,
      ...CNP_PRIMARY_COURSES,
      ...LIBRARY_EXERCISES,
      ...SEED_COURSES,
    ];
    const c = allCourses.find((item) => item.id === docId);
    if (c) {
      const title = `${c.title} — Madrasati TN`;
      const meta = [c.grade, c.subject, c.trimester, c.docType].filter(Boolean).join(' · ');
      const desc = `${meta}. ${c.summary || c.title}`;
      let img = c.imageUrls?.[0];
      if (!img && c.topicId) {
        const thumbFile = join(browserDistFolder, `assets/thumbs/curriculum/${c.topicId}.webp`);
        if (existsSync(thumbFile)) img = `/assets/thumbs/curriculum/${c.topicId}.webp`;
      }
      const imageUrl = img ? (img.startsWith('http') ? img : `${origin}${img.startsWith('/') ? '' : '/'}${img}`) : `${origin}/facebook_cover.jpg`;
      const pageUrl = `${origin}/discovery?doc=${docId}`;
      return { title, description: desc, imageUrl, pageUrl, type: 'article' };
    }
  }

  // D. Curriculum Chapters (?topicId=...)
  if (queryTopic) {
    const chapter = chapterById(queryTopic);
    if (chapter) {
      const title = `${chapter.titleAr} (${chapter.titleFr}) — Madrasati TN`;
      const meta = [chapter.grade, chapter.subject, chapter.trimester].filter(Boolean).join(' · ');
      const desc = `${meta}. ${chapter.keyCompetencyAr || chapter.keyCompetencyFr || 'البرنامج البيداغوجي الرسمي التونسي'}`;
      
      // Serve Arabic and Éveil generated thumbnails if available
      let img = `/assets/thumbs/curriculum/${chapter.id}.webp`;
      const thumbFile = join(browserDistFolder, `assets/thumbs/curriculum/${chapter.id}.webp`);
      if (!existsSync(thumbFile)) {
        img = '/facebook_cover.jpg';
      }
      const imageUrl = `${origin}${img}`;
      const pageUrl = `${origin}/discovery?topicId=${encodeURIComponent(queryTopic)}`;
      return { title, description: desc, imageUrl, pageUrl, type: 'article' };
    }
  }

  // E. Bande Dessinée / Comics (?bd=...)
  if (queryBd && SHEET_ID_RE.test(queryBd)) {
    const bdItems = loadBdItems(browserDistFolder);
    const item = bdItems.find((b) => b.id === queryBd);
    if (item) {
      const title = `${item.title || 'Planche pédagogique'} — Madrasati TN`;
      const kw = (item.pedagogy?.keywords || []).slice(0, 6).join(' · ');
      const desc = kw
        ? `${kw}. Planche de bande dessinée éducative conforme au programme officiel tunisien.`
        : 'Planche de bande dessinée éducative pour le primaire tunisien — Madrasati TN.';
      const imageUrl = item.relPath ? `${origin}/${item.relPath.replace(/^\//, '')}` : `${origin}/facebook_cover.jpg`;
      const pageUrl = `${origin}/discovery?bd=${encodeURIComponent(queryBd)}`;
      return { title, description: desc, imageUrl, pageUrl, type: 'article' };
    }
  }

  // F. Blog Posts (?blog=... / ?article=...)
  if (queryBlog) {
    const title = 'المقالات والنصائح التربوية — Madrasati TN';
    const desc = 'مقالات بيداغوجية وإرشادات تعليمية للمعلمين والأولياء في تونس.';
    const imageUrl = `${origin}/facebook_cover.jpg`;
    const pageUrl = `${origin}/discovery?blog=${encodeURIComponent(queryBlog)}`;
    return { title, description: desc, imageUrl, pageUrl, type: 'article' };
  }

  // G. Teacher Profile (/teachers/:id)
  if (directType === 'teachers' && directId) {
    const title = `الملف البيداغوجي للمعلم — Madrasati TN`;
    const desc = `استكشف الدروس والتمارين والامتحانات المنشورة على منصة مدرستي تونس.`;
    const imageUrl = `${origin}/facebook_cover.jpg`;
    const pageUrl = `${origin}/teachers/${encodeURIComponent(directId)}`;
    return { title, description: desc, imageUrl, pageUrl, type: 'profile' };
  }

  // H. Default Landing Page
  return {
    title: 'مدرستي تونس — الفضاء التربوي التونسي للدروس والتمارين والامتحانات',
    description: 'منصة تربوية تونسية مجانية تجمع المعلمين والأولياء: 38 كتاب مدرسي رسمي (CNP)، توليد تمارين وامتحانات A4 قابلة للطباعة بالذكاء الاصطناعي، ومتابعة فورية للواجبات.',
    imageUrl: `${origin}/facebook_cover.jpg`,
    pageUrl: `${origin}/`,
    type: 'website',
  };
}

/** Unified Express Middleware to serve OpenGraph preview cards to social bots */
export function createOgPreviewMiddleware(browserDistFolder: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ua = req.get('user-agent') || '';
    if (!CRAWLER_UA_RE.test(ua)) {
      next();
      return;
    }

    try {
      const indexPath = join(browserDistFolder, 'index.html');
      if (!existsSync(indexPath)) {
        next();
        return;
      }

      const html = readFileSync(indexPath, 'utf8');
      const payload = resolveOgPayload(req, browserDistFolder);
      const renderedHtml = renderOgHtml(html, payload);

      res.set('Content-Type', 'text/html; charset=utf-8');
      res.send(renderedHtml);
    } catch (err) {
      console.error('Error handling crawler OG preview:', err);
      next();
    }
  };
}
