# Task T1: Server endpoint `/api/ai/generate-memo`

Goal: add one endpoint that turns teacher input (topic / text / image / PDF-DOCX / library resource) into a `MemoDoc` JSON. Do NOT inline curriculum text in prompts; do NOT change existing endpoints.

## 1. New file `src/server/memo-schema.ts` (pure, no Express)
- Export `MEMO_SCHEMA` (`Type.*` responseSchema) matching the T2 `MemoDoc`, and `buildMemoPrompt(input, lang)`.
- Prompt rules: when text/image is supplied keep the teacher's wording, do not invent curriculum facts; follow `langRule(lang)`.

## 2. `src/server.ts` — endpoint
- `app.post('/api/ai/generate-memo', originGuard, aiRateLimiter, aiDailyGuard, ...)` placed next to `summarize-docs` (~line 1050); copy its handler pattern.
- Body: `{ mode: 'topic'|'text'|'image'|'file'|'resource', topic?, text?, images?[{base64Data,contentType}], file?{base64Data,contentType,filename}, resourceUrl?, grade, subject, trimester?, language, instructions?, blockToRegenerate?, currentMemo? }`
- Validation (400): topic <= 300, text <= 8000, images <= 8, base64 string <= 16MB, image mime must start with `image/`.
- Images first, then text, in the `GeminiPart[]`. PDF: allow `application/pdf` inlineData explicitly. DOCX: add `mammoth`, extract raw text, treat as text mode.
- `resourceUrl`: accept only paths under the resources/uploads folders; resolve the real path and verify it stays inside (path-traversal guard); read the file; images go in as inlineData.
- Always call `buildGrounding({grade, subject, trimester, topic, lang})`.
- `blockToRegenerate` + `currentMemo`: return only that block regenerated.
- For image/file modes also return `extractedText` (UI shows it for correction).
- Response `{ success: true, result: MemoDoc, extractedText? }`; errors identical to sibling endpoints.

## Reuse
`aiGenerateJSON`, `resolveLang`, `langRule`, `buildGrounding`, `STR/NUM/INT/BOOL/STR_ARR` in `src/server.ts` lines 354-398; template handler `summarize-docs` lines 1050-1109.

## Acceptance
curl each mode returns schema-valid JSON; 400 on oversize / bad mime / traversal; middleware chain present; lint + build pass.
