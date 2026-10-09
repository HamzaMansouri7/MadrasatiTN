/** route path -> query params that open a shared item for guests. */
const GUEST_SHARE_PARAMS: Record<string, readonly string[]> = {
  generate: ['sheet', 'topicId'],
  'memo-studio': ['memo'],
};

/** True when a guest may open this route because the URL carries a shared-item param. */
export function guestMayOpen(path: string | undefined, hasParam: (name: string) => boolean): boolean {
  return (GUEST_SHARE_PARAMS[path ?? ''] ?? []).some(hasParam);
}
