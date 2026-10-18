# Plan — AI chatbot

Decisions and tasks from the 2026-10-16 planning discussion.

## Status 2026-10-17 — core slice BUILT (branch feat/ai-chatbot, not deployed)

Done and verified (lint + build + `chat.spec.ts` 7/7; endpoint smoke-tested on local :4000 with UTF-8 bodies):

- **Endpoint `POST /api/ai/chat`** (`ai.routes.ts`) — classify → ground (`retrieveContext`) → answer or route. Stateless.
- **Skill `src/server/skills/chat.ts`** — `chatClassifySkill` + `chatAnswerSkill` (chain **A**, not flash-lite: the lite model was too weak), role-aware register (parent vs teacher), plus `refineIntent` (a keyword guard that overrides the shaky model and blocks false off_topic) and `allowIntentForRole` (teacher-only = `plan`).
- **Scope guard** (`off_topic` → polite refusal) and **graceful degradation** (answer step failing → retrieval-only reply with source links, never a bare error).
- **Abuse protection** — reuses the existing `aiRateLimiter` (per-IP + guest minute/daily caps; logged-in tier higher). Message + history length caps via `capText`.
- **Deterministic language** — answer language decided from the message script (`[؀-ۿ]` → ar), not the model (it guessed wrong).
- **Client**: `ChatContextService` (page-context signal), `ChatService` (single source of truth: `open`/`pending`/`thread`, `openChat(prefill)`, localStorage `madrasati_chat`, SSR-guarded), `<app-chat-drawer>` mounted in `app.html` (launcher + side panel / bottom sheet, role mode label, source chips, a Create-tool action card, follow-up chip, starters). `AiRoute` gained `'chat'`.

Design note (deviation from the 2026-10-16 wording): chat state lives in a dedicated **`ChatService`**, not on `EducationStore`, to keep the 950-line store lean. Still one service, one thread, one drawer — the "single surface" rule holds.

Known limitation: `off_topic` detection is model-dependent and imperfect (a sports question may get answered rather than refused); generate-intent routing is solid for keyworded requests, best-effort otherwise, and always degrades to a useful grounded answer. Tuning needs the labeled test set below.

Not built yet (deferred, unchanged below): lesson-card data shaping, infographic preset-picking, strong-model probing, `data/parascolaire/index.json` VPS check, index gap, teacher-published adapter, embeddings, contextual entry points on pages, dialect test set, perceived-latency step status, bot→document, question log, reuse cache.

---

## Update 2026-10-18 — study fixes and studio handoff (branch feat/chat-drawer-context)

- Chat chain **E** (lite Gemini first), retrieval relevance floor, real-coverage grounding: see `docs/CHAT-MODEL-STUDY.md`.
- **Tool registry** `core/services/chat-tools.ts`: one table intent → studio route; the handoff now fills `store.prefillSource` (request text, grade, subject, topicId, language) before navigating, instead of passing a `topicId` the studios ignored. New `series` intent routes to `/series/new`.
- Drawer: `dir="auto"` on bubbles, composer and follow-up, `<bdi>` on source chips, Esc closes, header mode is a toggle; mode now follows the signed-in profile before the page.
- Still open: page-context wiring on the 7 pages (keyed, DestroyRef-bound set), command bus for in-studio actions, source chips as links, article/exam/solve/similar tools, excerpt cap from the token study.

---

Original plan (2026-10-16):

## Rule: the drawer is the only chat surface

Decided 2026-10-16. No `/chat` route, no full-page chat, no second chat widget anywhere. One component, one thread, one state (the store signals). Any feature that wants AI conversation opens the drawer with `store.openChat(prefill)`; it never embeds its own chat.

## Rule: one bot, one name, role-aware modes

