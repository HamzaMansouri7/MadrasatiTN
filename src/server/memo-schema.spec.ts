import { describe, it, expect } from 'vitest';
import { MEMO_SCHEMA, buildMemoPrompt, MemoPromptInput } from './memo-schema';

describe('memo-schema', () => {
  it('MEMO_SCHEMA contains all required contract keys', () => {
    const requiredKeys = ['title', 'grade', 'subject', 'topic', 'language', 'steps', 'cards', 'remember'];
    expect(MEMO_SCHEMA.required).toEqual(expect.arrayContaining(requiredKeys));
    expect(MEMO_SCHEMA.properties).toHaveProperty('title');
    expect(MEMO_SCHEMA.properties).toHaveProperty('subtitle');
    expect(MEMO_SCHEMA.properties).toHaveProperty('steps');
    expect(MEMO_SCHEMA.properties).toHaveProperty('cards');
    expect(MEMO_SCHEMA.properties).toHaveProperty('example');
    expect(MEMO_SCHEMA.properties).toHaveProperty('remember');
    expect(MEMO_SCHEMA.properties).toHaveProperty('formula');
    expect(MEMO_SCHEMA.properties).toHaveProperty('quote');
    expect(MEMO_SCHEMA.properties).toHaveProperty('extractedText');
  });

  it('buildMemoPrompt includes Arabic language rule by default', () => {
    const input: MemoPromptInput = {
      mode: 'topic',
      topic: 'Les déterminants',
      grade: '6ème',
      subject: 'Français',
    };
    const promptAr = buildMemoPrompt(input, 'ar');
    expect(promptAr).toContain('ARABE LITTÉRAIRE');
    expect(promptAr).toContain('RÈGLE LINGUISTIQUE ABSOLUE');
  });

  it('buildMemoPrompt includes French language rule when fr requested', () => {
    const input: MemoPromptInput = {
      mode: 'topic',
      topic: 'Les déterminants',
      grade: '6ème',
      subject: 'Français',
    };
    const promptFr = buildMemoPrompt(input, 'fr');
    expect(promptFr).toContain('FRANÇAIS');
    expect(promptFr).toContain('RÈGLE LINGUISTIQUE ABSOLUE');
  });

  it('buildMemoPrompt enforces teacher-wording rule for text, image, and file modes', () => {
    const modes: ('text' | 'image' | 'file')[] = ['text', 'image', 'file'];
    for (const mode of modes) {
      const prompt = buildMemoPrompt({ mode, text: 'Exemple de règle' }, 'fr');
      expect(prompt).toContain('RÈGLE DE FIDÉLITÉ STRICTE');
      expect(prompt).toContain("Conserve fidèlement la terminologie et la formulation de l'enseignant");
    }
  });

  it('buildMemoPrompt supports blockToRegenerate mode', () => {
    const prompt = buildMemoPrompt(
      {
        mode: 'topic',
        topic: 'Les déterminants',
        blockToRegenerate: 'cards',
        currentMemo: { title: 'Test' },
      },
      'fr',
    );
    expect(prompt).toContain('Régénère UNIQUEMENT le bloc "cards"');
  });
});
