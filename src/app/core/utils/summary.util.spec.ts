import { describe, it, expect } from 'vitest';
import { normalizeSummary, normalizeSummarySection, summarySections } from './summary.util';
import { SUMMARY_SCHEMA, SUMMARY_SECTION_SCHEMA } from '../../../server/memo-schema';
import { MemoDoc } from '../models/memo.model';

const base = { title: 'الجمع', grade: '3ème', subject: 'Mathématiques', language: 'ar' };

describe('summary schema', () => {
  it('requires sections and a typed heading per section', () => {
    expect(SUMMARY_SCHEMA.required).toEqual(expect.arrayContaining(['title', 'sections']));
    expect(SUMMARY_SECTION_SCHEMA.required).toEqual(['type', 'heading']);
  });
});

describe('normalizeSummarySection', () => {
  it('drops unknown types and empty sections', () => {
    expect(normalizeSummarySection({ type: 'poem', heading: 'x', text: 'y' })).toBeNull();
    expect(normalizeSummarySection({ type: 'method', heading: 'x', steps: [] })).toBeNull();
    expect(normalizeSummarySection({ type: 'intro', heading: 'x' })).toBeNull();
  });

  it('keeps practice exercises with their answers', () => {
    const s = normalizeSummarySection({ type: 'practice', heading: 'تمارين', exercises: [{ question: '2+3=?', answer: '5' }] });
    expect(s?.exercises).toEqual([{ question: '2+3=?', answer: '5' }]);
  });

  it('accepts only same-origin upload images', () => {
    expect(normalizeSummarySection({ type: 'intro', heading: 'h', text: 't', imageUrl: '/uploads/a/b.webp' })?.imageUrl).toBe('/uploads/a/b.webp');
    expect(normalizeSummarySection({ type: 'intro', heading: 'h', text: 't', imageUrl: 'javascript:alert(1)' })?.imageUrl).toBeUndefined();
  });
});

describe('normalizeSummary', () => {
  it('needs a title and at least two usable sections', () => {
    expect(normalizeSummary({ ...base, sections: [{ type: 'intro', heading: 'h', text: 't' }] })).toBeNull();
    const doc = normalizeSummary({
      ...base,
      sections: [
        { type: 'intro', heading: 'h', text: 't' },
        { type: 'remember', heading: 'r', items: ['a'] },
      ],
    });
    expect(doc?.sections).toHaveLength(2);
    expect(doc?.length).toBe('short');
  });

  it('keeps at most two pictures', () => {
    const sections = [1, 2, 3].map((n) => ({ type: 'intro', heading: `h${n}`, text: 't', imageUrl: `/uploads/x/${n}.webp` }));
    const doc = normalizeSummary({ ...base, sections });
    expect(doc?.sections?.filter((s) => s.imageUrl)).toHaveLength(2);
  });
});

describe('summarySections', () => {
  it('adapts a document saved with the old blocks', () => {
    const old: MemoDoc = {
      ...(base as Pick<MemoDoc, 'title' | 'grade' | 'subject' | 'language'>),
      topic: 'الجمع',
      steps: [{ n: 1, heading: 'أضع', body: 'الأعداد' }],
      remember: ['أبدأ بالآحاد'],
    };
    expect(summarySections(old).map((s) => s.type)).toEqual(['method', 'remember']);
  });
});
