// Simple in-memory sliding-window rate limiter, keyed by IP.
// For multi-instance production deployments, swap this for a Redis-backed limiter.

type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10; // per window, per key

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - bucket.windowStart) };
  }

  bucket.count += 1;
  return { allowed: true };
}

// Periodic cleanup to avoid unbounded memory growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.windowStart > WINDOW_MS) buckets.delete(key);
  }
}, WINDOW_MS).unref?.();
