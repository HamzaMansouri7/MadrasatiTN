import { describe, it, expect, beforeEach } from 'vitest';
import { generateImage, resetImageCooldowns, isImageBuffer, resetPaidImageCount, paidImagesToday, textFreePrompt, hasArabic } from './image-chain';

const png = (): Buffer => {
  const b = Buffer.alloc(2000, 1);
  Buffer.from([0x89, 0x50, 0x4e, 0x47]).copy(b);
  return b;
};
const okRes = () => new Response(new Uint8Array(png()), { status: 200, headers: { 'content-type': 'image/png' } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const geminiRes = () =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { data: png().toString('base64') } }] } }] }), { status: 200 });
const nvidiaRes = () => new Response(JSON.stringify({ artifacts: [{ base64: png().toString('base64') }] }), { status: 200 });

const KEYS = { NVIDIA_API_KEY: 'nv-test', POLLINATIONS_API_KEY: 'pk-test' };
const ALL = { ...KEYS, GEMINI_PAID_API_KEY: 'paid-test' };

/** Fake fetch: handler receives the URL (and init) and returns a Response (or throws). */
const fakeFetch = (handler: (url: string, init?: RequestInit) => Response | Promise<Response>): typeof fetch =>
  (async (input: RequestInfo | URL, init?: RequestInit) => handler(String(input), init)) as typeof fetch;

/** Route by host so each provider answers in its own format. */
const byHost = (over: Partial<Record<'gemini' | 'nvidia' | 'pollinations', () => Response | Promise<Response>>> = {}) =>
  (u: string): Response | Promise<Response> => {
    if (u.includes('generativelanguage')) return (over.gemini ?? geminiRes)();
    if (u.includes('nvidia.com')) return (over.nvidia ?? nvidiaRes)();
    return (over.pollinations ?? okRes)();
  };

beforeEach(() => {
  resetImageCooldowns();
  resetPaidImageCount();
});

describe('isImageBuffer', () => {
  it('accepts png and rejects small or unknown data', () => {
    expect(isImageBuffer(png())).toBe(true);
    expect(isImageBuffer(Buffer.alloc(5000))).toBe(false);
    expect(isImageBuffer(Buffer.from('tiny'))).toBe(false);
  });
});

