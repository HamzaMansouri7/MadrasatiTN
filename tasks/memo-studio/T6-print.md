# Task T6: Print / PDF

Goal: reliable A4 print of the selected layout. Read GEMINI.md section 5 first.

1. `src/styles.css` `@media print` (lines ~171-336): make sure the memo layout root is whitelisted (`.print-page` / `.print-document` already are) and nothing else prints. Add `print-color-adjust: exact; -webkit-print-color-adjust: exact` for memo sheets.
2. "Print / Save PDF" button in `memo-studio.ts` calling `window.print()`, hidden in print (`no-print`).
3. MVP REQUIREMENT (core teacher need): the teacher's own name (and school, optional custom text/logo) is printed as a watermark + footer on every memo by default, taken from the logged-in profile and editable on the sheet (reuse `customWatermark`, `authorName`, `school` as in `store.saveWorksheet`). Optional toggles: ministry header and the `MADRASATI TN` mark, per GEMINI.md section 5. Watermark must survive print and be hard to crop out (diagonal + footer).
4. Verify: one sheet = one page, no blank trailing page, colors kept, contenteditable chrome (outlines, buttons) hidden.

Do NOT add a PDF library.

## Acceptance
Chrome print preview is correct for all 3 layouts in AR and FR.
