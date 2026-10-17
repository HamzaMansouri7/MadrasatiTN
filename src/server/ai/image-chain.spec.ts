import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateImage,
  nvidiaKeys,
  resetImageCooldowns,
  resetCloudflareUsage,
  isImageBuffer,
  resetPaidImageCount,
  paidImagesToday,
  textFreePrompt,
  hasArabic,
} from './image-chain';

const png = (): Buffer => {
  const b = Buffer.alloc(2000, 1);
  Buffer.from([0x89, 0x50, 0x4e, 0x47]).copy(b);
  return b;
};
const okRes = () => new Response(new Uint8Array(png()), { status: 200, headers: { 'content-type': 'image/png' } });
const fail = (status = 500) => () => new Response('boom', { status });
const geminiRes = () =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { data: png().toString('base64') } }] } }] }), { status: 200 });
const nvidiaRes = () => new Response(JSON.stringify({ artifacts: [{ base64: png().toString('base64') }] }), { status: 200 });
const cfJsonRes = () => new Response(JSON.stringify({ result: { image: png().toString('base64') } }), { status: 200, headers: { 'content-type': 'application/json' } });
const usageRes = (neurons: number) => () =>
  new Response(JSON.stringify({ data: { viewer: { accounts: [{ aiInferenceAdaptiveGroups: [{ sum: { totalNeurons: neurons } }] }] } } }), { status: 200 });

const CF = { CLOUDFLARE_ACCOUNT_ID: 'acct', CLOUDFLARE_API_TOKEN: 'cf-test' };
const KEYS = { ...CF, NVIDIA_API_KEY: 'nv-test', POLLINATIONS_API_KEY: 'pk-test' };
const ALL = { ...KEYS, GEMINI_PAID_API_KEY: 'paid-test' };
const PROMPT = 'a cartoon sun over a river';

type Handler = (u: string) => Response | Promise<Response>;

/** Fake fetch: handler receives the URL (and init) and returns a Response (or throws). */
const fakeFetch = (handler: (url: string, init?: RequestInit) => Response | Promise<Response>): typeof fetch =>
  (async (input: RequestInfo | URL, init?: RequestInit) => handler(String(input), init)) as typeof fetch;

/** Route by provider so each answers in its own format. Cloudflare keys are the model slug's last part. */
const byHost =
  (over: Partial<Record<'gemini' | 'nvidia' | 'pollinations' | 'usage' | 'flux-2-klein-4b' | 'flux-1-schnell' | 'flux-2-klein-9b' | 'stable-diffusion-xl-lightning', Handler>> = {}) =>
  (u: string): Response | Promise<Response> => {
    if (u.includes('/graphql')) return (over.usage ?? usageRes(1000))(u);
    if (u.includes('api.cloudflare.com')) {
      const slug = u.split('/').pop() as keyof typeof over;
      return (over[slug] ?? (slug === 'flux-1-schnell' ? cfJsonRes : okRes))(u);
    }
    if (u.includes('generativelanguage')) return (over.gemini ?? geminiRes)(u);
    if (u.includes('nvidia.com')) return (over.nvidia ?? nvidiaRes)(u);
    return (over.pollinations ?? okRes)(u);
  };

/** Records every image call (usage reads left out) and answers through byHost. */
const recorder = (over: Parameters<typeof byHost>[0] = {}) => {
  const urls: string[] = [];
  const route = byHost(over);
  const fetchImpl = fakeFetch((u) => {
    if (!u.includes('/graphql')) urls.push(u);
    return route(u);
  });
  return { urls, fetchImpl };
};

beforeEach(() => {
  resetImageCooldowns();
  resetPaidImageCount();
  resetCloudflareUsage();
});

describe('isImageBuffer', () => {
  it('accepts png and rejects small or unknown data', () => {
    expect(isImageBuffer(png())).toBe(true);
    expect(isImageBuffer(Buffer.alloc(5000))).toBe(false);
    expect(isImageBuffer(Buffer.from('tiny'))).toBe(false);
  });
});

