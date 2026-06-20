import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Durable rate limiting via Upstash Redis when configured (works globally across
// all Vercel serverless instances). Falls back to a per-instance in-memory
// limiter when Upstash env vars are absent — fine for local dev, but NOT a hard
// global limit in production. To enforce global limits on Vercel, add the Upstash
// integration and set UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN.

const upstashConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = upstashConfigured ? Redis.fromEnv() : null;
const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number) {
  const key = `${limit}:${windowMs}`;
  let rl = limiters.get(key);
  if (!rl) {
    rl = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: "snow-rl",
    });
    limiters.set(key, rl);
  }
  return rl;
}

// --- in-memory fallback ---
type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

function memLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count += 1;
  if (b.count > limit) {
    return { ok: false, retryAfter: Math.ceil((b.reset - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

export async function rateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000
): Promise<{ ok: boolean; retryAfter: number }> {
  if (!redis) return memLimit(key, limit, windowMs);
  try {
    const r = await getLimiter(limit, windowMs).limit(key);
    return {
      ok: r.success,
      retryAfter: r.success
        ? 0
        : Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)),
    };
  } catch {
    // If Redis is unreachable, degrade to in-memory rather than failing open.
    return memLimit(key, limit, windowMs);
  }
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
