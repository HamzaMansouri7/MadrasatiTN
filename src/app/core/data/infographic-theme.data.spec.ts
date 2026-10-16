import { describe, expect, it } from 'vitest';
import {
  INFOGRAPHIC_THEMES_CONFIG,
  SEASON_THEMES_CONFIG,
  resolveTheme,
  themeImageStyle,
} from './infographic-theme.data';
import { INFOGRAPHIC_THEMES, InfographicTheme, isInfographicTheme } from '../models/infographic-spec.model';
import { SeasonName } from '../models/infographic.model';

describe('INFOGRAPHIC_THEMES & INFOGRAPHIC_THEMES_CONFIG', () => {
  const allThemes: InfographicTheme[] = [
    'kids',
    'official',
    'fiche',
    'handwritten',
    'graph-paper',
    'poster',
    'comic',
    'lilac',
    'blackboard',
    'herbarium',
    'encyclopedia',
    'seasons',
  ];

  it('contains all 12 themes in INFOGRAPHIC_THEMES', () => {
    expect(INFOGRAPHIC_THEMES.length).toBe(12);
    allThemes.forEach((th) => {
      expect(INFOGRAPHIC_THEMES).toContain(th);
      expect(isInfographicTheme(th)).toBe(true);
      expect(INFOGRAPHIC_THEMES_CONFIG[th]).toBeDefined();
    });
  });

  it('rejects invalid theme strings in isInfographicTheme', () => {
    expect(isInfographicTheme('unknown')).toBe(false);
    expect(isInfographicTheme(null)).toBe(false);
    expect(isInfographicTheme(42)).toBe(false);
  });

  describe('Phase 2 new themes', () => {
    it('defines blackboard theme with dark slate chalkboard and wood frame tokens', () => {
      const th = INFOGRAPHIC_THEMES_CONFIG.blackboard;
      expect(th.id).toBe('blackboard');
      expect(th.frame).toBe('blackboard');
      expect(th.colors.bg).toBe('#1A2721');
      expect(th.colors.ink).toBe('#F5F7F2');
      expect(th.colors.accents).toEqual(['#FFE066', '#8CE99A', '#74C0FC', '#FFA8A8']);
      expect(th.imageStyle.toLowerCase()).toContain('chalk');
    });

    it('defines herbarium theme with botanical paper and specimen tokens', () => {
      const th = INFOGRAPHIC_THEMES_CONFIG.herbarium;
      expect(th.id).toBe('herbarium');
      expect(th.frame).toBe('herbarium');
      expect(th.colors.bg).toBe('#FAF6EE');
      expect(th.colors.ink).toBe('#1B3B2B');
      expect(th.imageStyle.toLowerCase()).toContain('botanical');
    });

    it('defines encyclopedia theme with antique book and engraving tokens', () => {
      const th = INFOGRAPHIC_THEMES_CONFIG.encyclopedia;
      expect(th.id).toBe('encyclopedia');
      expect(th.frame).toBe('encyclopedia');
      expect(th.colors.bg).toBe('#F8F3E5');
      expect(th.colors.ink).toBe('#272019');
      expect(th.imageStyle.toLowerCase()).toContain('encyclopedia');
    });

    it('defines seasons theme with 4-way season variations', () => {
      const seasons: SeasonName[] = ['spring', 'summer', 'autumn', 'winter'];
      seasons.forEach((season) => {
        expect(SEASON_THEMES_CONFIG[season]).toBeDefined();
        const cfg = resolveTheme('seasons', season);
        expect(cfg.id).toBe('seasons');
        expect(cfg.frame).toBe('seasons');
        expect(cfg.imageStyle.toLowerCase()).toContain(season);
      });
    });

    it('falls back to spring if no season is specified for seasons theme', () => {
      const defaultSeason = resolveTheme('seasons');
      expect(defaultSeason.colors.bg).toBe(SEASON_THEMES_CONFIG.spring.colors.bg);
    });

    it('generates season-specific image prompts in themeImageStyle', () => {
      const winterStyle = themeImageStyle('seasons', 'winter');
      expect(winterStyle.toLowerCase()).toContain('winter');
      expect(winterStyle).toContain(SEASON_THEMES_CONFIG.winter.colors.accents[0]);

      const summerStyle = themeImageStyle('seasons', 'summer');
      expect(summerStyle.toLowerCase()).toContain('summer');
      expect(summerStyle).toContain(SEASON_THEMES_CONFIG.summer.colors.accents[0]);
    });
  });

  describe('resolveTheme fallback', () => {
    it('falls back to kids theme for unknown theme id', () => {
      expect(resolveTheme('non-existent')).toEqual(INFOGRAPHIC_THEMES_CONFIG.kids);
      expect(resolveTheme(undefined)).toEqual(INFOGRAPHIC_THEMES_CONFIG.kids);
    });
  });
});