describe('generateImage: by-model chain', () => {
  it('starts with klein-4b on NVIDIA and is not a fallback', async () => {
    const { urls, fetchImpl } = recorder();
    const r = await generateImage({ prompt: PROMPT }, { env: ALL, fetchImpl });
    expect(r.provider).toBe('nvidia/flux-2-klein-4b');
    expect(r.model).toBe('flux-2-klein-4b');
    expect(r.fallback).toBe(false);
    expect(urls).toEqual(['https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b']);
  });

  it('tries every klein-4b provider before the next model: NVIDIA -> Cloudflare (multipart) -> Pollinations', async () => {
    let body: unknown;
    const a = recorder({ nvidia: fail() });
    const f = fakeFetch((u, init) => {
      if (u.includes('api.cloudflare.com') && !u.includes('/graphql')) body = init?.body;
      return a.fetchImpl(u, init);
    });
    expect((await generateImage({ prompt: PROMPT }, { env: KEYS, fetchImpl: f })).provider).toBe('cloudflare/flux-2-klein-4b');
    expect(a.urls[1]).toBe('https://api.cloudflare.com/client/v4/accounts/acct/ai/run/@cf/black-forest-labs/flux-2-klein-4b');
    expect(body).toBeInstanceOf(FormData);

    resetImageCooldowns();
    const b = recorder({ 'flux-2-klein-4b': fail(), nvidia: fail() });
    const r = await generateImage({ prompt: PROMPT }, { env: KEYS, fetchImpl: b.fetchImpl });
    expect(r.provider).toBe('pollinations/flux-2-klein-4b');
    expect(b.urls[2]).toContain('model=black-forest-labs%2Fflux.2-klein-4b');
    expect(r.fallback).toBe(false);
  });

  it('when klein-4b is out everywhere, moves to schnell (Cloudflare JSON) and flags a fallback', async () => {
    const { urls, fetchImpl } = recorder({ 'flux-2-klein-4b': fail(), nvidia: fail(), pollinations: fail() });
    const r = await generateImage({ prompt: PROMPT }, { env: KEYS, fetchImpl });
    expect(r.provider).toBe('cloudflare/flux-1-schnell');
    expect(r.fallback).toBe(true);
    expect(urls).toHaveLength(4);
  });

  it('klein-9b runs only while Cloudflare usage is under 70%', async () => {
    const down = { 'flux-2-klein-4b': fail(), 'flux-1-schnell': fail(), nvidia: fail(), pollinations: fail() };
    const low = recorder({ ...down, usage: usageRes(6900) });
    expect((await generateImage({ prompt: PROMPT }, { env: KEYS, fetchImpl: low.fetchImpl })).provider).toBe('cloudflare/flux-2-klein-9b');

    resetImageCooldowns();
    resetCloudflareUsage();
    const high = recorder({ ...down, usage: usageRes(7100) });
    const r = await generateImage({ prompt: PROMPT }, { env: KEYS, fetchImpl: high.fetchImpl });
    expect(r.provider).toBe('cloudflare/sdxl-lightning');
    expect(high.urls.some((u) => u.includes('klein-9b'))).toBe(false);
  });

  it('klein-9b is skipped when usage cannot be read', async () => {
    const { urls, fetchImpl } = recorder({ 'flux-2-klein-4b': fail(), 'flux-1-schnell': fail(), nvidia: fail(), pollinations: fail(), usage: fail() });
    expect((await generateImage({ prompt: PROMPT }, { env: KEYS, fetchImpl })).provider).toBe('cloudflare/sdxl-lightning');
    expect(urls.some((u) => u.includes('klein-9b'))).toBe(false);
  });

  it('a Cloudflare daily-quota error cools down every Cloudflare model', async () => {
    const quota = () => new Response('you have used up your daily free allocation of 10,000 neurons', { status: 429 });
    const first = recorder({ nvidia: fail(), 'flux-2-klein-4b': quota });
    await generateImage({ prompt: PROMPT }, { env: KEYS, fetchImpl: first.fetchImpl });
    const second = recorder({ nvidia: fail() });
    const r = await generateImage({ prompt: PROMPT }, { env: KEYS, fetchImpl: second.fetchImpl });
    expect(r.provider).toBe('pollinations/flux-2-klein-4b');
    expect(second.urls.some((u) => u.includes('api.cloudflare.com'))).toBe(false);
  });

  it('a hanging provider is cut after the timeout and the next one answers', async () => {
    const hang: Handler = () => new Promise<Response>(() => undefined);
    const f = fakeFetch((u, init) => {
      if (u.includes('/graphql')) return usageRes(0)();
      if (u.includes('nvidia.com'))
        return new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
      return byHost({ pollinations: hang })(u);
    });
    const r = await generateImage({ prompt: PROMPT }, { env: KEYS, fetchImpl: f, timeoutMs: 20 });
    expect(r.provider).toBe('cloudflare/flux-2-klein-4b');
  });

  it('every NVIDIA key is its own attempt: key 2 answers when key 1 is rate-limited', async () => {
    const auths: string[] = [];
    const f = fakeFetch((u, init) => {
      if (u.includes('nvidia.com')) {
        const auth = (init?.headers as Record<string, string>)['Authorization'];
        auths.push(auth);
        return auth === 'Bearer nv-test' ? fail(429)() : nvidiaRes();
      }
      return byHost()(u);
    });
    const r = await generateImage({ prompt: PROMPT }, { env: { ...KEYS, NVIDIA_API_KEY_2: 'nv-two' }, fetchImpl: f });
    expect(r.provider).toBe('nvidia/flux-2-klein-4b#2');
    expect(auths).toEqual(['Bearer nv-test', 'Bearer nv-two']);
  });

  it('a hanging NVIDIA key is cut and skipped on the next picture', async () => {
    const hits: string[] = [];
    const f = fakeFetch((u, init) => {
      if (u.includes('/graphql')) return usageRes(0)();
      hits.push(u);
      if (u.includes('nvidia.com'))
        return new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
      return byHost()(u);
    });
    expect((await generateImage({ prompt: PROMPT }, { env: KEYS, fetchImpl: f, timeoutMs: 20 })).provider).toBe('cloudflare/flux-2-klein-4b');
    hits.length = 0;
    expect((await generateImage({ prompt: PROMPT }, { env: KEYS, fetchImpl: f, timeoutMs: 20 })).provider).toBe('cloudflare/flux-2-klein-4b');
    expect(hits.some((u) => u.includes('nvidia.com'))).toBe(false);
  });

  it('IMAGE_PROVIDERS reorders providers inside a model (Cloudflare first)', async () => {
    const { urls, fetchImpl } = recorder();
    const r = await generateImage({ prompt: PROMPT }, { env: { ...KEYS, IMAGE_PROVIDERS: 'cloudflare,nvidia,pollinations' }, fetchImpl });
    expect(r.provider).toBe('cloudflare/flux-2-klein-4b');
    expect(urls).toHaveLength(1);
  });

  it('preferModel: the pinned model goes first and is not flagged a fallback', async () => {
    const r = await generateImage({ prompt: PROMPT, preferModel: 'flux-1-schnell' }, { env: KEYS, fetchImpl: recorder().fetchImpl });
    expect(r.provider).toBe('cloudflare/flux-1-schnell');
    expect(r.fallback).toBe(false);
  });

  it('only configured providers run: with just a Pollinations key, Pollinations klein-4b answers', async () => {
    const r = await generateImage({ prompt: PROMPT }, { env: { POLLINATIONS_API_KEY: 'pk' }, fetchImpl: recorder().fetchImpl });
    expect(r.provider).toBe('pollinations/flux-2-klein-4b');
  });

  it('rejects with a clear error when every provider fails (never a random picture)', async () => {
    await expect(generateImage({ prompt: PROMPT }, { env: ALL, fetchImpl: fakeFetch((u) => (u.includes('/graphql') ? usageRes(0)() : fail()())) })).rejects.toThrow();
    await expect(generateImage({ prompt: PROMPT }, { env: {}, fetchImpl: fakeFetch(okRes) })).rejects.toThrow("Aucun service d'image disponible.");
  });

  it('the paid Gemini model never runs for an English prompt', async () => {
    const { urls, fetchImpl } = recorder({ 'flux-2-klein-4b': fail(), nvidia: fail(), pollinations: fail() });
    await generateImage({ prompt: PROMPT }, { env: ALL, fetchImpl });
    expect(urls.some((u) => u.includes('generativelanguage'))).toBe(false);
  });
});

