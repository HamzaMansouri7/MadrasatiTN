# TASK (MASTER): User profiles for all roles (teacher, parent, student)

Agent: Antigravity. Repo: MadrasatiTN (Angular 21 standalone, signals, OnPush, Tailwind 4, Firestore).

This is the master spec. `TASK-teacher-profile.md` is the **teacher sub-task**. Execute it as Phase 1 here, after Phase 0. Pull first, since `TASK-notification-revamp.md` also touches `firebase.service.ts` and `firestore.rules`. Do not touch notification code.

## Context
- Imports: `@core` / `@shared` / `@features` aliases only. Strings via `lang.tr(fr, ar)` or `LanguageService.dictionary`. Arabic is primary (RTL, logical properties).
- UI follows DESIGN.md ("Cartouche officielle"), matching `landing-home.ts`. Invoke the `frontend-design` and `ui-ux-pro-max` skills first, and DESIGN.md tokens win. No indigo/purple, no gradients, no emoji icons, no WhatsApp share copy. The navbar currently uses blue `#007CC2` while the teacher pages use green `#2D6A4F`. Resolve to DESIGN.md tokens in anything you touch.
- Product rules (memory): public-first. All read features are free with no login, and only actions (follow, comment, ask, studio) are gated. Teachers are authors, and their profile is an attribution layer with real stats only.
- Guard localStorage with `typeof localStorage !== 'undefined'` (SSR).
- Do NOT open a browser. Verify with `pnpm run lint`, `pnpm run build` and `pnpm test`, and state that no visual check was done.

## Findings (verified in code)
| # | Problem | Where |
|---|---|---|
| 1 | Only teachers have any profile UI. `handleProfileClick` opens a modal for `role === 'teacher'` and does nothing for parent or student. "Mon profil" and "Paramètres" call the same handler, so settings do not exist | `navbar.ts:565-576`, `:347-361` |
| 2 | **Privacy:** `users/{uid}` is readable by any signed-in user. It holds `email`, `phone` (required at parent signup), `cnpId` and `customWatermark`. Any account can read all parents' phone numbers | `firestore.rules:25-27`, `auth-modal.ts:630` |
| 3 | Every `users` read in the app is of the user's own uid, so tightening to owner-only is safe | grep `'users'` in `src` |
| 4 | Children are a hardcoded mock. `store.students` is one fake row (`st-1`, name "Élève", streak 6, points 1240, mock scores, `parentId: 'p-1'`). No child records exist in Firestore and no parent-to-child link | `education-store.ts:384-401` |
| 5 | Parents and students get stock Unsplash photos as avatars, like teachers | `firebase.service.ts:342, 372` |
| 6 | Watchlist (followed teachers, saved docs) and comments live in localStorage only. They are lost on a new device and are not part of the account | `education-store.ts:233, 618-620` |
| 7 | Preferences (language, palette) are not on the profile | `education-store.ts:176, 611` |
| 8 | One `role` per account. A teacher who is also a parent cannot hold both | `UserProfile.role` |
| 9 | Teacher-card problems (fake verified check, stats reset to 0, forgeable fields) are in `TASK-teacher-profile.md` | |

## Profile concept
One account, one private area at **`/profile`**, role-aware. A public page exists **only for teachers**.

| Role | Public page | Private area content |
|---|---|---|
| Teacher | `/teachers/:id` (author page, per the sub-task) | identity, school, grades and subjects, private `cnpId`, authored content, followers |
| Parent | **Never** | identity, children, followed teachers, saved resources, notification and contact preferences |
| Student | **Never** | nickname, grade, illustrated avatar, progress, streak, link to parent |

**Child-safety rules (hard):** students and parents have no public page, no searchable listing, and no public photo. Student avatars are illustrated, never uploaded photos. Students use a nickname, not a full name. Parent phone is never exposed to other users. A legal review of child-data handling in Tunisia is a recommended follow-up (unverified, not researched here).

