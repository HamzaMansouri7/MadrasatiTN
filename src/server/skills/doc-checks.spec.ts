import { describe, it, expect } from 'vitest';
import { toWesternDigits, normalizeDigits, fixLessonPlanStages, cleanScenes, cleanImagePrompt } from './doc-checks';

const stage = (minutes: number) => ({ step: 'x', name: 'n', minutes, teacherActivity: 't', studentActivity: 's' });

describe('doc-checks', () => {
  it('converts Eastern and Persian digits to Western', () => {
    expect(toWesternDigits('\u0661\u0662\u0663 \u06f4\u06f5')).toBe('123 45');
    expect(normalizeDigits({ a: ['\u0669'], b: { c: 'x\u0660' } })).toEqual({ a: ['9'], b: { c: 'x0' } });
  });

  it('forces 5 stages summing to the duration', () => {
    const plan = fixLessonPlanStages({ stages: [stage(5), stage(10), stage(10), stage(5), stage(5), stage(99)] }, 45);
    expect(plan.stages).toHaveLength(5);
    expect(plan.stages.reduce((a, s) => a + s.minutes, 0)).toBe(45);
    expect(plan.stages.map((s) => s.step)).toEqual(['01', '02', '03', '04', '05']);
  });

  it('keeps 4 to 8 scenes, renumbered, with a valid kind', () => {
    const raw = Array.from({ length: 10 }, (_, i) => ({ n: 7, title: `t${i}`, event: 'e', visualIdea: 'v', kind: i === 0 ? 'bogus' : 'map' }));
    const scenes = cleanScenes(raw);
    expect(scenes).toHaveLength(8);
    expect(scenes.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(scenes[0].kind).toBe('scene');
    expect(scenes[1].kind).toBe('map');
  });

  it('strips Arabic from image prompts', () => {
    expect(cleanImagePrompt('a ship \u0645\u0631\u062d\u0628\u0627 at sea')).toBe('a ship at sea');
  });
});
