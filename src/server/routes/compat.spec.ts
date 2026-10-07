import { describe, it, expect } from 'vitest';
import { normalizeRequestBody, adaptResponseBody } from './compat';

describe('normalizeRequestBody (old client -> current routes)', () => {
  it('transform: originalBlock + transformType become exercise + targetFormat', () => {
    const out = normalizeRequestBody('/transform-exercise', {
      originalBlock: { exerciseTitle: 'Additions', content: 'Calcule 2+3', exerciseSolution: '5' },
      transformType: 'to_qcm',
      grade: '3ème Année',
    });
    expect(out['exercise']).toEqual({ title: 'Additions', promptText: 'Calcule 2+3', solutionText: '5' });
    expect(out['targetFormat']).toBe('qcm');
    expect(out['grade']).toBe('3ème Année');
  });
  it('transform: non-qcm types map to free; new-style bodies are untouched', () => {
    expect(normalizeRequestBody('/transform-exercise', { originalBlock: {}, transformType: 'simplify_vocab' })['targetFormat']).toBe('free');
    const modern = { exercise: { title: 'x' }, targetFormat: 'qcm' };
    expect(normalizeRequestBody('/transform-exercise', modern)).toEqual(modern);
  });
  it('variant: originalPromptText becomes an exercise, format becomes variantType', () => {
    const out = normalizeRequestBody('/variant', { originalPromptText: 'Calcule 4+4', topic: 'Somme', format: 'qcm' });
    expect(out['exercise']).toEqual({ title: 'Somme', promptText: 'Calcule 4+4' });
    expect(out['variantType']).toBe('qcm');
  });
  it('auto-tag: documentName/base64Data/contentType become filename/fileData/mimeType', () => {
    const out = normalizeRequestBody('/auto-tag-document', { documentName: 'a.pdf', base64Data: 'QQ==', contentType: 'application/pdf' });
    expect(out).toMatchObject({ filename: 'a.pdf', fileData: 'QQ==', mimeType: 'application/pdf' });
  });
  it('photo-solve: base64Data/contentType become photoBase64/mimeType', () => {
    const out = normalizeRequestBody('/photo-solve', { base64Data: 'QQ==', contentType: 'image/png', language: 'fr' });
    expect(out).toMatchObject({ photoBase64: 'QQ==', mimeType: 'image/png', language: 'fr' });
  });
  it('summarize: images[] become files[]; single base64Data also works', () => {
    const multi = normalizeRequestBody('/summarize-docs', { images: [{ base64Data: 'QQ==', contentType: 'image/png' }, { base64Data: 'Qg==' }] });
    expect(multi['files']).toEqual([
      { name: 'page-1', data: 'QQ==', mimeType: 'image/png' },
      { name: 'page-2', data: 'Qg==', mimeType: 'image/jpeg' },
    ]);
    const single = normalizeRequestBody('/summarize-docs', { base64Data: 'QQ==' });
    expect((single['files'] as unknown[]).length).toBe(1);
  });
  it('never mutates the input and tolerates junk bodies', () => {
    const input = { documentName: 'a' };
    normalizeRequestBody('/auto-tag-document', input);
    expect(input).toEqual({ documentName: 'a' });
    expect(normalizeRequestBody('/variant', undefined)).toEqual({});
    expect(normalizeRequestBody('/variant', 'text')).toEqual({});
  });
});

describe('adaptResponseBody (current routes -> old client keys)', () => {
  it.each([
    ['/transform-exercise', 'exercise', 'transformed'],
    ['/variant', 'exercise', 'variant'],
    ['/auto-tag-document', 'metadata', 'tags'],
    ['/photo-solve', 'solution', 'result'],
    ['/summarize-docs', 'summary', 'result'],
    ['/draft-announcement', 'announcement', 'result'],
    ['/explain-concept', 'explanation', 'result'],
    ['/chat-article', 'assistantMessage', 'replyText'],
  ])('%s adds %s -> %s and keeps both', (path, from, to) => {
    const data = { a: 1 };
    const out = adaptResponseBody(path, { success: true, [from]: data }) as Record<string, unknown>;
    expect(out[to]).toBe(data);
    expect(out[from]).toBe(data);
  });
  it('leaves errors, unknown routes and already-aliased replies alone', () => {
    const err = { error: 'x' };
    expect(adaptResponseBody('/variant', err)).toBe(err);
    const other = { success: true, exercise: {} };
    expect(adaptResponseBody('/generate-exercise', other)).toBe(other);
    const done = { success: true, exercise: {}, variant: { keep: true } };
    expect((adaptResponseBody('/variant', done) as Record<string, unknown>)['variant']).toEqual({ keep: true });
  });
});

describe('analyze-worksheet and generate-memo compat', () => {
  it('analyze-worksheet: base64Data/contentType become imageBase64/mimeType', () => {
    expect(normalizeRequestBody('/analyze-worksheet', { base64Data: 'QQ==', contentType: 'image/png' })).toMatchObject({ imageBase64: 'QQ==', mimeType: 'image/png' });
  });
  it('memo: text/instructions/currentMemo/images/file map to current route fields', () => {
    const out = normalizeRequestBody('/generate-memo', {
      topic: 'T', text: 'notes', instructions: 'court', blockToRegenerate: 'steps', currentMemo: { a: 1 },
      images: [{ base64Data: 'QQ==', contentType: 'image/png' }], file: { base64Data: 'Qg==', contentType: 'application/pdf' },
    });
    expect(out['teacherNotes']).toBe('notes');
    expect(out['existingMemo']).toEqual({ a: 1 });
    expect(String(out['userInstruction'])).toContain('court');
    expect(String(out['userInstruction'])).toContain('steps');
    expect(out['sourceFiles']).toEqual([{ data: 'QQ==', mimeType: 'image/png' }, { data: 'Qg==', mimeType: 'application/pdf' }]);
  });
  it('memo reply: memoDoc is also returned as result', () => {
    const doc = { blocks: [] };
    const out = adaptResponseBody('/generate-memo', { success: true, memoDoc: doc }) as Record<string, unknown>;
    expect(out['result']).toBe(doc);
    expect(out['memoDoc']).toBe(doc);
  });
});
