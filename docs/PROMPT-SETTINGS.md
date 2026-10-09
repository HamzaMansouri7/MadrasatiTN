# Prompt settings: what to send to each model (AI Studio)

Reference for the AI Studio engine. One **Theme object** feeds both the LLM and the image model, so the text layer and the pictures match. Decisions from 2026-10-08; see [PLAN-infographic.md](PLAN-infographic.md).

## 1. Rules for every image prompt (all models, all themes)

- English only. **Never send Arabic** (or any text) to an image model.
- Always end with: `no text, no letters, no numbers, no words`.
- Object centered, about **10% empty margin** so nothing gets cropped.
- Plain **white background** (most models can't make transparency); remove it afterwards.
- Name the slot's accent colour as a hex value (see §4). Objects with a natural colour (red heart, golden trophy) keep it; the accent goes on secondary parts.
- Same style block + same character block + same seed across one document, for consistency.

## 2. Style blocks (start each prompt with the theme's block)

| Theme | Style block |
|---|---|
| **Kids 2D (primary, gold standard)** | `2D children's book cartoon illustration, soft clean outlines, flat pastel colors with gentle watercolor shading, friendly rounded shapes` |
| **Flat 2D icons (Officiel static set)** | `Flat 2D vector-style educational illustration, clean smooth outlines, flat colors with minimal soft shading, simple friendly shapes` |
| **3D toy (secondary)** | `Premium 3D educational illustration, soft clay/plastic toy-like material, rounded friendly proportions, soft studio lighting, subtle contact shadow` |
| **Scientifique (later)** | `Realistic hand-painted scientific illustration, natural colors, fine detail, vintage natural-history plate style, soft paper texture` |

Kids gold-standard reference: the "مذكرة درس — أسماء الإشارة" poster (2D cartoon teacher/boy/girl, pastel cards, cloud title, star mascot).

## 3. Character block (reuse word for word in every prompt of a series)

Example: `the same girl character: about 8 years old, long brown hair, pink sweater, big friendly eyes`. Keep it identical and reuse the same seed. Keeping a character identical across images is still **unproven** on free models.

## 4. Accent colours per lesson-plan slot

From `src/app/core/data/infographic-templates.data.ts`:

| Colour | Slots |
|---|---|
| `#2D6A4F` deep green | objectives, integration, assessment, stages, homework |
| `#1B4332` dark green | outcomes |
| `#8A5A00` amber | materials, differentiation |
| `#BF5B34` terracotta | values |
| `#14251D` ink | reflection |

The Kids theme will get its own simple ~6-colour pastel palette (scoped to AI Studio only; app UI stays DESIGN.md Cartouche).

## 5. Sizes

| Use | Displayed on A4 | Generate |
|---|---|---|
| Block icon | ~48–64 px | 512×512 |
| Stage card picture | ~80 px | 512×512 |
| Cartouche corner | ~120 px | 768×512 (landscape) |
| Hero / scene (Kids, Scientifique) | large | 1024×1024 or 1024×768 |

512 px is sharp in print at 300 dpi for these display sizes. Save as WebP.

## 6. Which model for what

| Need | Model |
|---|---|
| Simple flat icons, recolourable per theme | **LLM-written SVG** (free, true vector) |
| Kids 2D characters and scenes | **FLUX** (NVIDIA FLUX.1-dev, keyed Pollinations) or Gemini image (paid, soft daily budget) |
| Exact diagrams (fractions, cycles, number lines) | **LLM inline SVG** |
| All text, including big Arabic letters | **HTML/SVG text**, never an image model |

## 7. What the LLM receives (the JSON-spec call)

- The source (topic, text, photo, PDF), grade, subject, language, and the teacher's optional "Consignes".
- The chosen **composition preset** and the **Theme object** as style rules (palette, shapes, tone).
- It returns a JSON spec: content per block, inline SVG for diagrams, and English image prompts per picture slot (built from §1–§3).
- The **server** (not the LLM) applies the theme, the character block and the seed, calls the image model, inserts the pictures, then sanitizes and validates.
- A second cheap call reviews facts, age fit and text length before rendering.

## 8. Static Officiel set (17 files)

Generated once, same in every lesson plan: `objectives`, `outcomes`, `materials`, `assessment`, `differentiation-support`, `differentiation-enrich`, `integration`, `values`, `homework`, `reflection`, `stage-01-intro` to `stage-05-close`, `header-left`, `header-right` (all `.webp`). The full prompts are in the conversation of 2026-10-08; switch their style block to the flat 2D one above.
