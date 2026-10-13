import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bookTitle, themeTitle } from '../src/app/features/parascolaire/parascolaire.logic';
import type { ParascolaireCatalog } from '../src/app/features/parascolaire/parascolaire.models';

/**
 * Builds parascolaire/FB-SHARE-KIT.md: one copy-paste block per theme that has resources
 * (link + Arabic text for the owner's personal account and groups) plus the parent promo posts.
 *
 * Usage: npx tsx scripts/fb-share-kit.ts
 */

const ROOT = process.cwd();
const BASE = process.env['PUBLIC_BASE_URL'] || 'https://madrastihub.com';
const catalog = JSON.parse(readFileSync(join(ROOT, 'parascolaire', 'publish', 'catalog.json'), 'utf8')) as ParascolaireCatalog;

const CLASS_AR: Record<string, string> = {
  '1ere-annee': 'السنة الأولى',
  '2eme-annee': 'السنة الثانية',
  '3eme-annee': 'السنة الثالثة',
  '4eme-annee': 'السنة الرابعة',
  '5eme-annee': 'السنة الخامسة',
  '6eme-annee': 'السنة السادسة',
};

const out: string[] = [];
out.push('# Pack de partage Facebook (compte personnel et groupes)', '');
out.push('Copier-coller tel quel. Chaque lien ouvre directement le thème, sans inscription.', '');

out.push('## 1. Publications de présentation (parents)', '');
const promo = [
  {
    title: 'Publication A — courte, pour les groupes de parents',
    text: `أولياء الأمور، كم مرة سألتم في المجموعات: «من عنده تمارين مع الإصلاح؟» أو نشرتم صورة مسألة وانتظرتم من يحلّها؟

أصبح الآن في مكان واحد ملخصات مصورة (إنفوغرافيك) ودروس في شرائح لتلاميذ الابتدائي، مرتبة حسب السنة والكتاب والموضوع.

مجاني بالكامل، دون تسجيل ودون اشتراك. هدفنا أن يجد كل تلميذ دعمًا مدرسيًا جيدًا حتى لو لم تكن عائلته قادرة على شراء كتب الدعم.

${BASE}/parascolaire

#مدرستي_تونس #الدعم_المدرسي #التعليم_الابتدائي #تونس`,
  },
  {
    title: 'Publication B — présentation complète des fonctionnalités',
    text: `ماذا تجدون في «الدعم المدرسي» على مدرستي تونس؟

• كتب دعم مرتبة حسب السنة (من الأولى إلى السادسة ابتدائي) وحسب المادة.
• لكل موضوع: ملخص مصوّر (إنفوغرافيك) يمكن تكبيره وتنزيله.
• لكل موضوع: درس في شرائح تقرؤونه مع طفلكم، مع نسخة PDF للتنزيل.
• تتبعون ما هو متوفر وما هو قيد الإعداد، ونضيف مواضيع جديدة باستمرار.
• يعمل على الهاتف، بالعربية والفرنسية.

كل هذا مجاني بالكامل ودون حساب. الدعم المدرسي الجيد لا يجب أن يكون حكرًا على من يستطيع شراءه.

ادخلوا وتصفحوا:
${BASE}/parascolaire

شاركوها مع أولياء آخرين قد يحتاجونها.

#مدرستي_تونس #الدعم_المدرسي #مجاني #التعليم_الابتدائي`,
  },
  {
    title: 'Publication C — en commentaire sous les demandes d\'aide (réponse type)',
    text: `بالنسبة للدعم المدرسي والتمارين، تجدون ملخصات ودروسًا مصورة مجانية لكل المستويات هنا، دون تسجيل: ${BASE}/parascolaire`,
  },
];
for (const p of promo) out.push(`### ${p.title}`, '', '```', p.text, '```', '');

out.push('## 2. Un bloc par thème', '');
let count = 0;
for (const b of catalog.books) {
  const ready = b.themes.filter((t) => t.slots.infographic.status === 'ready' || t.slots.course.status === 'ready');
  if (ready.length === 0) continue;
  const cls = CLASS_AR[b.classe] ?? b.classe;
  out.push(`### ${cls} — ${bookTitle(b, true)}`, '');
  for (const t of ready) {
    const hasIg = t.slots.infographic.status === 'ready';
    const hasCourse = t.slots.course.status === 'ready';
    const what = hasIg && hasCourse ? 'ملخص مصوّر ودرس في شرائح' : hasCourse ? 'درس في شرائح' : 'ملخص مصوّر';
    const link = `${BASE}/parascolaire/${b.id}/${t.id}`;
    const title = themeTitle(t, true);
    const text = `${title} — ${cls} ابتدائي

${what}، مجاني ودون تسجيل:
${link}

#مدرستي_تونس #${cls.replace(/ /g, '_')}_ابتدائي`;
    out.push(`**${t.n}. ${title}** (${[hasIg ? 'infographie' : '', hasCourse ? 'cours' : ''].filter(Boolean).join(' + ')})`, '', '```', text, '```', '');
    count++;
  }
}

writeFileSync(join(ROOT, 'parascolaire', 'FB-SHARE-KIT.md'), out.join('\n'), 'utf8');
console.log(`Wrote parascolaire/FB-SHARE-KIT.md with ${count} theme blocks and ${promo.length} promo posts.`);
