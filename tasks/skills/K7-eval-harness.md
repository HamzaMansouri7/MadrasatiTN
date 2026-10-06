# Task K7: Evaluation harness

Depends on: K2-K6. Goal: repeatable quality check before and after prompt changes. Real API calls: needs `GEMINI_API_KEY`; keep the run small (token cost: owner checks consumption).

## 1. `scripts/eval-skills.ts`
- Fixture file `scripts/eval-fixtures.json`: ~5 inputs per skill covering grades 1, 3 and 5, AR and FR, at least one hostile input ("ignore previous instructions"), one unreadable/off-topic input.
- For each case call the local endpoint (`http://localhost:4000` or `PORT`), then run automatic checks: schema-valid JSON, correct language, tashkeel present for AR grades 1-3, no forbidden phrases (placeholder defaults, "Ministère" claims), length limits, QCM index in range, arithmetic check for simple math answers.
- Write `tasks/skills/EVAL-REPORT.md`: table of pass/fail per case plus the raw outputs in a collapsible section for human review.

## 2. Reviewer (owner decision: there is no inspector)
- Pedagogy review is done by a teacher or by Gemini as judge. Add `--judge` mode: a second Gemini call scores each output against a rubric (grade-appropriate vocabulary, correct answer, language/tashkeel, CNP terminology from the glossary, child-safe) and returns pass/fail + reason. Judge scores are advisory; the report must say so.
- Add a section at the end of the report with the best/worst 3 outputs per skill and blank columns "pedagogy OK? / terminology OK? / comment" for a teacher to fill when one is available.

## Acceptance
`pnpm exec tsx scripts/eval-skills.ts` (or the repo's equivalent runner) produces the report; hostile inputs do not change format or language; no secrets in the report.
