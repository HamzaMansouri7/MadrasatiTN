/**
 * Subject terminology glossary for Tunisian primary education (AR / FR pairs).
 */

interface TermPair {
  fr: string;
  ar: string;
}

const GLOSSARY_BY_SUBJECT: Record<string, TermPair[]> = {
  math: [
    { fr: 'addition', ar: 'جمع' },
    { fr: 'soustraction', ar: 'طرح' },
    { fr: 'multiplication', ar: 'ضرب' },
    { fr: 'division', ar: 'قسمة' },
    { fr: 'fraction', ar: 'كسر' },
    { fr: 'périmètre', ar: 'محيط' },
    { fr: 'aire / surface', ar: 'مساحة' },
    { fr: 'angle droit', ar: 'زاوية قائمة' },
    { fr: 'segment de droite', ar: 'قطعة مستقيم' },
  ],
  grammar: [
    { fr: 'sujet', ar: 'فاعل' },
    { fr: 'verbe', ar: 'فعل' },
    { fr: "complément d'objet direct", ar: 'مفعول به' },
    { fr: 'adjectif qualificatif', ar: 'نعت / صفة' },
    { fr: 'nom commun / propre', ar: 'اسم نكرة / معرفة' },
    { fr: 'phrase nominale', ar: 'جملة اسمية' },
    { fr: 'phrase verbale', ar: 'جملة فعلية' },
    { fr: 'déterminant', ar: 'محدد / أداة تعريف' },
  ],
  science: [
    { fr: 'être vivant', ar: 'كائن حي' },
    { fr: 'respiration', ar: 'تنفس' },
    { fr: 'digestion', ar: 'هضم' },
    { fr: 'états de la matière', ar: 'حالات المادة' },
    { fr: 'solide, liquide, gaz', ar: 'صلب، سائل، غاز' },
    { fr: 'circuit électrique', ar: 'دارة كهربائية' },
    { fr: 'photosynthèse', ar: 'تركيب ضوئي' },
  ],
};

export function getSubjectGlossary(subject?: string): string {
  if (!subject) return '';
  const s = subject.toLowerCase();

  let category = '';
  if (s.includes('math') || s.includes('رياضيات') || s.includes('حساب')) {
    category = 'math';
  } else if (
    s.includes('français') ||
    s.includes('arabe') ||
    s.includes('العربية') ||
    s.includes('grammaire') ||
    s.includes('قواعد') ||
    s.includes('لغة')
  ) {
    category = 'grammar';
  } else if (
    s.includes('éveil') ||
    s.includes('science') ||
    s.includes('إيقاظ') ||
    s.includes('علمي')
  ) {
    category = 'science';
  }

  if (!category || !GLOSSARY_BY_SUBJECT[category]) return '';

  const terms = GLOSSARY_BY_SUBJECT[category]
    .map(t => `- ${t.fr} ⇄ ${t.ar}`)
    .join('\n');

  return `\nLEXIQUE OFFICIEL CNP (${subject}) :\n${terms}\n`;
}
