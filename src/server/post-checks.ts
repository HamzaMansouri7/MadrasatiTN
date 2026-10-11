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

/**
 * Copy guard: compares generated exercise text against reference source text
 * to prevent verbatim plagiarism.
 */
export interface CopyGuardResult {
  tooClose: boolean;
  similarity: number;
  matchedSourceRef?: string;
}

/**
 * Extracts normalized word n-grams (shingles) from text.
 */
function toShingles(text: string, n = 3): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);

  const shingles = new Set<string>();
  if (words.length < n) {
    if (words.length > 0) shingles.add(words.join(' '));
    return shingles;
  }

  for (let i = 0; i <= words.length - n; i++) {
    shingles.add(words.slice(i, i + n).join(' '));
  }
  return shingles;
}

/**
 * Evaluates whether generated content is too close to any source exercise reference.
 * Returns tooClose: true if n-gram Jaccard similarity exceeds threshold (default 0.40).
 */
export function checkCopyGuard(
  generatedText: string,
  sourceTexts: { ref?: string; text: string }[],
  threshold = 0.40,
): CopyGuardResult {
  if (!generatedText || !sourceTexts || sourceTexts.length === 0) {
    return { tooClose: false, similarity: 0 };
  }

  const genShingles = toShingles(generatedText);
  if (genShingles.size === 0) {
    return { tooClose: false, similarity: 0 };
  }

  let maxSim = 0;
  let matchedRef: string | undefined;

  for (const src of sourceTexts) {
    if (!src.text) continue;
    const srcShingles = toShingles(src.text);
    if (srcShingles.size === 0) continue;

    let overlap = 0;
    for (const sh of genShingles) {
      if (srcShingles.has(sh)) overlap++;
    }

    const unionSize = genShingles.size + srcShingles.size - overlap;
    const similarity = unionSize > 0 ? overlap / unionSize : 0;

    if (similarity > maxSim) {
      maxSim = similarity;
      matchedRef = src.ref;
    }
  }

  return {
    tooClose: maxSim >= threshold,
    similarity: Math.round(maxSim * 100) / 100,
    matchedSourceRef: matchedRef,
  };
}
