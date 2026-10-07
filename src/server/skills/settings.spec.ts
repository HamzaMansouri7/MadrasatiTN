import { describe, it, expect } from 'vitest';
import { buildSettingsBlock } from './settings';

describe('settings helper', () => {
  it('builds grade-specific difficulty guidelines', () => {
    const block1 = buildSettingsBlock({ grade: '1ère Année' });
    expect(block1).toContain('cycle 1');
    expect(block1).toContain('tashkeel');

    const block5 = buildSettingsBlock({ grade: '5ème Année' });
    expect(block5).toContain('cycle 3');
    expect(block5).toContain('fractions');
  });

  it('includes points budget and format constraints when passed', () => {
    const block = buildSettingsBlock({
      grade: '4ème Année',
      points: 8,
      format: 'qcm',
      difficulty: 'difficile',
      docType: 'Devoir de Contrôle',
    });
    expect(block).toContain('8 points');
    expect(block).toContain('qcm');
    expect(block).toContain('difficile');
    expect(block).toContain('Devoir de Contrôle');
  });
});
