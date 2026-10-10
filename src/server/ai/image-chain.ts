/**
 * Free image generation chain (registry pattern: one entry per model, it declares its own request).
 * Order = quality, best first. Quality ranking comes from a visual check of one picture per model.
 * The SVG fallback is NOT here (it needs the text chain): callers use it when this throws.
 *
 *  1. Gemini 3.1 flash-lite image  (PAID prepaid key) richest scenes, ~3s; used while under a soft daily budget
 *  2. NVIDIA flux.1-dev            (json, key)   clean children's-book scenes, ~5s in a manual test
 *  3. Pollinations flux.1.1-pro    (API key)     clean, no watermark; small free tier credit, fallback only
 *  4. Pollinations flux            (no key)      blurry + visible watermark: last resort
 *
 * The paid model spends prepaid credit, so it is gated by a SOFT daily count (GEMINI_PAID_IMAGE_DAILY, default 40,
 * 0 disables it). Past the budget the chain simply starts at the free models: nothing fails, nothing is blocked.
 *
 */
import { classifyProviderError } from './error-class';

export type ImageExt = 'png' | 'jpg' | 'webp';

export interface ImageResult {
  data: Buffer;
  ext: ImageExt;
  provider: string;
  /** true when the provider stamps its own watermark on the picture (Pollinations). */
  watermarked: boolean;
}

export interface ImageRequest {
  prompt: string;
  seed?: number;
  width?: number;
  height?: number;
  /** Model id to try first (keeps one look per document). Other models only run if it fails or is very slow. */
  preferModel?: string;
}

type Env = Record<string, string | undefined>;
type FetchLike = typeof fetch;

interface ImageModel {
  /** Only models flagged true may receive Arabic in the prompt. FLUX-family models draw garbled Arabic, so they never do. */
  arabicSafe?: boolean;
  id: string;
  group: 'nvidia' | 'gemini' | 'pollinations' | 'siliconflow';
  quality: number;
  enabled: (env: Env) => boolean;
  generate: (env: Env, req: Required<Omit<ImageRequest, 'preferModel'>>, fetchImpl: FetchLike, signal: AbortSignal) => Promise<Buffer>;
}

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
const NO_TEXT = 'no text, no letters, no words, no numbers, no captions';
export const hasArabic = (s: string): boolean => new RegExp(ARABIC_RE.source).test(s);

/**
 * RULE: FLUX (and every non-arabicSafe model) must never be asked to draw Arabic. Text belongs to the page, not the picture.
 * Strips Arabic from the prompt and forces "no text". Returns null when nothing usable is left (Arabic-only prompt).
 */
