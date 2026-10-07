import { describe, it, expect, beforeEach } from 'vitest';
import { generateImage, resetImageCooldowns, isImageBuffer, resetPaidImageCount, paidImagesToday } from './image-chain';

const png = (): Buffer => {
  const b = Buffer.alloc(2000, 1);
  Buffer.from([0x89, 0x50, 0x4e, 0x47]).copy(b);
  return b;
};
const CF_ENV = { CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32), CLOUDFLARE_API_TOKEN: 'tok' };
const okRes = () => new Response(new Uint8Array(png()), { status: 200, headers: { 'content-type': 'image/png' } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fake fetch: handler receives the URL and returns a Response (or throws). */
const fakeFetch = (handler: (url: string) => Response | Promise<Response>): typeof fetch =>
  (async (input: RequestInfo | URL) => handler(String(input))) as typeof fetch;

beforeEach(() => resetImageCooldowns());

describe('isImageBuffer', () => {
  it('accepts png and rejects small or unknown data', () => {
    expect(isImageBuffer(png())).toBe(true);
    expect(isImageBuffer(Buffer.alloc(5000))).toBe(false);
    expect(isImageBuffer(Buffer.from('tiny'))).toBe(false);
  });
});

describe('generateImage', () => {
  it('uses the best Cloudflare model first when there is no NVIDIA key', async () => {
    const urls: string[] = [];
    const r = await generateImage({ prompt: 'x' }, { env: CF_ENV, fetchImpl: fakeFetch((u) => (urls.push(u), okRes())) });
    expect(r.provider).toBe('cf-flux-1-schnell');
    expect(urls[0]).toContain('flux-1-schnell');
    expect(r.watermarked).toBe(false);
  });

  it('uses NVIDIA flux.1-dev first when its key is set, and reads the base64 artifact', async () => {
    const b64 = png().toString('base64');
    const urls: string[] = [];
    const r = await generateImage({ prompt: 'x' }, {
      env: { ...CF_ENV, NVIDIA_API_KEY: 'nv-test' },
      fetchImpl: fakeFetch((u) => (urls.push(u), u.includes('nvidia.com') ? new Response(JSON.stringify({ artifacts: [{ base64: b64 }] }), { status: 200 }) : okRes())),
    });
    expect(r.provider).toBe('nvidia-flux-1-dev');
    expect(urls[0]).toContain('flux.1-dev');
  });

  it('falls from NVIDIA to Cloudflare schnell when NVIDIA fails', async () => {
    const r = await generateImage({ prompt: 'x' }, {
      env: { ...CF_ENV, NVIDIA_API_KEY: 'nv-test' },
      fetchImpl: fakeFetch((u) => (u.includes('nvidia.com') ? new Response('boom', { status: 500 }) : okRes())),
    });
    expect(r.provider).toBe('cf-flux-1-schnell');
  });

  it('skips Cloudflare without keys and falls to Pollinations (flagged watermarked)', async () => {
    const r = await generateImage({ prompt: 'x' }, { env: {}, fetchImpl: fakeFetch(() => okRes()) });
    expect(r.provider).toBe('pollinations-flux');
    expect(r.watermarked).toBe(true);
  });

  it('falls back to the next model when one fails', async () => {
    const r = await generateImage({ prompt: 'x' }, {
      env: CF_ENV,
      fetchImpl: fakeFetch((u) => (u.includes('flux-1-schnell') ? new Response('boom', { status: 500 }) : okRes())),
    });
    expect(r.provider).toBe('cf-lucid-origin');
  });

  it('pauses the whole Cloudflare group on the daily allowance error', async () => {
    const calls: string[] = [];
    const quota = new Response('{"errors":[{"message":"you have used up your daily free allocation of 10,000 neurons"}]}', { status: 429 });
    const f = fakeFetch((u) => {
      calls.push(u);
      return u.includes('cloudflare.com') ? quota.clone() : okRes();
    });
    const first = await generateImage({ prompt: 'x' }, { env: CF_ENV, fetchImpl: f });
    expect(first.provider).toBe('pollinations-flux');
    calls.length = 0;
    const second = await generateImage({ prompt: 'x' }, { env: CF_ENV, fetchImpl: f });
    expect(second.provider).toBe('pollinations-flux');
    expect(calls.every((u) => u.includes('pollinations'))).toBe(true); // no Cloudflare call at all
  });

  it('hedges: starts the next model after hedgeMs and the first valid answer wins', async () => {
    const r = await generateImage({ prompt: 'x' }, {
      env: CF_ENV,
      hedgeMs: 30,
      fetchImpl: fakeFetch(async (u) => {
        if (u.includes('flux-1-schnell')) {
          await sleep(300); // slow, never cut off by us
          return okRes();
        }
        return okRes();
      }),
    });
    expect(r.provider).toBe('cf-lucid-origin');
  });

  it('rejects when every model fails', async () => {
    await expect(
      generateImage({ prompt: 'x' }, { env: CF_ENV, fetchImpl: fakeFetch(() => new Response('no', { status: 500 })) }),
    ).rejects.toThrow();
  });

  it('IMAGE_CHAIN env can put pollinations first or exclude Cloudflare', async () => {
    const r = await generateImage({ prompt: 'x' }, { env: { ...CF_ENV, IMAGE_CHAIN: 'pollinations' }, fetchImpl: fakeFetch(() => okRes()) });
    expect(r.provider).toBe('pollinations-flux');
  });

  it('uses the paid Gemini image model first while under budget, counts it, then falls to free models', async () => {
    resetPaidImageCount();
    const b64 = png().toString('base64');
    const f = fakeFetch((u) =>
      u.includes('generativelanguage') ? new Response(JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { data: b64 } }] } }] }), { status: 200 }) : okRes(),
    );
    const env = { ...CF_ENV, GEMINI_PAID_API_KEY: 'paid-test', GEMINI_PAID_IMAGE_DAILY: '1' };
    const first = await generateImage({ prompt: 'x' }, { env, fetchImpl: f });
    expect(first.provider).toBe('gemini-paid-flash-lite-image');
    expect(paidImagesToday()).toBe(1);
    const second = await generateImage({ prompt: 'x' }, { env, fetchImpl: f });
    expect(second.provider).toBe('cf-flux-1-schnell'); // budget spent: free chain, no failure
    resetPaidImageCount();
  });

  it('never uses the paid model without its key or when the budget is 0', async () => {
    resetPaidImageCount();
    const urls: string[] = [];
    await generateImage({ prompt: 'x' }, { env: { ...CF_ENV, GEMINI_PAID_API_KEY: 'paid-test', GEMINI_PAID_IMAGE_DAILY: '0' }, fetchImpl: fakeFetch((u) => (urls.push(u), okRes())) });
    expect(urls.some((u) => u.includes('generativelanguage'))).toBe(false);
  });
});
