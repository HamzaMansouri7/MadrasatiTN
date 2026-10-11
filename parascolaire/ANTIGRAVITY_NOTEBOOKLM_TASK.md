# Task for Antigravity — NotebookLM source files, book 2

**Why this task exists:** book 1 (Mathématiques 4ème année — Exercices et corrigés) was exported by Claude with a shared tool. You run the **same tool** on book 2 so both books follow one template and one set of rules. Consistency matters more than speed.

## Your book
`mathematiques_exercices_evaluations`  →  folder `parascolaire/livres/5eme_annee/mathematiques_exercices_evaluations/`
Rebranded name: **Mathématiques 5ème année — Exercices et évaluations**

## Read first (do not skip)
- `parascolaire/NOTEBOOKLM_PLAN.md` sections 3, 4, 14 and 15 (template, new-book contract, prompt rules).
- `parascolaire/tools/export_notebooklm.py` (the tool; read its header and `correction_for`).

## Do exactly this
1. From the repo root run:
   `python parascolaire/tools/export_notebooklm.py mathematiques_exercices_evaluations`
2. Output appears in `parascolaire/notebooklm/5eme_annee/mathematiques_exercices_evaluations/` (gitignored).
3. Check the output:
   - `00-overview.md` exists and its table matches the `NN-*.md` files.
   - No commercial or original-publisher name anywhere in the output (grep for the old slugs; the expected result is zero hits).
   - Pick **10 exercises at random**: compare each statement in the `.md` with the same exercise in `livres/…/pages/NNN.json` (text must be identical, not reworded).
   - Pick **10 exercises that show a correction**: confirm the correction belongs to that exact exercise (same number, right printed page). Report any mismatch with file, exercise number and what is wrong.
   - Count exercises marked "could not be matched" and "No correction yet" per theme.
4. Write your results to `parascolaire/notebooklm/5eme_annee/mathematiques_exercices_evaluations/CHECK.md` using this table:

| Check | Result | Evidence |
|---|---|---|
| Overview matches theme files | | |
| Commercial-name hits | | |
| 10 statements identical to source | | |
| 10 corrections belong to their exercise | | |
| Exercises exported / with correction / unmatched / no correction | | |

## Rules (these keep the two books consistent)
- **Do not edit `export_notebooklm.py`.** If you find a bug or a better rule, write it in `CHECK.md` under "Tool findings" with a concrete example. Claude changes the tool, then both books are re-exported.
- Do not edit anything in `livres/`. Do not edit the prompts or the plan.
- Do not invent or complete any correction. A missing correction stays missing.
- No API calls, no spending. This task is local file work only.
- Never print or commit keys. Nothing is committed or pushed by you.
- Stop after writing `CHECK.md` and report the table.
