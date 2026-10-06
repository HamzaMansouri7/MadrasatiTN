# Memo Studio — task index (for Antigravity)

Master plan: [PLAN-memo-studio.md](../../PLAN-memo-studio.md). Shared contract = `MemoDoc` defined in T2.

Order: T1 + T2 first (parallel) -> T3, T4, T5 (parallel) -> T6 -> T7 (alongside).
After T1-T6: T12 (browser check), then T8 (save/share) -> T9 (attribution); T10 (Word) and T11 (more layouts) are independent.
T13 (deployment) is always LAST, only after the owner approves.

Global rules for EVERY task:
- Read CLAUDE.md, GEMINI.md and DESIGN.md first.
- Standalone components, OnPush, signals, `@if/@for/@switch` only.
- Import via `@core` / `@shared` / `@features` aliases.
- UI strings go in `LanguageService.dictionary` (FR + AR). Never use `\'` inside template interpolations.
- UI follows DESIGN.md tokens: no indigo/purple, no gradients, no emoji as icons.
- Keep `typeof localStorage !== 'undefined'` guards (SSR).
- Run `pnpm run lint` and `pnpm run build` before finishing.
