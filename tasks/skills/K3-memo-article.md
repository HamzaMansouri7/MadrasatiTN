# Task K3: Memo and article skills (S8, S9) — highest priority after K1

Depends on: K0, K1. Files: `src/server/memo-schema.ts` (`buildMemoPrompt`), `/api/ai/generate-memo`, `/api/ai/chat-article` in `src/server.ts`; callers `education-store.ts` (L1131/1172), `article-studio.ts` L496.

## S8 `skills/memo.ts` — subject-aware fiche mémo
- Replace the grammar bias ("DÉTERMINANT + NOM = GROUPE NOMINAL" baked into the prompt) with per-subject blueprints chosen from `subject`:
  - Grammaire/Conjugaison: concept cards + analysed sentence (`example.analysis`).
  - Mathématiques: method steps + worked example + formula.
  - Éveil Scientifique: concept cards + observation/experiment + vocabulary.
  - اللغة العربية: القاعدة + أمثلة + إعراب مبسّط.
  - Unknown subject: neutral steps + cards.
- Explicit rule: omit `example` and `formula` when not applicable (never force them).
- `quote`: only taken from the source, or a clearly generic motto; never an invented proverb/attribution.
- Modes text/image/file: keep the teacher's wording; `extractedText` required in schema for image/file.
- Cap `currentMemo` (capJson, e.g. 8000 chars) and `instructions` (500) and wrap in data tags.
- Few-shot: one compact example per blueprint (use the "Ma fiche mémo — déterminants" content as the grammar example).
- Replace the local `langInstruction` copy with `languagePolicy` from K1. Keep `BLOCK_SCHEMAS` regeneration working. temperature 0.3.
- Fix path check in resource mode (`startsWith(root)` -> `path.relative` must not start with `..` or be absolute). Add a test for the `resources-evil` bypass.

## S9 `skills/article.ts`
- Send real multi-turn `contents` with roles (`user`/`model`) instead of a joined string; keep the last 12 turns.
- Patch-style edits: return only the changed sections plus `sectionIds` (or keep full article but add an instruction to preserve untouched sections verbatim — pick the one that needs the fewest client changes in `article-studio.ts`, and document it).
- Free-topic mode guardrails: no medical/legal claims, flag uncertainty. Use `resolveLang` (remove the Arabic-character sniffing at ~L1646). Cap article length. temperature 0.5.

## Acceptance
Memo for a math topic does not contain grammar-style analysis; for grammar it does; injection text in `instructions` does not change the format; the path-traversal test passes; lint + build + specs pass.
