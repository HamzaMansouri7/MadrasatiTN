# infographic — v2

Purpose: one portrait infographic for one theme, branded, minimal text. Replaces v1 (kept for history).
Output type in NotebookLM: **Infographie**.
Settings (from `defaults.json`, per class band): language dropdown, orientation, visual style, detail level, sources = the one theme file.
Fields: `{{class_en}} {{age}} {{subject}} {{theme}} {{class_label}} {{subject_label}} {{lang_name}} {{vowel_clause}} {{brand}} {{exception}} {{brand_latin}}`

Lessons built in (pilot log, NOTEBOOKLM_PLAN.md section 19, 2026-10-11 and 2026-10-12): no digits or object counts in the picture (the model miscounts and reverses digits inside right-to-left text), words and shapes only, three cards, one language, never reuse source objects.

## Prompt

```text
{{brand_latin}}. Simple educational infographic for Tunisian primary pupils, {{class_en}} ({{age}}). Subject: {{subject}}. Theme: {{theme}} (write the theme title in {{lang_name}}, translated accurately).
Header: the brand "{{brand}}" with a small accurate Tunisian flag (red field, white circle, red crescent and star), and two tags: "{{class_label}}" and "{{subject_label}}".
Body: exactly three big cards, one per key idea of the theme, each with one clear picture and one short caption of at most five words.
Use no digits, no numbers and no equations anywhere. Explain with words and simple shapes only. Do not show counted groups of objects.
Text reads right to left. Put the cards in reading order, top to bottom.
All text in {{lang_name}} only{{vowel_clause}}. {{exception}}
Footer: "{{brand}}".
Use only the selected sources. Do not answer the source exercises. Do not reuse objects from the source exercises; use different ones.
```