export function textFreePrompt(prompt: string): string | null {
  const cleaned = prompt.replace(ARABIC_RE, ' ').replace(/[«»"“”]/g, ' ').replace(/\s+/g, ' ').trim();
  if ((cleaned.match(/[A-Za-z]/g) || []).length < 8) return null;
  return /no text/i.test(cleaned) ? cleaned : `${cleaned}. ${NO_TEXT}`;
}

export const isImageBuffer = (b: Buffer): boolean =>
  b.length > 1000 &&
  ((b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) ||
    (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) ||
    (b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP'));

export const imageExt = (b: Buffer): ImageExt => (b[0] === 0x89 ? 'png' : b[0] === 0xff ? 'jpg' : 'webp');

const nvKey = (env: Env): string => (env['NVIDIA_API_KEY'] || '').trim().replace(/^["']|["']$/g, '');

/** NVIDIA hosted FLUX.1-dev (build.nvidia.com): JSON in, base64 image out. */
const nvidiaFluxDev = (quality: number): ImageModel => ({
  id: 'nvidia-flux-1-dev',
  group: 'nvidia',
  quality,
  enabled: (env) => !!nvKey(env),
  async generate(env, req, fetchImpl, signal) {
    const res = await fetchImpl('https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev', {
      method: 'POST',
      headers: { Authorization: `Bearer ${nvKey(env)}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: req.prompt, width: req.width, height: req.height, seed: req.seed, steps: 30, cfg_scale: 3.5, mode: 'base' }),
      signal,
    });
    if (!res.ok) throw new Error(`NVIDIA HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    const j = (await res.json()) as { artifacts?: { base64?: string }[]; image?: string };
    const b64 = j.artifacts?.[0]?.base64 || j.image;
    if (!b64) throw new Error('NVIDIA returned no image');
    return Buffer.from(b64, 'base64');
  },
});

// --- paid Gemini image model, soft daily budget (in memory, resets each UTC day and on restart) ---
const PAID_IMAGE_MODEL = 'gemini-3.1-flash-lite-image';
let paidDay = '';
let paidCount = 0;
const today = (): string => new Date().toISOString().slice(0, 10);
const paidBudget = (env: Env): number => {
  const n = parseInt(env['GEMINI_PAID_IMAGE_DAILY'] ?? '40', 10);
  return Number.isFinite(n) ? Math.max(0, n) : 40;
};
const paidKey = (env: Env): string => (env['GEMINI_PAID_API_KEY'] || '').trim().replace(/^["']|["']$/g, '');
export const paidImagesToday = (): number => (paidDay === today() ? paidCount : 0);
export const resetPaidImageCount = (): void => {
  paidDay = '';
  paidCount = 0;
};
function countPaidImage(): void {
  if (paidDay !== today()) {
    paidDay = today();
    paidCount = 0;
  }
  paidCount++;
}

const geminiPaidImage = (quality: number): ImageModel => ({
  id: 'gemini-paid-flash-lite-image',
  group: 'gemini',
  arabicSafe: true,
  quality,
  enabled: (env) => !!paidKey(env) && paidImagesToday() < paidBudget(env),
  async generate(env, req, fetchImpl, signal) {
    const res = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${PAID_IMAGE_MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': paidKey(env) },
      body: JSON.stringify({ contents: [{ parts: [{ text: req.prompt }] }], generationConfig: { responseModalities: ['IMAGE'] } }),
      signal,
    });
    if (!res.ok) throw new Error(`Gemini image HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    const j = (await res.json()) as { candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[] };
    const data = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data;
    if (!data) throw new Error('Gemini image returned no image');
    countPaidImage();
    return Buffer.from(data, 'base64');
  },
});

const pollKey = (env: Env): string => (env['POLLINATIONS_API_KEY'] || '').trim().replace(/^["']|["']$/g, '');

const sfKey = (env: Env): string => (env['SILICONFLOW_API_KEY'] || '').trim().replace(/^["']|["']$/g, '');

/** SiliconFlow hosted Qwen/Qwen-Image: free tier, text-free educational illustrations. */
const siliconflowQwenImage = (quality: number): ImageModel => ({
  id: 'siliconflow-qwen-image',
  group: 'siliconflow',
  quality,
  enabled: (env) => !!sfKey(env),
  async generate(env, req, fetchImpl, signal) {
    const res = await fetchImpl('https://api.siliconflow.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sfKey(env)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen-Image',
        prompt: req.prompt,
        image_size: '1024x1024',
        seed: req.seed,
      }),
      signal,
    });
    if (!res.ok) throw new Error(`SiliconFlow HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    const j = (await res.json()) as { images?: { url?: string }[] };
    const imgUrl = j.images?.[0]?.url;
    if (!imgUrl) throw new Error('SiliconFlow returned no image url');
    const imgRes = await fetchImpl(imgUrl, { signal });
    if (!imgRes.ok) throw new Error(`SiliconFlow image download HTTP ${imgRes.status}`);
    return Buffer.from(await imgRes.arrayBuffer());
  },
});

/** Pollinations newer API (needs a key): real FLUX.1.1-pro, no watermark. Same group as the anonymous one: they share the cooldown. */
const pollinationsKeyed = (quality: number): ImageModel => ({
  id: 'pollinations-flux-1.1-pro',
  group: 'pollinations',
  quality,
  enabled: (env) => !!pollKey(env),
  async generate(env, req, fetchImpl, signal) {
    const url = `https://gen.pollinations.ai/image/${encodeURIComponent(req.prompt.slice(0, 1000))}?model=${encodeURIComponent('black-forest-labs/flux.1.1-pro')}&width=${req.width}&height=${req.height}&seed=${req.seed}&nologo=true`;
    const res = await fetchImpl(url, { headers: { Authorization: `Bearer ${pollKey(env)}` }, signal });
    if (!res.ok) throw new Error(`Pollinations HTTP ${res.status} ${(await res.text()).slice(0, 160)}`);
    return Buffer.from(await res.arrayBuffer());
  },
});

export const IMAGE_MODELS: ImageModel[] = [
  geminiPaidImage(99),
  nvidiaFluxDev(97),
  siliconflowQwenImage(70),
  pollinationsKeyed(50),
  {
    id: 'pollinations-flux',
    group: 'pollinations',
    quality: 10,
    enabled: () => true,
    async generate(_env, req, fetchImpl, signal) {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(req.prompt.slice(0, 1000))}?width=${req.width}&height=${req.height}&nologo=true&safe=true&private=true&seed=${req.seed}&model=flux`;
      const res = await fetchImpl(url, { signal });
      if (!res.ok) throw new Error(`Pollinations HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    },
  },
];

// --- cooldowns (per model id, or per group when the whole provider is out) ---
const cooldowns = new Map<string, number>();
export const resetImageCooldowns = (): void => cooldowns.clear();
const cooling = (m: ImageModel, now: number): boolean =>
  (cooldowns.get(m.id) ?? 0) > now || (cooldowns.get(`group:${m.group}`) ?? 0) > now;

function applyCooldown(m: ImageModel, err: unknown, now: number): void {
  const c = classifyProviderError(err instanceof Error ? err.message : String(err));
  if (c.cooldownMs <= 0) {
    cooldowns.set(m.id, now + 15_000); // unknown failure: short pause so we do not hammer it
    return;
  }
  cooldowns.set(c.providerWide ? `group:${m.group}` : m.id, now + c.cooldownMs);
}

export interface ImageChainOptions {
  env?: Env;
  fetchImpl?: FetchLike;
  /** Start the next model if the current one has not answered after this long (no cutoff of the first). */
  hedgeMs?: number;
  now?: () => number;
}

/** Model order: IMAGE_CHAIN env ("gemini,nvidia,siliconflow,pollinations") picks and orders groups; default = by quality. */
function candidates(env: Env, now: number, ignoreCooldown: boolean): ImageModel[] {
  const wanted = (env['IMAGE_CHAIN'] || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s === 'nvidia' || s === 'gemini' || s === 'pollinations' || s === 'siliconflow');
  let list = IMAGE_MODELS.filter((m) => m.enabled(env));
  if (wanted.length) {
    list = list.filter((m) => wanted.includes(m.group));
    list.sort((a, b) => wanted.indexOf(a.group) - wanted.indexOf(b.group) || b.quality - a.quality);
  } else {
    list.sort((a, b) => b.quality - a.quality);
  }
  return ignoreCooldown ? list : list.filter((m) => !cooling(m, now));
}

export async function generateImage(req: ImageRequest, options: ImageChainOptions = {}): Promise<ImageResult> {
  const env = options.env ?? (process.env as Env);
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now;
  const baseHedgeMs = options.hedgeMs ?? Math.max(1000, parseInt(env['IMAGE_HEDGE_MS'] || '8000', 10));
  const full = {
    prompt: req.prompt,
    seed: req.seed ?? 0,
    width: req.width ?? 1024,
    height: req.height ?? 768,
  };

  let list = candidates(env, now(), false);
  if (list.length === 0) list = candidates(env, now(), true); // everything cooling: try anyway

  // Text-free rule: non-arabicSafe models get an English, text-free prompt; with no usable English left they are skipped.
  const safePrompt = textFreePrompt(full.prompt);
  if (safePrompt === null) list = list.filter((m) => m.arabicSafe);
  const requestFor = (m: ImageModel): Required<Omit<ImageRequest, 'preferModel'>> =>
    m.arabicSafe || safePrompt === null ? full : { ...full, prompt: safePrompt };

  // Pinned model: tried first, and hedging is relaxed so a merely slow answer is not raced by another look.
  let hedgeMs = baseHedgeMs;
  const pinned = req.preferModel ? list.find((m) => m.id === req.preferModel) : undefined;
  if (pinned) {
    list = [pinned, ...list.filter((m) => m !== pinned)];
    hedgeMs = Math.max(baseHedgeMs, 45_000);
  }

  if (list.length === 0) throw new Error("Aucun service d'image disponible.");

  return new Promise<ImageResult>((resolve, reject) => {
    const controllers: AbortController[] = [];
    let next = 0;
    let pending = 0;
    let done = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastErr: unknown;

    const launch = (): boolean => {
      if (done || next >= list.length) return false;
      const model = list[next++];
      const ctl = new AbortController();
      controllers.push(ctl);
      pending++;
      if (timer) clearTimeout(timer);
      timer = setTimeout(launch, hedgeMs);

      model
        .generate(env, requestFor(model), fetchImpl, ctl.signal)
        .then((buf) => {
          if (!isImageBuffer(buf)) throw new Error(`${model.id} returned no image`);
          if (done) return;
          done = true;
          if (timer) clearTimeout(timer);
          controllers.forEach((c) => c !== ctl && c.abort());
          resolve({ data: buf, ext: imageExt(buf), provider: model.id, watermarked: model.id === 'pollinations-flux' });
        })
        .catch((err) => {
          pending--;
          if (done) return;
          lastErr = err;
          applyCooldown(model, err, now());
          if (!launch() && pending === 0) {
            done = true;
            if (timer) clearTimeout(timer);
            reject(lastErr instanceof Error ? lastErr : new Error(String(lastErr)));
          }
        });
      return true;
    };

    launch();
  });
}
