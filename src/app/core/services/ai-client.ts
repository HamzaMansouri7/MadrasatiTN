import { Injectable, inject } from '@angular/core';
import { LanguageService } from './language.service';

/** Loosely typed model output: callers pick the fields they need and guard them. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AiJson = any;

export type AiRoute =
  | 'analyze-worksheet'
  | 'auto-tag-document'
  | 'chat-article'
  | 'draft-announcement'
  | 'explain-concept'
  | 'generate-exercise'
  | 'generate-full-exam'
  | 'generate-illustration'
  | 'generate-infographic'
  | 'generate-lesson-plan'
  | 'generate-memo'
  | 'generate-series-image'
  | 'generate-series-panel'
  | 'generate-similar'
  | 'photo-solve'
  | 'plan-series'
  | 'solve-exercise'
  | 'summarize-docs'
  | 'transform-exercise'
  | 'variant';

/** Raw server envelope: `{ success, error?, ...route-specific fields }`. */
export type AiEnvelope = { success?: boolean; error?: string } & Record<string, unknown>;

export type AiResult<T = AiEnvelope> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string; data?: T };

export interface AiPostOptions {
  /** Retry once on HTTP 429, waiting for Retry-After (default 2s, min 1s, max 15s). */
  retry429?: boolean;
  signal?: AbortSignal;
  /** Message used when the server gives none (network error, bad JSON). */
  fallbackError?: string;
}

/**
 * Single transport for every `/api/ai/*` call: JSON POST, `language` defaulted from the UI,
 * one optional 429 retry, envelope unwrap, and uniform error shape (never throws).
 */
@Injectable({ providedIn: 'root' })
export class AiClient {
  private readonly lang = inject(LanguageService);

  async post<T = AiEnvelope>(route: AiRoute, body: Record<string, unknown>, opts: AiPostOptions = {}): Promise<AiResult<T>> {
    const fallbackError = opts.fallbackError ?? 'Erreur réseau';
    if (typeof fetch === 'undefined') return { ok: false, status: 0, error: fallbackError };

    const payload = body['language'] === undefined ? { ...body, language: this.lang.lang() } : body;
    const send = () =>
      fetch(`/api/ai/${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: opts.signal,
      });

    try {
      let res = await send();
      if (res.status === 429 && opts.retry429) {
        const header = parseInt(res.headers.get('Retry-After') ?? '', 10);
        const waitSec = Math.min(15, Math.max(1, Number.isFinite(header) ? header : 2));
        await new Promise((r) => setTimeout(r, waitSec * 1000));
        res = await send();
      }
      const data = (await res.json().catch(() => null)) as (AiEnvelope & T) | null;
      if (!res.ok || !data || data.success === false) {
        return { ok: false, status: res.status, error: (data?.error as string | undefined) || fallbackError, data: data ?? undefined };
      }
      return { ok: true, status: res.status, data };
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      console.error(`[ai] ${route} failed:`, err);
      return { ok: false, status: 0, error: err instanceof Error && err.message ? err.message : fallbackError };
    }
  }
}
