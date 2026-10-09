import { join } from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { docsFolder } from './storage';

/**
 * Madrasati TN — Comprehensive Facebook Graph API Automation
 *
 * Capabilities:
 * - Phase 1: Auto-managed albums per Grade × Subject (cached in fb-albums.json).
 * - Phase 2: Complete 6-8 hashtag taxonomy (Brand, Grade, Subject, Trimester, Kind).
 * - Phase 3: Auto-first-comment with direct platform & grade links.
 * - Phase 4: Drip / scheduled publish support (scheduled_publish_time).
 * - Phase 5: Structured post-mapping (fb-posted.json) with deletion / sync capability.
 */

const postedPath = join(docsFolder, 'fb-posted.json');
const albumsPath = join(docsFolder, 'fb-albums.json');

export interface FbPostRecord {
  fbPostId: string;
  albumId?: string;
  postedAt: string;
}

export type FbPostedMap = Record<string, FbPostRecord>;

// ─── Storage Helpers ─────────────────────────────────────────────────────────

function readPostedMap(): FbPostedMap {
  try {
    if (!existsSync(postedPath)) return {};
    const raw = JSON.parse(readFileSync(postedPath, 'utf8'));
    if (Array.isArray(raw)) {
      // Legacy migration from string[] to map
      const map: FbPostedMap = {};
      for (const id of raw) {
        if (typeof id === 'string') {
          map[id] = { fbPostId: '', postedAt: new Date().toISOString() };
        }
      }
      return map;
    }
    return typeof raw === 'object' && raw !== null ? raw : {};
  } catch {
    return {};
  }
}

function writePostedMap(map: FbPostedMap): void {
  try {
    writeFileSync(postedPath, JSON.stringify(map, null, 2), 'utf8');
  } catch (err) {
    console.warn('Failed to save fb-posted.json:', err);
  }
}

function readAlbumsMap(): Record<string, string> {
  try {
    if (!existsSync(albumsPath)) return {};
    const raw = JSON.parse(readFileSync(albumsPath, 'utf8'));
    return typeof raw === 'object' && raw !== null ? raw : {};
  } catch {
    return {};
  }
}

function writeAlbumsMap(map: Record<string, string>): void {
  try {
    writeFileSync(albumsPath, JSON.stringify(map, null, 2), 'utf8');
  } catch (err) {
    console.warn('Failed to save fb-albums.json:', err);
  }
}

// ─── Input Contract ──────────────────────────────────────────────────────────

export interface FacebookPostInput {
  id: string;
  title: string;
  grade?: string;
  subject?: string;
  trimester?: string;
  topic?: string;
  authorName?: string;
  authorRole?: string;
  exerciseCount?: number;
  kind?: 'course' | 'exercise' | 'sheet';
  /** Path (e.g. /discovery?doc=ID) relative to PUBLIC_BASE_URL. */
  sharePath: string;
  /** /uploads/... thumbnail path, if any. */
  thumb?: string;
  /** Optional Unix epoch timestamp (seconds) for scheduled posting (10m - 30d). */
  scheduledPublishTime?: number;
}

export function facebookEnabled(): boolean {
  return Boolean(process.env['FB_PAGE_ID'] && process.env['FB_PAGE_TOKEN'] && process.env['PUBLIC_BASE_URL']);
}

// ─── Taxonomy & Formatter Helpers ───────────────────────────────────────────

function getGradeNumber(g?: string): string {
  if (!g) return '';
  return g.match(/[1-6]/)?.[0] || '';
}

export function formatGradeShort(g?: string): string {
  const num = getGradeNumber(g);
  const map: Record<string, string> = {
    '1': 'السنة 1 ابتدائي',
    '2': 'السنة 2 ابتدائي',
    '3': 'السنة 3 ابتدائي',
    '4': 'السنة 4 ابتدائي',
    '5': 'السنة 5 ابتدائي',
    '6': 'السنة 6 ابتدائي',
  };
  return num && map[num] ? map[num] : (g || '').trim();
}

