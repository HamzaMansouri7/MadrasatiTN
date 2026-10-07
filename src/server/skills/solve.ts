import { Type } from '@google/genai';
import { Skill } from './types';

export interface SolveSkillInput {
  grade?: string;
  subject?: string;
  language?: string;
  trimester?: string;
  topic?: string;
  promptText?: string;
  isImageInput?: boolean;
}

const STR = { type: Type.STRING } as const;
const NUM = { type: Type.NUMBER } as const;

export const SOLVE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    status: {
      type: Type.STRING,
      enum: ['ok', 'unreadable', 'not_exercise'],
    },
    extractedText: STR,
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
    solutionText: STR,
    parentGuide: STR,
    teacherNotes: STR,
    checkQuestion: STR,
    recommendedPoints: NUM,
  },
  required: ['status', 'extractedText', 'grade', 'subject', 'solutionText', 'parentGuide'],
};

export const solveSkill: Skill<SolveSkillInput> = {
  id: 'solve-s5',
  version: '1.0.0',
  chain: 'A', // For image input, caller can route to chain 'C'
  temperature: 0.2,
  schema: SOLVE_SCHEMA,
  build: (input) => {
    return [
      `OBJECTIF PÉDAGOGIQUE (S5) : Résolution et tutorat bienveillant pour élève du primaire tunisien.`,
      `RÈGLES DE VALIDATION D'ENTRÉE :`,
      `- Si le support fourni est flou, illisible, coupé ou tronqué : définis "status" = "unreadable", "solutionText" = "Le document est illisible.", et "parentGuide" = "Veuillez reprendre une photo nette et bien éclairée."`,
      `- Si le document ne contient aucun exercice ou problème scolaire (ex: photo personnelle, document administratif, paysage) : définis "status" = "not_exercise", "solutionText" = "Ce document ne contient pas d'exercice scolaire.", et "parentGuide" = "Veuillez soumettre une page d'exercice ou de cahier d'élève."`,
      `- Si le document contient un exercice scolaire valide : définis "status" = "ok".`,
      ``,
      `MÉTHODOLOGIE SCOLAIRE DU PRIMAIRE (MÉTHODES OFFICIELLES DU PROGRAMME UNIQUEMENT) :`,
      `- INTERDICTION ABSOLUE D'UTILISER L'ALGÈBRE (pas d'équations avec variable x, pas de systèmes formels d'équations).`,
      `- En mathématiques au primaire, utilise UNIQUEMENT les méthodes arithmétiques visuelles, schémas en barres, étapes de calcul posé et raisonnement progressif conformes aux manuels CNP.`,
      `- "solutionText" : Corrigé complet, rigoureux et vérifié étape par étape, avec mise en évidence nette du résultat final.`,
      `- "parentGuide" : Contrat "Expliquer sans donner la réponse" : propose 2 ou 3 questions d'accompagnement concrètes que le parent peut poser à son enfant pour l'amener à trouver la solution par lui-même.`,
      `- "teacherNotes" : Conseils méthodologiques et pièges d'apprentissage fréquents.`,
      `- "checkQuestion" : Petite question analogue de vérification immédiate des acquis.`,
      `- "grade" et "subject" : Si indéterminable avec certitude, utilise la valeur "unknown".`,
      input.promptText ? `\nÉnoncé de l'exercice :\n"${input.promptText.slice(0, 1500)}"` : '',
    ].filter(Boolean).join('\n');
  },
};
