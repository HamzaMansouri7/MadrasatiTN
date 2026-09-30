# Design Migration TODO — Cartouche officielle

Handoff doc for continuing the UI migration (e.g. in Antigravity). Single source of truth = [DESIGN.md](DESIGN.md). Canonical reference implementation = [landing-home.ts](src/app/features/landing/landing-home.ts) — copy its exact classes. All counts below are from a grep audit on 2026-09-30.

## Mandatory workflow (per DESIGN.md §1 + CLAUDE.md)
1. Invoke the `frontend-design` and `ui-ux-pro-max` skills before writing markup.
2. Apply DESIGN.md's exact tokens (tokens win over skill defaults).
3. Match the landing page pixel-for-pixel (same hex, radius, spacing, `font-display` headings).
4. Keep `ChangeDetectionStrategy.OnPush`, modern control flow (`@if`/`@for`/`@switch`), SSR `localStorage` guards, i18n via `lang.t`/`lang.tr` (never `\'` inside `{{ }}`).

## Color tokens (only allowed values — DESIGN.md §2)
| Token | Hex | Use |
|---|---|---|
| ink | `#14251D` | Primary text; dark section bg (solid, never gradient) |
| pine | `#1B4332` | Text accents, button hover |
| pine-btn | `#2D6A4F` | Primary button fill (hover → `#1B4332`) |
| paper | `#FBF8F1` | Page/panel surface |
| paper-2 | `#F2ECDE` | Secondary paper / hover fills |
| rule | `#E7DFCF` | Hairline borders/dividers |
| gold | `#8A5A00` | Parent accent, links-on-paper |
| gold-hi | `#F2C14E` | AI/Gemini button on dark |
| terracotta | `#BF5B34` | Student accent |
| seal | `#C1121F` | Tunisian red — seals only, never a button fill |
| muted / faint (light) | `#5B6B60` / `#6B7A70` | Secondary/caption text |

**Legacy → token map:** `emerald-*/teal-*/indigo-*` → tokens above · `slate-50/100` → `#FBF8F1`/`#F2ECDE` · `slate-500/600/700` text → `#5B6B60`/`#14251D`. **No indigo, no purple, no amber, no gradient, no emoji-as-icon.** Icons = Material Icons only. Seal = `.tn-seal` utility.

**Role accents:** home = ink `#14251D` · teacher = pine `#1B4332` · parent = gold `#8A5A00` · student = terracotta `#BF5B34` · public = deep-green `#2D6A4F`.

---

## TASKS

### 1. Navbar redesign — `src/app/shared/components/navbar.ts`
- [x] Logo tile: solid `bg-[#1B4332] text-[#FBF8F1]`, `font-display font-semibold`.
- [x] Brand name: `font-display font-semibold text-[#14251D]`.
- [x] TN badge: paper text chip `bg-[#F2ECDE] text-[#1B4332] border border-[#E7DFCF]`.
- [x] Role tabs container: `bg-[#F2ECDE] border border-[#E7DFCF] rounded-xl`. Active = `bg-white text-[#14251D] font-semibold shadow-xs`; inactive = `text-[#5B6B60] hover:text-[#14251D]`.
- [x] Tab icon colors → role tokens (home ink, teacher pine `#1B4332`, parent gold `#8A5A00`, student terracotta `#BF5B34`, public deep-green `#2D6A4F`).
- [x] Language pill + watchlist pill: `bg-[#FBF8F1] hover:bg-[#F2ECDE] text-[#14251D] border border-[#E7DFCF]`; count badge `bg-[#8A5A00] text-white`.
- [x] Auth widget: `bg-white border-[#E7DFCF]`; avatar border `border-[#E7DFCF]`; role text `text-[#2D6A4F]`.
- [x] Logout: `text-[#BF5B34] hover:bg-[#F2ECDE] border border-[#E7DFCF]`.
- [x] Login = `text-[#14251D]`; Signup = pine-btn `bg-[#2D6A4F] hover:bg-[#1B4332] text-[#FBF8F1]`; Google = `bg-white border-[#E7DFCF]`.
- [x] Mobile role bar: active pills use role tokens; inactive `bg-white text-[#5B6B60] border border-[#E7DFCF]`.

### 2. Discovery body — `src/app/features/discovery/public-discovery.ts`
- [x] Search/filter bar: paper surface + `#E7DFCF` borders, inputs `rounded-xl`.
- [x] Course cards + exercise cards: `bg-white rounded-2xl border border-[#E7DFCF]`; headings `font-display font-semibold text-[#14251D]`.
- [x] Teacher directory cards: `bg-white rounded-2xl border border-[#E7DFCF]`, avatar border `#2D6A4F`, stats in `#E7DFCF` grid.
- [x] Modals (Course, Teacher profile, Watermark preview): `bg-[#FBF8F1] rounded-2xl border border-[#E7DFCF] shadow-xl`, solid dark banners.
- [x] Watchlist & badges: token colors (gold `#8A5A00`, pine `#1B4332`, deep-green `#2D6A4F`).
- [x] All legacy emoji replaced with Material Icons.
- [x] Zero residual `slate-*`, `emerald-*`, `teal-*`, `amber-*`, `indigo-*` classes.

### 3. Auth modal — `src/app/shared/components/auth-modal.ts`
- [x] Modal shell: `bg-[#FBF8F1] rounded-2xl border border-[#E7DFCF] shadow-xl`.
- [x] Header: solid `bg-[#14251D] text-[#FBF8F1]`, Fraunces `font-display` title.
- [x] Role switcher: `bg-[#1B4332]/40` tab bar, active `bg-[#FBF8F1] text-[#14251D]`.
- [x] Inputs `rounded-xl border-[#E7DFCF] focus:border-[#2D6A4F]`; primary CTA = pine-btn `bg-[#2D6A4F]`.
- [x] Role selector cards with role-specific active borders (`#1B4332`, `#8A5A00`, `#BF5B34`).

### 4. Feature pages verify (Teacher / Parent / Student)
- [x] `teacher-home.ts`: Clean tokens, removed FB/WhatsApp copy.
- [x] `student-home.ts`: Clean tokens, photo upload card, dark AI tutor console.
- [x] `parent-home.ts`: Clean tokens, gold stat cards, multi-child ledger.

### 5. Build Verification
- [x] `npm run build` — passed with code 0 (both browser & server SSR bundles compiled cleanly).

---

## Done (do not redo)
- No-orange: **clean**. Only match repo-wide is the word "oranges" in a math exercise string (`student-home.ts` ~343), not a color. Student accent already terracotta `#BF5B34`.
- Discovery hero: migrated.
- Teacher/parent/student: bulk-restyled (residual cleanup in task 4 only).