function formatGrade(g?: string): string {
  if (!g) return '';
  const grade = String(g).trim();
  const num = getGradeNumber(grade);
  const map: Record<string, string> = {
    '1': 'السنة الأولى ابتدائي (1ère Année)',
    '2': 'السنة الثانية ابتدائي (2ème Année)',
    '3': 'السنة الثالثة ابتدائي (3ème Année)',
    '4': 'السنة الرابعة ابتدائي (4ème Année)',
    '5': 'السنة الخامسة ابتدائي (5ème Année)',
    '6': 'السنة السادسة ابتدائي (6ème Année - المناظرة)',
  };
  return num && map[num] ? `🎓 ${map[num]}` : `🎓 ${grade}`;
}

export function formatSubjectShort(s?: string): string {
  if (!s) return 'عام';
  const sub = s.trim();
  const lower = sub.toLowerCase();
  if (lower.includes('math') || sub.includes('رياضيات') || sub.includes('حساب')) return 'الرياضيات';
  if (lower.includes('franc') || lower.includes('français')) return 'Français';
  if (lower.includes('arab') || sub.includes('عربي') || sub.includes('قراءة') || sub.includes('إنتاج')) return 'اللغة العربية';
  if (lower.includes('eng') || lower.includes('anglais')) return 'English';
  if (lower.includes('eveil') || lower.includes('science') || sub.includes('إيقاظ') || sub.includes('ايقاظ')) return 'الإيقاظ العلمي';
  if (sub.includes('تاريخ') || sub.includes('جغرافيا') || lower.includes('histoire') || lower.includes('geo')) return 'التاريخ والجغرافيا';
  if (sub.includes('إسلام') || sub.includes('اسلام')) return 'التربية الإسلامية';
  if (sub.includes('تكنولوجي') || lower.includes('tech') || lower.includes('info')) return 'الإعلامية والتكنولوجيا';
  return sub;
}

function formatSubject(s?: string): string {
  if (!s) return '';
  const sub = String(s).trim();
  const lower = sub.toLowerCase();
  if (lower.includes('math') || sub.includes('رياضيات') || sub.includes('حساب')) return '📐 الرياضيات (Mathématiques)';
  if (lower.includes('franc') || lower.includes('français') || lower.includes('french')) return '🇫🇷 Français (اللغة الفرنسية)';
  if (lower.includes('arab') || sub.includes('عربي') || sub.includes('قراءة') || sub.includes('إنتاج') || sub.includes('قواعد')) return '📖 اللغة العربية';
  if (lower.includes('eng') || lower.includes('anglais')) return '🇬🇧 English (اللغة الإنجليزية)';
  if (lower.includes('eveil') || lower.includes('science') || sub.includes('إيقاظ') || sub.includes('ايقاظ') || sub.includes('علمي')) return '🔬 الإيقاظ العلمي (Éveil Scientifique)';
  if (sub.includes('تاريخ') || sub.includes('جغرافيا') || lower.includes('histoire') || lower.includes('geo')) return '🌍 التاريخ والجغرافيا (Sociales)';
  if (sub.includes('إسلام') || sub.includes('اسلام')) return '🕌 التربية الإسلامية';
  if (sub.includes('تكنولوجي') || lower.includes('tech') || lower.includes('info')) return '💻 الإعلامية والتكنولوجيا';
  return `📚 ${sub}`;
}

function formatTrimester(t?: string): string {
  if (!t) return '';
  const s = String(t).trim().toLowerCase();
  if (s.includes('1') || s.includes('premier') || s.includes('أول') || s.includes('اول') || s === 't1') return 'الثلاثي الأول 🍁';
  if (s.includes('2') || s.includes('deuxième') || s.includes('deuxieme') || s.includes('ثان') || s === 't2') return 'الثلاثي الثاني ❄️';
  if (s.includes('3') || s.includes('troisième') || s.includes('troisieme') || s.includes('ثالث') || s === 't3') return 'الثلاثي الثالث 🌸';
  return t;
}

