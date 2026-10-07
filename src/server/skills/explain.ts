import { Type } from '@google/genai';
import { Skill } from './types';

export interface ExplainSkillInput {
  grade?: string;
  subject?: string;
  concept?: string;
  role?: string;
}

const STR = { type: Type.STRING } as const;

export const EXPLAIN_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    explanation: STR,
    analogy: STR,
    checkQuestion: STR,
  },
  required: ['explanation', 'analogy', 'checkQuestion'],
};

export const explainSkill: Skill<ExplainSkillInput> = {
  id: 'explain-s6',
  version: '1.0.0',
  chain: 'B',
  temperature: 0.3,
  schema: EXPLAIN_SCHEMA,
  build: (input) => {
    return [
      `MISSION EXPLICATION PÉDAGOGIQUE (S6) : Explique la notion avec une pédagogie bienveillante et adaptée à un élève de ${input.grade || 'l\'école primaire'}.`,
      `RÈGLES D'EXPLICATION :`,
      `- "explanation" : Explication limpide, sans jargon inutile, adaptée au niveau de lecture de l'enfant.`,
      `- "analogy" : Une métaphore ou analogie visuelle parlante issue du quotidien de l'enfant.`,
      `- "checkQuestion" : Une question courte pour vérifier que l'élève a bien compris.`,
      `- Si le concept est hors programme du primaire, réoriente avec douceur vers les bases équivalentes.`,
    ].join('\n\n');
  },
};
