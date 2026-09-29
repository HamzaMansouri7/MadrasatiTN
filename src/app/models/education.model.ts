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

export interface ExerciseItem {
  id: string;
  title: string;
  chapter: string;
  subject: SubjectName;
  grade: GradeLevel;
  difficulty: 'Facile' | 'Moyen' | 'Avancé';
  promptText: string;
  photoUrl?: string;
  options?: string[]; // for MCQs
  correctAnswer?: string;
  solutionText: string;
  hints: string[];
  points: number;
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
  name: string; // e.g. "4ème A — Classe Mme Amel"
  grade: GradeLevel;
  teacherId: string;
  teacherName: string;
  teacherAvatar: string;
  schoolName: string; // e.g. "École Primaire Habib Bourguiba, Ariana"
  studentCount: number;
  code: string; // e.g. "4A-2026"
  scheduleSummary: string;
}

export interface Course {
  id: string;
  title: string;
  classId: string;
  subject: SubjectName;
  grade: GradeLevel;
  teacherName: string;
  summary: string;
  content: string;
  pdfUrl?: string;
  audioUrl?: string;
  viewsCount: number;
  createdAt: string;
  tags: string[];
  isBookmarked?: boolean;
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
  name: string; // e.g. "Mme Amel Ben Ali"
  title: string; // e.g. "Enseignante Principale de Mathématiques & Sciences"
  school: string;
  avatarUrl: string;
  coursesCount: number;
  exercisesCount: number;
  studentsCount: number;
  rating: number;
  reviewsCount: number;
  verifiedBadge: boolean;
  subjects: SubjectName[];
  bio: string;
}

export interface StudentProfile {
  id: string;
  name: string; // e.g. "Ahmed Mansouri"
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
    score: number; // 0 - 100%
    color: string;
  }[];
}
