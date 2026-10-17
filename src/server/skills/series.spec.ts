import { describe, expect, it } from 'vitest';
import { seriesSkill, SERIES_PANEL_SCHEMA, SERIES_PLAN_SCHEMA } from './series';

describe('seriesSkill: قصة الدرس vs Histoire', () => {
  it('generates storybook prompt for Arabic reading lesson', () => {
    const prompt = seriesSkill.build({
      mode: 'plan',
      subject: 'اللغة العربية',
      grade: '4ème Année',
      topic: 'رحلة السندباد في الجزيرة',
      lessonText: 'نص القراءة من الكتاب المدرسي الرسمي',
    });

    expect(prompt).toContain('قصة الدرس');
    expect(prompt).toContain('Children\'s storybook illustration');
    expect(prompt).toContain('question');
    expect(prompt).toContain('answer');
  });

  it('generates historical documentary prompt for History subject', () => {
    const prompt = seriesSkill.build({
      mode: 'plan',
      subject: 'Histoire & Géographie',
      grade: '5ème Année',
      topic: 'الدولة الأغلبية وتأسيس القيروان',
      lessonText: 'فتح إفريقية وتأسيس جامع عقبة بن نافع',
    });

    expect(prompt).toContain('MISSION DÉCOUPAGE SCÉNARISTIQUE HISTORIQUE');
    expect(prompt).toContain('Historical educational illustration');
    expect(prompt).toContain('question');
    expect(prompt).toContain('answer');
  });

  it('generates panel prompt with speech bubble and text-free rules for storybook', () => {
    const prompt = seriesSkill.build({
      mode: 'panel',
      subject: 'Français',
      sceneNumber: 2,
      sceneTitle: 'La rencontre dans la forêt',
      sceneEvent: 'Le petit garçon découvre un renard blessé',
    });

    expect(prompt).toContain('speechBubbleText');
    expect(prompt).toContain('speechBubbleSpeaker');
    expect(prompt).toContain('NO text, NO words');
    expect(prompt).toContain('question');
  });

  it('has valid schemas containing question and answer properties', () => {
    const planSceneProps = (SERIES_PLAN_SCHEMA.properties.scenes.items as { properties: Record<string, unknown> }).properties;
    expect(planSceneProps.question).toBeDefined();
    expect(planSceneProps.answer).toBeDefined();

    const panelProps = SERIES_PANEL_SCHEMA.properties as Record<string, unknown>;
    expect(panelProps.question).toBeDefined();
    expect(panelProps.answer).toBeDefined();
    expect(panelProps.speechBubbleText).toBeDefined();
  });
});
