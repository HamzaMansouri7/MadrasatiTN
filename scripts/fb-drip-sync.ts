import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
<<<<<<< HEAD
import { postToFacebook } from '../src/server/facebook';

/**
 * Facebook Drip Sync & Backfill Script
 * Scans published documents and publishes unposted items to their corresponding Facebook Albums.
 *
 * Usage:
 *   npx tsx scripts/fb-drip-sync.ts [--limit=5] [--schedule] [--interval-minutes=180]
 */

const UPLOAD_DIR = process.env['UPLOAD_DIR'] || './uploads';
const docsIndexPath = join(UPLOAD_DIR, 'docs-index.json');
const postedPath = join(UPLOAD_DIR, 'fb-posted.json');

function getPostedIds(): Set<string> {
  if (!existsSync(postedPath)) return new Set();
  try {
    const raw = JSON.parse(readFileSync(postedPath, 'utf8'));
    if (Array.isArray(raw)) return new Set(raw.map(String));
    if (typeof raw === 'object' && raw !== null) return new Set(Object.keys(raw));
    return new Set();
  } catch {
    return new Set();
=======

/**
 * Facebook Drip Sync & Backfill Script
 * Posts published worksheets and infographics that are not yet on the Page.
 * Series and memos are never posted (same rule as POST /api/docs).
 *
 * Usage (from the repo root):
 *   npx tsx scripts/fb-drip-sync.ts [--dry-run] [--limit=5] [--schedule] [--interval-minutes=180]
 *
 * Reads .env, and falls back to the VPS storage (/var/madrasati) when
 * DATA_DIR / UPLOAD_DIR are not set, so it sees the same data as the app.
 */

function loadEnv(): void {
  try {
    process.loadEnvFile(join(process.cwd(), '.env'));
  } catch {
    /* .env missing: rely on the process environment */
  }
  if (!process.env['DATA_DIR'] && existsSync('/var/madrasati/docs')) process.env['DATA_DIR'] = '/var/madrasati/docs';
  if (!process.env['UPLOAD_DIR'] && existsSync('/var/madrasati/uploads')) process.env['UPLOAD_DIR'] = '/var/madrasati/uploads';
}

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return fallback;
>>>>>>> d48906a106cbb15fb0688ed04f3ba8c876315ddb
  }
}

