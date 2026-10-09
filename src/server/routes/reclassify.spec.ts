import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'node:path';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { Request, Response } from 'express';

const noop = () => undefined;
const testDocsDir = join(process.cwd(), 'tmp-test-docs-reclassify');
process.env['DATA_DIR'] = testDocsDir;

import * as storage from '../storage';
import { docsRouter, docsRouteDeps } from './docs.routes';

function createMockReqRes(options: { path: string; method?: string; body?: unknown; headers?: Record<string, string> }) {
  const req = {
    url: options.path,
    path: options.path,
    method: options.method || 'POST',
    params: {},
    body: options.body || {},
    headers: options.headers || {},
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as Request;

  let statusCode = 200;
  let responseData: Record<string, unknown> | undefined = undefined;

  const res = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: Record<string, unknown>) => {
      responseData = data;
      return res;
    },
    setHeader: () => res,
    sendStatus: (code: number) => {
      statusCode = code;
      return res;
    },
  } as unknown as Response;

  return { req, res, getStatus: () => statusCode, getData: () => responseData };
}

describe('POST /api/docs/:id/reclassify', () => {
  beforeEach(() => {
    if (!existsSync(testDocsDir)) {
      mkdirSync(testDocsDir, { recursive: true });
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    const docFile = join(storage.docsFolder, 'sheet-reclass-123456.json');
    if (existsSync(docFile)) rmSync(docFile, { force: true });
  });

  it('returns 403 if user is not a verified teacher', async () => {
    vi.spyOn(docsRouteDeps, 'verifyTeacherUser').mockResolvedValueOnce({
      uid: 'user-parent-123',
      isVerifiedTeacher: false,
      displayName: 'Parent User',
    });

    const { req, res, getStatus, getData } = createMockReqRes({
      path: '/doc-test-123/reclassify',
      body: { proposed: { grade: '4ème Année' } },
    });

    await docsRouter(req, res, noop);

    expect(getStatus()).toBe(403);
    expect(getData()?.['error']).toContain('Accès réservé aux enseignants');
  });

  it('returns 400 for invalid doc ID pattern', async () => {
    vi.spyOn(docsRouteDeps, 'verifyTeacherUser').mockResolvedValueOnce({
      uid: 'teacher-123',
      isVerifiedTeacher: true,
      displayName: 'Prof Hedi',
    });

    const { req, res, getStatus, getData } = createMockReqRes({
      path: '/invalid!id/reclassify',
      body: { proposed: { grade: '4ème Année' } },
    });

    await docsRouter(req, res, noop);

    expect(getStatus()).toBe(400);
    expect(getData()?.['error']).toContain('Identifiant invalide');
  });

  it('returns 404 if document file does not exist', async () => {
    vi.spyOn(docsRouteDeps, 'verifyTeacherUser').mockResolvedValueOnce({
      uid: 'teacher-123',
      isVerifiedTeacher: true,
      displayName: 'Prof Hedi',
    });

    const { req, res, getStatus, getData } = createMockReqRes({
      path: '/sheet-nonexistent-999/reclassify',
      body: { proposed: { grade: '4ème Année' } },
    });

    await docsRouter(req, res, noop);

    expect(getStatus()).toBe(404);
    expect(getData()?.['error']).toContain('Fiche introuvable');
  });

  it('successfully reclassifies document, records history, and updates JSON', async () => {
    vi.spyOn(docsRouteDeps, 'verifyTeacherUser').mockResolvedValueOnce({
      uid: 'teacher-456',
      isVerifiedTeacher: true,
      displayName: 'Mme Amel',
    });

    const docId = 'sheet-reclass-123456';
    const initialDoc = {
      id: docId,
      title: 'Devoir de Grammaire',
      grade: '1ère Année',
      subject: 'Mathématiques',
      trimester: 'Trimestre 1',
      docType: "Série d'Exercices",
      content: 'Exercices de verbes du 1er groupe à l\'imparfait',
    };
    const targetFolder = storage.docsFolder;
    if (!existsSync(targetFolder)) mkdirSync(targetFolder, { recursive: true });

    writeFileSync(join(targetFolder, `${docId}.json`), JSON.stringify(initialDoc), 'utf8');

    const indexFile = join(targetFolder, 'index.json');
    writeFileSync(indexFile, JSON.stringify([{ id: docId, grade: '1ère Année', subject: 'Mathématiques' }]), 'utf8');

    const { req, res, getStatus, getData } = createMockReqRes({
      path: `/${docId}/reclassify`,
      body: {
        proposed: {
          grade: '4ème Année',
          subject: 'Français',
          trimester: 'Trimestre 1',
          docType: 'Devoir de Contrôle',
        },
      },
    });

    await docsRouter(req, res, noop);

    expect(getStatus()).toBe(200);
    const data = getData() as { success: boolean; verdict: string; updatedDoc: { grade: string; subject: string; history: { who: string; old: { subject: string }; new: { subject: string } }[] } };
    expect(data.success).toBe(true);
    expect(data.verdict).toBe('ok');
    expect(data.updatedDoc.grade).toBe('4ème Année');
    expect(data.updatedDoc.subject).toBe('Français');
    expect(data.updatedDoc.history).toHaveLength(1);
    expect(data.updatedDoc.history[0].who).toBe('Mme Amel');
    expect(data.updatedDoc.history[0].old.subject).toBe('Mathématiques');
    expect(data.updatedDoc.history[0].new.subject).toBe('Français');
  });
});
