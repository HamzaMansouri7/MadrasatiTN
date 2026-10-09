import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
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
  }
}

async function run() {
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

  for (let i = 0; i < toProcess.length; i++) {
    const doc = toProcess[i];
    const id = String(doc['id']);
    const isInfo = doc['docType'] === 'infographic';
    const isSeries = doc['docType'] === 'series';

    const sharePath = isSeries ? `/series/${id}` : isInfo ? `/infographic/${id}` : `/discovery?doc=${id}`;
    const scheduledPublishTime = scheduleArg ? scheduleBaseTime + i * intervalMinutes * 60 : undefined;

    console.log(`[${i + 1}/${toProcess.length}] Posting "${doc['title']}" (${doc['grade']} • ${doc['subject']})...`);

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
      kind: isInfo ? 'course' : 'sheet',
      sharePath,
      thumb: typeof doc['thumb'] === 'string' ? doc['thumb'] : undefined,
      scheduledPublishTime,
    });

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
}

run().catch(console.error);
