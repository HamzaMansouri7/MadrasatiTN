Context: Madrasati TN (Angular 21 SSR + Express 5, PM2 app "MadrasatiTN", port 3004). Repo already pulled at origin/main f9bef0e or later.

FIRST, before anything else:
1. Read CLAUDE.md, GEMINI.md and PLAN-storage.md.
2. Run `bash vps-handoff/install.sh` from the repo root. It installs my local Claude memory and global rules (never overwrites existing memory). Then read ~/.claude/projects/<slug>/memory/MEMORY.md and the files it lists. Those notes are binding: no browser unless I ask, Cartouche design system, Firebase project is cursor-ai-presentations (never madrasti-a46d6, real users), public-first access model, teachers are authors, AI grounding layer.
3. This VPS session is ops only: the local skills (frontend-design, ui-ux-pro-max) and Antigravity are NOT available here. Do not do UI work; leave UI for the local machine.

Rules: confirm before production deploys, Firebase rules deploys and deletions. Report findings before each change. If you learn something non-obvious worth remembering, write it to the VPS memory AND list it for me at the end so I can copy it back to the local memory.

Goal this session, in order:
1. Diagnose why PM2 shows 57 restarts for MadrasatiTN (pm2 logs, exit codes, memory, crash loops). Report the cause; do not change anything yet.
2. Storage move: create /var/madrasati/uploads and /var/madrasati/docs, copy the current uploads/ and docs/ contents there (keep originals until verified), set UPLOAD_DIR and DATA_DIR in the PM2 env, pull, build, reload. Check that an old flat /uploads/<file> URL still loads.
3. Backups: nightly tar of both folders to a separate-disk or off-box location, 14-day retention (cron), and verify one restore.
4. Verify: a signed-in upload lands in uploads/<kind>/<uid>/; an unauthenticated upload returns 401.
5. Only with my explicit OK: deploy firestore.rules (take a Firestore export first), then backfill ownerUid on existing content docs (dry run first).

Known state: the token check on /api/upload uses Identity Toolkit with the apiKey from firebase-applet-config.json (or FIREBASE_API_KEY). AI routes, GET /api/docs and export-docx are intentionally open. The Gemini key is in this repo's .env on the VPS.
