# video-parent — v1

Purpose: a short video for the parent: what the child learns, the common mistake, how to help at home.
Output type in NotebookLM: **Résumé vidéo**.
Settings (from `defaults.json`): language dropdown, format **Court**, visual style by class band, sources = the one theme file. The text below goes in **Thème personnalisé**.
Fields: `{{class_en}} {{subject}} {{theme}} {{lang_name}} {{vowel_clause}}`

## Prompt

```text
A guide for parents of Tunisian {{class_en}} pupils on the theme "{{theme}}" ({{subject}}).
Cover: what the child learns, the most common mistake, and one simple way to practise at home using an example from the selected sources.
Calm and clear tone, no jargon, no grading language. Narration in {{lang_name}}{{vowel_clause}}.
Use only the selected sources. Do not answer the source exercises.
```
