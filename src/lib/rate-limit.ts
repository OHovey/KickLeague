/**
 * In-memory token bucket rate limiter.
 *
 * Uses lazy refill: tokens are replenished when checked, not on a timer.
 * Stale IP entries are cleaned up lazily inside rateLimit() to avoid
 * dangling setInterval timers in serverless environments.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RateLimitConfig {
  /** Max tokens per IP per refill window */
  maxTokensPerIp: number;
  /** Refill window in milliseconds (60_000 = 1 minute) */
  windowMs: number;
  /** Global ceiling -- max requests across ALL IPs per window */
  globalMax: number;
  /** Identifier for logging (e.g. 'updates/check', 'clicks') */
  endpoint: string;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

// ---------------------------------------------------------------------------
// Pre-configured instances
// ---------------------------------------------------------------------------

export const RATE_LIMIT_UPDATES: RateLimitConfig = {
  maxTokensPerIp: 30,
  windowMs: 60_000,
  globalMax: 300,
  endpoint: 'updates/check',
};

export const RATE_LIMIT_CLICKS: RateLimitConfig = {
  maxTokensPerIp: 10,
  windowMs: 60_000,
  globalMax: 100,
  endpoint: 'clicks',
};

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const ipBuckets = new Map<string, Bucket>();

const globalBucket: Bucket = {
  tokens: Infinity, // will be initialised on first call per config
  lastRefill: Date.now(),
};

/** Track the current global config so we can reset tokens correctly. */
let currentGlobalMax = 0;

let lastCleanup = Date.now();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function refillBucket(bucket: Bucket, maxTokens: number, windowMs: number, now: number): void {
  const elapsed = now - bucket.lastRefill;
  if (elapsed >= windowMs) {
    bucket.tokens = maxTokens;
    bucket.lastRefill = now;
  }
}

function retryAfter(bucket: Bucket, windowMs: number, now: number): number {
  const elapsed = now - bucket.lastRefill;
  return Math.ceil((windowMs - elapsed) / 1000);
}

function cleanup(windowMs: number, now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  const staleThreshold = now - windowMs * 2;
  for (const [key, bucket] of ipBuckets) {
    if (bucket.lastRefill < staleThreshold) {
      ipBuckets.delete(key);
    }
  }
  lastCleanup = now;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function rateLimit(ip: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();

  // Lazy cleanup of stale IP entries
  cleanup(config.windowMs, now);

  // --- Global bucket ---
  // Initialise global max on first call or if config changed
  if (currentGlobalMax !== config.globalMax) {
    if (currentGlobalMax === 0) {
      // First ever call -- initialise
      globalBucket.tokens = config.globalMax;
      globalBucket.lastRefill = now;
    }
    currentGlobalMax = config.globalMax;
  }
  refillBucket(globalBucket, config.globalMax, config.windowMs, now);

  // --- IP bucket ---
  let ipBucket = ipBuckets.get(ip);
  if (!ipBucket) {
    ipBucket = { tokens: config.maxTokensPerIp, lastRefill: now };
    ipBuckets.set(ip, ipBucket);
  }
  refillBucket(ipBucket, config.maxTokensPerIp, config.windowMs, now);

  // --- Check limits ---
  if (ipBucket.tokens <= 0 || globalBucket.tokens <= 0) {
    const ipRetry = retryAfter(ipBucket, config.windowMs, now);
    const globalRetry = retryAfter(globalBucket, config.windowMs, now);
    const wait = Math.max(ipRetry, globalRetry);

    console.log(
      `[rate-limit] 429 | endpoint=${config.endpoint} | ip=${ip} | time=${new Date(now).toISOString()}`
    );

    return { allowed: false, retryAfterSeconds: wait };
  }

  // Decrement both buckets
  ipBucket.tokens -= 1;
  globalBucket.tokens -= 1;

  return { allowed: true, retryAfterSeconds: 0 };
}
