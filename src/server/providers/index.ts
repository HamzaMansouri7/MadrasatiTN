import { ProviderStep } from '../ai/types';
export { callGemini } from './gemini';
export { callOpenAICompat, geminiSchemaToJsonSchema } from './openai-compat';
export type { GeminiPart, OpenAICompatOptions } from './openai-compat';

export interface ProviderEndpointConfig {
  baseUrl: string;
  apiKey: string;
  /** Per-provider request timeout; default OPENAI_COMPAT_TIMEOUT_MS. */
  timeoutMs?: number;
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

  // Direct Mistral API removed: the free "Experiment" tier is blocked on this account's key
  // (0 req/min on small/medium/magistral). The Cloudflare-hosted mistral-small still runs via the cloudflare branch.

  if (provider === 'openai-compat' || provider === 'openrouter' || id.startsWith('openrouter-')) {
    const key = (process.env['OPENROUTER_API_KEY'] || '').trim().replace(/^["']|["']$/g, '');
    if (!key) return null;
    return {
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: key,
    };
  }

  // CodeCraft: owner's prepaid key (1M tokens), OpenAI-compatible, many models. Measured 20-34 s per
  // JSON answer (2026-10-08), so it is the LAST step of each text chain: used only when every free model failed.
  if (provider === 'codecraft' || id.startsWith('cc-')) {
    const key = (process.env['CODECRAFT_API_KEY'] || '').trim().replace(/^["']|["']$/g, '');
    if (!key) return null;
    return {
      baseUrl: (process.env['CODECRAFT_BASE_URL'] || 'https://codecraftapi.com/v1').trim(),
      apiKey: key,
      timeoutMs: Math.max(5000, parseInt(process.env['CODECRAFT_TIMEOUT_MS'] || '60000', 10)),
    };
  }

  if (provider === 'nvidia' || id.startsWith('nvidia-')) {
    const key = (process.env['NVIDIA_API_KEY'] || '').trim().replace(/^["']|["']$/g, '');
    if (!key) return null;
    return {
      baseUrl: 'https://integrate.api.nvidia.com/v1',
      apiKey: key,
    };
  }

  return null;
}
