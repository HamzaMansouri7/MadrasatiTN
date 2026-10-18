import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AiClient } from './ai-client';
import { EducationStore } from './education-store';
import { FirebaseService } from './firebase.service';
import { LanguageService } from './language.service';
import { ChatContextService } from './chat-context.service';
import { CHAT_TOOLS, buildChatPrefill, isChatToolIntent } from './chat-tools';
import { ChatAction, ChatMessage, ChatSource } from '../models/chat.model';

const STORAGE_KEY = 'madrasati_chat';
const MAX_STORED = 40;

export type ChatMode = 'teacher' | 'parent';

/**
 * The single source of truth for the one global chat drawer: open state, the one thread, and the
 * send pipeline (POST /api/ai/chat). History lives in localStorage (SSR-guarded); the server is
 * stateless. There is intentionally no second chat surface — features call `openChat()`.
 */
@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly ai = inject(AiClient);
  private readonly store = inject(EducationStore);
  private readonly firebase = inject(FirebaseService);
  private readonly lang = inject(LanguageService);
  private readonly ctx = inject(ChatContextService);
  private readonly router = inject(Router);

  readonly open = signal(false);
  readonly pending = signal(false);
  readonly thread = signal<ChatMessage[]>(this.load());

  /** The user's manual choice in the drawer header; wins over everything else. */
  readonly modeOverride = signal<ChatMode | null>(null);

  /**
   * Role mode shown in the header and sent to the server. Priority: manual choice, then the
   * signed-in profile (a teacher stays a teacher on library pages), then the current page.
   */
  readonly mode = computed<ChatMode>(() => {
    const manual = this.modeOverride();
    if (manual) return manual;
    const p = this.firebase.userProfile();
    if (p) return p.role === 'teacher' || p.roles?.includes('teacher') ? 'teacher' : 'parent';
    const r = this.store.currentRole();
    return r === 'teacher' || r === 'editor' || r === 'article-editor' ? 'teacher' : 'parent';
  });

  toggleMode(): void {
    this.modeOverride.set(this.mode() === 'teacher' ? 'parent' : 'teacher');
  }

  openChat(prefill?: string): void {
    this.open.set(true);
    if (prefill && prefill.trim()) void this.send(prefill.trim());
  }

  closeChat(): void {
    this.open.set(false);
  }

  toggle(): void {
    this.open.update((v) => !v);
  }

  reset(): void {
    this.thread.set([]);
    this.persist();
  }

  async send(text: string): Promise<void> {
    const message = text.trim();
    if (!message || this.pending()) return;

    const now = Date.now();
    const userMsg: ChatMessage = { id: `u-${now}`, sender: 'user', text: message, at: now };
    const botMsg: ChatMessage = { id: `b-${now}`, sender: 'bot', text: '', pending: true, at: now };
    this.thread.update((t) => [...t, userMsg, botMsg]);
    this.pending.set(true);

    const history = this.thread()
      .filter((m) => !m.pending && m.text)
      .slice(-7, -1)
      .map((m) => ({ role: m.sender, text: m.text }));

    const res = await this.ai.post('chat', {
      message,
      history,
      role: this.mode(),
      context: this.ctx.context(),
      language: this.lang.lang(),
    });

    const patch: Partial<ChatMessage> = { pending: false };
    if (!res.ok) {
      patch.text = res.error || this.lang.tr('Le service est occupé. Réessaie.', 'الخدمة مشغولة الآن. أعد المحاولة.');
      patch.error = true;
    } else {
      const d = res.data;
      patch.text = (d['reply'] as string) || '';
      patch.followUp = (d['followUp'] as string) || undefined;
      patch.sources = Array.isArray(d['sources']) ? (d['sources'] as ChatSource[]).slice(0, 4) : undefined;
      patch.action = this.buildAction(d, message);
    }

    this.thread.update((t) => t.map((m) => (m.id === botMsg.id ? { ...m, ...patch } : m)));
    this.pending.set(false);
    this.persist();
  }

  /** Open the studio an action card points to, with its form already filled from the chat request. */
  openTool(action: ChatAction): void {
    if (action.prefill) this.store.prefillSource.set(action.prefill);
    this.closeChat();
    void this.router.navigate([action.route], { queryParams: action.queryParams });
  }

  /** A "generate" intent becomes a card for the matching studio (see CHAT_TOOLS), carrying the prefill. */
  private buildAction(data: Record<string, unknown>, message: string): ChatAction | undefined {
    const routed = (data['routed'] as { intent?: string; grade?: string; subject?: string; topicId?: string; lang?: string } | undefined) ?? undefined;
    const intent = routed?.intent;
    if (!isChatToolIntent(intent)) return undefined;
    const tool = CHAT_TOOLS[intent];
    return {
      intent,
      label: this.lang.tr(tool.label.fr, tool.label.ar),
      route: tool.route,
      queryParams: tool.query ? { ...tool.query } : undefined,
      prefill: buildChatPrefill(message, routed),
    };
  }

  private load(): ChatMessage[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as ChatMessage[]) : [];
      return Array.isArray(parsed) ? parsed.filter((m) => !m.pending).slice(-MAX_STORED) : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const keep = this.thread().filter((m) => !m.pending).slice(-MAX_STORED);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(keep));
    } catch {
      /* storage full or blocked — the thread still works in memory */
    }
  }
}
