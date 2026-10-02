import { Routes } from '@angular/router';
import { authGuard } from '@core';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing-home').then((m) => m.LandingHomeComponent),
    title: 'Madrasati TN | مدرستي تونس - المنصة التعليمية التونسية',
  },
  {
    path: 'teacher',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/teacher/teacher-home').then((m) => m.TeacherHomeComponent),
    title: 'فضاء المعلم | Espace Enseignant - Madrasati TN',
  },
  {
    path: 'parent',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/parent/parent-home').then((m) => m.ParentHomeComponent),
    title: 'فضاء الولي | Espace Parent - Madrasati TN',
  },
  {
    path: 'student',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/student/student-home').then((m) => m.StudentHomeComponent),
    title: 'فضاء التلميذ | Espace Élève - Madrasati TN',
  },
  {
    path: 'discovery',
    loadComponent: () =>
      import('./features/discovery/public-discovery').then((m) => m.PublicDiscoveryComponent),
    title: 'المكتبة والدليل | Bibliothèque CNP - Madrasati TN',
  },
  {
    path: 'solve',
    loadComponent: () =>
      import('./features/solve/solve-home').then((m) => m.SolveHomeComponent),
    title: 'صوّر التمرين واحصل على الحل | Photo-Solution - Madrasati TN',
  },
  {
    path: 'editor',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/editor/editor-studio').then((m) => m.EditorStudioComponent),
    title: 'استوديو الوثائق | Studio Imprimable A4 - Madrasati TN',
  },
  {
    path: 'article-studio',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/article-studio/article-studio').then((m) => m.ArticleStudioComponent),
    title: 'استوديو المقالات | Rédaction Pédagogique - Madrasati TN',
  },
  {
    path: 'generate',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/generate/worksheet-generator').then((m) => m.WorksheetGeneratorComponent),
    title: 'مولّد الأوراق | Générateur de fiches - Madrasati TN',
  },
  {
    path: 'studio',
    redirectTo: 'article-studio',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
