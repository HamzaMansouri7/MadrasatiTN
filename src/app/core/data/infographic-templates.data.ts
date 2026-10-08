import { InfographicTemplate } from '../models/infographic.model';

export const LESSON_PLAN_TEMPLATE_ID = 'lesson-plan-official';

/** Ids written by older versions; they resolve to the current template. */
const TEMPLATE_ALIASES: Record<string, string> = {
  'official-lesson-plan': LESSON_PLAN_TEMPLATE_ID,
};

export const LESSON_PLAN_TEMPLATE: InfographicTemplate = {
  id: LESSON_PLAN_TEMPLATE_ID,
  schemaVersion: 1,
  nameFr: 'Fiche Pédagogique Officielle (Jodhadha)',
  nameAr: 'جذاذة بيداغوجية رسمية (المخطط البيداغوجي)',
  page: 'A4-portrait',
  slots: [
    {
      id: 'info',
      kind: 'header-strip',
      zone: 'strip',
      titleFr: 'Informations Générales',
      titleAr: 'المعطيات العامة للدرس',
      icon: 'info',
      color: '#14251D',
    },
    {
      id: 'objectives',
      kind: 'list',
      zone: 'side',
      variant: 'checks',
      valueKey: 'objectives',
      titleFr: 'Objectifs',
      titleAr: 'الأهداف المميزة للدرس',
      count: 3,
      maxChars: 160,
      icon: 'flag',
      illustration: 'objectives',
      color: '#2D6A4F',
    },
    {
      id: 'outcomes',
      kind: 'list',
      zone: 'side',
      variant: 'bullets',
      valueKey: 'outcomes',
      titleFr: 'Compétences visées',
      titleAr: 'مخرجات التعلم والكفايات',
      count: 2,
      maxChars: 140,
      icon: 'task_alt',
      illustration: 'outcomes',
      color: '#1B4332',
    },
    {
      id: 'materials',
      kind: 'list',
      zone: 'side',
      variant: 'chips',
      valueKey: 'materials',
      titleFr: 'Matériel',
      titleAr: 'الوسائل والمعينات',
      count: 3,
      maxChars: 100,
      icon: 'inventory_2',
      illustration: 'materials',
      color: '#8A5A00',
    },
    {
      id: 'integration',
      kind: 'list',
      zone: 'sidePair',
      variant: 'compact',
      valueKey: 'crossSubjectIntegration',
      titleFr: 'Intégration',
      titleAr: 'الامتدادات',
      count: 2,
      maxChars: 120,
      icon: 'hub',
      illustration: 'integration',
      color: '#2D6A4F',
    },
    {
      id: 'values',
      kind: 'list',
      zone: 'sidePair',
      variant: 'compact',
      valueKey: 'targetValues',
      titleFr: 'Valeurs',
      titleAr: 'القيم المستهدفة',
      count: 2,
      maxChars: 100,
      icon: 'favorite',
      illustration: 'values',
      color: '#BF5B34',
    },
    {
      id: 'stages',
      kind: 'timeline-stages',
      zone: 'main',
      valueKey: 'stages',
      titleFr: 'Déroulement de la séance',
      titleAr: 'سيرورة الدرس',
      count: 5,
      icon: 'view_timeline',
      color: '#2D6A4F',
    },
    {
      id: 'differentiation',
      kind: 'table',
      zone: 'half',
      titleFr: 'Différenciation',
      titleAr: 'الفارق البيداغوجي',
      rows: [
        { labelFr: 'Remédiation :', labelAr: 'الدعم والعلاج :', valueKey: 'supportActivities', color: '#BF5B34' },
        { labelFr: 'Approfondissement :', labelAr: 'التميز والإثراء :', valueKey: 'enrichmentActivities', color: '#2D6A4F' },
      ],
      count: 2,
      icon: 'diversity_3',
      illustration: 'differentiation-support',
      color: '#8A5A00',
    },
    {
      id: 'assessment',
      kind: 'table',
      zone: 'half',
      titleFr: 'Évaluation et travail à la maison',
      titleAr: 'التقييم والعمل المنزلي',
      rows: [
        { labelFr: 'Critères de réussite :', labelAr: 'مؤشرات النجاح :', valueKey: 'assessmentCriteria', color: '#14251D' },
        { labelFr: 'À la maison :', labelAr: 'العمل المنزلي :', valueKey: 'homework', color: '#8A5A00' },
      ],
      count: 2,
      icon: 'fact_check',
      illustration: 'assessment',
      color: '#2D6A4F',
    },
    {
      id: 'reflection',
      kind: 'reflection-lines',
      zone: 'full',
      valueKey: 'reflectionQuestions',
      titleFr: 'Auto-évaluation de l’enseignant',
      titleAr: 'التقييم الذاتي للمعلم',
      count: 4,
      icon: 'psychology_alt',
      illustration: 'reflection',
      color: '#14251D',
    },
  ],
};

export const INFOGRAPHIC_TEMPLATES: InfographicTemplate[] = [
  LESSON_PLAN_TEMPLATE,
];

/** Resolves a stored `templateId` (current or legacy alias) to its template. */
export function getInfographicTemplate(id: string | undefined): InfographicTemplate {
  const resolved = id ? (TEMPLATE_ALIASES[id] ?? id) : LESSON_PLAN_TEMPLATE_ID;
  return INFOGRAPHIC_TEMPLATES.find((t) => t.id === resolved) ?? LESSON_PLAN_TEMPLATE;
}
