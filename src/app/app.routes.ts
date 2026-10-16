import { Routes } from '@angular/router';
import { authGuard } from '@core';
import { studioLeaveGuard } from '@shared';

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
    path: 'discovery',
    loadComponent: () =>
      import('./features/discovery/public-discovery').then((m) => m.PublicDiscoveryComponent),
    title: 'المكتبة والدليل | Bibliothèque CNP - Madrasati TN',
  },
  {
    path: 'programme',
    loadComponent: () =>
      import('./features/programme/programme-home').then((m) => m.ProgrammeHomeComponent),
    title: 'البرنامج البيداغوجي الرسمي | Programme Officiel - Madrasati TN',
  },
  {
    path: 'parascolaire',
    loadComponent: () =>
      import('./features/parascolaire/parascolaire-home').then((m) => m.ParascolaireHomeComponent),
    title: 'الدعم المدرسي | Parascolaire - Madrasati TN',
  },
  {
    path: 'parascolaire/:classe/:livre',
    loadComponent: () =>
      import('./features/parascolaire/parascolaire-book').then((m) => m.ParascolaireBookComponent),
    title: 'الدعم المدرسي | Parascolaire - Madrasati TN',
  },
  {
    path: 'parascolaire/:classe/:livre/:theme',
    loadComponent: () =>
      import('./features/parascolaire/parascolaire-theme').then((m) => m.ParascolaireThemeComponent),
    title: 'الدعم المدرسي | Parascolaire - Madrasati TN',
  },
  {
    path: 'solve',
    canDeactivate: [studioLeaveGuard],
    loadComponent: () =>
      import('./features/solve/solve-home').then((m) => m.SolveHomeComponent),
    title: 'صوّر التمرين واحصل على الحل | Photo-Solution - Madrasati TN',
  },
  {
    path: 'summarize',
    redirectTo: () => '/create?output=memo',
    pathMatch: 'full',
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
    canDeactivate: [studioLeaveGuard],
    loadComponent: () =>
      import('./features/editor/editor-studio').then((m) => m.EditorStudioComponent),
    title: 'استوديو الوثائق | Studio Imprimable A4 - Madrasati TN',
  },
  {
    path: 'article-studio',
    canDeactivate: [studioLeaveGuard],
    loadComponent: () =>
      import('./features/article-studio/article-studio').then((m) => m.ArticleStudioComponent),
    title: 'استوديو المقالات | Rédaction Pédagogique - Madrasati TN',
  },
  {
    path: 'generate',
    canDeactivate: [studioLeaveGuard],
    loadComponent: () =>
      import('./features/generate/worksheet-generator').then((m) => m.WorksheetGeneratorComponent),
    title: 'مولّد الأوراق | Générateur de fiches - Madrasati TN',
  },
  {
    path: 'memo-studio',
    // Old share links (/memo-studio?memo=ID) keep working: their query params are carried over.
    redirectTo: ({ queryParams }) => `/ai-studio?${new URLSearchParams({ ...queryParams, tab: 'memo' })}`,
    pathMatch: 'full',
  },
  {
    path: 'ai-studio',
    canDeactivate: [studioLeaveGuard],
    // Infographic ↔ memo is a query change on this route: run the leave guard for it too.
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    loadComponent: () =>
      import('./features/ai-studio/ai-studio').then((m) => m.AiStudioComponent),
    title: 'استوديو الذكاء الاصطناعي | AI Studio - Madrasati TN',
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./features/create/create-hub').then((m) => m.CreateHubComponent),
    title: 'مركز الإنشاء والتأليف | Studio Création - Madrasati TN',
  },
  {
    path: 'lesson-plan/:id',
    canDeactivate: [studioLeaveGuard],
    loadComponent: () =>
      import('./features/lesson-plan/lesson-plan-viewer').then((m) => m.LessonPlanViewerComponent),
    title: 'الجذاذة البيداغوجية | Fiche Pédagogique - Madrasati TN',
  },
  {
    path: 'infographic/:id',
    loadComponent: () =>
      import('./features/ai-studio/infographic-viewer').then((m) => m.InfographicViewerComponent),
    title: 'إنفوغرافيك | Infographie - Madrasati TN',
  },
  {
    path: 'series/:id',
    canDeactivate: [studioLeaveGuard],
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
