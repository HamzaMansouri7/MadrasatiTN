import { describe, it, expect } from 'vitest';
import { toPublicError } from './public-error';

describe('toPublicError', () => {
  it('maps quota errors to 429 without leaking details', () => {
    const e = toPublicError(new Error('HTTP 429 You exceeded your current quota, project 12345 key AIza...'));
    expect(e.status).toBe(429);
    expect(e.message).not.toMatch(/12345|AIza|quota/i);
  });
  it('maps Cloudflare daily allocation to 429', () => {
    expect(toPublicError(new Error('you have used up your daily free allocation of 10,000 neurons')).status).toBe(429);
  });
  it('maps overload and timeouts to 503', () => {
    expect(toPublicError(new Error('HTTP 503 high demand')).status).toBe(503);
    expect(toPublicError('request aborted').status).toBe(503);
  });
  it('maps validation failures to 502', () => {
    expect(toPublicError(new Error('422 invalid output: promptText: missing required field')).status).toBe(502);
  });
  it('maps auth/missing-key errors to a generic 503', () => {
    const e = toPublicError(new Error('HTTP 401 API key not valid: AIzaSyXXX'));
    expect(e.status).toBe(503);
    expect(e.message).not.toMatch(/AIza|key/i);
  });
  it('uses the fallback for unknown errors and non-errors', () => {
    expect(toPublicError(new Error('boom'), 'custom').message).toBe('custom');
    expect(toPublicError(undefined).status).toBe(500);
  });
});