## Phase 0: Foundation (blocks everything else)
1. **Fix the privacy hole.** In `firestore.rules`, `users/{uid}`: read and write for the owner only. Verify with the emulator or a rules test that another signed-in user gets permission-denied. Deploy this first (see Deployment).
2. **`UserProfile` model** (`firebase.service.ts` interface, then move to `education.model.ts`). Add:
   - `createdAt`, `updatedAt`
   - `preferredLang`, `theme`
   - `notificationPrefs?: { activity: boolean; announcements: boolean }`
   - `roles: UserRole[]` plus `activeRole` for dual-role accounts (migrate from `role`, keep `role` readable during transition)
   - `onboardedAt?`
   Keep fields optional so existing users do not break.
3. **`ProfileService`** (`src/app/core/services/profile.service.ts`, exported from `@core`). All profile reads/writes move here and out of `firebase.service.ts`. API as signals plus async methods: `profile`, `update(partial)`, `uploadAvatar(file)`, `completeness()`.
4. **Shared `UserAvatar` component** (`@shared`): initials on a DESIGN.md palette color by default, and uploaded image for teachers and parents only. For students it renders an illustrated avatar by id. Remove all Unsplash defaults. Use the same component in navbar, cards and pages (`onerror` falls back to initials).
5. **Avatar upload pipeline** (teacher and parent): file input, client-side square crop to 400×400 WebP (≤80 KB), POST base64 to `/api/upload` (see `server.ts:295`), store the URL in `users.photoURL`. Validate type and size, with progress and error states, and "remove photo".
6. **Route and shell:** lazy `/profile` → `ProfileShellComponent` (tabs vary by role), added to `app.routes.ts` and to the role map in `app.ts`. Fix the navbar so "Mon profil" goes to `/profile` for **all** roles and "Paramètres" goes to `/profile?tab=settings`. Remove the teacher-only modal trigger.
7. **Remove fake demo defaults** in profile forms (no `CNP-TN-2024-8841`, no invented schools). Use empty fields with placeholders.

## Phase 1: Teacher
Execute `TASK-teacher-profile.md` in full (public `/teachers/:id`, real stats, whitelist rules, verification states). Reuse Phase 0 `UserAvatar` and `ProfileService` instead of the sub-task's own versions where they overlap. Its private edit form becomes the teacher tab of `/profile`.

## Phase 2: Parent
Tabs: **Profile | Children | Saved | Settings**.
1. **Profile:** photo (optional), display name, phone (private, labelled "never shown to teachers or other users unless you choose"), governorate (optional).
2. **Children (real data).** New collection `children/{childId}`: `{ parentUid, nickname, grade, avatarId, school?, createdAt }`.
   - Rules: only `parentUid == request.auth.uid` can read, write and delete.
   - UI: add, edit and remove a child (max e.g. 6), and a child switcher that sets `store.activeStudentId`.
   - Replace the hardcoded `store.students` mock with this data. When a parent has no children, show an "Add your first child" empty state, not mock numbers. Keep `StudentProfile` fields only if real data backs them (see Phase 3).
   - Removing a child needs a confirm dialog and also deletes the child's progress.
3. **Saved:** followed teachers, saved courses and exercises. Move the watchlist from localStorage-only to `users/{uid}/watchlist/{itemId}`, synced and keeping the `madrasati_watchlist` key as a signed-out/offline cache. On first login, merge the local list into the account without duplicates. Keep the `store.toggleWatchlist` / `isWatched` API unchanged.
4. **Settings:** language, theme (replace the localStorage palette with `users.theme`, localStorage stays as pre-login cache), notification prefs (matching the notification categories `activity` and `announcement`), **export my data** (JSON download) and **delete my account** (confirm, then delete `users/{uid}`, `children`, `watchlist`, then the auth user). Mark any part you cannot complete with a clear TODO and report it.
5. Parent home (`parent-home.ts`) shows the active child's real progress. If no activity data exists, show an honest empty state.

