import { LessonPlanStage, SourceInput } from '@core';
import { CalloutVariant, EditorBlock } from '../editor.model';

type Lang = 'ar' | 'fr';

/** Values returned by POST /api/ai/generate-lesson-plan (doc.values). */
export interface LessonPlanValues {
  topic?: string;
  durationMinutes?: number;
  objectives?: string[];
  outcomes?: string[];
  materials?: string[];
  stages?: LessonPlanStage[];
  supportActivities?: string[];
  enrichmentActivities?: string[];
  assessmentCriteria?: string[];
  homework?: string[];
  crossSubjectIntegration?: string[];
  targetValues?: string[];
  reflectionQuestions?: string[];
}

/** One rewritable part of the sheet: `key` is stored on its block as `sectionKey`. */
interface Section {
  key: keyof LessonPlanValues;
  fr: string;
  ar: string;
  /** Heading drawn above the block; callouts carry their own title instead. */
  heading?: { fr: string; ar: string };
  callout?: CalloutVariant;
}

const SECTIONS: Section[] = [
  { key: 'objectives', fr: 'Objectifs spécifiques', ar: 'الأهداف المميزة للدرس', heading: { fr: 'Objectifs spécifiques', ar: 'الأهداف المميزة للدرس' } },
  { key: 'outcomes', fr: 'Compétences visées', ar: 'مخرجات التعلم والكفايات', heading: { fr: 'Compétences visées', ar: 'مخرجات التعلم والكفايات' } },
  { key: 'materials', fr: 'Matériel', ar: 'الوسائل والمعينات', heading: { fr: 'Matériel', ar: 'الوسائل والمعينات' } },
  { key: 'stages', fr: 'Déroulement de la séance', ar: 'سيرورة الدرس', heading: { fr: 'Déroulement de la séance', ar: 'سيرورة الدرس' } },
  { key: 'supportActivities', fr: 'Remédiation', ar: 'الدعم والعلاج', heading: { fr: 'Différenciation', ar: 'الفارق البيداغوجي' }, callout: 'tip' },
  { key: 'enrichmentActivities', fr: 'Approfondissement', ar: 'التميّز والإثراء', callout: 'info' },
  { key: 'assessmentCriteria', fr: 'Critères de réussite', ar: 'مؤشرات النجاح', heading: { fr: 'Évaluation et travail à la maison', ar: 'التقييم والعمل المنزلي' }, callout: 'ministry' },
  { key: 'homework', fr: 'À la maison', ar: 'العمل المنزلي', callout: 'info' },
  { key: 'crossSubjectIntegration', fr: 'Intégration', ar: 'الامتدادات', heading: { fr: 'Intégration et valeurs', ar: 'الامتدادات والقيم' }, callout: 'info' },
  { key: 'targetValues', fr: 'Valeurs', ar: 'القيم المستهدفة', callout: 'tip' },
  { key: 'reflectionQuestions', fr: 'Auto-évaluation de l’enseignant', ar: 'التقييم الذاتي للمعلّم', heading: { fr: 'Après la séance', ar: 'بعد الحصة' }, callout: 'ministry' },
];

export const LESSON_PLAN_SECTION_KEYS = SECTIONS.map((s) => s.key as string);

const PLACEHOLDER: Record<Lang, string> = { ar: 'اكتب هنا…', fr: 'Écrire ici…' };

/** Default 5-stage active approach (same split as the lesson-plan skill), scaled to the session length. */
export function defaultStages(lang: Lang, minutes = 45): LessonPlanStage[] {
  const names: Record<Lang, string[]> = {
    ar: ['وضعية الانطلاق', 'البناء والتعلّم', 'التدريب والتطبيق', 'التقييم والدعم', 'الغلق والامتداد'],
    fr: ['Mise en situation', 'Construction', 'Entraînement', 'Évaluation', 'Synthèse'],
  };
  const shares = [0.15, 0.4, 0.25, 0.1, 0.1];
  const parts = shares.map((s) => Math.max(1, Math.round(minutes * s)));
  parts[1] += minutes - parts.reduce((a, b) => a + b, 0);
  return names[lang].map((name, i) => ({ step: String(i + 1), name, minutes: parts[i], teacherActivity: '', studentActivity: '' }));
}

