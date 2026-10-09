# Batch — Curriculum matrix (grade × subject × trimester × topic)

For Antigravity. Data work only, no UI. Follows the spirit of [RESOURCE-PIPELINE.md](../../RESOURCE-PIPELINE.md): official sources, exact page refs, never guess, never commit.

## Why

The app needs one official table of "what is taught, per class, per trimester", so that library resources, uploads, AI grounding and a future "Programme" page (tree: class → subject → 3 trimester columns → topics, for teachers and parents) all point at the same topic IDs.

Today it is almost empty: [curriculum-chapters.data.ts](../../src/app/core/data/curriculum-chapters.data.ts) has 16 chapter rows out of 108 possible grade × subject × trimester cells (6 grades × 6 subjects × 3 trimesters). Grades 1–3: nothing. No T3 anywhere. No Histoire-Géo, Anglais, Éducation Islamique or Informatique. The subject list in [education.model.ts](../../src/app/core/models/education.model.ts) lets every grade have every subject, which is wrong.

## Sources (use in this order)

1. Official CNP books: PDF links in [cnp-books.data.ts](../../src/app/core/data/cnp-books.data.ts) (`pdfUrl`), table of contents of each book.
2. Already-sliced pages in `public/assets/resources/**/manifest.json`.
3. Official programme / curriculum documents from the Tunisian ministry, if you can find them (report URL + owner/licence note before using).

Do not invent topics from memory. Every row needs a source.

## Steps

### Step 1: Subjects per grade (do first, then STOP and show me)

Produce a table: for each grade 1ère → 6ème, which subjects are officially taught, with weekly-hours if the source gives them. Cite the source for each grade. Flag anything you could not confirm as `unverified`. Known doubt: Anglais in grades 1–3 (probably not taught), Informatique and Éducation Islamique (not in `PRIMARY_SUBJECTS` today).

Also give the canonical subject naming: one display name + one slug per subject, reconciling `اللغة العربية` (app) vs `arabe` (resource folders), `Histoire & Géographie` vs `histoire-geo`, etc.

I validate this table before step 2.

### Step 2: Topics per grade / subject / trimester

From each book's table of contents, extract the chapters/units/themes and assign them to the right trimester. One row per topic:

- `id`: stable and readable, e.g. `math-4-t1-01`. Keep the 16 existing ids unchanged.
- `grade`, `subject`, `trimester`: same string values as `GradeLevel`, `SubjectName`, `Trimester` in the model.
- `titleAr`, `titleFr` (and `titleEn` for Anglais).
- `order`: position inside the trimester.
- `source`: `{ cnpCode, page }` or document URL + page.
- `status`: `confirmed` (read from an official TOC) or `unverified`.

Keep the existing `keyCompetency*` and `suggestedPrompts*` fields on current rows. For new rows they are optional; do not generate them with AI in this batch.

Put new rows in a new file `src/app/core/data/curriculum-topics.data.ts` (or extend the existing file if cleaner, keep `TUNISIAN_CURRICULUM_CHAPTERS` exported and compatible: [knowledge-source.ts](../../src/server/knowledge-source.ts) imports it).

### Step 3: Coverage report

A table of the full grade × subject × trimester grid: topic count per cell, empty cells marked, with the reason (no source found / not taught / book not found).

## Rules

- Trimester boundaries: if a book's TOC does not say which trimester a unit belongs to, mark `unverified` and ask. Do not guess.
- Arabic is primary; keep proper diacritics only if the source has them.
- Do not touch UI, store or routes. Do not commit. Leave changes in the working tree.
- Note: all CNP entries in `cnp-books.data.ts` say "Trimestre 1". That is a placeholder, not data. Do not trust it.
- English: CNP seems to have no English resources (owner checked), see [ENGLISH-T1.md](ENGLISH-T1.md) (parked). Mark Anglais cells `no source`.

## Done when

- Step 1 table delivered and validated by the owner.
- Topics file with source and status on every row.
- Coverage report delivered.
- `pnpm run lint` passes on the new data file.
