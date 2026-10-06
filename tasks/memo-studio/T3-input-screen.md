# Task T3: Memo Studio input screen

Goal: page component where the teacher picks an input mode and generates. Template to copy: `src/app/features/summarize/summarize-home.ts`. Do NOT build the layouts (T5).

## `src/app/features/memo-studio/memo-studio.ts`
- `MemoStudioComponent`, selector `app-memo-studio`.
- Tabs: Topic | Text | Photo/Screenshot | File (PDF/DOCX) | From library.
- Selectors: grade (1-6), subject, trimester (optional), language (AR default). Optional "instructions" textarea.
- Photo: drag-drop, file picker, and Ctrl+V paste of screenshots; use `downscaleImage` from `src/app/core/utils/image.util.ts`; up to 8 images.
- File: accept pdf/docx, base64 via FileReader.
- Library: list from `assets/resources/index.json` (reuse the loading in `features/bd/bd-library.ts`); selecting an item sets `resourceUrl`.
- For photo/file: after generation show an editable "extracted text" box with a "Regenerate with this text" button.
- State: `signal<'idle'|'analyzing'|'done'|'error'>` plus `errorMessage`; call `store.generateMemo` (T2).
- On `done`: layout switcher (3 pills), `@switch` over `<app-memo-*-layout>` (T5), print button (T6).
- All strings in the dictionary (FR + AR). UI per DESIGN.md.

## Acceptance
All 5 modes reach the store call; errors are shown; a11y lint rules pass.
