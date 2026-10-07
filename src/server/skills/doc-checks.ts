/** Deterministic post-checks for lesson-plan and series output (the model is never trusted for these). */


/** Eastern/Persian digits → Western (the platform prints Western digits only). */
export function toWesternDigits(s: string): string {
  return s.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) >= 0x06f0 ? c.charCodeAt(0) - 0x06f0 : c.charCodeAt(0) - 0x0660));
}

const westernDeep = <T>(v: T): T => {
  if (typeof v === 'string') return toWesternDigits(v) as T;
  if (Array.isArray(v)) return v.map(westernDeep) as T;
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, westernDeep(x)])) as T;
  }
  return v;
};

/** Western digits everywhere + lists trimmed of blanks. */
export const normalizeDigits = westernDeep;

export interface PlanStage {
  step: string;
  name: string;
  minutes: number;
  teacherActivity: string;
  studentActivity: string;
  modality?: string;
}

/** Exactly 5 stages whose minutes sum to the lesson duration (the last stage absorbs the drift). */
export function fixLessonPlanStages<T extends { stages?: PlanStage[]; durationMinutes?: number }>(plan: T, duration: number): T {
  const stages = (Array.isArray(plan.stages) ? plan.stages : []).slice(0, 5).map((s, i) => ({
    ...s,
    step: String(i + 1).padStart(2, '0'),
    minutes: Math.max(1, Math.round(Number(s.minutes) || 0)),
  }));
  if (stages.length) {
    const sum = stages.reduce((a, s) => a + s.minutes, 0);
    const last = stages[stages.length - 1];
    last.minutes = Math.max(1, last.minutes + (duration - sum));
  }
  return { ...plan, stages, durationMinutes: duration };
}

export const SCENE_KINDS = ['scene', 'roles', 'map', 'timeline'] as const;
export type SceneKindValue = (typeof SCENE_KINDS)[number];

export interface PlannedScene {
  n: number;
  title: string;
  event: string;
  year?: string;
  visualIdea: string;
  kind: string;
  teachingGoal?: string;
}

/** 4–8 scenes, renumbered 1..n, kind forced into the enum. */
export function cleanScenes(scenes: PlannedScene[] | undefined): PlannedScene[] {
  return (Array.isArray(scenes) ? scenes : [])
    .filter((s) => s && typeof s.title === 'string' && s.title.trim())
    .slice(0, 8)
    .map((s, i) => ({
      ...s,
      n: i + 1,
      kind: (SCENE_KINDS as readonly string[]).includes(s.kind) ? s.kind : 'scene',
    }));
}

/** An image prompt must be English and free of any request for written text. */
export function cleanImagePrompt(p: string | undefined): string {
  return (p ?? '').replace(/[\u0600-\u06FF\u0750-\u077F]/g, ' ').replace(/\s+/g, ' ').trim();
}
