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

const AI_DAILY_CAP = 1200;
const AI_MINUTE_CAP = 12;
let aiDailyUsage = { day: '', count: 0 };
let aiMinuteUsage = { minute: '', count: 0 };
export const aiDailyGuard = (_req: Request, res: Response, next: NextFunction): void => {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const thisMinute = now.slice(0, 16);
  if (aiDailyUsage.day !== today) aiDailyUsage = { day: today, count: 0 };
  if (aiMinuteUsage.minute !== thisMinute) aiMinuteUsage = { minute: thisMinute, count: 0 };
  if (aiDailyUsage.count >= AI_DAILY_CAP) {
    res.status(503).json({ error: 'Quota IA quotidien atteint. Réessayez demain.' });
    return;
  }
  if (aiMinuteUsage.count >= AI_MINUTE_CAP) {
    res.setHeader('Retry-After', 60);
    res.status(429).json({ error: 'Service IA très sollicité. Réessayez dans une minute.' });
    return;
  }
  aiDailyUsage.count++;
  aiMinuteUsage.count++;
  next();
};
