/**
 * API-Football client with integrated rate limiting, Zod validation,
 * and file-cache proxy.
 *
 * Request chain: cache check -> rate limit -> fetch -> validate -> cache write
 *
 * This client is the single gateway to API-Football data. It protects
 * the Pro tier budget (7,500 req/day) by caching every response to disk,
 * enforces the 30 req/minute rate limit, and validates all responses
 * with Zod using the partial accept pattern (log warnings but don't
 * reject entire responses for minor schema mismatches).
 *
 * The client is completely unaware of the database. It fetches and
 * validates -- that's it.
 */

import { z } from "zod";
import type { RateLimiter } from "limiter";
import { CacheProxy, buildCacheKey } from "./cache-proxy";
import { createRateLimiter, DailyQuotaTracker } from "./rate-limiter";
import { API_FOOTBALL_BASE_URL } from "./endpoints";

export interface ApiFootballClientOptions {
  /** Directory to store cache files. Default: `.cache/api-football` */
  cacheDir?: string;
  /** Cache TTL in milliseconds. Default: 24 hours */
  cacheTtlMs?: number;
  /** Whether to use the file cache. Default: true */
  useCache?: boolean;
}

export class ApiFootballClient {
  private apiKey: string;
  private baseUrl: string;
  private cache: CacheProxy;
  private rateLimiter: RateLimiter;
  private dailyQuota: DailyQuotaTracker;
  private useCache: boolean;

  constructor(apiKey: string, options?: ApiFootballClientOptions) {
    this.apiKey = apiKey;
    this.baseUrl = API_FOOTBALL_BASE_URL;
    this.useCache = options?.useCache ?? true;

    this.cache = new CacheProxy(
      options?.cacheDir ?? ".cache/api-football",
      options?.cacheTtlMs ?? 24 * 60 * 60 * 1000 // 24 hours
    );

    this.rateLimiter = createRateLimiter();
    this.dailyQuota = new DailyQuotaTracker();
  }

  /**
   * Fetch data from an API-Football endpoint.
   *
   * Chain: cache check -> daily quota check -> rate limit -> HTTP fetch
   *        -> quota update -> Zod validate -> cache write -> return
   *
   * @param endpoint - API path (e.g., `/leagues`)
   * @param params - Query parameters as key-value pairs
   * @param schema - Zod schema to validate the response against
   * @returns Validated (or raw on partial accept) response data
   */
  async get<T>(
    endpoint: string,
    params: Record<string, string>,
    schema: z.ZodType<T>
  ): Promise<T> {
    const cacheKey = buildCacheKey(endpoint, params);

    // 1. Check cache (if enabled)
    if (this.useCache) {
      const cached = await this.cache.get(cacheKey);
      if (cached !== null) {
        const parsed = JSON.parse(cached);
        const result = schema.safeParse(parsed);
        if (result.success) {
          return result.data;
        }
        // Cached data fails current schema validation -- this happens when
        // schemas evolve. Log a warning but still return the cached data
        // to avoid wasting API quota on re-fetch.
        console.warn(
          `[api-football] Cache hit for ${endpoint} but schema validation failed (${result.error.issues.length} issue(s)). Returning cached data anyway.`
        );
        return parsed as T;
      }
    }

    // 2. Check daily quota
    if (!this.dailyQuota.canMakeRequest()) {
      throw new Error(
        `[api-football] Daily quota exhausted or reserved. ${this.dailyQuota.getRemainingDisplay()}. ` +
          `Cannot make request to ${endpoint}. Try again tomorrow or upgrade your plan.`
      );
    }

    // 3. Rate limit -- await token availability
    const remainingTokens = await this.rateLimiter.removeTokens(1);
    if (remainingTokens < 0) {
      console.warn(
        `[api-football] Rate limited, waiting for token... (requesting ${endpoint})`
      );
    }

    // 4. Fetch from API
    const url = new URL(endpoint, this.baseUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), {
      headers: {
        "x-apisports-key": this.apiKey,
      },
    });

    // 5. Update daily quota from response headers
    this.dailyQuota.updateFromHeaders(response.headers);

    // 6. Handle HTTP errors
    if (!response.ok) {
      const body = await response.text().catch(() => "(unable to read body)");
      throw new Error(
        `[api-football] HTTP ${response.status} from ${endpoint}: ${body}`
      );
    }

    // 7. Parse JSON
    const json = await response.json();

    // 8. Validate with Zod (partial accept pattern)
    const result = schema.safeParse(json);

    if (result.success) {
      // Valid response -- cache and return
      if (this.useCache) {
        await this.cache.set(cacheKey, JSON.stringify(json));
      }
      return result.data;
    }

    // 9. Partial accept: log warnings but cache and return raw data
    const issuesSummary = result.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    const moreCount = result.error.issues.length - 5;

    console.warn(
      `[api-football] Validation warning for ${endpoint}: ${issuesSummary}` +
        (moreCount > 0 ? ` (+${moreCount} more issues)` : "")
    );

    // Cache the raw response anyway -- don't lose data due to schema mismatch
    if (this.useCache) {
      await this.cache.set(cacheKey, JSON.stringify(json));
    }

    return json as T;
  }

  /**
   * Get a human-readable string showing the current daily quota status.
   */
  getDailyQuotaStatus(): string {
    return this.dailyQuota.getRemainingDisplay();
  }

  /**
   * Check if the daily quota allows making more requests.
   * Takes into account the critical operation reserve.
   */
  canMakeRequest(reserveForCritical?: number): boolean {
    return this.dailyQuota.canMakeRequest(reserveForCritical);
  }

  /**
   * Clear the entire file cache. Useful for development reset.
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
  }
}
