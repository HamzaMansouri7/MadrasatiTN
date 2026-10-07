import { describe, it, expect } from 'vitest';
import { Type } from '@google/genai';
import { geminiSchemaToJsonSchema, callOpenAICompat } from './openai-compat';

describe('openai-compat provider', () => {
  describe('geminiSchemaToJsonSchema', () => {
    it('converts uppercase Gemini types to lowercase JSON schema types', () => {
      const geminiSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          points: { type: Type.INTEGER },
          isPublished: { type: Type.BOOLEAN },
          score: { type: Type.NUMBER },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['title', 'points'],
      };

      const jsonSchema = geminiSchemaToJsonSchema(geminiSchema) as Record<string, unknown>;

      expect(jsonSchema['type']).toBe('object');
      const props = jsonSchema['properties'] as Record<string, Record<string, unknown>>;
      expect(props['title']['type']).toBe('string');
      expect(props['points']['type']).toBe('integer');
      expect(props['isPublished']['type']).toBe('boolean');
      expect(props['score']['type']).toBe('number');
      expect(props['tags']['type']).toBe('array');
      expect((props['tags']['items'] as Record<string, unknown>)['type']).toBe('string');
      expect(jsonSchema['required']).toEqual(['title', 'points']);
    });

    it('converts deeply nested object structures', () => {
      const nested = {
        type: Type.OBJECT,
        properties: {
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                heading: { type: Type.STRING },
                answer: { type: Type.BOOLEAN },
              },
              required: ['heading'],
            },
          },
        },
      };

      const converted = geminiSchemaToJsonSchema(nested) as {
        type: string;
        properties: {
          sections: {
            type: string;
            items: {
              type: string;
              properties: { heading: { type: string }; answer: { type: string } };
              required: string[];
            };
          };
        };
      };
      expect(converted.type).toBe('object');
      expect(converted.properties.sections.type).toBe('array');
      expect(converted.properties.sections.items.type).toBe('object');
      expect(converted.properties.sections.items.properties.heading.type).toBe('string');
      expect(converted.properties.sections.items.properties.answer.type).toBe('boolean');
      expect(converted.properties.sections.items.required).toEqual(['heading']);
    });
  });

  describe('callOpenAICompat :free enforcement', () => {
    it('rejects non-:free models when calling OpenRouter', async () => {
      await expect(
        callOpenAICompat({
          baseUrl: 'https://openrouter.ai/api/v1',
          apiKey: 'fake-key',
          model: 'openai/gpt-4o', // Not ending with :free
          contents: 'hello',
        }),
      ).rejects.toThrow('OpenRouter only allows :free models');
    });
  });
});
