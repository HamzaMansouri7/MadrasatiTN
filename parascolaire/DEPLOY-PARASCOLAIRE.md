# Deploy runbook: Parascolaire module

Run each step yourself or approve it. Nothing here runs automatically.

## 0. Local dev (once per session)
- Terminal 1: `pnpm run build` then `pnpm run serve:ssr:app` (Express on :4000, serves the API and `/media`).
- Terminal 2: `pnpm run dev` (Angular on :3000). `proxy.conf.json` forwards `/api`, `/media`, `/uploads` to :4000.
- Local data: `python parascolaire/tools/publish_catalog.py`, then copy `parascolaire/publish/*` into `uploads/parascolaire/` (gitignored).
- Open http://localhost:3000/parascolaire

## 1. Publish the data (on this PC)
```
python parascolaire/tools/dedupe_outputs.py
python parascolaire/tools/publish_catalog.py     # must end with "catalog.json written", no ERROR line
```

## 2. Upload the data to the VPS (outside git)
```
rsync -avz --delete parascolaire/publish/ <user>@<vps>:/var/madrasati/uploads/parascolaire/
```
Dedicated folder, so `--delete` only removes old hashed files. The folder is already covered by the nightly backup (`/var/madrasati/uploads`). Without rsync: `scp -r parascolaire/publish/. <user>@<vps>:/var/madrasati/uploads/parascolaire/`.

## 3. Deploy the code (on the VPS)
```
cd <repo path> && git pull --ff-only
pnpm install --frozen-lockfile
pnpm run build
pm2 restart MadrasatiTN --update-env && pm2 save
```
Commit or stash any local edits on the VPS first (a pull wipes uncommitted work).

## 4. Check
```
curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/api/parascolaire/catalog        # 200
curl -sI https://<domain>/media/parascolaire/<any path from catalog.json> | grep -i cache  # immutable
curl -s -A "facebookexternalhit/1.1" https://<domain>/parascolaire/1ere-annee/evaluations-maths-arabe/02-comparaison-et-rangement-des-nombres | grep og:image
```
Then open `/parascolaire` on a phone.

## Add new outputs later
Drop the file in `parascolaire/outputs/`, update its manifest, run steps 1 and 2. No code deploy needed.
