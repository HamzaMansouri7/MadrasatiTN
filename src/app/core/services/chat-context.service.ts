import { Injectable, signal } from '@angular/core';
import { ChatPageContext } from '../models/chat.model';

/**
 * Where the user is right now, so the chat classifier rarely needs a clarifying question.
 * Pages set it on enter (/bd a chapter, /parascolaire a book+page, the editor a docId);
 * the drawer sends it with every message. Empty context (e.g. landing) falls back to asking.
 */
@Injectable({ providedIn: 'root' })
export class ChatContextService {
  readonly context = signal<ChatPageContext>({});

  /** Merge fields a page knows; undefined values are ignored so pages can set partial context. */
  set(patch: ChatPageContext): void {
    this.context.update((c) => {
      const next = { ...c };
      for (const [k, v] of Object.entries(patch)) {
        if (v !== undefined) (next as Record<string, unknown>)[k] = v;
      }
      return next;
    });
  }

  /** Called on navigation away from a context-bearing page. */
  clear(): void {
    this.context.set({});
  }
}
