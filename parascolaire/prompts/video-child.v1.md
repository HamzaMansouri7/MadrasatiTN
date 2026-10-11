# video-child — v1

Purpose: a short video for the child (story style, one worked example).
Output type in NotebookLM: **Résumé vidéo**.
Settings (from `defaults.json`): language dropdown, format **Court**, visual style by class band, sources = the one theme file. The text below goes in **Thème personnalisé** (the focus field). The look comes from the style row, not from this text.
Fields: `{{class_en}} {{age}} {{subject}} {{theme}} {{lang_name}} {{vowel_clause}} {{number_clause}}`

## Prompt

```text
Explain the theme "{{theme}}" ({{subject}}) to Tunisian {{class_en}} pupils ({{age}}) as a short friendly story with simple characters.
One example of your own, solved slowly step by step. End with one question for the viewer, taken from the selected sources, with no answer given.
Narration in {{lang_name}}{{vowel_clause}}, simple school language. {{number_clause}}
Use only the selected sources. Do not answer the source exercises.
```
