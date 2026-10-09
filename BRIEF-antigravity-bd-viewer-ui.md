# BRIEF for Antigravity — BD viewer UI polish (`/discovery` → "شريط مصوّر")

Written by Claude Code, 2026-10-09. Owner: Hamza. Files: `src/app/features/bd/bd-library.html`, `bd-library.ts`, share button `src/app/shared/components/share-button.ts`, helper `src/app/shared/utils/share-post.ts`. Read [DESIGN.md](DESIGN.md) first (tokens win), match the landing page, no indigo/purple, no emoji as icons. Users are Parents and Teachers only: no student wording or features.

## Problems seen by the owner (screenshots, verified visually by the owner)

1. **Header whitespace.** Title and description sit on the right, the page count floats alone on the left with a big empty block between them. Fix: compact header, title + count pill on one row, description under it.
2. **Inconsistent filters.** Grade chips (green when active) and trimester chips (dark when active) differ in colour, size and style. Fix: one filter bar, same chip component/classes for both rows, small row labels (Niveau / Trimestre), same height (min 40px, 44px touch).
3. **Count confusion.** "6 ألبوم" in the header vs "18 صفحة" badges on cards. Fix: header shows albums count in the album grid and pages count inside an album; each card shows its page count; counts follow the active filters.
4. **No share on albums.** Share exists only inside the reader. Add `app-share-button` on every album card (variant icon) and in the album header (variant button, `placement="down" align="end"`). URL = `/discovery?bd=<cover page id>` (deep link already opens the album). `details` = level · subject · trimester. Share/copy text must stay the unified post from `share-post.ts`.
5. **Reader share details** are hard-coded (`'Expression orale'`, `'T' + n`). Use `trimesterLabel()` and `lang.tr('Expression orale','التعبير الشفوي')`; for French albums the subject must come from the item (`francais`), not the hard-coded oral-expression label.
6. **Card layout.** Album card = clickable image+title area, then a footer row (open link on one side, share icon on the other). Never nest a button inside a button.

## Current structure (already built, keep)

Albums grid → album pages grid → reader (page strip, zoom, swipe, keyboard, print). Data: only `topic === 'bandes-dessinees'` items. i18n keys `bdBack, bdAllTrimesters, bdAlbumOpen, bdZoom, bdAlbums` exist in `language.service.ts`. All UI strings via `lang.t()` / `lang.tr()`, Arabic RTL primary, OnPush, signals, `@if/@for`.

## Rules

- Do not touch the BD resource folders or manifests (extraction is a separate brief).
- No browser or screenshots unless the owner asks. Verify with `pnpm run lint`, `pnpm test` (not raw vitest), `pnpm run build`; say that no visual check was done.
- Stage explicit paths only, never `git add -A`. Do not deploy.
- Report: what changed per problem number above.
