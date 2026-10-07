import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { Request, Response, NextFunction } from 'express';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { registerSources } from './server/knowledge-source';
import { uploadsFolder, docsFolder } from './server/storage';
import { uploadRouter } from './server/routes/upload.routes';
import { docsRouter, memoRouter, SHEET_ID_RE } from './server/routes/docs.routes';
import { aiRouter } from './server/routes/ai.routes';
import { FIRST_GRADE_EXERCISES, FIRST_GRADE_COURSES } from './app/core/data/first-grade-exercises.data';
import { LIBRARY_EXERCISES } from './app/core/data/library-exercises.data';
import { CNP_PRIMARY_COURSES } from './app/core/data/cnp-books.data';
import { SEED_BANK_EXERCISES, SEED_COURSES } from './app/core/data/seed-docs.data';

const browserDistFolder = join(import.meta.dirname, '../browser');

// 0. Pure Google Identity Token Verification
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

// 2. Secure Static Serving of /uploads with CSP and anti-sniffing headers
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    next();
  },
  express.static(uploadsFolder, {
    maxAge: '7d',
    index: false,
    redirect: false,
  }),
);

// 3. Mount Modular API Routers
app.use('/api/upload', uploadRouter);
app.use('/api/docs', docsRouter);
app.use('/api/memo', memoRouter);
app.use('/api/ai', aiRouter);

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
const CRAWLER_UA_RE =
  /facebookexternalhit|facebot|twitterbot|whatsapp|linkedinbot|slackbot|telegrambot|discordbot|pinterest|embedly|redditbot|google-inspectiontool|bingbot/i;

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
  '1ere-annee': '1ère Année',
  '2eme-annee': '2ème Année',
  '3eme-annee': '3ème Année',
  '4eme-annee': '4ème Année',
  '5eme-annee': '5ème Année',
  '6eme-annee': '6ème Année',
};
const BD_SUBJECT_LABELS: Record<string, string> = {
  'arabe': 'اللغة العربية',
  'francais': 'Français',
  'maths': 'Mathématiques',
  'eveil-scientifique': 'Éveil Scientifique',
  'anglais': 'Anglais',
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

  const items = loadBdItems();
  const item = items.find((i) => i.id === itemId);
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

    const title = escapeHtmlAttr(`${item.title || 'Planche pédagogique'} — Madrasati TN`);
    const kw = (item.pedagogy?.keywords || []).slice(0, 6).join(' · ');
    const desc = escapeHtmlAttr(
      kw
        ? `${kw}. Planche de bande dessinée éducative conforme au programme officiel tunisien.`
        : 'Planche de bande dessinée éducative pour le primaire tunisien — Madrasati TN.',
    );
    const imageUrl = escapeHtmlAttr(item.relPath ? `${origin}${item.relPath}` : `${origin}/logo.jpg`);
    const pageUrl = escapeHtmlAttr(`${origin}/discovery?bd=${itemId}`);

    html = html.replace(
      /\s*<meta\s+(?:property="og:(?:title|description|image|url|type)"|name="twitter:(?:card|title|description|image)")[^>]*>/gi,
      '',
    );

    const ogBlock = `
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${pageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${imageUrl}" />`;

    html = html.replace('</head>', `${ogBlock}\n  </head>`);

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Error injecting OG tags for BD item:', err);
    next();
  }
});

