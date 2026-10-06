# Task T9: Teacher attribution on memos (Phase 2)

Depends on: T8.
Goal: teachers are authors. Show who made a memo, with real data only (no fake stats).

1. Add `authorName`, `authorRole`, `school?` to the saved memo (T8), filled from the logged-in profile.
2. Footer on the printed/shared sheet: author name and school (follow the attribution footer in GEMINI.md section 5; toggle from T6).
3. Library/discovery card for a memo: author name as a primary link to the teacher's page in the `/teachers` directory (see `features/teachers` from commit 1c4492c).
4. Do NOT show counts or ratings that are not real data.

## Acceptance
Saved memo shows its author on the sheet and on the card; the link goes to the teacher page; lint + build pass.
