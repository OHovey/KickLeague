import { readFile, writeFile, mkdir, rm } from "fs/promises";
import { createHash } from "crypto";
import { join, dirname } from "path";

interface CacheEntry {
  data: string;
  timestamp: number;
  ttlMs: number;
}

/**
 * Build a deterministic cache key from an endpoint and sorted params.
 * Format: `{endpoint}?{key1=val1&key2=val2}` with params sorted alphabetically.
 */
export function buildCacheKey(
  endpoint: string,
  params: Record<string, string>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return sortedParams ? `${endpoint}?${sortedParams}` : endpoint;
}

/**
 * File-system cache proxy with TTL-based invalidation.
 *
 * Uses SHA-256 hashing with first 2 chars as subdirectory to avoid
 * flat directories with thousands of files.
 *
 * Cache entries store raw data strings with a timestamp and TTL.
 * Expired entries return null (cache miss) and are lazily replaced
 * on the next set() call.
 */
export class CacheProxy {
  private cacheDir: string;
  private defaultTtlMs: number;

  constructor(
    cacheDir: string = ".cache/api-football",
    defaultTtlMs: number = 24 * 60 * 60 * 1000 // 24 hours
  ) {
    this.cacheDir = cacheDir;
    this.defaultTtlMs = defaultTtlMs;
  }

  /**
   * SHA-256 hash of the key string, returned as hex.
   */
  hashKey(key: string): string {
    return createHash("sha256").update(key).digest("hex");
  }

  /**
   * Build the file path for a cache key.
   * Uses first 2 chars of hash as subdirectory.
   * Path: `{cacheDir}/{hash[0:2]}/{hash}.json`
   */
  filePath(key: string): string {
    const hash = this.hashKey(key);
    return join(this.cacheDir, hash.slice(0, 2), `${hash}.json`);
  }

  /**
   * Read a cached value by key.
   * Returns null if expired, missing, or on any fs error (cache miss).
   */
  async get(key: string): Promise<string | null> {
    try {
      const path = this.filePath(key);
      const content = await readFile(path, "utf-8");
      const entry: CacheEntry = JSON.parse(content);

      if (Date.now() - entry.timestamp > entry.ttlMs) {
        return null; // Expired
      }
      return entry.data;
    } catch {
      return null; // Cache miss (file not found, parse error, etc.)
    }
  }

  /**
   * Write a value to the cache with optional TTL override.
   * Creates directories recursively as needed.
   */
  async set(key: string, data: string, ttlMs?: number): Promise<void> {
    const path = this.filePath(key);
    const dir = dirname(path);
    await mkdir(dir, { recursive: true });

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttlMs: ttlMs ?? this.defaultTtlMs,
    };
    await writeFile(path, JSON.stringify(entry));
  }

  /**
   * Remove the entire cache directory. Useful for development reset.
   */
  async clear(): Promise<void> {
    try {
      await rm(this.cacheDir, { recursive: true, force: true });
    } catch {
      // Directory may not exist, that's fine
    }
  }
}