async function run() {
<<<<<<< HEAD
  if (!existsSync(docsIndexPath)) {
    console.error('docs-index.json not found in', UPLOAD_DIR);
    return;
  }

  const index = JSON.parse(readFileSync(docsIndexPath, 'utf8')) as Record<string, unknown>[];
  const posted = getPostedIds();

  const unposted = index.filter((doc) => doc['id'] && !posted.has(String(doc['id'])));
  console.log(`Found ${index.length} total docs, ${posted.size} already posted, ${unposted.length} pending.`);

  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : unposted.length;

  const scheduleArg = args.includes('--schedule');
  const intervalArg = args.find((a) => a.startsWith('--interval-minutes='));
  const intervalMinutes = intervalArg ? parseInt(intervalArg.split('=')[1], 10) : 180; // default 3 hours

  const toProcess = unposted.slice(0, limit);
  console.log(`Processing ${toProcess.length} items (Scheduled: ${scheduleArg})...`);

  let scheduleBaseTime = Math.floor(Date.now() / 1000) + 600; // start 10 min from now
=======
  loadEnv();
  // Imported after loadEnv(): storage.ts resolves its folders from env at import time.
  const { docsFolder } = await import('../src/server/storage');
  const { postToFacebook, facebookEnabled } = await import('../src/server/facebook');

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  if (!dryRun && !facebookEnabled()) {
    console.error('FB_PAGE_ID / FB_PAGE_TOKEN / PUBLIC_BASE_URL missing: nothing to do.');
    return;
  }

  const index = readJson<Record<string, unknown>[]>(join(docsFolder, 'index.json'), []);
  const posted = readJson<Record<string, unknown>>(join(docsFolder, 'fb-posted.json'), {});

  const postable = index.filter((d) => d['id'] && d['docType'] !== 'series' && d['docType'] !== 'memo');
  const pending = postable.filter((d) => !posted[String(d['id'])]).reverse(); // oldest first
  console.log(
    `${index.length} indexed in ${docsFolder}, ${postable.length} postable, ${Object.keys(posted).length} already posted, ${pending.length} pending.`,
  );

  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : pending.length;
  const scheduleArg = args.includes('--schedule');
  const intervalArg = args.find((a) => a.startsWith('--interval-minutes='));
  const intervalMinutes = intervalArg ? parseInt(intervalArg.split('=')[1], 10) : 180;

  const toProcess = pending.slice(0, limit);
  console.log(`Processing ${toProcess.length} items (scheduled: ${scheduleArg}, dry-run: ${dryRun})...`);

  const scheduleBaseTime = Math.floor(Date.now() / 1000) + 600; // first slot 10 min from now
>>>>>>> d48906a106cbb15fb0688ed04f3ba8c876315ddb

  for (let i = 0; i < toProcess.length; i++) {
    const doc = toProcess[i];
    const id = String(doc['id']);
    const isInfo = doc['docType'] === 'infographic';
<<<<<<< HEAD
    const isSeries = doc['docType'] === 'series';

    const sharePath = isSeries ? `/series/${id}` : isInfo ? `/infographic/${id}` : `/discovery?doc=${id}`;
    const scheduledPublishTime = scheduleArg ? scheduleBaseTime + i * intervalMinutes * 60 : undefined;

    console.log(`[${i + 1}/${toProcess.length}] Posting "${doc['title']}" (${doc['grade']} • ${doc['subject']})...`);
=======
    const kind = isInfo ? (doc['resourceKind'] === 'exercise' ? 'exercise' : 'course') : 'sheet';
    const sharePath = isInfo ? `/infographic/${id}` : `/discovery?doc=${id}`;
    const scheduledPublishTime = scheduleArg ? scheduleBaseTime + i * intervalMinutes * 60 : undefined;

    console.log(`[${i + 1}/${toProcess.length}] ${kind} "${doc['title']}" (${doc['grade']} • ${doc['subject']})`);
    if (dryRun) continue;
>>>>>>> d48906a106cbb15fb0688ed04f3ba8c876315ddb

    const result = await postToFacebook({
      id,
      title: String(doc['title'] || 'مورد تعليمي'),
      grade: String(doc['grade'] || ''),
      subject: String(doc['subject'] || ''),
      trimester: String(doc['trimester'] || ''),
      topic: String(doc['topic'] || ''),
      authorName: String(doc['authorName'] || ''),
      authorRole: String(doc['authorRole'] || ''),
      exerciseCount: typeof doc['exerciseCount'] === 'number' ? doc['exerciseCount'] : undefined,
<<<<<<< HEAD
      kind: isInfo ? 'course' : 'sheet',
=======
      kind,
>>>>>>> d48906a106cbb15fb0688ed04f3ba8c876315ddb
      sharePath,
      thumb: typeof doc['thumb'] === 'string' ? doc['thumb'] : undefined,
      scheduledPublishTime,
    });

<<<<<<< HEAD
    if (result) {
      console.log(`  ✓ Success! FB Post ID: ${result}`);
    } else {
      console.warn(`  ✗ Failed or skipped for doc ${id}`);
    }

    // Small delay between immediate requests
    if (!scheduleArg) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log('Done!');
=======
    console.log(result ? `  ok, FB post id: ${result}` : `  failed or skipped: ${id}`);
    if (!scheduleArg) await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log('Done.');
>>>>>>> d48906a106cbb15fb0688ed04f3ba8c876315ddb
}

run().catch(console.error);
