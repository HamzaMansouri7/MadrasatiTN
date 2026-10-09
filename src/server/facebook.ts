import { join } from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { docsFolder } from './storage';

/**
 * Auto-post newly published resources to the Facebook Page (Graph API).
 * Inactive unless FB_PAGE_ID + FB_PAGE_TOKEN are set. Never throws: a Facebook
 * failure must not break publishing.
 *
 * Env: FB_PAGE_ID, FB_PAGE_TOKEN (long-lived Page token),
 *      PUBLIC_BASE_URL (e.g. https://madrasati.tn), FB_GRAPH_VERSION (default v21.0)
 */
const postedPath = join(docsFolder, 'fb-posted.json');

function readPosted(): string[] {
  try {
    if (!existsSync(postedPath)) return [];
    const arr = JSON.parse(readFileSync(postedPath, 'utf8'));
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

export interface FacebookPostInput {
  id: string;
  title: string;
  grade?: string;
  subject?: string;
  kind?: 'course' | 'exercise' | 'sheet';
  /** Path (e.g. /discovery?doc=ID) relative to PUBLIC_BASE_URL. */
  sharePath: string;
  /** /uploads/... thumbnail path, if any. */
  thumb?: string;
}

export function facebookEnabled(): boolean {
  return Boolean(process.env['FB_PAGE_ID'] && process.env['FB_PAGE_TOKEN'] && process.env['PUBLIC_BASE_URL']);
}

function buildMessage(p: FacebookPostInput, link: string): string {
  const label = p.kind === 'course' ? '📘 درس جديد' : p.kind === 'exercise' ? '✏️ تمارين جديدة' : '📄 ورقة عمل جديدة';
  const meta = [p.grade, p.subject].filter(Boolean).join(' • ');
  return [`${label} | ${p.title}`, meta, '', `👉 ${link}`, '', '#مدرستي_تونس #MadrasatiTN'].filter((l, i) => i !== 1 || l).join('\n');
}

export async function postToFacebook(p: FacebookPostInput): Promise<void> {
  try {
    if (!facebookEnabled()) return;
    const posted = readPosted();
    if (posted.includes(p.id)) return;

    const base = String(process.env['PUBLIC_BASE_URL']).replace(/\/+$/, '');
    const pageId = String(process.env['FB_PAGE_ID']);
    const version = process.env['FB_GRAPH_VERSION'] || 'v21.0';
    const link = base + p.sharePath;
    const message = buildMessage(p, link);

    const form = new URLSearchParams({ access_token: String(process.env['FB_PAGE_TOKEN']) });
    let endpoint: string;
    if (p.thumb && p.thumb.startsWith('/uploads/')) {
      endpoint = 'photos';
      form.set('url', base + p.thumb);
      form.set('caption', message);
    } else {
      endpoint = 'feed';
      form.set('message', message);
      form.set('link', link);
    }

    const res = await fetch(`https://graph.facebook.com/${version}/${pageId}/${endpoint}`, { method: 'POST', body: form });
    if (!res.ok) {
      console.warn('Facebook post failed:', res.status, await res.text());
      return;
    }
    writeFileSync(postedPath, JSON.stringify([p.id, ...posted].slice(0, 2000)), 'utf8');
  } catch (err) {
    console.warn('Facebook post error:', err);
  }
}
