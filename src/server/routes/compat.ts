/**
 * Backward-compatibility layer for /api/ai/*.
 *
 * The route rewrite (commit 44c63f1) renamed request fields and response keys, but the Angular clients
 * (editor-studio, teacher-home, education-store, solve-home, summarize-home, student-home) still use the
 * original contract, so transform / variant / auto-tag / photo-solve / summarize / announcement / explain
 * answered HTTP 400 or an unread key. This layer accepts BOTH shapes on the way in and returns BOTH on the way out,
 * so neither side has to change at once.
 */
import type { NextFunction, Request, Response } from 'express';

type Body = Record<string, unknown>;
const isObj = (v: unknown): v is Body => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');

/** Old client request fields -> fields the current routes read. Never mutates `body`; new fields win over old ones. */
export function normalizeRequestBody(path: string, body: unknown): Body {
  const b: Body = isObj(body) ? { ...body } : {};

  switch (path) {
    case '/transform-exercise': {
      const ob = isObj(b['originalBlock']) ? b['originalBlock'] : null;
      if (ob && !b['exercise']) {
        b['exercise'] = {
          title: str(ob['exerciseTitle']) || str(b['topic']) || 'Exercice',
          promptText: str(ob['content']),
          solutionText: str(ob['exerciseSolution']),
        };
      }
      if (!b['targetFormat'] && b['transformType']) b['targetFormat'] = b['transformType'] === 'to_qcm' ? 'qcm' : 'free';
      break;
    }
    case '/variant': {
      if (!b['exercise'] && typeof b['originalPromptText'] === 'string') {
        b['exercise'] = { title: str(b['topic']) || 'Exercice', promptText: b['originalPromptText'] };
      }
      if (!b['variantType'] && b['format']) b['variantType'] = b['format'];
      break;
    }
    case '/auto-tag-document': {
      if (b['filename'] === undefined && b['documentName'] !== undefined) b['filename'] = b['documentName'];
      if (b['fileData'] === undefined && b['base64Data'] !== undefined) b['fileData'] = b['base64Data'];
      if (b['mimeType'] === undefined && b['contentType'] !== undefined) b['mimeType'] = b['contentType'];
      break;
    }
    case '/photo-solve': {
      if (b['photoBase64'] === undefined && b['base64Data'] !== undefined) b['photoBase64'] = b['base64Data'];
      if (b['mimeType'] === undefined && b['contentType'] !== undefined) b['mimeType'] = b['contentType'];
      break;
    }
    case '/analyze-worksheet': {
      if (b['imageBase64'] === undefined && b['base64Data'] !== undefined) b['imageBase64'] = b['base64Data'];
      if (b['mimeType'] === undefined && b['contentType'] !== undefined) b['mimeType'] = b['contentType'];
      break;
    }
    case '/generate-memo': {
      // Old MemoInput (education-store) -> current route fields.
      if (b['teacherNotes'] === undefined && typeof b['text'] === 'string') b['teacherNotes'] = b['text'];
      if (b['existingMemo'] === undefined && b['currentMemo'] !== undefined) b['existingMemo'] = b['currentMemo'];
      if (b['userInstruction'] === undefined && (b['instructions'] !== undefined || b['blockToRegenerate'])) {
        const block = str(b['blockToRegenerate']);
        b['userInstruction'] = [str(b['instructions']), block ? `Régénère uniquement le bloc "${block}" de la fiche mémo existante.` : '']
          .filter(Boolean)
          .join('\n');
      }
      if (!Array.isArray(b['sourceFiles'])) {
        const files: Body[] = [];
        for (const i of (Array.isArray(b['images']) ? b['images'] : []).filter(isObj)) {
          files.push({ data: str(i['base64Data']), mimeType: str(i['contentType']) || 'image/jpeg' });
        }
        const f = isObj(b['file']) ? b['file'] : null;
        if (f && str(f['base64Data'])) files.push({ data: str(f['base64Data']), mimeType: str(f['contentType']) || 'application/pdf' });
        const usable = files.filter((x) => x['data']);
        if (usable.length) b['sourceFiles'] = usable;
      }
      break;
    }
    case '/summarize-docs': {
      if (!Array.isArray(b['files'])) {
        const images = Array.isArray(b['images']) ? b['images'] : [];
        const files = images.filter(isObj).map((i, n) => ({
          name: str(i['name']) || `page-${n + 1}`,
          data: str(i['base64Data']) || str(i['data']),
          mimeType: str(i['contentType']) || str(i['mimeType']) || 'image/jpeg',
        }));
        if (!files.length && typeof b['base64Data'] === 'string') {
          files.push({ name: 'document', data: b['base64Data'], mimeType: str(b['contentType']) || 'image/jpeg' });
        }
        if (files.length) b['files'] = files;
      }
      break;
    }
  }
  return b;
}

/** Key the clients read on a successful reply, per route. The current key is kept too. */
const RESPONSE_ALIASES: Record<string, { from: string; to: string }> = {
  '/transform-exercise': { from: 'exercise', to: 'transformed' },
  '/variant': { from: 'exercise', to: 'variant' },
  '/auto-tag-document': { from: 'metadata', to: 'tags' },
  '/photo-solve': { from: 'solution', to: 'result' },
  '/solve-exercise': { from: 'solution', to: 'result' },
  '/summarize-docs': { from: 'summary', to: 'result' },
  '/draft-announcement': { from: 'announcement', to: 'result' },
  '/explain-concept': { from: 'explanation', to: 'result' },
  '/chat-article': { from: 'assistantMessage', to: 'replyText' },
  '/generate-memo': { from: 'memoDoc', to: 'result' },
};

export function adaptResponseBody(path: string, body: unknown): unknown {
  const alias = RESPONSE_ALIASES[path];
  if (!alias || !isObj(body) || body['success'] !== true) return body;
  if (body[alias.to] !== undefined || body[alias.from] === undefined) return body;
  return { ...body, [alias.to]: body[alias.from] };
}

/** Express middleware: mount first on the AI router. `req.path` is relative to the mount point. */
export const legacyCompat = (req: Request, res: Response, next: NextFunction): void => {
  req.body = normalizeRequestBody(req.path, req.body);
  const original = res.json.bind(res);
  res.json = (payload: unknown): Response => original(adaptResponseBody(req.path, payload));
  next();
};
