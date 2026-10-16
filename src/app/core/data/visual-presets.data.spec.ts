import { describe, expect, it } from 'vitest';
import { VISUAL_PRESETS, parseVisualCommand } from './visual-presets.data';
import { VisualCommand } from '../models/visual-preset.model';
import { ENABLED_INFOGRAPHIC_PRESETS } from '../models/infographic-spec.model';

describe('VISUAL_PRESETS', () => {
  const expectedCommands: VisualCommand[] = [
    '/infographic',
    '/handwritten',
    '/xray',
    '/visualize',
    '/diagram',
    '/mindmap',
    '/poster',
    '/comic',
    '/timeline',
    '/flashcards',
    '/cycle',
    '/steps',
  ];

  it('defines all 12 visual commands', () => {
    expectedCommands.forEach((cmd) => {
      expect(VISUAL_PRESETS[cmd]).toBeDefined();
      expect(VISUAL_PRESETS[cmd].command).toBe(cmd);
      expect(VISUAL_PRESETS[cmd].name).toBeTruthy();
      expect(VISUAL_PRESETS[cmd].nameFr).toBeTruthy();
      expect(VISUAL_PRESETS[cmd].nameAr).toBeTruthy();
      expect(VISUAL_PRESETS[cmd].styleBlock).toBeTruthy();
      expect(VISUAL_PRESETS[cmd].compilePrompt('Photosynthèse')).toContain('Photosynthèse');
    });
  });

  it('every command points to an enabled layout or auto', () => {
    for (const def of Object.values(VISUAL_PRESETS)) {
      const id = def.presetId ?? 'auto';
      expect(id === 'auto' || ENABLED_INFOGRAPHIC_PRESETS.includes(id)).toBe(true);
    }
  });

  it('/diagram no longer duplicates the /cycle layout', () => {
    expect(VISUAL_PRESETS['/diagram'].presetId).toBe('auto');
  });

  describe('Phase 1 absorptions & updates', () => {
    it('/diagram absorbs /anatomychart (labeled chart & anatomy chart)', () => {
      const diagram = VISUAL_PRESETS['/diagram'];
      expect(diagram.name).toContain('Anatomy');
      expect(diagram.styleBlock.toLowerCase()).toContain('anatomy chart');
      expect(diagram.summary.toLowerCase()).toContain('anatomy chart');
    });

    it('/xray absorbs /howitworks (inside-view & mechanism steps)', () => {
      const xray = VISUAL_PRESETS['/xray'];
      expect(xray.name).toContain('How It Works');
      expect(xray.styleBlock.toLowerCase()).toContain('how it works');
      expect(xray.schemaFields.some((f) => f.name === 'steps')).toBe(true);
    });

    it('/handwritten absorbs /handlettering (lettering and calligraphy)', () => {
      const handwritten = VISUAL_PRESETS['/handwritten'];
      expect(handwritten.name).toContain('Lettering');
      expect(handwritten.styleBlock.toLowerCase()).toContain('hand lettering');
    });

    it('/flashcards maintains sharp revision study card wording', () => {
      const flashcards = VISUAL_PRESETS['/flashcards'];
      expect(flashcards.presetId).toBe('flashcards');
      expect(flashcards.themeId).toBe('fiche');
      expect(flashcards.styleBlock.toLowerCase()).toContain('flashcards');
    });

    it('/cycle links to circular-flow preset', () => {
      const cycle = VISUAL_PRESETS['/cycle'];
      expect(cycle.presetId).toBe('circular-flow');
      expect(cycle.themeId).toBe('kids');
      expect(cycle.styleBlock.toLowerCase()).toContain('circular flow');
    });

    it('/steps links to steps-interface preset', () => {
      const steps = VISUAL_PRESETS['/steps'];
      expect(steps.presetId).toBe('steps-interface');
      expect(steps.themeId).toBe('lilac');
      expect(steps.styleBlock.toLowerCase()).toContain('steps & interface');
    });
  });

  describe('parseVisualCommand', () => {
    it('parses valid commands and trims topics', () => {
      expect(parseVisualCommand('/cycle Le cycle de l\'eau')).toEqual({
        command: '/cycle',
        topic: "Le cycle de l'eau",
      });
      expect(parseVisualCommand('/steps Créer un document')).toEqual({
        command: '/steps',
        topic: 'Créer un document',
      });
      expect(parseVisualCommand('/diagram Le coeur humain')).toEqual({
        command: '/diagram',
        topic: 'Le coeur humain',
      });
    });

    it('returns null for unknown command or plain text', () => {
      expect(parseVisualCommand('/unknown topic')).toBeNull();
      expect(parseVisualCommand('just a topic without command')).toBeNull();
    });
  });
});
