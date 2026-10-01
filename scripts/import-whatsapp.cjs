// One-off: fold the parked "WhatsApp Unknown …" exercise images into the library
// pipeline (copy into exercices/<Class>/<Subject>/ + append to exercices_catalog.json).
// Grades marked (guess) are inferred from content, not the filename — verify later.
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const waDir = path.join(root, 'WhatsApp Unknown 2026-09-30 at 20.12.05');
const catPath = path.join(root, 'exercices', 'exercices_catalog.json');

const entries = [
  { from: 'Arabe/5e-grammaire-complement-absolu.jpeg',          cls: 'College_Arabe', subjDir: 'Arabe',         renamed: '5e_Ar_Grammaire_Complement_Absolu.jpg',       title: "العربية 5ème : المفعول المطلق (complément absolu)",             subject: 'اللغة العربية',     grade: '5ème Année' },
  { from: 'Arabe/5e-grammaire-complement-objet-direct.jpeg',    cls: 'College_Arabe', subjDir: 'Arabe',         renamed: '5e_Ar_Grammaire_Complement_Objet_Direct.jpg', title: "العربية 5ème : المفعول به (complément d'objet direct)",         subject: 'اللغة العربية',     grade: '5ème Année' },
  { from: 'Francais/5e-conjugaison-etre-et-avoir.jpeg',         cls: '5eme_Primaire', subjDir: 'Francais',      renamed: '5e_Fr_Conjugaison_Etre_Et_Avoir.jpg',         title: 'Conjugaison 5ème : Être et Avoir',                              subject: 'Français',          grade: '5ème Année' },
  { from: 'Francais/conjugaison-imparfait.jpeg',               cls: '4eme_Primaire', subjDir: 'Francais',      renamed: '4e_Fr_Conjugaison_Imparfait.jpg',             title: "Conjugaison : L'imparfait",                                     subject: 'Français',          grade: '4ème Année' }, // grade guess
  { from: 'Francais/conjugaison-passe-compose.jpeg',          cls: '4eme_Primaire', subjDir: 'Francais',      renamed: '4e_Fr_Conjugaison_Passe_Compose.jpg',         title: 'Conjugaison : Le passé composé',                                subject: 'Français',          grade: '4ème Année' }, // grade guess
  { from: 'Francais/lecture-tableau-syllabes-niveau1.jpeg',    cls: '1ere_Primaire', subjDir: 'Francais',      renamed: '1e_Fr_Lecture_Tableau_Syllabes_Niveau1.jpg',  title: 'Lecture 1ère : Tableau de syllabes (niveau 1)',                 subject: 'Français',          grade: '1ère Année' },
  { from: 'Francais/lecture-tableau-syllabes-niveau2.jpeg',    cls: '1ere_Primaire', subjDir: 'Francais',      renamed: '1e_Fr_Lecture_Tableau_Syllabes_Niveau2.jpg',  title: 'Lecture 1ère : Tableau de syllabes (niveau 2)',                 subject: 'Français',          grade: '1ère Année' },
  { from: 'Francais/production-ecrite-exprimer-son-opinion.jpeg', cls: '6eme_Primaire', subjDir: 'Francais',   renamed: '6e_Fr_Production_Ecrite_Exprimer_Opinion.jpg', title: 'Production écrite 6ème : Exprimer son opinion',                  subject: 'Français',          grade: '6ème Année' }, // grade guess
  { from: 'Mathematiques/2e-diviseurs.jpeg',                   cls: '2eme_Primaire', subjDir: 'Mathematiques', renamed: '2e_Math_Diviseurs.jpg',                       title: 'Mathématiques 2ème : Les diviseurs',                            subject: 'Mathématiques',     grade: '2ème Année' },
  { from: 'Mathematiques/5e-6e-multiples-et-diviseurs.jpeg',   cls: '5eme_Primaire', subjDir: 'Mathematiques', renamed: '5e_Math_Multiples_Et_Diviseurs.jpg',          title: 'Mathématiques 5ème-6ème : Multiples et diviseurs',              subject: 'Mathématiques',     grade: '5ème Année' },
  { from: 'Mathematiques/5e-6e-simplification-fractions.jpeg', cls: '5eme_Primaire', subjDir: 'Mathematiques', renamed: '5e_Math_Simplification_Fractions.jpg',         title: 'Mathématiques 5ème-6ème : Simplification de fractions',         subject: 'Mathématiques',     grade: '5ème Année' },
  { from: 'Sciences/appareil-digestif.jpeg',                   cls: '5eme_Primaire', subjDir: 'Sciences',      renamed: '5e_Sci_Appareil_Digestif.jpg',                title: "Éveil Scientifique : L'appareil digestif",                     subject: 'Éveil Scientifique', grade: '5ème Année' }, // grade guess
];

const cat = JSON.parse(fs.readFileSync(catPath, 'utf8'));
let added = 0;

for (const e of entries) {
  const src = path.join(waDir, e.from);
  if (!fs.existsSync(src)) { console.warn('MISSING source:', e.from); continue; }
  const relDir = path.join('exercices', e.cls, e.subjDir);
  const destDir = path.join(root, relDir);
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, e.renamed);
  fs.copyFileSync(src, dest);
  const sizeBytes = fs.statSync(dest).size;
  if (cat.some(c => c.renamed === e.renamed)) continue; // idempotent
  cat.push({
    original: path.basename(e.from),
    renamed: e.renamed,
    path: dest,
    title: e.title,
    subject: e.subject,
    grade: e.grade,
    docType: "Série d'Exercices",
    isCorrection: false,
    sizeBytes,
  });
  added++;
}

fs.writeFileSync(catPath, JSON.stringify(cat, null, 2), 'utf8');
console.log(`Catalog entries added: ${added}. Catalog total: ${cat.length}.`);
