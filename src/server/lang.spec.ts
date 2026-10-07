import { describe, it, expect } from 'vitest';
import { resolveLang, langRule } from './lang';

describe('lang helpers', () => {
  it("resolveLang('fr') returns 'fr'", () => {
    expect(resolveLang('fr')).toBe('fr');
  });

  it("resolveLang returns 'ar' for anything else, including undefined and 'en'", () => {
    expect(resolveLang('ar')).toBe('ar');
    expect(resolveLang('en')).toBe('ar');
    expect(resolveLang(undefined)).toBe('ar');
    expect(resolveLang(null)).toBe('ar');
    expect(resolveLang('')).toBe('ar');
    expect(resolveLang(123)).toBe('ar');
  });

  it("langRule('ar') mentions Arabic, and langRule('fr') mentions French", () => {
    expect(langRule('ar')).toMatch(/ARABE/i);
    expect(langRule('fr')).toMatch(/FRANÇAIS/i);
  });
});
