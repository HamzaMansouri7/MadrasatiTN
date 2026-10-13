import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bookTitle, themeTitle } from '../src/app/features/parascolaire/parascolaire.logic';
import type { ParascolaireCatalog } from '../src/app/features/parascolaire/parascolaire.models';

/**
 * Madrasati TN: posts the course slides of a theme as ONE multi-photo Facebook post (swipeable).
 * Flow: upload each slide unpublished (/{page}/photos), then one /{page}/feed with attached_media.
 *
 * Usage:
 *   npx tsx scripts/fb-post-course-album.ts --list
 *   npx tsx scripts/fb-post-course-album.ts --dry-run [--only <themeId>]
 *   npx tsx scripts/fb-post-course-album.ts --only <themeId>      (live, one theme)
 *
 * Max 10 slides per post (Facebook's practical album limit for a feed post is higher, 10 keeps it readable).
 * Dedupe: parascolaire/outputs/fb-course-albums-posted.json. Reads FB_PAGE_ID / FB_PAGE_TOKEN from .env, never prints them.
 */

const ROOT = process.cwd();
const BASE = process.env['PUBLIC_BASE_URL'] || 'https://madrastihub.com';
const TRACKER = join(ROOT, 'parascolaire', 'outputs', 'fb-course-albums-posted.json');
const MAX_SLIDES = 10;

const CLASS_AR: Record<string, string> = {
  '1ere-annee': 'السنة الأولى',
  '2eme-annee': 'السنة الثانية',
  '3eme-annee': 'السنة الثالثة',
  '4eme-annee': 'السنة الرابعة',
  '5eme-annee': 'السنة الخامسة',
  '6eme-annee': 'السنة السادسة',
};

interface Album {
  id: string;
  caption: string;
  files: string[];
  link: string;
}

function loadEnv(): void {
  const p = join(ROOT, '.env');
  if (existsSync(p)) process.loadEnvFile(p);
}

function buildAlbums(): Album[] {
  const catalog = JSON.parse(readFileSync(join(ROOT, 'parascolaire', 'publish', 'catalog.json'), 'utf8')) as ParascolaireCatalog;
  const albums: Album[] = [];
  for (const b of catalog.books) {
    for (const t of b.themes) {
      const pages = t.slots.course.status === 'ready' ? (t.slots.course.pages ?? []) : [];
      if (pages.length === 0) continue;
      const cls = CLASS_AR[b.classe] ?? b.classe;
      const link = `${BASE}/parascolaire/${b.id}/${t.id}`;
      const caption = `${themeTitle(t, true)} — درس في شرائح، ${cls} ابتدائي

اسحبوا لرؤية كل الشرائح، واقرؤوها مع طفلكم.
الدرس كاملًا مع نسخة PDF للتنزيل، مجانًا ودون تسجيل:
${link}

#مدرستي_تونس #${cls.replace(/ /g, '_')}_ابتدائي #الدعم_المدرسي`;
      albums.push({
        id: `${b.id}/${t.id}`,
        caption,
        files: pages.slice(0, MAX_SLIDES).map((p) => join(ROOT, 'parascolaire', 'publish', p)),
        link,
      });
    }
  }
  return albums;
}

function readTracker(): Record<string, { fbPostId: string; postedAt: string }> {
  try {
    return JSON.parse(readFileSync(TRACKER, 'utf8'));
  } catch {
    return {};
  }
}

async function graph(path: string, form: FormData): Promise<{ id?: string; post_id?: string } | null> {
  const version = process.env['FB_GRAPH_VERSION'] || 'v21.0';
  const res = await fetch(`https://graph.facebook.com/${version}/${path}`, { method: 'POST', body: form });
  if (!res.ok) {
    console.error(`Facebook API error: HTTP ${res.status} on ${path.split('/').pop()}`);
    return null;
  }
  return (await res.json()) as { id?: string; post_id?: string };
}

async function postAlbum(a: Album): Promise<string | null> {
  const pageId = process.env['FB_PAGE_ID'];
  const token = process.env['FB_PAGE_TOKEN'];
  if (!pageId || !token) {
    console.error('FB_PAGE_ID or FB_PAGE_TOKEN missing from environment.');
    return null;
  }
  const mediaIds: string[] = [];
  for (const f of a.files) {
    const form = new FormData();
    form.append('access_token', token);
    form.append('published', 'false');
    form.append('source', new Blob([readFileSync(f)], { type: 'image/webp' }), 'slide.webp');
    const r = await graph(`${pageId}/photos`, form);
    if (!r?.id) return null;
    mediaIds.push(r.id);
    await new Promise((res) => setTimeout(res, 1000));
  }
  const feed = new FormData();
  feed.append('access_token', token);
  feed.append('message', a.caption);
  mediaIds.forEach((id, i) => feed.append(`attached_media[${i}]`, JSON.stringify({ media_fbid: id })));
  const r = await graph(`${pageId}/feed`, feed);
  return r?.id ?? null;
}

async function main(): Promise<void> {
  loadEnv();
  const args = process.argv.slice(2);
  const dry = args.includes('--dry-run');
  const list = args.includes('--list');
  const i = args.indexOf('--only');
  const only = i !== -1 ? args[i + 1] : null;

  const tracker = readTracker();
  let albums = buildAlbums();
  if (only) albums = albums.filter((a) => a.id.endsWith('/' + only) || a.id === only);

  if (list) {
    for (const a of albums) console.log(`${tracker[a.id] ? '[POSTED]' : '[PENDING]'} ${a.id} (${a.files.length} slides)`);
    return;
  }
  for (const a of albums) {
    if (tracker[a.id] && !dry) {
      console.log(`[SKIP] ${a.id} already posted`);
      continue;
    }
    if (dry) {
      console.log(`\n[DRY RUN] ${a.id}\nSlides: ${a.files.length} (all exist: ${a.files.every(existsSync)})\n${a.caption}\n`);
      continue;
    }
    const id = await postAlbum(a);
    if (id) {
      tracker[a.id] = { fbPostId: id, postedAt: new Date().toISOString() };
      writeFileSync(TRACKER, JSON.stringify(tracker, null, 2), 'utf8');
      console.log(`Posted ${a.id}: ${id}`);
      await new Promise((r) => setTimeout(r, 2500));
    }
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
