import { describe, it, expect } from 'vitest';
import { checkExercise } from './post-checks';

describe('checkExercise', () => {
  it('requires non-empty solutionText and promptText', () => {
    expect(checkExercise({ promptText: '', solutionText: 'Sol', format: 'free' }).valid).toBe(false);
    expect(checkExercise({ promptText: 'Prompt', solutionText: '   ', format: 'free' }).valid).toBe(false);
    expect(checkExercise({ promptText: 'Prompt', solutionText: 'Sol', format: 'free' }).valid).toBe(true);
  });

  describe('qcm format', () => {
    it('requires qcmCorrectIndex to be inside qcmOptions range', () => {
      const validQcm = {
        promptText: 'Question ?',
        solutionText: 'Réponse A',
        format: 'qcm',
        qcmOptions: ['A', 'B', 'C'],
        qcmCorrectIndex: 1,
      };
      expect(checkExercise(validQcm).valid).toBe(true);

      const invalidOutOfBounds = {
        ...validQcm,
        qcmCorrectIndex: 3, // options are 0..2
      };
      const result = checkExercise(invalidOutOfBounds);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('qcmCorrectIndex'))).toBe(true);

      const invalidNegative = {
        ...validQcm,
        qcmCorrectIndex: -1,
      };
      expect(checkExercise(invalidNegative).valid).toBe(false);

      const emptyOptions = {
        ...validQcm,
        qcmOptions: [],
        qcmCorrectIndex: 0,
      };
      expect(checkExercise(emptyOptions).valid).toBe(false);
    });
  });

  describe('true_false format', () => {
    it('requires at least one statement in tfStatements', () => {
      const validTF = {
        promptText: 'Consigne',
        solutionText: 'Correction',
        format: 'true_false',
        tfStatements: [{ text: '2+2=4', answer: true }],
      };
      expect(checkExercise(validTF).valid).toBe(true);

      const invalidEmptyTF = {
        promptText: 'Consigne',
        solutionText: 'Correction',
        format: 'true_false',
        tfStatements: [],
      };
      const result = checkExercise(invalidEmptyTF);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('tfStatements'))).toBe(true);
    });
  });

  describe('matching format', () => {
    it('requires at least two pairs in matchingPairs', () => {
      const validMatching = {
        promptText: 'Relie les paires',
        solutionText: 'Correction',
        format: 'matching',
        matchingPairs: [
          { left: 'A', right: '1' },
          { left: 'B', right: '2' },
        ],
      };
      expect(checkExercise(validMatching).valid).toBe(true);

      const invalidOnePair = {
        promptText: 'Relie les paires',
        solutionText: 'Correction',
        format: 'matching',
        matchingPairs: [{ left: 'A', right: '1' }],
      };
      const result = checkExercise(invalidOnePair);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('matchingPairs'))).toBe(true);
    });
  });
});
