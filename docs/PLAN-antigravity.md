# PLAN for Antigravity — Navigation, Create hub, Series feature

Written by Claude Code, 2026-10-08, for Antigravity to execute end to end. Owner: Hamza. Read this whole file first, then [CLAUDE.md](../CLAUDE.md), [DESIGN.md](../DESIGN.md), [GEMINI.md](../GEMINI.md), [PLAN-infographic.md](PLAN-infographic.md) and [docs/infographic-target-prompt.ar.md](infographic-target-prompt.ar.md).

Nothing below is built yet. Facts marked *(unverified)* come from analysis, not from running the app: confirm in the code before relying on them.

## 0. Rules of engagement (non-negotiable)

1. **Free only.** The owner never pays. Use the existing chains in `src/server/ai/models.json` and the image chain in `src/server/ai/image-chain.ts`. No paid model, no new paid service.
2. **No browser, no screenshots** unless the owner asks in the current conversation. Verify with `pnpm exec tsc --noEmit -p tsconfig.app.json`, `pnpm exec eslint src`, `pnpm test` (NOT raw `vitest run`, it lacks the Angular TestBed setup) and `pnpm run build`. Say clearly when a visual check was not done.
3. **Commit hygiene.** Stage explicit paths only, never `git add -A`: another agent may have uncommitted files in the same working tree. Run `git status` before every commit. One task = one commit.
4. **No deploy without the owner saying "deploy".** Recipe is in section 6.
5. **UI work:** follow `DESIGN.md` tokens ("Cartouche officielle"), match the landing page, no indigo/purple, no gradient hero, no emoji as icons. All UI strings through `lang.t('key')` or `lang.tr('fr','ar')`. Arabic (RTL) is primary. Components: standalone, `OnPush`, signals, `@if/@for`. Import via `@core` / `@shared` / `@features` only.
6. **AI rules:** client calls go through `AiClient` (`src/app/core/services/ai-client.ts`). Server prompts live in `src/server/skills/*` and are composed with `compose()`. Never inline curriculum text in routes; use the KnowledgeSource layer. Do not add a compat layer: the old one was deleted on purpose.
7. **Be careful with quota.** Never fire all AI endpoints in parallel locally. Run sequentially. The Cloudflare image budget is 10,000 neurons/day shared (*unverified reset time*).
8. **Ask the owner one question at a time**, calmly. When in doubt, use the default stated below and note it in the commit message.

## 1. Owner decisions and defaults

Use the default unless the owner answers otherwise. Record which default you used.

| ID | Decision | Default |
|---|---|---|
| D1 | Who creates series | Teachers only (login required). Everyone reads free in the library |
| D2 | Series scope | History first (subject `Histoire & Géographie`), but keep templates generic |
| D3 | Palette for series pages | Cartouche tokens from `DESIGN.md`, plus one accent colour per panel header taken from the existing palette |
| D4 | Navigation | 4 groups: Learn/Find, Understand, Create, Space. "Understand" stays its own group |
| D5 | Build order (owner agreed 2026-10-08) | One shared infographic engine; **lesson plan (جذاذة) first**, history series second. Lesson plans are private to the teacher by default, with an optional publish |

## 2. Phase A — Foundations (small, do first)

| Task | What | Done when |
|---|---|---|
| A1 | Add `scripts/contract-ai.mjs`: posts each of the 12 `/api/ai/*` endpoints with the exact canonical client payload, **sequentially**, and checks the response key the client reads. Keys: generate-exercise→exercise, transform-exercise→exercise, variant→exercise, draft-announcement→announcement, explain-concept→explanation, auto-tag-document→metadata, photo-solve→solution, summarize-docs→summary, generate-memo→memoDoc, analyze-worksheet→dna, generate-similar→exercises, chat-article→assistantMessage. Add `pnpm run test:contract` | Script runs against a local build (`PORT=4010 node --env-file=.env dist/app/server/server.mjs`); a 503 from a provider is reported as "provider", not "contract" |
| A2 | `generate-full-exam` has no client caller *(unverified, grep first)*. Wire it to the editor's exam document as a "Generate full exam" action through `AiClient`. `solve-exercise` likewise: use it for the student tutor "solve" action or delete route + skill + tests | No orphan endpoint remains; contract script covers every endpoint that stays |
| A3 | Progress and retry UX for slow AI: shared component `<app-ai-status>` (elapsed hint after 5s, clear error text with a Retry button), used by summarize, solve, memo, generate, editor AI actions | Same wording everywhere; errors say what happened and what to do |
| A4 | Replace fake `createdAt: 'Il y a 2 jours'` seed strings with real dates rendered through the existing `timeAgo` pipe; unify the trimester default (FR vs AR) | No literal relative-time strings left in `education-store.ts` |
| A5 | Illustration cache: make sure repeated prompts reuse the stored file (route `/generate-illustration` already caches non-variation calls, verify) and add a spec | Spec proves cache hit skips `generateImage` |

Gate: `tsc`, `eslint`, `pnpm test`, `pnpm run build` all green before Phase B.

## 3. Phase B — Navigation and the Create hub

Goal: group features by user intent and give teachers one place to create.

