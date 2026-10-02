import { ExerciseItem, Course } from '../models/education.model';

export const SEED_COURSES: Course[] = [
  {
    id: 'crs-1',
    title: "La multiplication des grands nombres (jusqu'à 999 999)",
    classId: 'c-4a',
    subject: 'Mathématiques',
    grade: '4ème Année',
    trimester: 'Trimestre 1',
    docType: 'Fiche de Révision',
    schoolYear: '2025-2026',
    teacherName: 'Enseignant Certifié',
    summary: 'Technique opératoire de la multiplication à 2 et 3 chiffres, retenues et estimation du résultat.',
    content: `### Objective du cours
A la fin de cette leçon, l'élève de 4ème année sera capable de :
1. Poser et effectuer une multiplication d'un nombre à 5 chiffres par un nombre à 2 chiffres.
2. Utiliser l'ordre de grandeur pour vérifier le résultat.
3. Résoudre un problème nécessitant un calcul multiplicatif.

---

### 1. Règle fondamentale
Pour multiplier $3~452 \\times 24$ :
- Étape 1 : Multiplier $3~452$ par les unités ($4$). $3~452 \\times 4 = 13~808$.
- Étape 2 : Placer un zéro sous le rang des unités, puis multiplier $3~452$ par les dizaines ($2$). $3~452 \\times 20 = 69~040$.
- Étape 3 : Additionner les deux résultats intermédiaires : $13~808 + 69~040 = 82~848$.`,
    viewsCount: 342,
    createdAt: '22 Septembre 2026',
    tags: ['Calcul', 'Multiplication', '4ème'],
    hasCorrection: true,
    upvotesCount: 48,
    isUpvoted: false,
    reportedCount: 0,
    watermarkText: 'Madrasati TN — Document Certifié — Enseignant Certifié',
  },
  {
    id: 'crs-2',
    title: 'Écrire un texte narratif : Le cadre spatio-temporel',
    classId: 'c-4a',
    subject: 'Français',
    grade: '4ème Année',
    trimester: 'Trimestre 1',
    docType: 'Fiche de Révision',
    schoolYear: '2025-2026',
    teacherName: 'Enseignant Certifié (Français)',
    summary: 'Structure du récit court : Situation initiale, élément perturbateur, péripéties et situation finale.',
    content: `### Schéma Narratif pour le Primaire
Pour réussir une production écrite de 6 à 8 lignes :

1. **Quand et Où ?** (Un matin d'automne, dans la cour de l'école...)
2. **Qui ?** (Sami et sa petite sœur...)
3. **Que s'est-il passé ?** (Soudain, un petit chaton apeuré s'est approché...)
4. **Action et Solution** (Ils ont partagé leur goûter avec lui...)
5. **Fin** (Heureux, ils l'ont ramené à la maison.)`,
    viewsCount: 289,
    createdAt: '18 Septembre 2026',
    tags: ['Production écrite', 'Rédaction', '4ème'],
    hasCorrection: true,
    upvotesCount: 35,
    isUpvoted: false,
    reportedCount: 0,
    watermarkText: 'Madrasati TN — Document Pédagogique Conforme',
  },
  {
    id: 'crs-3',
    title: 'اللغة العربية : الجملة الاسمية ونواسخها (إنّ وأخواتها)',
    classId: 'c-5a',
    subject: 'اللغة العربية',
    grade: '5ème Année',
    trimester: 'Trimestre 1',
    docType: 'Fiche de Révision',
    schoolYear: '2025-2026',
    teacherName: 'Enseignante Certifiée (Arabe)',
    summary: 'شرح مبسط لمكونات الجملة الاسمية (المبتدأ والخبر) وتأثير إن وأخواتها عليها مع أمثلة وتطبيقات.',
    content: `### عناصر الدرس :
1. **الجملة الاسمية** : تتكون من مبتدأ وخبر (كلاهما مرفوع).
   - مثال : *العِلْمُ نُورٌ.* (العلمُ: مبتدأ مرفوع بالضمة / نورٌ: خبر مرفوع بالضمة).

2. **دخول (إنّ) وأخواتها** :
   - إنّ، أنّ، كأنّ، لكنّ، ليت، لعلّ.
   - تعمل إنّ على : **نصب المبتدأ** (ويسمى اسمها) و**رفع الخبر** (ويسمى خبرها).
   - مثال : *إِنَّ العِلْمَ نُورٌ.*`,
    viewsCount: 512,
    createdAt: '15 Septembre 2026',
    tags: ['قواعد', 'إعراب', '5 ابتدائي'],
    hasCorrection: true,
    upvotesCount: 62,
    isUpvoted: false,
    reportedCount: 0,
    watermarkText: 'Madrasati TN — Document Pédagogique Conforme',
  },
];

