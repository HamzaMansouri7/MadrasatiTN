import { describe, it, expect, beforeEach } from 'vitest';
import { generateImage, resetImageCooldowns, isImageBuffer } from './image-chain';

const png = (): Buffer => {
  const b = Buffer.alloc(2000, 1);
  Buffer.from([0x89, 0x50, 0x4e, 0x47]).copy(b);
  return b;
};
const CF_ENV = { CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32), CLOUDFLARE_API_TOKEN: 'tok' };
const okRes = () => new Response(png(), { status: 200, headers: { 'content-type': 'image/png' } });
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
  it('uses the best Cloudflare model first', async () => {
    const urls: string[] = [];
    const r = await generateImage({ prompt: 'x' }, { env: CF_ENV, fetchImpl: fakeFetch((u) => (urls.push(u), okRes())) });
    expect(r.provider).toBe('cf-flux-2-klein-9b');
    expect(urls[0]).toContain('flux-2-klein-9b');
    expect(r.watermarked).toBe(false);
  });

  it('skips Cloudflare without keys and falls to Pollinations (flagged watermarked)', async () => {
    const r = await generateImage({ prompt: 'x' }, { env: {}, fetchImpl: fakeFetch(() => okRes()) });
    expect(r.provider).toBe('pollinations-flux');
    expect(r.watermarked).toBe(true);
  });

  it('falls back to the next model when one fails', async () => {
    const r = await generateImage({ prompt: 'x' }, {
      env: CF_ENV,
      fetchImpl: fakeFetch((u) => (u.includes('klein-9b') ? new Response('boom', { status: 500 }) : okRes())),
    });
    expect(r.provider).toBe('cf-flux-1-schnell');
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
        if (u.includes('klein-9b')) {
          await sleep(300); // slow, never cut off by us
          return okRes();
        }
        return okRes();
      }),
    });
    expect(r.provider).toBe('cf-flux-1-schnell');
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
});
