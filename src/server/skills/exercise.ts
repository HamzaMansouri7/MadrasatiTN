import { Type } from '@google/genai';
import { Skill } from './types';
import { buildSettingsBlock, ExerciseSettings } from './settings';
import { getFormatRule } from './exercise-formats';

export interface ExerciseSkillInput extends ExerciseSettings {
  topic?: string;
  role?: string;
  targetObjective?: string;
}

const STR = { type: Type.STRING } as const;
const NUM = { type: Type.NUMBER } as const;
const INT = { type: Type.INTEGER } as const;
const BOOL = { type: Type.BOOLEAN } as const;
const STR_ARR = { type: Type.ARRAY, items: STR } as const;

export const EXERCISE_SCHEMA_V1 = {
  type: Type.OBJECT,
  properties: {
    title: STR,
    promptText: STR,
    solutionText: STR,
    parentGuide: STR,
    teacherNotes: STR,
    hints: STR_ARR,
    points: NUM,
    format: { type: Type.STRING, enum: ['free', 'qcm', 'true_false', 'fill_blanks', 'matching'] },
    qcmOptions: STR_ARR,
    qcmCorrectIndex: INT,
    tfStatements: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT, properties: { text: STR, answer: BOOL }, required: ['text', 'answer'] },
    },
    gapText: STR,
    matchingPairs: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT, properties: { left: STR, right: STR }, required: ['left', 'right'] },
    },
  },
  required: ['title', 'promptText', 'solutionText', 'format', 'teacherNotes', 'parentGuide'],
};

export const exerciseSkill: Skill<ExerciseSkillInput> = {
  id: 'exercise-s1',
  version: '1.0.0',
  chain: 'A',
  temperature: 0.3,
  schema: EXERCISE_SCHEMA_V1,
  build: (input) => {
    const parts: string[] = [
      `OBJECTIF PÉDAGOGIQUE (S1) : Conçois un exercice scolaire d'excellence ancré dans le programme officiel tunisien.`,
      `APPROCHE PAR COMPÉTENCES (APC) :`,
      `- Définis une situation d'apprentissage stimulante et concrète adaptée à l'âge de l'élève.`,
      `- La consigne doit être univoque et mobiliser une compétence identifiable.`,
      `- "parentGuide" : Fournis un guide d'accompagnement clair pour le parent à la maison (comment guider sans donner la réponse).`,
      `- "teacherNotes" : Précise les critères d'évaluation et les obstacles cognitifs fréquents pour l'enseignant.`,
    ];

    const settings = buildSettingsBlock(input);
    if (settings) parts.push(settings);

    parts.push(getFormatRule(input.format));

    if (input.targetObjective) {
      parts.push(`Compétence ciblée spécifique : ${input.targetObjective}`);
    }

    return parts.join('\n\n');
  },
};
