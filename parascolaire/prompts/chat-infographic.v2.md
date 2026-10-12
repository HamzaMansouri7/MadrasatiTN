# chat-infographic — v2

Purpose: one chat message that makes one infographic in Studio (no tile, no settings). Needs the notebook's standing rules (`runsheets/chat/00-GLOBAL-CHAT-SETTINGS.md`).
Fields: `{{digits_clause}} {{orientation}} {{style}} {{theme}} {{class_en}} {{age}} {{subject}} {{file}} {{lang_name}} {{vowel_clause}} {{brand}} {{class_label}} {{subject_label}} {{exception}}`
Basis: v4 pilot + deck test 2026-10-12. Changes from v1: visible flag picture; digits_clause (maths themes may show ONE written operation, others no digits). Digits rule for calculation themes is UNTESTED.

## Prompt

```text
Create an infographic in Studio, {{orientation}}, {{style}} style, for the theme "{{theme}}", {{class_en}} ({{age}}), {{subject}}. Use only the source file {{file}}.
Header: the brand "{{brand}}", a clearly visible Tunisian flag drawn as its own small picture (not an emoji in the text), the theme title, and two tags: "{{class_label}}" and "{{subject_label}}". Footer: the brand.
Body: exactly three big cards, one idea each, one picture and a caption of at most five words. One simple comparison per card, with ONE pair only.
{{digits_clause}} Reading order follows the language direction.
All text in {{lang_name}} only{{vowel_clause}}. {{exception}}
```
