---
name: design-system-cartouche
description: Madrasati TN UI must follow the "Cartouche officielle" design system in DESIGN.md, matching the landing page pixel-perfect
metadata:
  type: project
---

Madrasati TN has a canonical design system, **"Cartouche officielle"** (Tunisian ministry exam-sheet look), documented in `DESIGN.md` at repo root. The landing page (`src/app/features/landing/landing-home.ts`) is the reference implementation.

**Why:** Owner rejected the original generic green-SaaS / AI-generated look. Wants one cohesive institutional style applied everywhere, pixel-perfect.

**How to apply:** For ANY UI task — (1) invoke `frontend-design` + `ui-ux-pro-max` skills first, (2) apply DESIGN.md exact tokens (they override skill defaults), (3) match the landing's exact Tailwind classes. Core tokens: ink `#14251D`, pine `#1B4332`, button green `#2D6A4F`, paper `#FBF8F1`, rule `#E7DFCF`, seal-red `#C1121F` (seals only), gold `#8A5A00`, terracotta `#BF5B34`. Fonts: Fraunces/Noto Kufi via `.font-display`, Public Sans body. Banned: indigo/purple, gradient heroes, emoji-as-icon, WhatsApp-share copy. CNP count = 40.

Teacher/parent/student/discovery workspaces still need migration to this system (landing + public hero done as of 2026-09-30).
