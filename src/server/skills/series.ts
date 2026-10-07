import { Type } from '@google/genai';
import { Skill } from './types';

export interface SeriesSkillInput {
  mode: 'plan' | 'panel';
  grade?: string;
  subject?: string;
  topic?: string;
  lessonText?: string;
  bible?: {
    characters: { name: string; role: string; visualDescription: string }[];
    style: string;
    era: string;
  };
  sceneNumber?: number;
  sceneTitle?: string;
  sceneEvent?: string;
  sceneKind?: string;
  lang?: 'ar' | 'fr';
}

const STR = { type: Type.STRING } as const;
const NUM = { type: Type.NUMBER } as const;

export const SERIES_PLAN_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: STR,
    era: STR,
    style: STR,
    characters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: STR,
          role: STR,
          visualDescription: STR,
        },
        required: ['name', 'role', 'visualDescription'],
      },
    },
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          n: NUM,
          title: STR,
          event: STR,
          year: STR,
          visualIdea: STR,
          kind: STR,
          teachingGoal: STR,
        },
        required: ['n', 'title', 'event', 'visualIdea', 'kind'],
      },
    },
  },
  required: ['title', 'era', 'style', 'characters', 'scenes'],
};

export const SERIES_PANEL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    n: NUM,
    title: STR,
    event: STR,
    year: STR,
    text: STR,
    caption: STR,
    imagePrompt: STR,
    kind: STR,
  },
  required: ['n', 'title', 'event', 'text', 'imagePrompt', 'kind'],
};

export const seriesSkill: Skill<SeriesSkillInput> = {
  id: 'series-s16',
  version: '1.0.0',
  chain: 'A',
  temperature: 0.2,
  schema: SERIES_PLAN_SCHEMA,
  build: (input) => {
    if (input.mode === 'panel') {
      const charBlock = (input.bible?.characters || [])
        .map((c) => `- ${c.name} (${c.role}): ${c.visualDescription}`)
        .join('\n');

      return `MISSION PLANCHE HISTORIQUE (PANEL ${input.sceneNumber || 1}) :
Rédige le contenu textuel pédagogique et le prompt de l'illustration pour cette planche de l'infographie historique.

DONNÉES DE LA SCÈNE :
- Numéro : ${input.sceneNumber || 1}
- Titre : "${input.sceneTitle || ''}"
- Événement central : "${input.sceneEvent || ''}"
- Type de planche : "${input.sceneKind || 'scene'}" (scene / roles / map / timeline)
- Époque : "${input.bible?.era || '16ème siècle'}"
- Style visuel uniforme : "${input.bible?.style || 'Historical educational illustration'}"

BIBLE DES PERSONNAGES (À RESPECTER SCRUPULEUSEMENT) :
${charBlock || 'Personnages historiques tunisiens/méditerranéens'}

RÈGLES D'OR :
1. "text" : Paragraphe pédagogique clair, captivant, en Arabe standard pur (RTL), adapté au niveau primaire.
2. "imagePrompt" : Strictement en ANGLAIS. Décris la scène visuelle avec précision historique (vêtements, armes, architecture d'époque).
3. RÈGLE TEXT-FREE ABSOLUE DANS L'IMAGE : L'image ne doit contenir AUCUN texte, AUCUN mot, AUCUN chiffre, AUCUNE lettre latine ou arabe ("NO text, NO words, NO subtitles, text-free").
4. Chiffres occidentaux uniquement (0-9).`;
    }

    // mode === 'plan'
    return `MISSION DÉCOUPAGE SCÉNARISTIQUE HISTORIQUE (S16) :
Tu es un historien et pédagogue tunisien. À partir du cours d'histoire/géographie ci-dessous, établis le plan complet de l'infographie historique en planches A4 reliées et séquentielles.

COURS SOURCE :
"${input.lessonText || input.topic || ''}"

RÈGLES D'ANALYSE HISTORIQUE :
1. Analyse chronologique rigoureuse : contexte ➔ causes ➔ événements marquants ➔ batailles/traités ➔ conséquences.
2. Détermine automatiquement le nombre optimal de planches (entre 4 et 8 planches selon la densité).
3. Ne jamais inventer d'événements, de dates ou de personnages fictifs.
4. Identifie les personnages clés et fixe leur "visualDescription" pour garantir la cohérence visuelle d'une planche à l'autre.
5. Définis pour chaque planche son type (scene, roles, map, timeline).`;
  },
};
