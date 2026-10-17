import { Injectable, computed, inject, signal } from '@angular/core';
import { AiClient } from './ai-client';
import { EducationStore } from './education-store';
import { LanguageService } from './language.service';
import { ChatContextService } from './chat-context.service';
import { ChatAction, ChatMessage, ChatSource } from '../models/chat.model';

const STORAGE_KEY = 'madrasati_chat';
const MAX_STORED = 40;

/** Where each "generate" intent sends the user, mirroring create-hub's OUTPUT_ROUTES. */
const INTENT_ROUTE: Record<string, string> = {
  exercises: '/editor',
  memo: '/ai-studio',
  infographic: '/ai-studio',
  plan: '/editor',
};
const INTENT_QUERY: Record<string, Record<string, string>> = {
  exercises: { type: 'exercise_sheet' },
  memo: { tab: 'memo' },
  infographic: { tab: 'infographic' },
  plan: { type: 'lesson_plan' },
};

/**
 * The single source of truth for the one global chat drawer: open state, the one thread, and the
 * send pipeline (POST /api/ai/chat). History lives in localStorage (SSR-guarded); the server is
 * stateless. There is intentionally no second chat surface — features call `openChat()`.
 */
@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly ai = inject(AiClient);
  private readonly store = inject(EducationStore);
  private readonly lang = inject(LanguageService);
  private readonly ctx = inject(ChatContextService);

  readonly open = signal(false);
  readonly pending = signal(false);
  readonly thread = signal<ChatMessage[]>(this.load());

  /** Role mode shown in the header and sent to the server. Teacher tools require teacher mode. */
  readonly mode = computed<'teacher' | 'parent'>(() => {
    const r = this.store.currentRole();
    return r === 'teacher' || r === 'editor' || r === 'article-editor' ? 'teacher' : 'parent';
  });

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
      patch.action = this.buildAction(d);
    }

    this.thread.update((t) => t.map((m) => (m.id === botMsg.id ? { ...m, ...patch } : m)));
    this.pending.set(false);
    this.persist();
  }

  /** A "generate" intent becomes a card linking to the real Create tool, carrying any topicId. */
  private buildAction(data: Record<string, unknown>): ChatAction | undefined {
    const routed = (data['routed'] as { intent?: string; topicId?: string } | undefined) ?? undefined;
    const intent = routed?.intent;
    if (intent !== 'exercises' && intent !== 'memo' && intent !== 'plan' && intent !== 'infographic') return undefined;
    const label =
      intent === 'exercises'
        ? this.lang.tr('Créer les exercices', 'إنشاء التمارين')
        : intent === 'memo'
          ? this.lang.tr('Créer la fiche de révision', 'إنشاء ملف المراجعة')
          : intent === 'plan'
            ? this.lang.tr('Créer la fiche pédagogique', 'إنشاء الجذاذة')
            : this.lang.tr('Créer l’infographie', 'إنشاء الإنفوغرافيا');
    const queryParams = { ...(INTENT_QUERY[intent] ?? {}) };
    if (routed?.topicId) queryParams['topicId'] = routed.topicId;
    return { intent, label, route: INTENT_ROUTE[intent], queryParams };
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
