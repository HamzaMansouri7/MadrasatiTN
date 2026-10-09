import { describe, expect, it } from 'vitest';
import { guestMayOpen } from './guest-share';

const has = (...names: string[]) => (name: string) => names.includes(name);

describe('guestMayOpen', () => {
  it('lets guests open shared items on the page that serves them', () => {
    expect(guestMayOpen('generate', has('topicId'))).toBe(true);
    expect(guestMayOpen('generate', has('sheet'))).toBe(true);
    expect(guestMayOpen('memo-studio', has('memo'))).toBe(true);
  });

  it('does not let a share param unlock other guarded pages', () => {
    for (const path of ['teacher', 'parent', 'student', 'editor', 'ai-studio', 'profile', 'create']) {
      expect(guestMayOpen(path, has('doc', 'sheet', 'memo', 'topicId')), path).toBe(false);
    }
  });

  it('ignores params that belong to another page', () => {
    expect(guestMayOpen('generate', has('memo'))).toBe(false);
    expect(guestMayOpen('memo-studio', has('topicId'))).toBe(false);
  });

  it('does nothing without params or a path', () => {
    expect(guestMayOpen('generate', has())).toBe(false);
    expect(guestMayOpen(undefined, has('doc'))).toBe(false);
  });
});
