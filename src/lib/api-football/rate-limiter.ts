import { RateLimiter } from "limiter";

/**
 * Create a rate limiter configured for API-Football Pro tier:
 * 30 requests per minute (conservative; Pro allows 300/min).
 *
 * The limiter uses a token bucket algorithm. Calling `removeTokens(1)`
 * will await until a token is available if the bucket is empty.
 */
export function createRateLimiter(): RateLimiter {
  return new RateLimiter({
    tokensPerInterval: 30,
    interval: "minute",
  });
}

/**
 * Tracks daily API quota from API-Football response headers.
 *
 * API-Football Pro tier allows 7,500 requests/day. This tracker reads
 * the `x-ratelimit-requests-remaining` and `x-ratelimit-requests-limit`
 * headers from each response to maintain an accurate count.
 *
 * The `canMakeRequest()` method reserves a configurable number of requests
 * for critical operations (e.g., live updates), defaulting to 10.
 */
export class DailyQuotaTracker {
  remaining: number;
  limit: number;

  constructor(limit: number = 7500) {
    this.limit = limit;
    this.remaining = limit;
  }

  /**
   * Update quota tracking from API-Football response headers.
   * Reads `x-ratelimit-requests-remaining` and `x-ratelimit-requests-limit`.
   */
  updateFromHeaders(headers: Headers): void {
    const remainingHeader = headers.get("x-ratelimit-requests-remaining");
    const limitHeader = headers.get("x-ratelimit-requests-limit");

    if (remainingHeader !== null) {
      const parsed = parseInt(remainingHeader, 10);
      if (!isNaN(parsed)) {
        this.remaining = parsed;
      }
    }

    if (limitHeader !== null) {
      const parsed = parseInt(limitHeader, 10);
      if (!isNaN(parsed)) {
        this.limit = parsed;
      }
    }
  }

  /**
   * Check if a request can be made without exceeding the reserved budget.
   *
   * @param reserveForCritical - Number of requests to reserve for critical
   *   operations (default 10). Returns false if remaining <= this value.
   */
  canMakeRequest(reserveForCritical: number = 10): boolean {
    return this.remaining > reserveForCritical;
  }

  /**
   * Human-readable display of remaining daily quota.
   * Example: "85/100 daily requests remaining"
   */
  getRemainingDisplay(): string {
    return `${this.remaining}/${this.limit} daily requests remaining`;
  }
}
