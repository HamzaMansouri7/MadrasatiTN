# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> A detailed architecture & standards spec already exists in [GEMINI.md](GEMINI.md). This file is the quick operational guide; read GEMINI.md for the full vision, print/watermark engine, and deployment playbook.

## Project

Madrasati TN — educational platform for the Tunisian primary system (1ère–6ème). Unifies Teachers and Parents into role-based workspaces (no student accounts or student section). Stack: Angular 21 (standalone, signals, OnPush) + Tailwind 4 + Express 5 SSR + Google Gemini AI + Firebase.

## Commands

```bash
pnpm run dev          # ng serve on :3000, host 0.0.0.0, HMR (local dev)
pnpm start            # ng serve on default :4200
pnpm run build        # production build → dist/
pnpm run serve:ssr:app  # run built SSR server: node dist/app/server/server.mjs
pnpm run watch        # dev build, rebuild on change
pnpm test             # vitest (Angular CLI test runner)
pnpm run lint         # eslint (angular-eslint + typescript-eslint)
```

Single test: vitest is the runner — `pnpm exec vitest run path/to.spec.ts` or `-t "test name"`. Only spec currently present: [src/app/app.spec.ts](src/app/app.spec.ts).

Env: server AI endpoints require `GEMINI_API_KEY`; if unset, `ai` is null and `/api/ai/*` return errors ([src/server.ts:58](src/server.ts#L58)). SSR port via `PORT` (default 4000).

## Architecture — the non-obvious parts

**Router + role store hybrid.** [app.routes.ts](src/app/app.routes.ts) defines lazy routes (`/`, `/teacher`, `/parent`, `/discovery`, `/bd`, `/editor`, `/article-studio`, `/generate`); [app.ts](src/app/app.ts) keeps `store.currentRole()` synced with the URL via `routeToRoleMap`. New page = lazy route + entry in that map.

**Single global signal store.** [education-store.ts](src/app/core/services/education-store.ts) (~950 lines) holds all app state as Angular signals + `computed` derivations (activeClass, classCourses, filteredExercisesBank, watchlist, etc.). Injected everywhere. State changes go through store methods, not local component state.

**Dual persistence.** Firestore (via [firebase.service.ts](src/app/core/services/firebase.service.ts)) for auth/user profiles + domain data; `localStorage` for watchlist & comments (keys `madrasati_watchlist`, `madrasati_comments`) — all localStorage access is `typeof localStorage !== 'undefined'` guarded for SSR safety. Preserve those guards.

**Zero-cost file storage.** Uploads are base64-POSTed to `/api/upload`, written to VPS disk under `/uploads`, static-served — no Firebase Storage. See [server.ts](src/server.ts).

**AI is server-side only.** 12 Express endpoints under `/api/ai/*` call `gemini-2.5-flash` via `@google/genai` — all through the shared `aiGenerateJSON` helper (JSON mode + responseSchema + 1 retry) and grounded in the official curriculum via the KnowledgeSource layer ([src/server/knowledge-source.ts](src/server/knowledge-source.ts)). Extend grounding by adding adapters/sources there — never inline curriculum text in endpoint prompts. `language` param defaults to `'ar'` (Arabic is primary). Key never reaches the client.

**Extracted curriculum resources** (sliced CNP book pages) live in `public/assets/resources/<grade>/<subject>/<trimester>/<topic>/` with a per-topic `manifest.json`, all registered in `public/assets/resources/index.json` (loaded by the `/bd` viewer). Extraction rules: [RESOURCE-PIPELINE.md](docs/RESOURCE-PIPELINE.md); images are WebP max 1600px (`scripts/optimize_resources.py`).

**Import via barrels + aliases.** Always `@core` / `@shared` / `@features` (tsconfig paths). `src/app/{services,models,data}/*` are legacy re-export shims pointing at `core/*` — don't add code there; import from `@core`.

**i18n.** All UI strings go in `LanguageService.dictionary` (FR + AR), referenced as `lang.t('key')`. Never use `\'` inside template interpolations (Angular parser breaks). See GEMINI.md §6.

## Conventions

- `ChangeDetectionStrategy.OnPush` on every component; modern control flow only (`@if`/`@for`/`@switch`).
- Print/A4/watermark logic lives in [styles.css](src/styles.css) `@media print` — see GEMINI.md §5 before touching print layout.

## UI / Design (mandatory)

Any UI work must follow [DESIGN.md](DESIGN.md) — the "Cartouche officielle" design system. Workflow: **(1)** invoke the `frontend-design` and `ui-ux-pro-max` skills first, **(2)** then apply DESIGN.md's exact tokens (tokens win over skill defaults), **(3)** match the landing page ([landing-home.ts](src/app/features/landing/landing-home.ts)) pixel-for-pixel — same hex, radius, spacing, `font-display` headings. No indigo/purple, no gradient heroes, no emoji-as-icon, no WhatsApp share copy.

## Facebook auto-post

Published worksheets and published infographics (course/exercise) are auto-posted to the Facebook Page from `POST /api/docs` via [src/server/facebook.ts](src/server/facebook.ts) (Graph API, fire-and-forget, deduped by doc id in `docs/fb-posted.json`). Env: `FB_PAGE_ID`, `FB_PAGE_TOKEN` (Page token with `pages_manage_posts` + `pages_read_engagement`), `PUBLIC_BASE_URL`; disabled if any is unset. Never commit or print the token.
