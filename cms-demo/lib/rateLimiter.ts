import { NextRequest } from "next/server";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export function createRateLimiter(config: RateLimitConfig) {
  return (
    req: NextRequest
  ): { allowed: boolean; remaining: number; resetTime: number } => {
    const now = Date.now();
    const key = config.keyGenerator
      ? config.keyGenerator(req)
      : getDefaultKey(req);

    let entry = store[key];
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      store[key] = entry;
    }

    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    entry.count++;

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime,
    };
  };
}

function getDefaultKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : req.ip || "unknown";
  return `rate_limit:${ip}`;
}

export const deleteProductRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyGenerator: (req) => {
    const userId = req.headers.get("x-user-id");
    if (userId) {
      return `delete_product:${userId}`;
    }
    return getDefaultKey(req);
  },
});

export const generalApiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
});

export const filterRateLimiter = createRateLimiter({
  windowMs: 10 * 1000,
  maxRequests: 20,
});
