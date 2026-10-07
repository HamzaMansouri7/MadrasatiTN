import { Request, Response, NextFunction } from 'express';

const ALLOWED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '169.58.107.183',
  'madrastihub.com',
  'www.madrastihub.com',
]);

export const originGuard = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host?.split(':')[0];

  // Allow same-origin requests or direct trusted browser requests
  if (!origin && !referer) {
    if (host && ALLOWED_HOSTS.has(host)) {
      next();
      return;
    }
  }

  const checkUrl = origin || referer;
  if (checkUrl) {
    try {
      const parsedHost = new URL(checkUrl).hostname;
      if (ALLOWED_HOSTS.has(parsedHost)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
          res.sendStatus(204);
          return;
        }
        next();
        return;
      }
    } catch {
      // Invalid URL
    }
  }

  // If running locally in development without strict origin
  if (process.env['NODE_ENV'] !== 'production') {
    next();
    return;
  }

  res.status(403).json({ error: 'Accès non autorisé (Origine non reconnue)' });
};

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export const createRateLimiter = (maxRequests: number, windowMs: number, label: string) => {
  const ipStore = new Map<string, RateLimitRecord>();

  // Cleanup expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [ip, rec] of ipStore.entries()) {
      if (rec.resetAt <= now) ipStore.delete(ip);
    }
  }, windowMs).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    let record = ipStore.get(ip);

    if (!record || record.resetAt <= now) {
      record = { count: 1, resetAt: now + windowMs };
      ipStore.set(ip, record);
      next();
      return;
    }

    if (record.count >= maxRequests) {
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      res.status(429).json({
        error: `Trop de requêtes (${label}). Veuillez patienter ${retryAfterSec} secondes.`,
      });
      return;
    }

    record.count++;
    next();
  };
};

export const uploadRateLimiter = createRateLimiter(10, 15 * 60 * 1000, 'Uploads limités à 10 par 15 min');

const aiPerIpMinuteLimiter = createRateLimiter(8, 60 * 1000, 'Requêtes IA limitées à 8 par minute');
const aiPerIpDailyLimiter = createRateLimiter(60, 24 * 60 * 60 * 1000, 'Quota IA personnel du jour atteint');
export const aiRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  aiPerIpMinuteLimiter(req, res, () => aiPerIpDailyLimiter(req, res, next));
};

// Global burst guard only. The old 1,200/day site-wide cap was a cost ceiling for the paid Gemini key;
// the keys are free-tier now, so the provider chain's own cooldowns handle quota. Per-IP limits above still stop abuse.
const AI_MINUTE_CAP = 12;
let aiMinuteUsage = { minute: '', count: 0 };
export const aiDailyGuard = (_req: Request, res: Response, next: NextFunction): void => {
  const thisMinute = new Date().toISOString().slice(0, 16);
  if (aiMinuteUsage.minute !== thisMinute) aiMinuteUsage = { minute: thisMinute, count: 0 };
  if (aiMinuteUsage.count >= AI_MINUTE_CAP) {
    res.setHeader('Retry-After', 60);
    res.status(429).json({ error: 'Service IA très sollicité. Réessayez dans une minute.' });
    return;
  }
  aiMinuteUsage.count++;
  next();
};
