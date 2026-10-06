# Task T2: MemoDoc model + store methods

Goal: define the shared contract and the client API. Do NOT add component code.

## 1. `src/app/core/models/memo.model.ts` (export from the `@core` barrel)
```ts
export type MemoLayout = 'tree' | 'steps' | 'cards';
export interface MemoDoc {
  title: string; subtitle?: string; grade: string; subject: string; topic: string; language: 'ar' | 'fr';
  steps: { n: number; heading: string; body: string }[];
  cards: { id: string; label: string; definition: string; examples: string[]; icon?: string; color?: string }[];
  example?: { sentence: string; analysis: { word: string; role: string }[] };
  remember: string[];
  formula?: { parts: string[]; note: string };
  quote?: string;
}
export type MemoInput = { mode: 'topic' | 'text' | 'image' | 'file' | 'resource' /* + fields as in the T1 body */ };
```
Field names must be identical to the T1 `MEMO_SCHEMA`.

## 2. `src/app/core/services/education-store.ts`
- `memo = signal<MemoDoc | null>(null)` and `memoLayout = signal<MemoLayout>('tree')`.
- `generateMemo(input)` and `regenerateMemoBlock(block)` using `fetch('/api/ai/generate-memo')`, same style as `generateIllustration` (~line 1100). Return `{ ok, error?, extractedText? }`. SSR-safe.
- Mutators: `updateMemoField`, `addMemoCard`, `removeMemoCard`, `addMemoStep`, `removeMemoStep`.

## Acceptance
Types match the T1 schema; lint + build pass.
