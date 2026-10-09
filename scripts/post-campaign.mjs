/**
 * Post the marketing campaign to the Facebook Page.
 *
 * Reads scripts/fb-campaign-posts.json and posts each entry to /{PAGE_ID}/feed.
 * Loads FB_PAGE_ID / FB_PAGE_TOKEN from .env (same loader as annotate-bd).
 *
 * SAFE BY DEFAULT — dry run (posts nothing) unless you pass --go.
 * Usage:
 *   node scripts/post-campaign.mjs                 # dry run, prints what would post
 *   node scripts/post-campaign.mjs --go            # post ALL (spaced by --delay seconds, default 0)
 *   node scripts/post-campaign.mjs --go --only p1-launch   # post one by id
 *   node scripts/post-campaign.mjs --go --delay 60 # 60s between posts
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const envPath = join(process.cwd(), '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)\s*=\s*"?([^"]*)"?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const PAGE_ID = process.env.FB_PAGE_ID;
const TOKEN = process.env.FB_PAGE_TOKEN;
const VERSION = 'v21.0';
const args = process.argv.slice(2);
const GO = args.includes('--go');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const delay = args.includes('--delay') ? Number(args[args.indexOf('--delay') + 1]) * 1000 : 0;

if (!PAGE_ID || !TOKEN) {
  console.error('FB_PAGE_ID / FB_PAGE_TOKEN missing (.env). Run on the VPS where they are set.');
  process.exit(1);
}

if (args.includes('--check')) {
  const dbg = await (await fetch(`https://graph.facebook.com/${VERSION}/debug_token?input_token=${TOKEN}&access_token=${TOKEN}`)).json();
  const d = dbg.data || {};
  console.log('token valid:', d.is_valid, '| type:', d.type, '| expires:', d.expires_at === 0 ? 'never' : new Date((d.expires_at || 0) * 1000).toISOString());
  console.log('scopes:', (d.scopes || []).join(', '));
  console.log('token belongs to id:', d.profile_id || d.user_id || '(none)');
  console.log('FB_PAGE_ID in .env:', PAGE_ID);
  const accts = await (await fetch(`https://graph.facebook.com/${VERSION}/me/accounts?fields=id,name,tasks&access_token=${TOKEN}`)).json();
  console.log('pages this token manages:', JSON.stringify(accts.data || accts.error || accts));
  process.exit(0);
}

const posts = JSON.parse(readFileSync(join(process.cwd(), 'scripts/fb-campaign-posts.json'), 'utf8'))
  .filter((p) => !only || p.id === only);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log(`${GO ? '🚀 LIVE' : '🧪 DRY RUN'} — ${posts.length} post(s)${only ? ` (only ${only})` : ''}\n`);

for (const [i, p] of posts.entries()) {
  console.log(`[${i + 1}/${posts.length}] ${p.id}`);
  console.log(p.message.split('\n')[0] + ' …');
  if (!GO) { console.log('  (dry run — not posted)\n'); continue; }
  try {
    const body = new URLSearchParams({ message: p.message, access_token: TOKEN });
    if (p.link) body.set('link', p.link);
    const res = await fetch(`https://graph.facebook.com/${VERSION}/${PAGE_ID}/feed`, { method: 'POST', body });
    const json = await res.json();
    if (json.id) console.log(`  ✅ posted: ${json.id}\n`);
    else console.log(`  ❌ failed: ${JSON.stringify(json.error || json)}\n`);
  } catch (e) {
    console.log(`  ❌ error: ${e.message}\n`);
  }
  if (delay && i < posts.length - 1) await sleep(delay);
}
console.log('Done.');
