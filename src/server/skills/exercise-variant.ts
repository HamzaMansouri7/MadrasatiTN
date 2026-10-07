import { Skill } from './types';
import { EXERCISE_SCHEMA_V1 } from './exercise';
import { getFormatRule } from './exercise-formats';

export interface ExerciseVariantInput {
  targetFormat?: string;
  role?: string;
  originalText?: string;
  originalSolution?: string;
}

export const exerciseVariantSkill: Skill<ExerciseVariantInput> = {
  id: 'exercise-variant-s3',
  version: '1.0.0',
  chain: 'A',
  temperature: 0.3,
  schema: EXERCISE_SCHEMA_V1,
  build: (input) => {
    const isParent = input.role === 'parent';
    const parts: string[] = [
      `MISSION DE GÉNÉRATION DE VARIANTE (S3) : Conçois une variante isomorphe de l'exercice original.`,
      `RÈGLES STRICTES DE VARIANTE :`,
      `- MÊME structure cognitive, MÊME niveau de difficulté, MÊME compétence ciblée.`,
      `- Change uniquement : les valeurs numériques, les quantités, les noms propres, la mise en situation.`,
      `- SOLVABILITÉ : Préserve la solvabilité stricte (résultats entiers, pas de reste inattendu).`,
      `- Conserve le même raisonnement mathématique ou linguistique que la solution d'origine.`,
      isParent ? `- Variante immédiate : mode entraînement maison.` : `- Variante pour validation enseignant avant publication.`,
      getFormatRule(input.targetFormat),
    ];

    return parts.join('\n\n');
  },
};
