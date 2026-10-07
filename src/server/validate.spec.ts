import { describe, it, expect } from 'vitest';
import { Type } from '@google/genai';
import { validateAgainstSchema } from './validate';

describe('validateAgainstSchema', () => {
  const STR = { type: Type.STRING };
  const BOOL = { type: Type.BOOLEAN };

  const testSchema = {
    type: Type.OBJECT,
    properties: {
      title: STR,
      format: { type: Type.STRING, enum: ['free', 'qcm', 'true_false'] },
      tfStatements: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { text: STR, answer: BOOL },
          required: ['text', 'answer'],
        },
      },
    },
    required: ['title', 'format'],
  };

  it('fails on missing required field', () => {
    const data = { format: 'free' }; // missing 'title'
    const result = validateAgainstSchema(data, testSchema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('title') && e.includes('missing required field'))).toBe(true);
  });

  it('fails on wrong type', () => {
    const data = { title: 12345, format: 'free' }; // title must be string
    const result = validateAgainstSchema(data, testSchema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('expected STRING'))).toBe(true);
  });

  it('fails on off-enum value', () => {
    const data = { title: 'Exercice 1', format: 'invalid_format' };
    const result = validateAgainstSchema(data, testSchema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('not in enum'))).toBe(true);
  });

  it('passes on a valid object', () => {
    const data = {
      title: 'Exercice de géométrie',
      format: 'free',
    };
    const result = validateAgainstSchema(data, testSchema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validates nested array of objects (like tfStatements)', () => {
    const validData = {
      title: 'Vrai ou Faux',
      format: 'true_false',
      tfStatements: [
        { text: 'La Terre est ronde.', answer: true },
        { text: 'Le Soleil tourne autour de la Terre.', answer: false },
      ],
    };
    const validResult = validateAgainstSchema(validData, testSchema);
    expect(validResult.valid).toBe(true);
    expect(validResult.errors).toHaveLength(0);

    const invalidNestedData = {
      title: 'Vrai ou Faux',
      format: 'true_false',
      tfStatements: [
        { text: 'Affirmation sans réponse' }, // missing answer
      ],
    };
    const invalidResult = validateAgainstSchema(invalidNestedData, testSchema);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.some(e => e.includes('answer') && e.includes('missing required field'))).toBe(true);
  });
});
