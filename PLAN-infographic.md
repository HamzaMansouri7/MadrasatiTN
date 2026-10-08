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
1.4 **Export path:** dropped (2026-10-08). Print/PDF + share cover it; no PNG.

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
5.1 Print A4 landscape (existing print engine), PDF.
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

**Decision:** one template-driven document engine for lesson plan, memo studio and summaries. Merge the engine, not the documents (lesson plan = teacher-facing, 12 sections; memo = pupil-facing, 6 layouts; each stays its own template). `/summarize` and the Create hub "Synthèse" fold into it later. Users: teachers and jardin d'enfants making attractive summaries from their own course text, photo or PDF; output is HTML to print or PDF (share via the existing share option). Student infographic is out of scope for now.

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

---

## AI Studio engine decision (2026-10-08, later)

Memo studio is renamed **AI Studio** (display only; route `/memo-studio` and `memo*` code keys unchanged). Its infographics move to a **hybrid engine**: the LLM writes HTML for layout and Arabic text (RTL wraps natively) with inline SVG for exact diagrams; a mascot is defined once in SVG `<defs>` and reused with `<use>`. Provider: free Gemini chain with fallbacks (remote, no GPU). Server sanitizer + validator. Template mode and prompt mode (teacher "Consignes") share the engine. FLUX only for optional text-free illustrations as `<img>`; Recraft not used (paid).

- Presets: Cycle, Build-it, Discovery, Mini-comic first (up to 10 later). Themes: Kids first, then École, Scientifique, Officiel.
- Spike v1 (`scratch/fractions.svg`): valid SVG, exact 1/2 1/3 1/4 pies, vowelled Arabic. Flaws to fix: SVG comments broke XML, weak RTL alignment, emoji. Spike v2 blocked by a temporary Gemini 503.

**Owner decisions:** one simple controlled Kids palette, scoped to the AI Studio Kids theme only (app UI stays DESIGN.md Cartouche); retire the old 6 memo layouts once the new engine is proven; maternelle/jardin grade not now; Create hub becomes a type picker only.

**Roadmap:** spike v2 → `/api/ai/generate-infographic` (chain, sanitizer, validator, tests) → simplified AI Studio UI (3 source tabs, prefilled meta, preset + theme, collapsed Consignes) → more presets and themes.

---

## AI Studio — final architecture (2026-10-08)

```
Teacher input (topic / text / import) + preset + theme [+ Consignes]
        │
        ▼
Theme object (palette, mood, art style, character block, seed)
        │                         │
        ▼                         ▼
LLM (free Gemini chain)     FLUX (image chain, text-free, English)
 - lesson content            - characters, animals, objects, scenes
 - HTML layout + Arabic      - same style words + character block + seed
 - inline SVG diagrams
 - image prompts per slot ──────► server calls FLUX per prompt
        │                         │
        └──────────► Server: insert images, sanitize, validate A4/RTL
                              │
                              ▼
                    Live A4 preview → print / PDF / save / share
```

- **LLM = creative**, **server code = control** (theme, seeds, API calls, sanitizing, retries). The LLM never manages seeds or consistency.
- Arabic is always HTML/SVG text, never baked into images. Big decorative letters = styled SVG text over a FLUX scene.
- Target quality: Facebook Arabic-letter posters, about 70–80% reachable on free models. Unproven: same character across a series.

### Switch: LLM fills a JSON spec, Angular renders (owner agreed 2026-10-08)

After a friend's art-direction review, the LLM no longer writes free HTML. It acts as a **Visual Art Director** and returns a JSON spec: composition preset, content per block, inline SVG diagrams where needed, and English FLUX prompts. About **8 Angular composition components**, built once on the existing slot renderer, render the spec: hero + 4 cards, circular flow, central object + labels, story journey, timeline, discovery grid, mini comic, before/after.

- Theme tokens grow beyond colours: materials, depth, shape, illustration style.
- Three material levels: soft illustrated background, semi-solid cards, solid hero object. No glass everywhere.
- Visual rhythm (big, small, big). Presets are compositions, not subjects.
- Big hero Arabic letter = styled SVG text with depth over a FLUX scene (FLUX never draws Arabic).
- Start with one Kids level (Playful); Soft and Premium later.
- Trade-off accepted: more work up front, consistent premium output every run.

---

## Progress (2026-10-08, build + lint + 161 tests green; not deployed, no visual check)

Built: flat SVG icons per slot and stage in the lesson-plan renderer; spec model + whitelist SVG sanitizer + `normalizeInfographicSpec` (`core/utils/infographic-spec.util.ts`, with spec); skill + `POST /api/ai/generate-infographic`; `InfographicSpecComponent` (3 compositions: hero-cards, circular-flow, timeline; themes kids and official as CSS variables); `/ai-studio` page (source input, composition, style, regenerate, share, print); save as docType `infographic`, shareable at `/infographic/:id`; link from the memo studio.

Next: owner tries 5 real generations at `/ai-studio` and judges quality (prompt fixes before anything else); then migrate the memo studio's 6 layouts and retire them; FLUX hero images and more presets only after that.

---

## Plan v2: image-ready spec, 6 presets, on-demand card images (agreed 2026-10-08)

Decisions: the LLM fills content + picks a preset from the BUILT list only; the renderer owns all placement; no runtime preset invention, no positions in JSON. The long "pedagogical designer" prompt is used OFFLINE to design new presets, not at runtime.

