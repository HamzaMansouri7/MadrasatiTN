# Task T10: Word (.docx) export (Phase 2)

Depends on: T1-T6.
Goal: teachers can download the memo as an editable Word file.

1. Choose the approach after checking `package.json`: a server endpoint `/api/memo/export-docx` using the `docx` npm package (preferred, server-side, SSR-safe) built from the `MemoDoc`. Do NOT screenshot the layout into an image.
2. Structure: title, numbered steps, one table per concept card (label / definition / examples), the analysed example as a two-column table, "à ne pas oublier" list, formula, quote. Respect RTL for Arabic (`bidirectional` paragraphs, right alignment).
3. Same middleware chain as other endpoints (`originGuard`, `aiRateLimiter` is not needed since no AI call; add a light rate limit like `uploadRateLimiter`).
4. "Download Word" button next to Print in `memo-studio.ts` (`no-print`).

## Acceptance
Downloaded file opens in Word/LibreOffice, Arabic renders right-to-left, French left-to-right; lint + build pass.