Decided 2026-10-16. One bot and one brand name for teachers and parents; no split. Role comes from `store.currentRole()` (already synced with the URL in `app.ts`). The drawer header shows a mode label: **"وضع الولي" / "Mode parent"** and **"وضع المعلّم" / "Mode enseignant"**. What changes by role: tone and vocabulary (plain for parents, pedagogical for teachers), teacher-only intents (worksheet, lesson plan, announcement, "my published docs"), default assumptions (parents asked for class; teachers' class from profile). Same endpoint, same thread, same knowledge.

## Concept (agreed)

- One new endpoint `POST /api/ai/chat`, fully hosted (no local inference; VPS has no GPU).
- Per turn: **classify** (cheap model → `{intent, grade, subject, topicId, lang}`) → **ground** (`retrieveContext`) → **dispatch** to the existing skill for that intent. The bot never regenerates what a feature already produces; it calls the skill and returns its output plus a card linking to the real page.
- Conversation history: client sends last N turns; stored client-side in `localStorage` (`madrasati_chat`), server stays stateless.
- Strong models for the answer step only: new chain in `src/server/ai/models.json`; classify stays on flash-lite.

## Tasks

- [ ] **Lesson cards (data shaping).** Build script that bundles, per `topicId`, the chapter competency (ar/fr) + its parascolaire exercises + corrections into one "lesson card" row (`origin: 'lesson-card'`). Retrieval returns cards instead of loose exercises so the bot gets context, not fragments. One-time script, output a JSON next to `data/parascolaire/index.json`, registered via `registerSources()`.
- [ ] **Clarifying questions.** When classify returns a missing/low-confidence `grade` or `subject`, ask one question before answering. If the user is logged in and a child's class is on the profile, skip the question.
- [ ] **Chat endpoint + skill** (`src/server/skills/chat.ts`, route in `ai.routes.ts`), intent → skill map: ask→explain, solve→solve/photo-solve, exercises→exercise, memo→memo, plan→lesson-plan, infographic→infographic, find→retrieval only.
- [ ] **Preset picking for the infographic intent** (added 2026-10-16). Classify also returns `command` chosen from the 27 commands in `VISUAL_PRESETS` (`src/app/core/data/visual-presets.data.ts`; feed it each command + `summary`, e.g. "QCM" → `/quizcard`, "jeu de révision" → `/boardgame`), or none for auto. Dispatch sends `preset = def.presetId`, `theme = def.themeId`, `command` to `/api/ai/generate-infographic`; the route already adds the command style and pins the preset. Unknown or missing command → `auto`. Card links to `/ai-studio` with the doc so the user can switch preset there.
- [ ] **Strong-model chain** for chat answers. Candidates (free tier, unverified): NVIDIA NIM (GLM/Kimi), OpenRouter `:free`, Groq, Cerebras, Mistral. Probe limits before relying on them.
  - OpenRouter free list pulled 2026-10-17 (`/api/v1/models`): 19 free of 469, none outputs images. Best fits for chat: `nvidia/nemotron-3-ultra-550b-a55b:free` (1M ctx, tools; same model we already call via NVIDIA, so a second provider for it), `nvidia/nemotron-3.5-super-vl:free` (text+image+video in, JSON structured outputs, tools: also a vision/OCR backup to Gemini), `dots-studio/dots-3-note-preview:free` (image in, structured outputs), `openrouter/free` (OpenRouter's router over its free models, structured outputs). Already in `models.json`: `nemotron-3-super-120b-a12b:free`. Limits and Arabic quality not tested. Ref (re-check, the list rotates): [openrouter.ai/collections/free-models](https://openrouter.ai/collections/free-models).
- [ ] **Verify `data/parascolaire/index.json` is on the VPS** (gitignored, read from cwd by `parascolaire-adapter.ts`). If missing, chat grounds on CNP chapters only. Fix = `scp` + `pm2 restart`.
- [ ] **Index gap.** `parascolaire/livres/` sums to 3,898 exercises, `index.json` has 3,675. Find the ~223 missing rows.
- [ ] **Teacher-published docs as a source.** New adapter `origin: 'teacher'` reading the docs store written by `POST /api/docs`, so the bot knows platform content, not just books.
- [ ] **Embeddings (later, only if keyword retrieval misses).** Hosted embedding API (Gemini or Cloudflare `bge`), vectors stored as JSON (~11 MB for 3.7k × 768), cosine similarity in JS. No vector DB.
- [ ] **Chat UI = global drawer** (accepted 2026-10-16). `<app-chat-drawer />` mounted in `app.html` next to `<app-auth-modal />`, outside the router outlet so it persists across navigation. Fixed launcher button bottom-end (RTL-aware via shell `[dir]`), side panel ~400px on desktop, full-height bottom sheet on mobile. State in the store as signals (`chatOpen`, `chatThread`, `chatPending`) + `store.openChat(prefill)`. No separate `/chat` route. Cartouche design system, `lang.t()` strings FR + AR, OnPush.
- [ ] **Page-context signal** (accepted). `ChatContextService` with one signal `{ grade, subject, topicId, bookId, page, docId, route }`. `/bd` sets it on chapter open, `/parascolaire` sets book + page, editor sets docId. Drawer sends it with every message so classify needs no clarifying question when context exists; empty context (landing) falls back to asking.
- [ ] **Contextual entry points** (accepted). One-click links that call `store.openChat('...')` with a prefilled prompt: "Ask about this exercise" on parascolaire cards, "Explain this chapter" on `/bd`, "Help me with this" in the editor.

## Accepted additions (2026-10-16)

Required for launch:

- [ ] **Abuse protection** (security, not a user limit). `/api/ai/chat` is public (public-first access model). Per-IP rate limit, daily message cap for anonymous users (higher when logged in), max message length. Protects the shared free quotas from scripts, not parents.
- [ ] **Scope guard.** `off_topic` intent in classify (politics, medical, adult, anything outside school) → polite refusal. System prompt forbids asking for or storing a child's personal details.
- [ ] **Graceful degradation.** When all providers are in cooldown (`src/server/ai/cooldowns.ts`), answer retrieval-only: "can't answer right now, here are the pages on this topic" with links. Never a bare error in the drawer.

Second wave:

- [ ] **Tunisian dialect + Arabizi.** Classify must understand dialect and Franco-Arabe input ("chnowa el 9isma fi 5ème"); answers stay formal AR/FR. Build a test set of ~20 realistic messages before launch.
- [ ] **Perceived latency.** Chain is non-streaming JSON. Show step status in the drawer ("Looking in the 5ème book… found 4 exercises… writing") before investing in token streaming (which complicates provider fallback).
- [ ] **Bot output → document.** "Save as document" on generated exercises/memos calls existing `POST /api/docs`, so the bot feeds the library (and Facebook auto-post for published docs).
- [ ] **Question log.** Store anonymised questions (no uid, no child name) with resolved grade/subject/topicId + thumbs up/down per answer. Becomes the content roadmap.
- [ ] **Teacher intents.** Worksheet from chapter, "what have I published on X", announcement draft; same drawer, teacher mode. Depends on the `origin: 'teacher'` adapter above.
- [ ] **Reuse cache.** `src/server/ai/cache.ts` for classify results and top recurring questions to save free-tier quota.

## Known limits of current knowledge

- Coverage uneven: 6ème 1,674 rows, 2ème 267.
- Rows are exercises + one-line competency; full course text is absent. "Explain how X works" answers will lean on exercise statements until lesson cards / teacher docs exist.
