import { Type } from '@google/genai';
import { Skill } from './types';

export interface AnnouncementSkillInput {
  grade?: string;
  purpose?: string;
  details?: string;
}

const STR = { type: Type.STRING } as const;

export const ANNOUNCEMENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: STR,
    content: STR,
  },
  required: ['title', 'content'],
};

export const announcementSkill: Skill<AnnouncementSkillInput> = {
  id: 'announcement-s10',
  version: '1.0.0',
  chain: 'B',
  temperature: 0.4,
  schema: ANNOUNCEMENT_SCHEMA,
  build: () => {
    return [
      `MISSION COMMUNICATION SCOLAIRE (S10) : Rédige une annonce ou un mot pour le carnet de correspondance scolaire.`,
      `RÈGLES DE RÉDACTION :`,
      `- Ton institutionnel et respectueux conforme aux usages scolaires tunisiens.`,
      `- Ne JAMAIS inventer de dates réelles, de prénoms d'enseignants ou d'événements imaginaires.`,
      `- Utilise des balises génériques : [date], [heure], [signature], [nom de l'enseignant] pour toute information à compléter.`,
      `- Ne force AUCUN émoji inutile ; reste sobre, clair et lisible.`,
    ].join('\n\n');
  },
};
