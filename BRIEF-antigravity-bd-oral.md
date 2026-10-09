# BRIEF for Antigravity — Real BD / oral-communication scenes (مشاهد تواصل شفوي), grades 2 to 6

Written by Claude Code, 2026-10-09, for Antigravity. Owner: Hamza. Read [RESOURCE-PIPELINE.md](RESOURCE-PIPELINE.md) first (layout, naming, manifest, WebP, index registration). Facts marked *(unverified)* are not confirmed.

## 0. SCOPE UPDATE 2026-10-09 (overrides everything below)

Owner decision: **forget 3ème and 6ème** and forget Arabic for grades 3 to 6 (CNP has no standalone Arabic BD albums there; 1ère `501110` and 2ème `501208` are done). Remaining work is **French BD albums only, grades 4 and 5**:

| Grade | CNP code | Pages (per your scan) | Local file |
|---|---|---|---|
| 4ème | 521417 | 64 | `_sources_candidates/521417P00.pdf` |
| 5ème | 521514 | 83 | `_sources_candidates/521514P00.pdf` |

Rules for this batch: subject `francais`, `lang: "fr"`, `topic: "bandes-dessinees"`, `subSubject: "expression_orale"` (keep it consistent with the Arabic items), trimester per page range only if the book states it, otherwise STOP and ask. Folder `public/assets/resources/<4eme|5eme>-annee/francais/trimestre-<n>/bandes-dessinees/`. WebP only (see rule in section 4), manifests, README, register in `index.json`, run `scripts/annotate-bd.mjs` with **French** keywords (objects visible in the image, never invented). Skip covers, blanks, colophon. Do not touch the 6ème album (`521613`).

## 1. Problem (verified 2026-10-09)

The `/bd` viewer ("شريط مصوّر") used to list every manifest in `public/assets/resources/index.json` (809 pages): workbook, reader and maths pages were shown as BD. Fixed in `src/app/features/bd/bd-library.ts` (keeps only `topic === 'bandes-dessinees'`). That leaves **89 real BD pages**, all 1ère Arabic (أنيسي, CNP 501110P01 = 42 pages T1, 501110P02 = 47 pages T2).

Missing: the real oral-communication scene pages ("Bandes dessinées — مشاهد تواصل شفوي") for **2ème to 6ème**. A teacher (Salwa) confirmed they exist.

## 2. What has been tried (do not repeat)

- Text search of local books `_sources/101215_P00, 101315_P01/P02, 101410_P00, 101509_P00, 101611_P00` (Arabic NFKC-normalised, diacritics stripped) for مشاهد / مشهد / التواصل الشفوي / شريط مصور: only 101110 p83 and 101215 p19, p60, p63, p103, p104 hit, none confirmed as BD. Scene pages are mostly images, so absence of text proves nothing.
- Guessing CNP album URLs `https://www.cnp.com.tn/arabic/PDF/<code>.pdf` for 501210, 501215, 501216, 501310, 501410, 501510, 501610 (P00/P01 variants): all HTTP 404. Only 501110P01 answers 200.

## 3. Your task, in order

1. **Find the source.** Browse the CNP site (https://www.cnp.com.tn) section for primary-school books and look for the albums or "مشاهد التواصل الشفوي" / "شريط مصور" items for grades 2 to 6. Also check the teacher's guide (دليل المعلم) and the oral-expression sections of each reading book. Record for each grade: exact URL, CNP code, page count. **STOP and ask the owner** (one question) if you find nothing after a reasonable search. Do not scrape other sites without owner approval (pipeline rule 6).
2. **Per grade, confirm the pages are scenes** (a mostly silent illustrated scene meant for oral expression), not exercises or reading text. Skip covers, blank pages, colophon.
3. **Extract** with the existing scripts (`scripts/process_2eme_batch.py` is the model; `scripts/optimize_resources.py` for WebP q82, max 1600px). Layout: `public/assets/resources/<grade>/arabe/trimestre-<n>/bandes-dessinees/`, files `bd_<grade-short>_arabe_t<n>_p<NN>.webp`, `topic: "bandes-dessinees"`, `subSubject: "communication_orale"`.
4. **Manifest + README + register** each topic in `public/assets/resources/index.json` as the pipeline says. `ref` must point to the exact source page.
5. **Keywords:** run `node scripts/annotate-bd.mjs` (Gemini Vision, visible objects only, never invent). `structures` come from the official curriculum data, not from vision. `verifiedBy` stays `null`.
6. **Trimester:** if a page's trimester is ambiguous, STOP and ask. Do not guess.

## 4. Rules

- **WebP ONLY. No PNG may remain in `public/`.** Final files are `.webp` (q82, max width 1600px, no upscaling). If you render PNGs first, run `python scripts/optimize_resources.py` and **delete every leftover `.png`**. Manifests (`file`, `relPath`) must say `.webp`. Check at the end: `find public/assets/resources -name "*.png"` must return nothing for your folders. This overrides the "PNG" examples in RESOURCE-PIPELINE.md.
- Free only, no paid service. No browser or screenshots for app verification unless the owner asks (browsing the CNP site to find the source is allowed for this task).
- Do **not** touch `topic` values of existing non-BD manifests. The viewer filter relies on `bandes-dessinees` meaning real BD only.
- Never commit; leave changes in the working tree for review. Stage nothing.
- Verify with `pnpm exec eslint src` and `pnpm run build`. Say what was not visually checked.
- Report back: per grade, source URL, pages kept, pages skipped and why, anything ambiguous.

## 5. Known leftover (small, optional)

`src/server/og-preview.ts` `loadBdItems` still reads all manifests, so an old `?bd=<id>` link to a non-BD page gets an OG card but the viewer will not open it. Filter it the same way (`topic === 'bandes-dessinees'`) if you touch that file.
