# Task T8: Save memo to library + share link (Phase 2)

Depends on: T1-T6 done.
Goal: a teacher can save a memo and share a public link. Public-first model: viewing a shared memo needs no login; saving requires login. Do NOT break existing worksheets saved via `/api/docs`.

1. Inspect `/api/docs` in `src/server.ts` (~line 1264) and `store.saveWorksheet` (`education-store.ts` ~lines 967-997). Prefer a new doc type `memo` (storing the full `MemoDoc` + layout) over packing JSON into `GeneratedExercise.promptText`. Keep existing worksheet reads working.
2. Store: `saveMemo()` returns `{ id, shareUrl }`, `getMemo(id)`, list of published memos.
3. Route `/memo-studio?memo=ID` (or `/memo/:id`) opens a saved memo read-only for anonymous visitors, editable for the author.
4. Social crawler OG tags for shared memo links: copy the existing `/generate?sheet=ID` crawler pattern in `src/server.ts` (~line 1609).
5. "Save" and "Copy link" buttons (`no-print`); no WhatsApp share copy (CLAUDE.md rule).
6. Show saved memos in the library/discovery listing as a new resource type (check how worksheets appear and follow it).

## Acceptance
Save -> link opens in a private window without login; edits by the author persist; OG tags present for crawlers; lint + build pass.
