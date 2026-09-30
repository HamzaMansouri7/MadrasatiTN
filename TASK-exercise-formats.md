# Task: Structured Exercise Formats for Editor Studio (Phase 1)

Goal: support real Tunisian primary exercise formats as structured data inside the existing `exercise` block — QCM, Vrai/Faux, Texte à trous, Relier par flèches. Do NOT create new top-level block types.

## 1. Model — `src/app/features/editor/editor.model.ts`

Add to `EditorBlock`:

```ts
export type ExerciseFormat = 'free' | 'qcm' | 'true_false' | 'fill_blanks' | 'matching';

// on EditorBlock:
exerciseFormat?: ExerciseFormat;          // default 'free' (current behavior)
qcmOptions?: string[];                    // qcm: 3–4 options
qcmCorrectIndex?: number;                 // qcm: teacher-only, goes to exerciseSolution rendering
tfStatements?: { text: string; answer: boolean }[];  // true_false
gapText?: string;                         // fill_blanks: use [[mot]] markers for gaps
matchingPairs?: { left: string; right: string }[];   // matching: rendered shuffled on right column
```

## 2. Editor UI — `src/app/features/editor/editor-studio.ts` (exercise case in left canvas)

- Add a format selector (5 pills: Libre / QCM / Vrai-Faux / Trous / Flèches) at the top of the exercise block editor, bound to `exerciseFormat` via `updateBlockField`.
- Per-format inputs:
  - **qcm**: énoncé textarea + dynamic option rows (add/remove, min 2 max 5) + radio to mark correct.
  - **true_false**: dynamic statement rows + V/F toggle each.
  - **fill_blanks**: one textarea for `gapText`; helper text: "Entourez les mots à cacher avec [[mot]]".
  - **matching**: dynamic pair rows (left / right inputs, add/remove).
- Keep barème (points) + corrigé accordion working for every format.

## 3. A4 Print Preview (same file, RENDERED BLOCKS PREVIEW section)

- **qcm**: énoncé, then options as "☐ a) …  ☐ b) …" grid (2 cols).
- **true_false**: each statement + trailing "( صواب / خطأ )" or "(V / F)" with empty boxes.
- **fill_blanks**: render `gapText` replacing each `[[mot]]` with "…………" (dot run sized ≥ word length).
- **matching**: two columns; left = lefts in order, right = rights SHUFFLED (deterministic shuffle by block id so print is stable); no lines drawn.
- Corrigé (teacher view / solutionText path): show correct answers (qcm letter, V/F, hidden words, matched pairs).
- Keep click-to-edit behavior consistent (editing opens the format-specific inputs inline like current exercise inline editor — acceptable to open only énoncé inline and full format editor stays in left canvas).

## 4. AI — `src/server.ts` `/api/ai/generate-exercise`

Extend the JSON contract: accept optional `format` in the request body and instruct Gemini to return, in addition to current fields:
`"format": "qcm"|"true_false"|"fill_blanks"|"matching"` plus the matching data fields above (same names). Keep backward compatibility (absent → free).
In `editor-studio.ts` `generateWithGemini`, map these fields onto the new block via `updateBlockField`.

## 5. Persistence

Draft autosave already serializes whole blocks (localStorage `madrasati_studio_draft`) — new fields ride along automatically; just verify `loadDraft` restores them (it uses `blocks.set(draft.blocks)` — should already work).
`getCompiledContentText()`: extend to serialize each format to readable markdown (options list, V/F list, gaps shown as ___, pairs as "A ↔ B") so publish-to-bank keeps content meaningful.

## Constraints

- DESIGN.md tokens; no new deps; OnPush + signals; modern control flow only (`@if/@for/@switch`); never `\'` in template strings (use double quotes).
- Gates: `npx tsc --noEmit -p tsconfig.app.json` = 0, `npx eslint` on touched files = 0, `npx ng build --configuration production` = 0.
- Labels need `for`/`id` pairs (angular-eslint template rules are strict in this repo).
