import { Type } from '@google/genai';
import { Skill } from './types';

export interface ClassifyCheckSkillInput {
  title: string;
  extractedText?: string;
  current: {
    grade?: string;
    subject?: string;
    trimester?: string;
    docType?: string;
  };
  proposed: {
    grade?: string;
    subject?: string;
    trimester?: string;
    docType?: string;
  };
}

const STR = { type: Type.STRING } as const;
const NUM = { type: Type.NUMBER } as const;

export const CLASSIFY_CHECK_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    verdict: {
      type: Type.STRING,
      enum: ['ok', 'reject'],
    },
    confidence: NUM,
    reason: STR,
  },
  required: ['verdict', 'confidence', 'reason'],
};

export const classifyCheckSkill: Skill<ClassifyCheckSkillInput> = {
  id: 'classify-check-s12',
  version: '1.0.0',
  chain: 'B',
  temperature: 0.1,
  schema: CLASSIFY_CHECK_SCHEMA,
  build: (input) => {
    return [
      `MISSION VÉRIFICATION CLASSEMENT PÉDAGOGIQUE (S12) : Analyse le titre et le contenu du document pédagogique, puis évalue si la modification de classification proposée par l'enseignant est correcte ("ok") ou erronée ("reject").`,
      `INFORMATIONS DU DOCUMENT :`,
      `- Titre : ${input.title || 'Non spécifié'}`,
      `- Extrait de texte : ${input.extractedText || 'Aucun extrait'}`,
      `CLASSIFICATION ACTUELLE :`,
      `- Niveau : ${input.current.grade || 'Inconnu'} | Matière : ${input.current.subject || 'Inconnue'} | Trimestre : ${input.current.trimester || 'Inconnu'} | Type : ${input.current.docType || 'Inconnu'}`,
      `PROPOSITION DE L'ENSEIGNANT :`,
      `- Niveau : ${input.proposed.grade || 'Inchangé'} | Matière : ${input.proposed.subject || 'Inchangée'} | Trimestre : ${input.proposed.trimester || 'Inchangé'} | Type : ${input.proposed.docType || 'Inchangé'}`,
      `CONSIGNES STRICTES :`,
      `- Si la proposition correspond aux indices réels du texte ou titre (matière, niveau, trimestre), renvoie "verdict": "ok".`,
      `- Si la proposition est aberrante ou contradictoire avec le contenu, renvoie "verdict": "reject".`,
      `- "confidence": Nombre entre 0.0 et 1.0 (ex: 0.95).`,
      `- "reason": Raison synthétique sur une seule ligne.`,
    ].join('\n\n');
  },
};
