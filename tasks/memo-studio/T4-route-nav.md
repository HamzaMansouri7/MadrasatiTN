# Task T4: Route + navigation

Goal: register the page. Do NOT touch the `UserRole` union.

1. `src/app/app.routes.ts`: lazy route `memo-studio` with `canActivate: [authGuard]`, `loadComponent: () => import('./features/memo-studio/memo-studio').then(m => m.MemoStudioComponent)`, bilingual title `'AR | FR - Madrasati TN'`. Place it before the `**` wildcard.
2. `src/app/app.ts` `routeToRoleMap`: `'/memo-studio': 'editor'`.
3. `src/app/shared/components/navbar.ts`: desktop button + mobile pill. Copy the "Generator Studio" pattern (isGeneratorRoute / navigate helper, ~lines 95-105 and 348-415).
4. `src/app/features/teacher/teacher-home.ts`: tile that navigates to `/memo-studio` (pattern of `openArticleStudio()`).
5. `src/app/features/index.ts`: export the feature.
6. Dictionary keys (FR + AR) for the nav label.

## Acceptance
Route reachable from navbar; role stays in sync with the URL; lint + build pass.
