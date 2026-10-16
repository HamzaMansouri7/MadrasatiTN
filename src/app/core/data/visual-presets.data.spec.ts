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
    '/cheatsheet',
    '/didyouknow',
    '/roadmap',
    '/tree',
    '/compare',
    '/quizcard',
    '/certificate',
    '/venn',
    '/idcard',
    '/analogy',
    '/flyer',
  ];

  it('defines all 23 visual commands', () => {
    expect(expectedCommands.length).toBe(23);
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

  describe('Phase 3a — Reusing existing layouts', () => {
    it('/cheatsheet maps to hero-cards with fiche theme', () => {
      const cs = VISUAL_PRESETS['/cheatsheet'];
      expect(cs.presetId).toBe('hero-cards');
      expect(cs.themeId).toBe('fiche');
      expect(cs.styleBlock.toLowerCase()).toContain('cheat sheet');
    });

    it('/didyouknow maps to central-picture with kids theme', () => {
      const dyk = VISUAL_PRESETS['/didyouknow'];
      expect(dyk.presetId).toBe('central-picture');
      expect(dyk.themeId).toBe('kids');
      expect(dyk.styleBlock.toLowerCase()).toContain('did you know');
    });

    it('/roadmap maps to timeline with official theme', () => {
      const rm = VISUAL_PRESETS['/roadmap'];
      expect(rm.presetId).toBe('timeline');
      expect(rm.themeId).toBe('official');
      expect(rm.styleBlock.toLowerCase()).toContain('roadmap');
    });

    it('/tree maps to mindmap with kids theme', () => {
      const tree = VISUAL_PRESETS['/tree'];
      expect(tree.presetId).toBe('mindmap');
      expect(tree.themeId).toBe('kids');
      expect(tree.styleBlock.toLowerCase()).toContain('tree diagram');
    });

    it('/compare maps to comparison with kids theme', () => {
      const cmp = VISUAL_PRESETS['/compare'];
      expect(cmp.presetId).toBe('comparison');
      expect(cmp.themeId).toBe('kids');
      expect(cmp.styleBlock.toLowerCase()).toContain('comparison');
    });
  });

  describe('Phase 3b — New layouts', () => {
    it('/quizcard maps to quizcard preset with lilac theme', () => {
      const quiz = VISUAL_PRESETS['/quizcard'];
      expect(quiz.presetId).toBe('quizcard');
      expect(quiz.themeId).toBe('lilac');
      expect(quiz.schemaFields.some((f) => f.name === 'choices')).toBe(true);
    });

    it('/certificate maps to certificate preset with official theme', () => {
      const cert = VISUAL_PRESETS['/certificate'];
      expect(cert.presetId).toBe('certificate');
      expect(cert.themeId).toBe('official');
      expect(cert.schemaFields.some((f) => f.name === 'reason')).toBe(true);
    });

    it('/venn maps to venn preset with kids theme', () => {
      const venn = VISUAL_PRESETS['/venn'];
      expect(venn.presetId).toBe('venn');
      expect(venn.themeId).toBe('kids');
      expect(venn.schemaFields.some((f) => f.name === 'overlap')).toBe(true);
    });

    it('/idcard maps to idcard preset with encyclopedia theme', () => {
      const idcard = VISUAL_PRESETS['/idcard'];
      expect(idcard.presetId).toBe('idcard');
      expect(idcard.themeId).toBe('encyclopedia');
      expect(idcard.schemaFields.some((f) => f.name === 'stats')).toBe(true);
    });

    it('/analogy maps to analogy preset with comic theme', () => {
      const analogy = VISUAL_PRESETS['/analogy'];
      expect(analogy.presetId).toBe('analogy');
      expect(analogy.themeId).toBe('comic');
      expect(analogy.schemaFields.some((f) => f.name === 'bridgeNote')).toBe(true);
    });

    it('/flyer maps to flyer preset with poster theme', () => {
      const flyer = VISUAL_PRESETS['/flyer'];
      expect(flyer.presetId).toBe('flyer');
      expect(flyer.themeId).toBe('poster');
      expect(flyer.schemaFields.some((f) => f.name === 'sections')).toBe(true);
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
      expect(parseVisualCommand('/quizcard Les fractions')).toEqual({
        command: '/quizcard',
        topic: 'Les fractions',
      });
      expect(parseVisualCommand('/venn Reptiles vs Amphibiens')).toEqual({
        command: '/venn',
        topic: 'Reptiles vs Amphibiens',
      });
      expect(parseVisualCommand('/certificate Félicitations')).toEqual({
        command: '/certificate',
        topic: 'Félicitations',
      });
    });

    it('returns null for unknown command or plain text', () => {
      expect(parseVisualCommand('/unknown topic')).toBeNull();
      expect(parseVisualCommand('just a topic without command')).toBeNull();
    });
  });
});