const asList = (items: string[] | undefined): string => (items ?? []).filter(Boolean).map((s) => `- ${s}`).join('\n');

/** Block for one section, filled from `values` (or empty with a placeholder). */
export function sectionBlock(section: Section, values: LessonPlanValues, lang: Lang, id: () => string): EditorBlock {
  const title = lang === 'ar' ? section.ar : section.fr;
  if (section.key === 'stages') {
    const stages = values.stages?.length ? values.stages : defaultStages(lang, values.durationMinutes);
    return { id: id(), type: 'stages', sectionKey: 'stages', content: '', stages };
  }
  const content = asList(values[section.key] as string[] | undefined);
  if (section.callout) {
    return { id: id(), type: 'callout', sectionKey: section.key, calloutTitle: title, calloutVariant: section.callout, content, placeholder: PLACEHOLDER[lang] };
  }
  return { id: id(), type: 'paragraph', sectionKey: section.key, content, placeholder: PLACEHOLDER[lang] };
}

/** The whole sheet: official header, session line, then every section in order. */
export function lessonPlanBlocks(values: LessonPlanValues, lang: Lang, id: () => string): EditorBlock[] {
  const t = (fr: string, ar: string) => (lang === 'ar' ? ar : fr);
  const minutes = values.durationMinutes || 45;
  const blocks: EditorBlock[] = [
    { id: id(), type: 'cartouche', content: '' },
    {
      id: id(),
      type: 'paragraph',
      sectionKey: 'info',
      content: t(`Durée : ${minutes} min    Semaine : ……    Date : ……`, `المدة : ${minutes} دقيقة    الأسبوع : ……    التاريخ : ……`),
    },
  ];
  for (const s of SECTIONS) {
    if (s.heading) blocks.push({ id: id(), type: 'heading2', content: t(s.heading.fr, s.heading.ar) });
    blocks.push(sectionBlock(s, values, lang, id));
  }
  return blocks;
}

/** Replaces one section's block content with freshly generated values, keeping the block id and position. */
export function refillSection(block: EditorBlock, values: LessonPlanValues, lang: Lang): EditorBlock {
  const section = SECTIONS.find((s) => s.key === block.sectionKey);
  if (!section) return block;
  const fresh = sectionBlock(section, values, lang, () => block.id);
  return { ...block, content: fresh.content, stages: fresh.stages };
}

/** Request body for /api/ai/generate-lesson-plan from a Create-hub source (same mapping as the store). */
export function lessonPlanRequest(
  src: SourceInput,
  ctx: { grade: string; subject: string; trimester: string; topicId?: string; language: Lang; durationMinutes?: number; sectionToRegenerate?: string },
) {
  const files: { data: string; mimeType: string }[] = [];
  for (const p of (src.photos ?? src.images ?? []).slice(0, 3)) {
    if (p.base64Data) files.push({ data: p.base64Data, mimeType: p.contentType || 'image/jpeg' });
  }
  const sourceFiles: ({ data: string; mimeType: string } | { url: string })[] = files;
  if (src.file?.base64Data && files.length < 3) files.push({ data: src.file.base64Data, mimeType: src.file.contentType || 'application/pdf' });
  if (src.resourceUrl) sourceFiles.push({ url: src.resourceUrl });
  return {
    topic: src.topic,
    topicId: ctx.topicId ?? src.topicId,
    grade: ctx.grade,
    subject: ctx.subject,
    trimester: ctx.trimester,
    language: ctx.language,
    lessonText: src.text,
    instructions: src.instructions,
    durationMinutes: ctx.durationMinutes ?? src.durationMinutes,
    sectionToRegenerate: ctx.sectionToRegenerate,
    sourceFiles: sourceFiles.length ? sourceFiles : undefined,
  };
}

/** Plain text of a stages block, for the library copy and Word export. */
export function stagesText(stages: LessonPlanStage[] | undefined, lang: Lang): string {
  const t = (fr: string, ar: string) => (lang === 'ar' ? ar : fr);
  return (stages ?? [])
    .map((s, i) => `${i + 1}. ${s.name} (${s.minutes} ${t('min', 'دق')})\n  ${t('Enseignant', 'المعلّم')} : ${s.teacherActivity}\n  ${t('Élèves', 'التلاميذ')} : ${s.studentActivity}`)
    .join('\n');
}
