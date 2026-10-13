import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Madrasati TN — Facebook Post Dispatcher for Parascolaire
 *
 * SINGLE SOURCE OF TRUTH: parascolaire/FB-POSTS-FINAL.md (every Page post lives there, nowhere else).
 * Per post, by number of images:
 *   0 images -> text post (/{page-id}/feed)
 *   1 image  -> photo post (/{page-id}/photos, caption)
 *   2+ images -> one multi-photo post (unpublished photos, then /{page-id}/feed with attached_media)
 * Dedupe: Records posted items in parascolaire/outputs/fb-parascolaire-posted.json
 *
 * Usage:
 *   npx tsx scripts/fb-post-parascolaire.ts --dry-run
 *   npx tsx scripts/fb-post-parascolaire.ts --dry-run --only 0
 *   npx tsx scripts/fb-post-parascolaire.ts --list
 *   npx tsx scripts/fb-post-parascolaire.ts --only 0
 */

export interface ParascolairePost {
  index: number;
  header: string;
  id: string;
  themeId: string;
  subject: string;
  plannedDate: string;
  images: { rel: string; full: string }[];
  link: string;
  text: string;
}

export interface PostedRecord {
  id: string;
  fbPostId: string;
  postedAt: string;
  link: string;
}

const ROOT_DIR = process.cwd();
const FINAL_MD_PATH = join(ROOT_DIR, 'parascolaire', 'FB-POSTS-FINAL.md');
const POSTED_TRACKER_PATH = join(ROOT_DIR, 'parascolaire', 'outputs', 'fb-parascolaire-posted.json');

function loadEnv(): void {
  const envPath = join(ROOT_DIR, '.env');
  if (existsSync(envPath)) {
    try {
      // Node 20+ built-in env loader
      if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile(envPath);
      } else {
        const raw = readFileSync(envPath, 'utf8');
        for (const line of raw.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) process.env[key] = val;
          }
        }
      }
    } catch {
      /* ignore */
    }
  }
}

export function parseFinalPosts(mdPath: string = FINAL_MD_PATH): ParascolairePost[] {
  if (!existsSync(mdPath)) {
    throw new Error(`File not found: ${mdPath}`);
  }
  const content = readFileSync(mdPath, 'utf8');
  const sections = content.split(/\n(?=### Post \d+)/);
  const posts: ParascolairePost[] = [];

  for (const sec of sections) {
    const headerMatch = sec.match(/^### Post (\d+)\s*—\s*([^\n]+)/m);
    if (!headerMatch) continue;

    const index = parseInt(headerMatch[1], 10);
    const header = headerMatch[2].trim();

    const idMatch = sec.match(/- \*\*ID:\*\*\s*`([^`]+)`/);
    const themeMatch = sec.match(/- \*\*Theme ID:\*\*\s*`([^`]+)`/);
    const subjectMatch = sec.match(/- \*\*Subject:\*\*\s*([^\n]+)/);
    const dateMatch = sec.match(/- \*\*Planned Date:\*\*\s*([^\n]+)/);
    const imageMatch = sec.match(/- \*\*Image:\*\*\s*`([^`]+)`/);
    const imagesBlock = sec.match(/- \*\*Images:\*\*\r?\n((?:\s+- `[^`]+`\r?\n?)+)/);
    const linkMatch = sec.match(/- \*\*Link:\*\*\s*`([^`]+)`/);
    const textMatch = sec.match(/- \*\*Text:\*\*\r?\n([\s\S]+?)(?=\r?\n---\r?\n|$)/);

    const rels = imagesBlock
      ? [...imagesBlock[1].matchAll(/`([^`]+)`/g)].map((m) => m[1].trim())
      : imageMatch
        ? [imageMatch[1].trim()]
        : [];
    const images = rels.map((rel) => ({ rel, full: resolve(ROOT_DIR, rel) }));

    posts.push({
      index,
      header,
      id: idMatch ? idMatch[1].trim() : `post-${index}`,
      themeId: themeMatch ? themeMatch[1].trim() : '',
      subject: subjectMatch ? subjectMatch[1].trim() : '',
      plannedDate: dateMatch ? dateMatch[1].trim() : '',
      images,
      link: linkMatch ? linkMatch[1].trim() : '',
      text: textMatch ? textMatch[1].trim() : '',
    });
  }

  posts.sort((a, b) => a.index - b.index);
  return posts;
}

export function readPostedTracker(): Record<string, PostedRecord> {
  if (!existsSync(POSTED_TRACKER_PATH)) return {};
  try {
    return JSON.parse(readFileSync(POSTED_TRACKER_PATH, 'utf8'));
  } catch {
    return {};
  }
}

