# Task T5: Three editable A4 layouts

Goal: presentational components rendering a `MemoDoc`. Reference structure: the Facebook "Ma fiche mémo" poster (title banner, numbered steps, concept cards, analysed example, "à ne pas oublier" box, formula strip). Follow DESIGN.md tokens, NOT the poster colors.

## Files in `src/app/features/memo-studio/layouts/`
- `memo-tree-layout.ts`, `memo-steps-layout.ts`, `memo-cards-layout.ts` (selectors `app-memo-*-layout`).
- Input: `memo = input.required<MemoDoc>()`; edits go through the store mutators from T2.

## Requirements
- Root element has class `print-page` (A4, fixed aspect, no overflow).
- Editing via `contenteditable` (NOT input/textarea, which are hidden in print). Commit on blur. Add/remove step/card buttons carry `no-print`.
- Per-block "regenerate" button (`no-print`) calls `store.regenerateMemoBlock`.
- Decorations: SVG icon/sticker set in `public/assets/memo/` (apple, pencils, books, globe, star, heart, magnifier, backpack). Icon picker per card. No emoji icons. Optional "custom picture" button calls the existing `generate-illustration`.
- RTL: logical classes only (`ms-`, `pe-`, `border-e`); verify AR + FR.
- Differences: tree = central trunk card with branches; steps = vertical numbered flow; cards = grid of concept cards.

## Acceptance
Each layout renders the same fixture in AR and FR; edits persist to the store; no overflow at A4.
