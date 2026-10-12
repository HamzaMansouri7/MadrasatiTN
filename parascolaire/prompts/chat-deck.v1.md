# chat-deck — v1

Purpose: ONE chat message that makes a slide deck where each slide is one complete infographic (one theme per slide), then the deck is exported as PDF and split into one PNG per theme (tool to write after the test).
Status: **UNTESTED** (3-slide test running 2026-10-12). Do not use for bulk until the test passes.
Fields: `{{n}} {{themes_list}} {{class_en}} {{age}} {{style}} {{lang_name}} {{vowel_clause}} {{brand}} {{exception}}`

## Prompt

```text
Create a Studio slide deck of exactly {{n}} slides, Portrait if possible. Each slide is ONE complete infographic for {{class_en}} pupils ({{age}}), {{style}} style, one theme per slide, in this order:
{{themes_list}}
Same layout on every slide: header with the brand "{{brand}}", a small Tunisian flag and the theme title; exactly three big cards, one picture and a caption of at most five words each, ONE pair only per card; footer with the brand.
No digits, no numbers, no equations, no counted groups of objects. Use different objects on each slide. Each slide uses only the source file named for it.
All text in {{lang_name}} only{{vowel_clause}}. {{exception}}
```
