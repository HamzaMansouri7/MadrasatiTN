# Madrasati TN — Design System ("Cartouche officielle")

This is the **single source of truth** for the UI. Every page, component, and future change must match it **pixel-for-pixel**. The canonical reference implementation is the landing page: [landing-home.ts](src/app/features/landing/landing-home.ts) and the tokens in [styles.css](src/styles.css). When in doubt, copy the landing's exact classes.

> **Direction:** the visual language of an official Tunisian ministry exam sheet (a *cartouche*) — institutional, warm, precise. Not a generic green SaaS. Reject: gradient hero cards, decorative blur blobs, gradient-clip text, indigo/purple, neon emerald, all-caps eyebrows, `01/02/03` markers, per-card hover-slide, emoji as UI icons.

---

## 1. How to work on UI (mandatory workflow)

1. **Always invoke the design skills first** for any UI task: run `frontend-design` (aesthetic direction) and `ui-ux-pro-max` (systematic UI intelligence) via the Skill tool before writing markup.
2. **Then obey this file.** The skills give judgment; this file gives the fixed tokens. Tokens here always win over a skill's default suggestion.
3. **Match the landing exactly.** Reuse the same Tailwind class strings already used in `landing-home.ts` — same hex, same radius, same spacing, same font-display headings. Do not invent new shades.
4. **Pixel-perfect check before done:** compare against the landing at the same breakpoint. Same section radius, same border color, same button height/padding, same heading font. If it differs, it's wrong.

---

## 2. Color tokens (exact hex — no other values allowed)

| Token | Hex | Use |
|---|---|---|
| `ink` | `#14251D` | Primary text; **dark section backgrounds** (solid, never gradient) |
| `pine` | `#1B4332` | Deep institutional green; text accents, button hover |
| `pine-btn` | `#2D6A4F` | **Interactive green** — primary button fill (hover → `#1B4332`) |
| `paper` | `#FBF8F1` | Warm page/panel surface; text on dark bg |
| `paper-2` | `#F2ECDE` | Secondary paper (hover fills, sheet zone) |
| `rule` | `#E7DFCF` | Hairline borders / dividers |
| `gold` | `#8A5A00` | Parent accent, links-on-paper |
| `gold-hi` | `#F2C14E` | Highlight number / AI button on dark bg |
| `terracotta` | `#BF5B34` | Student accent |
| `seal` | `#C1121F` | Tunisian flag red — **seals only**, never a button fill |
| text muted (paper) | `#5B6B60` | Secondary text on light |
| text faint (paper) | `#6B7A70` | Captions on light |
| text muted (dark) | `#B7C7BC` | Secondary text on `ink` |
| text faint (dark) | `#9DBBA8` | Captions/eyebrow on `ink` |

**Role accents** (stat cards, role panels, icon tiles): pine `#1B4332` · gold `#8A5A00` · terracotta `#BF5B34` · deep-green `#2D6A4F`. **No indigo, no purple, no neon emerald, no slate chrome.**

Map legacy classes: `emerald-*/teal-*/indigo-*` → tokens above · `slate-50/100` → `#FBF8F1` / `#F2ECDE` · `slate-500/600/700` text → `#5B6B60` / `#14251D`.

---

## 3. Typography

- **Display** (all h1/h2/h3, big numbers/stats): class `font-display` → Fraunces (Latin) / Noto Kufi Arabic (AR). Weight `font-semibold` (never `font-black`/`font-extrabold`). Loaded in [index.html](src/index.html).
- **Body**: Public Sans (Latin) / Noto Sans Arabic (AR) — the global `body` default in [styles.css](src/styles.css).
- No all-caps eyebrow labels. No single-word color/italic accent in headings. Line length < ~56ch for body.

---

## 4. Shape, elevation, spacing

- Radius: big sections `rounded-[28px]` · cards `rounded-2xl` · buttons/inputs/tiles `rounded-xl`.
- Borders: `border border-[#E7DFCF]` on light surfaces.
- Elevation: no `shadow-xl`/`shadow-2xl`. Rest = flat or `shadow-sm`. Hover on cards only: `hover:shadow-[0_18px_45px_-30px_rgba(20,38,29,0.5)]`.
- Section rhythm: `space-y-14` between top-level sections (landing) / `space-y-6`–`space-y-7` inside sections.
- Dark sections: `bg-[#14251D]` solid — **no gradients, no blur-blob decorations.**

---

## 5. Components (copy these exactly)

**Primary button**
```html
class="bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1] font-semibold px-6 py-3.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
```
**Secondary button (on paper)**
```html
class="bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#4A5A50] font-medium px-5 py-3.5 rounded-xl text-sm border border-[#E7DFCF] transition-colors cursor-pointer flex items-center gap-2"
```
**AI / Gemini button (on dark)**: `bg-[#F2C14E] hover:opacity-90 text-[#14251D] font-semibold rounded-xl`
**Text link (on paper)**: `text-[#8A5A00] hover:text-[#C1121F] underline underline-offset-4 decoration-[#E7DFCF]`
**Card**: `bg-white rounded-2xl border border-[#E7DFCF]` + optional top `h-1` accent rule in a role color.
**Stat card**: white card, top `h-1` accent rule (assign pine/deep-green/gold/terracotta — never indigo), big number `font-display font-semibold text-[#14251D]`, label `text-[#5B6B60]`.
**Tabs**: active = `text-[#1B4332]` + underline `#2D6A4F`; inactive = `text-[#5B6B60]`.
**Seal**: `.tn-seal` utility ([styles.css](src/styles.css)) — Tunisian red disc + white crescent. Decoration/authority only.
**Ministry ruled panel**: `.cartouche-rules` for exam-sheet ledger lines.

Icons: Material Icons only (already loaded). **Never emoji as a functional icon.**

---

## 6. Motion & a11y (quality floor)

- One page-load reveal per view max (`animate-in fade-in duration-500` on the hero). No per-card fade/slide, no hover-scale on cards.
- `prefers-reduced-motion` disables `.animate-in` (already in [styles.css](src/styles.css)).
- RTL: app toggles `dir`; use logical props (`border-e`, `ms-`, `pe-`). Arabic display falls through to Noto Kufi automatically via `.font-display`.
- Keyboard focus visible; color contrast AA.

---

## 7. Copy rules

- Institutional, plain, active voice. FR + AR for every string via `LanguageService` (`lang.t` / `lang.tr`). No `\'` inside `{{ }}`.
- **No WhatsApp/Facebook "chaos" framing.** Removed by decision — do not reintroduce share-on-WhatsApp or "fini les groupes Facebook" copy.
- Numbers must be accurate: CNP catalogue = **40** manuals (see [cnp-books.data.ts](src/app/core/data/cnp-books.data.ts)).

---

## 8. Consistency scope

The canonical style is applied to the landing. It **must be propagated identically** to: teacher, parent, student, discovery workspaces, navbar, auth-modal, footer. A screen is "done" only when it is visually indistinguishable in system from the landing.
