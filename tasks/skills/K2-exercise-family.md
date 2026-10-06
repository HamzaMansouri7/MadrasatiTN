# Task K2: Exercise skills (S1 exercise, S2 transform, S3 variant)

Depends on: K0, K1. Endpoints: `/api/ai/generate-exercise`, `/transform-exercise`, `/variant` in `src/server.ts`. Callers: `editor-studio.ts` (L620/644/690/729), `teacher-home.ts` L2213. Keep the response shape.

## S1 `skills/exercise.ts`
- Role: pedagogy designer (teacher mode) / bienveillant guide (parent mode). APC framing: situation + consigne + critère de réussite.
- Remove the inline JSON template (schema already enforces); make `teacherNotes` / `parentGuide` required in the schema per mode.
- `difficulty` becomes enum (facile | moyen | difficile) with per-grade ranges from BASE; no silent defaults: respond 400 if grade/subject missing.
- Self-check: recompute arithmetic before answering; thinkingBudget on; temperature 0.3.
- Extend subject enum with التربية الإسلامية, التربية المدنية (and others only if the editor UI supports them).
- Few-shot: one worked example per format (free, qcm, true_false, fill_blanks, matching), grade 3 or 4, in AR and FR (2 examples minimum in the skill).

## S2 `skills/exercise-transform.ts`
- One rule block + before/after example per transformation: `tunisian_context`, `simplify_vocab`, `add_trap` (name the trap type), `to_qcm` (distractor rules from `exercise-formats.ts`).
- Language: same as the original exercise (single rule, no contradicting NOTE).
- Wrap `originalBlock` and `customInstruction` with `wrapData` + caps (e.g. 4000 / 500 chars). Re-verify the solution.

## S3 `skills/exercise-variant.ts`
- Change only numbers/names/situation; preserve solvability (integer results, no remainders unless the original has them); pass the ORIGINAL solution so the method is preserved.
- Drop the dead `aiVerified` prompt line (the server sets it).

## Acceptance
Same JSON contract; QCM `qcmCorrectIndex` always in range; curl 3 grades x AR/FR x 5 formats returns schema-valid output; missing grade -> 400; specs for skill builders; lint + build pass.
