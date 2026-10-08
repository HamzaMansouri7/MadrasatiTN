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
      timeoutMs: endpoint.timeoutMs,
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

  // 2.5s: Gemini 503s fail in ~1.5s (chain advances immediately on those), but a model that STALLS holds a slot,
  // so launching the next candidate after 2.5s lets a healthy model win without waiting out the stalled one.
  const hedgeMs = Math.max(1000, parseInt(process.env['HEDGE_MS'] || '2500', 10));

  // Filter tasks not on cooldown first; if all are on cooldown, try all
  const availableTasks = tasks.filter(t => !isCoolingDown(t.step.provider, t.step.model, t.key));
  const candidateTasks = availableTasks.length > 0 ? availableTasks : tasks;

  let taskIdx = 0;
  let lastErr: unknown;

  return new Promise<Record<string, unknown>>((resolve, reject) => {
    let resolved = false;
    const activeControllers: AbortController[] = [];
    let pendingRuns = 0;
    let hedgeTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleHedge = () => {
      if (hedgeTimer) clearTimeout(hedgeTimer);
      if (resolved || taskIdx >= candidateTasks.length) {
        hedgeTimer = null;
        return;
      }
      hedgeTimer = setTimeout(() => {
        hedgeTimer = null;
        if (!resolved && taskIdx < candidateTasks.length) {
          console.log(`[chain:${chainName}] HEDGE triggered after ${hedgeMs}ms -> launching task #${taskIdx + 1}`);
          tryLaunch();
        }
      }, hedgeMs);
    };

    const tryLaunch = (): boolean => {
      if (resolved || taskIdx >= candidateTasks.length) {
        if (pendingRuns === 0 && !resolved) {
          if (hedgeTimer) {
            clearTimeout(hedgeTimer);
            hedgeTimer = null;
          }
          reject(lastErr ?? new Error(`Échec de tous les modèles de la chaîne ${chainName}`));
        }
        return false;
      }

      // A model that 503'd during THIS request is cooled model-wide: skip its remaining keys instead of
      // burning more attempts on it (the cooldown filter above only ran once, before the request started).
      while (
        taskIdx < candidateTasks.length - 1 &&
        isCoolingDown(candidateTasks[taskIdx].step.provider, candidateTasks[taskIdx].step.model, candidateTasks[taskIdx].key)
      ) {
        taskIdx++;
      }
      const currentIdx = taskIdx++;
      const task = candidateTasks[currentIdx];
      const controller = new AbortController();
      activeControllers.push(controller);
      pendingRuns++;
      const startTime = Date.now();

      console.log(
        `[chain:${chainName}] task#${currentIdx + 1}/${candidateTasks.length} ${task.step.provider}/${task.step.model} START`,
      );

      scheduleHedge();

      executeTask(task, contents, schema, temperature, controller.signal)
        .then((result) => {
          const duration = Date.now() - startTime;
          console.log(
            `[chain:${chainName}] task#${currentIdx + 1} ${task.step.provider}/${task.step.model} SUCCESS in ${duration}ms`,
          );
          if (!resolved) {
            resolved = true;
            if (hedgeTimer) {
              clearTimeout(hedgeTimer);
              hedgeTimer = null;
            }
            // Abort other running tasks
            for (const c of activeControllers) {
              if (c !== controller) {
                try {
                  c.abort();
                } catch {
                  // ignore
                }
              }
            }
            resolve(result);
          }
        })
        .catch((err) => {
          const duration = Date.now() - startTime;
          pendingRuns--;
          lastErr = err;
          if (isProviderExhausted(err)) {
            markCooldown(task.step.provider, task.step.model, task.key, err);
          }
          if (!resolved) {
            console.warn(
              `[chain:${chainName}] task#${currentIdx + 1} ${task.step.provider}/${task.step.model} FAILED in ${duration}ms: ${err?.message || err}`,
            );
            // If the latest task failed or nothing is running, advance immediately
            if (pendingRuns === 0) {
              if (hedgeTimer) {
                clearTimeout(hedgeTimer);
                hedgeTimer = null;
              }
              tryLaunch();
            } else if (currentIdx === taskIdx - 1 && taskIdx < candidateTasks.length) {
              if (hedgeTimer) {
                clearTimeout(hedgeTimer);
                hedgeTimer = null;
              }
              tryLaunch();
            }
          }
        });

      return true;
    };

    tryLaunch();
  });
}
