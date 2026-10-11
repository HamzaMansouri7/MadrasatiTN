# slide-1 — v1

Purpose: ONE slide for one idea, to split into a single image asset.
Output type in NotebookLM: **Présentation** (a deck of one slide).
Settings: language dropdown, format **Diaporama détaillé**, length **Court**, sources = the one theme file.
Fields: `{{class_en}} {{age}} {{subject}} {{theme}} {{lang_name}} {{vowel_clause}} {{brand}} {{brand_latin}}`

## Prompt

```text
{{brand_latin}}. Create ONE slide for Tunisian primary pupils, {{class_en}} ({{age}}), on the theme "{{theme}}" in {{subject}}. Write the theme title in {{lang_name}}, translated accurately.
The slide shows the single most important idea of the theme, one simple picture, and at most two short lines of text. Small brand mark "{{brand}}" in a corner.
All text in {{lang_name}} only{{vowel_clause}}. Large readable text.
Use only the selected sources. Do not answer the source exercises.
```
