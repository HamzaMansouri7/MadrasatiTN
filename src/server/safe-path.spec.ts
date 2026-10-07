import { describe, it, expect } from 'vitest';
import { resolve, join } from 'node:path';
import { resolveInside } from './safe-path';

const root = resolve('/tmp/resources');

describe('resolveInside', () => {
  it('accepts files and nested files inside root', () => {
    expect(resolveInside(root, 'a.json')).toBe(join(root, 'a.json'));
    expect(resolveInside(root, 'x/y/z.png')).toBe(join(root, 'x', 'y', 'z.png'));
  });
  it('rejects parent traversal', () => {
    expect(resolveInside(root, '../secret')).toBeNull();
    expect(resolveInside(root, 'a/../../secret')).toBeNull();
  });
  it('rejects sibling directory with the same prefix', () => {
    expect(resolveInside(root, '../resources-evil/a')).toBeNull();
  });
  it('rejects absolute paths outside and the root itself', () => {
    expect(resolveInside(root, resolve('/etc/passwd'))).toBeNull();
    expect(resolveInside(root, '.')).toBeNull();
  });
});
