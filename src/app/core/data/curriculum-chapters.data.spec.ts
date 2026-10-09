import { describe, expect, it } from 'vitest';
import { TUNISIAN_CURRICULUM_CHAPTERS } from './curriculum-chapters.data';
import { CNP_PRIMARY_COURSES } from './cnp-books.data';
import { ALL_SUBJECTS, PRIMARY_GRADES, TRIMESTERS } from '../models/education.model';
import { chapterById, chaptersFor, curriculumTree } from '../utils/curriculum.util';

describe('curriculum data', () => {
  it('has unique ids', () => {
    const ids = TUNISIAN_CURRICULUM_CHAPTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses only known grades, subjects and trimesters', () => {
    for (const c of TUNISIAN_CURRICULUM_CHAPTERS) {
      expect(PRIMARY_GRADES as readonly string[], c.id).toContain(c.grade);
      expect(ALL_SUBJECTS as readonly string[], c.id).toContain(c.subject);
      expect(TRIMESTERS as readonly string[], c.id).toContain(c.trimester);
    }
  });

  it('keeps a source and both titles on every row', () => {
    for (const c of TUNISIAN_CURRICULUM_CHAPTERS) {
      expect(c.source?.cnpCode, c.id).toBeTruthy();
      expect(c.titleAr.trim(), c.id).not.toBe('');
      expect(c.titleFr.trim(), c.id).not.toBe('');
    }
  });

  it('only references existing topics from CNP books', () => {
    for (const b of CNP_PRIMARY_COURSES) {
      for (const id of [b.topicId, ...(b.topicIds ?? [])].filter(Boolean) as string[]) {
        expect(chapterById(id), `${b.id} -> ${id}`).toBeDefined();
      }
    }
  });
});

describe('curriculum.util', () => {
  it('filters by grade, subject and trimester in order', () => {
    const rows = chaptersFor('5ème Année', 'اللغة العربية', 'Trimestre 1');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.trimester === 'Trimestre 1')).toBe(true);
    const orders = rows.map((r) => r.order ?? 0);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('builds a tree covering every row', () => {
    const count = curriculumTree()
      .flatMap((g) => g.subjects)
      .flatMap((s) => s.trimesters)
      .reduce((n, t) => n + t.topics.length, 0);
    expect(count).toBe(TUNISIAN_CURRICULUM_CHAPTERS.length);
  });

  it('returns undefined for unknown ids', () => {
    expect(chapterById('nope')).toBeUndefined();
    expect(chapterById(undefined)).toBeUndefined();
  });
});
