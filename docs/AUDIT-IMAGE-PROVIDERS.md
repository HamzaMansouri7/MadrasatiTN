# Image providers audit (2026-10-17)

Goal: free pictures that never stop, by pooling **the same model at several providers** (group by model, providers nested), like the text chain does with Gemini keys.

Sources: live model lists pulled on 2026-10-17 from each provider with our `.env` keys; costs measured the same day on Cloudflare usage analytics (one picture per model, same programme prompt: 5ème maths `math-5-ch2`). Nothing below is from memory unless marked *unverified*.

## 1. What each provider offers (image models)

| Provider | Image models listed | Free? |
|---|---|---|
| Cloudflare Workers AI | flux-2-klein-4b, flux-1-schnell, flux-2-klein-9b, flux-2-dev, SDXL lightning, SDXL base, dreamshaper-8-lcm, SD 1.5 inpainting, leonardo phoenix-1.0, leonardo lucid-origin | 10,000 neurons/day for the whole account |
| Pollinations (our key) | flux.2-klein-4b, flux.1-schnell (alias `flux`), flux.1.1-pro, flux.1-kontext-pro, z-image-turbo, dreamshaper-8-lcm (**alias `sana`**), gpt-image (3), mai-image (2), community: flux-2-dev-free, sdxl-lightning (2), lucid-origin (2), inferenceport (2) | small credit, amount *unverified* |
| NVIDIA build | hosted (422 = exists): flux.2-klein-4b, **flux-3-image-klein** (new), flux.1-kontext-dev. flux.1-dev and flux.1-schnell hang (no answer in 25-120 s), a known NVIDIA outage since 2 Oct ([forum thread](https://forums.developer.nvidia.com/t/flux-1-dev-returning-500-retries-exhausted-3-3-timeouts-since-oct-2/384929)). **qwen-image: 404 on the API = download only, not usable** | free trial, 40 requests/min per key (account page) |
| SiliconFlow | FLUX.1-schnell, FLUX.1-dev, FLUX.1-Kontext-dev/pro/max, FLUX-1.1-pro(+Ultra), FLUX.2-flex/pro, Qwen-Image(+Edit), Z-Image-Turbo | which ones are free *unverified* |
| OpenRouter | Gemini image + GPT image models only | all paid |
| Gemini (free keys) | lists 6 image models | image generation paid (prepaid key), per earlier owner decision |

Finding: the SANA picture seen in the studio came from Pollinations' keyless `flux` route; Pollinations maps `sana` to dreamshaper-8-lcm, a model the owner banned.

## 2. Cost and quality (Cloudflare, measured)

| Model | Neurons/picture | Pictures/day | Speed | Quality |
|---|---|---|---|---|
| flux-2-klein-4b | ~104 | ~96 | 8.1 s | good 2D, drew a garbled sign |
| flux-1-schnell (8 steps) | ~326 | ~30 | 2.3 s | clean 2D, no text, square only |
| flux-2-klein-9b | ~1,364 | ~7 | 2.5 s | best 2D, drew a garbled sign |
| flux-2-dev | ~5,625 | ~1 | 9.8 s | clean, no text, very expensive |
| SDXL lightning | beta, cost not shown | ? | 3.4 s | busy scene, garbled signs |

Banned: lucid-origin (~1,400/picture), dreamshaper-8-lcm (unusable), SDXL base (64 s).

## 3. Duplication matrix (owner's model order, providers nested)

| # | Model | Providers that have it | Count |
|---|---|---|---|
| 1 | flux-2-klein-4b | Cloudflare, Pollinations, NVIDIA | **3** |
| - | flux-3-image-klein (new, not tested yet) | NVIDIA | 1 |
| 2 | flux-1-schnell | Cloudflare, Pollinations, SiliconFlow, NVIDIA (hangs) | **4** |
| 3 | flux-2-klein-9b | Cloudflare | 1 |
| 4 | flux-2-dev | Cloudflare, Pollinations community | 2 |
| 5 | SDXL lightning | Cloudflare, Pollinations community (2 routes) | 3 |
| - | flux-1-dev (not in owner's order) | NVIDIA (hangs), SiliconFlow | 2 |

## 4. Gaps to close before wiring

1. Free amount per provider: Pollinations credit, NVIDIA credits, SiliconFlow free models (*unverified*).
2. Quality of the non-Cloudflare copies of the same model (same weights, but steps/size defaults differ).
3. flux-2-dev at ~5,625 neurons: allow only when today's Cloudflare usage is low, or drop.
4. NVIDIA flux.1-dev / schnell hanging today: cause unknown (queue, quota or outage).

## 5. Target design

`IMAGE_MODELS` becomes a list of models; each model holds its providers in order. A picture tries every provider of model 1 before moving to model 2. Per-provider cooldown stays; Cloudflare reads its daily neurons and skips expensive models when the day is nearly spent; every attempt is logged with provider, model and reason.

## 6. Approved mechanism (owner, 2026-10-17)

```
Picture request (English scene, no text)
 ├─ 1. flux-2-klein-4b   → Cloudflare → NVIDIA → Pollinations(key)
 ├─ 2. flux-1-schnell    → Cloudflare → SiliconFlow → Pollinations(key)   (NVIDIA when its outage ends)
 ├─ 3. flux-2-klein-9b   → Cloudflare, only while today's Cloudflare usage < 70%
 ├─ 4. SDXL lightning    → Cloudflare
 └─ all failed → clear error to the teacher (never a random picture)
```

- Every provider of a model is tried before the next model (same look kept).
- Sequential: the next provider starts only after a failure or 60 s. Failed providers cool down alone.
- Every attempt is logged (provider, model, reason).
- Google Gemini image (paid prepaid key) is outside this free chain: only for pictures that need Arabic text, within its daily budget.
- Excluded: keyless Pollinations (serves SANA), lucid-origin, dreamshaper-8-lcm, SDXL base, flux-2-dev, NVIDIA qwen-image (download only).

## 7. Final table (2026-10-17, same programme prompt, measured)

| # | Model | Provider | Status | Speed | Cost / picture | Free per day |
|---|---|---|---|---|---|---|
| 1 | flux-2-klein-4b | NVIDIA | ✅ works, no garbled text | 1.9 s | rate limit only | up to 40/min (daily cap unknown) |
| | | Cloudflare | ✅ works, 1 garbled sign | 8.1 s | ~104 neurons | ~96 |
| | | Pollinations (key) | listed, not tested | – | credit | unknown |
| 2 | flux-1-schnell | Cloudflare | ✅ works, no text, square only | 2.3 s | ~326 neurons | ~30 |
| | | SiliconFlow | listed, not tested | – | – | unknown |
| | | Pollinations (key) | listed, not tested | – | credit | unknown |
| | | NVIDIA | ⛔ outage since 2 Oct | – | – | – |
| 3 | flux-2-klein-9b | Cloudflare | ✅ best 2D, 1 garbled sign | 2.5 s | ~1,364 neurons | ~7 (only under 70% CF use) |
| 4 | SDXL lightning | Cloudflare | ✅ busy scene, garbled signs | 3.4 s | beta, not shown | unknown |
| – | flux-3-image-klein | NVIDIA | endpoint exists, not tested | – | – | – |

Out: flux-2-dev (~5,625 neurons), lucid-origin, dreamshaper/SANA, SDXL base (64 s), NVIDIA qwen-image (download only), Gemini images (paid only: free keys get 0 images).
Cloudflare rows share one pool of ~10,000 neurons/day; they do not add up.
Open idea (owner to decide): put NVIDIA before Cloudflare for klein-4b (faster, saves CF neurons).
