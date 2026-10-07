import { describe, it, expect } from 'vitest';
import { compose } from './compose';
import { Skill } from './types';

describe('compose helper', () => {
  const dummySkill: Skill<{ grade?: string; subject?: string }> = {
    id: 'test-skill',
    version: '1.0',
    chain: 'A',
    temperature: 0.3,
    build: (input) => `CONSIGNE SPÉCIFIQUE : ${input.subject || 'Général'}`,
  };

  it('assembles base rules, context block, skill rules, and capped user data tags', () => {
    const prompt = compose(dummySkill, {
      grade: '4ème Année',
      subject: 'Mathématiques',
      contextBlockStr: 'CURRICULUM GROUNDING...',
      dataTags: {
        teacher_input: 'Ceci est le texte de test',
      },
    });

    expect(prompt).toContain('RÈGLES FONDAMENTALES MADRASATI TN');
    expect(prompt).toContain('CURRICULUM GROUNDING...');
    expect(prompt).toContain('LEXIQUE OFFICIEL CNP (Mathématiques)');
    expect(prompt).toContain('CONSIGNE SPÉCIFIQUE : Mathématiques');
    expect(prompt).toContain('<teacher_input>');
    expect(prompt).toContain('Ceci est le texte de test');
    expect(prompt).toContain('</teacher_input>');
  });

  it('caps user data tags to 2000 chars', () => {
    const hugeText = 'A'.repeat(5000);
    const prompt = compose(dummySkill, {
      subject: 'Mathématiques',
      dataTags: {
        long_text: hugeText,
      },
    });

    expect(prompt).toContain('<long_text>');
    expect(prompt).not.toContain('A'.repeat(2001));
  });
});
