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
}

export function facebookEnabled(): boolean {
  return Boolean(process.env['FB_PAGE_ID'] && process.env['FB_PAGE_TOKEN'] && process.env['PUBLIC_BASE_URL']);
}

function formatTrimester(t?: string): string {
  if (!t) return '';
  const s = String(t).trim().toLowerCase();
  if (s.includes('1') || s.includes('premier') || s.includes('أول') || s.includes('اول') || s === 't1') return 'الثلاثي الأول 🍁';
  if (s.includes('2') || s.includes('deuxième') || s.includes('deuxieme') || s.includes('ثان') || s === 't2') return 'الثلاثي الثاني ❄️';
  if (s.includes('3') || s.includes('troisième') || s.includes('troisieme') || s.includes('ثالث') || s === 't3') return 'الثلاثي الثالث 🌸';
  return t;
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

function formatGrade(g?: string): string {
  if (!g) return '';
  const grade = String(g).trim();
  const num = grade.match(/[1-6]/)?.[0];
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

function buildHashtags(p: FacebookPostInput): string {
  const tags = ['#مدرستي_تونس', '#MadrasatiTN', '#التعليم_الابتدائي', '#تونس_التربوية'];
  if (p.grade) {
    const num = p.grade.match(/[1-6]/)?.[0];
    if (num) {
      const gNames: Record<string, string> = { '1': 'الأولى', '2': 'الثانية', '3': 'الثالثة', '4': 'الرابعة', '5': 'الخامسة', '6': 'السادسة' };
      if (gNames[num]) tags.push(`#السنة_${gNames[num]}`);
    }
  }
  if (p.subject) {
    const s = p.subject.toLowerCase();
    if (s.includes('math') || s.includes('رياضيات')) tags.push('#رياضيات_ابتدائي');
    if (s.includes('franc') || s.includes('français')) tags.push('#Francais_Primaire');
    if (s.includes('arab') || s.includes('عربي')) tags.push('#لغة_عربية');
    if (s.includes('science') || s.includes('ايقاظ') || s.includes('إيقاظ')) tags.push('#إيقاظ_علمي');
  }
  return tags.join(' ');
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
