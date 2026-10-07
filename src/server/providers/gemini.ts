import { GoogleGenAI } from '@google/genai';
import { ProviderStep } from '../ai/types';
import { GeminiPart } from './openai-compat';

/**
 * Executes a Gemini model call with responseSchema JSON configuration.
 */
export async function callGemini(
  step: ProviderStep,
  key: string,
  contents: string | GeminiPart[],
  schema?: object,
  temp = 0.4,
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  const client = new GoogleGenAI({
    apiKey: key,
    httpOptions: { timeout: 60000 },
  });

  const config: Record<string, unknown> = {
    responseMimeType: 'application/json',
    temperature: temp,
  };
  if (schema) {
    config['responseSchema'] = schema;
  }

  // If signal is aborted before calling
  if (signal?.aborted) {
    throw new Error('Call aborted');
  }

  const response = await client.models.generateContent({
    model: step.model,
    contents,
    config,
  });

  if (signal?.aborted) {
    throw new Error('Call aborted');
  }

  const text = (response.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
  if (!text) {
    throw new Error('Réponse vide');
  }

  return JSON.parse(text) as Record<string, unknown>;
}