export const SEED_BANK_EXERCISES: ExerciseItem[] = [
  {
    id: 'bank-1',
    title: 'Devoir de Contrôle N°1 : Aires et Périmètres',
    chapter: 'Géométrie',
    subject: 'Mathématiques',
    grade: '4ème Année',
    trimester: 'Trimestre 1',
    docType: 'Devoir de Contrôle',
    schoolYear: '2025-2026',
    difficulty: 'Moyen',
    promptText: 'Un jardin carré a un côté de 15 mètres. Calculez son périmètre et son aire.',
    solutionText: 'Périmètre = 15 × 4 = 60 m. Aire = 15 × 15 = 225 m².',
    hasCorrection: true,
    hints: ["Périmètre d'un carré = Côté × 4", "Aire d'un carré = Côté × Côté"],
    points: 10,
    upvotesCount: 54,
    isUpvoted: false,
    reportedCount: 0,
    watermarkText: 'Madrasati TN — Document Pédagogique Conforme',
  },
  {
    id: 'bank-2',
    title: "Devoir de Synthèse N°2 : Accord de l'adjectif qualificatif",
    chapter: 'Grammaire',
    subject: 'Français',
    grade: '4ème Année',
    trimester: 'Trimestre 2',
    docType: 'Devoir de Synthèse',
    schoolYear: '2025-2026',
    difficulty: 'Facile',
    promptText: 'Accorder correctement : "Des fillettes (joyeux) ..... jouent dans une cour (vert) ....."',
    solutionText: 'Des fillettes joyeuses jouent dans une cour verte.',
    hasCorrection: true,
    hints: ['Fillettes est un nom féminin pluriel.', 'Cour est un nom féminin singulier.'],
    points: 10,
    upvotesCount: 29,
    isUpvoted: false,
    reportedCount: 0,
    watermarkText: 'Madrasati TN — Document Pédagogique Conforme',
  },
  {
    id: 'bank-3',
    title: 'Série N°1 : تمرين في التمييز والإعراب (السادسة مناظرة)',
    chapter: 'قواعد اللغة',
    subject: 'اللغة العربية',
    grade: '6ème Année',
    trimester: 'Trimestre 1',
    docType: "Série d'Exercices",
    schoolYear: '2025-2026',
    difficulty: 'Avancé',
    promptText: 'أعرب الكلمة المسطرة : "قَرَأَ الطَّالِبُ **كِتَاباً** مُمِتِعاً."',
    solutionText: 'كِتَاباً : مَفْعُولٌ بِهِ مَنْصُوبٌ وَعَلاَمَةُ نَصْبِهِ التَّنْوِينُ الفَتْحُ الظَّاهِرُ عَلَى آخِرِهِ.',
    hasCorrection: true,
    hints: ['اسأل نفسك : ماذا قرأ الطالب؟', 'الجواب عن "ماذا" يكون مفعولاً به.'],
    points: 10,
    upvotesCount: 88,
    isUpvoted: false,
    reportedCount: 0,
    watermarkText: 'Madrasati TN — Document Pédagogique Conforme',
  },
  {
    id: 'bank-4',
    title: 'Éveil Scientifique : Les circuits électriques simples',
    chapter: 'Physique & Électricité',
    subject: 'Éveil Scientifique',
    grade: '5ème Année',
    trimester: 'Trimestre 1',
    docType: 'Fiche de Révision',
    schoolYear: '2025-2026',
    difficulty: 'Moyen',
    promptText: 'Quels sont les trois composants indispensables pour faire briller une ampoule dans un circuit fermé ?',
    solutionText: '1. Une pile (générateur)\n2. Une ampoule (récepteur)\n3. Des fils conducteurs de connexion.',
    hasCorrection: true,
    hints: ["Il faut une source d'énergie, un composant qui s'allume et des liaisons."],
    points: 10,
    upvotesCount: 42,
    isUpvoted: false,
    reportedCount: 0,
    watermarkText: 'Madrasati TN — Document Certifié — Enseignant Certifié',
  },
];
