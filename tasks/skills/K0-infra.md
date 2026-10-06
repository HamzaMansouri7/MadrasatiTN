# Task K0: Skill infrastructure (no behavior change)

Goal: let any endpoint pass a `systemInstruction`, thinking budget and token cap, and compose BASE + SKILL + data tags. Do NOT change any endpoint prompt yet.

## 1. `src/server.ts` — `aiGenerateJSON` (~L359-378)
- Add optional 5th param `opts?: { systemInstruction?: string; thinkingBudget?: number; maxOutputTokens?: number }`; put them in `config` (`systemInstruction`, `thinkingConfig: { thinkingBudget }`, `maxOutputTokens`). Existing calls must work unchanged.
- Distinguish truncated output (`finishReason` MAX_TOKENS) from a JSON parse error in logs; keep the 1 retry.
- Remove the redundant fence stripping only if tests show JSON mode never returns fences; otherwise keep.

## 2. New `src/server/skills/types.ts`
```ts
export interface Skill { id: string; version: string; system: string; temperature: number; thinkingBudget?: number; schema?: object }
```

## 3. New `src/server/skills/compose.ts` (pure)
- `composeSystem(base: string, skill: Skill, ctx: { lang: 'ar'|'fr'; grade?: string; subject?: string }): string` — BASE + SKILL + language policy + (later) glossary.
- `wrapData(tag: 'teacher_input'|'document'|'student_question', text: string, maxLen: number): string` — escapes closing tags, truncates, wraps in `<tag>...</tag>`.
- `capJson(value: unknown, maxChars: number): string` for objects like `currentMemo`, `dna`.

## 4. Logging
- Log `skill.id@skill.version`, endpoint, lang, token usage if available (no user content).

## 5. Tests `src/server/skills/compose.spec.ts`
- Closing-tag escape, truncation, composition order, injection string stays inside the data tag.

## Acceptance
All existing endpoints still pass manual curl; new specs pass; lint + build pass.
