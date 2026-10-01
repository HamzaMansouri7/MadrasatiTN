// One-off: move the generated Arabic-letter worksheet PNGs from uploads/ (runtime)
// into the library pipeline (exercices/ + catalog), so they render in the library.
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const catPath = path.join(root, 'exercices', 'exercices_catalog.json');
const cat = JSON.parse(fs.readFileSync(catPath, 'utf8'));

const add = [
  {
    src: 'uploads/exercises/ex_baa_matching_worksheet.png',
    dir: 'exercices/1ere_Primaire/Arabe',
    renamed: '1e_Ar_Lettre_Baa_Matching.png',
    title: 'العربية 1ère : الحرف ب (تمرين الوصل)',
  },
  {
    src: 'uploads/exercises/exercise_meem_worksheet.png',
    dir: 'exercices/1ere_Primaire/Arabe',
    renamed: '1e_Ar_Lettre_Meem.png',
    title: 'العربية 1ère : الحرف م',
  },
];

let n = 0;
for (const e of add) {
  const src = path.join(root, e.src);
  if (!fs.existsSync(src)) { console.warn('MISSING', e.src); continue; }
  fs.mkdirSync(path.join(root, e.dir), { recursive: true });
  const dest = path.join(root, e.dir, e.renamed);
  fs.copyFileSync(src, dest);
  if (cat.some((c) => c.renamed === e.renamed)) continue;
  cat.push({
    original: e.renamed,
    renamed: e.renamed,
    path: dest,
    title: e.title,
    subject: 'اللغة العربية',
    grade: '1ère Année',
    docType: "Série d'Exercices",
    isCorrection: false,
    sizeBytes: fs.statSync(dest).size,
  });
  n++;
}

fs.writeFileSync(catPath, JSON.stringify(cat, null, 2), 'utf8');
console.log(`added ${n}, total ${cat.length}`);
