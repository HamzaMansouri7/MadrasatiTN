import { ProviderStep } from '../ai/types';
export { callGemini } from './gemini';
export { callOpenAICompat, geminiSchemaToJsonSchema, GeminiPart, OpenAICompatOptions } from './openai-compat';

export interface ProviderEndpointConfig {
  baseUrl: string;
  apiKey: string;
}

/**
 * Maps external AI providers to their base URL and environment API key.
 */
export function getProviderEndpoint(providerOrStep: string | ProviderStep): ProviderEndpointConfig | null {
  const provider = typeof providerOrStep === 'string' ? providerOrStep : providerOrStep.provider;
  const id = typeof providerOrStep === 'string' ? providerOrStep : providerOrStep.id;

  if (provider === 'cloudflare' || id.startsWith('cf-')) {
    const accountId = (process.env['CLOUDFLARE_ACCOUNT_ID'] || '').trim();
    const token = (process.env['CLOUDFLARE_API_TOKEN'] || process.env['CLOUDFLARE_TOKEN'] || '')
      .trim()
      .replace(/^["']|["']$/g, '');
    if (!accountId || !token) return null;
    return {
      baseUrl: `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`,
      apiKey: token,
    };
  }

  if (provider === 'mistral' || id.startsWith('mistral-')) {
    const key = (process.env['MISTRAL_API_KEY'] || '').trim().replace(/^["']|["']$/g, '');
    if (!key) return null;
    return {
      baseUrl: 'https://api.mistral.ai/v1',
      apiKey: key,
    };
  }

  if (provider === 'openai-compat' || provider === 'openrouter' || id.startsWith('openrouter-')) {
    const key = (process.env['OPENROUTER_API_KEY'] || '').trim().replace(/^["']|["']$/g, '');
    if (!key) return null;
    return {
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: key,
    };
  }

  return null;
}
