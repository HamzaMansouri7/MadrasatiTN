import modelsConfig from './models.json';
import { ProviderStep, ChainName } from './types';
import { getProviderEndpoint } from '../providers';

export function getGeminiApiKeys(): string[] {
  return [
    ...new Set(
      Object.entries(process.env)
        .filter(([k, v]) => k.startsWith('GEMINI_API_KEY') && typeof v === 'string')
        .map(([, v]) => v as string)
        .join(',')
        .split(/[,\n]/)
        .map((k) => k.trim().replace(/^["']|["']$/g, ''))
        .filter((k) => k.length > 0),
    ),
  ];
}

export function isStepConfigured(step: ProviderStep): boolean {
  if (step.provider === 'gemini') {
    return getGeminiApiKeys().length > 0;
  }
  return getProviderEndpoint(step) !== null;
}

export function getChain(name: ChainName): ProviderStep[] {
  const chainIds = modelsConfig.chains[name] || [];
  const modelMap = new Map<string, ProviderStep>();

  for (const m of modelsConfig.models as ProviderStep[]) {
    modelMap.set(m.id, m);
  }

  const steps: ProviderStep[] = [];
  for (const id of chainIds) {
    const step = modelMap.get(id);
    if (step && isStepConfigured(step)) {
      steps.push(step);
    }
  }

  return steps;
}
