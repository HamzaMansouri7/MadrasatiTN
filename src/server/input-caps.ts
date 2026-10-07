/** Length caps and delimiter wrapping for user-controlled text that is placed in prompts. */
export const CAPS = {
  short: 200,
  topic: 300,
  instruction: 800,
  text: 8000,
  history: 12,
  historyEach: 1500,
  article: 20000,
} as const;

/** Coerce to string and cut to `max`. Non-strings become ''. */
export function capText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

/**
 * Wrap user data in <tag>…</tag>. Any occurrence of the closing tag inside the value is removed,
 * so the data cannot break out of its block and pose as instructions.
 */
export function wrapData(tag: string, value: unknown, max: number): string {
  const safeTag = tag.replace(/[^a-z0-9_]/gi, '_');
  const body = capText(value, max).replace(new RegExp(`</?\\s*${safeTag}\\s*>`, 'gi'), '');
  return `<${safeTag}>\n${body}\n</${safeTag}>`;
}

export interface ChatMessage {
  role: string;
  content: string;
}

/** Keep the last `n` well-formed messages, each cut to `maxEach` chars. Never throws on bad input. */
export function capHistory(messages: unknown, n: number = CAPS.history, maxEach: number = CAPS.historyEach): ChatMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
    .map((m) => ({
      role: m['role'] === 'assistant' || m['role'] === 'model' ? 'assistant' : 'user',
      content: capText(m['content'], maxEach),
    }))
    .filter((m) => m.content.trim() !== '')
    .slice(-n);
}
