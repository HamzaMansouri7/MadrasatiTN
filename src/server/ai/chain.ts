/**
 * Robust AI execution chain with cooldown tracking, schema validation, and speculative hedging.
 */

import { ChainName, ProviderStep } from './types';
import { getChain, getGeminiApiKeys } from './registry';
import { isCoolingDown, markCooldown, isProviderExhausted } from './cooldowns';
import { callGemini, callOpenAICompat, getProviderEndpoint, GeminiPart } from '../providers';
import { validateAgainstSchema } from '../validate';

interface ExecutionTask {
  step: ProviderStep;
  key: string;
}

/**
 * Executes a single candidate task.
 */
async function executeTask(
  task: ExecutionTask,
  contents: string | GeminiPart[],
  schema: object | undefined,
  temperature: number,
  signal: AbortSignal,
): Promise<Record<string, unknown>> {
  const { step, key } = task;
  let parsed: Record<string, unknown>;

  if (step.provider === 'gemini') {
    parsed = await callGemini(step, key, contents, schema, temperature, signal);
  } else {
    const endpoint = getProviderEndpoint(step);
    if (!endpoint) {
      throw new Error(`Endpoint missing for provider ${step.provider}`);
    }
    parsed = await callOpenAICompat({
      baseUrl: endpoint.baseUrl,
      apiKey: endpoint.apiKey,
      model: step.model,
      contents,
      schema,
      temperature,
      signal,
    });
  }

  if (schema) {
    const { valid, errors } = validateAgainstSchema(parsed, schema as Parameters<typeof validateAgainstSchema>[1]);
    if (!valid) {
      throw new Error(`422 invalid output: ${errors.join('; ')}`);
    }
  }

  return parsed;
}

/**
 * Runs a provider chain with sequential fallback and optional hedging.
 */
export async function runChain(
  chainName: ChainName,
  contents: string | GeminiPart[],
  schema?: object,
  temperature = 0.4,
): Promise<Record<string, unknown>> {
  const steps = getChain(chainName);
  if (steps.length === 0) {
    throw new Error(`Aucun modèle configuré pour la chaîne ${chainName}`);
  }

  const tasks: ExecutionTask[] = [];
  const geminiKeys = getGeminiApiKeys();

  for (const step of steps) {
    if (step.provider === 'gemini') {
      for (const key of geminiKeys) {
        tasks.push({ step, key });
      }
    } else {
      const endpoint = getProviderEndpoint(step);
      if (endpoint) {
        tasks.push({ step, key: endpoint.apiKey });
      }
    }
  }

  if (tasks.length === 0) {
    throw new Error(`Aucune tâche exécutable pour la chaîne ${chainName}`);
  }

  const hedgeMs = Math.max(1000, parseInt(process.env['HEDGE_MS'] || '5000', 10));

  // Filter tasks not on cooldown first; if all are on cooldown, try all
  const availableTasks = tasks.filter(t => !isCoolingDown(t.step.provider, t.step.model, t.key));
  const candidateTasks = availableTasks.length > 0 ? availableTasks : tasks;

  let taskIdx = 0;
  let lastErr: unknown;

  return new Promise<Record<string, unknown>>((resolve, reject) => {
    let resolved = false;
    const activeControllers: AbortController[] = [];
    let pendingRuns = 0;

    const tryNext = () => {
      if (resolved || taskIdx >= candidateTasks.length) {
        if (pendingRuns === 0 && !resolved) {
          reject(lastErr ?? new Error(`Échec de tous les modèles de la chaîne ${chainName}`));
        }
        return;
      }

      const task = candidateTasks[taskIdx++];
      const controller = new AbortController();
      activeControllers.push(controller);
      pendingRuns++;

      let hedgeTimer: ReturnType<typeof setTimeout> | null = null;
      if (taskIdx < candidateTasks.length) {
        hedgeTimer = setTimeout(() => {
          if (!resolved) {
            tryNext();
          }
        }, hedgeMs);
      }

      executeTask(task, contents, schema, temperature, controller.signal)
        .then((result) => {
          if (hedgeTimer) clearTimeout(hedgeTimer);
          if (!resolved) {
            resolved = true;
            // Abort other running tasks
            for (const c of activeControllers) {
              if (c !== controller) c.abort();
            }
            resolve(result);
          }
        })
        .catch((err) => {
          if (hedgeTimer) clearTimeout(hedgeTimer);
          pendingRuns--;
          lastErr = err;
          if (isProviderExhausted(err)) {
            markCooldown(task.step.provider, task.step.model, task.key, err);
          }
          if (!resolved && pendingRuns === 0) {
            tryNext();
          }
        });
    };

    tryNext();
  });
}
