#!/usr/bin/env node
/**
 * Author N blog posts as the signed-in user (passes the authed-write rule on
 * `blog_posts`). Content is drafted by the live /api/ai/chat-article endpoint.
 *
 * Usage (PowerShell):
 *   $env:MADRASATI_EMAIL='you@example.com'
 *   $env:MADRASATI_PASSWORD='••••••'
 *   $env:API_BASE='https://madrastihub.com'   # or http://localhost:4000
 *   node scripts/seed-blogs.mjs
 *
 * Topics are defined in TOPICS below — edit to taste (3 by default).
 */
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const cfg = JSON.parse(readFileSync(new URL('../firebase-applet-config.json', import.meta.url), 'utf8'));
const EMAIL = process.env['MADRASATI_EMAIL'];
const PASSWORD = process.env['MADRASATI_PASSWORD'];
const API_BASE = process.env['API_BASE'] || 'https://madrastihub.com';

if (!EMAIL || !PASSWORD) {
  console.error('Set MADRASATI_EMAIL and MADRASATI_PASSWORD env vars first.');
  process.exit(1);
}

// Edit these three — each becomes one published post.
const TOPICS = [
  { subject: 'Mathématiques', grade: '4ème Année', chapter: 'Les fractions', prompt: 'Rédige un article pédagogique pour parents : comment aider un enfant de 4ème année à comprendre les fractions à la maison.' },
  { subject: 'اللغة العربية', grade: '3ème Année', chapter: 'القراءة', prompt: 'اكتب مقالاً تربوياً للأولياء حول كيفية تحبيب الطفل في القراءة في السنة الثالثة ابتدائي.' },
  { subject: 'Éveil Scientifique', grade: '5ème Année', chapter: 'Le cycle de l\'eau', prompt: 'Rédige un article pédagogique sur une activité simple à faire à la maison pour expliquer le cycle de l\'eau.' },
];

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
  return res.json(); // { replyText, updatedArticle:{title,summary,subject,grade,contentMarkdown}, suggestedChips }
}

async function cover(promptText) {
  try {
    const res = await fetch(`${API_BASE}/api/ai/generate-illustration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptText }),
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data.imageUrl ? `${API_BASE}${data.imageUrl}` : '';
  } catch {
    return '';
  }
}

(async () => {
  const app = initializeApp(cfg);
  const auth = getAuth(app);
  const db = getFirestore(app, cfg.firestoreDatabaseId);

  const cred = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
  const uid = cred.user.uid;
  const displayName = cred.user.displayName || 'Enseignant(e)';
  console.log(`Signed in as ${EMAIL} (${uid}).`);

  let n = 0;
  for (const t of TOPICS) {
    const isAr = /[؀-ۿ]/.test(t.prompt);
    const ai = await draft(t).catch((e) => { console.warn('draft failed:', e.message); return {}; });
    const art = ai.updatedArticle || {};
    const title = art.title || t.chapter;
    const body = art.contentMarkdown || ai.replyText || '';
    const excerpt = (art.summary || body.replace(/[#*>_`]/g, '').slice(0, 160)).trim();
    const coverImage = await cover(`${t.subject} — ${t.chapter} — ${title}`);

    const id = 'blog-' + Date.now() + '-' + n;
    const post = {
      id,
      title,
      titleAr: isAr ? title : '',
      excerpt,
      excerptAr: isAr ? excerpt : '',
      content: body,
      contentAr: isAr ? body : '',
      coverImage,
      authorId: uid,
      authorName: displayName,
      authorTitle: isAr ? 'معلّم(ة)' : 'Enseignant(e)',
      subject: t.subject,
      grade: t.grade,
      chapter: t.chapter,
      tags: [t.subject, t.grade, t.chapter].filter(Boolean),
      publishedAt: new Date().toISOString(),
      likesCount: 1,
      readTimeMinutes: Math.max(2, Math.round(body.length / 900)),
      comments: [],
    };
    await setDoc(doc(db, 'blog_posts', id), post, { merge: true });
    console.log(`  ✓ published: ${title}${coverImage ? ' (+cover)' : ''}`);
    n++;
  }
  console.log(`Done — ${n} posts written to blog_posts.`);
  process.exit(0);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
