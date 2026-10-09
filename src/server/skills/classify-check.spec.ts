import { describe, it, expect } from 'vitest';
import { classifyCheckSkill, CLASSIFY_CHECK_SCHEMA } from './classify-check';
import { Type } from '@google/genai';

describe('classify-check skill', () => {
  it('has correct skill metadata', () => {
    expect(classifyCheckSkill.id).toBe('classify-check-s12');
    expect(classifyCheckSkill.chain).toBe('B');
    expect(classifyCheckSkill.temperature).toBe(0.1);
  });

  it('defines valid JSON schema requiring verdict, confidence, and reason', () => {
    expect(CLASSIFY_CHECK_SCHEMA.type).toBe(Type.OBJECT);
    expect(CLASSIFY_CHECK_SCHEMA.required).toEqual(['verdict', 'confidence', 'reason']);
    expect(CLASSIFY_CHECK_SCHEMA.properties.verdict.enum).toEqual(['ok', 'reject']);
  });

  it('builds prompt containing current and proposed classifications', () => {
    const prompt = classifyCheckSkill.build({
      title: 'Devoir de Contrôle n°1 - Grammaire',
      extractedText: 'Exercice 1: Conjuguer à l\'imparfait',
      current: { grade: '1ère Année', subject: 'Mathématiques', trimester: 'Trimestre 1', docType: 'Fiche de Révision' },
      proposed: { grade: '4ème Année', subject: 'Français', trimester: 'Trimestre 1', docType: 'Devoir de Contrôle' },
    });

    expect(prompt).toContain('Devoir de Contrôle n°1 - Grammaire');
    expect(prompt).toContain('Mathématiques');
    expect(prompt).toContain('Français');
    expect(prompt).toContain('4ème Année');
    expect(prompt).toContain('verdict');
  });
});
