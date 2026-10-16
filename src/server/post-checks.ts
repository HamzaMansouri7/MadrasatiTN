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

  if (format === 'ordering') {
    const items = ex['orderItems'];
    if (!Array.isArray(items) || items.length < 3) {
      errors.push('ordering format requires at least three orderItems');
    }
  }

  if (format === 'table') {
    const headers = ex['tableHeaders'];
    const rows = ex['tableRows'];
    if (!Array.isArray(headers) || headers.length < 2 || !Array.isArray(rows) || rows.length < 1) {
      errors.push('table format requires tableHeaders (2+) and tableRows (1+)');
    }
  }

  if (format === 'column_calc') {
    const operands = ex['calcOperands'];
    if (!Array.isArray(operands) || operands.length < 2 || typeof ex['calcResult'] !== 'string') {
      errors.push('column_calc format requires two calcOperands and a calcResult');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
