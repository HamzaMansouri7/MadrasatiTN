# Task T12: Browser verification (Playwright)

Depends on: T1-T6.
Goal: prove the feature works in a real browser. Do NOT change app code except to fix bugs found; report them.

1. `pnpm run dev`, open `/memo-studio` with `GEMINI_API_KEY` set.
2. Run all 5 input modes (topic, pasted text, screenshot, PDF, library item). Save a screenshot of each result.
3. For each of the 3 layouts in AR and FR: take a screenshot, edit one text field, regenerate one block, then emulate print media and check A4, one page, colors kept, no blank page.
4. Negative cases: oversize image, wrong mime, path traversal in `resourceUrl` -> expect 400.
5. Write the results to `tasks/memo-studio/E2E-REPORT.md` (pass/fail per case, screenshots path, bugs found).

## Acceptance
Report exists with a pass/fail for every case; bugs listed with file and line.
