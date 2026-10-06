# Plan — Memo Studio (AI "Fiche mémo" for teachers)

## Context
Teachers want AI-made one-page illustrated summary sheets (like the Facebook "Grammaire – Ma fiche mémo" poster). The app has exercises/exams/summaries but no visual memo sheet. Goal: a new `/memo-studio` page. Teacher gives input (topic / text / image / PDF-DOCX / library resource) → AI returns structured JSON → Angular renders it in 3 editable A4 layouts → print/PDF. Text is rendered by our templates (never AI-drawn) so FR/AR text stays correct. Decorations come from a free icon/sticker set; optional custom picture reuses `/api/ai/generate-illustration`.

Decisions taken:
- Follow DESIGN.md tokens (pine/paper/gold, `rounded-2xl`, `font-display`). Note: landing/navbar currently use blue `#007CC2`, contradicting DESIGN.md; the new page follows DESIGN.md.
- MVP prints/PDFs via `window.print()` (no PDF lib exists). Saving to library = phase 2.
- Arabic default (`resolveLang`), FR supported.
- Gemini model stays `gemini-2.5-flash`. Consumption to be checked by owner later.

## Reuse (do not reinvent)
- `aiGenerateJSON`, `resolveLang`, `langRule`, `buildGrounding`, schema consts `STR/NUM/INT/BOOL/STR_ARR` — `src/server.ts:354-398`
- Middleware chain `originGuard, aiRateLimiter, aiDailyGuard` — see `src/server.ts:978`
- Closest endpoint template: `summarize-docs` (`src/server.ts:1050-1109`, multi-image inlineData + grounding)
- Closest UI template: `src/app/features/summarize/summarize-home.ts` (image signals, FileReader, fetch, state signal idle/analyzing/done/error, `window.print()`)
- `downscaleImage` — `src/app/core/utils/image.util.ts`
- Print engine whitelist — `src/styles.css:171-336` (`.print-page`, `.print-document`)
- `lang.tr('fr','ar')` / `lang.t('key')` — `src/app/core/services/language.service.ts`
- Library items: `assets/resources/index.json` via `features/bd/bd-library.ts` (`BdItem`)

## Architecture
```
Input (5 modes) → POST /api/ai/generate-memo → MemoDoc JSON
  → MemoStore signal (editable) → layout component (tree | steps | cards)
  → contenteditable edit / per-block regenerate → print A4
```

### MemoDoc schema (shared contract, TS interface + server responseSchema)
```
title, subtitle, grade, subject, topic, language
steps[]: {n, heading, body}                  // "Ma méthode pas à pas"
cards[]: {label, definition, examples[], icon?, color?}   // determinant / nom commun ...
example: {sentence, analysis[]: {word, role}} // "J'analyse une phrase"
remember[]: string                            // "À ne pas oublier"
formula: {parts[], note}                      // formule-mémoire
quote: string
```

## Tasks (each delegable to Antigravity; format follows `TASK-exercise-formats.md`)

### T1 — Server: `/api/ai/generate-memo` (src/server.ts + src/server/memo-schema.ts)
- New file `src/server/memo-schema.ts` exporting schema + `buildMemoPrompt(input, lang)` (pure, testable).
- Endpoint body: `{ mode: 'topic'|'text'|'image'|'file'|'resource', topic?, text?, images?[{base64Data,contentType}], file?{base64Data,contentType}, resourceUrl?, grade, subject, trimester?, language, instructions?, blockToRegenerate? }`.
- Validation: topic ≤300, text ≤8000, ≤8 images, 16MB string limit like `photo-solve`, 400 on bad input.
- Image parts first, text last (as `summarize-docs`). PDF: allow `application/pdf` inlineData (Gemini reads natively; existing endpoints force image/jpeg so add explicit allow). DOCX: add `mammoth` dependency, extract text server-side, then treat as text. Resource: resolve only paths under allowed resources/uploads folder (path traversal guard).
- Always call `buildGrounding({grade, subject, trimester, topic, lang})`; prompt says "keep teacher's wording when text/image provided; do not invent curriculum facts".
- Regenerate-one-block: same endpoint with `blockToRegenerate` + current MemoDoc, returns only that block.
- Response `{success:true, result: MemoDoc}`; same error pattern as siblings.
- Acceptance: curl with each mode returns valid schema; rate-limit chain present.

