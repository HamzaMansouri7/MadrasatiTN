# PLAN — Infographic feature (Memo studio)

Status: PLAN ONLY. Owner parked building (2026-10-07) until he finishes his own research. Do not start Phase 2+ without his go.
Goal: a teacher gives a topic or text, picks a template, and gets an A4 landscape Arabic infographic (like a cards-and-roles page) with real Arabic text and illustrations, editable, exportable.

## Principles (from research + tests)
1. **Text is never drawn by an image model.** Free image models garble Arabic; only paid GPT Image 2 is reported good. The page renders real RTL text; illustrations are text-free (S13 rule: "no text, no numbers").
2. **Template = data.** Named slots with kind, count, max characters, illustration yes/no. The AI fills slots (contractual, like cursor-brain prompts); the renderer draws them. A new template = a new JSON entry, no new code.
3. **Offer options, then edit.** Generate 3 to 6 template choices per request (as Canva / Napkin do), user picks one, edits text inline, regenerates single panels.
4. **Free only.** Chains A (text) and image chain from `models.json` / `src/server/ai/image-chain.ts`. No paid model.

## Phase 0 — Prerequisites (Batch 3)
- Image chain wired into `generate-illustration` (A: `image-chain.ts`), caps + `wrapData` on inputs, `toPublicError`, SVG sanitizer.
- Done when: eval harness green and image chain used in production code.

## Phase 1 — Feasibility spikes (no UI, throw-away scripts in `scripts/`)
1.1 **Character consistency:** one fixed "family" description block + one style preset, 4 panels, same seed family; look at the outputs (cf klein-9b, flux-1-schnell). Pass = same-looking characters in at least 3 of 4 panels. Needs Cloudflare quota (resets daily; reset time unverified).
1.2 **Icon strategy:** inline SVG icon set (free licence, check it) for small icons vs generated. Decide per slot kind.
1.3 **Arabic render check:** one hand-built HTML with real Arabic text, printed to PDF. NOTE global rule: no browser/screenshots unless the owner asks, so the owner must approve this step.
1.4 **Export path:** how PNG is produced from the page (print-to-PDF exists; PNG unverified).

## Phase 2 — Data model
2.1 `src/app/core/models/infographic.model.ts`: `InfographicTemplate` (id, name, slots[]), `Slot` (id, kind: title|subtitle|definition|card|icon-row|slogan|footer, count, maxChars, illustration), `InfographicDoc`.
2.2 Three templates as JSON: concept + roles (the sample's structure), steps, comparison.
2.3 Validator: slot counts and lengths (reuse `validateAgainstSchema` + new `checkInfographic`), spec.

## Phase 3 — Backend
3.1 `skills/infographic.ts` (S14, chain A): schema built from the template's slots; rules: slot lengths, no invented facts, grade vocabulary, Arabic default; each illustration slot gets an English text-free image prompt.
3.2 `POST /api/ai/generate-infographic` (guards: originGuard, aiRateLimiter, aiDailyGuard) returns the filled doc + image prompts.
3.3 `POST /api/ai/generate-infographic-image` per panel through `generateImage`, shared style + character block, returns URL; one failed panel never fails the page (fallback: icon or empty frame).
3.4 Template suggestions: ask the model to rank the 3 to 6 best templates for the topic (cheap call, chain B).
3.5 Eval cases added to `scripts/eval-skills.mjs`.

## Phase 4 — Frontend (Memo studio, Cartouche rules in DESIGN.md apply)
4.1 `infographic` layout in `MemoLayout`, route/state in `education-store`.
4.2 Template picker (cards with thumbnails).
4.3 Renderer component: A4 landscape, RTL, slots drawn from the doc.
4.4 Inline edit of every text slot; per-panel "regenerate text" and "regenerate image".
4.5 Loading + error states per panel.

## Phase 5 — Export and polish
5.1 Print A4 landscape (existing print engine), PDF; PNG if 1.4 finds a path.
5.2 Author line ("prepared by") taken from the teacher profile, never invented.
5.3 Teacher review of 5 generated pages per template before release.

## Open decisions (owner)
- Palette: the sample is playful pastel; DESIGN.md "Cartouche" forbids some of that. Allow a separate teacher-document palette?
- Template sources: design our own (recommended) vs reuse the presentations repo layouts / unDraw / Humaaans (check licences). Do not copy a real teacher's signed design.
- Stage 2 (free canvas editor) only if teachers ask.

## Risks
- Character consistency across panels (Phase 1.1 decides feasibility).
- Cloudflare free allowance 10,000 neurons/day shared by all its models; many panels per page burn it. Budget: ~5 images per page, cache results, Pollinations is last (watermark).
- Long Arabic text overflowing cards: enforce `maxChars` in the prompt AND in the validator.

## Rough size
About 20 tasks: Phase 1 = 4 spikes, Phase 2 = 3, Phase 3 = 5, Phase 4 = 5, Phase 5 = 3 (estimate).
