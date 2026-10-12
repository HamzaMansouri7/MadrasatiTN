import express, { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { join } from 'node:path';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { uploadsFolder } from '../storage';

/**
 * Parascolaire module (read-only, public).
 * Files and catalog.json are produced by parascolaire/tools/publish_catalog.py and uploaded by the owner
 * to <UPLOAD_DIR>/parascolaire/. See docs/PARASCOLAIRE-MODULE-SPEC.md section 6.
 */
export const parascolaireFolder = join(uploadsFolder, 'parascolaire');

/** Static files under /media/parascolaire. Hashed names, so one year immutable. Not sandboxed (PDFs must open). */
export const parascolaireMedia: RequestHandler[] = [
  (req: Request, res: Response, next: NextFunction) => {
    // catalog.json is served by the API with revalidation, never from the immutable static path.
    if (req.path === '/catalog.json') {
      res.status(404).end();
      return;
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  },
  express.static(parascolaireFolder, {
    index: false,
    redirect: false,
    dotfiles: 'deny',
    maxAge: '365d',
    immutable: true,
  }),
];

let cache: { key: string; body: string; json: unknown } | null = null;

function readCatalog(): { key: string; body: string; json: unknown } | null {
  const file = join(parascolaireFolder, 'catalog.json');
  if (!existsSync(file)) return null;
  const st = statSync(file);
  const key = `${st.mtimeMs}-${st.size}`;
  if (!cache || cache.key !== key) {
    const body = readFileSync(file, 'utf-8');
    cache = { key, body, json: JSON.parse(body) };
  }
  return cache;
}

interface OgTheme {
  title: string;
  subject: string;
  slots: { infographic: { status: string; full?: string }; course: { status: string; pages?: string[] } };
}
interface OgBook {
  id: string;
  title: string;
  themes: (OgTheme & { id: string })[];
}

/** Share card (Open Graph) for /parascolaire/:classe/:livre/:theme, or null when the theme is unknown. */
export function parascolaireOg(
  origin: string,
  classe: string,
  livre: string,
  themeId: string,
): { title: string; description: string; imageUrl: string; pageUrl: string } | null {
  try {
    const cat = readCatalog()?.json as { books: OgBook[] } | undefined;
    const book = cat?.books.find((b) => b.id === `${classe}/${livre}`);
    const theme = book?.themes.find((t) => t.id === themeId);
    if (!book || !theme) return null;
    const img =
      theme.slots.infographic.status === 'ready' && theme.slots.infographic.full
        ? theme.slots.infographic.full
        : theme.slots.course.status === 'ready' && theme.slots.course.pages?.length
          ? theme.slots.course.pages[0]
          : null;
    return {
      title: `${theme.title} — ${book.title} · Madrasati TN`,
      description: `🎓 ${theme.subject}
إنفوغرافيك ودرس مصوّر مجانيان على مدرستي تونس · Infographie et cours en diaporama, gratuits`,
      imageUrl: img ? `${origin}/media/parascolaire/${img}` : `${origin}/facebook_cover.jpg`,
      pageUrl: `${origin}/parascolaire/${classe}/${livre}/${themeId}`,
    };
  } catch {
    return null;
  }
}

export const parascolaireApi = Router();

/** GET /api/parascolaire/catalog: the catalog written last by the publish tool. */
parascolaireApi.get('/catalog', (req: Request, res: Response) => {
  try {
    const c = readCatalog();
    if (!c) {
      res.status(404).json({ error: 'catalog_unavailable' });
      return;
    }
    const key = c.key;
    const etag = `"${key}"`;
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'no-cache');
    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }
    res.type('application/json').send(c.body);
  } catch {
    res.status(500).json({ error: 'catalog_unreadable' });
  }
});
