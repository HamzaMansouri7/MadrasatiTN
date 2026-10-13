# Plan: Facebook posts for Parascolaire (for Antigravity)

Goal: every post is 10/10: image and text say the same thing, nothing overpromised, Arabic correct, link works.
Replaces the drafts in `FB-POSTS-DRAFT.md` (old drafts overpromise, see Step 2).

## Rules (do not break)
- Non-profit community project: **keep the "Gemini Notebook" watermark on infographics. Do not crop, blur or remove it.**
- Arabic text only. Ask the owner before adding FR.
- Never print, log or commit `FB_PAGE_TOKEN` / `FB_APP_SECRET` / `FB_USER_TOKEN` (all in `.env`, gitignored). Print only status codes and lengths.
- Free only. No paid tools.
- Nothing goes live without the owner's "go" on the exact post text + image. Dry-run first.

## Inputs
- Catalog: `parascolaire/publish/catalog.json` (24 themes, 16 infographics, 5 course decks).
- Images: `parascolaire/publish/img/1ere-annee/evaluations-maths-arabe/<theme-id>/infographic.<hash>.webp` (hash differs per folder: list the folder). Thumb: `infographic-thumb.<hash>.webp`.
- Existing posting code and template: `src/server/facebook.ts` (Arabic template, hashtags, Graph API, dedupe). Reuse it; do not write a second poster.
- Page: id `FB_PAGE_ID` in `.env`. Token on VPS `/root/MadrasatiTN/.env` + PM2 env (owner says already updated).

## Step 1 - Audit the images (one theme at a time)
For each of the 16 themes with an infographic: open the image and write down, in a table (`parascolaire/outputs/fb-audit.md`, gitignored):
theme id | what the image actually shows (title, key content, numbers, examples) | quality 1-10 | matches its post topic yes/no.
Known case: theme 06 (addition to 20) is a "things grow when you add" metaphor with NO numbers or sums. The old Post 2 promised "visual summary to review addition", which does not match.
Keep only images scoring 8+ and matching. Others: skip for now and list them for the owner.

## Step 2 - Write post text from the image, not from the title
For each kept theme write:
- Hook line (parent pain point or question) that is true of THIS image.
- 1-2 lines describing exactly what the image contains (use the real words/numbers seen in it).
- One call to action + link.
- 3-5 hashtags: `#مدرستي_تونس #السنة_الأولى_ابتدائي` + subject tag.
No claims the image does not support (no "ready to print" unless the page really offers print; verify).
Launch post (Post 0) goes first: describes the module as it really is (infographics + course slides, free, no login), image = the best-scoring infographic or a collage if one exists.
Save the final texts in `parascolaire/FB-POSTS-FINAL.md`, one block per post: image path, text, link, planned date.

## Step 3 - Links
- Check whether per-theme deep links work (Angular route `/parascolaire` in `src/app/app.routes.ts` and the page component). If yes, use `/parascolaire?theme=<id>` style link; if no, link to `/parascolaire` only.
- Check the link renders a good Open Graph preview (FB crawler: `curl -A facebookexternalhit/1.1 -s <url> | grep og:`). If the preview image is not the infographic, fix or rely on the uploaded photo.

## Step 4 - Send script
- Add `scripts/fb-post-parascolaire.ts` that reads `FB-POSTS-FINAL.md`, uploads image + message via the Graph API (`/{page-id}/photos`), supports `--dry-run` (prints text + image path, no network write) and `--only <n>`.
- Dedupe: record posted ids in a file next to `fb-posted.json` (same pattern). Never double-post.
- Dry-run all posts, show the owner, then wait for "go".

## Step 5 - Cadence
1 post per day, Post 0 first, then alternate Maths / Arabic, best-scoring themes first. Owner can run `--only <n>` by hand any day. No cron until the owner asks.

## Step 5b - Scheduling (decided 2026-10-13, replaces "1 post per day")
- Cadence: max 3 posts/day at **12:30, 18:30, 20:45 Africa/Tunis**. Never every 30 min.
- Mechanism: Graph API native scheduling (`published=false` + `scheduled_publish_time` UNIX ts), reuse the code in `src/server/facebook.ts`. No cron, no PM2 job, no `scripts/fb-drip-sync.ts` (known bugs).
- Check Meta limits before coding (scheduled time must be within Meta's allowed window; verify in docs, do not assume). Schedule at most 7 days ahead per run.
- Queue file `parascolaire/FB-SCHEDULE.md` (or json): one row per post = order | class | book | theme id | subject | image | text | slot datetime | status (planned / scheduled / published) | Meta post id.
- Order: class, then book, then theme number, alternating Maths / Arabic; skip anything already in `parascolaire/outputs/fb-parascolaire-posted.json`.
- Dedupe: write the Meta id into the log at schedule time; a rerun never schedules the same theme twice. `--dry-run` prints the full calendar first; owner says "go" before any real call.
- Token: read from `.env`, never print. If Meta rejects the token, stop the whole run.
- New items (course decks, videos) join the queue only after the owner approves their text.

## Step 6 - Report back
Short summary to the owner: audit table (keep/skip), final texts, dry-run output, anything unverified. Commit docs only (`docs(parascolaire): ...`), never secrets.
