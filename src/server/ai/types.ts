/**
 * Core type definitions for the multi-provider AI pipeline.
 */

export interface ProviderStep {
  id: string;
  provider: 'gemini' | 'openai-compat' | 'cloudflare' | 'nvidia' | 'codecraft';
  model: string;
  quality: number;
  tasks: ('text' | 'vision')[];
}

export type ChainName = 'A' | 'B' | 'C' | 'D';
