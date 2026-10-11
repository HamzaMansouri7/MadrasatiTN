# Prompt library — NotebookLM generation

Everything needed to generate infographics, slides and videos for any book, one theme at a time. Rules and background: `../NOTEBOOKLM_PLAN.md` (sections 14–17).

## What is here

| Item | Purpose |
|---|---|
| `defaults.json` | Every default in one place: styles per class band, class labels, subject labels, languages, brand. **Change values here, never inside a template.** |
| `notebooks.json` | Notebook order. Name = `Madrasati TN · NN · <book title>`. New books get the next number automatically. |
| `infographic.v1.md`, `slides.v1.md`, `slide-1.v1.md`, `video-child.v1.md`, `video-parent.v1.md`, `video-teacher.v1.md` | The six prompt templates (version 1). |
| `runsheets/NN-<book>.md` | One generated sheet per book: a progress table and the filled prompts, ready to paste. |
| `runsheets/INDEX.md` | Index of all sheets. |

## How to generate one asset

1. Open the book's run sheet in `runsheets/`.
2. Left panel in NotebookLM: untick all sources, then tick **only** the theme file named in the sheet.
3. Studio panel: click the pencil on the tile named above the prompt.
4. Set the options listed under the prompt, paste the prompt, generate.
5. Review (plan section 10). Tick the box in the progress table. Log a finding in plan section 19 if something is off.

Each theme sheet shows 3 prompts (infographic, 8-slide deck, child video). Small themes (7 exercises or fewer) get the one-slide asset and the child video only. The other prompts print on demand:

```
python parascolaire/tools/build_runsheets.py --print <book-folder> <theme-number> <infographic|slides|slide-1|video-child|video-parent|video-teacher>
```

## Rules for changing a prompt

1. Never edit a version in place. Copy to `*.v2.md`, change the copy, and point the generator at it.
2. Test the new version on the same pilot theme and compare to the old result.
3. Keep it only if it is not worse. Record the decision in plan section 19.

## Add a new book

1. Put it in `livres/<class>/<book>/` (contract: plan section 14).
2. `python parascolaire/tools/build_runsheets.py --all` rebuilds the NotebookLM files and every run sheet.
3. Add the book to `notebooks.json` to freeze its number.

## Known limits

- The theme title in a prompt is the French name from the data. The prompt asks NotebookLM to translate it accurately. Check the title in each Arabic result; an Arabic theme title field is not in the data yet.
- Style defaults per class band are proposals until confirmed in the pilot.
- A prompt that works in one book can fail in another. The first result of each new book is a test, not an approval.
