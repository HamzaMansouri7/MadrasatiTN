# video-teacher — v1

Purpose: a short video for the teacher: objective, steps, typical errors, one exercise.
Output type in NotebookLM: **Résumé vidéo**.
Settings (from `defaults.json`): language dropdown, format **Court**, visual style by class band, sources = the one theme file. The text below goes in **Thème personnalisé**.
Fields: `{{class_en}} {{subject}} {{theme}} {{lang_name}} {{vowel_clause}}`

## Prompt

```text
A teaching sequence for teachers of Tunisian {{class_en}} pupils on the theme "{{theme}}" ({{subject}}).
Cover: the objective, three steps using examples from the selected sources, the typical pupil errors, and one exercise taken from the sources.
Structured and brief. Narration in {{lang_name}}{{vowel_clause}}.
Use only the selected sources. Do not answer the source exercises.
```
