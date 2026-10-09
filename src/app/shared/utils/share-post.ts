/** Single source of truth for the text sent by every share / copy action. */
export type ShareDetail = string | number | null | undefined;

export function joinDetails(parts: readonly ShareDetail[]): string {
  return parts.filter((p) => p !== null && p !== undefined && p !== '').join(' · ');
}

/** `📚 title` / `🎓 grade · subject · trimester` / blank / link. */
export function buildSharePost(title: string, details: string, url: string): string {
  const lines = [`📚 ${title}`];
  if (details) lines.push(`🎓 ${details}`);
  lines.push('', url);
  return lines.join('\n');
}

/** Copies the polished post to the clipboard; returns false if blocked. */
export async function copySharePost(title: string, details: string, url: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(buildSharePost(title, details, url));
    return true;
  } catch {
    return false;
  }
}

/** Native share sheet with the same text; falls back to copying. Returns 'shared' | 'copied' | 'none'. */
export async function nativeSharePost(title: string, details: string, url: string): Promise<'shared' | 'copied' | 'none'> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text: details ? `${title}\n🎓 ${details}` : title, url });
      return 'shared';
    } catch {
      return 'none';
    }
  }
  return (await copySharePost(title, details, url)) ? 'copied' : 'none';
}