## Phase 3: Student
1. **Profile tab:** nickname, grade, illustrated avatar picker (a fixed set of SVG avatars in `public/assets/avatars/`, DESIGN.md colors, no cartoon clichés or emoji), and streak and points computed from real activity events.
2. **Real activity:** log completed exercises in `children/{childId}/activity/{id}` (`exerciseId`, `score`, `completedAt`). Derive `streakDays`, `totalPoints`, `completedExercisesCount` and `subjectsProgress` from it. Delete the mock numbers (streak 6, points 1240, scores). Check how `student-home.ts` produces progress today, and keep working flows working.
3. **Parent link:** a student account links to a parent through a one-time 6-digit code generated by the parent in the Children tab (expires in 24 h, single use). Rules: link doc writable only by the parent and by the redeeming student. Standalone students without a parent still work.
4. Students never see edit fields for phone, email or real name. Keep their screens minimal and large-target (44 px).
5. If student accounts under a parent-created `children` record would be simpler than separate student auth, say so in your report **before** building the code-link flow. Do not silently choose.

## Phase 4: Settings, onboarding, polish
1. **Completeness meter** (computed, role-aware): "Add a photo", "Add your first child", and so on. Not stored.
2. **Onboarding:** set `onboardedAt` after the first successful profile save. Per role: teacher goes to the profile form, parent goes to "Add your first child", student goes to avatar and nickname. Optional skip.
3. **Role switch** for dual-role accounts: a small switcher in the profile menu, driven by `roles` and `activeRole`.
4. Demo logins (`quickDemoLogin` in `auth-modal.ts`) must be clearly flagged as demo and must not write to production Firestore. Verify, and fix if they do.

## Acceptance
- No user can read another user's `users/{uid}` document (rules test).
- Parent, student and teacher each reach a working profile page from "Mon profil". Settings is a distinct page.
- No Unsplash defaults anywhere. Initials or illustrated avatars only.
- A parent can add, edit and remove real children. No mock child data remains in `store.students`.
- Followed teachers and saved docs persist across devices after login.
- No public URL, listing or search result exists for any parent or student.
- Account export and delete work (or report precisely what's missing).
- RTL and LTR correct in code (logical properties). Accessibility: labels, focus order, 44 px targets, `alt` text (code review only).
- vitest specs: initials/color generator, completeness meter, watchlist merge, child rules logic where testable.
- `pnpm run lint`, `pnpm run build` and `pnpm test` pass. Report any you did not run.

## Out of scope
Admin verification dashboard, school or class management, parent-teacher messaging, public follower lists, payments.

## Deployment (after merge to `main`, order matters)
Source: GEMINI.md §7 (Contabo VPS). Firebase commands are unverified against `firebase.json`.

1. **Backup first:** export Firestore (`users`, `teachers`) from the console or `gcloud firestore export`.
2. **Rules first, as soon as Phase 0.1 is ready:** `firebase deploy --only firestore:rules`. It closes the phone/email exposure and is safe to ship before the rest. For the new `children`, `watchlist` and whitelist rules, deploy them in the same step as the app.
3. **App** (VPS `169.58.107.183`, PM2 `MadrasatiTN`, port 3004):
   ```powershell
   ssh -F NUL -i C:/Users/lassa/.ssh/id_ed25519 root@169.58.107.183 "cd /root/MadrasatiTN && git pull origin main && pnpm run build && pm2 reload MadrasatiTN"
   ```
4. **Migrations** (owner runs once, after the app is live):
   - `users.role` → `roles[]` + `activeRole`.
   - Teacher card cleanup (see sub-task).
   - Local watchlist is merged client-side at next login, so no script is needed.
5. **Uploads dir:** `/root/MadrasatiTN/uploads` must be writable and persist across rebuilds (avatars live on VPS disk). Also deploy the SVG avatars in `public/assets/avatars/` (part of the build).
6. **Smoke test:**
   ```powershell
   ssh -F NUL -i C:/Users/lassa/.ssh/id_ed25519 root@169.58.107.183 "pm2 status MadrasatiTN && pm2 logs MadrasatiTN --lines 50 --nostream"
   ```
   Then the owner checks manually, one account per role: open Mon profil, upload a photo (teacher/parent), add a child (parent), pick an avatar (student), and confirm a second account cannot read the first one's data.
7. **Rollback:** revert, pull, rebuild and `pm2 reload`. Keep the Phase 0 rules fix even on rollback. Use the step 1 export for data recovery.
