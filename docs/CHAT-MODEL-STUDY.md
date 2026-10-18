# Chat model study (2026-10-17/18)

Goal: pick the model chain for the chat drawer (`POST /api/ai/chat`: classify then answer), Arabic first, free tiers only.
Harness: `scripts/chat-study/` (`list-models.mjs`, `smoke.mjs`, `bench.mjs`, `summary.mjs`, `testset.json`). It bundles the real chat skills, so prompts are exactly production's. Raw outputs are gitignored (`*.raw.json`).

## Method
1. **Discovery**: list text models per provider (Gemini 33, NVIDIA 53, OpenRouter free 17, Cloudflare 37, CodeCraft 33).
2. **Smoke**: one Arabic classify call on 74 candidates. 21 returned valid JSON.
3. **Bench**: 28 realistic messages (MSA, Tunisian dialect, Arabizi, FR, teacher, traps, off-topic, injection, privacy, multi-turn), classify then answer with the real grounding block. Cloudflare ran 14 messages to protect the 10k neurons/day shared with images.
4. **Arabic read**: replies of the 7 finalists read by hand on 5 cases.

## Smoke (classify, ~650-900 input tokens)
Fast, 0 reasoning tokens: Gemini flash-lite-latest 0.7 s, 3.5-flash-lite 0.9 s, 3.1-flash-lite 1.8 s, gemma-4-26b 1.6 s; Cloudflare mistral-small-3.1 1.4 s, llama-3.3-70b 1.8 s, qwen3-30b 2.5 s.
Thinking, slow: Gemini 3.7/3.5/3.8-flash 6-9 s (580-1236 reasoning tokens), flash-latest 21 s; NVIDIA nemotron-3-super 8 s; OpenRouter nemotron-3.5-super-vl 25 s, dots-3 36 s.
Failed (53): 404 stale catalog (Gemini 2.5-*, NVIDIA kimi/llama-nemotron-ultra/nemotron-nano/gemma-3/mistral-large/jamba), 403 account (Cloudflare glm-5.x, kimi, deepseek-v4, apertus), 90 s timeouts (NVIDIA deepseek-v4.1-flash, glm-5.3, Gemini 3-flash-preview), empty (Cloudflare gpt-oss-120b/20b, NVIDIA step-5-preview), 429 (Gemini pro models: no free tier).

## Bench
| Model | Intent OK | Answer OK | Median answer | p90 |
|---|---|---|---|---|
| NVIDIA gpt-oss-20b | 95% | 19/20 | 4.5 s | 13 s |
| Gemini 3.8-flash | 82% | 27/28 | 8.1 s | 40 s |
| Gemini 3.1-flash-lite | 82% | 28/28 | 4.2 s | 10.5 s |
| Gemini 3.7-flash | 79% | 27/28 | 7.0 s | 35 s |
| Gemini flash-lite-latest | 74% | 26/27 | 1.0 s | 1.2 s |
| Cloudflare llama-3.3-70b | 86% | 14/14 | 4.7 s | 6.6 s |
| Cloudflare mistral-small-3.1 | 86% | 14/14 | 4.1 s | 5.3 s |
| Cloudflare qwen3-30b | 86% | 11/14 | 2.5 s | 4.2 s |
| NVIDIA nemotron-3-super | 86% | 21/21 | 11 s | 18 s |
| OpenRouter nemotron-3-super:free | 55% | 14/22 | 12 s | 25 s |
| OpenRouter laguna-s-2.1:free | 36% | 8/28 | 11.6 s | 26 s |
Gemini 3.6-flash and 3.5-flash-lite rows are quota exhaustion mid-run, not quality.

## Arabic quality (read by hand)
- **Gemini 3.8-flash**: best Arabic, structured, accurate grammar examples. Too slow for a first slot.
- **Gemini 3.1-flash-lite**: very good Arabic, Tunisian examples, correct grammar answer. Best quality/latency.
- **Gemini flash-lite-latest**: good, short, 1 s.
- **Cloudflare llama-3.3-70b**: generic; leaked a Chinese character mid-word ("ي帮助").
- **Cloudflare mistral-small-3.1**: wrote "الفعل" for "الفاعل", wrong gender ("ابنتي").
- **NVIDIA nemotron-3-super**: leaked Chinese ("具体") and English ("whole"); also refused a grounded grammar question.
- **NVIDIA gpt-oss-20b**: fine Arabic when it answers, but returned EMPTY on the fractions case.

## Failures common to models (prompt/retrieval, not model quality)
- **TRAP English**: all 3 Gemini models answered "yes, we support English per official programmes". The library has none. Cause: retrieval returns zero-score sources and the answer prompt has no "nothing relevant" rule.
- **Privacy**: Gemini models repeated the child's name; flash-lite-latest echoed the address.
- **Unknown lesson**: all models honestly said the info is unavailable. Good.

## Recommended chain (provisional)
- Classify: gemini-flash-lite-latest, then gemini-3.1-flash-lite.
- Answer: gemini-3.1-flash-lite, gemini-flash-lite-latest, gemini-3.8-flash (quality fallback, hedged), gemini-3.7-flash, NVIDIA gpt-oss-20b (both keys), Cloudflare last resort only.
- 4 Gemini keys on separate projects are the capacity; NVIDIA/Cloudflare are fallbacks.
- Drop OpenRouter free models. DeepSeek: own API balance $0 (402), NVIDIA/Cloudflare copies hang or 403.

## Open
- Fix retrieval floor + "not in library" rule, then re-run the TRAP and privacy cases.
- Production timeouts: OpenAI-compatible 12 s, Gemini 15 s; thinking models need hedging, not a hard cut.
- Re-run Gemini 3.6-flash / 3.5-flash-lite on keys 3-4. Test Gemini `thinkingBudget: 0` on 3.x-flash (could make them fast).
- Token budget per turn: classify ~650-900 in / ~50 out; answer prompt ~1500-2300 in. Context excerpt cap still to set.
