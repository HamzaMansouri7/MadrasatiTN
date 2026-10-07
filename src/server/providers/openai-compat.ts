/**
 * Generic OpenAI-compatible API client for OpenRouter, Mistral, and Cloudflare AI.
 */

export type GeminiPart = { inlineData: { mimeType: string; data: string } } | { text: string };

/**
 * Converts a Gemini / @google/genai schema (with uppercase Type enum) to standard JSON Schema.
 */
export function geminiSchemaToJsonSchema(schema: unknown): unknown {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  if (Array.isArray(schema)) {
    return schema.map(geminiSchemaToJsonSchema);
  }

  const s = schema as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(s)) {
    if (key === 'type' && typeof val === 'string') {
      result['type'] = val.toLowerCase();
    } else if (key === 'properties' && val && typeof val === 'object' && !Array.isArray(val)) {
      const convertedProps: Record<string, unknown> = {};
      for (const [propKey, propVal] of Object.entries(val as Record<string, unknown>)) {
        convertedProps[propKey] = geminiSchemaToJsonSchema(propVal);
      }
      result['properties'] = convertedProps;
    } else if (key === 'items' && val && typeof val === 'object') {
      result['items'] = geminiSchemaToJsonSchema(val);
    } else {
      result[key] = val;
    }
  }

  return result;
}

export interface OpenAICompatOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  contents: string | GeminiPart[];
  schema?: object;
  temperature?: number;
  signal?: AbortSignal;
}

export async function callOpenAICompat(options: OpenAICompatOptions): Promise<Record<string, unknown>> {
  const { baseUrl, apiKey, model, contents, schema, temperature = 0.4, signal } = options;

  if (baseUrl.includes('openrouter.ai') && !model.endsWith(':free')) {
    throw new Error('OpenRouter only allows :free models');
  }

  const parts = typeof contents === 'string' ? [{ text: contents }] : contents;
  const contentItems: Record<string, unknown>[] = parts.map((p) => {
    if ('text' in p) {
      return { type: 'text', text: p.text };
    }
    return {
      type: 'image_url',
      image_url: { url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}` },
    };
  });

  const convertedSchema = schema ? geminiSchemaToJsonSchema(schema) : undefined;
  if (convertedSchema) {
    contentItems.push({
      type: 'text',
      text: `Réponds uniquement avec un objet JSON valide respectant ce schéma :\n${JSON.stringify(convertedSchema)}`,
    });
  }

  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const url = `${cleanBaseUrl}/chat/completions`;

  const timeoutSignal = AbortSignal.timeout(60000);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: contentItems }],
      response_format: { type: 'json_object' },
      temperature,
    }),
    signal: combinedSignal,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${baseUrl}: ${await res.text().catch(() => '')}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const rawText = (data.choices?.[0]?.message?.content || '').replace(/```json/g, '').replace(/```/g, '').trim();
  if (!rawText) {
    throw new Error('Réponse vide du fournisseur');
  }

  return JSON.parse(rawText) as Record<string, unknown>;
}
