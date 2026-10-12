---
version: 1
slug: "src-app-features-parascolaire"
primary_target: "src/app/features/parascolaire"
related_targets: []
---

# Surface brief: Parascolaire module

## Scope and mode
Route family `/parascolaire` (home, book, theme). Mode: **Operate** (a parent finds one theme and opens its resource). Code-led build, no image generation.

## Audience, job, constraints
Parents of 1st-6th grade pupils first, teachers second. Job: find the theme the child works on in three taps and open the infographic or the 8-slide course. Public read, no login, free, Arabic first with FR + AR UI and RTL. Phones with limited data (WebP only). Full spec: `docs/PARASCOLAIRE-MODULE-SPEC.md`.

## Direction contract

THESIS: the whole library is visible at once and honest about what is not ready yet; the interface frames pastel resource images and stays quiet. Refuses the category default of a uniform grid of identical rounded cards with pill badges and a hero banner.

OWN-WORLD: the Tunisian school cahier. Committed palette: ink-blue shell (page header band and primary buttons), cool-white page ground tinted `#EEF2FB`, cahier-cover subject colours (Maths blue, Arabe green, Eveil ochre, Francais plum) used for subject marks only, highlighter yellow for coverage, pencil grey for in-preparation, a single Tunisian-red seal. Type: Lexend (Latin titles), Noto Kufi Arabic (Arabic titles), Public Sans and Noto Sans Arabic for body. Standard controls only: tabs, selects, buttons, links, dialogs.

STORY: a parent sees how much exists (coverage ruler per book), finds the class and book, opens the theme, reads or downloads; empty slots say what is coming without pretending.

FIRST VIEWPORT: ink-blue shell band with the module name, one intro sentence and the small seal; below it standard class tabs with book counts; then book cards, each with a title, subject mark and a coverage ruler (one highlighter segment per finished theme). Primary action sits on the book card.

SIGNATURE MOVE: the coverage ruler, a row of highlighter strokes, one per theme, filled when a resource exists, hatched pencil when in preparation, empty rule when not made; it fills once on load. Status vocabulary elsewhere: ink mark (ready), dashed pencil mark (en cours), blank line (bientot), always with a text label.

FORM: school notebook, position 1 of my ordered list; the roll assigned the stamp album (index 7) and the owner chose Impeccable's pick instead. seed: 27046968

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
Arabic menu label; whether pages state that content is AI-generated; whether theme titles get a separate Arabic title field.
