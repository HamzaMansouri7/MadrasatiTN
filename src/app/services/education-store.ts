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

  // Filters & Search State
  readonly searchQuery = signal<string>('');
  readonly selectedGradeFilter = signal<string>('Tous');
  readonly selectedSubjectFilter = signal<string>('Tous');
  readonly selectedTab = signal<'classes' | 'courses' | 'exercises' | 'announcements' | 'teachers'>('classes');

  // Mock Data Collections
  readonly classes = signal<ClassGroup[]>([
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
      rating: 4.9,
      reviewsCount: 128,
      verifiedBadge: true,
      subjects: ['Mathématiques', 'Éveil Scientifique'],
      bio: 'Enseignante passionnée depuis 12 ans. Spécialisée dans la pédagogie active des mathématiques et l’apprentissage logique pour le primaire tunisien.',
    },
    {
      id: 't-2',
      name: 'M. Karim Hammami',
      title: 'Enseignant de Français & Anglais',
      school: 'École Primaire Ibn Khaldoun, Tunis',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      coursesCount: 18,
      exercisesCount: 215,
      studentsCount: 480,
      rating: 4.8,
      reviewsCount: 94,
      verifiedBadge: true,
      subjects: ['Français', 'Anglais'],
      bio: 'Formateur certifié en langue française. Auteur de fiches de lecture et de préparation au Concours de 6ème.',
    },
    {
      id: 't-3',
      name: 'Mme Sonia Trabelsi',
      title: 'Enseignante de Langue Arabe',
      school: 'École Primaire Monji Slim, Marsa',
      avatarUrl: 'https://images.unsplash.com/photo-1580894732413-802c6769998b?w=150&auto=format&fit=crop&q=80',
      coursesCount: 31,
      exercisesCount: 410,
      studentsCount: 890,
      rating: 5.0,
      reviewsCount: 210,
      verifiedBadge: true,
      subjects: ['اللغة العربية', 'Éducation Islamique'],
      bio: 'استاذة تعليم ابتدائي. متخصصة في قواعد اللغة العربية والإنتاج الكتابي للمرحلة الابتدائي.',
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
    {
      id: 'st-2',
      name: 'Sarra Mansouri',
      grade: '6ème Année',
      school: 'École Primaire Ibn Khaldoun, Tunis',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      parentId: 'p-1',
      classId: 'c-6c',
      streakDays: 12,
      totalPoints: 2150,
      completedExercisesCount: 89,
      subjectsProgress: [
        { subject: 'Mathématiques', score: 91, color: '#10b981' },
        { subject: 'Français', score: 95, color: '#6366f1' },
        { subject: 'اللغة العربية', score: 89, color: '#f59e0b' },
        { subject: 'Histoire & Géographie', score: 94, color: '#ec4899' },
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
      content: 'Chers parents et élèves, le Devoir de Synthèse N°1 aura lieu jeudi prochain à 09h00. Les chapitres concernés sont : La multiplication des nombres de 0 à 999 999, la géométrie des droites perpendiculaires et la résolution de problèmes à deux étapes. Merci de bien réviser les séries publiées ci-dessous !',
      category: 'exam',
      date: 'Aujourd\'hui à 10:15',
      likesCount: 19,
      confirmedByParentsCount: 24,
      isPinned: true,
    },
    {
      id: 'a-2',
      title: '📚 Matériel nécessaire pour le cours d\'Éveil Scientifique',
      classId: 'c-4a',
      teacherName: 'Mme Amel Ben Ali',
      teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      content: 'Pour la séance de vendredi sur les états de la matière (eau liquide, vapeur, glace), veuillez rapporter un petit récipient transparent gradué si possible. Les groupes de travail sont déjà attribués.',
      category: 'supply',
      date: 'Hier à 14:30',
      likesCount: 12,
      confirmedByParentsCount: 20,
    },
    {
      id: 'a-3',
      title: '📝 Devoir à domicile : Vocabulaire & Grammaire',
      classId: 'c-6c',
      teacherName: 'M. Karim Hammami',
      teacherAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      content: 'Faire les exercices N° 3, 4 et 5 de la page 42 du Manuel de Français. La correction détaillée sera mise en ligne vendredi après-midi.',
      category: 'homework',
      date: 'Il y a 2 jours',
      likesCount: 15,
      confirmedByParentsCount: 22,
    },
  ]);

  readonly courses = signal<Course[]>([
    {
      id: 'crs-1',
      title: 'La multiplication des grands nombres (jusqu\'à 999 999)',
      classId: 'c-4a',
      subject: 'Mathématiques',
      grade: '4ème Année',
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
- Étape 3 : Additionner les deux résultats intermédiaires : $13~808 + 69~040 = 82~848$.

---

### 💡 Astuce de Mme Amel
N'oubliez jamais d'écrire proprement les retenues au-dessus des colonnes et d'aligner parfaitement les unités sous les unités !`,
      viewsCount: 342,
      createdAt: '22 Septembre 2026',
      tags: ['Calcul', 'Multiplication', 'Opérations', '4ème'],
      isBookmarked: true,
    },
    {
      id: 'crs-2',
      title: 'Écrire un texte narratif : Le cadre spatio-temporel et l\'action',
      classId: 'c-4a',
      subject: 'Français',
      grade: '4ème Année',
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
      tags: ['Production écrite', 'Rédaction', 'Français', '4ème'],
    },
    {
      id: 'crs-3',
      title: 'اللغة العربية : الجملة الاسمية ونواسخها (إنّ وأخواتها)',
      classId: 'c-4a',
      subject: 'اللغة العربية',
      grade: '4ème Année',
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
      tags: ['قواعد', 'إعراب', 'لغة عربية', '4 ابتدائي'],
    },
  ]);

  readonly homeworks = signal<Homework[]>([
    {
      id: 'hw-1',
      title: 'Série N°3 : Problèmes de Multiplication & Division',
      classId: 'c-4a',
      subject: 'Mathématiques',
      dueDate: 'Demain à 18h00',
      instructions: 'Résoudre les 3 exercices suivants sur votre cahier d\'exercices ou soumettre directement la photo sur l\'application.',
      submissionsCount: 22,
      totalPoints: 20,
      status: 'pending',
      exercises: [
        {
          id: 'ex-101',
          title: 'Exercice 1 : Le verger de l\'agriculteur',
          chapter: 'Multiplication & Problèmes',
          subject: 'Mathématiques',
          grade: '4ème Année',
          difficulty: 'Facile',
          promptText: 'Un agriculteur à Nabeul récolte 145 caisses d\'oranges. Chaque caisse pèse 24 kg. Quelle est la masse totale d\'oranges récoltées en kilogrammes ?',
          solutionText: 'Masse totale = 145 × 24 = 3 480 kg. L\'agriculteur a récolté 3 480 kg d\'oranges.',
          hints: ['Multipliez le nombre de caisses par le poids d\'une caisse.', 'Posez l\'opération : 145 × 24.'],
          points: 6,
        },
        {
          id: 'ex-102',
          title: 'Exercice 2 : Calcul réfléchi',
          chapter: 'Multiplication rapide',
          subject: 'Mathématiques',
          grade: '4ème Année',
          difficulty: 'Moyen',
          promptText: 'Effectuer mentalement en décomposant : 35 × 12.',
          solutionText: '35 × 12 = 35 × (10 + 2) = (35 × 10) + (35 × 2) = 350 + 70 = 420.',
          hints: ['Décomposez 12 en (10 + 2).', 'Multipliez d\'abord par 10 puis par 2.'],
          points: 6,
        },
        {
          id: 'ex-103',
          title: 'Exercice 3 : Géométrie et Périmètre',
          chapter: 'Périmètres des figures',
          subject: 'Mathématiques',
          grade: '4ème Année',
          difficulty: 'Avancé',
          promptText: 'Un terrain rectangulaire mesure 45 mètres de longueur et 28 mètres de largeur. Calculez son périmètre puis la longueur de grillage nécessaire si on laisse une porte de 3 mètres.',
          solutionText: 'Périmètre = (45 + 28) × 2 = 73 × 2 = 146 mètres.\nLongueur de grillage = 146 - 3 = 143 mètres.',
          hints: ['Rappel : Périmètre du rectangle = (Longueur + Largeur) × 2.', 'N\'oubliez pas de soustraire les 3m de la porte !'],
          points: 8,
        },
      ],
    },
    {
      id: 'hw-2',
      title: 'Devoir de Français : Conjugaison du Présent',
      classId: 'c-4a',
      subject: 'Français',
      dueDate: 'Vendredi 02 Octobre',
      instructions: 'Compléter les phrases avec les verbes entre parenthèses au présent de l\'indicatif.',
      submissionsCount: 18,
      totalPoints: 10,
      status: 'pending',
      exercises: [
        {
          id: 'ex-201',
          title: 'Exercice 1 : Verbes du 1er et 2ème groupe',
          chapter: 'Présent de l\'indicatif',
          subject: 'Français',
          grade: '4ème Année',
          difficulty: 'Facile',
          promptText: 'Conjuguer : "Les élèves (travailler) ..... avec attention et (finir) ..... leurs devoirs à l\'heure."',
          solutionText: 'Les élèves travaillent avec attention et finissent leurs devoirs à l\'heure.',
          hints: ['Le sujet "Les élèves" se remplace par "Ils".', 'Terminaison 1er groupe : -ent. Terminaison 2ème groupe : -issent.'],
          points: 10,
        },
      ],
    },
  ]);

  readonly submissions = signal<Submission[]>([
    {
      id: 'sub-1',
      homeworkId: 'hw-1',
      studentId: 'st-1',
      studentName: 'Ahmed Mansouri',
      studentAvatar: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=150&auto=format&fit=crop&q=80',
      submittedAt: 'Aujourd\'hui à 11:20',
      textAnswer: '1) 145 x 24 = 3480 kg.\n2) 35 x 12 = 35 x 10 + 35 x 2 = 350 + 70 = 420.\n3) Périmètre = (45 + 28) x 2 = 146 m. Grillage = 146 - 3 = 143 m.',
      photoUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
      score: 19,
      maxScore: 20,
      feedback: 'Excellent travail Ahmed ! Très bonne présentation et calculs exacts. Continue ainsi !',
      status: 'graded',
    },
  ]);

  // Public Exercises Repository (Searchable Bank)
  readonly exercisesBank = signal<ExerciseItem[]>([
    {
      id: 'bank-1',
      title: 'Problème de géométrie : Aires et Périmètres',
      chapter: 'Géométrie',
      subject: 'Mathématiques',
      grade: '4ème Année',
      difficulty: 'Moyen',
      promptText: 'Un jardin carré a un côté de 15 mètres. Calculez son périmètre et son aire.',
      solutionText: 'Périmètre = 15 × 4 = 60 m. Aire = 15 × 15 = 225 m².',
      hints: ['Périmètre d\'un carré = Côté × 4', 'Aire d\'un carré = Côté × Côté'],
      points: 10,
    },
    {
      id: 'bank-2',
      title: 'Accord de l\'adjectif qualificatif',
      chapter: 'Grammaire',
      subject: 'Français',
      grade: '4ème Année',
      difficulty: 'Facile',
      promptText: 'Accorder correctement : "Des fillettes (joyeux) ..... jouent dans une cour (vert) ....."',
      solutionText: 'Des fillettes joyeuses jouent dans une cour verte.',
      hints: ['Fillettes est un nom féminin pluriel.', 'Cour est un nom féminin singulier.'],
      points: 10,
    },
    {
      id: 'bank-3',
      title: 'تمرين في التميين والإعراب',
      chapter: 'قواعد اللغة',
      subject: 'اللغة العربية',
      grade: '5ème Année',
      difficulty: 'Avancé',
      promptText: 'أعرب الكلمة المسطرة : "قَرَأَ الطَّالِبُ **كِتَاباً** مُمِتِعاً."',
      solutionText: 'كِتَاباً : مَفْعُولٌ بِهِ مَنْصُوبٌ وَعَلاَمَةُ نَصْبِهِ التَّنْوِينُ الفَتْحُ الظَّاهِرُ عَلَى آخِرِهِ.',
      hints: ['اسأل نفسك : ماذا قرأ الطالب؟', 'الجواب عن "ماذا" يكون مفعولاً به.'],
      points: 10,
    },
    {
      id: 'bank-4',
      title: 'Éveil Scientifique : Les circuits électriques simples',
      chapter: 'Physique & Électricité',
      subject: 'Éveil Scientifique',
      grade: '5ème Année',
      difficulty: 'Moyen',
      promptText: 'Quels sont les trois composants indispensables pour faire briller une ampoule dans un circuit fermé ?',
      solutionText: '1. Une pile (générateur)\n2. Une ampoule (récepteur)\n3. Des fils conducteurs de connexion.',
      hints: ['Il faut une source d\'énergie, un composant qui s\'allume et des liaisons.'],
      points: 10,
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

  readonly filteredCourses = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const g = this.selectedGradeFilter();
    const s = this.selectedSubjectFilter();

    return this.courses().filter((course) => {
      const matchQ =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.summary.toLowerCase().includes(q) ||
        course.tags.some((t) => t.toLowerCase().includes(q));
      const matchG = g === 'Tous' || course.grade === g;
      const matchS = s === 'Tous' || course.subject === s;
      return matchQ && matchG && matchS;
    });
  });

  readonly filteredExercisesBank = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const g = this.selectedGradeFilter();
    const s = this.selectedSubjectFilter();

    return this.exercisesBank().filter((ex) => {
      const matchQ =
        !q ||
        ex.title.toLowerCase().includes(q) ||
        ex.promptText.toLowerCase().includes(q) ||
        ex.chapter.toLowerCase().includes(q);
      const matchG = g === 'Tous' || ex.grade === g;
      const matchS = s === 'Tous' || ex.subject === s;
      return matchQ && matchG && matchS;
    });
  });

  readonly activeTeacherProfile = computed(() => {
    return this.teachers()[0]; // Mme Amel Ben Ali default
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

  setSearchQuery(q: string) {
    this.searchQuery.set(q);
  }

  setGradeFilter(g: string) {
    this.selectedGradeFilter.set(g);
  }

  setSubjectFilter(s: string) {
    this.selectedSubjectFilter.set(s);
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
    };

    this.courses.update((list) => [newC, ...list]);
  }

  addHomework(hwData: Partial<Homework>) {
    const activeC = this.activeClass();
    const newHw: Homework = {
      id: 'hw-' + Date.now(),
      title: hwData.title || 'Nouveau Devoir',
      classId: activeC.id,
      subject: hwData.subject || 'Mathématiques',
      dueDate: hwData.dueDate || 'Demain',
      instructions: hwData.instructions || '',
      submissionsCount: 0,
      totalPoints: hwData.totalPoints || 20,
      status: 'pending',
      exercises: hwData.exercises || [],
    };

    this.homeworks.update((list) => [newHw, ...list]);
  }

  addExerciseToBank(ex: ExerciseItem) {
    this.exercisesBank.update((list) => [ex, ...list]);
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
