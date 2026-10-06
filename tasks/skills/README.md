# AI Skills & Prompt Engineering — task index (for Antigravity)

Master plan: [PLAN-ai-skills.md](../../PLAN-ai-skills.md). Read it first: it has the audit findings and the skill catalog (S1-S13).

Order: K0 -> K1 -> (K3, K2 in parallel) -> K4 -> K5 -> K6 -> K7 -> K8 (deployment, last, only after owner approval).

Global rules for EVERY task:
- Read CLAUDE.md, GEMINI.md first. Never inline curriculum text in prompts: curriculum facts come only from `retrieveContext` / `buildGrounding` (`src/server/knowledge-source.ts`).
- Skills are bundled TS modules in `src/server/skills/` (template-literal strings). Do NOT read `.md` files at runtime and do NOT put prompts in `public/` (not copied to dist / publicly served).
- Skill modules are pure (no Express, no `src/server.ts` import) so vitest can test them.
- Each endpoint keeps its request/response contract so the UI does not break. Any new response field is optional for the client.
- User-controlled text goes in `contents` inside delimited data tags (`<teacher_input>`, `<document>`, `<student_question>`), never in `systemInstruction`. Cap every client string (see each task).
- No silent defaults for grade/subject (return 400 when required input is missing).
- Run `pnpm test`, `pnpm run lint`, `pnpm run build` before finishing. Do not commit unless asked.
