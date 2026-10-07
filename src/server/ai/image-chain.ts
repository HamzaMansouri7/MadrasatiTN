/**
 * Free image generation chain (registry pattern: one entry per model, it declares its own request).
 * Order = quality, best first. Quality ranking comes from a visual check of one picture per model.
 * The SVG fallback is NOT here (it needs the text chain): callers use it when this throws.
 *
 *  1. Cloudflare flux-2-klein-9b   (multipart)   best detail
 *  2. Cloudflare flux-1-schnell    (json)        clean flat children's-book style
 *  3. Cloudflare flux-2-klein-4b   (multipart)
 *  4. Cloudflare lucid-origin      (json)        soft, muddy details
 *  5. Pollinations flux            (no key)      blurry + visible watermark: last resort
 *
 * Cloudflare's free allowance is 10,000 neurons/day shared by all its models: when it runs out, the whole
 * `cloudflare` group is paused (see error-class.ts) instead of failing every request in turn.
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
}

type Env = Record<string, string | undefined>;
type FetchLike = typeof fetch;

interface ImageModel {
  id: string;
  group: 'cloudflare' | 'pollinations';
  quality: number;
  enabled: (env: Env) => boolean;
  generate: (env: Env, req: Required<ImageRequest>, fetchImpl: FetchLike, signal: AbortSignal) => Promise<Buffer>;
}

export const isImageBuffer = (b: Buffer): boolean =>
  b.length > 1000 &&
  ((b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) ||
    (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) ||
    (b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP'));

export const imageExt = (b: Buffer): ImageExt => (b[0] === 0x89 ? 'png' : b[0] === 0xff ? 'jpg' : 'webp');

const cfEnabled = (env: Env): boolean =>
  /^[a-f0-9]{32}$/i.test((env['CLOUDFLARE_ACCOUNT_ID'] || '').trim()) && !!(env['CLOUDFLARE_API_TOKEN'] || '').trim();

/** Cloudflare answers either with raw image bytes or with JSON { result: { image: base64 } }. */
async function readCfImage(res: Response): Promise<Buffer> {
  if (!res.ok) throw new Error(`Cloudflare AI HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  if ((res.headers.get('content-type') || '').startsWith('image/')) return Buffer.from(await res.arrayBuffer());
  const data = (await res.json()) as { result?: { image?: string } };
  if (!data.result?.image) throw new Error('Cloudflare AI returned no image');
  return Buffer.from(data.result.image, 'base64');
}

const cfUrl = (env: Env, model: string): string =>
  `https://api.cloudflare.com/client/v4/accounts/${(env['CLOUDFLARE_ACCOUNT_ID'] || '').trim()}/ai/run/${model}`;
const cfAuth = (env: Env): Record<string, string> => ({
  Authorization: `Bearer ${(env['CLOUDFLARE_API_TOKEN'] || '').trim().replace(/^["']|["']$/g, '')}`,
});

const cfJson = (id: string, model: string, quality: number): ImageModel => ({
  id,
  group: 'cloudflare',
  quality,
  enabled: cfEnabled,
  async generate(env, req, fetchImpl, signal) {
    const res = await fetchImpl(cfUrl(env, model), {
      method: 'POST',
      headers: { ...cfAuth(env), 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: req.prompt, steps: 4 }),
      signal,
    });
    return readCfImage(res);
  },
});

const cfMultipart = (id: string, model: string, quality: number): ImageModel => ({
  id,
  group: 'cloudflare',
  quality,
  enabled: cfEnabled,
  async generate(env, req, fetchImpl, signal) {
    const form = new FormData();
    form.append('prompt', req.prompt);
    form.append('width', String(req.width));
    form.append('height', String(req.height));
    const res = await fetchImpl(cfUrl(env, model), { method: 'POST', headers: cfAuth(env), body: form, signal });
    return readCfImage(res);
  },
});

export const IMAGE_MODELS: ImageModel[] = [
  cfMultipart('cf-flux-2-klein-9b', '@cf/black-forest-labs/flux-2-klein-9b', 95),
  cfJson('cf-flux-1-schnell', '@cf/black-forest-labs/flux-1-schnell', 90),
  cfMultipart('cf-flux-2-klein-4b', '@cf/black-forest-labs/flux-2-klein-4b', 85),
  cfJson('cf-lucid-origin', '@cf/leonardo/lucid-origin', 70),
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

/** Model order: IMAGE_CHAIN env ("cloudflare,pollinations") picks and orders groups; default = by quality. */
function candidates(env: Env, now: number, ignoreCooldown: boolean): ImageModel[] {
  const wanted = (env['IMAGE_CHAIN'] || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s === 'cloudflare' || s === 'pollinations');
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
  const hedgeMs = options.hedgeMs ?? Math.max(1000, parseInt(env['IMAGE_HEDGE_MS'] || '8000', 10));
  const full: Required<ImageRequest> = {
    prompt: req.prompt,
    seed: req.seed ?? 0,
    width: req.width ?? 1024,
    height: req.height ?? 768,
  };

  let list = candidates(env, now(), false);
  if (list.length === 0) list = candidates(env, now(), true); // everything cooling: try anyway
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
        .generate(env, full, fetchImpl, ctl.signal)
        .then((buf) => {
          if (!isImageBuffer(buf)) throw new Error(`${model.id} returned no image`);
          if (done) return;
          done = true;
          if (timer) clearTimeout(timer);
          controllers.forEach((c) => c !== ctl && c.abort());
          resolve({ data: buf, ext: imageExt(buf), provider: model.id, watermarked: model.group === 'pollinations' });
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
