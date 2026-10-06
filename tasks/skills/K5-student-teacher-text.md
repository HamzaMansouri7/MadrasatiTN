# Task K5: Student explain, announcements, exam decision (S6, S10, S4)

Depends on: K0, K1. Endpoints: `/explain-concept` (`student-home.ts` L448), `/draft-announcement` (`editor-studio.ts` L620), `/generate-full-exam` (no client).

## S6 `skills/explain.ts`
- Reading level and max length per grade; analogy rule; encouraging tone.
- Split `checkQuestion` and `checkAnswer` into two fields (client currently shows both together — update `student-home.ts` to hide the answer until tapped, minimal change).
- Off-programme or inappropriate concept -> gentle redirect message. Grounding kept. temperature 0.3.

## S10 `skills/announcement.ts`
- Letter types: `announcement`, `parent_letter`, `lesson_prose` (the editor also uses this endpoint for prose). Arabic formal letter conventions (salutation, closing, signature placeholder).
- Never invent dates, names or events: use placeholders `[date]`, `[nom]`. Remove silent default texts ("Devoir de synthèse à venir") and the mandatory emoji in the title. temperature 0.4.

## S4 `skills/exam.ts` — DECIDED: wire it into the UI (owner said yes)
- `generate-full-exam` has no client today. Add an "Exam" entry in `/editor` (button next to the exercise generator) that calls it and inserts the resulting blocks into the document. Skeleton work: subject-specific skeletons (math: numérique / géométrie / problème; Arabic: compréhension / langue / production écrite; French: lecture / langue / production écrite), per-grade barème (10 or 20), fix typo "Somnative" (~L700), verification pass for the corrigé. Keep `solve-exercise` decision open: merge into S5 (K4) or remove if still unused.

## Acceptance
Student sees the answer only on tap; announcement has no invented facts; an exam can be generated from `/editor` and printed; lint + build + specs pass.
