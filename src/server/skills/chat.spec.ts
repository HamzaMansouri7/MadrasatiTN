import { describe, it, expect } from 'vitest';
import {
  chatClassifySkill,
  chatAnswerSkill,
  refineIntent,
  allowIntentForRole,
  CHAT_CLASSIFY_SCHEMA,
  CHAT_ANSWER_SCHEMA,
} from './chat';

describe('chat skill', () => {
  it('has the expected skill metadata', () => {
    expect(chatClassifySkill.id).toBe('chat-classify-s20a');
    expect(chatAnswerSkill.id).toBe('chat-answer-s20b');
    expect(chatClassifySkill.chain).toBe('E');
    expect(chatAnswerSkill.chain).toBe('E');
  });

  it('exposes valid schemas', () => {
    expect(CHAT_CLASSIFY_SCHEMA.required).toContain('intent');
    expect(CHAT_ANSWER_SCHEMA.required).toContain('reply');
  });

  describe('refineIntent keyword guard', () => {
    it('routes French generate keywords', () => {
      expect(refineIntent("crée une série d'exercices", 'ask')).toBe('exercises');
      expect(refineIntent('fais-moi un résumé', 'ask')).toBe('memo');
      expect(refineIntent('je veux une fiche pédagogique', 'ask')).toBe('plan');
      expect(refineIntent('génère une infographie', 'ask')).toBe('infographic');
    });

    it('routes Arabic generate keywords (override a wrong model intent)', () => {
      expect(refineIntent('أنشئ سلسلة تمارين حول الجمع', 'plan')).toBe('exercises');
      expect(refineIntent('اعمل لي ملخص لدرس الكسور', 'off_topic')).toBe('memo');
      expect(refineIntent('أريد جذاذة لدرس القراءة', 'ask')).toBe('plan');
    });

    it('blocks a false off_topic when the message is scholarly', () => {
      expect(refineIntent('اشرح لي درس الكسور', 'off_topic')).toBe('ask');
      expect(refineIntent('explique les fractions', 'off_topic')).toBe('ask');
    });

    it('keeps the model intent when nothing matches', () => {
      expect(refineIntent('قصة قصيرة من فضلك', 'ask')).toBe('ask');
      expect(refineIntent('qui gagne les élections', 'off_topic')).toBe('off_topic');
    });
  });

  describe('allowIntentForRole', () => {
    it('downgrades teacher-only intents for parents', () => {
      expect(allowIntentForRole('plan', 'parent')).toBe('ask');
      expect(allowIntentForRole('plan', 'teacher')).toBe('plan');
      expect(allowIntentForRole('exercises', 'parent')).toBe('exercises');
    });
  });
});
