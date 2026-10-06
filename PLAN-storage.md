# PLAN — VPS file storage (uploads, generated files)

Decision: files stay on the VPS disk (zero-cost, see CLAUDE.md). No Firebase Storage.

## Gaps found (audit of src/server.ts + callers)

| # | Gap | Where |
|---|-----|-------|
| 1 | Avatar uploads fail: callers send `fileBase64`, server reads only `base64Data` / `fileData` | profile.service.ts, teacher-profile.service.ts, server.ts `/api/upload` |
| 2 | Firebase ID token is never verified server-side; anyone passing the origin check can upload | server.ts |
| 3 | One flat `uploads/` folder: no owner, type or date | server.ts |
| 4 | AI illustrations mixed with user uploads | server.ts (illustration_*) |
| 5 | Files never deleted (replaced avatars, orphans) | — |
| 6 | No total quota, only 15 MB per file | server.ts |
| 7 | `uploads/` and `docs/` resolved from `process.cwd()`; a different PM2 start folder or fresh clone loses them | server.ts:21-24 |
| 8 | `uploads/` has 6 tracked files and no .gitignore rule; `docs/` is untracked and unprotected | repo |
| 9 | No backup | VPS |

## Target layout

```
$UPLOAD_DIR/                      (default ./uploads; VPS: /var/madrasati/uploads)
  avatars/<uid>/<name>.webp
  courses/<uid>/…
  articles/<uid>/…
  documents/<uid>/…
  notebooks/<uid>/…
  generated/<yyyy-mm>/…           (AI images, safe to purge)
$DATA_DIR/                        (default ./docs; VPS: /var/madrasati/docs)
```

URLs become `/uploads/<kind>/<uid>/<name>`. Legacy flat `/uploads/<name>` files keep being served unchanged.

## Phases

1. **Fix + organise (no new dependency)** — gaps 1, 3, 4, 7, 8
   - Server accepts `fileBase64`.
   - `kind` whitelist + sanitised `uid` (`^[A-Za-z0-9_-]{1,64}$`), write to `<kind>/<uid>/`.
   - AI images go to `generated/<yyyy-mm>/`.
   - `UPLOAD_DIR` / `DATA_DIR` env vars with current paths as defaults.
   - All 7 callers send `kind` + `uid`.
   - .gitignore the new subfolders and `docs/`; leave the 6 legacy tracked files (git rm would delete them on the VPS at next pull).
2. **Trust the uid** — gap 2
   - Add `firebase-admin`, verify the Bearer token in `/api/upload`, take uid from the token, reject unauthenticated uploads.
   - All callers send `getAuthHeaders()` (two avatar callers and one article-studio caller do not today).
   - Needs a service-account key on the VPS (owner action, never committed).
3. **Lifecycle** — gaps 5, 6
   - Delete the previous avatar when a new one is saved.
   - Per-uid quota (e.g. 100 MB, value to confirm).
   - Weekly purge of `generated/` older than 90 days (value to confirm).
4. **VPS ops (owner)** — gap 9
   - Move `uploads` and `docs` outside the repo dir, set the env vars in PM2, restart.
   - Nightly rsync/tar of both folders off the VPS.

## Verification

- Lint, build, `pnpm test`.
- Upload one file per kind; check the stored path and that the returned URL is served.
- Old flat URL still loads.
- After phase 2: upload without a token returns 401.

## Not in this plan

- Moving existing flat files into the new layout (needs a URL migration in Firestore).
- Teacher-card migration and its Firestore backup.
