# Task K4: Document-intake skills (S5 solve, S7 summarize, S11 tag, S12 worksheet)

Depends on: K0, K1. Endpoints: `/photo-solve` (+ unused `/solve-exercise`), `/summarize-docs`, `/auto-tag-document`, `/analyze-worksheet`, `/generate-similar` in `src/server.ts`. Callers: `solve-home.ts` L66, `summarize-home.ts` L127, `teacher-home.ts` L1889/1995, `education-store.ts` L908/949/965.

## S5 `skills/solve.ts` (photo-solve; merge solve-exercise logic)
- Add `status: 'ok' | 'unreadable' | 'not_exercise'`; other fields optional when status != ok. Refuse inappropriate or non-educational images politely.
- Use only methods taught at the grade (no algebra for primary). `parentGuide` explains the method without giving the answer; `solutionText` is the full solution (clear two-part contract in the prompt).
- Add `unknown` to grade/subject enums; no forced guesses. thinkingBudget on; temperature 0.2. Keep image part first, text last.

## S7 `skills/summarize.ts`
- Single language rule: document language, Arabic if mixed (remove the conflict with `langRule`).
- Keep zero-hallucination. Glossary: only terms present in the source; each entry flagged `fromSource: boolean`.
- Summary length by grade; `unknown` allowed for grade/subject/trimester; tashkeel for AR grades 1-3. Wrap `title` with `wrapData` + cap.

## S11 `skills/tag.ts`
- Add `unknown` values and a `confidence` (low|medium|high). Add language policy for `summary`.
- Fix the non-AI fallback (~L884-917): return `unknown` instead of fake "Trimestre 1" / `hasCorrection: true`; fix the `name.includes('1')` heuristic.
- Allow `application/pdf` (currently forced to image/jpeg). Cap `extractedContent`.

## S12 `skills/worksheet.ts` (analyze-worksheet DNA + generate-similar)
- One language policy; handle `mixed` and `en` (English worksheets get English prompts and no Arabic grounding; see `dnaLang` ~L1384).
- Extend subject enum (التربية الإسلامية…), richer `kind` enum (comprehension, grammar, problem), validate palette HEX, remove placeholder examples that leak ("Addition jusqu'à 10", "Phonics Tt").
- `imagePrompt`: English, no text in the image, child-safe. Anti-duplication compares content, not only headings. Cap/validate client `dna`.

## Acceptance
Blurry/non-exercise photo returns `status` != ok with no hallucinated solution; PDF tag works; English worksheet stays English; specs + lint + build pass.
