import { Type } from '@google/genai';
import { Skill } from './types';

export interface ExamSkillInput {
  grade?: string;
  subject?: string;
  trimester?: string;
  topic?: string;
  topics?: string;
  lang?: 'ar' | 'fr';
}

const STR = { type: Type.STRING } as const;
const NUM = { type: Type.NUMBER } as const;
const STR_ARR = { type: Type.ARRAY, items: STR } as const;

export const EXAM_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    examTitle: STR,
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: STR,
          exerciseTitle: STR,
          points: NUM,
          promptText: STR,
          solutionText: STR,
          hints: STR_ARR,
        },
        required: ['heading', 'exerciseTitle', 'points', 'promptText', 'solutionText'],
      },
    },
  },
  required: ['examTitle', 'sections'],
};

export function getExamSkeleton(subject?: string, lang?: 'ar' | 'fr'): {
  section1: string;
  section2: string;
  section3: string;
} {
  const norm = (subject || '').toLowerCase();
  const isArabic = lang === 'ar' || norm.includes('arabe') || norm.includes('عربية');
  const isFrench = norm.includes('français') || norm.includes('francais');

  if (norm.includes('math') || norm.includes('رياضيات')) {
    return isArabic
      ? {
          section1: 'أنشطة عددية وحساب (6 نقاط) : معارف مباشرة وتطبيقات حسابية',
          section2: 'هندسة وقيس (6 نقاط) : تعرف على الأشكال الهندسية والتحويلات ووحدات القيس',
          section3: 'حل مسائل ووضعية إدماجية (8 نقاط) : وضعية دالة من الحياة اليومية تتطلب خطوات متعددة',
        }
      : {
          section1: 'Activités Numériques & Calcul (6 points) : connaissances directes et calcul posé/mental',
          section2: 'Géométrie et Mesure (6 points) : repérage, figures usuelles, conversions et mesures',
          section3: 'Résolution de Problème / Situation d\'Intégration (8 points) : situation réaliste à étapes',
        };
  }

  if (isArabic) {
    return {
      section1: 'فهم النص والقراءة (6 نقاط) : أسئلة فهم صريح وضمني حول نص تربوي ملائم',
      section2: 'قواعد اللغة (6 نقاط) : نحو، صرف، ورسم إملائي مطابق للمستوى الرسمي',
      section3: 'الإنتاج الكتابي (8 نقاط) : وضعية تواصلية لكتابة نص منظم وفق معايير التقييم',
    };
  }

  if (isFrench) {
    return {
      section1: 'Lecture-Compréhension (6 points) : texte court et questions de compréhension explicite/implicite',
      section2: 'Fonctionnement de la Langue (6 points) : grammaire, conjugaison et orthographe d\'usage',
      section3: 'Production Écrite (8 points) : situation d\'intégration et rédaction guidée avec critères',
    };
  }

  return {
    section1: 'Connaissances Fondamentales (6 points) : vérification directe des notions clés',
    section2: 'Application & Analyse (6 points) : mise en pratique guidée sur cas concrets',
    section3: 'Synthèse & Situation d\'Intégration (8 points) : mobilisation globale des acquis du trimestre',
  };
}

export function enforceExamTotal20(exam: { sections?: Array<{ points?: number }> }): void {
  if (!Array.isArray(exam.sections) || exam.sections.length === 0) return;
  const total = exam.sections.reduce((sum, s) => sum + (Number(s.points) || 0), 0);
  if (total !== 20) {
    if (exam.sections.length === 3) {
      const official = [6, 6, 8];
      exam.sections.forEach((s, idx) => {
        s.points = official[idx];
      });
    } else {
      // Scale proportionally or set default
      const share = Math.floor(20 / exam.sections.length);
      let rem = 20 - share * exam.sections.length;
      exam.sections.forEach((s) => {
        s.points = share + (rem > 0 ? 1 : 0);
        if (rem > 0) rem--;
      });
    }
  }
}

export const examSkill: Skill<ExamSkillInput> = {
  id: 'exam-s4',
  version: '1.0.0',
  chain: 'A',
  temperature: 0.3,
  schema: EXAM_SCHEMA,
  build: (input) => {
    const rawTopic = input.topic || input.topics || '';
    const skeleton = getExamSkeleton(input.subject, input.lang);

    return [
      `OBJECTIF PÉDAGOGIQUE (S4) : Conçois une Évaluation Somnative / Devoir de Synthèse officiel pour l'école primaire tunisienne.`,
      `CADRE OFFICIEL ET STRUCTURE :`,
      `- Niveau : ${input.grade || '4ème Année'}`,
      `- Matière : ${input.subject || 'Mathématiques'}`,
      `- Période : ${input.trimester || 'Trimestre 1'}`,
      `- Thèmes ciblés : ${rawTopic || 'Programme officiel complet de la période'}`,
      ``,
      `RÉPARTITION DU BARÈME (OBLIGATOIREMENT EXACTEMENT 20 POINTS) :`,
      `1. Section 1 (6 points) : ${skeleton.section1}`,
      `2. Section 2 (6 points) : ${skeleton.section2}`,
      `3. Section 3 (8 points) : ${skeleton.section3}`,
      ``,
      `EXIGENCES DE QUALITÉ :`,
      `- Énoncés progressifs, clairs et sans ambiguïté.`,
      `- Solution détaillée complète pour chaque exercice avec barème partiel sous-entendu.`,
      `- Respect strict du niveau cognitif et du lexique officiel du palier scolaire.`,
    ].join('\n');
  },
};
