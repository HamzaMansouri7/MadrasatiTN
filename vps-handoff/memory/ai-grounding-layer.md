---
name: ai-grounding-layer
description: "AI endpoints use shared KnowledgeSource grounding layer (src/server/knowledge-source.ts) — extend via adapters, never per-endpoint"
metadata: 
  node_type: memory
  type: project
  originSessionId: 0229ee92-d645-4094-bb01-780bb438fd69
---

All 12 `/api/ai/*` endpoints share one grounding stack (built 2026-10-02):
- `src/server/knowledge-source.ts` — `KnowledgeSource` model + adapters (cnp-chapter, cnp-book) + `retrieveContext()` keyword retrieval + `registerSources()` for runtime additions (e.g. scraped-site JSON).
- server.ts helpers: `aiGenerateJSON` (Gemini JSON mode + responseSchema + 1 retry), `buildGrounding`, `resolveLang` (**default 'ar' — Arabic is primary in Tunisia**), `langRule`, `sanitizeExercise`; exam barème forced to 6+6+8=20 server-side.

**Why:** owner wants every AI feature grounded in official Tunisian curriculum, dual AR/FR, and extendable by adding data sources — not endpoint code.

**How to apply:** new curriculum sources → new adapter/`registerSources` rows with distinct `origin`; never inline curriculum text in endpoint prompts. New AI endpoints must use `aiGenerateJSON` + `buildGrounding` + the guard chain (`originGuard, aiRateLimiter, aiDailyGuard`). Scraped datasets from Antigravity arrive as JSON matching the `KnowledgeSource` shape (see [[product-vision-resource-hub]], [[delete-exact-duplicates]]).
