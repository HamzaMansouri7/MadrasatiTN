# chat-slides — v1

Purpose: one chat message that makes ONE 8-slide course deck for one theme (course + practice). Needs the notebook's standing rules (`runsheets/chat/00-GLOBAL-CHAT-SETTINGS.md`).
Fields: `{{theme}} {{class_en}} {{age}} {{subject}} {{file}} {{lang_name}} {{vowel_clause}} {{number_clause}} {{answer_clause}} {{brand}} {{exception}}`
Basis: slides.v1 (kept) adapted to chat: names the source file, asks for the deck directly.

## Prompt

```text
Create a Studio slide deck of exactly 8 slides, detailed, for the theme "{{theme}}" ({{subject}}), {{class_en}} pupils ({{age}}). Use only the source file {{file}}.
Slide 1: title with the theme, the brand "{{brand}}" and a clearly visible Tunisian flag drawn as a small picture.
Slides 2-4: one key idea each, one simple worked example of your own and one picture. {{answer_clause}}
Slides 5-7: one practice exercise each, copied exactly from the source file, question only, no answer.
Slide 8: short summary, with the brand.
Large readable text, one idea per slide. {{number_clause}}
All text in {{lang_name}} only{{vowel_clause}}. {{exception}}
```