### T2 — Model + store method (src/app/core/)
- `memo.model.ts` (MemoDoc, MemoLayout = 'tree'|'steps'|'cards'), export via `@core` barrel.
- `EducationStore.generateMemo(input)` + `regenerateMemoBlock()` following `generate-illustration` pattern (`education-store.ts` ~1100), SSR-safe.

### T3 — Input screen component (src/app/features/memo-studio/memo-studio.ts)
- Standalone, OnPush, signals. Tabs: Topic | Text | Photo/Screenshot | File | From library. Grade/subject/language selectors, optional "instructions" box.
- Photo: drag-drop + paste (Ctrl+V screenshot) + `downscaleImage`, mirror `summarize-home.ts`.
- Photo/file path shows "extracted text" preview step before generating (teacher can fix blurry reads) — needs T1 to return `extractedText` when mode is image/file.
- Library mode: picker over `index.json` items (reuse bd-library loading).
- State signal `idle|analyzing|done|error`. All strings in `LanguageService.dictionary` FR+AR.

### T4 — Route + nav registration
- `app.routes.ts`: lazy `memo-studio` with `authGuard` (generation is a studio action), bilingual title, before `**`.
- `app.ts` `routeToRoleMap`: `'/memo-studio': 'editor'`.
- Navbar desktop + mobile entry, teacher-home tile, `features/index.ts` export.

### T5 — Three A4 layouts (features/memo-studio/layouts/*.ts)
- `memo-tree-layout`, `memo-steps-layout`, `memo-cards-layout`: pure presentational components taking `MemoDoc` input signal.
- Each `.print-page`, A4 landscape-friendly, DESIGN.md tokens, RTL via logical classes (`ms-/pe-/border-e`).
- Editing: `contenteditable` spans/divs (inputs/textarea are hidden in print), commit on blur to the store signal. Add/remove card & step buttons (`.no-print`).
- Decorations: bundle a small free SVG icon/sticker set in `public/assets/memo/` (apple, pencils, book stack, globe, star, heart, magnifier…); picker per card. No emoji-as-icon.
- Optional "custom picture" button → existing `generate-illustration`.

### T6 — Print/PDF
- Add layout root selector to `styles.css` print whitelist; `@page` handled by existing rule (A4, 5mm margin); keep ministry header/watermark per GEMINI.md §5 as toggle.
- "Print / Save PDF" button → `window.print()`. Verify no blank page and colors print (`print-color-adjust: exact`).

### T7 — Tests + lint
- Vitest spec for `memo-schema.ts` (`buildMemoPrompt` per mode, schema shape) — pure functions, no supertest exists.
- Component spec: layouts render a fixture MemoDoc in AR and FR.
- `pnpm run lint` clean (a11y template rules: labels, key handlers).

### Phase 2 (not in MVP)
Save memo to library / share link (needs `GeneratedExercise` packing or new doc type via `/api/docs`), Word export, more layouts, teacher attribution on card.

## Execution order & delegation
T1 ∥ T2 first (contract = MemoDoc), then T3, T4, T5 in parallel, T6 last, T7 alongside. After approval: write `TASK-memo-T1.md … T7.md` at repo root in the `TASK-exercise-formats.md` format (Goal, "Do NOT", numbered sections by file path, acceptance) so Antigravity can pick them up independently; I review each PR-sized result.

## Verification
1. `pnpm run build` and `pnpm run lint` pass; `pnpm test` passes new specs.
2. `GEMINI_API_KEY` set, `pnpm run dev`: open `/memo-studio`, run each of the 5 input modes (topic, pasted text, screenshot like the Facebook poster, PDF, library item) → valid MemoDoc rendered in all 3 layouts.
3. Switch AR/FR: RTL correct, no `\'` in templates.
4. Edit text, regenerate one block, then browser print preview: A4, one page per sheet, no blank page, colors kept.
5. Try bad input (oversize image, wrong mime, path traversal in `resourceUrl`) → 400, not 500.
6. Playwright screenshot of each layout vs landing/DESIGN.md tokens.

## Open risks
- Blurry photos / handwriting → mitigated by extracted-text preview step.
- Gemini quota shared with owner account (to be checked by owner).
- `window.print()` has no true PDF file; acceptable for MVP.
- Existing landing blue vs DESIGN.md green mismatch — new page follows DESIGN.md.
