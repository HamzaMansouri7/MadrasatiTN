/**
 * Free image generation chain, grouped BY MODEL with each model's providers nested (docs/AUDIT-IMAGE-PROVIDERS.md §6).
 * Every provider of a model is tried before the next model, so a picture keeps the same look. Sequential: the next
 * attempt starts only when the current one fails or passes 60 s. The SVG fallback is NOT here (it needs the text
 * chain): callers use it when this throws.
 *
 *  1. flux-2-klein-4b   NVIDIA (1.9-2.9 s, no neurons, ~30 in flight then 429) -> Cloudflare (~104 neurons, 8 s) -> Pollinations (key, 0.005 pollen)
 *  2. flux-1-schnell    Cloudflare (~326 neurons, square) -> Pollinations (key, 0.002 pollen)
 *  3. flux-2-klein-9b   Cloudflare (~1,364 neurons), only while today's Cloudflare usage is under 70%
 *  4. SDXL lightning    Cloudflare
 *
 * Cloudflare's 10,000 neurons/day are shared by the whole account (text models too), so they do not add up per model.
 * Out (measured 2026-10-17): keyless Pollinations (serves SANA), SiliconFlow (no free balance), NVIDIA flux.1-dev and
 * schnell (outage), flux-2-dev (~5,625 neurons), lucid-origin, dreamshaper, SDXL base.
 *
 * The paid Gemini image model (prepaid key) is outside the free chain: it only answers prompts with no usable English
 * (Arabic text in the picture), within a SOFT daily count (GEMINI_PAID_IMAGE_DAILY, default 40, 0 disables it).
 */
import { classifyProviderError } from './error-class';

export type ImageExt = 'png' | 'jpg' | 'webp';

export interface ImageResult {
  data: Buffer;
  ext: ImageExt;
  /** Attempt id that answered, e.g. 'cloudflare/flux-2-klein-4b'. */
  provider: string;
  /** Model family that answered, e.g. 'flux-2-klein-4b'. */
  model: string;
  /** true when the first model of the chain was skipped or failed: callers must not pin this look on a document. */
  fallback: boolean;
}

export interface ImageRequest {
  prompt: string;
  seed?: number;
  width?: number;
  height?: number;
  /** Model family to try first (keeps one look per document). Other models only run if all its providers fail. */
  preferModel?: string;
  /** Providers to leave out for this picture (e.g. 'gemini' when the caller wants the free models only). */
  excludeGroups?: string[];
}

type Env = Record<string, string | undefined>;
type ImageCall = Required<Pick<ImageRequest, 'prompt' | 'seed' | 'width' | 'height'>>;
type FetchLike = typeof fetch;
type Provider = 'cloudflare' | 'nvidia' | 'pollinations' | 'gemini';

interface ImageAttempt {
  /** Only attempts flagged true may receive Arabic in the prompt. FLUX-family models draw garbled Arabic, so they never do. */
  arabicSafe?: boolean;
  id: string;
  model: string;
  group: Provider;
  enabled: (env: Env, ctx: ChainContext) => boolean;
  generate: (env: Env, req: ImageCall, fetchImpl: FetchLike, signal: AbortSignal) => Promise<Buffer>;
}

