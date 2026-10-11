# NotebookLM plan — infographics, videos, slides

Status: **plan only, nothing executed.** Written 2026-10-11.
Scope: the 17 books in `parascolaire/livres/`. Outputs now: **infographic, video, slides**. Audio, mind map, flashcards and data tables are out of scope for now.

---

## 1. Goal

Turn each rebranded book into teaching assets (infographics, short videos, slide decks) using one NotebookLM notebook per book. Everything is free and non-profit; the Gemini watermark stays.

## 2. Flow

```
parascolaire/livres/<book>/        source of truth (rebranded)
        │  export_notebooklm.py    (to build, see section 12)
        ▼
parascolaire/notebooklm/<book>/    one .md per theme + 00-overview.md   (gitignored? see section 12)
        │  upload as sources
        ▼
NotebookLM notebook "<book name>"  one notebook per book
        │  Studio: Infographic / Video / Slides  (settings + prompt)
        ▼
Download PDF / PPTX → split to images → review → library
```

## 3. Notebook rules

| Rule | Detail |
|---|---|
| One notebook per book | Named `Madrasati TN · NN · <book.json title>` (NN = order number 01–17, title = the rebranded name). 17 notebooks. |
| Sources | One `.md` per **theme**, plus `00-overview.md`. Generation only uses the sources ticked in the dialog, so a theme-sized file lets you generate for one theme at a time. |
| Never add as sources | The website, PDFs, any old OCR text, any file with a commercial name. |
| Source limits | Pro: 300 sources per notebook; 500,000 words or 200 MB per source ([Fast.io](https://fast.io/resources/notebooklm-limits.md), [Elephas](https://elephas.app/blog/notebooklm-source-limits)). Far above what is needed. |
| Upload format | Markdown. JSON is **not** a listed source type ([UPRM guide](https://libguides.uprm.edu/notebooklm/upload_sources)). |

## 4. Markdown source template

One file per theme. Only `tier = ready` exercises. Correction included when it exists; otherwise the exercise is marked so NotebookLM never invents an answer.

```markdown
# <Theme> — <Class> — <Subject>

Book: <rebranded book name>
Official chapter: <topicId> — <topicTitle>

## Exercises

### Exercise <number>   (format: <format> | difficulty: <difficulty>)
Statement: <instruction + body>
Correction: <answer>              ← or: "No correction yet — do not invent one."
```

`00-overview.md`: book name, class, subject, list of themes, counts (exercises, with correction), and a one-line note on the book's type (exercise book / exam book / lesson book).

Data source for every field: `livres/<class>/<book>/exercices.json` (+ `pages/NNN.json` for text). Field meanings are in `parascolaire/README.md`.

## 5. Settings reference (confirmed on the owner's screens, 2026-10-11)

| Output | Setting | Options seen |
|---|---|---|
| **Video** | Format | **Court** (new) · **Vidéo explicative** |
| | Language | dropdown (currently English) |
| | Sources | tick list |
| | Focus: "Sur quoi la vidéo doit-elle se concentrer ?" | 3 suggestion chips (topic or audience, e.g. "Calculs des fractions", "Guide pour parents") **plus** a free field **Thème personnalisé** ("Décrivez votre thème"). Chips and field are the same setting: what the video is about and for whom. |
| | Visual style | the 10-style row (see below), separate from the focus |
| **Slides** | Format | **Diaporama détaillé** (full text, readable alone) · **Diapositives du présentateur** (key points for speaking) |
| | Language | dropdown |
| | Length | **Court** · **Par défaut** (no Long: Long is Ultra-only per [Workspace Updates](https://workspaceupdates.googleblog.com/2026/03/new-ways-to-customize-and-interact-with-your-content-in-NotebookLM.html)) |
| | Sources | tick list |
| | Prompt | free text |
| **Infographic** | Language | dropdown |
| | Orientation | **Paysage** · **Portrait** · **Carré** |
| | Visual style | Auto · Kawaii · Pâte à modeler (Clay) · Croquis (Sketch) · Anime · more to the right |
| | Detail level | **Concis** · **Standard** · **Détaillé** (beta) |
| | Sources | tick list |
| | Prompt | style, colour, main theme |

**Video visual styles, confirmed on the owner's screen (10 choices):**

| Style on screen | English name in Google's docs | Look (from the preview image) |
|---|---|---|
| Sélection automatique | Auto-select | NotebookLM picks one |
| **Personnalisé** | Custom | Pencil icon: you describe your own style (how it works is **unverified**, test it) |
| Classique | Classic | Light grid background, the original look |
| Tableau blanc | Whiteboard | Line drawings with blue arrows |
| Kawaii | — | Cute faces on the objects, pastel |
| Anime | Anime | Bright, glossy, dramatic colours |
| Aquarelle | Watercolor | Soft washed colours |
| Impression rétro | Retro Print | Flat red and cream print look |
| Traditionnel | Heritage | Dark ink engraving look |
| Papier découpé | Papercraft | Layered cut-paper look |

Source for the English names: [Google blog](https://blog.google/innovation-and-ai/models-and-research/google-labs/video-overviews-nano-banana/). The same screen also shows **Sources**, **Language** (English by default) and a "what should the video focus on" box below the styles.

Defaults for this project:

| Output | Language | Format | Other |
|---|---|---|---|
| Infographic | **Arabic** | Portrait for print, Landscape for screen | Standard detail; Kawaii or Pâte à modeler for kids |
| Slides | **Arabic** | Diaporama détaillé | Par défaut |
| Video | **Arabic** | Court first | Cartoon-like style from the style list |

**Do not forget:** the language dropdown shows **English** by default. Set it to Arabic every time.

## 6. Prompt templates

Replace `<…>` fields. Keep prompts short and specific. Always end with the grounding line.

### Infographic
```
Audience: Tunisian primary pupils, <class>. One theme only: <theme>.
Show: the 3 key rules, one worked example from the sources, and 2 practice questions with answers.
Style: bright, friendly, large Arabic text, fully vowelled, no clutter.
Use only the selected sources. Do not invent numbers or answers.
```

### Slides (10)
```
Create 10 slides, one idea per slide, for <class> pupils on <theme>.
Slide 1: title. Slides 2-8: one rule or worked example each, with its correction.
Slide 9: practice questions. Slide 10: summary.
Large Arabic text, fully vowelled, simple pictures.
Use only the selected sources. Do not invent numbers or answers.
```

### Slides (1 slide only)
```
Create ONE slide for <class> pupils: <single idea>. Large Arabic text, fully vowelled, one picture.
Use only the selected sources.
```

### Video (short)
```
Explain <theme> to <class> kids like a friendly cartoon story, in simple school Arabic.
One example from the sources, solved step by step. End with one question for the viewer.
Use only the selected sources.
```

## 7. Pilot (mandatory before scaling)

| Item | Choice |
|---|---|
| Book | **Mathématiques 4ème année — Exercices et corrigés** (322 of 528 exercises have a correction, from `parascolaire/README.md`) |
| Theme | one theme with several corrected exercises |
| Outputs | 1 infographic, 1 deck of 10 slides, 1 one-slide deck, 1 short video |

Acceptance checklist (all must pass):

- [ ] Arabic text is correct and readable
- [ ] Every number and answer matches the source `.md`
- [ ] Nothing invented that is not in the sources
- [ ] No commercial names or original-book branding appear
- [ ] Slides split into clean images (PDF → image)
- [ ] The "Utilisation de l'IA" meter is understood (daily limits are **unverified**)

If any item fails: fix the prompt or the source file first, repeat the pilot, only then continue.

## 8. Rollout order

1. Mathématiques 4ème année — Exercices et corrigés (pilot)
2. Mathématiques 5ème année — Exercices et évaluations
3. Mathématiques 6ème année books
4. Français 6ème année — Lire et s'exprimer
5. Éveil scientifique 6ème année — Cours et exercices
6. Remaining books

Rule: finish and approve one book before opening the next notebook.

## 9. Output naming and storage

```
<outputs-root>/<class>/<book-slug>/<theme-slug>/
    infographic-portrait.png
    slides-10.pdf   slides-10.pptx   slides/01.png … 10.png
    video-short.mp4
```

- `<outputs-root>` lives **outside the repo** (or in a gitignored folder): PDFs, images and video are large.
- Keep one `manifest.json` per theme: book, theme, topicId, prompt used, settings used, date, reviewer status. This is what makes a result reproducible.

## 10. Quality gate (every output)

1. Re-solve every maths answer by hand (or with a checker prompt) before approving.
2. Check Arabic vowelling on at least the title and one exercise.
3. Mark the manifest `approved` or `rejected`. Never publish `rejected`.

## 11. Risks and unknowns

| Risk | Status |
|---|---|
| Daily limits for video / slides / infographic generation on Pro | **Unverified.** Only chat/audio limits found (500 chat queries, 20 audio per day, [Fast.io](https://fast.io/resources/notebooklm-limits.md)). Read the usage meter in the pilot. |
| Wrong answers invented by the model | Mitigate: sources carry corrections; "no correction yet" marker; manual re-solve. |
| Exercises with no `topicId` (43% of exercises) | They still export by theme, but cannot be grouped by official chapter. |
| Exercises not `ready` (6%) | Excluded from export. |
| Product changes (names, menus) | NotebookLM UI is changing (renamed "Gemini Notebook" in the screenshots). Re-check the settings before each batch. |
| Opal | Not used here. It leaves Labs on 2026-11-17 (banner on the Opal page). |

## 12. To build (not built yet)

| Item | Where | Purpose |
|---|---|---|
| `parascolaire/tools/export_notebooklm.py` | **built** (2026-10-11) | Discovers every book under `livres/*/*/book.json`; writes one `.md` per theme + `00-overview.md` per book, using the template in section 4. No book name, class or theme is hard-coded. |
| `parascolaire/prompts/` | new | The prompt library (section 15): one versioned file per output type |
| `parascolaire/tools/check_book.py` | new | The new-book checklist (section 14) as a script: fails loudly if a book is missing a required field |
| Output folder `parascolaire/notebooklm/` | done | Generated files, **gitignored** (regenerable). |
| Manifest writer | new | Creates the per-theme `manifest.json` from section 9 |

## 13. Where things live

| What | Where |
|---|---|
| Books, exercises, pages | `parascolaire/livres/` |
| Matrices and README (generated) | `parascolaire/MATRIX.md`, `parascolaire/README.md`, `parascolaire/matrix.json` |
| Generators | `parascolaire/tools/` |
| This plan | `parascolaire/NOTEBOOKLM_PLAN.md` |
| Prompt library (to create) | `parascolaire/prompts/` |
| Notebook source files (to create) | `parascolaire/notebooklm/<book>/` |

## 14. Reusability: the mechanism must work for every future book

**Principle: nothing is written for a specific book.** Every tool discovers its inputs by scanning `livres/`, exactly like `tools/build_matrix.py` and `tools/build_readme.py` already do. A new book appears in the matrix, the README and the export without editing any script.

### The contract a book must meet to enter the pipeline

| Required | Where | Rule |
|---|---|---|
| `book.json` | `livres/<class>/<book>/` | `book`, `title` (the rebranded name), `grade`, `subject`, `totalPages` |
| `exercices.json` | same folder | Each exercise row has: `id`, `book`, `page`, `grade`, `subject`, `theme`, `format`, `difficulty`, `topicId`, `correction`, `tier`. See `parascolaire/README.md` for the meaning of each field. |
| `pages/NNN.json` | same folder | Page text and quality |
| Rebrand | all files | No commercial name, slug, publisher or PDF path anywhere. The check below enforces it. |

### New-book checklist (every incoming book, in this order)

1. Put the book in `livres/<class>/<book>/` with the three parts above.
2. Run `check_book.py <book>`: required fields present, no commercial traces, ids unique, `tier` valid.
3. Run `build_matrix.py` and `build_readme.py`: the book shows up in the tables.
4. Run `export_notebooklm.py <book>`: one `.md` per theme + overview.
5. Create the notebook, upload only those files, run the pilot checklist (section 7) on one theme.
6. Only then generate in bulk.

### What stays configurable (never hard-coded)

- Defaults per output type (language, format, orientation, style): one `prompts/defaults.json`.
- The list of accepted `tier` values for export (default: `ready`).
- The "no correction yet" marker text.

## 15. Prompt rules: what we say and what we give

Prompts decide the quality, so they are managed like code.

### Storage and versioning

- One file per output type in `parascolaire/prompts/`: `infographic.v1.md`, `slides-10.v1.md`, `slide-1.v1.md`, `video-short.v1.md`.
- Each file has: purpose, the required fields (`<class>`, `<theme>`…), the settings to choose in the UI, and the prompt body.
- **Never edit a version in place.** A change = a new file (`v2`). The manifest (section 9) records which version produced which output, so any result can be reproduced or compared.

### Rules for what we SAY (the prompt)

1. **Separate fixed rules from variable fields.** The grounding and safety lines are identical in every prompt; only `<class>`, `<theme>` and the single idea change.
2. **Always include the grounding line:** "Use only the selected sources. Do not invent numbers or answers."
3. **One theme per request.** Never ask for a whole book in one prompt.
4. **State the audience and the class** every time, so the level is right.
5. **State the language and the vowelling** (fully vowelled Arabic) in the prompt *and* in the language dropdown. The dropdown defaults to English.
6. **Tell it what to do with missing answers:** the source marks "No correction yet", and the prompt must say: never create a correction for those exercises.
7. **No brand names, no publisher names, no "based on book X"** in any prompt.
8. **Be specific about the structure** (for example "10 slides, one idea each") and about what to leave out.
9. **No unverified claims inside prompts** (for example do not state official curriculum rules that are not in the sources).
10. Keep prompts short. A long prompt hides the important line.

### Rules for what we GIVE (the sources)

| Give | Never give |
|---|---|
| Exercises with `tier = ready` | `pending_audit` or `shelved` rows |
| The correction when it exists, or the explicit "no correction yet" marker | Corrections guessed or reconstructed by us |
| One file per theme, only the themes being generated | The whole book at once |
| The rebranded book name and class | Original titles, slugs, publisher names, PDF paths |
| The official chapter (`topicId` + title) when known | Unverified chapter guesses (mark them "chapter unknown") |
| Clean text from `exercices.json` | Raw OCR dumps, page images, internal notes (`ideaNote`, `linkFlags`, audit fields) |

### Review loop for every prompt change

1. Change the prompt as a new version.
2. Re-run the pilot theme with the new version.
3. Compare to the previous version's output against the pilot checklist.
4. Keep the new version only if it is not worse; record the decision in the manifest.

## 16. Setting-by-setting guide: what to choose, what to write

Every setting has a job. Choose the setting first, then write a prompt that **adds** to it and never repeats or contradicts it. What each setting does is taken from the owner's screens; how strongly it changes the result is **unverified** and must be confirmed in the pilot (record findings in section 19).

### 16.1 Language (all outputs)

| Do | Don't |
|---|---|
| Set the dropdown to **Arabic** every time (it opens on English). | Write the prompt in one language and leave the dropdown on another. |
| In the prompt, add "fully vowelled Modern Standard Arabic" and "simple school Arabic". | Ask for dialect or mixed languages in one output. |
| For French-subject books (6ème Français), set the dropdown to **French** and write the prompt in French. | Reuse the Arabic prompt text for a French book. |

### 16.2 Infographic

| Setting | Choose | Prompt tip |
|---|---|---|
| Orientation | **Portrait** for print and phone, **Landscape** for screens and slides, **Carré** for social posts | Do not describe the shape in the prompt; the setting already decides it. |
| Visual style | **Kawaii** or **Pâte à modeler** for ages 6–9 (1ère–3ème); **Croquis** (sketch) or **Auto** for 4ème–6ème; avoid **Anime** for maths, it may crowd the page (unverified) | Add the colour or mood in the prompt box (it is built for that: "style, colour or main theme"). |
| Detail level | **Concis** = one rule + one example; **Standard** = rules + example + practice; **Détaillé** (beta) = a full lesson sheet | Match the prompt to the level: ask for 3 items at Standard, 1 item at Concis. Do not ask for 10 items at Concis. |
| Sources | Tick only the theme's file | The prompt names the theme; the sources enforce it. |

Prompt pattern: *audience → one theme → what to show (numbered, with a count) → style words → grounding line.*

### 16.3 Slides

| Setting | Choose | Prompt tip |
|---|---|---|
| Format | **Diaporama détaillé** for lessons and exercises people read alone (full text); **Diapositives du présentateur** only for a teacher presenting live | If you pick Détaillé, ask for the correction **on the slide**. If you pick Présentateur, ask for short key points only. |
| Length | **Court** for one rule or example; **Par défaut** for a full theme | State the exact slide count in the prompt and say what each slide holds. |
| Sources | Tick only the theme's file | One theme per deck. |

Prompt pattern: *"N slides. Slide 1 …, slides 2–k …, last slide …"*. Structure in the prompt beats adjectives.
One-slide decks: ask for **one idea**, one picture, one correction. Use them as single assets to split into images.

### 16.4 Video

| Setting | Choose | Prompt tip |
|---|---|---|
| Format | **Court** for a single rule or tip; **Vidéo explicative** for a full theme | Court: one idea, one example, one closing question. Explicative: intro, 2–3 steps, recap. |
| Visual style | Cartoon feel for kids: pick from the 10-style row (Kawaii, Papier découpé…) | The look comes from this row, not from the focus field. |
| Focus (chips + **Thème personnalisé**) | Pick a chip, or write the topic and the **audience** in the field (see 16.7) | Name the example to use, so it does not invent one. Do not describe the look here. |
| Sources | Tick only the theme's file | |

### 16.5 Prompt-writing tips (apply to every setting)

1. **One setting = one job.** If the setting decides orientation, length or format, the prompt does not mention them.
2. **Numbers over adjectives.** "3 rules, 1 example, 2 questions" beats "a complete clear infographic".
3. **Say what to leave out** ("no decorative text, no extra topics").
4. **Name the source item** to use ("the exercise about sharing 32 children into 4 teams"), so the model works from your data and not from memory.
5. **Ask for the correction explicitly** and tell it to copy corrections from the source, never recompute them silently.
6. **One change per test.** When a result is off, change one setting or one prompt line, then regenerate. Record what changed.
7. **Keep each prompt under about ten lines.** A long prompt buries the grounding line.
8. **Always end with the grounding line** (section 15).
9. **Test the same theme with two styles** before choosing the default for a class.

### 16.6 House style: one look across the whole platform

The goal is that every asset looks like it comes from the same place. NotebookLM offers a fixed list of styles for infographics and videos, plus a **Personnalisé** (custom) option on the video screen. So consistency comes from **choosing a small, fixed set and reusing it**, not from picking per asset.

**Rules**

1. **One default style per class band.** Decide it once, write it in `prompts/defaults.json`, never choose ad hoc.
2. **Same style for the same band, every book.** A 4ème maths video and a 4ème science video use the same style.
3. **A fixed "house style" sentence** appended to every prompt (and used in the Personnalisé field when the video screen has it), so the colours and mood stay constant. It must match the platform design in [DESIGN.md](../DESIGN.md) (Cartouche tokens), not invent new colours.
4. **Change the default only as a new version** (section 15), after testing the same theme in two styles side by side.

**Proposed starting defaults (to confirm in the pilot, unverified):**

| Band | Infographic style | Video style | Why |
|---|---|---|---|
| 1ère–3ème (ages 6–9) | Kawaii or Pâte à modeler | Kawaii or Papier découpé | Friendly, simple shapes |
| 4ème–6ème | Croquis or Auto | Tableau blanc or Classique | Cleaner, suits maths and science explanations |
| Revision / exam sheets | Classique or Croquis | Tableau blanc | Neutral, easy to read |

**House style sentence (draft, adapt to DESIGN.md before use):**
```
Colour palette: use the Madrasati TN colours only (<hex values from DESIGN.md>). Calm background, high contrast,
large readable Arabic text, no decorative clutter. Same look on every page.
```
Fill the hex values from `DESIGN.md` once, then reuse the identical sentence everywhere. Whether NotebookLM respects a hex palette is **unverified**: test it and record the result in section 19.

### 16.7 Video focus: topic AND audience (parents, teachers, kids)

On the video screen, the focus step shows three suggestion chips. On the owner's screen they were "Le système digestif", "Calculs des fractions" and "Guide pour parents". The first two match the two uploaded source files, so the chips appear to be **generated from the sources** (inference, **unverified**). The third is an **audience** suggestion, not a topic.

What this means for the pipeline:

1. **The audience is part of the focus.** The same theme can become three different videos: for the child, for the parent, for the teacher.
2. **Clean source files make clean chips.** One `.md` per theme with a clear title gives clear topic chips. This supports the one-file-per-theme rule in section 3.
3. **Audience is a fixed field in the prompt library** (section 15): every video prompt states topic + audience + purpose.

| Audience | What the video should do | Focus text pattern (write it in **Thème personnalisé**) |
|---|---|---|
| **Child** | Explain the idea as a short story with one worked example | "Explain <theme> to <class> kids as a friendly story, one example from the sources solved step by step, end with one question." |
| **Parent** | Show how to help the child at home: what the child learns, the common mistake, one way to practise | "A guide for parents of <class> pupils on <theme>: what the child learns, the most common mistake, and how to help at home with the example in the sources." |
| **Teacher** | Give a teaching sequence: objective, steps, typical errors, a short exercise | "A teaching sequence for <class> teachers on <theme>: objective, 3 steps using the examples in the sources, typical errors, one exercise with its correction." |

Rules:
- State the audience **and** the purpose (explain, help at home, teach). One video = one audience.
- Parent videos: calm, no jargon, no grading language. Teacher videos: structured and brief.
- Language stays the dropdown value (Arabic), and the style row decides the look.
- Do not ask one video to serve all three audiences.

**Note:** an earlier version of this plan treated "custom theme" as a style field. The screen shows it is the **focus field**; the look is the style row. Corrected in sections 5 and 16.4.

## 17. Theme analysis: choosing what to generate

Themes decide the output type. Before generating for a theme, answer these questions from the data:

| Question | Where to read it | Decision |
|---|---|---|
| How many exercises, how many ready? | `exercices.json` (`tier`) | Fewer than about 8 ready: generate a **single slide or Court video**, not a full deck. |
| How many have a correction? | `correction` field | Fewer than 50% corrected: generate **explanation and examples only**, no answer slides, until corrections exist. |
| Which formats dominate? | `format` | Calculation → worked-example slides. QCM or matching → practice-sheet infographic. Problem-solving → story video. Free → ask the model to propose the layout. |
| Linked to an official chapter? | `topicId` | Linked: label the asset with the chapter. Not linked: label "chapter unknown"; do not claim a chapter. |
| Is it a revision/mixed theme? | theme name ("Révisions et évaluations", "Problèmes") | These mix topics. Do not make a "lesson" from them; use them as practice sets only. |
| Is it a heavy-visual theme? | e.g. geometry, measures, time | Prefer infographic or video over text slides. |

### Pilot book analysis — Mathématiques 4ème année — Exercices et corrigés

Computed from `livres/4eme_annee/mathematiques_exercices_corriges/exercices.json` (528 exercises, 2026-10-11):

| Theme | Exercises | Ready | With correction | Linked to chapter | Dominant formats | Suggested first outputs |
|---|---|---|---|---|---|---|
| Révisions et évaluations | 106 | 101 | 81 | 13 | fill_blank, calculation, free | Practice set only (mixed theme); not a lesson |
| Grands nombres | 41 | 37 | 26 | 33 | free, fill_blank | Slides (rules + examples), infographic |
| Division euclidienne | 37 | 33 | 26 | 37 | free, fill_blank, calculation | **Slides: worked examples; short video** |
| Périmètre et aire | 26 | 23 | 26 | 26 | calculation | **Infographic (formulas) + slides** — every exercise has a correction |
| Numération jusqu'à 9 999 | 30 | 28 | 24 | 16 | free, fill_blank | Infographic (place value) |
| Droites, points et segments | 36 | 36 | 22 | 36 | calculation, qcm | Infographic (vocabulary + drawing), qcm practice |
| Multiplication et multiples | 34 | 33 | 20 | 25 | free, fill_blank | Slides + short video |
| Longueurs | 22 | 22 | 19 | 19 | free, fill_blank | Infographic |
| Masses et capacités | 24 | 24 | 18 | 24 | free, matching | Infographic (matching) |
| Addition et soustraction | 19 | 18 | 15 | 15 | free, problem_solving | Short video (story problems) |
| Quadrillage et parcours | 23 | 23 | 12 | **0** | free, qcm | Infographic; label "chapter unknown" |
| Numération jusqu'à 999 | 24 | 22 | 11 | 9 | calculation, fill_blank | Slides |
| Problèmes | 16 | 16 | 10 | 10 | problem_solving | Story video |
| Temps et calendrier | 47 | 37 | **7** | 47 | free | Explanation infographic only; few corrections |
| Monnaie | 24 | 20 | **5** | 20 | free, problem_solving | Explanation only; few corrections |
| Angles | 11 | 8 | **0** | 6 | calculation, free | Not yet: no corrections, few ready |
| Rectangle et carré | 8 | 8 | **0** | 8 | qcm, fill_blank | Not yet: no corrections, few exercises |

**Pilot theme proposal:** **Périmètre et aire** (26/26 exercises corrected, all linked to a chapter, mostly calculation, visual, ideal for an infographic and a one-slide asset). Second candidate: **Division euclidienne** (slides and video).

**Measured by the exporter (2026-10-11):** of the 489 ready exercises, **168 have a correction that was matched to the exact exercise** (the table above counts page-level links, which is larger). Per theme, the numbers to trust are in each book's `00-overview.md`. Périmètre et aire: 21 of 23 matched. Division euclidienne: 18 of 33. Angles and Rectangle et carré: 0.

Why the gap: a correction page quotes the *printed* page number, which differs from the PDF page. `export_notebooklm.py` finds the offset by overlap of exercise numbers and only matches on a clear overlap. Unmatched exercises get the marker "A correction exists on a linked page but could not be matched…", never a guess.

The suggested outputs are my reading of the numbers and are **unverified** until the pilot results confirm them.

## 18. Theme review rule for incoming books

Run section 17's table for every new book before generating anything: if it cannot be computed (missing fields), the book is not ready (see section 14).

## 19. Pilot findings log (fill during the pilot)

| Date | Output | Setting changed | Prompt version | Result (good / bad, why) | Keep? |
|---|---|---|---|---|---|
| 2026-10-11 | Infographic, notebook 01, theme *Comparaison et rangement des nombres* | Arabic, Portrait, Kawaii, Standard | infographic v1 (section 16.2 prompt) | **Good:** Arabic sharp and vowelled, Kawaii look fits age 6-7, clear 3-rule layout, 2 practice questions without answers. **Bad:** (1) English labels appeared although the language was Arabic; (2) rule examples reused the source exercise's own pictures and numbers (apples 7 vs bananas 5, snails 3 vs butterflies 6), which answers source exercise 1. | v2 needed: ban English text; ban reusing source objects or numbers in examples |
| | | | | | |

## 20. Decisions needed from the owner

1. Pilot book: 4ème Maths — agree?
2. Pilot theme: **Périmètre et aire** (proposed) or another from the table?
3. `parascolaire/notebooklm/`: gitignored (regenerable) or pushed?
4. Outputs root folder: where on disk?
