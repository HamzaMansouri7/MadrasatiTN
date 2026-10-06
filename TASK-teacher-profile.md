# TASK: Teacher profile: public page, avatar, real data

Agent: Antigravity. Repo: MadrasatiTN (Angular 21 standalone, signals, OnPush, Tailwind 4, Firestore).

**Coordination:** `TASK-notification-revamp.md` is in progress and also touches `firebase.service.ts` and `firestore.rules`. Start from its merged state (pull first). Do not touch notification code. Extract profile logic into a new service instead of growing `firebase.service.ts`.

## Context
- Imports: `@core` / `@shared` / `@features` aliases only. UI strings go in `LanguageService.dictionary` or `lang.tr(fr, ar)`. Arabic is primary (RTL, logical properties).
- UI follows DESIGN.md ("Cartouche officielle"), matching `landing-home.ts` pixel-for-pixel. Invoke the `frontend-design` and `ui-ux-pro-max` skills first, and DESIGN.md tokens win. No indigo/purple, no gradients, no emoji icons, no WhatsApp share copy. Guard localStorage with `typeof localStorage !== 'undefined'`.
- Product rules (memory): teachers are authors, so profile = attribution layer, and author links on cards are primary. Real stats only, no fake numbers. All read features are public with no login.
- Do NOT open a browser. Verify with `pnpm run lint`, `pnpm run build` and `pnpm test`, and state that no visual check was done.

## Findings (verified in code)
Symptoms seen at `madrastihub.com/teachers`: every card has the same stock photo, empty bio shows `""`, all stats are 0, and every teacher has the verified check.

| # | Problem | Where |
|---|---|---|
| 1 | Every new account gets the same hardcoded Unsplash portrait (`defaultAvatar`) | `firebase.service.ts` ~L376-411 |
| 2 | No avatar upload UI exists. `/api/upload` is used only for documents | `teacher-home.ts`, `server.ts` |
| 3 | `syncTeacherCard` runs on every login/update with `merge:true` and writes `coursesCount:0, exercisesCount:0, rating:0, reviewsCount:0`. Stats are reset to 0 on each login | `firebase.service.ts:492-512` |
| 4 | `verifiedBadge: true` is hardcoded for everyone. This is a fake credential | same |
| 5 | `bio` is never written, so the card renders `""` | same + `teachers-home.ts:65` |
| 6 | The profile form pre-fills fake values (`CNP-TN-2024-8841`, "École Primaire Habib Bourguiba, Ariana"). Clicking Save stores them as real data | `teacher-home.ts:1719-1725` |
| 7 | `title` falls back to `primarySubject`, so the card shows "Langue Arabe" as the job title. `taughtGrades` and `subjects` are never mirrored to the public card | `syncTeacherCard` |
| 8 | Three near-duplicate profile modals (teachers-home, public-discovery, teacher-home edit) with no shareable URL. Discovery shows fake fallback stats `|| 148`, `|| 310` | `public-discovery.ts:1240-1244` |
| 9 | Rules let the owner write any field of `teachers/{uid}`, so a user can forge `verifiedBadge`, `rating` and counts from the client | `firestore.rules:35-38` |

## Phase 1: Data model and rules
1. `TeacherProfile` (public card), whitelist only. Add `displayName`, `title`, `school`, `delegation?`, `bio`, `avatarUrl`, `taughtGrades`, `subjects`, `languages?`, `verified: 'none'|'pending'|'verified'`, `joinedAt`, `updatedAt`. Remove `studentsCount`, and drop stored counts and `rating`. These are derived (Phase 3).
2. Private fields stay in `users/{uid}` only: `email`, `phone`, `cnpId`, `customWatermark`. `cnpId` is used for verification, never public.
3. `firestore.rules` for `teachers/{uid}`:
   - Owner may write only the whitelisted keys, with `request.resource.data.diff(resource.data).affectedKeys().hasOnly([...])`.
   - `verified` is never client-writable. Admin or console only.
   - Add field-length limits (bio ≤ 500 chars, name ≤ 80).
4. Migration (one-off script in `scripts/`, run by the owner): remove `coursesCount`, `exercisesCount`, `rating`, `reviewsCount` and the fake `verifiedBadge` from existing docs. Set `verified: 'none'`.

## Phase 2: Avatar
1. Stop assigning stock photos. Default avatar = deterministic initials on a DESIGN.md palette color, rendered by a shared `TeacherAvatar` component (OnPush, `size` input, correct `alt`, `loading="lazy"`, `width/height` set to avoid layout shift). Remove the Unsplash defaults at ~L376-411.
2. Upload: file input + client-side square crop and resize to 400×400 WebP (~≤80 KB) via canvas, then POST base64 to the existing `/api/upload`. Store the returned URL in `users.photoURL`, then mirror it to `teachers.avatarUrl`. Validate type and size, show progress and error states, allow "remove photo".
3. Check that `/api/upload` returns a stable public URL and enforces the same MIME and size limits (see `server.ts:295`, which has `originGuard` and a rate limiter). Extend the server only if needed.
4. `onerror` on `<img>` falls back to initials.

