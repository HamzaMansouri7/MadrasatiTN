import { SourceInput } from '../models/source-input.model';
import { ChatAction } from '../models/chat.model';

/** The "generate" intents the bot can hand over to a real studio. */
export type ChatToolIntent = ChatAction['intent'];

export interface ChatTool {
  route: string;
  query?: Record<string, string>;
  label: { fr: string; ar: string };
}

/**
 * One table for every studio the chat can open (mirrors create-hub's OUTPUT_ROUTES). Adding a
 * studio = one row here + one intent on the server; the drawer and the handoff stay untouched.
 */
export const CHAT_TOOLS: Record<ChatToolIntent, ChatTool> = {
  exercises: { route: '/editor', query: { type: 'exercise_sheet' }, label: { fr: 'Créer les exercices', ar: 'إنشاء التمارين' } },
  plan: { route: '/editor', query: { type: 'lesson_plan' }, label: { fr: 'Créer la fiche pédagogique', ar: 'إنشاء الجذاذة' } },
  memo: { route: '/ai-studio', query: { tab: 'memo' }, label: { fr: 'Créer la fiche de révision', ar: 'إنشاء ملف المراجعة' } },
  infographic: { route: '/ai-studio', query: { tab: 'infographic' }, label: { fr: 'Créer l’infographie', ar: 'إنشاء الإنفوغرافيا' } },
  series: { route: '/series/new', label: { fr: 'Créer la série illustrée', ar: 'إنشاء السلسلة المصورة' } },
};

export const isChatToolIntent = (v: unknown): v is ChatToolIntent => typeof v === 'string' && v in CHAT_TOOLS;

/**
 * What the studio form opens with: the user's own request plus whatever the classifier resolved,
 * so a chat request lands as a filled form instead of an empty one.
 */
export function buildChatPrefill(
  message: string,
  routed: { grade?: string; subject?: string; topicId?: string; lang?: string } | undefined,
): SourceInput {
  const lang = routed?.lang === 'fr' ? 'fr' : 'ar';
  return {
    mode: 'topic',
    topic: message.trim().slice(0, 200),
    topicId: routed?.topicId,
    grade: routed?.grade,
    subject: routed?.subject,
    language: lang,
    instructions: message.trim().slice(0, 500),
  };
}
