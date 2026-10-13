# Brief for Antigravity: finish the books that are 100% ready

Scope: ONLY books where `Prêts == Exercices` in `parascolaire/MATRIX.md`. Do not touch any other book (the owner and Claude handle those separately).

## Books in scope (source: MATRIX.md, 2026-10-13)

| Book id | Folder | Exercises | Cover/manifest |
|---|---|---|---|
| `1ere-annee/evaluations-maths-arabe` | `livres/1ere_annee/evaluations_maths_arabe` | 240/240 | DONE (commit ccd54a7) |
| `5eme-annee/exercices-mathematiques-corriges` | `livres/5eme_annee/exercices_mathematiques_corriges` | 14/14 | TODO |
| `5eme-annee/eveil-scientifique-evaluations` | `livres/5eme_annee/eveil_scientifique_evaluations` | 21/21 | TODO |
| `6eme-annee/concours-blanc-eveil-scientifique-corrige` | `livres/6eme_annee/concours_blanc_eveil_scientifique_corrige` | 10/10 | TODO |
| `6eme-annee/examen-lecture-arabe-corrige` | `livres/6eme_annee/examen_lecture_arabe_corrige` | 21/21 | TODO |
| `6eme-annee/epreuve-modele-mathematiques-corrigee` | `livres/6eme_annee/epreuve_modele_mathematiques_corrigee` | 13/13 | TODO |

Out of scope: `5eme-annee/mathematiques-exercices-evaluations` already got a cover and manifest, but it is only 286/343 ready. Leave it as is; do not add anything else to it.

## What to do per book (same process as 1ère, see `public/assets/resources/1ere-annee/parascolaire/...`)
1. Front cover: official Madrasati TN style, Arabic title, grade badge, correct subject theme. WebP max 1600px, quality 82. Save as `public/assets/resources/<grade>/parascolaire/<trimester>/<book-slug>/cover.webp`.
2. Back cover (new): same style, short Arabic line on what the book contains and "free for the community", Madrasati TN seal. Save as `back-cover.webp` in the same folder. No invented claims (counts must match `exercices.json`).
3. Beginning and end of the book: one intro page (title, grade, subject, how the book is organised) and one closing page (who it is for, link madrastihub.com). Save as `intro.webp` and `outro.webp` in the same folder. Text must match the real content of the book.
4. `manifest.json` in that folder: all pages from `livres/.../pages/*.json`, like the 1ère one; add `cover`, `backCover`, `intro`, `outro` keys.
5. Register the manifest in `public/assets/resources/index.json`.
6. Set `cover` on the book in the catalog (`parascolaire/publish/catalog.json` via `parascolaire/tools/publish_catalog.py`, never edit by hand).
7. Check: `pnpm test`, `pnpm exec eslint src/app/features/parascolaire`.

## Branding and watermark (required on every cover, back cover, intro and outro page)
- Madrasati TN logo (the one in the site header) and the Tunisian seal, same size and corner on every image of every book.
- Wordmark "مدرستي تونس · Madrasati TN" and the address `madrastihub.com`, readable but not covering the content.
- A small, semi-transparent "Madrasati TN" watermark across the page, low enough that it never hides text or numbers.
- Back cover: "مجاني للمجتمع، غير ربحي" plus the address. Do not claim anything the platform does not offer.
- Infographics and course slides: the "Gemini Notebook" watermark stays untouched (owner rule). Do not crop, blur or cover it.
- Same colours as `DESIGN.md` (ink `#14251D`, pine `#2D6A4F`, paper `#FBF8F1`, gold `#F2C14E`); no indigo or purple.

## Rules
- Keep the "Gemini Notebook" watermark on infographics; images are WebP only; no emoji as UI icon.
- Do not push, do not deploy. Report back and wait for the owner's go.
- Do not edit `livres/` originals.
