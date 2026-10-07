import { Type } from '@google/genai';
import { Skill } from './types';

export interface SummarizeSkillInput {
  grade?: string;
  subject?: string;
  trimester?: string;
  title?: string;
  lang?: 'ar' | 'fr';
}

const STR = { type: Type.STRING } as const;
const STR_ARR = { type: Type.ARRAY, items: STR } as const;

export const SUMMARIZE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: STR,
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
        'Éducation Islamique',
        'Éducation Civique',
        'Anglais',
        'unknown',
      ],
    },
    trimester: {
      type: Type.STRING,
      enum: ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'unknown'],
    },
    summaryMarkdown: STR,
    keyPoints: STR_ARR,
    glossary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: STR,
          def: STR,
          origin: { type: Type.STRING, enum: ['source', 'added'] },
        },
        required: ['term', 'def', 'origin'],
      },
    },
  },
  required: ['title', 'grade', 'subject', 'trimester', 'summaryMarkdown', 'keyPoints', 'glossary'],
};

export const summarizeSkill: Skill<SummarizeSkillInput> = {
  id: 'summarize-s7',
  version: '1.0.0',
  chain: 'C',
  temperature: 0.2,
  schema: SUMMARIZE_SCHEMA,
  build: (input) => {
    return [
      `OBJECTIF PÉDAGOGIQUE (S7) : Synthèse rigoureuse et structurée de documents scolaires du primaire tunisien.`,
      `POLITIQUE LINGUISTIQUE UNIQUE :`,
      `- Rédige la synthèse STRICTEMENT dans la langue du document source (arabe par défaut si bilingue ou mixte, français si document intégralement français).`,
      `- Pour les niveaux 1ère à 3ème Année en arabe, applique le tashkeel (تشكيل) sur le vocabulaire clé.`,
      ``,
      `RÈGLE D'HONNÊTETÉ ET ZÉRO-HALLUCINATION :`,
      `- Ne rajoute aucune formule, date, règle grammaticale ou fait scientifique absent du document source.`,
      `- Si le niveau ou la matière est incertain, utilise "unknown" pour "grade", "subject" ou "trimester".`,
      ``,
      `EXIGENCES DU GLOSSAIRE (SOURCE-ONLY) :`,
      `- "glossary" : Inclus UNIQUEMENT des termes techniques et notions qui figurent textuellement dans le document source.`,
      `- Pour chaque terme, précise "origin": "source" si la définition provient du document, ou "origin": "added" si c'est une définition pédagogique concise ajoutée pour éclairer l'élève.`,
      ``,
      `STRUCTURE DU RÉSUMÉ :`,
      `- "summaryMarkdown" : Markdown soigné (titres ##, puces, encadrés méthodologiques, tableaux si pertinent).`,
      `- "keyPoints" : 3 à 6 points clés essentiels à mémoriser pour l'élève.`,
      input.title ? `Titre indicatif du document : "${input.title.slice(0, 200)}"` : '',
    ].filter(Boolean).join('\n');
  },
};
