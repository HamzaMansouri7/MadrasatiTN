const fs = require('fs');
const path = require('path');
const root = process.cwd();
const cat = JSON.parse(fs.readFileSync('exercices/exercices_catalog.json', 'utf8'));
const srcBase = path.join(root, 'exercices');
const pubBase = path.join(root, 'public', 'library');

const gradeMap = {
  '1ère Année': '1ère Année',
  '2ème Année': '2ème Année',
  '3ème Année': '3ème Année',
  '4ème Année': '4ème Année',
  '5ème Année': '5ème Année',
  '6ème Année': '6ème Année',
  '7ème Année': '7ème de base',
  '8ème Année': '8ème de base',
  '9ème Année': '9ème de base',
  'Baccalauréat': 'Baccalauréat'
};

const subjMap = {
  'Geographie': 'Histoire & Géographie',
  'Géographie': 'Histoire & Géographie',
  'Histoire & Géographie': 'Histoire & Géographie',
  'Français': 'Français',
  'Mathématiques': 'Mathématiques',
  'اللغة العربية': 'اللغة العربية',
  'Éveil Scientifique': 'Éveil Scientifique',
  'Anglais': 'Anglais'
};

const docMap = {
  'Manuel Scolaire': 'Manuel Scolaire',
  'Évaluation': 'Évaluation',
  'Corrigé Officiel': 'Corrigé',
  'Corrigé': 'Corrigé',
  'Épreuve / Devoir': 'Épreuve',
  'Épreuve': 'Épreuve',
  'Fiche de Cours': 'Fiche de Cours',
  'Fiche Mémento': 'Fiche Mémento',
  'Fiche Outil': 'Fiche Outil',
  'Fiche de Synthèse': 'Fiche de Révision',
  'Fiche de Révision': 'Fiche de Révision',
  "Série d'Exercices": "Série d'Exercices",
  'Illustration': 'Illustration'
};

const classIdFor = g => ({
  '1ère Année': 'cnp-1',
  '2ème Année': 'cnp-2',
  '3ème Année': 'cnp-3',
  '4ème Année': 'cnp-4',
  '5ème Année': 'cnp-5',
  '6ème Année': 'cnp-6',
  '7ème de base': 'lib-coll7',
  '8ème de base': 'lib-coll8',
  '9ème de base': 'lib-coll9',
  'Baccalauréat': 'lib-bac'
}[g] || 'lib-misc');

function deduceThemeAndTrimester(title, renamed, rel) {
  const str = (title + ' ' + renamed + ' ' + rel).toLowerCase();
  let trimester = 'Trimestre 1';
  let theme = 'Général & Révision';

  if (str.includes('trimestre 2') || str.includes('t2') || str.includes('module 3') || str.includes('module 4')) {
    trimester = 'Trimestre 2';
  } else if (str.includes('trimestre 3') || str.includes('t3') || str.includes('module 5') || str.includes('module 6')) {
    trimester = 'Trimestre 3';
  } else {
    trimester = 'Trimestre 1';
  }

  if (str.includes('module 1') || str.includes('métier') || str.includes('metier') || str.includes('travail')) {
    theme = "Module 1 : Travailler pour s'épanouir";
  } else if (str.includes('module 2') || str.includes('solidar') || str.includes('paix')) {
    theme = 'Module 2 : Vivre en paix et solidarité';
  } else if (str.includes('recyclage') || str.includes('potager') || str.includes('écolog') || str.includes('ecolog')) {
    theme = 'Module 4 : Environnement et écologie';
  } else if (str.includes('homonyme') || str.includes('et / est')) {
    theme = 'Orthographe : Homonymes grammaticaux';
  } else if (str.includes('dictée') || str.includes('dictee')) {
    theme = 'Orthographe & Dictée';
  } else if (str.includes('grammaire') || str.includes('gns') || str.includes('phrase')) {
    theme = 'Grammaire : Structure de la phrase';
  } else if (str.includes('carte') || str.includes('tunisie') || str.includes('خريطة') || str.includes('إحداثيات') || str.includes('coordonnees')) {
    theme = 'Géographie : Cartes et territoire tunisien';
  } else if (str.includes('guerre') || str.includes('alliances') || str.includes('1914')) {
    theme = 'Histoire : La Première Guerre Mondiale';
  } else if (str.includes('adfaq') || str.includes('أدفاق') || str.includes('commercial')) {
    theme = 'Géographie : Flux commerciaux mondiaux';
  } else if (str.includes('maghreb') || str.includes('المغرب العربي')) {
    theme = 'Géographie : Les pays du Maghreb Arabe';
  } else if (str.includes('saison') || str.includes('jour') || str.includes('mois')) {
    theme = 'Vocabulaire : Repères temporels';
  } else if (str.includes('conjugaison') || str.includes('imparfait') || str.includes('passe') || str.includes('passé') || str.includes('etre') || str.includes('être') || str.includes('avoir')) {
    theme = 'Conjugaison';
  } else if (str.includes('fraction') || str.includes('diviseur') || str.includes('multiple')) {
    theme = 'Nombres : Multiples, diviseurs et fractions';
  } else if (str.includes('digestif') || str.includes('digestion') || str.includes('corps') || str.includes('respiratoire')) {
    theme = 'Le corps humain';
  } else if (str.includes('syllabe') || str.includes('luiz') || str.includes('lecture')) {
    theme = 'Lecture & Compréhension de texte';
  } else if (str.includes('opinion') || str.includes('production')) {
    theme = 'Production écrite';
  } else if (str.includes('complement') || str.includes('complément') || str.includes('مفعول')) {
    theme = 'Grammaire : Structure de la phrase';
  }

  return { theme, trimester };
}

