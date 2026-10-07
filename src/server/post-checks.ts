/**
 * Post-generation semantic checks for AI exercises.
 */

export interface ExerciseCheckResult {
  valid: boolean;
  errors: string[];
}

export function checkExercise(ex: Record<string, unknown> | null | undefined): ExerciseCheckResult {
  const errors: string[] = [];

  if (!ex || typeof ex !== 'object') {
    return { valid: false, errors: ['Exercise object is required'] };
  }

  const promptText = typeof ex['promptText'] === 'string' ? ex['promptText'].trim() : '';
  if (!promptText) {
    errors.push('promptText must be non-empty');
  }

  const solutionText = typeof ex['solutionText'] === 'string' ? ex['solutionText'].trim() : '';
  if (!solutionText) {
    errors.push('solutionText must be non-empty');
  }

  const format = ex['format'];

  if (format === 'qcm') {
    const options = ex['qcmOptions'];
    const idx = ex['qcmCorrectIndex'];
    if (!Array.isArray(options) || options.length === 0) {
      errors.push('qcm format requires non-empty qcmOptions');
    } else if (typeof idx !== 'number' || !Number.isInteger(idx) || idx < 0 || idx >= options.length) {
      errors.push(`qcmCorrectIndex (${idx}) must be inside qcmOptions range (0..${options.length - 1})`);
    }
  }

  if (format === 'true_false') {
    const tf = ex['tfStatements'];
    if (!Array.isArray(tf) || tf.length < 1) {
      errors.push('true_false format requires at least one statement in tfStatements');
    }
  }

  if (format === 'matching') {
    const pairs = ex['matchingPairs'];
    if (!Array.isArray(pairs) || pairs.length < 2) {
      errors.push('matching format requires at least two pairs in matchingPairs');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