describe('generateImage: Arabic rule', () => {
  it('strips Arabic from the prompt sent to FLUX and forces no-text', async () => {
    const bodies: string[] = [];
    const f = fakeFetch(async (u, init) => {
      if (!u.includes('/graphql')) bodies.push(`${u} ${init?.body instanceof FormData ? String(init.body.get('prompt')) : String(init?.body)}`);
      return byHost()(u);
    });
    await generateImage({ prompt: 'A friendly sun over a river «رحلة قطرة الماء» for children' }, { env: KEYS, fetchImpl: f });
    expect(bodies[0]).toContain('friendly sun');
    expect(hasArabic(bodies[0])).toBe(false);
    expect(bodies[0]).toMatch(/no text, no letters/);
  });

  it('an Arabic-only prompt never reaches a FLUX model', async () => {
    const { urls, fetchImpl } = recorder();
    await expect(generateImage({ prompt: 'رحلة قطرة الماء' }, { env: KEYS, fetchImpl })).rejects.toThrow();
    expect(urls).toHaveLength(0);
  });

  it('an Arabic-only prompt goes to the paid Gemini model, which counts against its budget', async () => {
    const r = await generateImage({ prompt: 'رحلة قطرة الماء' }, { env: ALL, fetchImpl: recorder().fetchImpl });
    expect(r.provider).toBe('gemini/flash-lite-image');
    expect(paidImagesToday()).toBe(1);
  });

  it('the paid model is skipped when excluded, without its key, or with a 0 budget', async () => {
    const f = recorder().fetchImpl;
    await expect(generateImage({ prompt: 'رحلة قطرة الماء', excludeGroups: ['gemini'] }, { env: ALL, fetchImpl: f })).rejects.toThrow();
    await expect(generateImage({ prompt: 'رحلة قطرة الماء' }, { env: { ...ALL, GEMINI_PAID_IMAGE_DAILY: '0' }, fetchImpl: f })).rejects.toThrow();
    expect(paidImagesToday()).toBe(0);
  });

  it('textFreePrompt keeps English, drops Arabic, returns null when nothing is left', () => {
    expect(textFreePrompt('sun مرحبا')).toBeNull();
    expect(textFreePrompt('a cartoon sun and a river مرحبا')).toMatch(/^a cartoon sun and a river\. no text/);
    expect(textFreePrompt('مرحبا بالعالم')).toBeNull();
  });
});

describe('nvidiaKeys', () => {
  it('reads every NVIDIA_API_KEY* var in name order, comma lists ok, deduped', () => {
    expect(nvidiaKeys({ NVIDIA_API_KEY_2: 'b', NVIDIA_API_KEY: 'a, c', NVIDIA_API_KEY_3: '"a"', OTHER: 'x' })).toEqual(['a', 'c', 'b']);
  });
});
