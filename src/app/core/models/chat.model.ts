import type { SourceInput } from './source-input.model';

/** The conversational assistant lives in one global drawer; these are its shared types. */

export type ChatSender = 'user' | 'bot';

export interface ChatSource {
  title: string;
  origin: string;
  ref?: string;
  grade?: string;
  subject?: string;
}

export interface ChatAction {
  /** Which Create tool to open for a "generate" intent. */
  intent: 'exercises' | 'memo' | 'plan' | 'infographic' | 'series';
  label: string;
  route: string;
  queryParams?: Record<string, string>;
  /** Pre-fills the studio form (message, grade, subject, topic) so it opens ready, not empty. */
  prefill?: SourceInput;
}

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  text: string;
  /** Official-curriculum references the answer was grounded in. */
  sources?: ChatSource[];
  /** A one-click follow-up suggested by the bot. */
  followUp?: string;
  /** For a "generate" intent: a card linking to the real Create tool. */
  action?: ChatAction;
  pending?: boolean;
  error?: boolean;
  at: number;
}

/** Page context the drawer sends so the classifier rarely needs a clarifying question. */
export interface ChatPageContext {
  grade?: string;
  subject?: string;
  topicId?: string;
  bookId?: string;
  page?: number;
  docId?: string;
  route?: string;
}
