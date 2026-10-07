import { describe, it, expect } from 'vitest';
import { sanitizeSvg } from './svg-sanitize';

const ok = '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="3" fill="red"/></svg>';

describe('sanitizeSvg', () => {
  it('keeps a clean svg and strips markdown fences', () => {
    expect(sanitizeSvg('```svg\n' + ok + '\n```')).toBe(ok);
  });
  it('rejects non-svg and empty input', () => {
    expect(sanitizeSvg('hello')).toBeNull();
    expect(sanitizeSvg('')).toBeNull();
    expect(sanitizeSvg('<div></div>')).toBeNull();
  });
  it('rejects scripts, foreignObject and javascript urls', () => {
    expect(sanitizeSvg('<svg><script>alert(1)</script></svg>')).toBeNull();
    expect(sanitizeSvg('<svg><foreignObject><div/></foreignObject></svg>')).toBeNull();
    expect(sanitizeSvg('<svg><a href="javascript:alert(1)"><rect/></a></svg>')).toBeNull();
  });
  it('strips event handlers', () => {
    const out = sanitizeSvg('<svg><rect onclick="x()" onload=y() width="1"/></svg>');
    expect(out).not.toMatch(/onclick|onload/i);
    expect(out).toContain('width="1"');
  });
  it('drops external hrefs but keeps in-document ones', () => {
    const out = sanitizeSvg('<svg><use href="#a"/><image href="https://evil.example/x.png"/></svg>');
    expect(out).toContain('href="#a"');
    expect(out).not.toContain('evil.example');
  });
  it('neutralizes external css urls and imports', () => {
    const out = sanitizeSvg('<svg><style>@import "x.css"; .a{fill:url(https://e.com/a)}</style></svg>');
    expect(out).not.toMatch(/@import|https:/);
  });
  it('rejects oversized and DOCTYPE/ENTITY input', () => {
    expect(sanitizeSvg('<svg>' + 'a'.repeat(210 * 1024) + '</svg>')).toBeNull();
    expect(sanitizeSvg('<!DOCTYPE svg><svg></svg>')).toBeNull();
  });
});
