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
  // Gemini sends httpOptions.timeout to the API as a request deadline and rejects anything under 10s
  // ("Manually set deadline Xs is too short. Minimum allowed deadline is 10s."), so never go below 10000.
  const timeoutMs = Math.max(10000, parseInt(process.env['GEMINI_TIMEOUT_MS'] || '15000', 10));
  const client = new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      timeout: timeoutMs,
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const combined = signal
          ? (init?.signal ? AbortSignal.any([signal, init.signal]) : signal)
          : init?.signal;
        return fetch(input, { ...init, signal: combined });
      },
    },
  });

  const config: Record<string, unknown> = {
    responseMimeType: 'application/json',
    temperature: temp,
    abortSignal: signal,
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
