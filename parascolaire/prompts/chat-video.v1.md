# chat-video — v1

Purpose: one chat message that makes ONE short child video for one theme (story, one worked example, one question). Needs the standing chat rules.
Fields: `{{theme}} {{class_en}} {{age}} {{subject}} {{file}} {{lang_name}} {{vowel_clause}} {{number_clause}} {{video_style}} {{brand}}`
Basis: video-child.v1 (kept) adapted to chat: asks for the video directly, names the source file and style.
Unverified: that a chat message can start a Résumé vidéo with this style. Test one before bulk.

## Prompt

```text
Create a short video summary in Studio, {{video_style}} style, for the theme "{{theme}}" ({{subject}}), for Tunisian {{class_en}} pupils ({{age}}). Use only the source file {{file}}.
Tell it as a short friendly story with simple characters. One example of your own, solved slowly step by step. End with one question for the viewer, taken from the source file, with no answer given.
Show the brand "{{brand}}" and a clearly visible Tunisian flag in the first and last scene.
Narration in {{lang_name}}{{vowel_clause}}, simple school language. {{number_clause}}
```
