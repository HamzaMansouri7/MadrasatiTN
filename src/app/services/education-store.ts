import { Injectable, computed, signal } from '@angular/core';
import {
  Announcement,
  ClassGroup,
  Course,
  ExerciseItem,
  Homework,
  StudentProfile,
  Submission,
  TeacherProfile,
  UserRole,
} from '../models/education.model';
import { CNP_PRIMARY_COURSES } from '../data/cnp-books.data';

@Injectable({
  providedIn: 'root',
})
export class EducationStore {
  // Current active role
  readonly currentRole = signal<UserRole>('teacher');

  // Currently selected class in Teacher/Class views
  readonly activeClassId = signal<string>('c-4a');

  // Currently selected student in Parent view
  readonly activeStudentId = signal<string>('st-1');

  // Multi-Facet Search & Filter Hub State
  readonly searchQuery = signal<string>('');
  readonly selectedGradeFilter = signal<string>('Tous');
  readonly selectedSubjectFilter = signal<string>('Tous');
  readonly selectedTrimesterFilter = signal<string>('Tous');
  readonly selectedDocTypeFilter = signal<string>('Tous');
  readonly selectedSchoolYearFilter = signal<string>('Tous');
  readonly onlyWithCorrectionFilter = signal<boolean>(false);

  // Mock Data Collections
  readonly classes = signal<ClassGroup[]>([
    {
      id: 'c-1a',
      name: '1ère A — Classe Mme Salma',
      grade: '1ère Année',
      teacherId: 't-4',
      teacherName: 'Mme Salma Karray',
      teacherAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      schoolName: 'École Primaire Habib Bourguiba, Ariana',
      studentCount: 25,
      code: '1A-2026',
      scheduleSummary: 'Lu - Ve : 08h00 - 12h30',
    },
    {
      id: 'c-2b',
      name: '2ème B — Classe M. Nidhal',
      grade: '2ème Année',
      teacherId: 't-5',
      teacherName: 'M. Nidhal Gharbi',
      teacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      schoolName: 'École Primaire Habib Bourguiba, Ariana',
      studentCount: 27,
      code: '2B-2026',
      scheduleSummary: 'Lu - Ve : 08h00 - 12h30',
    },
    {
      id: 'c-3a',
      name: '3ème A — Classe Mme Meriem',
      grade: '3ème Année',
      teacherId: 't-6',
      teacherName: 'Mme Meriem Chebbi',
      teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      schoolName: 'École Primaire Habib Bourguiba, Ariana',
      studentCount: 29,
      code: '3A-2026',
      scheduleSummary: 'Lu - Ve : 08h00 - 13h00',
    },
    {
      id: 'c-4a',
      name: '4ème A — Classe Mme Amel',
      grade: '4ème Année',
      teacherId: 't-1',
      teacherName: 'Mme Amel Ben Ali',
      teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      schoolName: 'École Primaire Habib Bourguiba, Ariana',
      studentCount: 28,
      code: '4A-2026',
      scheduleSummary: 'Lu - Ve : 08h00 - 13h00',
    },
    {
      id: 'c-4b',
      name: '4ème B — Classe Mme Amel',
      grade: '4ème Année',
      teacherId: 't-1',
      teacherName: 'Mme Amel Ben Ali',
      teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      schoolName: 'École Primaire Habib Bourguiba, Ariana',
      studentCount: 31,
      code: '4B-2026',
      scheduleSummary: 'Lu - Ve : 08h00 - 13h00',
    },
    {
      id: 'c-5a',
      name: '5ème A — Classe Mme Faten',
      grade: '5ème Année',
      teacherId: 't-7',
      teacherName: 'Mme Faten Zaouali',
      teacherAvatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
      schoolName: 'École Primaire Habib Bourguiba, Ariana',
      studentCount: 30,
      code: '5A-2026',
      scheduleSummary: 'Lu - Ve : 08h00 - 13h00',
    },
    {
      id: 'c-6c',
      name: '6ème C — Classe M. Karim',
      grade: '6ème Année',
      teacherId: 't-2',
      teacherName: 'M. Karim Hammami',
      teacherAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      schoolName: 'École Primaire Ibn Khaldoun, Tunis',
      studentCount: 26,
      code: '6C-2026',
      scheduleSummary: 'Lu - Sam : 08h30 - 13h30',
    },
  ]);

