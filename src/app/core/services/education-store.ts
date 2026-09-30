import { Injectable, computed, signal } from '@angular/core';
import {
  Announcement,
  BlogPost,
  BlogComment,
  ClassGroup,
  Comment,
  Course,
  ExerciseItem,
  Homework,
  QuestionThread,
  QuestionAnswer,
  StudentProfile,
  Submission,
  TeacherProfile,
  UserRole,
  SubjectName,
  GradeLevel,
} from '../models/education.model';
import { CNP_PRIMARY_COURSES } from '../data/cnp-books.data';

@Injectable({
  providedIn: 'root',
})
export class EducationStore {
  // Current active role ('home' by default shows the landing page)
  readonly currentRole = signal<UserRole>('home');

  setRole(role: UserRole) {
    this.currentRole.set(role);
  }

  // Multi-Palette & Mode Theme Engine
  readonly activePalette = signal<'green' | 'blue'>('green');
  readonly activeMode = signal<'light' | 'dark'>('light');

  setPalette(palette: 'green' | 'blue') {
    this.activePalette.set(palette);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-palette', palette);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('madrasati_palette', palette);
    }
  }

  togglePalette() {
    this.setPalette(this.activePalette() === 'green' ? 'blue' : 'green');
  }

  setMode(mode: 'light' | 'dark') {
    this.activeMode.set(mode);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-mode', mode);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('madrasati_mode', mode);
    }
  }

  toggleMode() {
    this.setMode(this.activeMode() === 'light' ? 'dark' : 'light');
  }

  // Auth Modal State
  readonly isAuthModalOpen = signal<boolean>(false);
  readonly authModalMode = signal<'login' | 'signup'>('login');
  readonly authModalRole = signal<'teacher' | 'parent' | 'student'>('teacher');

  openLoginModal() {
    this.authModalMode.set('login');
    this.isAuthModalOpen.set(true);
  }

  openSignupModal(role: 'teacher' | 'parent' | 'student' = 'teacher') {
    this.authModalRole.set(role);
    this.authModalMode.set('signup');
    this.isAuthModalOpen.set(true);
  }

  closeAuthModal() {
    this.isAuthModalOpen.set(false);
  }

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

  // Watchlist & Favorites State
  readonly watchlist = signal<{
    courses: string[];
    exercises: string[];
    teachers: string[];
  }>({
    courses: ['c-1', 'c-3'],
    exercises: ['ex-1'],
    teachers: ['t-1'],
  });

  // Comments / Q&A State
  readonly comments = signal<Comment[]>([
    {
      id: 'cmt-1',
      targetId: 'crs-1',
      targetType: 'course',
      authorName: 'Enseignant Certifié',
      authorRole: 'teacher',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      text: 'Bonne lecture à tous ! N\'hésitez pas à poser vos questions sur les étapes de calcul — je réponds chaque soir.',
      createdAt: 'Il y a 2 jours',
      likes: 14,
      replies: [
        {
          id: 'cmt-1-r1',
          targetId: 'crs-1',
          targetType: 'course',
          authorName: 'Parent d\'élève',
          authorRole: 'parent',
          text: 'Merci pour ce document clair et utile pour la révision.',
          createdAt: 'Il y a 1 jour',
          likes: 5,
        },
      ],
    },
    {
      id: 'cmt-2',
      targetId: 'crs-1',
      targetType: 'course',
      authorName: 'Parent d\'élève',
      authorRole: 'parent',
      text: 'Excellente fiche de révision, très bien structurée.',
      createdAt: 'Il y a 3 jours',
      likes: 8,
      replies: [],
    },
    {
      id: 'cmt-3',
      targetId: 'bank-1',
      targetType: 'exercise',
      authorName: 'Enseignant Certifié',
      authorRole: 'teacher',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      text: 'Attention ! Pour l\'aire du carré, n\'oubliez pas d\'écrire l\'unité m² (mètres carrés) sinon vous perdez 0.5 point.',
      createdAt: 'Il y a 3 jours',
      likes: 22,
      replies: [],
    },
  ]);

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
      name: '4ème Année A (Primaire)',
      grade: '4ème Année',
      teacherId: 't-1',
      teacherName: 'Enseignant(e) Référent(e)',
      teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      schoolName: 'École Primaire Habib Bourguiba, Ariana',
      studentCount: 28,
      code: '4A-2026',
      scheduleSummary: 'Lu - Ve : 08h00 - 13h00',
    },
    {
      id: 'c-4b',
      name: '4ème Année B (Primaire)',
      grade: '4ème Année',
      teacherId: 't-1',
      teacherName: 'Enseignant(e) Référent(e)',
      teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      schoolName: 'École Primaire Habib Bourguiba, Ariana',
      studentCount: 31,
      code: '4B-2026',
      scheduleSummary: 'Lu - Ve : 08h00 - 13h00',
    },
    {
      id: 'c-5a',
      name: '5ème Année A (Primaire)',
      grade: '5ème Année',
      teacherId: 't-7',
      teacherName: 'Enseignant(e) Référent(e)',
      teacherAvatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
      schoolName: 'École Primaire Habib Bourguiba, Ariana',
      studentCount: 30,
      code: '5A-2026',
      scheduleSummary: 'Lu - Ve : 08h00 - 13h00',
    },
    {
      id: 'c-6c',
      name: '6ème Année C (Primaire)',
      grade: '6ème Année',
      teacherId: 't-2',
      teacherName: 'Enseignant(e) Référent(e)',
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
      name: 'Enseignant Certifié',
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
      name: 'Enseignant Certifié (Français)',
      title: 'Enseignant de Français & Anglais (6ème Concours)',
      school: 'École Primaire Tunisienne',
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
      name: 'Enseignante Certifiée (Arabe)',
      title: 'Enseignante de Langue Arabe (5ème & 6ème)',
      school: 'École Primaire Tunisienne',
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
      name: 'Élève',
      grade: '4ème Année',
      school: 'École Primaire Tunisienne',
      avatarUrl: '',
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
      teacherName: 'Enseignant Certifié',
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
      watermarkText: 'Madrasati TN — Document Pédagogique Conforme',
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
      watermarkText: 'Madrasati TN — Document Pédagogique Conforme',
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
      hints: ['Il faut une source d\'énergie, un composant qui s\'allume et des liaisons.'],
      points: 10,
      upvotesCount: 42,
      isUpvoted: false,
      reportedCount: 0,
      watermarkText: 'Madrasati TN — Document Certifié — Enseignant Certifié',
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

  // Watchlist Computeds
  readonly watchedCourses = computed(() => {
    const ids = new Set(this.watchlist().courses);
    return this.courses().filter((c) => ids.has(c.id));
  });

  readonly watchedExercises = computed(() => {
    const ids = new Set(this.watchlist().exercises);
    return this.exercisesBank().filter((e) => ids.has(e.id));
  });

  readonly watchedTeachers = computed(() => {
    const ids = new Set(this.watchlist().teachers);
    return this.teachers().filter((t) => ids.has(t.id));
  });

  readonly totalWatchlistCount = computed(() => {
    const w = this.watchlist();
    return w.courses.length + w.exercises.length + w.teachers.length;
  });

  constructor() {
    if (typeof localStorage !== 'undefined') {
      try {
        const savedPalette = localStorage.getItem('madrasati_palette') as 'green' | 'blue' | null;
        if (savedPalette && (savedPalette === 'green' || savedPalette === 'blue')) {
          this.setPalette(savedPalette);
        } else if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-palette', 'green');
        }

        const savedMode = localStorage.getItem('madrasati_mode') as 'light' | 'dark' | null;
        if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
          this.setMode(savedMode);
        } else if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-mode', 'light');
        }

        const savedWl = localStorage.getItem('madrasati_watchlist');
        if (savedWl) this.watchlist.set(JSON.parse(savedWl));
        const savedCmt = localStorage.getItem('madrasati_comments');
        if (savedCmt) this.comments.set(JSON.parse(savedCmt));
      } catch (e) {
        console.warn('Failed to load from localStorage', e);
      }
    }
  }

  // ── Comment / Q&A Methods ──────────────────────────────────────────────────

  getComments(targetId: string): Comment[] {
    return this.comments().filter((c) => c.targetId === targetId);
  }

  addComment(targetId: string, targetType: 'course' | 'exercise', text: string, authorName: string, authorRole: Comment['authorRole'], authorAvatar?: string) {
    const newComment: Comment = {
      id: 'cmt-' + Date.now(),
      targetId,
      targetType,
      authorName,
      authorRole,
      authorAvatar,
      text,
      createdAt: 'À l\'instant',
      likes: 0,
      replies: [],
    };
    this.comments.update((list) => {
      const updated = [newComment, ...list];
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('madrasati_comments', JSON.stringify(updated));
      }
      return updated;
    });
  }

  addReply(parentCommentId: string, text: string, authorName: string, authorRole: Comment['authorRole'], authorAvatar?: string) {
    this.comments.update((list) => {
      const updated = list.map((c) => {
        if (c.id === parentCommentId) {
          const reply: Comment = {
            id: 'cmt-' + Date.now(),
            targetId: c.targetId,
            targetType: c.targetType,
            authorName,
            authorRole,
            authorAvatar,
            text,
            createdAt: 'À l\'instant',
            likes: 0,
          };
          return { ...c, replies: [...(c.replies || []), reply] };
        }
        return c;
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('madrasati_comments', JSON.stringify(updated));
      }
      return updated;
    });
  }

  likeComment(commentId: string, parentId?: string) {
    this.comments.update((list) => {
      const updated = list.map((c) => {
        if (!parentId && c.id === commentId) {
          return { ...c, likes: c.likes + (c.isLiked ? -1 : 1), isLiked: !c.isLiked };
        }
        if (parentId && c.id === parentId) {
          return {
            ...c,
            replies: (c.replies || []).map((r) =>
              r.id === commentId
                ? { ...r, likes: r.likes + (r.isLiked ? -1 : 1), isLiked: !r.isLiked }
                : r
            ),
          };
        }
        return c;
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('madrasati_comments', JSON.stringify(updated));
      }
      return updated;
    });
  }

  isWatched(id: string, type: 'course' | 'exercise' | 'teacher'): boolean {
    const w = this.watchlist();
    if (type === 'course') return w.courses.includes(id);
    if (type === 'exercise') return w.exercises.includes(id);
    if (type === 'teacher') return w.teachers.includes(id);
    return false;
  }

  toggleWatchlist(id: string, type: 'course' | 'exercise' | 'teacher') {
    this.watchlist.update((curr) => {
      let updated = { ...curr };
      if (type === 'course') {
        const exists = curr.courses.includes(id);
        updated.courses = exists
          ? curr.courses.filter((c) => c !== id)
          : [...curr.courses, id];
      } else if (type === 'exercise') {
        const exists = curr.exercises.includes(id);
        updated.exercises = exists
          ? curr.exercises.filter((e) => e !== id)
          : [...curr.exercises, id];
      } else if (type === 'teacher') {
        const exists = curr.teachers.includes(id);
        updated.teachers = exists
          ? curr.teachers.filter((t) => t !== id)
          : [...curr.teachers, id];
      }

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('madrasati_watchlist', JSON.stringify(updated));
      }
      return updated;
    });
  }

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
          watermarkText: 'Madrasati TN — Auto-Tagué par Gemini IA — Enseignant Certifié',
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
        watermarkText: 'Madrasati TN — Document Certifié — Enseignant Certifié',
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

  // ================= BLOG & PEDAGOGICAL ARTICLES =================
  readonly blogPosts = signal<BlogPost[]>([
    {
      id: 'blog-1',
      title: 'Guide Pratique : Comment préparer son enfant au Concours de 6ème (مناظرة السيزيام) ?',
      titleAr: 'دليل عملي : كيف تجهز ابنك لاجتياز مناظرة السيزيام (السنة 6) بنجاح وهدوء ؟',
      excerpt: 'Les 5 piliers essentiels recommandés par les maîtres d\'école pour organiser les révisions de fin de cycle primaire sans stress.',
      excerptAr: 'الركائز الـ5 الأساسية الموصى بها من معلمي التعليم الابتدائي لتنظيم مراجعة نهاية المرحلة الابتدائية دون ضغط.',
      content: `### 1. La régularité plutôt que l'intensité
Il est crucial d'instaurer des sessions courtes (30 à 45 minutes) chaque jour plutôt que de longs marathons de travail le weekend.

### 2. Maîtriser le barème officiel du Ministère
Les épreuves de Mathématiques et de Langue Arabe reposent sur des compétences clés :
- Résolution de problèmes à étapes multiples en Mathématiques
- Production écrite structurée (schéma narratif) en Français et en Arabe

### 3. Exploiter les fiches et manuels officiels CNP
Les sujets de concours s'inspirent directement des manuels scolaires officiels tunisiens. Utilisez la banque de fiches A4 imprimables sur Madrasati TN pour des entraînements réels.`,
      contentAr: `### 1. المواظبة اليومية خير من التكديس
من الضروري اعتماد جلسات مراجعة مركزة وقصيرة (30 إلى 45 دقيقة يومياً) بدلاً من الإرهاق في نهاية الأسبوع.

### 2. فهم سلم التقييم الرسمي لوزارة التربية
ترتكز امتحانات المناظرة في الرياضيات واللغة العربية على كفايات محددة :
- حل المسائل ذات المراحل المتعددة
- الإنتاج الكتابي المنظم وفق الشواهد والروابط السليمة

### 3. الاعتماد على المناهج والكتب الرسمية للمركز الوطني البيداغوجي (CNP)
جميع مواضيع المناظرة تستند حرفياً إلى محاور البرامج الرسمية التونسية.`,
      authorId: 't-1',
      authorName: 'Enseignant Certifié (Mathématiques)',
      authorTitle: 'Maître Principal d\'École Primaire',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      subject: 'Mathématiques',
      grade: '6ème Année',
      tags: ['مناظرة', 'نصائح بيداغوجية', 'السادسة ابتدائي'],
      publishedAt: 'Il y a 3 jours',
      likesCount: 142,
      readTimeMinutes: 4,
      attachedCourseId: 'crs-1',
      comments: [
        {
          id: 'b-c-1',
          postId: 'blog-1',
          authorName: 'Parent d\'élève',
          authorRole: 'parent',
          content: 'Merci infiniment pour ces conseils précieux ! Nous allons appliquer le planning dès ce trimestre.',
          createdAt: 'Il y a 2 jours',
          likesCount: 12,
        },
      ],
    },
    {
      id: 'blog-2',
      title: 'Calcul Mental et Pédagogie Active : 4 astuces pour la 3ème et 4ème Année',
      titleAr: 'الحساب الذهني والبيداغوجيا النشيطة : 4 حيل لتلاميذ السنتين 3 و 4 ابتدائي',
      excerpt: 'Comment aider votre enfant à mémoriser les tables de multiplication et développer des automatismes de calcul rapide.',
      excerptAr: 'كيف تساعد طفلك على ترسيخ جداول الضرب وتنمية آليات الحساب السريع بكل متعة ودون تعقيد.',
      content: `### Le constat
Le calcul mental est la pierre angulaire de la réussite en mathématiques au primaire.

### Les 4 astuces clés :
1. **La décomposition par dizaines** : $14 \\times 5 = (10 \\times 5) + (4 \\times 5) = 50 + 20 = 70$.
2. **Le jeu des cartes flash** : 5 minutes de rituel le matin ou le soir.
3. **L'estimation avant le calcul posé** : Toujours demander "À ton avis, le résultat sera proche de combien ?".
4. **La feuille d'entraînement A4 imprimable** : Imprimez chaque semaine une série chronométrée de 10 calculs.`,
      contentAr: `### أهمية الحساب الذهني
يمثل الحساب الذهني حجر الأساس للتفوق في الرياضيات في المرحلة الابتدائية.

### الحيل الـ4 الأساسية :
1. **التفكيك إلى عشرات وآحاد** : تسهيل الحساب ذهنياً عبر جمع المضاعفات.
2. **البطاقات السريعة (Flashcards)** : 5 دقائق يومياً في شكل لعبة عائلية.
3. **التخمين والتقدير المسبق** : تعويد التلميذ على توقع رتبة النتيجة قبل الحساب.
4. **أوراق التدريب A4 المطبوعة** : تخصيص ورقة تدريب أسبوعية من بنك الوثائق.`,
      authorId: 't-2',
      authorName: 'Enseignant Certifié (Français)',
      authorTitle: 'Enseignant Référent Primaire',
      authorAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      subject: 'Mathématiques',
      grade: '4ème Année',
      tags: ['حساب ذهني', 'رياضيات', '4 ابتدائي'],
      publishedAt: 'Il y a 5 jours',
      likesCount: 98,
      readTimeMinutes: 3,
      comments: [],
    },
  ]);

  // ================= PARENT-TEACHER Q&A THREADS =================
  readonly questionThreads = signal<QuestionThread[]>([
    {
      id: 'q-1',
      title: 'Demande d\'exercices complémentaires sur la géométrie (droites perpendiculaires)',
      content: 'Bonjour chers enseignants, mon enfant en 4ème année a des difficultés à manipuler l\'équerre pour tracer des droites perpendiculaires. Auriez-vous une fiche avec des pas-à-pas illustrés ? Merci !',
      subject: 'Mathématiques',
      grade: '4ème Année',
      parentName: 'Parent d\'élève (Ariana)',
      createdAt: 'Hier à 16:30',
      answers: [
        {
          id: 'ans-1',
          threadId: 'q-1',
          teacherId: 't-1',
          teacherName: 'Enseignant Certifié',
          teacherTitle: 'Maître Principal de Mathématiques',
          teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          content: 'Bonjour ! C\'est une difficulté fréquente au premier trimestre. J\'ai publié une fiche pratique avec 6 exercices progressifs et repères visuels. Vous pouvez l\'imprimer directement ci-dessous.',
          attachedDocId: 'crs-1',
          attachedDocTitle: 'Fiche A4 : Géométrie et Tracés à l\'équerre (4ème)',
          createdAt: 'Hier à 18:15',
          isVerifiedAnswer: true,
          likesCount: 15,
        },
      ],
    },
    {
      id: 'q-2',
      title: 'Comment structurer le paragraphe d\'expression écrite en Arabe (السنة الخامسة) ?',
      content: 'السلام عليكم، أبحث عن منهجية مبسطة لمساعدة ابني على إنتاج نص سردي باللغة العربية دون الوقوع في التكرار واستعمال الروابط المناسبة.',
      subject: 'اللغة العربية',
      grade: '5ème Année',
      parentName: 'ولي أمر (سوسة)',
      createdAt: 'Il y a 2 jours',
      answers: [
        {
          id: 'ans-2',
          threadId: 'q-2',
          teacherId: 't-3',
          teacherName: 'Enseignante Certifiée (Arabe)',
          teacherTitle: 'أستاذة لغة عربية بالتعليم الابتدائي',
          teacherAvatar: 'https://images.unsplash.com/photo-1580894732413-802c6769998b?w=150&auto=format&fit=crop&q=80',
          content: 'وعليكم السلام ورحمة الله. أفضل طريقة هي تدريب التلميذ على جدول المراحل الثلاث (وضع البداية، التحول وسير الأحداث، وضع النهاية) مع وضع قائمة بروابط الربط والزمان في أعلى الورقة.',
          attachedDocId: 'crs-3',
          attachedDocTitle: 'ملخص بيداغوجي : هيكل الإنتاج الكتابي للسنة 5',
          createdAt: 'Il y a 2 jours',
          isVerifiedAnswer: true,
          likesCount: 28,
        },
      ],
    },
  ]);

  addBlogPost(post: Omit<BlogPost, 'id' | 'publishedAt' | 'likesCount' | 'comments'>) {
    const newPost: BlogPost = {
      ...post,
      id: 'blog-' + Date.now(),
      publishedAt: 'À l\'instant',
      likesCount: 1,
      comments: [],
    };
    this.blogPosts.update((list) => [newPost, ...list]);
  }

  likeBlogPost(postId: string) {
    this.blogPosts.update((list) =>
      list.map((p) => (p.id === postId ? { ...p, likesCount: p.likesCount + 1 } : p))
    );
  }

  addBlogComment(
    postId: string,
    commentOrContent: string | { authorName: string; authorRole: 'teacher' | 'parent'; content: string },
    authorName?: string,
    authorRole?: 'teacher' | 'parent'
  ) {
    const content = typeof commentOrContent === 'string' ? commentOrContent : commentOrContent.content;
    const author = typeof commentOrContent === 'string' ? (authorName || 'Parent d\'élève') : commentOrContent.authorName;
    const role = typeof commentOrContent === 'string' ? (authorRole || 'parent') : commentOrContent.authorRole;

    const newComment: BlogComment = {
      id: 'b-c-' + Date.now(),
      postId,
      authorName: author,
      authorRole: role,
      content,
      createdAt: 'À l\'instant',
      likesCount: 0,
    };
    this.blogPosts.update((list) =>
      list.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p))
    );
  }

  addQuestionThread(
    threadOrTitle: string | { title: string; content: string; subject: SubjectName; grade: GradeLevel; parentName: string },
    content?: string,
    subject?: SubjectName,
    grade?: GradeLevel,
    parentName?: string
  ) {
    let tTitle: string;
    let tContent: string;
    let tSubject: SubjectName;
    let tGrade: GradeLevel;
    let tParent: string;

    if (typeof threadOrTitle === 'string') {
      tTitle = threadOrTitle;
      tContent = content || '';
      tSubject = subject || 'Mathématiques';
      tGrade = grade || '4ème Année';
      tParent = parentName || 'Parent d\'élève';
    } else {
      tTitle = threadOrTitle.title;
      tContent = threadOrTitle.content;
      tSubject = threadOrTitle.subject;
      tGrade = threadOrTitle.grade;
      tParent = threadOrTitle.parentName || 'Parent d\'élève';
    }

    const newThread: QuestionThread = {
      id: 'q-' + Date.now(),
      title: tTitle,
      content: tContent,
      subject: tSubject,
      grade: tGrade,
      parentName: tParent,
      createdAt: 'À l\'instant',
      answers: [],
    };
    this.questionThreads.update((list) => [newThread, ...list]);
  }

  addAnswerToQuestion(
    threadId: string,
    answerOrContent: string | { teacherName: string; teacherTitle: string; content: string; attachedDocId?: string; attachedDocTitle?: string; isVerifiedAnswer?: boolean },
    teacherName?: string,
    teacherTitle?: string,
    attachedDocId?: string,
    attachedDocTitle?: string
  ) {
    let aContent: string;
    let aTeacherName: string;
    let aTeacherTitle: string;
    let aAttachedDocId: string | undefined;
    let aAttachedDocTitle: string | undefined;

    if (typeof answerOrContent === 'string') {
      aContent = answerOrContent;
      aTeacherName = teacherName || 'Enseignant Certifié';
      aTeacherTitle = teacherTitle || 'Enseignant Référent';
      aAttachedDocId = attachedDocId;
      aAttachedDocTitle = attachedDocTitle;
    } else {
      aContent = answerOrContent.content;
      aTeacherName = answerOrContent.teacherName || 'Enseignant Certifié';
      aTeacherTitle = answerOrContent.teacherTitle || 'Enseignant Référent';
      aAttachedDocId = answerOrContent.attachedDocId;
      aAttachedDocTitle = answerOrContent.attachedDocTitle;
    }

    const newAns: QuestionAnswer = {
      id: 'ans-' + Date.now(),
      threadId,
      teacherId: 't-current',
      teacherName: aTeacherName,
      teacherTitle: aTeacherTitle,
      content: aContent,
      attachedDocId: aAttachedDocId,
      attachedDocTitle: aAttachedDocTitle,
      createdAt: 'À l\'instant',
      isVerifiedAnswer: true,
      likesCount: 0,
    };

    this.questionThreads.update((list) =>
      list.map((t) => (t.id === threadId ? { ...t, answers: [...t.answers, newAns] } : t))
    );
  }
}
