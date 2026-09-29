export type UserRole = 'teacher' | 'parent' | 'student' | 'public';

export type GradeLevel =
  | '1ère Année'
  | '2ème Année'
  | '3ème Année'
  | '4ème Année'
  | '5ème Année'
  | '6ème Année'
  | '7ème de base'
  | '8ème de base'
  | '9ème de base';

export type SubjectName =
  | 'Mathématiques'
  | 'Français'
  | 'اللغة العربية'
  | 'Éveil Scientifique'
  | 'Histoire & Géographie'
  | 'Anglais'
  | 'Informatique'
  | 'Éducation Islamique';

export type Trimester = 'Trimestre 1' | 'Trimestre 2' | 'Trimestre 3';

export type DocType =
  | 'Devoir de Contrôle'
  | 'Devoir de Synthèse'
  | 'Fiche de Révision'
  | 'Série d\'Exercices';

export interface ExerciseItem {
  id: string;
  title: string;
  chapter: string;
  subject: SubjectName;
  grade: GradeLevel;
  trimester?: Trimester;
  docType?: DocType;
  schoolYear?: string;
  difficulty: 'Facile' | 'Moyen' | 'Avancé';
  promptText: string;
  photoUrl?: string;
  options?: string[];
  correctAnswer?: string;
  solutionText: string;
  hasCorrection?: boolean;
  hints: string[];
  points: number;
  upvotesCount?: number;
  isUpvoted?: boolean;
  reportedCount?: number;
  isReported?: boolean;
  watermarkText?: string;
}

export interface Homework {
  id: string;
  title: string;
  classId: string;
  subject: SubjectName;
  dueDate: string;
  instructions: string;
  exercises: ExerciseItem[];
  totalPoints: number;
  submissionsCount: number;
  status: 'pending' | 'submitted' | 'corrected';
}

export interface Submission {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  submittedAt: string;
  textAnswer?: string;
  photoUrl?: string;
  score?: number;
  maxScore: number;
  feedback?: string;
  status: 'pending' | 'graded';
}

export interface ClassGroup {
  id: string;
  name: string;
  grade: GradeLevel;
  teacherId: string;
  teacherName: string;
  teacherAvatar: string;
  schoolName: string;
  studentCount: number;
  code: string;
  scheduleSummary: string;
}

export interface Course {
  id: string;
  title: string;
  classId: string;
  subject: SubjectName;
  grade: GradeLevel;
  trimester?: Trimester;
  docType?: DocType;
  schoolYear?: string;
  teacherName: string;
  summary: string;
  content: string;
  pdfUrl?: string;
  audioUrl?: string;
  viewsCount: number;
  createdAt: string;
  tags: string[];
  isBookmarked?: boolean;
  hasCorrection?: boolean;
  upvotesCount?: number;
  isUpvoted?: boolean;
  reportedCount?: number;
  isReported?: boolean;
  watermarkText?: string;
}

export interface Announcement {
  id: string;
  title: string;
  classId: string;
  teacherName: string;
  teacherAvatar: string;
  content: string;
  category: 'urgent' | 'homework' | 'exam' | 'general' | 'supply';
  date: string;
  likesCount: number;
  confirmedByParentsCount: number;
  isPinned?: boolean;
}

export interface TeacherProfile {
  id: string;
  name: string;
  title: string;
  school: string;
  avatarUrl: string;
  coursesCount: number;
  exercisesCount: number;
  studentsCount: number;
  totalUploads?: number;
  downloadableExercisesCount?: number;
  rating: number;
  reviewsCount: number;
  verifiedBadge: boolean;
  subjects: SubjectName[];
  bio: string;
  starRatingBreakdown?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface StudentProfile {
  id: string;
  name: string;
  grade: GradeLevel;
  school: string;
  avatarUrl: string;
  parentId: string;
  classId: string;
  streakDays: number;
  totalPoints: number;
  completedExercisesCount: number;
  subjectsProgress: {
    subject: SubjectName;
    score: number;
    color: string;
  }[];
}
