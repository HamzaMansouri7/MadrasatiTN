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
  timeoutMs?: number;
}

export async function callOpenAICompat(options: OpenAICompatOptions): Promise<Record<string, unknown>> {
  const { baseUrl, apiKey, model, contents, schema, temperature = 0.4, signal } = options;

  if (baseUrl.includes('openrouter.ai') && !model.endsWith(':free')) {
    throw new Error('OpenRouter only allows :free models');
  }

  const parts = typeof contents === 'string' ? [{ text: contents }] : contents;
  const hasImage = parts.some((p) => !('text' in p));
  const schemaNote = schema
    ? `\n\nRéponds uniquement avec un objet JSON valide respectant ce schéma :\n${JSON.stringify(geminiSchemaToJsonSchema(schema))}`
    : '';

  // Cloudflare's OpenAI-compatible endpoint requires `content` as a plain string for text-only messages
  // (an array is rejected: "Type mismatch of '/messages/0/content', 'string' not in 'array'").
  // Only use the multimodal array form when the request actually carries an image.
  let messageContent: unknown;
  if (hasImage) {
    const contentItems: Record<string, unknown>[] = parts.map((p) =>
      'text' in p
        ? { type: 'text', text: p.text }
        : { type: 'image_url', image_url: { url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}` } },
    );
    if (schemaNote) contentItems.push({ type: 'text', text: schemaNote });
    messageContent = contentItems;
  } else {
    messageContent = parts.map((p) => ('text' in p ? p.text : '')).join('\n') + schemaNote;
  }

  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const url = `${cleanBaseUrl}/chat/completions`;

  const timeoutMs = options.timeoutMs ?? Math.max(1000, parseInt(process.env['OPENAI_COMPAT_TIMEOUT_MS'] || '12000', 10));
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: messageContent }],
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