| Task | What |
|---|---|
| B1 | **Route map.** Add `/create` (hub). Keep every existing route; add redirects only where a page merges. Update `routeToRoleMap` in `src/app/app.ts` for any new route |
| B2 | **Navbar** (`src/app/shared/components/navbar.ts`): four groups. Mobile bottom nav ≤ 5 items, 44px touch targets, visible keyboard focus, correct RTL tab order |
| B3 | **Landing** (`src/app/features/landing/landing-home.ts`): entry cards follow the same four groups; do not break the pixel-match to `DESIGN.md` |
| B4 | **`/create` hub page** (`src/app/features/create/`): choose an output with plain verb labels: Summary, Memo, Exercises, Exam, Worksheet, Series, Article. No numbered choices (not a sequence), no identical shadowed card kit: each output gets a small preview of what it produces. Deep-linkable (`/create?output=memo`) |
| B5 | **Shared input** `<app-source-input>` in `src/app/shared/components/`: tabs topic / text / photo / file (extract from `memo-studio.ts` and `summarize-home.ts`; reuse `downscaleImage` from `@core`). Outputs a typed `SourceInput` |
| B6 | **Chaining.** Store keeps the last `SourceInput` and last result. Result screens show "Make a memo / exercises / series from this" buttons that open `/create?output=…` pre-filled |
| B7 | **Merge entry points.** Teacher-space summarize and `/summarize` and memo input use the hub's shared input; remove the duplicated upload code. Existing deep links keep working |
| B8 | Library lists: finish adopting the shared cards. Parent/teacher already use them. Leave discovery's course card as is (it has upvote, watchlist, author, Q&A that `<app-doc-card>` lacks) |

Acceptance: from `/create` a teacher reaches every existing generator; old URLs still load; i18n keys present in FR and AR; no duplicated upload logic left (grep `FileReader` in features should shrink).

## 4. Phase C — Infographic engine + Lesson plan (جذاذة) — first deliverable

