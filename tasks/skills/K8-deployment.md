# Task K8: Deployment (LAST task)

Depends on: K0-K7 done and reviewed. Do NOT start before the owner approves. Source of truth: GEMINI.md section 7 "Deployment Playbook (Contabo VPS)".

## Pre-deploy checklist (local)
1. `pnpm test`, `pnpm run lint`, `pnpm run build` pass.
2. `EVAL-REPORT.md` (K7) reviewed by the owner; no failing hostile-input case.
3. Skills are bundled TS modules (no runtime `.md` reads): confirm with `pnpm run build && node dist/app/server/server.mjs` locally, then curl one endpoint per skill.
4. Compare token usage before/after on the same inputs; give the numbers to the owner (they check Gemini consumption).
5. Commit on a branch, PR, merge to `main`. Use the personal GitHub account (`/gitswitch personal`).

## Deploy (GEMINI.md section 7)
- `ssh -F NUL -i C:/Users/lassa/.ssh/id_ed25519 root@<host from GEMINI.md> "cd /root/MadrasatiTN && git pull origin main && pnpm install && pnpm run build && pm2 reload MadrasatiTN"`; PM2 service `MadrasatiTN`, port 3004.

## Post-deploy
- `pm2 logs MadrasatiTN --lines 50` clean; skill id@version appears in logs; test live: exercise, memo, photo-solve, summarize, explain.
- Rollback: record the previous commit hash first; on failure `git checkout <hash> && pnpm install && pnpm run build && pm2 reload MadrasatiTN`.