## Phase 3: Real stats (no Cloud Functions, zero-cost)
- Documents and exercises: Firestore `getCountFromServer` on `courses` / `exercises` where `authorId == uid`. Verify that `authorId` is set on all new content (`teacher-home.ts` filters by it at ~L1702).
- Rating: derive from a `reviews` collection if one exists. If not, hide the rating entirely until reviews exist. **Never show a fake or zero star.**
- Followers: count from `watchlist` data if server-backed, otherwise omit.
- Hide any stat that is 0 or unavailable instead of printing "0". Show a quiet "New author" label instead.
- Cache counts in memory per session. Do not run N count queries on the directory page. For the directory cards, show only a documents count, lazily.

## Phase 4: Public profile page `/teachers/:id`
1. New lazy route `teachers/:id` → `TeacherProfileComponent`. Add it to `app.routes.ts` and to the `routeToRoleMap` handling in `app.ts` if needed.
2. Layout (Cartouche, RTL-first), top to bottom:
   - **Header:** avatar, name, title, school and delegation, verified chip (only if `verified === 'verified'`, otherwise nothing), Follow button (reuse `store.toggleWatchlist`), Share (copy link / native share).
   - **About:** bio, grades taught chips, subject chips.
   - **Stats row:** real counts only (Phase 3).
   - **Resources by this author:** tabs by type (Courses | Exercises | Exams), with the existing card component, filters by grade and subject, empty state.
   - **Reviews:** only if the reviews data exists.
3. Meta: dynamic `<title>` and description via Angular `Title`/`Meta`. SSR renders the page (Express SSR is already used). Test an unknown `:id` → friendly 404 state.
4. Replace the three modals: `teachers-home` cards link to `/teachers/:id` ("Profil & Avis" becomes a router link). `public-discovery` author links and `navbar` links do the same. Delete the duplicated modal code and the fake `|| 148` / `|| 310` fallbacks.
5. Directory `/teachers`: show real cards (avatar, name, title, school, grades, subject chips). Hide the bio block if empty (no `""`). Add search by name and filter by subject and grade. Sort by documents count.

## Phase 5: Edit own profile
1. Move the editor out of the teacher dashboard modal into `/teacher/profile` (or keep the modal but reuse one `ProfileFormComponent`).
2. Fields: photo, display name, title (dropdown + free text), school, delegation, grades taught, subjects, bio (counter, 500 max), `cnpId` (private, labelled "never shown publicly"). Remove all fake pre-filled values (`CNP-TN-2024-8841`, Ariana school); use empty fields with placeholders.
3. A completeness meter (photo, bio, school, grades) with nudges, e.g. "Add a photo to be recognized". It's computed, not stored.
4. "Preview as public" button opens `/teachers/:id`.
5. Save writes `users/{uid}` (all fields) and `teachers/{uid}` (whitelist only), via a new `TeacherProfileService`. Fix `syncTeacherCard` so it never writes counts, rating or verified, and runs only on profile save, not on every login.
6. Verification flow (minimal): "Request verification" sets `verified: 'pending'` (owner-writable only to `pending`). The owner (admin) flips it to `verified` in the Firebase console. Note the admin UI as a follow-up.

## Acceptance
- Two new teachers get different avatars (initials), never the same stock photo.
- Uploading a photo updates the card, profile page and navbar.
- No "0" stats, `""` bios or fake verified check anywhere.
- `teachers/{uid}` cannot be written with `verified`, `rating` or counts from the client (rules unit test or emulator check).
- `/teachers/:id` is shareable, works signed-out, renders under SSR, and has correct page title.
- RTL and LTR are correct in code (logical properties). Lighthouse a11y: alt text, focus order, 44px targets (code review only, no browser).
- Add vitest specs: initials/color generator, stats hiding rules, the profile whitelist mapper.
- `pnpm run lint`, `pnpm run build` and `pnpm test` pass. Report any that you did not run.

## Out of scope
Admin verification dashboard, parent/student profiles, review submission UI, public follower lists.

## Deployment (after merge to `main`, order matters)
Source: GEMINI.md §7 (Contabo VPS). Firebase commands are unverified against `firebase.json`.

1. **Backup first:** export the `teachers` collection (Firebase console or `gcloud firestore export`) before the migration.
2. **Rules first:** `firebase deploy --only firestore:rules`. The old client still writes counts. The stricter rules will reject its `syncTeacherCard`, so deploy rules and app back to back and keep the gap short.
3. **App** (VPS `169.58.107.183`, PM2 `MadrasatiTN`, port 3004):
   ```powershell
   ssh -F NUL -i C:/Users/lassa/.ssh/id_ed25519 root@169.58.107.183 "cd /root/MadrasatiTN && git pull origin main && pnpm run build && pm2 reload MadrasatiTN"
   ```
4. **Migration script:** the owner runs `scripts/migrate-teacher-cards.*` once (Phase 1.4) after the app is live.
5. **Uploads dir:** confirm `/root/MadrasatiTN/uploads` is writable and persists across rebuilds, since avatars are stored on VPS disk.
6. **Smoke test:**
   ```powershell
   ssh -F NUL -i C:/Users/lassa/.ssh/id_ed25519 root@169.58.107.183 "pm2 status MadrasatiTN && pm2 logs MadrasatiTN --lines 50 --nostream"
   ```
   Then the owner checks manually: upload a photo, open `/teachers/:id` signed-out, copy the share link, and confirm the directory shows no `""` or fake check.
7. **Rollback:** revert, pull, rebuild and `pm2 reload`. Keep the Firestore export from step 1 for data recovery.
