import { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { originGuard, uploadRateLimiter } from '../guards';
import {
  uploadsFolder,
  validateFileMagicBytes,
  ALLOWED_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  USER_QUOTA_BYTES,
  UPLOAD_KINDS,
  userUsageBytes,
  pruneOldAvatars,
  verifyFirebaseUser,
} from '../storage';

export const uploadRouter = Router();

uploadRouter.post('/', originGuard, uploadRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = await verifyFirebaseUser(req);
    if (!uid) {
      res.status(401).json({ error: 'Connexion requise pour envoyer un fichier.' });
      return;
    }
    const rawData = req.body.base64Data || req.body.fileData || req.body.fileBase64;
    const rawName = req.body.filename || req.body.fileName;
    const rawType = req.body.contentType || req.body.fileType || req.body.mimeType;
    const kind = UPLOAD_KINDS.has(req.body.kind) ? (req.body.kind as string) : 'documents';

    if (!rawData || typeof rawData !== 'string') {
      res.status(400).json({ error: 'Aucun fichier transmis ou format invalide' });
      return;
    }

    // Strip base64 prefix if present
    const base64Clean = rawData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    if (buffer.length > MAX_UPLOAD_BYTES) {
      res.status(413).json({ error: 'Fichier trop volumineux (limite 15 Mo)' });
      return;
    }

    let ext = ((rawName || '').split('.').pop() || '').toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      ext = rawType?.includes('pdf') ? 'pdf' : rawType?.includes('png') ? 'png' : 'jpg';
    }

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      res.status(400).json({ error: 'Format de fichier non autorisé. Formats acceptés : PDF, PNG, JPG, WEBP, DOCX.' });
      return;
    }

    // Sniff Magic Bytes
    if (!validateFileMagicBytes(buffer, ext)) {
      res.status(400).json({ error: 'Contenu du fichier corrompu ou ne correspondant pas à son extension.' });
      return;
    }

    const cleanName = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    if (userUsageBytes(uid) + buffer.length > USER_QUOTA_BYTES) {
      res.status(413).json({
        error: `Quota de stockage atteint (${Math.round(USER_QUOTA_BYTES / 1024 / 1024)} Mo). Supprimez d'anciens fichiers.`,
      });
      return;
    }

    const targetDir = join(uploadsFolder, kind, uid);
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(join(targetDir, cleanName), buffer);
    if (kind === 'avatars') pruneOldAvatars(uid, cleanName);

    res.json({
      success: true,
      url: `/uploads/${kind}/${uid}/${cleanName}`,
      filename: cleanName,
      size: buffer.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur d\'upload';
    console.error('Upload error:', err);
    res.status(500).json({ error: message });
  }
});