Reference: the owner found a lesson-plan template (A4 portrait, RTL, 12 sections, from a teachers' Facebook post). The post gave only the section list, not the prompt text; the owner may add the real prompt later. Do **not** copy that author's branding or social footer. Their context looked Algerian secondary: use our Tunisian primary fields (levels 1ère–6ème, curriculum grounding via KnowledgeSource).

The 12 sections (= template slots): lesson info strip (level, class, subject, week, date, duration, lesson title) · learning objectives · learning outcomes · teaching materials · lesson stages with minutes (intro, building, practice, evaluation, closing) · activities · assessment (methods + criteria) · differentiated learning (support + enrichment) · cross-subject integration · target values · homework · teacher reflection (5 questions with writing lines) · footer (teacher, school, school year from the profile settings, never invented).

| Task | What | Notes |
|---|---|---|
| C1 | **Engine model** `src/app/core/models/infographic.model.ts`: `InfographicTemplate {id,name,page:'A4-portrait',slots[]}`, `Slot {id,kind,count,maxChars,icon?}`, `InfographicDoc {templateId,values,author}`. Templates are **data** in `src/app/core/data/infographic-templates.data.ts` | New template = new data entry, no new code. Export through the `@core` barrel |
| C2 | **Lesson-plan template** with the 12 sections above as slots (counts and max lengths per slot, e.g. objectives 3, stages 5) | Validate slot counts and lengths |
| C3 | **Skill** `src/server/skills/lesson-plan.ts` (register in `skills/index.ts`), chain A, schema built from the template slots. Rules: grounded in the curriculum, grade vocabulary, Arabic default via `langRule`, stage minutes must add up to the chosen duration, no invented curriculum facts. Add checks in `src/server/post-checks.ts` (stage-minutes sum, slot lengths, Western digits) | Never inline curriculum text; use KnowledgeSource |
| C4 | **Route** `POST /api/ai/generate-lesson-plan` (guards: `originGuard`, `aiRateLimiter`; `capText`, `resolveLang`, `toPublicError`) plus section-level regenerate (`section` param) | Add to `scripts/contract-ai.mjs` and `scripts/eval-skills.mjs` |
| C5 | **Renderer** `<app-infographic-page>`: generic slot renderer plus the lesson-plan layout (two columns, stage timeline 01–05, coloured section headers, writing lines for reflection). RTL, A4 portrait, Cartouche tokens, one accent per section from the existing palette, icons from the existing icon set (no emoji). Add to the `@media print` whitelist in `src/styles.css` (read GEMINI.md §5) | Text is always real Arabic text rendered by the page, never inside an image |
| C6 | **Create hub entry** (`/create?output=lesson-plan`): inputs level, subject, topic, duration; optional lesson text or photo via `<app-source-input>`. Inline edit of every slot, per-section regenerate, `<app-ai-status>` while generating | Footer teacher/school/year pre-filled from the profile |
| C7 | **Save / load / export**: `/api/docs` with `kind:'lesson-plan'`, private by default, optional publish to the library; print and PDF through `PrintService` | Deep link `/lesson-plan/:id` |
| C8 | **Tests**: slot validator, skill compose test, post-check specs, route validation spec, renderer spec, one eval case; `pnpm test` green | |

Acceptance: a teacher enters level + subject + topic and gets a printable one-page lesson plan in under about a minute with correct stage timing; all text is selectable Arabic; nothing is generated inside an image.

## 5. Phase D — Series (history infographic) feature

Reuses the engine from Phase C. Target behaviour is the 19-rule prompt in `docs/infographic-target-prompt.ar.md`. Output = **separate A4 portrait panels**, linked and numbered, timeline right to left. The Facebook grid screenshot was only how one teacher posted them, **not** the output format.

**Principles:** the page renders all text (real RTL Arabic, Western digits 0-9, no foreign text); the image model only draws text-free illustrations; the author line is a template "من إنجاز {name}" with `name` from the profile settings, never typed or generated, omitted if no name.

| Task | What | Notes |
|---|---|---|
| D0 | **Spike (throwaway, `scripts/`)**: character consistency. One fixed character block + one style preset, 4 scene prompts through `generateImage`. Owner looks at the 4 images. Pass = same-looking characters in ≥ 3 of 4 | Uses Cloudflare quota. If it fails, stop and tell the owner; fallback is symbolic/icon-only panels. Do not build the image path before this passes |
| D1 | **Model** `src/app/core/models/series.model.ts`: `SeriesDoc {id,title,grade,subject,language,bible,scenes[],author}`, `Scene {n,title,event,year?,text,caption?,imagePrompt,imageUrl?,kind:'scene'\|'roles'\|'map'\|'timeline'}`, `SeriesBible {characters[],style,era}` | Export via `@core` barrel |
| D2 | **Skill** `src/server/skills/series.ts` (register in `skills/index.ts`), chain A. Two modes: `plan` (returns the scene table: number, title, core event, visual idea) and `panel` (fills one scene's text slots and an English, text-free image prompt that embeds the series bible). Rules from the prompt: no invented events/dates/people, flag doubtful facts instead of fixing them, preserve source meaning, auto-decide scene count, one teaching goal per scene, order intro→context→causes→events→results→conclusion | Schema + `validateAgainstSchema`; add checks in `src/server/post-checks.ts`: Western digits only, no Latin letters in Arabic text slots, text slot length limits |
| D3 | **Routes** in `src/server/routes/`: `POST /api/ai/plan-series`, `POST /api/ai/generate-series-panel`, `POST /api/ai/generate-series-image` (through `generateImage`, shared style + bible, one failed panel never fails the series). Guards: `originGuard`, `aiRateLimiter`; cap inputs with `capText`; `toPublicError`; `resolveLang` | Add to `scripts/contract-ai.mjs` and `scripts/eval-skills.mjs` |
| D4 | **Store + persistence.** Save/load a series like memos are saved (`/api/docs`, see `saveMemo` in `education-store.ts`); add `kind:'series'`; it appears in the library grid and is deep-linkable `/series/:id` | Author name/school from `firebase.userProfile()` |
| D5 | **Renderer** `<app-series-panel>`: A4 portrait, RTL, number badge, title, year chip, body text, illustration, "roles" variant (rows with portrait), footer author line. Uses Cartouche tokens, one accent per panel header (D3). Print CSS must be added to the `@media print` whitelist in `src/styles.css` (read GEMINI.md §5 first) | Images never cover text; text never below a legible size |
| D6 | **Create flow** under `/create?output=series`: paste lesson → plan table shown for approval (editable titles, delete/merge scenes) → generate panels one by one with per-panel status → per-panel "regenerate text" and "regenerate image" | Use `<app-ai-status>` from A3 |
| D7 | **Viewer** `/series/:id`: page by page with next/previous (RTL arrows), thumbnail strip, timeline across the top (right to left) | Read-only for everyone |
| D8 | **Export**: print each panel (`PrintService.printPage` with a series-print mode) and the whole series as one print/PDF run | PNG only if a free, simple path exists *(unverified)* |
| D9 | **Tests**: skill unit tests (`compose` includes bible + rules), post-check specs, route validation specs, one eval case with the Ottoman–Spanish lesson, component spec for the renderer | `pnpm test` green |

## 6. Phase E — Close out

1. Run full verification: `tsc`, `eslint`, `pnpm test`, `pnpm run build`, `pnpm run test:contract` (sequential, one provider 503 is acceptable, a missing key is not).
2. Update memory-style docs: append results to `PLAN-infographic.md` status; leave the owner a short summary of what changed and what is not visually verified.
3. Tell the owner it is ready; wait for "deploy".

## 7. Deploy recipe (only on the owner's word)

`ssh root@169.58.107.183`, then `cd /root/MadrasatiTN && git pull --ff-only && pnpm install --frozen-lockfile && pnpm run build && pm2 restart MadrasatiTN --update-env && pm2 save`. App listens on 3004 behind nginx. Do not edit PM2 env secrets.

## 8. Stop-and-ask triggers

- D0 fails (consistency) → stop, show the owner the images.
- Any task needs a paid service → stop.
- A change would remove an existing route without a redirect → stop.
- Provider quota exhausted during tests → wait, do not loop.