function cleanTitle(t) {
  return String(t)
    .replace(/\s*[(（]?\s*(Page|page|صفحة)\s*\d+\s*(\/\s*\d+)?\s*[)）]?/g, '')
    .replace(/\s*—\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function groupKey(rel, renamed) {
  const noext = renamed.replace(/\.(jpg|jpeg|png)$/i, '');
  const base = noext.replace(/_(Page|page|p)\s?\d+.*$/, '');
  return path.dirname(rel) + '||' + base;
}

const items = cat.map(c => {
  const abs = String(c.path).replace(/\\/g, '/');
  const parts = abs.split('/exercices/');
  return { ...c, rel: parts[1] };
}).filter(c => c.rel);

for (const it of items) {
  const dest = path.join(pubBase, it.rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const src = path.join(srcBase, it.rel);
  if (fs.existsSync(src)) fs.copyFileSync(src, dest);
}

const groups = {};
for (const it of items) {
  if ((it.docType || '') === 'Illustration' || it.rel.startsWith('Ressources_Graphiques')) continue;
  const k = groupKey(it.rel, it.renamed);
  (groups[k] = groups[k] || []).push(it);
}

const courses = [];
let idx = 0;
for (const k of Object.keys(groups)) {
  const g = groups[k].sort((a, b) => a.renamed.localeCompare(b.renamed));
  const first = g[0];
  const grade = gradeMap[first.grade] || '6ème Année';
  const subject = subjMap[first.subject] || 'Français';
  const docType = docMap[first.docType] || "Série d'Exercices";
  const isCorr = g.some(x => x.isCorrection);
  const urls = g.map(x => '/library/' + x.rel.split('/').map(encodeURIComponent).join('/'));
  const title = cleanTitle(first.title) + (g.length > 1 ? ` (${g.length} pages)` : '');
  const { theme, trimester } = deduceThemeAndTrimester(first.title, first.renamed, first.rel);
  const tags = [subject, grade, docType, theme].filter(Boolean);

  courses.push({
    id: 'lib-' + (++idx),
    title,
    classId: classIdFor(grade),
    subject,
    grade,
    trimester,
    theme,
    docType,
    schoolYear: '2025-2026',
    teacherName: 'Ressource Communautaire — Madrasati TN',
    summary: `${subject} — ${grade} — ${docType}${isCorr ? ' (corrigé inclus)' : ''}. Thème : ${theme}. Document réel à imprimer en A4.`,
    content: `Document scanné (${g.length} page${g.length > 1 ? 's' : ''}) classé sous le thème "${theme}".`,
    imageUrls: urls,
    viewsCount: 120 + ((idx * 37) % 400),
    createdAt: '2025-2026',
    tags,
    hasCorrection: isCorr,
    upvotesCount: 20 + ((idx * 13) % 120),
    isUpvoted: false,
    reportedCount: 0,
    watermarkText: 'Madrasati TN — Document Communautaire'
  });
}

courses.sort((a, b) => a.grade.localeCompare(b.grade) || a.subject.localeCompare(b.subject));

const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
let out = `import { Course } from '../models/education.model';\n\n/**\n * Community library — real scanned exercise sheets, exams & correction keys.\n * Auto-generated from exercices/exercices_catalog.json (scripts/gen-library.cjs).\n * Images served from /library/. ${courses.length} documents with structured themes and trimesters.\n */\nexport const LIBRARY_EXERCISES: Course[] = [\n`;
for (const c of courses) {
  out += `  { id:'${c.id}', title:'${esc(c.title)}', classId:'${c.classId}', subject:'${esc(c.subject)}', grade:'${esc(c.grade)}', trimester:'${c.trimester}', theme:'${esc(c.theme)}', docType:'${esc(c.docType)}', schoolYear:'${c.schoolYear}', teacherName:'${esc(c.teacherName)}', summary:'${esc(c.summary)}', content:'${esc(c.content)}', imageUrls:[${c.imageUrls.map(u => `'${esc(u)}'`).join(',')}], viewsCount:${c.viewsCount}, createdAt:'${c.createdAt}', tags:[${c.tags.map(t => `'${esc(t)}'`).join(',')}], hasCorrection:${c.hasCorrection}, upvotesCount:${c.upvotesCount}, isUpvoted:false, reportedCount:0, watermarkText:'${esc(c.watermarkText)}' },\n`;
}
out += `];\n`;

fs.writeFileSync('src/app/core/data/library-exercises.data.ts', out, 'utf8');
const byGrade = {};
courses.forEach(c => byGrade[c.grade] = (byGrade[c.grade] || 0) + 1);
console.log('courses:', courses.length, '| imgs copied:', items.length);
console.log(JSON.stringify(byGrade));