// Phase 2 — Social Crawler Dynamic OG Tag Injection for Landing Page
app.get('/', (req: Request, res: Response, next): void => {
  const ua = req.get('user-agent') || '';
  if (!CRAWLER_UA_RE.test(ua)) {
    next();
    return;
  }

  try {
    const indexPath = join(browserDistFolder, 'index.html');
    let html = readFileSync(indexPath, 'utf8');

    const proto = (req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0];
    const host = req.get('x-forwarded-host') || req.get('host') || '';
    const origin = `${proto}://${host}`;

    const title = escapeHtmlAttr('مدرستي تونس — الفضاء التربوي التونسي للدروس والتمارين والامتحانات');
    const description = escapeHtmlAttr(
      'منصة تربوية تونسية مجانية تجمع المعلمين والأولياء: 38 كتاب مدرسي رسمي (CNP)، توليد تمارين وامتحانات A4 قابلة للطباعة بالذكاء الاصطناعي، ومتابعة فورية للواجبات.',
    );
    const imageUrl = escapeHtmlAttr(`${origin}/logo.jpg`);
    const pageUrl = escapeHtmlAttr(`${origin}/`);

    html = html.replace(
      /\s*<meta\s+(?:property="og:(?:title|description|image|url|type)"|name="twitter:(?:card|title|description|image)")[^>]*>/gi,
      '',
    );

    const ogBlock = `
    <meta property="og:type" content="website" />
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
    console.error('Error injecting OG tags for landing page:', err);
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

    const title = escapeHtmlAttr(`${doc.title || "Fiche d'exercices"} — Madrasati TN`);
    const descParts = [doc.grade, doc.subject, doc.topic].filter(Boolean).join(' · ');
    const description = escapeHtmlAttr(
      descParts
        ? `${descParts}. Fiche d'exercices gratuite — Madrasati TN.`
        : "Fiche d'exercices gratuite pour l'école primaire tunisienne — Madrasati TN.",
    );
    const firstImg = (doc.exercises || []).find((e: { imageUrl?: string }) => e.imageUrl)?.imageUrl;
    const imageUrl = escapeHtmlAttr(firstImg ? `${origin}${firstImg}` : `${origin}/logo.jpg`);
    const pageUrl = escapeHtmlAttr(`${origin}/generate?sheet=${sheetId}`);

    html = html.replace(
      /\s*<meta\s+(?:property="og:(?:title|description|image|url|type)"|name="twitter:(?:card|title|description|image)")[^>]*>/gi,
      '',
    );

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
        : "Fiche mémo visuelle interactive pour l'école primaire tunisienne — Madrasati TN.",
    );
    const firstImg =
      doc.thumb ||
      (doc.memoDoc?.blocks || []).find((b: { type?: string; data?: { imageUrl?: string } }) => b?.data?.imageUrl)?.data?.imageUrl;
    const imageUrl = escapeHtmlAttr(firstImg ? `${origin}${firstImg}` : `${origin}/logo.jpg`);
    const pageUrl = escapeHtmlAttr(`${origin}/memo-studio?memo=${memoId}`);

    html = html.replace(
      /\s*<meta\s+(?:property="og:(?:title|description|image|url|type)"|name="twitter:(?:card|title|description|image)")[^>]*>/gi,
      '',
    );

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

// Phase 2 — Dynamic SEO: robots.txt and XML sitemap
app.get('/robots.txt', (req: Request, res: Response) => {
  const host = req.headers.host || 'madrastihub.com';
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Allow: /discovery
Allow: /generate
Allow: /solve
Allow: /summarize
Allow: /memo-studio
Allow: /article-studio
Disallow: /api/
Disallow: /uploads/

Sitemap: ${proto}://${host}/sitemap.xml
`);
});

app.get('/sitemap.xml', (req: Request, res: Response) => {
  const host = req.headers.host || 'madrastihub.com';
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const baseUrl = `${proto}://${host}`;
  const today = new Date().toISOString().split('T')[0];

  const staticRoutes = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/discovery', changefreq: 'daily', priority: '0.9' },
    { loc: '/generate', changefreq: 'weekly', priority: '0.8' },
    { loc: '/memo-studio', changefreq: 'weekly', priority: '0.8' },
    { loc: '/article-studio', changefreq: 'weekly', priority: '0.8' },
    { loc: '/solve', changefreq: 'monthly', priority: '0.7' },
    { loc: '/summarize', changefreq: 'monthly', priority: '0.7' },
  ];

  const allItems = [
    ...FIRST_GRADE_EXERCISES,
    ...FIRST_GRADE_COURSES,
    ...LIBRARY_EXERCISES,
    ...CNP_PRIMARY_COURSES,
    ...SEED_BANK_EXERCISES,
    ...SEED_COURSES,
  ];

  const uniqueGrades = Array.from(new Set(allItems.map((item) => item.grade))).filter(Boolean);
  const uniqueSubjects = Array.from(new Set(allItems.map((item) => item.subject))).filter(Boolean);

  const gradeUrls = uniqueGrades.map((grade) => ({
    loc: `/discovery?grade=${encodeURIComponent(grade)}`,
    changefreq: 'weekly',
    priority: '0.7',
  }));

  const subjectUrls = uniqueSubjects.map((subject) => ({
    loc: `/discovery?subject=${encodeURIComponent(subject)}`,
    changefreq: 'weekly',
    priority: '0.7',
  }));

  const allUrls = [...staticRoutes, ...gradeUrls, ...subjectUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${baseUrl}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  res.type('application/xml');
  res.send(xml);
});

// Phase 2 — Explicit Favicon handler preventing SSR loop for missing assets
app.get('/favicon.ico', (req: Request, res: Response) => {
  const icoPath = join(browserDistFolder, 'favicon.ico');
  if (existsSync(icoPath)) {
    res.sendFile(icoPath);
  } else {
    res.status(204).end();
  }
});

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      console.error('Server failed to start:', error);
      process.exit(1);
    }
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build).
 */
export const reqHandler = createNodeRequestHandler(app);