function formatAuthor(name?: string, role?: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed || trimmed === 'Communauté Madrasati' || trimmed === 'مدرستي') return '';
  
  const lower = trimmed.toLowerCase();
  const isAdmin = 
    role === 'admin' ||
    lower.includes('hamza') || 
    lower.includes('mansouri') || 
    trimmed.includes('حمزة') || 
    trimmed.includes('المنصوري') ||
    lower.includes('admin');

  if (isAdmin) {
    return '👨‍💼 إشراف: إدارة المنصة (Madrasti Admin)';
  }

  return `👨‍🏫 إعداد الأستاذ(ة): ${trimmed}`;
}

// ─── Phase 2: Fixed 6-8 Tag Taxonomy ────────────────────────────────────────

function buildHashtags(p: FacebookPostInput): string {
  const tags: string[] = ['#مدرستي_تونس', '#MadrasatiTN'];

  // Grade tag
  const num = getGradeNumber(p.grade);
  const gradeTags: Record<string, string> = {
    '1': '#السنة_الأولى',
    '2': '#السنة_الثانية',
    '3': '#السنة_الثالثة',
    '4': '#السنة_الرابعة',
    '5': '#السنة_الخامسة',
    '6': '#السنة_السادسة_مناظرة',
  };
  if (num && gradeTags[num]) tags.push(gradeTags[num]);

  // Subject tag
  if (p.subject) {
    const s = p.subject.toLowerCase();
    if (s.includes('math') || p.subject.includes('رياضيات') || p.subject.includes('حساب')) tags.push('#رياضيات_ابتدائي');
    else if (s.includes('franc') || s.includes('français')) tags.push('#Francais_Primaire');
    else if (s.includes('arab') || p.subject.includes('عربي') || p.subject.includes('قراءة')) tags.push('#لغة_عربية');
    else if (s.includes('science') || p.subject.includes('ايقاظ') || p.subject.includes('إيقاظ')) tags.push('#إيقاظ_علمي');
    else if (p.subject.includes('تاريخ') || p.subject.includes('جغرافيا')) tags.push('#تاريخ_وجغرافيا');
    else if (p.subject.includes('إسلام') || p.subject.includes('اسلام')) tags.push('#تربية_إسلامية');
    else if (s.includes('eng') || s.includes('anglais')) tags.push('#English_Primary');
    else if (s.includes('tech') || p.subject.includes('تكنولوجي')) tags.push('#إعلامية_وتكنولوجيا');
  }

  // Trimester tag
  if (p.trimester) {
    const t = p.trimester.toLowerCase();
    if (t.includes('1') || t.includes('أول') || t.includes('اول') || t === 't1') tags.push('#الثلاثي_الأول');
    else if (t.includes('2') || t.includes('ثان') || t === 't2') tags.push('#الثلاثي_الثاني');
    else if (t.includes('3') || t.includes('ثالث') || t === 't3') tags.push('#الثلاثي_الثالث');
  }

  // Doc Type tag
  if (p.kind === 'course') tags.push('#دروس_ابتدائي');
  else if (p.kind === 'exercise') tags.push('#تمارين_محلولة');
  else tags.push('#امتحانات_تونس');

  tags.push('#التعليم_الابتدائي');

  return tags.join(' ');
}

