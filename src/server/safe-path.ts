import { isAbsolute, relative, resolve } from 'node:path';

/**
 * Resolves `candidate` under `root` and returns the absolute path, or null if it escapes `root`.
 * Uses path.relative (not startsWith), so `/root-evil` can never pass as inside `/root`.
 */
export function resolveInside(root: string, candidate: string): string | null {
  const base = resolve(root);
  const target = resolve(base, candidate);
  const rel = relative(base, target);
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) return null;
  return target;
}
