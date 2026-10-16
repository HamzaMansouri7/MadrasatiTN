/**
 * Shared format-specific prompt instructions for exercise skills
 * (free, qcm, true_false, fill_blanks, matching, ordering, table, column_calc).
 */

export const FORMAT_RULES: Record<string, string> = {
  free: `- Format libre : promptText complet avec consigne claire. solutionText avec démarche étape par étape.`,
  qcm: `- Format QCM : promptText contenant la question. qcmOptions contenant 3 à 4 choix plausibles (distracteurs crédibles). qcmCorrectIndex (indice 0..N-1 de la bonne réponse).`,
  true_false: `- Format Vrai/Faux : tfStatements contenant 3 à 5 affirmations équilibrées avec { text, answer: true|false }.`,
  fill_blanks: `- Format Texte à trous : gapText contenant le texte avec [[mot]] pour chaque mot à compléter.`,
  matching: `- Format Appariement / Relier : matchingPairs contenant 3 à 5 couples { left, right } à relier de manière univoque.`,
  ordering: `- Format Remettre en ordre : orderItems contenant 4 à 6 éléments DANS LE BON ORDRE (étapes, événements, nombres, phrase). La fiche les mélange elle-même.`,
  table: `- Format Tableau à compléter : tableHeaders (2 à 4 en-têtes) et tableRows (3 à 5 lignes, même nombre de cellules que d'en-têtes). Chaque cellule que l'élève doit remplir s'écrit [[réponse]] ; au moins une cellule par ligne reste donnée.`,
  column_calc: `- Format Opération posée : calcOperands (2 nombres, en chiffres, sans espaces), calcOperator ('+', '-' ou '×') et calcResult (le résultat exact, en chiffres). promptText = la consigne courte ("Pose et effectue…").`,
};

export function getFormatRule(format?: string): string {
  if (format && FORMAT_RULES[format]) {
    return `RÈGLE DU FORMAT (${format}) :\n${FORMAT_RULES[format]}`;
  }
  return `INSTRUCTIONS PAR FORMAT :\n${Object.values(FORMAT_RULES).join('\n')}`;
}
