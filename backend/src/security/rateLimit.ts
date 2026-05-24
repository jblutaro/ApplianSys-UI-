import type { NextFunction, Request, Response } from "express";

type RateLimitOptions = {
  key?: (req: Request) => string;
  limit: number;
  message?: string;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

function defaultKey(req: Request) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return (forwardedIp?.split(",")[0] || req.ip || req.socket.remoteAddress || "unknown").trim();
}

export function createRateLimiter(options: RateLimitOptions) {
  const buckets = new Map<string, RateLimitBucket>();

  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
    const now = Date.now();
    const key = options.key?.(req) ?? defaultKey(req);
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    bucket.count += 1;
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    res.setHeader("RateLimit-Limit", String(options.limit));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, options.limit - bucket.count)));
    res.setHeader("RateLimit-Reset", String(retryAfterSeconds));

    if (bucket.count > options.limit) {
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(429).json({
        ok: false,
        message: options.message ?? "Too many requests. Please try again later.",
      });
      return;
    }

    next();
  };
}

export function buildIpAndEmailKey(req: Request) {
  const body = req.body as { email?: unknown } | undefined;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const ip = (forwardedIp?.split(",")[0] || req.ip || req.socket.remoteAddress || "unknown").trim();
  return `${ip}:${email || "unknown"}`;
}
