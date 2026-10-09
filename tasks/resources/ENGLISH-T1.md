# Batch — English, Trimester 1 (grades 4, 5, 6)

**PARKED (2026-10-09):** owner found no English resources on CNP. Do not run until a source exists.

For Antigravity. Follow [RESOURCE-PIPELINE.md](../docs/RESOURCE-PIPELINE.md) exactly. This file only supplies the per-batch inputs.

Why: a parent asked for English first-trimester material. Today the app only links the 3 CNP PDFs ([cnp-books.data.ts](../../src/app/core/data/cnp-books.data.ts)), with no sliced pages in `public/assets/resources/`.

## Inputs

| grade | subject | trimester | topic slug | CNP code | PDF | lang |
|---|---|---|---|---|---|---|
| `4eme-annee` | `anglais` | `trimestre-1` | `have-fun-learn-english` | 141402 | https://www.cnp.com.tn/arabic/PDF/141402P00.pdf | `en` |
| `5eme-annee` | `anglais` | `trimestre-1` | `activity-book` | 141504 | https://www.cnp.com.tn/arabic/PDF/141504P00.pdf | `en` |
| `6eme-annee` | `anglais` | `trimestre-1` | `learn-and-grow` | 141606 | https://www.cnp.com.tn/arabic/PDF/141606P00.pdf | `en` |

## Specifics

- Slice only the pages that belong to Trimester 1 (use the book's table of contents). If the T1 boundary is unclear, STOP and ask.
- File prefix: `lesson` for student-book pages, `ex` for activity-book pages (e.g. `ex_5eme_anglais_t1_p07`).
- Manifest `lang: "en"`, `subject: "anglais"`, `trimester: 1`. Titles in English, page number included.
- Skip `pedagogy` block (section 3b is for silent BD/posters only).
- Register all 3 manifests in `public/assets/resources/index.json`.
- Finish with `python scripts/optimize_resources.py`.
- Do not commit. Leave changes in the working tree for review.

## Done when

- 3 topic folders exist, each with images, `manifest.json`, `README.md`.
- 3 entries added to `index.json`.
- Report: page count per book + any pages skipped and why.
