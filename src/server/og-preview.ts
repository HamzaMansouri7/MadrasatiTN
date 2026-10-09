import { Request, Response, NextFunction } from 'express';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { docsFolder } from './storage';
import { chapterById } from '../app/core/utils/curriculum.util';
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
        return Array.isArray(m.items)
          ? (m.items as BdManifestItem[]).filter((item) => item.topic === 'bandes-dessinees')
          : [];
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

const ARABIC_RE = /[؀-ۿ]/;

/** Title carries level · subject · trimester (FB large-image cards hide og:description). */
function buildDocOg(
  rawTitle: string,
  parts: { grade?: string; subject?: string; trimester?: string; docType?: string; topic?: string },
  extra?: string,
): { title: string; description: string } {
  const isAr = ARABIC_RE.test(rawTitle);
  const trim = parts.trimester && /^\d$/.test(String(parts.trimester).trim())
    ? (isAr ? `الثلاثي ${parts.trimester}` : `Trimestre ${parts.trimester}`)
    : parts.trimester;
  const meta = [parts.grade, parts.subject, trim].filter(Boolean) as string[];
  const title = meta.length ? `${rawTitle} — ${meta.join(' · ')}` : `${rawTitle} — Madrasati TN`;
  const detail = [...meta, parts.docType, parts.topic].filter(Boolean).join(' · ');
  const tail = isAr
    ? 'مجاني على مدرستي تونس · مطابق للبرنامج الرسمي (CNP) · جاهز للطباعة A4'
    : 'Gratuit sur Madrasati TN · conforme au programme officiel (CNP) · prêt à imprimer A4';
  const description = [detail ? `🎓 ${detail}` : '', extra?.trim() ? extra.trim().slice(0, 160) : '', tail]
    .filter(Boolean)
    .join('\n');
  return { title, description };
}

export interface BlogOg {
  title: string;
  excerpt: string;
  coverImage?: string;
  authorName?: string;
}

const blogOgCache = new Map<string, { at: number; value: BlogOg | null }>();
const BLOG_OG_TTL_MS = 10 * 60 * 1000;

/** Reads one public blog post (Firestore rules allow public read) over REST for the share card. */
export async function fetchBlogOg(id: string): Promise<BlogOg | null> {
  if (!SHEET_ID_RE.test(id)) return null;
  const hit = blogOgCache.get(id);
  if (hit && Date.now() - hit.at < BLOG_OG_TTL_MS) return hit.value;
  let value: BlogOg | null = null;
  try {
    const cfg = JSON.parse(readFileSync(join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
    const url = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${cfg.firestoreDatabaseId || '(default)'}/documents/blog_posts/${encodeURIComponent(id)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const f = ((await res.json()) as { fields?: Record<string, { stringValue?: string }> }).fields ?? {};
      const str = (k: string) => f[k]?.stringValue?.trim() || '';
      const title = str('titleAr') || str('title');
      if (title) {
        value = {
          title,
          excerpt: str('excerptAr') || str('excerpt'),
          coverImage: str('coverImage') || undefined,
          authorName: str('authorName') || undefined,
        };
      }
    }
  } catch {
    value = null;
  }
  blogOgCache.set(id, { at: Date.now(), value });
  return value;
}

/** Resolves metadata and image for any shared entity on Madrasati TN */
export function resolveOgPayload(
  req: Request,
  browserDistFolder: string,
  blog: BlogOg | null = null,
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
        const { title, description } = buildDocOg(
          fileDoc.title || fileDoc.memoDoc?.title || 'Document Pédagogique',
          {
            grade: fileDoc.grade || fileDoc.memoDoc?.grade,
            subject: fileDoc.subject || fileDoc.memoDoc?.subject,
            trimester: fileDoc.trimester,
            topic: fileDoc.topic || fileDoc.memoDoc?.topic,
          },
        );

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
      const { title, description: desc } = buildDocOg(
        ex.title,
        { grade: ex.grade, subject: ex.subject, trimester: ex.trimester, docType: ex.docType },
        ex.promptText,
      );
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
      const { title, description: desc } = buildDocOg(
        c.title,
        { grade: c.grade, subject: c.subject, trimester: c.trimester, docType: c.docType },
        c.summary,
      );
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
      const kw = (item.pedagogy?.keywords || []).slice(0, 6).join(' · ');
      const gradeNum = (item.grade || '').match(/[1-6]/)?.[0];
      const gradeLabel = gradeNum ? `${gradeNum}${gradeNum === '1' ? 'ère' : 'ème'} Année` : item.grade;
      const subjectLabel = item.subject === 'francais' ? 'Français' : item.subject === 'arabe' ? 'العربية' : item.subject || 'Expression orale';
      const { title, description: desc } = buildDocOg(
        item.title || 'Planche pédagogique',
        {
          grade: gradeLabel,
          subject: subjectLabel,
          trimester: item.trimester ? String(item.trimester) : undefined,
          docType: 'Bande dessinée',
        },
        kw,
      );
      const imageUrl = item.relPath ? `${origin}/${item.relPath.replace(/^\//, '')}` : `${origin}/facebook_cover.jpg`;
      const pageUrl = `${origin}/discovery?bd=${encodeURIComponent(queryBd)}`;
      return { title, description: desc, imageUrl, pageUrl, type: 'article' };
    }
  }

  // F. Blog Posts (?blog=... / ?article=...)
  if (queryBlog) {
    const title = blog ? `${blog.title} — Madrasati TN` : 'المقالات والنصائح التربوية — Madrasati TN';
    const lines = blog ? [blog.authorName ? `✍️ ${blog.authorName}` : '', blog.excerpt.slice(0, 200)].filter(Boolean) : [];
    const desc = lines.length ? lines.join('\n') : 'مقالات بيداغوجية وإرشادات تعليمية للمعلمين والأولياء في تونس.';
    const cover = blog?.coverImage;
    const imageUrl = cover
      ? (cover.startsWith('http') ? cover : `${origin}${cover.startsWith('/') ? '' : '/'}${cover}`)
      : `${origin}/facebook_cover.jpg`;
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
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      const blogId = (req.query['blog'] as string) || (req.query['article'] as string) || '';
      const blog = blogId ? await fetchBlogOg(blogId) : null;
      const payload = resolveOgPayload(req, browserDistFolder, blog);
      const renderedHtml = renderOgHtml(html, payload);

      res.set('Content-Type', 'text/html; charset=utf-8');
      res.send(renderedHtml);
    } catch (err) {
      console.error('Error handling crawler OG preview:', err);
      next();
    }
  };
}
