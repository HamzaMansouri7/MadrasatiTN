# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: parents of Tunisian primary pupils (1ère to 6ème année) who want help with one school theme at home. Secondary: teachers who use the same resources in class. There are no student accounts and no student section.

## Product Purpose

Madrasati TN is an educational platform for the Tunisian primary system that unifies teachers and parents in role-based workspaces. The Parascolaire module (new, 2026-10-12) is a public section that shows ready visual resources for each theme of a support-book library: an infographic, an 8-slide course, later a video and a parent article. Success: a parent finds the theme their child is working on, opens the resource, and practises without needing an account.

## Positioning

Ready visual resources per official theme, in Arabic, free, organised by class, book and theme, with the whole library visible from the first day (what exists is clickable, what is planned is marked "En cours" or "Bientôt").

## Operating Context

- Content is generated with NotebookLM from a private, rebranded library of 17 books (899 pages, about 220 themes). Notebook 01 (1st grade, Maths and Arabic, 24 themes) is the first with real outputs.
- Files live on the project's VPS (`/var/madrasati/uploads/parascolaire/`), served by the existing Express SSR app.
- Stack in place: Angular 21 (standalone, signals, OnPush), Tailwind 4, Express 5 SSR.
- Full spec: `docs/PARASCOLAIRE-MODULE-SPEC.md`.

## Capabilities and Constraints

- Public read, no login (the public-first access model). Downloads of the course PDF and the infographic image are planned.
- Free and non-profit, no ads, no pricing UI.
- Arabic first. Every interface string exists in French and Arabic; the app supports RTL.
- Only rebranded names appear: no publisher, no original book title, no source PDF path.
- Resource images carry a small "Gemini Notebook" watermark (accepted by the owner).
- Undecided: whether the pages state that the resources are AI-generated; the Arabic menu label (candidate: الدعم المدرسي).

## Brand Commitments

Existing name "Madrasati TN" / مدرستي تونس. A small Tunisian seal is used as authority decoration only. The owner decided on 2026-10-12 that the Parascolaire module may use its own look: colours and design are free, and the goal is an impeccable design.

## Evidence on Hand

- 24 infographics and 5 course decks (of 24) for notebook 01, in `parascolaire/outputs/` (not in git); status in `parascolaire/outputs/PROGRESS.md`.
- Known flaws shipped as is by owner decision: 7 Maths infographics draw digits as Arabic-Indic, one infographic is off-theme, small drawing errors in some course slides.
- No testimonials, usage numbers or traffic data exist; none must be invented.

## Product Principles

1. Show the whole library from day one; honesty about what is not ready yet beats a thin catalog.
2. A parent reaches a resource in three taps (class, book, theme).
3. The pastel resource images are the content; the interface frames them and stays quiet.
4. Arabic and French are equal citizens, and layout mirrors correctly in RTL.
5. Every state (ready, in preparation, not yet made, error) is explained in plain words, never by colour alone.

## Accessibility & Inclusion

Parents of varied digital skill, many on phones with limited data (WebP images, no heavy scripts). Target contrast AA, visible keyboard focus, text labels for every status, 44 px touch targets.
