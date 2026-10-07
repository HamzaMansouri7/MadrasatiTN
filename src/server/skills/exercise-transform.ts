import { Skill } from './types';
import { EXERCISE_SCHEMA_V1 } from './exercise';
import { getFormatRule } from './exercise-formats';

export interface ExerciseTransformInput {
  transformationType?: string;
  targetFormat?: string;
  customInstruction?: string;
  originalText?: string;
}

export const exerciseTransformSkill: Skill<ExerciseTransformInput> = {
  id: 'exercise-transform-s2',
  version: '1.0.0',
  chain: 'A',
  temperature: 0.3,
  schema: EXERCISE_SCHEMA_V1,
  build: (input) => {
    const parts: string[] = [
      `MISSION DE TRANSFORMATION (S2) : Transforme l'exercice existant selon l'axe demandé.`,
      `RÈGLES STRICTES DE TRANSFORMATION :`,
      `- Conserve fidèlement l'objectif pédagogique d'origine tout en appliquant la transformation.`,
      `- Réécris complètement la solution et les indices pour qu'ils soient cohérents avec le nouvel exercice.`,
    ];

    if (input.transformationType) {
      parts.push(`Type de transformation requis : ${input.transformationType}`);
    }

    if (input.customInstruction) {
      parts.push(`Consigne particulière : ${input.customInstruction}`);
    }

    parts.push(getFormatRule(input.targetFormat));

    return parts.join('\n\n');
  },
};