export function savePostedTracker(records: Record<string, PostedRecord>): void {
  try {
    writeFileSync(POSTED_TRACKER_PATH, JSON.stringify(records, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save fb-parascolaire-posted.json:', err);
  }
}

async function postToFacebookPhotos(p: ParascolairePost, dryRun: boolean): Promise<string | null> {
  if (dryRun) {
    console.log(`\n======================================================`);
    console.log(`[DRY RUN] Post #${p.index} | ID: ${p.id}`);
    console.log(`Title: ${p.header}`);
    console.log(`Planned: ${p.plannedDate}`);
    console.log(`Subject: ${p.subject}`);
    console.log(`Images: ${p.images.length} (all exist locally: ${p.images.every((i) => existsSync(i.full))})`);
    console.log(`Link: ${p.link}`);
    console.log(`--------------------- Message ------------------------`);
    console.log(p.text);
    console.log(`------------------------------------------------------`);
    console.log(`Character count: ${p.text.length}`);
    return `dry-run-post-id-${p.id}`;
  }

  loadEnv();
  const pageId = process.env['FB_PAGE_ID'];
  const token = process.env['FB_PAGE_TOKEN'];
  const version = process.env['FB_GRAPH_VERSION'] || 'v21.0';

  if (!pageId || !token) {
    console.error('Error: FB_PAGE_ID or FB_PAGE_TOKEN missing from environment.');
    return null;
  }

  const missing = p.images.filter((i) => !existsSync(i.full));
  if (missing.length > 0) {
    console.error(`Error: image file missing: ${missing.map((m) => m.rel).join(', ')}`);
    return null;
  }

  const api = (path: string, form: FormData) =>
    fetch(`https://graph.facebook.com/${version}/${pageId}/${path}`, { method: 'POST', body: form });
  const fail = async (res: Response, step: string): Promise<null> => {
    const errorText = await res.text();
    console.error(`Facebook API error on ${step}: HTTP ${res.status} (${errorText.length} bytes)`);
    return null;
  };

  // 0 images: plain text post.
  if (p.images.length === 0) {
    const form = new FormData();
    form.append('access_token', token);
    form.append('message', p.text);
    const res = await api('feed', form);
    if (!res.ok) return fail(res, 'feed');
    const json = (await res.json()) as { id?: string };
    console.log(`Successfully posted! FB Post ID: ${json.id ?? ''}`);
    return json.id ?? '';
  }

  // 1 image: photo post with caption.
  if (p.images.length === 1) {
    const form = new FormData();
    form.append('access_token', token);
    form.append('caption', p.text);
    form.append('source', new Blob([readFileSync(p.images[0].full)], { type: 'image/webp' }), 'infographic.webp');
    const res = await api('photos', form);
    if (!res.ok) return fail(res, 'photos');
    const json = (await res.json()) as { id?: string; post_id?: string };
    const fbPostId = json.post_id || json.id || '';
    console.log(`Successfully posted! FB Post/Photo ID: ${fbPostId}`);
    return fbPostId;
  }

  // 2+ images: upload unpublished, then one feed post with attached_media.
  const mediaIds: string[] = [];
  for (const img of p.images) {
    const form = new FormData();
    form.append('access_token', token);
    form.append('published', 'false');
    form.append('source', new Blob([readFileSync(img.full)], { type: 'image/webp' }), 'image.webp');
    const res = await api('photos', form);
    if (!res.ok) return fail(res, 'photo upload');
    const json = (await res.json()) as { id?: string };
    if (!json.id) return null;
    mediaIds.push(json.id);
    await new Promise((r) => setTimeout(r, 1000));
  }
  const feed = new FormData();
  feed.append('access_token', token);
  feed.append('message', p.text);
  mediaIds.forEach((id, i) => feed.append(`attached_media[${i}]`, JSON.stringify({ media_fbid: id })));
  const res = await api('feed', feed);
  if (!res.ok) return fail(res, 'feed');
  const json = (await res.json()) as { id?: string };
  console.log(`Successfully posted! FB Post ID: ${json.id ?? ''}`);
  return json.id ?? '';
}

async function main() {
  loadEnv();
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isList = args.includes('--list');
  const force = args.includes('--force');

  const onlyIdxArg = args.indexOf('--only');
  const onlyIndex = onlyIdxArg !== -1 && args[onlyIdxArg + 1] ? parseInt(args[onlyIdxArg + 1], 10) : null;

  const posts = parseFinalPosts();
  const tracker = readPostedTracker();

  if (isList) {
    console.log(`Found ${posts.length} posts in FB-POSTS-FINAL.md:\n`);
    for (const p of posts) {
      const isPosted = Boolean(tracker[p.id]);
      const status = isPosted ? `[POSTED: ${tracker[p.id].fbPostId}]` : '[PENDING]';
      console.log(`Post #${p.index.toString().padStart(2, ' ')}: ${p.id.padEnd(45, ' ')} ${status} (${p.subject})`);
    }
    return;
  }

  let candidates = posts;
  if (onlyIndex !== null) {
    candidates = posts.filter((p) => p.index === onlyIndex);
    if (candidates.length === 0) {
      console.error(`Error: Post index ${onlyIndex} not found (available: 0 to ${posts.length - 1}).`);
      process.exit(1);
    }
  }

  console.log(`\nParascolaire Facebook Dispatcher`);
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (Simulated)' : 'LIVE (Graph API)'}`);
  console.log(`Total Posts: ${posts.length} | Selected: ${candidates.length}`);

  let successCount = 0;
  for (const post of candidates) {
    if (tracker[post.id] && !force && !isDryRun) {
      console.log(`[SKIP] Post #${post.index} (${post.id}) already posted at ${tracker[post.id].postedAt}`);
      continue;
    }

    const postId = await postToFacebookPhotos(post, isDryRun);
    if (postId) {
      successCount++;
      if (!isDryRun) {
        tracker[post.id] = {
          id: post.id,
          fbPostId: postId,
          postedAt: new Date().toISOString(),
          link: post.link,
        };
        savePostedTracker(tracker);
        // 2.5 second delay between live API calls
        await new Promise((r) => setTimeout(r, 2500));
      }
    }
  }

  console.log(`\nFinished: ${successCount} / ${candidates.length} processed successfully.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
