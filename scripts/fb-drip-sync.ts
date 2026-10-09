import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

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
  }
}

async function run() {
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

  for (let i = 0; i < toProcess.length; i++) {
    const doc = toProcess[i];
    const id = String(doc['id']);
    const isInfo = doc['docType'] === 'infographic';
    const kind = isInfo ? (doc['resourceKind'] === 'exercise' ? 'exercise' : 'course') : 'sheet';
    const sharePath = isInfo ? `/infographic/${id}` : `/discovery?doc=${id}`;
    const scheduledPublishTime = scheduleArg ? scheduleBaseTime + i * intervalMinutes * 60 : undefined;

    console.log(`[${i + 1}/${toProcess.length}] ${kind} "${doc['title']}" (${doc['grade']} • ${doc['subject']})`);
    if (dryRun) continue;

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
      kind,
      sharePath,
      thumb: typeof doc['thumb'] === 'string' ? doc['thumb'] : undefined,
      scheduledPublishTime,
    });

    console.log(result ? `  ok, FB post id: ${result}` : `  failed or skipped: ${id}`);
    if (!scheduleArg) await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log('Done.');
}

run().catch(console.error);
