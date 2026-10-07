import { Type } from '@google/genai';
import { Skill } from './types';

export interface TagSkillInput {
  filename?: string;
  extractedText?: string;
  dataTags?: Record<string, string>;
}

const STR = { type: Type.STRING } as const;
const BOOL = { type: Type.BOOLEAN } as const;

export const TAG_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    suggestedTitle: STR,
    grade: {
      type: Type.STRING,
      enum: ['1ère Année', '2ème Année', '3ème Année', '4ème Année', '5ème Année', '6ème Année', 'unknown'],
    },
    subject: {
      type: Type.STRING,
      enum: [
        'Mathématiques',
        'Français',
        'اللغة العربية',
        'Éveil Scientifique',
        'Histoire & Géographie',
        'Anglais',
        'التربية الإسلامية',
        'unknown',
      ],
    },
    trimester: {
      type: Type.STRING,
      enum: ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'unknown'],
    },
    docType: {
      type: Type.STRING,
      enum: ['Devoir de Contrôle', 'Devoir de Synthèse', 'Fiche de Révision', "Série d'Exercices", 'unknown'],
    },
    hasCorrection: BOOL,
    summary: STR,
    extractedContent: STR,
  },
  required: ['suggestedTitle', 'grade', 'subject', 'trimester', 'docType', 'hasCorrection', 'summary', 'extractedContent'],
};

export const tagSkill: Skill<TagSkillInput> = {
  id: 'tag-s11',
  version: '1.0.0',
  chain: 'B',
  temperature: 0.2,
  schema: TAG_SCHEMA,
  build: () => {
    return [
      `MISSION INDEXATION & MÉTADONNÉES SCOLAIRES (S11) : Analyse le document soumis et extrais ses métadonnées officielles.`,
      `RÈGLE D'HONNÊTETÉ ABSOLUE :`,
      `- Si le niveau (grade), la matière (subject), le trimestre ou le type de devoir est incertain ou non mentionné dans le texte, renvoie impérativement la valeur "unknown".`,
      `- Ne JAMAIS deviner ou forcer une matière ou un trimestre absent du document.`,
      `- "summary" : Synthèse en 2 à 3 phrases du contenu réel du document.`,
    ].join('\n\n');
  },
};
