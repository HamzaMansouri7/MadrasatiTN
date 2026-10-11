# infographic — v1

Purpose: one portrait infographic for one theme, branded, minimal text.
Output type in NotebookLM: **Infographie**.
Settings (from `defaults.json`, per class band): language dropdown, orientation, visual style, detail level, sources = the one theme file.
Fields: `{{class_en}} {{age}} {{subject}} {{theme}} {{class_label}} {{subject_label}} {{lang_name}} {{vowel_clause}} {{number_clause}} {{brand}} {{exception}} {{brand_latin}}`

Lessons built in (from the 2026-10-11 pilot, see NOTEBOOKLM_PLAN.md section 19): keep text minimal, no equations or long sentences in the picture, one language only, never reuse the source exercises' objects or numbers.

## Prompt

```text
{{brand_latin}}. Educational infographic for Tunisian primary pupils, {{class_en}} ({{age}}). Subject: {{subject}}. Theme: {{theme}} (write the theme title in {{lang_name}}, translated accurately).
Header: the brand "{{brand}}" with a small accurate Tunisian flag (red field, white circle, red crescent and star), and two tags: "{{class_label}}" and "{{subject_label}}".
Body: three or four big cards, one per key idea of the theme, each with one clear picture and at most a short caption.
Keep the text minimal. No equations and no long sentences inside the picture.
All text in {{lang_name}} only{{vowel_clause}}. {{exception}} {{number_clause}}
Footer: "{{brand}}".
Use only the selected sources. Do not answer the source exercises. Do not reuse objects or numbers from the source exercises in your examples; use different objects.
```
