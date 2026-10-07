/**
 * Pedagogical constraints builder based on grade, difficulty, points budget, and document type.
 */

export interface ExerciseSettings {
  grade?: string;
  difficulty?: 'facile' | 'moyen' | 'difficile' | string;
  points?: number;
  format?: string;
  docType?: string;
}

export function buildSettingsBlock(settings: ExerciseSettings): string {
  const parts: string[] = [];

  const grade = settings.grade || '';
  if (grade.includes('1ère') || grade.includes('2ème')) {
    parts.push(`- Niveau cycle 1 (1ère/2ème) : Nombres de 0 à 100, phrases courtes (4 à 7 mots), tashkeel systématique en Arabe/Éducation islamique, concepts concrets.`);
  } else if (grade.includes('3ème') || grade.includes('4ème')) {
    parts.push(`- Niveau cycle 2 (3ème/4ème) : Nombres jusqu'à 10 000, additions/soustractions/multiplications posées, énoncés de 2 à 3 lignes.`);
  } else if (grade.includes('5ème') || grade.includes('6ème')) {
    parts.push(`- Niveau cycle 3 (5ème/6ème) : Décimaux, fractions simples, problèmes en 2 à 3 étapes de raisonnement, géométrie avec instruments.`);
  }

  if (settings.difficulty) {
    parts.push(`- Difficulté demandée : ${settings.difficulty}.`);
  }

  if (typeof settings.points === 'number' && settings.points > 0) {
    parts.push(`- Barème obligatoire : ${settings.points} points.`);
  }

  if (settings.docType) {
    parts.push(`- Type d'évaluation : ${settings.docType}.`);
  }

  if (settings.format) {
    parts.push(`- Format imposé : ${settings.format}.`);
  }

  if (parts.length === 0) return '';
  return `CADRE PÉDAGOGIQUE ET CONTRAINTES :\n${parts.join('\n')}\n`;
}
