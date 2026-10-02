#!/usr/bin/env node
/**
 * Author N blog posts using the Firebase CLI's stored credentials (no password
 * prompt, no service account). Flow:
 *   1. read the refresh token from the firebase-tools configstore
 *   2. mint a fresh OAuth access token (firebase-tools' public client)
 *   3. draft each post via the live /api/ai/chat-article endpoint (+ cover image)
 *   4. write to the `blog_posts` collection via the Firestore REST API
 *
 * Run: node scripts/seed-blogs-cli.mjs
 *   API_BASE env overrides the content endpoint (default prod).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const cfg = JSON.parse(readFileSync(new URL('../firebase-applet-config.json', import.meta.url), 'utf8'));
const PROJECT = cfg.projectId;
const DB = cfg.firestoreDatabaseId;
const API_BASE = process.env['API_BASE'] || 'https://madrastihub.com';

// firebase-tools' public OAuth client (open-source constants) — used only to
// refresh the token the CLI already obtained for this user.
const FB_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FB_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

const TOPICS = [
  { subject: 'Mathématiques', grade: '4ème Année', chapter: 'Les fractions', prompt: 'Rédige un article pédagogique pour parents : comment aider un enfant de 4ème année à comprendre les fractions à la maison, avec des activités concrètes.' },
  { subject: 'اللغة العربية', grade: '3ème Année', chapter: 'القراءة', prompt: 'اكتب مقالاً تربوياً للأولياء حول كيفية تحبيب الطفل في القراءة في السنة الثالثة ابتدائي مع أنشطة عملية.' },
  { subject: 'Éveil Scientifique', grade: '5ème Année', chapter: 'Le cycle de l\'eau', prompt: 'Rédige un article pédagogique sur une activité simple et ludique à faire à la maison pour expliquer le cycle de l\'eau à un enfant de 5ème année.' },
];

function readRefreshToken() {
  const p = join(homedir(), '.config', 'configstore', 'firebase-tools.json');
  const store = JSON.parse(readFileSync(p, 'utf8'));
  const rt = store?.tokens?.refresh_token;
  if (!rt) throw new Error('No refresh_token in firebase-tools configstore — run `firebase login` first.');
  return rt;
}

async function accessToken() {
  const body = new URLSearchParams({
    client_id: FB_CLIENT_ID,
    client_secret: FB_CLIENT_SECRET,
    refresh_token: readRefreshToken(),
    grant_type: 'refresh_token',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`token refresh HTTP ${res.status}: ${await res.text()}`);
  return (await res.json()).access_token;
}

async function draft(t) {
  const isAr = /[؀-ۿ]/.test(t.prompt);
  const res = await fetch(`${API_BASE}/api/ai/chat-article`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: t.prompt }],
      userPrompt: t.prompt,
      language: isAr ? 'ar' : 'fr',
      chapter: t.chapter,
      isFreeTopic: true,
      currentArticle: { subject: t.subject, grade: t.grade, chapter: t.chapter },
      tags: [t.subject, t.grade, t.chapter].filter(Boolean),
    }),
  });
  if (!res.ok) throw new Error(`chat-article HTTP ${res.status}`);
  return res.json();
}

async function cover(promptText) {
  try {
    const res = await fetch(`${API_BASE}/api/ai/generate-illustration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptText }),
    });
    if (!res.ok) return '';
    const d = await res.json();
    return d.imageUrl ? `${API_BASE}${d.imageUrl}` : '';
  } catch { return ''; }
}

// Minimal plain-object → Firestore REST typed-fields converter for our shape.
function toFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') fields[k] = { stringValue: v };
    else if (typeof v === 'number') fields[k] = Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    else if (Array.isArray(v)) fields[k] = { arrayValue: { values: v.map((s) => ({ stringValue: String(s) })) } };
    else if (v == null) fields[k] = { nullValue: null };
  }
  return fields;
}

(async () => {
  const token = await accessToken();
  console.log(`Minted access token for ${PROJECT}.`);
  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/${DB}/documents/blog_posts`;

  let n = 0;
  for (const t of TOPICS) {
    const isAr = /[؀-ۿ]/.test(t.prompt);
    const ai = await draft(t).catch((e) => { console.warn('draft failed:', e.message); return {}; });
    const art = ai.updatedArticle || {};
    const title = art.title || t.chapter;
    const bodyMd = art.contentMarkdown || ai.replyText || '';
    const excerpt = (art.summary || bodyMd.replace(/[#*>_`]/g, '').slice(0, 160)).trim();
    const coverImage = await cover(`${t.subject} — ${t.chapter} — ${title}`);

    const id = 'blog-' + Date.now() + '-' + n;
    const post = {
      id, title,
      titleAr: isAr ? title : '',
      excerpt, excerptAr: isAr ? excerpt : '',
      content: bodyMd, contentAr: isAr ? bodyMd : '',
      coverImage,
      authorId: '', authorName: 'مدرستي تونس', authorTitle: isAr ? 'فريق مدرستي' : 'Équipe Madrasati',
      subject: t.subject, grade: t.grade, chapter: t.chapter,
      tags: [t.subject, t.grade, t.chapter].filter(Boolean),
      publishedAt: new Date().toISOString(),
      likesCount: 1,
      readTimeMinutes: Math.max(2, Math.round(bodyMd.length / 900)),
      comments: [],
    };

    const res = await fetch(`${base}?documentId=${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFields(post) }),
    });
    if (!res.ok) { console.error(`  ✗ ${title}: HTTP ${res.status} ${await res.text()}`); }
    else { console.log(`  ✓ published: ${title}${coverImage ? ' (+cover)' : ''}`); n++; }
  }
  console.log(`Done — ${n}/${TOPICS.length} posts written to blog_posts.`);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
