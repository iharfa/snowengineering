// ponytail: in-memory fixed-window limiter. Per-instance only — on Vercel each
// serverless instance keeps its own counters and cold starts reset them. This is
// defense-in-depth behind Cloudflare, NOT a hard global limit. For strict global
// limits use Cloudflare rate-limiting rules or Upstash Redis (@upstash/ratelimit).

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();

  // Cheap unbounded-growth guard: purge expired entries when the map gets large.
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

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