### Phase A: spec upgrade (model + validator + prompt)
1. `infographic-spec.model.ts`: on `SpecItem` and `SpecHero` add optional `wantsImage?: boolean`, `imagePrompt?: string` (English), `imageUrl?: string`. Add preset ids `central-picture`, `lesson-stages`, `comparison` to `INFOGRAPHIC_PRESETS` + `PRESET_ITEM_LIMITS`. New optional blocks only where a preset needs them: `columns` (comparison: 2 sides with points), `stages` (lesson-stages: teacherActivity / learnerActivity), `quote`.
2. `infographic-spec.util.ts` (`normalizeInfographicSpec`): clip `imagePrompt` to 300 chars, force-append "no text, no letters, no numbers, no labels, no watermark", reject non-ASCII-heavy prompts (Arabic must never reach FLUX); accept `imageUrl` only if it starts with `/uploads/`. Old docs (no new fields) stay valid.
3. `skills/infographic.ts`: add a short pedagogy step (key concepts, one idea per block, age vocabulary); schema enum = the 6 built presets; per block `wantsImage` + `imagePrompt` (English, scene only, Kids style block from PROMPT-SETTINGS.md §2 is added by the SERVER, not the model). Keep the prompt short.
4. Spec tests: new fields clipped/sanitized, bad imageUrl dropped, old spec still loads, new presets' item limits.

### Phase B: renderer refactor (no visual change)
5. Extract `SpecCardComponent` (one card: image if `imageUrl`, else icon; badge; title; text; "illustrate" button slot). Used by every preset.
6. Split `infographic-spec.ts` (218 lines, one `@switch`) into a thin shell (header, theme tokens, remember strip, footer) + one component per preset: `preset-hero-cards`, `preset-cycle`, `preset-timeline`. Same output as today.

### Phase C: 3 new presets (design offline, then code)
7. Design each with the offline preset prompt + frontend-design / ui-ux-pro-max skills, matching DESIGN.md + the Kids tokens. ASCII drafts are in the chat of 2026-10-08.
   - `central-picture` (family poster): central image + caption, side cards, role grid, icon row, quote bubble.
   - `lesson-stages` (أسماء الإشارة poster): numbered stages with teacher | learner columns, rule table, exercise lines, "ماذا تعلمت؟".
   - `comparison`: two columns (A vs B) with image + points, common-points strip.
8. Code each as a preset component reusing `SpecCardComponent`; add to the studio's composition control (6 + Auto).

### Phase D: on-demand card images
9. Button "illustrate" on each card and hero (screen only, `no-print`), shown when the block has an `imagePrompt`.
10. Click → `POST /api/ai/generate-illustration` with `promptText = imagePrompt`, `style` = theme style block, `seed` = fixed per doc (same look across cards), `grade`, `subject`. Add a `raw: true` flag so the route skips the second LLM rewrite (`buildImagePrompt`) when the prompt is already an English scene.
11. Write the returned `imageUrl` into the block, update the doc in place, re-save with the SAME id (owner only). Loading state on the card; icon stays on error.
12. Fix audit #19 first: regenerate must update the same doc id, not create a new library card each time.

### Phase E: verify + ship
13. Build + lint + tests once. Owner runs 5 real generations across the 6 presets and tries the image button on 3 cards. Then deploy.

### Order and size (rough, unverified)
A (small) → B (small) → D (medium) → C (largest: 3 designs) → E. D before C so the image button is proven on the 3 existing presets first.

### Not doing
Runtime preset generation, x/y or sizes in JSON, generic component engine, images on the jodhadha, 3D style as default.

---

## Plan v3: AntV diagrams + keep images + polish (agreed 2026-10-08, not started)

Order: after the owner's live test of the current engine.

### A. Keep images across layouts (no wasted generations)
1. Switching between card-based presets (hero-cards, circular-flow, timeline, central-picture) = client-side re-layout: change `values.preset` only, no AI call; every image stays on its card. Re-save same id.
2. Small "صورة أخرى" button on every illustrated card: redraw that card only (new seed via `variation`).
3. comparison / lesson-stages need new content → AI call, after a short warning; images carried over by card title from a per-doc image library (`imageLibrary: { title → imageUrl }` kept on the doc).
4. "إعادة التوليد" is the only action that makes new content; it also reuses library images when titles match.

### B. AntV Infographic diagram block (https://github.com/antvis/Infographic, chosen library)
5. Server-only dep, pinned version; `@antv/infographic/ssr` renderToString.
6. Allow-list 6 school-fit templates: cycle ring, numbered staircase, snake road, pyramid, 4-colour quadrant, pros/cons comparison.
7. Model fills `diagram` data (not syntax); server builds syntax → render → `sanitizeSvg` → `diagramSvg`.
8. Our fixes: RTL (reverse order + direction), Noto Kufi, theme palette from the ONE theme object, column labels, icons; fallback to no diagram on fail/timeout (10 s).

### C. One theme object
9. Merge the sheet CSS vars and THEME_IMAGE_STYLE into one theme definition (palette, fonts, radius, image style block) feeding sheet, images and AntV.

### D. Image prompt quality
10. Server prepends the lesson story (topic + key objects) to each imagePrompt; rule: concrete objects from the lesson, never just "a child"; abstract cards → wantsImage=false and no button; card images `object-contain` (no face crops); stronger negative prompt against text/numbers.

### E. Sheet header polish (shell, shared by all presets)
11. Accent band, subtitle as learning objective, teacher + school line from profile, trimester + date, small illustration slot.

### F. Exercise preset
12. New preset "problem": situation text + data table + question with answer lines (keeps real numbers like 4/9, 3240 د).

### Open
- Image chain step 1 is a PAID Gemini image model (image-chain.ts) — conflicts with "free only"; owner to decide.
- Rotate POLLINATIONS_API_KEY and NVIDIA_API_KEY (printed in chat 2026-10-08).
