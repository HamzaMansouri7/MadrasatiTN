# PLAN — Infographic feature (Memo studio)

Status (2026-10-08): IN PROGRESS, direction changed. See "ADR-001 and progress" at the end of this file. The phases below are the original plan; Phase 2 (data model) and the template-driven schema part of Phase 3 are now built for the lesson plan.
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

---

## ADR-001 and progress (2026-10-08)

**Decision:** one template-driven document engine for lesson plan, memo studio and summaries. Merge the engine, not the documents (lesson plan = teacher-facing, 12 sections; memo = pupil-facing, 6 layouts; each stays its own template). `/summarize` and the Create hub "Synthèse" fold into it later. Users: teachers and jardin d'enfants making attractive summaries from their own course text, photo or PDF; output is HTML to print, PDF or PNG. Student infographic is out of scope for now.

**Model:** Template = structure (slots: `zone`, `kind`, `variant`, `valueKey`, `rows`, `count`, `maxChars`). Theme = look (design tokens + illustration set): Cartoon (kids, few words), École, Scientifique, Officiel (Cartouche, default for the teacher sheet). Switching a theme is a CSS-variable swap. Illustrations in tiers: fixed free set bound to slot ids (default), optional topic hero image from the image chain, per-stage images on request. Text is always real HTML; Arabic is never baked into an image.

**Built and deployed:**
- Registry + single id `lesson-plan-official`, legacy alias `official-lesson-plan` (`src/app/core/data/infographic-templates.data.ts`, `getInfographicTemplate()`).
- Generic slot renderer `src/app/shared/components/infographic-renderer.ts` (page keeps toolbar, cartouche, footer); spec in `infographic-renderer.spec.ts`.
- `src/server/skills/template-schema.ts`: responseSchema and size-limit prompt rules built from the template; `skills/lesson-plan.ts` uses it; spec checks the schema keeps the old field set.
- Related, same day: owner-only "Publier au blog" (server GET returns `isOwner`), lesson plans and series as library cards with an open link, print fix for `/summarize` and for header/footer inside print sheets, share button.

**Pending (in order):**
1. Live-test one real lesson-plan generation. The new size limits (objectives max 3 x 160 chars, etc.) are untested for quality; loosen in the template if plans are too terse.
2. Migrate the memo studio and its 6 layouts onto the engine.
3. Extend the model for richer templates: image slots, item objects (not only strings), grid areas instead of coarse zones, inline editing (`contenteditable` synced to `doc.values`), per-slot regenerate.
4. Themes and the fixed illustration set (owner must approve the cute child illustrations).
5. Fold `/summarize` and the hub "Synthèse" into the engine.

**Unverified:** whether the memo accepts photo/PDF input; whether the grade list includes maternelle/jardin.

**Evaluated and discarded:** Antigravity sample templates (two-column comparison, landscape radial/stat cards): useful only to prove the slot vocabulary; layout had overlaps, blank bands, tiny low-contrast text and Latin placeholders. Deleted.
