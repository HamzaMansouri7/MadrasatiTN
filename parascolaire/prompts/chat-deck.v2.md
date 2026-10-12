# chat-deck — v2

Purpose: ONE chat message that makes a slide deck where each slide is one complete infographic (one theme per slide), then the deck is exported as PDF and split into one PNG per theme (tool to write after the test).
Status: 3-slide test passed 2026-10-12 (concept themes). Calculation-theme rule untested.
Fields: `{{digits_clause}} {{n}} {{themes_list}} {{class_en}} {{age}} {{style}} {{lang_name}} {{vowel_clause}} {{brand}} {{exception}}`

## Prompt

```text
Create a Studio slide deck of exactly {{n}} slides, Portrait if possible. Each slide is ONE complete infographic for {{class_en}} pupils ({{age}}), {{style}} style, one theme per slide, in this order:
{{themes_list}}
Same layout on every slide: header with the brand "{{brand}}", a clearly visible Tunisian flag drawn as its own small picture (not an emoji in the text) and the theme title; exactly three big cards, one picture and a caption of at most five words each, ONE pair only per card; footer with the brand.
{{digits_clause}} Use different objects on each slide. Each slide uses only the source file named for it.
All text in {{lang_name}} only{{vowel_clause}}. {{exception}}
```