  readonly teachers = signal<TeacherProfile[]>([
    {
      id: 't-1',
      name: 'Mme Amel Ben Ali',
      title: 'Enseignante Principale (4ème & 5ème Année)',
      school: 'École Primaire Habib Bourguiba, Ariana',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      coursesCount: 24,
      exercisesCount: 340,
      studentsCount: 620,
      totalUploads: 148,
      downloadableExercisesCount: 310,
      rating: 4.9,
      reviewsCount: 128,
      verifiedBadge: true,
      subjects: ['Mathématiques', 'Éveil Scientifique'],
      bio: 'Enseignante passionnée depuis 12 ans. Spécialisée dans la pédagogie active des mathématiques et l’apprentissage logique pour le primaire tunisien.',
      starRatingBreakdown: { 5: 110, 4: 14, 3: 3, 2: 1, 1: 0 },
    },
    {
      id: 't-2',
      name: 'M. Karim Hammami',
      title: 'Enseignant de Français & Anglais (6ème Concours)',
      school: 'École Primaire Ibn Khaldoun, Tunis',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      coursesCount: 18,
      exercisesCount: 215,
      studentsCount: 480,
      totalUploads: 92,
      downloadableExercisesCount: 195,
      rating: 4.8,
      reviewsCount: 94,
      verifiedBadge: true,
      subjects: ['Français', 'Anglais'],
      bio: 'Formateur certifié en langue française. Auteur de fiches de lecture et de préparation au Concours de 6ème.',
      starRatingBreakdown: { 5: 78, 4: 12, 3: 3, 2: 1, 1: 0 },
    },
    {
      id: 't-3',
      name: 'Mme Sonia Trabelsi',
      title: 'Enseignante de Langue Arabe (5ème & 6ème)',
      school: 'École Primaire Monji Slim, Marsa',
      avatarUrl: 'https://images.unsplash.com/photo-1580894732413-802c6769998b?w=150&auto=format&fit=crop&q=80',
      coursesCount: 31,
      exercisesCount: 410,
      studentsCount: 890,
      totalUploads: 210,
      downloadableExercisesCount: 380,
      rating: 5.0,
      reviewsCount: 210,
      verifiedBadge: true,
      subjects: ['اللغة العربية', 'Éducation Islamique'],
      bio: 'أستاذة تعليم ابتدائي. متخصصة في قواعد اللغة العربية والإنتاج الكتابي للمرحلة الابتدائية.',
      starRatingBreakdown: { 5: 198, 4: 10, 3: 2, 2: 0, 1: 0 },
    },
  ]);

  readonly students = signal<StudentProfile[]>([
    {
      id: 'st-1',
      name: 'Ahmed Mansouri',
      grade: '4ème Année',
      school: 'École Primaire Habib Bourguiba, Ariana',
      avatarUrl: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=150&auto=format&fit=crop&q=80',
      parentId: 'p-1',
      classId: 'c-4a',
      streakDays: 6,
      totalPoints: 1240,
      completedExercisesCount: 42,
      subjectsProgress: [
        { subject: 'Mathématiques', score: 85, color: '#10b981' },
        { subject: 'Français', score: 92, color: '#6366f1' },
        { subject: 'اللغة العربية', score: 78, color: '#f59e0b' },
        { subject: 'Éveil Scientifique', score: 88, color: '#06b6d4' },
      ],
    },
  ]);

  readonly announcements = signal<Announcement[]>([
    {
      id: 'a-1',
      title: '📌 Devoir de Synthèse N°1 : Mathématiques',
      classId: 'c-4a',
      teacherName: 'Mme Amel Ben Ali',
      teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      content: 'Chers parents et élèves, le Devoir de Synthèse N°1 aura lieu jeudi prochain à 09h00. Les chapitres concernés sont : La multiplication des nombres de 0 à 999 999, la géométrie des droites perpendiculaires et la résolution de problèmes à deux étapes.',
      category: 'exam',
      date: 'Aujourd\'hui à 10:15',
      likesCount: 19,
      confirmedByParentsCount: 24,
      isPinned: true,
    },
  ]);

