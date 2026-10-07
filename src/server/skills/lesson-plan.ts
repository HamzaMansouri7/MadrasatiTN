import { Type } from '@google/genai';
import { Skill } from './types';

export interface LessonPlanSkillInput {
  grade?: string;
  subject?: string;
  topic?: string;
  durationMinutes?: number;
  instructions?: string;
  sectionToRegenerate?: string;
  lang?: 'ar' | 'fr';
}

const STR = { type: Type.STRING } as const;
const NUM = { type: Type.NUMBER } as const;
const STR_ARR = { type: Type.ARRAY, items: STR } as const;

export const LESSON_PLAN_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    grade: STR,
    subject: STR,
    topic: STR,
    durationMinutes: NUM,
    objectives: STR_ARR,
    outcomes: STR_ARR,
    materials: STR_ARR,
    stages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          step: STR,
          name: STR,
          minutes: NUM,
          teacherActivity: STR,
          studentActivity: STR,
          modality: STR,
        },
        required: ['step', 'name', 'minutes', 'teacherActivity', 'studentActivity'],
      },
    },
    assessmentCriteria: STR_ARR,
    supportActivities: STR_ARR,
    enrichmentActivities: STR_ARR,
    crossSubjectIntegration: STR_ARR,
    targetValues: STR_ARR,
    homework: STR_ARR,
    reflectionQuestions: STR_ARR,
  },
  required: [
    'grade',
    'subject',
    'topic',
    'durationMinutes',
    'objectives',
    'outcomes',
    'materials',
    'stages',
    'assessmentCriteria',
    'supportActivities',
    'enrichmentActivities',
    'crossSubjectIntegration',
    'targetValues',
    'homework',
    'reflectionQuestions',
  ],
};

export const lessonPlanSkill: Skill<LessonPlanSkillInput> = {
  id: 'lesson-plan-s15',
  version: '1.0.0',
  chain: 'A',
  temperature: 0.2,
  schema: LESSON_PLAN_SCHEMA,
  build: (input) => {
    const totalMin = input.durationMinutes || 45;
    const parts: string[] = [
      `MISSION PLAN DE LEÇON / JODHADHA (S15) :
Tu es un inspecteur pédagogique de l'enseignement primaire tunisien. Conçois une fiche pédagogique officielle (جذاذة بيداغوجية) complète, rigoureuse et directement applicable en classe.

RÈGLES DIDACTIQUES IMPÉRATIVES :
1. Conforme au programme officiel tunisien (CNP) pour le niveau "${input.grade || '4ème Année'}" et la discipline "${input.subject || 'Mathématiques'}".
2. Titre / Notion : "${input.topic || 'Leçon de base'}".
3. Durée totale : ${totalMin} minutes. La somme des minutes des 5 étapes DOIT ÊTRE EXACTEMENT ÉGALE À ${totalMin} minutes.
4. Les 5 étapes de la démarche active tunisienne :
   - Étape 01 : وضعية الانطلاق / الاستكشاف (Intro / Situation déclenchante) [~15% du temps]
   - Étape 02 : البناء والتعلم المنهجي (Construction / Démarche d'apprentissage) [~40% du temps]
   - Étape 03 : التدريب والتطبيق (Entraînement / Application) [~25% du temps]
   - Étape 04 : التقييم والدعم الفوري (Évaluation formative) [~10% du temps]
   - Étape 05 : الغلق والامتداد (Synthèse / Prolongement) [~10% du temps]
5. Rédige des formulations concrètes pour les activités du maître et les activités des élèves (comportements observables).
6. Différenciation : prévois 2 actions de remédiation pour les élèves en difficulté et 2 activités d'approfondissement pour les élèves avancés.
7. Chiffres occidentaux uniquement (0-9). Pas de chiffres orientaux.`,
    ];

    if (input.sectionToRegenerate) {
      parts.push(`REMARQUE SPÉCIALE : Tu dois régénérer en priorité et avec un soin particulier la rubrique "${input.sectionToRegenerate}".`);
    }

    if (input.instructions) {
      parts.push(`Consignes pédagogiques complémentaires de l'enseignant : "${input.instructions}"`);
    }

    return parts.join('\n\n');
  },
};
