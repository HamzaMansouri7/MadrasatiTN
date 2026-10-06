---
name: gemini-key-location
description: GEMINI_API_KEY lives in repo-root .env (gitignored) — never ask the owner for it again
metadata: 
  node_type: memory
  type: project
  originSessionId: 0229ee92-d645-4094-bb01-780bb438fd69
---

`GEMINI_API_KEY` is saved in `c:\Users\lassa\Documents\GitHub\MadrasatiTN\.env` (gitignored via `.env*` rule, .gitignore:4). Owner stored it 2026-10-02 and explicitly said: do not ask for it again. Value is wrapped in double quotes — strip them when parsing manually (quoted value sent raw → "API key not valid").

The key is **paid Tier 2, post-paiement** ("My Billing Account", confirmed by owner via AI Studio screenshot 2026-10-02) — NOT free tier. Server guards in `src/server.ts` (per-IP 8/min + 60/day, global 12/min + 1200/day) are therefore cost ceilings, not quota protection; raise them if traffic grows.

**Why:** server AI endpoints and scripts (`src/server.ts`, `scripts/*.mjs`) read `process.env.GEMINI_API_KEY`; without it `/api/ai/*` return errors.

**How to apply:** when running the SSR server or AI test scripts locally, load the key from `.env` (e.g. `$env:GEMINI_API_KEY = (Get-Content .env | Select-String 'GEMINI_API_KEY').Line.Split('"')[1]` or a dotenv loader — the app itself does NOT auto-load .env). Never print the key value in chat, commits, or logs. Related: [[ai-grounding-layer]].