  readonly courses = signal<Course[]>([
    ...CNP_PRIMARY_COURSES,
    {
      id: 'crs-1',
      title: 'La multiplication des grands nombres (jusqu\'à 999 999)',
      classId: 'c-4a',
      subject: 'Mathématiques',
      grade: '4ème Année',
      trimester: 'Trimestre 1',
      docType: 'Fiche de Révision',
      schoolYear: '2025-2026',
      teacherName: 'Mme Amel Ben Ali',
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
      watermarkText: 'Madrasati TN — Document Certifié — Mme Amel Ben Ali',
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
      teacherName: 'M. Karim Hammami',
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
      watermarkText: 'Madrasati TN — Document Certifié — M. Karim Hammami',
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
      teacherName: 'Mme Sonia Trabelsi',
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
      watermarkText: 'Madrasati TN — Document Certifié — Mme Sonia Trabelsi',
    },
  ]);

  readonly homeworks = signal<Homework[]>([]);
  readonly submissions = signal<Submission[]>([]);

  // Public Exercises Repository (Searchable Bank)
  readonly exercisesBank = signal<ExerciseItem[]>([
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
      hints: ['Périmètre d\'un carré = Côté × 4', 'Aire d\'un carré = Côté × Côté'],
      points: 10,
      upvotesCount: 54,
      isUpvoted: false,
      reportedCount: 0,
      watermarkText: 'Madrasati TN — Document Certifié — Mme Amel Ben Ali',
    },
    {
      id: 'bank-2',
      title: 'Devoir de Synthèse N°2 : Accord de l\'adjectif qualificatif',
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
      watermarkText: 'Madrasati TN — Document Certifié — M. Karim Hammami',
    },
    {
      id: 'bank-3',
      title: 'Série N°1 : تمرين في التمييز والإعراب (السادسة مناظرة)',
      chapter: 'قواعد اللغة',
      subject: 'اللغة العربية',
      grade: '6ème Année',
      trimester: 'Trimestre 1',
      docType: 'Série d\'Exercices',
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
      watermarkText: 'Madrasati TN — Document Certifié — Mme Sonia Trabelsi',
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
      hints: ['Il faut une source d\'énergie, un composant qui s\'allume et des liaisons.'],
      points: 10,
      upvotesCount: 42,
      isUpvoted: false,
      reportedCount: 0,
      watermarkText: 'Madrasati TN — Document Certifié — Mme Amel Ben Ali',
    },
  ]);

  // Computed signals
  readonly activeClass = computed(() => {
    const id = this.activeClassId();
    return this.classes().find((c) => c.id === id) || this.classes()[0];
  });

  readonly activeStudent = computed(() => {
    const id = this.activeStudentId();
    return this.students().find((s) => s.id === id) || this.students()[0];
  });

  readonly classAnnouncements = computed(() => {
    const cid = this.activeClassId();
    return this.announcements().filter((a) => a.classId === cid);
  });

  readonly classCourses = computed(() => {
    const cid = this.activeClassId();
    return this.courses().filter((c) => c.classId === cid);
  });

  readonly classHomeworks = computed(() => {
    const cid = this.activeClassId();
    return this.homeworks().filter((h) => h.classId === cid);
  });

  // Multi-Facet Filtering Engine for Courses Library
  readonly filteredCourses = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const g = this.selectedGradeFilter();
    const s = this.selectedSubjectFilter();
    const t = this.selectedTrimesterFilter();
    const d = this.selectedDocTypeFilter();
    const y = this.selectedSchoolYearFilter();
    const onlyCor = this.onlyWithCorrectionFilter();

    return this.courses().filter((course) => {
      const matchQ =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.summary.toLowerCase().includes(q) ||
        course.tags.some((tag) => tag.toLowerCase().includes(q));

      const matchG = g === 'Tous' || course.grade === g;
      const matchS = s === 'Tous' || course.subject === s;
      const matchT = t === 'Tous' || course.trimester === t;
      const matchD = d === 'Tous' || course.docType === d;
      const matchY = y === 'Tous' || course.schoolYear === y;
      const matchCor = !onlyCor || course.hasCorrection === true;

      return matchQ && matchG && matchS && matchT && matchD && matchY && matchCor;
    });
  });

  // Multi-Facet Filtering Engine for Exercises Bank
  readonly filteredExercisesBank = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const g = this.selectedGradeFilter();
    const s = this.selectedSubjectFilter();
    const t = this.selectedTrimesterFilter();
    const d = this.selectedDocTypeFilter();
    const y = this.selectedSchoolYearFilter();
    const onlyCor = this.onlyWithCorrectionFilter();

    return this.exercisesBank().filter((ex) => {
      const matchQ =
        !q ||
        ex.title.toLowerCase().includes(q) ||
        ex.promptText.toLowerCase().includes(q) ||
        ex.chapter.toLowerCase().includes(q);

      const matchG = g === 'Tous' || ex.grade === g;
      const matchS = s === 'Tous' || ex.subject === s;
      const matchT = t === 'Tous' || ex.trimester === t;
      const matchD = d === 'Tous' || ex.docType === d;
      const matchY = y === 'Tous' || ex.schoolYear === y;
      const matchCor = !onlyCor || ex.hasCorrection === true;

      return matchQ && matchG && matchS && matchT && matchD && matchY && matchCor;
    });
  });

  // Actions
  switchRole(role: UserRole) {
    this.currentRole.set(role);
  }

  setActiveClass(classId: string) {
    this.activeClassId.set(classId);
  }

  setActiveStudent(studentId: string) {
    this.activeStudentId.set(studentId);
  }

  // Filter Updaters
  setSearchQuery(q: string) {
    this.searchQuery.set(q);
  }

  setGradeFilter(g: string) {
    this.selectedGradeFilter.set(g);
  }

  setSubjectFilter(s: string) {
    this.selectedSubjectFilter.set(s);
  }

  setTrimesterFilter(t: string) {
    this.selectedTrimesterFilter.set(t);
  }

  setDocTypeFilter(d: string) {
    this.selectedDocTypeFilter.set(d);
  }

  setSchoolYearFilter(y: string) {
    this.selectedSchoolYearFilter.set(y);
  }

  setOnlyWithCorrectionFilter(val: boolean) {
    this.onlyWithCorrectionFilter.set(val);
  }

  resetAllFilters() {
    this.searchQuery.set('');
    this.selectedGradeFilter.set('Tous');
    this.selectedSubjectFilter.set('Tous');
    this.selectedTrimesterFilter.set('Tous');
    this.selectedDocTypeFilter.set('Tous');
    this.selectedSchoolYearFilter.set('Tous');
    this.onlyWithCorrectionFilter.set(false);
  }

  // Community Actions: Upvote & Report
  toggleUpvoteExercise(id: string) {
    this.exercisesBank.update((list) =>
      list.map((ex) => {
        if (ex.id === id) {
          const isUpvoted = !ex.isUpvoted;
          const upvotesCount = (ex.upvotesCount || 0) + (isUpvoted ? 1 : -1);
          return { ...ex, isUpvoted, upvotesCount };
        }
        return ex;
      })
    );
  }

  toggleUpvoteCourse(id: string) {
    this.courses.update((list) =>
      list.map((crs) => {
        if (crs.id === id) {
          const isUpvoted = !crs.isUpvoted;
          const upvotesCount = (crs.upvotesCount || 0) + (isUpvoted ? 1 : -1);
          return { ...crs, isUpvoted, upvotesCount };
        }
        return crs;
      })
    );
  }

  reportExercise(id: string) {
    this.exercisesBank.update((list) =>
      list.map((ex) => {
        if (ex.id === id) {
          return { ...ex, isReported: true, reportedCount: (ex.reportedCount || 0) + 1 };
        }
        return ex;
      })
    );
  }

  // AI Bulk Upload & Auto-Tagger
  async autoTagAndAddDocument(documentName: string, rawText: string): Promise<ExerciseItem | null> {
    try {
      const res = await fetch('/api/ai/auto-tag-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentName, rawText }),
      });
      const data = await res.json();
      if (data.success && data.tags) {
        const tags = data.tags;
        const newEx: ExerciseItem = {
          id: 'auto-' + Date.now(),
          title: tags.suggestedTitle || documentName,
          chapter: tags.summary || 'Document importé WhatsApp',
          subject: tags.subject || 'Mathématiques',
          grade: tags.grade || '4ème Année',
          trimester: tags.trimester || 'Trimestre 1',
          docType: tags.docType || 'Série d\'Exercices',
          schoolYear: '2025-2026',
          difficulty: 'Moyen',
          promptText: rawText || 'Contenu extrait du document WhatsApp.',
          solutionText: tags.hasCorrection ? 'Solution complète incluse dans le document.' : 'Aide : voir les étapes du cours.',
          hasCorrection: tags.hasCorrection ?? true,
          hints: ['Généré et étiqueté par Gemini IA'],
          points: 10,
          upvotesCount: 1,
          isUpvoted: true,
          watermarkText: 'Madrasati TN — Auto-Tagué par Gemini IA — Mme Amel Ben Ali',
        };

        this.exercisesBank.update((list) => [newEx, ...list]);
        return newEx;
      }
    } catch (err) {
      console.error('Error in autoTagAndAddDocument:', err);
    }
    return null;
  }

  addAnnouncement(announcementData: Partial<Announcement>) {
    const activeC = this.activeClass();
    const newA: Announcement = {
      id: 'a-' + Date.now(),
      title: announcementData.title || 'Nouvelle Annonce',
      classId: activeC.id,
      teacherName: activeC.teacherName,
      teacherAvatar: activeC.teacherAvatar,
      content: announcementData.content || '',
      category: announcementData.category || 'general',
      date: 'À l\'instant',
      likesCount: 0,
      confirmedByParentsCount: 0,
      isPinned: announcementData.isPinned || false,
    };

    this.announcements.update((list) => [newA, ...list]);
  }

  addCourse(courseData: Partial<Course>) {
    const activeC = this.activeClass();
    const newC: Course = {
      id: 'crs-' + Date.now(),
      title: courseData.title || 'Nouveau Cours',
      classId: activeC.id,
      subject: courseData.subject || 'Mathématiques',
      grade: courseData.grade || activeC.grade,
      teacherName: activeC.teacherName,
      summary: courseData.summary || '',
      content: courseData.content || '',
      viewsCount: 1,
      createdAt: 'Aujourd\'hui',
      tags: courseData.tags || ['Nouveau'],
      hasCorrection: true,
      upvotesCount: 1,
      watermarkText: `Madrasati TN — Document Certifié — ${activeC.teacherName}`,
    };

    this.courses.update((list) => [newC, ...list]);
  }

  addHomework(hwData: Partial<Homework>) {
    const activeC = this.activeClass();
    const newH: Homework = {
      id: 'hw-' + Date.now(),
      title: hwData.title || 'Nouveau Devoir',
      classId: activeC.id,
      subject: hwData.subject || 'Mathématiques',
      dueDate: hwData.dueDate || 'Demain à 18h00',
      instructions: hwData.instructions || '',
      exercises: hwData.exercises || [],
      totalPoints: hwData.totalPoints || 20,
      submissionsCount: 0,
      status: 'pending',
    };
    this.homeworks.update((list) => [newH, ...list]);
  }

  addExerciseToBank(ex: ExerciseItem) {
    this.exercisesBank.update((list) => [
      {
        ...ex,
        trimester: ex.trimester || 'Trimestre 1',
        docType: ex.docType || 'Série d\'Exercices',
        schoolYear: '2025-2026',
        hasCorrection: true,
        upvotesCount: 1,
        watermarkText: 'Madrasati TN — Document Certifié — Mme Amel Ben Ali',
      },
      ...list,
    ]);
  }

  confirmAnnouncementRead(announcementId: string) {
    this.announcements.update((list) =>
      list.map((a) =>
        a.id === announcementId
          ? { ...a, confirmedByParentsCount: a.confirmedByParentsCount + 1 }
          : a
      )
    );
  }

  submitHomeworkAnswer(hwId: string, textAnswer: string, photoUrl?: string) {
    const student = this.activeStudent();
    const newSub: Submission = {
      id: 'sub-' + Date.now(),
      homeworkId: hwId,
      studentId: student.id,
      studentName: student.name,
      studentAvatar: student.avatarUrl,
      submittedAt: 'À l\'instant',
      textAnswer,
      photoUrl,
      maxScore: 20,
      status: 'pending',
    };

    this.submissions.update((list) => [newSub, ...list]);
  }

  gradeSubmission(submissionId: string, score: number, feedback: string) {
    this.submissions.update((list) =>
      list.map((s) =>
        s.id === submissionId
          ? { ...s, score, feedback, status: 'graded' }
          : s
      )
    );
  }
}
