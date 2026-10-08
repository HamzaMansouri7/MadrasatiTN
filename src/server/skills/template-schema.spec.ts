import { describe, expect, it } from 'vitest';
import { LESSON_PLAN_TEMPLATE } from '../../app/core/data/infographic-templates.data';
import { LESSON_PLAN_SCHEMA, lessonPlanSkill } from './lesson-plan';
import { templateBudgetRules } from './template-schema';

// The hand-written schema this one replaced: the generated schema must keep exactly these fields.
const LEGACY_KEYS = [
  'grade', 'subject', 'topic', 'durationMinutes',
  'objectives', 'outcomes', 'materials', 'stages',
  'assessmentCriteria', 'supportActivities', 'enrichmentActivities',
  'crossSubjectIntegration', 'targetValues', 'homework', 'reflectionQuestions',
];

describe('lesson plan schema built from the template', () => {
  it('has exactly the fields the hand-written schema had, all required', () => {
    expect(Object.keys(LESSON_PLAN_SCHEMA.properties).sort()).toEqual([...LEGACY_KEYS].sort());
    expect([...LESSON_PLAN_SCHEMA.required].sort()).toEqual([...LEGACY_KEYS].sort());
  });

  it('keeps the stage item shape', () => {
    const stages = LESSON_PLAN_SCHEMA.properties['stages'] as { items: { required: string[] } };
    expect(stages.items.required).toEqual(['step', 'name', 'minutes', 'teacherActivity', 'studentActivity']);
  });

  it('covers every value key the template slots read', () => {
    const keys = new Set(Object.keys(LESSON_PLAN_SCHEMA.properties));
    for (const slot of LESSON_PLAN_TEMPLATE.slots) {
      if (slot.valueKey) expect(keys.has(slot.valueKey)).toBe(true);
      for (const row of slot.rows ?? []) expect(keys.has(row.valueKey)).toBe(true);
    }
  });
});

describe('template budget rules', () => {
  it('states the slot limits and ends up in the lesson plan prompt', () => {
    const rules = templateBudgetRules(LESSON_PLAN_TEMPLATE);
    expect(rules).toContain('objectives : au maximum 3 éléments, 160 caractères maximum par élément');
    expect(lessonPlanSkill.build({ grade: '4ème Année', subject: 'Maths', topic: 'x' })).toContain(rules);
  });
});