describe('generateImage', () => {
  it('uses the paid Gemini model first while under budget and counts it', async () => {
    const urls: string[] = [];
    const r = await generateImage({ prompt: 'a cartoon sun over a river' }, { env: ALL, fetchImpl: fakeFetch((u) => (urls.push(u), byHost()(u))) });
    expect(r.provider).toBe('gemini-paid-flash-lite-image');
    expect(urls[0]).toContain('gemini-3.1-flash-lite-image');
    expect(paidImagesToday()).toBe(1);
    expect(r.watermarked).toBe(false);
  });

  it('after the paid budget is spent, falls to NVIDIA FLUX.1-dev (no failure)', async () => {
    const env = { ...ALL, GEMINI_PAID_IMAGE_DAILY: '1' };
    const f = fakeFetch(byHost());
    expect((await generateImage({ prompt: 'a cartoon sun over a river' }, { env, fetchImpl: f })).provider).toBe('gemini-paid-flash-lite-image');
    const second = await generateImage({ prompt: 'a cartoon sun over a river' }, { env, fetchImpl: f });
    expect(second.provider).toBe('nvidia-flux-1-dev');
  });

  it('never uses the paid model without its key or when the budget is 0', async () => {
    const urls: string[] = [];
    const f = fakeFetch((u) => (urls.push(u), byHost()(u)));
    await generateImage({ prompt: 'a cartoon sun over a river' }, { env: { ...ALL, GEMINI_PAID_IMAGE_DAILY: '0' }, fetchImpl: f });
    await generateImage({ prompt: 'a cartoon sun over a river' }, { env: KEYS, fetchImpl: f });
    expect(urls.some((u) => u.includes('generativelanguage'))).toBe(false);
  });

  it('reads the NVIDIA base64 artifact', async () => {
    const urls: string[] = [];
    const r = await generateImage({ prompt: 'a cartoon sun over a river' }, { env: KEYS, fetchImpl: fakeFetch((u) => (urls.push(u), byHost()(u))) });
    expect(r.provider).toBe('nvidia-flux-1-dev');
    expect(urls[0]).toContain('flux.1-dev');
  });

  it('falls from NVIDIA to keyed Pollinations (no watermark) when NVIDIA fails', async () => {
    const urls: string[] = [];
    const r = await generateImage({ prompt: 'a cartoon sun over a river' }, {
      env: KEYS,
      fetchImpl: fakeFetch((u) => (urls.push(u), byHost({ nvidia: () => new Response('boom', { status: 500 }) })(u))),
    });
    expect(r.provider).toBe('pollinations-flux-1.1-pro');
    expect(r.watermarked).toBe(false);
    expect(urls.at(-1)).toContain('gen.pollinations.ai');
  });

  it('without any key, the anonymous Pollinations model answers and is flagged watermarked', async () => {
    const r = await generateImage({ prompt: 'a cartoon sun over a river' }, { env: {}, fetchImpl: fakeFetch(() => okRes()) });
    expect(r.provider).toBe('pollinations-flux');
    expect(r.watermarked).toBe(true);
  });

  it('hedges: starts the next model after hedgeMs and the first valid answer wins', async () => {
    const r = await generateImage({ prompt: 'a cartoon sun over a river' }, {
      env: KEYS,
      hedgeMs: 30,
      fetchImpl: fakeFetch(async (u) => {
        if (u.includes('nvidia.com')) {
          await sleep(300); // slow, never cut off by us
          return nvidiaRes();
        }
        return okRes();
      }),
    });
    expect(r.provider).toBe('pollinations-flux-1.1-pro');
  });

  it('rejects when every model fails', async () => {
    await expect(
      generateImage({ prompt: 'a cartoon sun over a river' }, { env: ALL, fetchImpl: fakeFetch(() => new Response('no', { status: 500 })) }),
    ).rejects.toThrow();
  });

  it('IMAGE_CHAIN env can restrict the chain to one group', async () => {
    const r = await generateImage({ prompt: 'a cartoon sun over a river' }, { env: { ...ALL, IMAGE_CHAIN: 'pollinations' }, fetchImpl: fakeFetch(byHost()) });
    expect(r.provider).toBe('pollinations-flux-1.1-pro');
  });

  it('Arabic rule: strips Arabic from the prompt sent to FLUX and forces no-text', async () => {
    const bodies: string[] = [];
    const f = fakeFetch(async (u, init) => {
      bodies.push(`${u} ${String(init?.body)}`);
      return byHost()(u);
    });
    await generateImage({ prompt: 'A friendly sun over a river «رحلة قطرة الماء» for children' }, { env: KEYS, fetchImpl: f });
    expect(bodies[0]).toContain('friendly sun');
    expect(hasArabic(bodies[0])).toBe(false);
    expect(bodies[0]).toMatch(/no text/);
  });

  it('Arabic rule: an Arabic-only prompt never reaches a FLUX model', async () => {
    const urls: string[] = [];
    await expect(
      generateImage({ prompt: 'رحلة قطرة الماء' }, { env: KEYS, fetchImpl: fakeFetch((u) => (urls.push(u), byHost()(u))) }),
    ).rejects.toThrow();
    expect(urls).toHaveLength(0);
  });

  it('Arabic rule: the paid Gemini model may receive Arabic', async () => {
    const r = await generateImage({ prompt: 'رحلة قطرة الماء' }, { env: ALL, fetchImpl: fakeFetch(byHost()) });
    expect(r.provider).toBe('gemini-paid-flash-lite-image');
  });

  it('textFreePrompt keeps English, drops Arabic, returns null when nothing is left', () => {
    expect(textFreePrompt('sun مرحبا')).toBeNull();
    expect(textFreePrompt('a cartoon sun and a river مرحبا')).toMatch(/^a cartoon sun and a river\. no text/);
    expect(textFreePrompt('مرحبا بالعالم')).toBeNull();
  });
});
