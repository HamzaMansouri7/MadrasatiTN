# Task K6: Illustration skill (S13) and security fixes

Depends on: K0. Endpoint `/api/ai/generate-illustration` (`src/server.ts` ~L1724-1781); callers `article-studio.ts` L569, `education-store.ts` L1112.

## 1. `skills/illustration.ts`
- Image prompt template: child-safe, no text inside the image, flat educational style, palette consistent with DESIGN.md (pine/paper/gold/terracotta). Cap `promptText` (e.g. 300 chars) and wrap as data.

## 2. SVG sanitizer (pure, `src/server/sanitize-svg.ts` + spec)
- Fallback path writes model SVG to `/uploads`. Before writing: must start with `<svg`, strip `<script>`, `on*` attributes, `javascript:` URLs, `<foreignObject>`, external `href`/`xlink:href` (keep `#id`), size limit. If it fails validation, return an error and write NO file.

## 3. Security fixes found in the audit
- `generate-memo` resource mode path check (if not already fixed in K3): use `path.relative`.
- Cap unbounded client fields still interpolated into prompts: `messages`, `currentMemo`, `dna`, `customInstruction`, `title` (use `capJson`/`wrapData` from K0) in any endpoint not yet migrated.
- Optional: periodic cleanup of old generated illustration files in `/uploads` (report the size first, do not delete anything automatically without owner approval).

## Acceptance
Malicious SVG fixtures (script, onload, external href, foreignObject) are rejected; valid SVG passes; lint + build + specs pass.
