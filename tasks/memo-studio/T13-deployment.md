# Task T13: Deployment (LAST task)

Depends on: all other tasks done and reviewed. Do NOT start before the owner approves. Source of truth: GEMINI.md section 7 "Deployment Playbook (Contabo VPS)" — re-read it and use its current values.

## Pre-deploy checklist (local)
1. `pnpm run lint`, `pnpm test`, `pnpm run build` all pass.
2. `tasks/memo-studio/E2E-REPORT.md` (T12) shows no failing case.
3. New dependencies (`mammoth`, and `docx` if T10 was done) are in `package.json` and `pnpm-lock.yaml`.
4. `GEMINI_API_KEY` is present in the server environment (key is in the repo `.env`, gitignored; the app does not auto-load `.env`, so confirm how PM2 gets it). Never print or commit the key.
5. New static assets (`public/assets/memo/*`) are included in the build output.
6. Commit on a branch, open a PR, merge to `main` (the playbook pulls `main`). Use the owner's personal account (`/gitswitch personal`).

## Deploy (from GEMINI.md section 7)
- SSH with `-F NUL` on Windows: `ssh -F NUL -i C:/Users/lassa/.ssh/id_ed25519 root@<host from GEMINI.md> "<command>"`.
- Pipeline: `cd /root/MadrasatiTN && git pull origin main && pnpm install && pnpm run build && pm2 reload MadrasatiTN` (add `pnpm install` because dependencies changed).
- PM2 service `MadrasatiTN`, port 3004.

## Post-deploy verification
1. `pm2 status` shows `MadrasatiTN` online; `pm2 logs MadrasatiTN --lines 50` has no errors.
2. Open the live `/memo-studio`, generate one memo per input mode, print preview OK.
3. Open a shared memo link (T8) in a private window and check OG tags with a crawler user agent.
4. Check `/uploads` still serves and `/sitemap.xml` is intact.

## Rollback
Note the previous commit hash before pulling. If broken: `git checkout <previous-hash> && pnpm install && pnpm run build && pm2 reload MadrasatiTN`, then report.

## Acceptance
Live site serves the new feature; logs clean; rollback hash recorded in the report.
