import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Madrasati TN — Facebook Post Dispatcher for Parascolaire
 *
 * Reads: parascolaire/FB-POSTS-FINAL.md
 * Uploads: Image + caption via Facebook Graph API (/{page-id}/photos)
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
  imageRelPath: string;
  imageFullPath: string;
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
    const linkMatch = sec.match(/- \*\*Link:\*\*\s*`([^`]+)`/);
    const textMatch = sec.match(/- \*\*Text:\*\*\r?\n([\s\S]+?)(?=\r?\n---\r?\n|$)/);

    const imageRel = imageMatch ? imageMatch[1].trim() : '';
    const fullImg = resolve(ROOT_DIR, imageRel);

    posts.push({
      index,
      header,
      id: idMatch ? idMatch[1].trim() : `post-${index}`,
      themeId: themeMatch ? themeMatch[1].trim() : '',
      subject: subjectMatch ? subjectMatch[1].trim() : '',
      plannedDate: dateMatch ? dateMatch[1].trim() : '',
      imageRelPath: imageRel,
      imageFullPath: fullImg,
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
    console.log(`Image exists locally: ${existsSync(p.imageFullPath)} (${p.imageRelPath})`);
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

  if (!existsSync(p.imageFullPath)) {
    console.error(`Error: image file missing at ${p.imageFullPath}`);
    return null;
  }

  const fileBytes = readFileSync(p.imageFullPath);
  const blob = new Blob([fileBytes], { type: 'image/webp' });

  const form = new FormData();
  form.append('access_token', token);
  form.append('caption', p.text);
  form.append('source', blob, 'infographic.webp');

  const endpoint = `https://graph.facebook.com/${version}/${pageId}/photos`;
  const res = await fetch(endpoint, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Facebook API error: HTTP ${res.status}`);
    console.error(`Response length: ${errorText.length} bytes`);
    return null;
  }

  const json = (await res.json()) as { id?: string; post_id?: string };
  const fbPostId = json.post_id || json.id || '';
  console.log(`Successfully posted! FB Post/Photo ID: ${fbPostId}`);
  return fbPostId;
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
      }
    }
  }

  console.log(`\nFinished: ${successCount} / ${candidates.length} processed successfully.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
