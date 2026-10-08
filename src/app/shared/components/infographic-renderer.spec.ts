import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { getInfographicTemplate, InfographicDoc, LESSON_PLAN_TEMPLATE, LESSON_PLAN_TEMPLATE_ID } from '@core';
import { InfographicRendererComponent } from './infographic-renderer';

const doc: InfographicDoc = {
  id: 'doc-1',
  templateId: LESSON_PLAN_TEMPLATE_ID,
  title: 'الحال وأنواعه',
  grade: '1ère Année',
  subject: 'Arabe',
  language: 'ar',
  values: {
    durationMinutes: 60,
    objectives: ['هدف أول', 'هدف ثان'],
    outcomes: ['ناتج'],
    materials: ['سبورة'],
    crossSubjectIntegration: ['التاريخ'],
    targetValues: ['الاحترام'],
    stages: [
      { step: '01', name: 'التمهيد', minutes: 10, teacherActivity: 'يعرض', studentActivity: 'يلاحظ' },
      { step: '02', name: 'البناء', minutes: 20, teacherActivity: 'يشرح', studentActivity: 'يدون' },
    ],
    supportActivities: ['جمل مبسطة'],
    enrichmentActivities: ['كتابة جمل'],
    assessmentCriteria: ['صحة الحال'],
    homework: ['فقرة'],
    reflectionQuestions: ['هل فهم المتعلمون؟'],
  },
};

describe('getInfographicTemplate', () => {
  it('resolves the legacy id written by older versions', () => {
    expect(getInfographicTemplate('official-lesson-plan')).toBe(LESSON_PLAN_TEMPLATE);
  });

  it('falls back to the lesson plan for unknown or missing ids', () => {
    expect(getInfographicTemplate('nope')).toBe(LESSON_PLAN_TEMPLATE);
    expect(getInfographicTemplate(undefined)).toBe(LESSON_PLAN_TEMPLATE);
  });
});

describe('InfographicRendererComponent', () => {
  function render(): HTMLElement {
    const fixture = TestBed.createComponent(InfographicRendererComponent);
    fixture.componentRef.setInput('template', LESSON_PLAN_TEMPLATE);
    fixture.componentRef.setInput('doc', doc);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders every slot of the template from the doc values', () => {
    const text = render().textContent ?? '';
    for (const expected of ['هدف أول', 'ناتج', 'سبورة', 'التاريخ', 'الاحترام', 'التمهيد', 'البناء', 'جمل مبسطة', 'كتابة جمل', 'صحة الحال', 'فقرة', 'هل فهم المتعلمون؟']) {
      expect(text).toContain(expected);
    }
  });

  it('sums stage minutes and shows the duration from values', () => {
    const text = render().textContent ?? '';
    expect(text).toContain('30');
    expect(text).toContain('60');
  });

  it('shows the section titles from the template', () => {
    const text = render().textContent ?? '';
    for (const slot of LESSON_PLAN_TEMPLATE.slots.filter((s) => s.kind !== 'header-strip')) {
      expect(text).toContain(slot.titleAr);
    }
  });
});
