import { describe, it, expect } from 'vitest';
import { renderOgHtml, resolveOgPayload, OgMetaPayload } from './og-preview';
import { Request } from 'express';

describe('renderOgHtml', () => {
  it('replaces existing og tags and injects new ones into head', () => {
    const rawHtml = `<!DOCTYPE html><html><head><title>Test</title><meta property="og:title" content="Old" /></head><body></body></html>`;
    const payload: OgMetaPayload = {
      title: 'Mathématiques 5ème',
      description: 'Fiche d exercices',
      imageUrl: 'https://madrastihub.com/assets/thumbs/curriculum/math-5-ch1.webp',
      pageUrl: 'https://madrastihub.com/discovery?doc=math-5-ch1',
      type: 'article',
    };
    const rendered = renderOgHtml(rawHtml, payload);
    expect(rendered).toContain('<meta property="og:title" content="Mathématiques 5ème" />');
    expect(rendered).toContain('<meta property="og:image" content="https://madrastihub.com/assets/thumbs/curriculum/math-5-ch1.webp" />');
    expect(rendered).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(rendered).not.toContain('content="Old"');
  });
});

describe('resolveOgPayload', () => {
  const fakeDistFolder = 'public';

  it('resolves default landing page payload', () => {
    const mockReq = {
      path: '/',
      query: {},
      get: (header: string) => (header === 'host' ? 'madrastihub.com' : 'https'),
    } as unknown as Request;

    const payload = resolveOgPayload(mockReq, fakeDistFolder);
    expect(payload.type).toBe('website');
    expect(payload.title).toContain('مدرستي تونس');
    expect(payload.imageUrl).toContain('/facebook_cover.jpg');
  });

  it('resolves curriculum topic and serves generated webp thumbnail', () => {
    const mockReq = {
      path: '/discovery',
      query: { topicId: 'ar-1-u1' },
      get: (header: string) => (header === 'host' ? 'madrastihub.com' : 'https'),
    } as unknown as Request;

    const payload = resolveOgPayload(mockReq, fakeDistFolder);
    expect(payload.title).toContain('أنيسي في مدرستي');
    expect(payload.imageUrl).toContain('/assets/thumbs/curriculum/ar-1-u1.webp');
  });
});
