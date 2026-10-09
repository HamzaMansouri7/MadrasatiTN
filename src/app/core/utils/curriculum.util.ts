import {
  CurriculumChapter,
  TUNISIAN_CURRICULUM_CHAPTERS,
} from '../data/curriculum-chapters.data';

/**
 * Pure read helpers over the official curriculum list. No Angular imports, so the
 * Express server (grounding) and the client (pickers, tree) share the same lookups.
 */

const BY_ID = new Map<string, CurriculumChapter>(
  TUNISIAN_CURRICULUM_CHAPTERS.map((c) => [c.id, c]),
);

const byOrder = (a: CurriculumChapter, b: CurriculumChapter): number =>
  a.trimester.localeCompare(b.trimester) || (a.order ?? 0) - (b.order ?? 0);

export function chapterById(id?: string | null): CurriculumChapter | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function chaptersFor(
  grade?: string,
  subject?: string,
  trimester?: string,
): CurriculumChapter[] {
  return TUNISIAN_CURRICULUM_CHAPTERS.filter(
    (c) =>
      (!grade || c.grade === grade) &&
      (!subject || c.subject === subject) &&
      (!trimester || c.trimester === trimester),
  ).sort(byOrder);
}

export function chapterTitle(ch: CurriculumChapter, lang: 'ar' | 'fr'): string {
  return lang === 'ar' ? ch.titleAr : ch.titleFr;
}

export interface CurriculumTrimesterNode {
  trimester: CurriculumChapter['trimester'];
  topics: CurriculumChapter[];
}
export interface CurriculumSubjectNode {
  subject: string;
  trimesters: CurriculumTrimesterNode[];
}
export interface CurriculumGradeNode {
  grade: string;
  subjects: CurriculumSubjectNode[];
}

/** grade → subject → trimester → topics, in curriculum order. */
export function curriculumTree(): CurriculumGradeNode[] {
  const grades = new Map<string, Map<string, Map<string, CurriculumChapter[]>>>();
  for (const ch of [...TUNISIAN_CURRICULUM_CHAPTERS].sort(byOrder)) {
    const subjects = grades.get(ch.grade) ?? new Map();
    const trimesters = subjects.get(ch.subject) ?? new Map();
    const topics = trimesters.get(ch.trimester) ?? [];
    topics.push(ch);
    trimesters.set(ch.trimester, topics);
    subjects.set(ch.subject, trimesters);
    grades.set(ch.grade, subjects);
  }
  return [...grades.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([grade, subjects]) => ({
      grade,
      subjects: [...subjects.entries()].map(([subject, trimesters]) => ({
        subject,
        trimesters: [...trimesters.entries()].map(([trimester, topics]) => ({
          trimester: trimester as CurriculumChapter['trimester'],
          topics,
        })),
      })),
    }));
}
