# slides — v1

Purpose: an 8-slide deck for one theme. Text is safer in slides than in an infographic picture, so practice questions go here.
Output type in NotebookLM: **Présentation**.
Settings (from `defaults.json`): language dropdown, format **Diaporama détaillé**, length **Par défaut**, sources = the one theme file.
Fields: `{{class_en}} {{age}} {{subject}} {{theme}} {{lang_name}} {{vowel_clause}} {{number_clause}} {{brand}} {{brand_latin}}`

## Prompt

```text
{{brand_latin}}. Create 8 slides for Tunisian primary pupils, {{class_en}} ({{age}}), on the theme "{{theme}}" in {{subject}}. Write the theme title in {{lang_name}}, translated accurately.
Slide 1: title with the brand "{{brand}}" and a small accurate Tunisian flag.
Slides 2-4: one key idea each, with one simple worked example of your own and one picture. {{answer_clause}}
Slides 5-7: one practice exercise each, copied exactly from the selected sources, question only, no answer.
Slide 8: short summary.
All text in {{lang_name}} only{{vowel_clause}}. Large readable text, one idea per slide. {{number_clause}}
Use only the selected sources. Do not answer the source exercises. Do not reuse objects or numbers from the source exercises in your own examples.
```
