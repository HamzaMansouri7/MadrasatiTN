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
    // Public-first: parent space is free browsing (docs bank, articles) —
    // login is only prompted at action level (ask question) inside the page.
    path: 'parent',
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
    path: 'summarize',
    loadComponent: () =>
      import('./features/summarize/summarize-home').then((m) => m.SummarizeHomeComponent),
    title: 'لخّصلي | Résumé de cours - Madrasati TN',
  },
  {
    path: 'teachers',
    loadComponent: () =>
      import('./features/teachers/teachers-home').then((m) => m.TeachersHomeComponent),
    title: 'دليل المعلمين | Annuaire des Enseignants - Madrasati TN',
  },
  {
    path: 'teachers/:id',
    loadComponent: () =>
      import('./features/teachers/teacher-profile-page').then((m) => m.TeacherProfilePageComponent),
    title: 'الملف البيداغوجي | Profil Enseignant - Madrasati TN',
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile-shell').then((m) => m.ProfileShellComponent),
    title: 'الملف الشخصي والإعدادات | Mon Profil - Madrasati TN',
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
    path: 'memo-studio',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/memo-studio/memo-studio').then((m) => m.MemoStudioComponent),
    title: 'استوديو بطاقات التلخيص | Studio Fiche Mémo - Madrasati TN',
  },
  {
    path: 'create',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/create/create-hub').then((m) => m.CreateHubComponent),
    title: 'مركز الإنشاء والتأليف | Studio Création - Madrasati TN',
  },
  {
    path: 'lesson-plan/:id',
    loadComponent: () =>
      import('./features/lesson-plan/lesson-plan-viewer').then((m) => m.LessonPlanViewerComponent),
    title: 'الجذاذة البيداغوجية | Fiche Pédagogique - Madrasati TN',
  },
  {
    path: 'series/:id',
    loadComponent: () =>
      import('./features/series/series-viewer').then((m) => m.SeriesViewerComponent),
    title: 'السلسلة التاريخية المصورة | Série Visuelle - Madrasati TN',
  },
  {
    path: 'studio',
    redirectTo: 'create',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
