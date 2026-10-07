import { Type } from '@google/genai';
import { Skill } from './types';

const STR = { type: Type.STRING } as const;
const NUM = { type: Type.NUMBER } as const;
const INT = { type: Type.INTEGER } as const;
const BOOL = { type: Type.BOOLEAN } as const;
const STR_ARR = { type: Type.ARRAY, items: STR } as const;

export const WORKSHEET_DNA_SCHEMA = {
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
    topic: STR,
    language: { type: Type.STRING, enum: ['fr', 'ar', 'en', 'mixed'] },
    palette: STR_ARR,
    layoutStyle: STR,
    illustrationStyle: STR,
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: STR,
          kind: {
            type: Type.STRING,
            enum: ['words', 'sentences', 'qcm', 'matching', 'phonics', 'commands', 'comprehension', 'grammar', 'problem', 'free'],
          },
          itemsCount: INT,
        },
        required: ['heading', 'kind'],
      },
    },
  },
  required: ['title', 'grade', 'subject', 'topic', 'language', 'palette', 'layoutStyle', 'illustrationStyle', 'sections'],
};

export const WORKSHEET_SIMILAR_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    exercises: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: STR,
          promptText: STR,
          solutionText: STR,
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
          imagePrompt: STR,
        },
        required: ['title', 'promptText', 'solutionText', 'format'],
      },
    },
  },
  required: ['exercises'],
};

export interface WorksheetDnaInput {
  documentName?: string;
}

export const worksheetDnaSkill: Skill<WorksheetDnaInput> = {
  id: 'worksheet-dna-s12a',
  version: '1.0.0',
  chain: 'C',
  temperature: 0.2,
  schema: WORKSHEET_DNA_SCHEMA,
  build: (input) => {
    return [
      `OBJECTIF PÉDAGOGIQUE (S12A) : Analyse du génome visuel et structurel d'une fiche d'exercices tunisienne.`,
      `Consignes d'analyse :`,
      `- Analyse l'image soumise pour extraire fidèlement son style graphique, sa structure de contenu et ses métadonnées.`,
      `- "palette" : Extrais 3 à 6 codes hexadécimaux dominants (#RRGGBB) présents dans le visuel.`,
      `- "language" : Identifie précisément la langue ('ar', 'fr', 'en', ou 'mixed').`,
      `- "sections" : Décompose les exercices ou encadrés visibles avec leur typologie ('words', 'sentences', 'qcm', 'matching', 'phonics', 'commands', 'comprehension', 'grammar', 'problem', 'free').`,
      input.documentName ? `Nom indicatif du document : "${input.documentName.slice(0, 200)}"` : '',
    ].filter(Boolean).join('\n');
  },
};

export interface WorksheetSimilarInput {
  dna: {
    grade?: string;
    subject?: string;
    topic?: string;
    language?: 'fr' | 'ar' | 'en' | 'mixed';
    palette?: string[];
    illustrationStyle?: string;
    sections?: { heading?: string }[];
  };
  count: number;
}

export function enforceExactExerciseCount<T>(exercises: T[], targetCount: number): T[] {
  if (!Array.isArray(exercises) || exercises.length === 0) return [];
  if (exercises.length === targetCount) return exercises;
  if (exercises.length > targetCount) return exercises.slice(0, targetCount);
  // If fewer exercises than requested, duplicate last as a fallback clone
  const res = [...exercises];
  while (res.length < targetCount) {
    res.push(JSON.parse(JSON.stringify(res[res.length - 1])));
  }
  return res;
}

export const worksheetSimilarSkill: Skill<WorksheetSimilarInput> = {
  id: 'worksheet-similar-s12b',
  version: '1.0.0',
  chain: 'A',
  temperature: 0.5,
  schema: WORKSHEET_SIMILAR_SCHEMA,
  build: (input) => {
    const dna = input.dna || {};
    const n = input.count;
    const isEnglish = dna.language === 'en';
    const originalSections = Array.isArray(dna.sections)
      ? dna.sections.map((s) => s.heading).filter(Boolean).join(' | ').slice(0, 400)
      : '';

    return [
      `OBJECTIF PÉDAGOGIQUE (S12B) : Génération de ${n} exercices analogues respectant l'ADN pédagogique et visuel d'une fiche existante.`,
      isEnglish
        ? `LANGUAGE POLICY: All exercise instructions, texts, and prompts MUST be in proper English for Tunisian primary school students learning English.`
        : `POLITIQUE LINGUISTIQUE : Rédige dans la langue de la fiche (${dna.language || 'ar'}).`,
      ``,
      `PARAMÈTRES ADN DU MODÈLE :`,
      `- Niveau : ${dna.grade || '1ère Année'}`,
      `- Matière : ${dna.subject || 'Mathématiques'}`,
      `- Thème : ${dna.topic || 'Programme officiel'}`,
      `- Palette : ${(dna.palette || []).join(', ') || 'Couleurs vives scolaires'}`,
      `- Style d'illustration : ${(dna.illustrationStyle || 'cartoon éducatif simple').slice(0, 200)}`,
      originalSections ? `- RÈGLE ANTI-DOUBLON : La fiche originale contient déjà [${originalSections}]. Conçois des exercices complémentaires originaux, jamais de simples doublons.` : '',
      ``,
      `EXIGENCES OBLIGATOIRES :`,
      `- Fournis EXACTEMENT ${n} exercices dans le tableau "exercises".`,
      `- "imagePrompt" : Description en anglais d'une illustration pour chaque exercice (sans aucun texte dans l'image, fond blanc ou neutre, adapté aux enfants).`,
    ].filter(Boolean).join('\n');
  },
};
