# Task T7: Tests + lint

1. `src/server/memo-schema.spec.ts`: `buildMemoPrompt` for each mode (language rule present; teacher-wording rule present for text/image); `MEMO_SCHEMA` has the required keys.
2. Component specs (vitest + TestBed, style of `src/app/app.spec.ts`): each layout renders a fixture `MemoDoc` in AR and FR; contenteditable blur updates the store.
3. Run `pnpm test`, `pnpm run lint`, `pnpm run build`; fix issues in the new files only.

No supertest exists: do not add one; test pure functions.
