/**
 * Shared format-specific prompt instructions for exercise skills (free, qcm, true_false, fill_blanks, matching).
 */

export const FORMAT_RULES: Record<string, string> = {
  free: `- Format libre : promptText complet avec consigne claire. solutionText avec démarche étape par étape.`,
  qcm: `- Format QCM : promptText contenant la question. qcmOptions contenant 3 à 4 choix plausibles (distracteurs crédibles). qcmCorrectIndex (indice 0..N-1 de la bonne réponse).`,
  true_false: `- Format Vrai/Faux : tfStatements contenant 3 à 5 affirmations équilibrées avec { text, answer: true|false }.`,
  fill_blanks: `- Format Texte à trous : gapText contenant le texte avec [[mot]] pour chaque mot à compléter.`,
  matching: `- Format Appariement / Relier : matchingPairs contenant 3 à 5 couples { left, right } à relier de manière univoque.`,
};

export function getFormatRule(format?: string): string {
  if (format && FORMAT_RULES[format]) {
    return `RÈGLE DU FORMAT (${format}) :\n${FORMAT_RULES[format]}`;
  }
  return `INSTRUCTIONS PAR FORMAT :\n${Object.values(FORMAT_RULES).join('\n')}`;
}
