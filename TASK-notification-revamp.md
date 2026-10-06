# TASK: Notification system revamp

Agent: Antigravity. Repo: MadrasatiTN (Angular 21 standalone, signals, OnPush, Tailwind 4, Firestore).

## Context
- Current code:
  - `AppNotification` in `src/app/core/models/education.model.ts` (~L341-353).
  - Notification logic in `src/app/core/services/firebase.service.ts` (signal ~L74, listener ~L489, `markNotificationAsRead` ~L559, `addNotification` ~L587).
  - UI in `src/app/shared/components/navbar.ts`.
  - Emitters in `teacher-home.ts`, `editor-studio.ts`, `article-studio.ts`.
  - A toast system already exists in `education-store.ts` (~L94). Reuse it, do not build a second one.
- Imports: `@core` / `@shared` / `@features` aliases only. Do not add code to the legacy shims.
- UI strings go in `LanguageService.dictionary` (FR + AR) and are used as `lang.t('key')`. Never use `\'` inside template interpolations.
- Guard all localStorage access with `typeof localStorage !== 'undefined'` (SSR).
- UI follows DESIGN.md ("Cartouche officielle"), matching `landing-home.ts`. No indigo/purple, no gradients, no emoji icons.
- Do NOT open a browser. Verify with lint, test and build, and state that no visual check was done.
- `firestore.rules` exists but has no notifications rules (unverified: no match found for "notification").

## Bugs to fix (do not preserve)
1. `isRead` is stored on the shared Firestore doc, so one user's read marks it read for everyone.
2. The listener does `orderBy(timestamp).limit(20)` globally, then filters client-side. Other users' notifications starve yours.
3. Local vs. remote notifications are told apart by an `id.startsWith('notif-')` hack.
4. No authorship check, so users see their own actions as notifications.

## Phase 1: Model
Rewrite `AppNotification`:
- Bilingual content: `titleKey`, `messageKey`, `params?: Record<string,string>`. Resolve through the dictionary at render time. Do not store Ar/Fr strings in documents.
- `createdAt: number` (epoch ms). Remove the string timestamp.
- Routing: `routeUrl?: string`, plus the existing `targetDocId?`, `targetThreadId?`, and `tab?`.
- Audience: `recipientId?`, `targetRole?: UserRole | 'all'`, `authorId?`.
- Other: `priority?: 'low'|'normal'|'high'`, `category: 'activity'|'announcement'`, `source: 'remote'|'local'`.
- Remove `isRead` from the document type. Read state is per user (Phase 2).

## Phase 2: NotificationService
Create `src/app/core/services/notification.service.ts`, exported from the `@core` barrel. Move all notification code out of firebase.service.ts.
- Remote: run two Firestore queries, `recipientId == uid` and `targetRole in [role,'all']`. Each is ordered by `createdAt desc` with a limit. Merge and dedupe by id. Drop items where `authorId === uid`.
- Per-user state: `users/{uid}/notificationState/{notifId}` as `{read, dismissed}`. Guests use localStorage (`madrasati_notif_state`).
- Local seeds (versioned, for guest and offline):
  - welcome
  - `announce:memo-studio:v1` (6 layouts + Word export)
  - `announce:ocr:v1`
  Per-id dismissal is persisted. Show the teacher welcome only when `onboardedAt` is unset on the profile, then set it.
- Public API (signals):
  - `visible`: the merged list minus dismissed items.
  - `unreadCount`
  - `markRead(id)`, `markAllRead()`, `dismiss(id)`
  - `emit(payload)`: the single entry point for all emitters. It validates that `routeUrl` starts with `/` and sets `authorId` automatically.
- `firestore.rules`:
  - Users read only their own, role-targeted, or `all` notifications.
  - Create requires `authorId == request.auth.uid`.
  - Notification docs are immutable.
  - `users/{uid}/notificationState/*` is read/write by owner only.
- `firestore.indexes.json`: add the composite indexes the two queries need.

## Phase 3: Navbar (`src/app/shared/components/navbar.ts`)
- Filter tabs: All | Unread | Announcements, with dictionary keys.
- Per-item dismiss button, and a NEW badge on unread announcements.
- Cap the unread badge at "99+".
- Relative time via a pure pipe `timeAgo` (AR: `منذ 5 دقائق`, FR: `Il y a 5 min`). It is driven by the active language signal and a 60s tick signal.
- Direction: `dir` follows the language, with logical properties (`ms-*`, `text-start`).
- `handleNotificationClick`: call `markRead`, then navigate by `routeUrl`. If `targetDocId` or `targetThreadId` is set, pass them as query params (`?doc=` / `?thread=&tab=qa`). The destination page opens the modal or thread. The navbar must not open modals directly.
- A11y: `aria-label` on the bell with the unread count, and `role="status"` on the toast.

## Phase 4: Toast + bell
- In an `effect`, diff `visible()` ids and toast only items that arrive after the first snapshot. Never toast the backlog on load. Use the existing store toast with a 4s duration and a "View / عرض" action that runs the click handler.
- Add a CSS ring animation on the bell when `unreadCount() > 0`. Wrap it in `prefers-reduced-motion: no-preference`.

## Phase 5: Emitters
Update `teacher-home.ts`, `editor-studio.ts`, `article-studio.ts` to call `notificationService.emit({...})` with dictionary keys, `category`, a valid `routeUrl` and `targetDocId` where applicable. Add the new dictionary keys in FR + AR.

## Acceptance
- User A reading a notification does not mark it read for user B.
- A user never sees their own authored notifications.
- No backlog toast on page load.
- RTL and LTR render correctly (code review only, no browser).
- Add a vitest spec for the filter and read-state logic: audience filter, author exclusion, per-user read, dismiss persistence.
- `pnpm run lint`, `pnpm run build` and `pnpm test` pass. Report any that you did not run.

## Out of scope
Push/email delivery, notification preferences UI, retention/TTL cleanup (note as a follow-up).

## Deployment (after merge to `main`, order matters)
Source: GEMINI.md §7 (Contabo VPS). Firestore deploy commands below are unverified against `firebase.json`.

1. **Firestore first**, so the new queries and rules exist before the new client ships:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```
   Wait for the indexes to finish building (Firebase console). Queries fail until they are ready.
2. **App** (VPS `169.58.107.183`, PM2 service `MadrasatiTN`, port 3004):
   ```powershell
   ssh -F NUL -i C:/Users/lassa/.ssh/id_ed25519 root@169.58.107.183 "cd /root/MadrasatiTN && git pull origin main && pnpm run build && pm2 reload MadrasatiTN"
   ```
   On Windows, always pass `-F NUL`.
3. **Smoke test** (no browser from the agent):
   ```powershell
   ssh -F NUL -i C:/Users/lassa/.ssh/id_ed25519 root@169.58.107.183 "pm2 status MadrasatiTN && pm2 logs MadrasatiTN --lines 50 --nostream"
   ```
   Then ask the owner to check manually: bell, read state across two accounts, and the guest seed.
4. **Rollback:** revert the commit, `git pull`, rebuild and `pm2 reload`. Old clients write `isRead` and use `timestamp`, and the new rules may reject those writes, so keep the old rules until the new app is live and stable.