function buildMessage(p: FacebookPostInput, link: string): string {
  const headerBadge = p.kind === 'course' 
    ? '📚 [درس وشرح جديد مُعتمد]' 
    : p.kind === 'exercise' 
      ? '✏️ [سلسلة تمارين وتطبيقات]' 
      : '📄 [ورقة عمل وامتحان تدريبي]';

  const lines: string[] = [
    `✨ ${headerBadge} ✨`,
    `📌 العنوان: ${p.title}`,
    '━━━━━━━━━━━━━━━━━━━━',
  ];

  const gradeFormatted = formatGrade(p.grade);
  if (gradeFormatted) lines.push(gradeFormatted);

  const subjectFormatted = formatSubject(p.subject);
  if (subjectFormatted) lines.push(subjectFormatted);

  const trimFormatted = formatTrimester(p.trimester);
  if (trimFormatted) lines.push(`🗓️ الثلاثي: ${trimFormatted}`);

  if (p.topic && p.topic.trim()) {
    lines.push(`🏷️ المحور / الموضوع: ${p.topic.trim()}`);
  }

  if (p.exerciseCount && p.exerciseCount > 0) {
    lines.push(`📝 عدد التمارين: ${p.exerciseCount} تمارين مع الإصلاح والتقييم`);
  }

  const authorLine = formatAuthor(p.authorName, p.authorRole);
  if (authorLine) {
    lines.push(authorLine);
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push('⭐ المميزات:');
  lines.push('🖨️ جاهز للطباعة المباشرة بصيغة A4 بجودة ممتازة');
  lines.push('🤖 إمكانية المراجعة والحل التفاعلي مع الذكاء الاصطناعي');
  lines.push('🇹🇳 مطابق تماماً للبرامج الرسمية للمركز الوطني البيداغوجي (CNP)');
  lines.push('');
  lines.push('👇 للاطلاع على المحتوى وتحميله مجاناً:');
  lines.push(`🔗 ${link}`);
  lines.push('');
  lines.push('💬 لا تنسوا مشاركة المنشور لدعم أبنائنا التلاميذ! ❤️');
  lines.push('');
  lines.push(buildHashtags(p));

  return lines.filter(Boolean).join('\n');
}

// ─── Phase 1: Dynamic Albums (Grade × Subject) ──────────────────────────────

export async function getOrCreateAlbum(grade?: string, subject?: string): Promise<string | null> {
  if (!grade || !subject) return null;
  const gradeKey = getGradeNumber(grade) || grade.trim();
  const subKey = formatSubjectShort(subject);
  const albumKey = `${gradeKey}_${subKey}`;

  const albums = readAlbumsMap();
  if (albums[albumKey]) return albums[albumKey];

  const version = process.env['FB_GRAPH_VERSION'] || 'v21.0';
  const pageId = String(process.env['FB_PAGE_ID']);
  const token = String(process.env['FB_PAGE_TOKEN']);

  const albumName = `${formatGradeShort(grade)} – ${subKey}`;

  try {
    // 1. Check if album already exists on Facebook
    const listRes = await fetch(
      `https://graph.facebook.com/${version}/${pageId}/albums?fields=id,name&limit=100&access_token=${token}`
    );
    if (listRes.ok) {
      const data = (await listRes.json()) as { data?: { id: string; name: string }[] };
      const existing = (data.data || []).find((a) => a.name === albumName);
      if (existing) {
        albums[albumKey] = existing.id;
        writeAlbumsMap(albums);
        return existing.id;
      }
    }

    // 2. Create album if not found
    const createForm = new URLSearchParams({
      name: albumName,
      message: `مكتبة وأوراق عمل مادة ${subKey} لتلاميذ ${formatGradeShort(grade)} — منصة مدرستي تونس`,
      access_token: token,
    });
    const createRes = await fetch(`https://graph.facebook.com/${version}/${pageId}/albums`, {
      method: 'POST',
      body: createForm,
    });
    if (createRes.ok) {
      const created = (await createRes.json()) as { id: string };
      if (created.id) {
        albums[albumKey] = created.id;
        writeAlbumsMap(albums);
        return created.id;
      }
    } else {
      console.warn('Facebook create album failed:', createRes.status, await createRes.text());
    }
  } catch (err) {
    console.warn('Facebook getOrCreateAlbum error:', err);
  }

  return null;
}

// ─── Phase 3: Auto-Comment on Post ──────────────────────────────────────────

async function postAutoComment(postId: string, p: FacebookPostInput, link: string): Promise<void> {
  try {
    const version = process.env['FB_GRAPH_VERSION'] || 'v21.0';
    const token = String(process.env['FB_PAGE_TOKEN']);
    const base = String(process.env['PUBLIC_BASE_URL']).replace(/\/+$/, '');

    const gradeSearch = p.grade ? `${base}/discovery?grade=${encodeURIComponent(p.grade)}` : base;
    const comment = [
      '📌 رابط مباشر للمعاينة والطباعة مجاناً (PDF A4) أو الحل التفاعلي:',
      `👉 ${link}`,
      '',
      p.grade ? `🎓 لتصفح كافة موارد ${formatGradeShort(p.grade)}: ${gradeSearch}` : '',
    ].filter(Boolean).join('\n');

    const form = new URLSearchParams({
      message: comment,
      access_token: token,
    });

    await fetch(`https://graph.facebook.com/${version}/${postId}/comments`, {
      method: 'POST',
      body: form,
    });
  } catch (err) {
    console.warn('Facebook auto-comment error:', err);
  }
}

// ─── Main Dispatch Function ──────────────────────────────────────────────────

export async function postToFacebook(p: FacebookPostInput): Promise<string | null> {
  try {
    if (!facebookEnabled()) return null;
    const postedMap = readPostedMap();
    if (postedMap[p.id]) return postedMap[p.id].fbPostId || null;

    const base = String(process.env['PUBLIC_BASE_URL']).replace(/\/+$/, '');
    const pageId = String(process.env['FB_PAGE_ID']);
    const version = process.env['FB_GRAPH_VERSION'] || 'v21.0';
    const link = base + p.sharePath;
    const message = buildMessage(p, link);

    const form = new URLSearchParams({ access_token: String(process.env['FB_PAGE_TOKEN']) });

    // Optional Drip / Scheduling (Phase 4)
    if (p.scheduledPublishTime && p.scheduledPublishTime > Math.floor(Date.now() / 1000) + 600) {
      form.set('published', 'false');
      form.set('scheduled_publish_time', String(p.scheduledPublishTime));
    }

    let endpoint: string;
    let targetId: string = pageId;
    let albumId: string | undefined;

    if (p.thumb && p.thumb.startsWith('/uploads/')) {
      // Phase 1: Upload directly to specific Grade × Subject Album
      const matchedAlbum = await getOrCreateAlbum(p.grade, p.subject);
      if (matchedAlbum) {
        targetId = matchedAlbum;
        albumId = matchedAlbum;
      }
      endpoint = 'photos';
      form.set('url', base + p.thumb);
      form.set('caption', message);
    } else {
      endpoint = 'feed';
      form.set('message', message);
      form.set('link', link);
    }

    const res = await fetch(`https://graph.facebook.com/${version}/${targetId}/${endpoint}`, {
      method: 'POST',
      body: form,
    });

    if (!res.ok) {
      console.warn('Facebook post failed:', res.status, await res.text());
      return null;
    }

    const resJson = (await res.json()) as { id?: string; post_id?: string };
    const fbPostId = resJson.post_id || resJson.id || '';

    // Phase 5: Structured Map record
    postedMap[p.id] = {
      fbPostId,
      albumId,
      postedAt: new Date().toISOString(),
    };
    writePostedMap(postedMap);

    // Phase 3: Auto first comment (only for immediately published posts)
    if (fbPostId && !p.scheduledPublishTime) {
      void postAutoComment(fbPostId, p, link);
    }

    return fbPostId;
  } catch (err) {
    console.warn('Facebook post error:', err);
    return null;
  }
}

// ─── Phase 5: Delete / Sync API ──────────────────────────────────────────────

export async function deleteFacebookPost(docId: string): Promise<boolean> {
  try {
    if (!facebookEnabled()) return false;
    const postedMap = readPostedMap();
    const entry = postedMap[docId];
    if (!entry || !entry.fbPostId) return false;

    const version = process.env['FB_GRAPH_VERSION'] || 'v21.0';
    const token = String(process.env['FB_PAGE_TOKEN']);

    const res = await fetch(`https://graph.facebook.com/${version}/${entry.fbPostId}?access_token=${token}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      delete postedMap[docId];
      writePostedMap(postedMap);
      return true;
    }
  } catch (err) {
    console.warn('Facebook delete error:', err);
  }
  return false;
}

