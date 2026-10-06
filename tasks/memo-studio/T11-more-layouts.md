# Task T11: More layouts (Phase 2)

Depends on: T5.
Goal: add 3 layouts to `MemoLayout` using the same `MemoDoc` (add optional fields only if needed, keep T1 schema and T2 model in sync):
- `timeline`: horizontal/vertical timeline (history, lessons with ordered events).
- `table`: comparison table (two or more concepts side by side).
- `conjugation`: conjugation/declension grid (verb x pronoun) for grammar topics.

Rules: same requirements as T5 (`print-page`, contenteditable, no-print controls, DESIGN.md tokens, RTL logical classes). For new fields, extend `MEMO_SCHEMA` and `buildMemoPrompt` so the AI fills them only when the topic fits; layout switcher in T3 shows only layouts the data supports.

## Acceptance
Each new layout renders a fixture in AR and FR and prints on one A4 page; existing 3 layouts unaffected; lint + build + spec pass.