interface ChainContext {
  /** Share of today's Cloudflare neurons already used (0-1), or null when it could not be read. */
  cfUsage: number | null;
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

const clean = (v: string | undefined): string => (v || '').trim().replace(/^["']|["']$/g, '');
const cfAccount = (env: Env): string => clean(env['CLOUDFLARE_ACCOUNT_ID']);
const cfToken = (env: Env): string => clean(env['CLOUDFLARE_API_TOKEN'] || env['CLOUDFLARE_TOKEN']);
const nvKey = (env: Env): string => clean(env['NVIDIA_API_KEY']);
const pollKey = (env: Env): string => clean(env['POLLINATIONS_API_KEY']);
const paidKey = (env: Env): string => clean(env['GEMINI_PAID_API_KEY']);
const hasCf = (env: Env): boolean => !!cfAccount(env) && !!cfToken(env);

// --- Cloudflare Workers AI ---

/** FLUX.2 models only accept multipart; schnell and SDXL take JSON. Answers are raw image bytes or { result: { image } }. */
const cloudflare = (model: string, cfModel: string, format: 'multipart' | 'json', extraGate?: (ctx: ChainContext) => boolean): ImageAttempt => ({
  id: `cloudflare/${model}`,
  model,
  group: 'cloudflare',
  enabled: (env, ctx) => hasCf(env) && (!extraGate || extraGate(ctx)),
  async generate(env, req, fetchImpl, signal) {
    let body: BodyInit;
    const headers: Record<string, string> = { Authorization: `Bearer ${cfToken(env)}` };
    if (format === 'multipart') {
      const fd = new FormData();
      fd.append('prompt', req.prompt);
      fd.append('width', String(req.width));
      fd.append('height', String(req.height));
      fd.append('seed', String(req.seed));
      body = fd;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(
        model === 'flux-1-schnell'
          ? { prompt: req.prompt, steps: 8, seed: req.seed }
          : { prompt: req.prompt, width: req.width, height: req.height, seed: req.seed },
      );
    }
    const res = await fetchImpl(`https://api.cloudflare.com/client/v4/accounts/${cfAccount(env)}/ai/run/${cfModel}`, {
      method: 'POST',
      headers,
      body,
      signal,
    });
    if (!res.ok) throw new Error(`Cloudflare HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    if ((res.headers.get('content-type') || '').startsWith('image/')) return Buffer.from(await res.arrayBuffer());
    const j = (await res.json()) as { result?: { image?: string }; image?: string };
    const b64 = j.result?.image || j.image;
    if (!b64) throw new Error('Cloudflare returned no image');
    return Buffer.from(b64, 'base64');
  },
});

const CF_DAILY_NEURONS = 10_000;
const CF_USAGE_TTL_MS = 2 * 60_000;
let cfUsageCache: { at: number; day: string; value: number | null } | null = null;
export const resetCloudflareUsage = (): void => {
  cfUsageCache = null;
};

/** Today's Cloudflare neurons (whole account) from the analytics API, cached 2 min. null = unknown. */
async function cloudflareUsage(env: Env, fetchImpl: FetchLike, now: number): Promise<number | null> {
  if (!hasCf(env)) return null;
  const day = new Date(now).toISOString().slice(0, 10);
  if (cfUsageCache && cfUsageCache.day === day && now - cfUsageCache.at < CF_USAGE_TTL_MS) return cfUsageCache.value;
  let value: number | null = null;
  try {
    const query = 'query($a:String!,$d:Date!){viewer{accounts(filter:{accountTag:$a}){aiInferenceAdaptiveGroups(limit:200,filter:{date_geq:$d}){sum{totalNeurons}}}}}';
    const res = await fetchImpl('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfToken(env)}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { a: cfAccount(env), d: day } }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const j = (await res.json()) as {
        data?: { viewer?: { accounts?: { aiInferenceAdaptiveGroups?: { sum?: { totalNeurons?: number } }[] }[] } };
      };
      const rows = j.data?.viewer?.accounts?.[0]?.aiInferenceAdaptiveGroups;
      if (Array.isArray(rows)) value = rows.reduce((s, r) => s + (r.sum?.totalNeurons ?? 0), 0) / CF_DAILY_NEURONS;
    }
  } catch {
    value = null;
  }
  cfUsageCache = { at: now, day, value };
  return value;
}

const expensiveMaxShare = (env: Env): number => {
  const n = parseInt(env['CF_EXPENSIVE_IMAGE_MAX_PCT'] ?? '70', 10);
  return (Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 70) / 100;
};

// --- NVIDIA build (hosted FLUX.2 klein 4B): JSON in, base64 out ---

const nvidia = (model: string, slug: string): ImageAttempt => ({
  id: `nvidia/${model}`,
  model,
  group: 'nvidia',
  enabled: (env) => !!nvKey(env),
  async generate(env, req, fetchImpl, signal) {
    const res = await fetchImpl(`https://ai.api.nvidia.com/v1/genai/${slug}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${nvKey(env)}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: req.prompt, width: req.width, height: req.height, seed: req.seed, steps: 4 }),
      signal,
    });
    if (!res.ok) throw new Error(`NVIDIA HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    const j = (await res.json()) as { artifacts?: { base64?: string }[]; image?: string };
    const b64 = j.artifacts?.[0]?.base64 || j.image;
    if (!b64) throw new Error('NVIDIA returned no image');
    return Buffer.from(b64, 'base64');
  },
});

// --- Pollinations with our key (the keyless route is out: it may serve SANA/dreamshaper) ---

const pollinations = (model: string, pollModel: string): ImageAttempt => ({
  id: `pollinations/${model}`,
  model,
  group: 'pollinations',
  enabled: (env) => !!pollKey(env),
  async generate(env, req, fetchImpl, signal) {
    const url = `https://gen.pollinations.ai/image/${encodeURIComponent(req.prompt.slice(0, 1000))}?model=${encodeURIComponent(pollModel)}&width=${req.width}&height=${req.height}&seed=${req.seed}&nologo=true`;
    const res = await fetchImpl(url, { headers: { Authorization: `Bearer ${pollKey(env)}` }, signal });
    if (!res.ok) throw new Error(`Pollinations HTTP ${res.status} ${(await res.text()).slice(0, 160)}`);
    return Buffer.from(await res.arrayBuffer());
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

const geminiPaidImage: ImageAttempt = {
  id: 'gemini/flash-lite-image',
  model: 'gemini-flash-lite-image',
  group: 'gemini',
  arabicSafe: true,
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
};

/** The free chain: models in order, each with its providers in order. */
export const IMAGE_CHAIN: { model: string; attempts: ImageAttempt[] }[] = [
  {
    model: 'flux-2-klein-4b',
    attempts: [
      nvidia('flux-2-klein-4b', 'black-forest-labs/flux.2-klein-4b'),
      cloudflare('flux-2-klein-4b', '@cf/black-forest-labs/flux-2-klein-4b', 'multipart'),
      pollinations('flux-2-klein-4b', 'black-forest-labs/flux.2-klein-4b'),
    ],
  },
  {
    model: 'flux-1-schnell',
    attempts: [
      cloudflare('flux-1-schnell', '@cf/black-forest-labs/flux-1-schnell', 'json'),
      pollinations('flux-1-schnell', 'black-forest-labs/flux.1-schnell'),
    ],
  },
  {
    model: 'flux-2-klein-9b',
    attempts: [cloudflare('flux-2-klein-9b', '@cf/black-forest-labs/flux-2-klein-9b', 'multipart', (ctx) => ctx.cfUsage !== null && ctx.cfUsage < 1)],
  },
  {
    model: 'sdxl-lightning',
    attempts: [cloudflare('sdxl-lightning', '@cf/bytedance/stable-diffusion-xl-lightning', 'json')],
  },
];

const FIRST_MODEL = IMAGE_CHAIN[0].model;

// --- cooldowns (per attempt id, or per provider when the whole provider is out) ---
const cooldowns = new Map<string, number>();
export const resetImageCooldowns = (): void => cooldowns.clear();
const cooling = (a: ImageAttempt, now: number): boolean =>
  (cooldowns.get(a.id) ?? 0) > now || (cooldowns.get(`group:${a.group}`) ?? 0) > now;

function applyCooldown(a: ImageAttempt, err: unknown, now: number): string {
  const c = classifyProviderError(err instanceof Error ? err.message : String(err));
  if (c.cooldownMs <= 0) {
    cooldowns.set(a.id, now + 15_000); // unknown failure: short pause so we do not hammer it
    return c.kind;
  }
  cooldowns.set(c.providerWide ? `group:${a.group}` : a.id, now + c.cooldownMs);
  return c.kind;
}

const ATTEMPT_TIMEOUT_MS = 60_000;

export interface ImageChainOptions {
  env?: Env;
  fetchImpl?: FetchLike;
  now?: () => number;
  /** Per-attempt cutoff; default 60 s. */
  timeoutMs?: number;
}

/**
 * Attempt order. IMAGE_PROVIDERS env ("nvidia,cloudflare,pollinations") picks and orders providers INSIDE each model;
 * the model order itself is fixed. The klein-9b gate compares usage to CF_EXPENSIVE_IMAGE_MAX_PCT (default 70).
 */
function attemptsFor(env: Env, ctx: ChainContext, preferModel: string | undefined): ImageAttempt[] {
  const wanted = (env['IMAGE_PROVIDERS'] || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is Provider => s === 'cloudflare' || s === 'nvidia' || s === 'pollinations');
  const gateCtx: ChainContext = { cfUsage: ctx.cfUsage === null ? null : ctx.cfUsage / expensiveMaxShare(env) };
  const models = [...IMAGE_CHAIN];
  const pinned = models.findIndex((m) => m.model === preferModel);
  if (pinned > 0) models.unshift(...models.splice(pinned, 1));
  return models.flatMap((m) => {
    let list = m.attempts.filter((a) => a.enabled(env, gateCtx));
    if (wanted.length) {
      list = list.filter((a) => wanted.includes(a.group as Provider));
      list.sort((a, b) => wanted.indexOf(a.group as Provider) - wanted.indexOf(b.group as Provider));
    }
    return list;
  });
}

export async function generateImage(req: ImageRequest, options: ImageChainOptions = {}): Promise<ImageResult> {
  const env = options.env ?? (process.env as Env);
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now;
  const timeoutMs = options.timeoutMs ?? ATTEMPT_TIMEOUT_MS;
  const full: ImageCall = {
    prompt: req.prompt,
    seed: req.seed ?? 0,
    width: req.width ?? 1024,
    height: req.height ?? 768,
  };
  const allowed = (a: ImageAttempt) => !req.excludeGroups?.includes(a.group);

  // Text-free rule: FLUX gets an English, text-free prompt. With no usable English left only the paid Gemini model may answer.
  const safePrompt = textFreePrompt(full.prompt);
  let list: ImageAttempt[];
  if (safePrompt === null) {
    list = [geminiPaidImage].filter((a) => a.enabled(env, { cfUsage: null }) && allowed(a));
  } else {
    const ctx: ChainContext = { cfUsage: await cloudflareUsage(env, fetchImpl, now()) };
    list = attemptsFor(env, ctx, req.preferModel).filter(allowed);
  }
  const ready = list.filter((a) => !cooling(a, now()));
  if (ready.length) list = ready; // everything cooling: try anyway

  if (list.length === 0) throw new Error("Aucun service d'image disponible.");
  const request = (a: ImageAttempt): ImageCall => (a.arabicSafe || safePrompt === null ? full : { ...full, prompt: safePrompt });

  let lastErr: unknown;
  for (const attempt of list) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    const started = now();
    try {
      const buf = await attempt.generate(env, request(attempt), fetchImpl, ctl.signal);
      if (!isImageBuffer(buf)) throw new Error(`${attempt.id} returned no image`);
      console.info(`[image] ${attempt.id} OK in ${now() - started} ms`);
      return {
        data: buf,
        ext: imageExt(buf),
        provider: attempt.id,
        model: attempt.model,
        fallback: attempt.model !== FIRST_MODEL && attempt.model !== req.preferModel,
      };
    } catch (err) {
      lastErr = ctl.signal.aborted ? new Error(`${attempt.id} timed out after ${timeoutMs} ms`) : err;
      const kind = applyCooldown(attempt, lastErr, now());
      const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
      console.warn(`[image] ${attempt.id} failed (${kind}) in ${now() - started} ms: ${msg}`.slice(0, 300));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
