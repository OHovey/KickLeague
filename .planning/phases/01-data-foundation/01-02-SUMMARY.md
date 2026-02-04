---
phase: 01-data-foundation
plan: 02
subsystem: api
tags: [api-football, zod, rate-limiting, file-cache, typescript]

# Dependency graph
requires: []
provides:
  - ApiFootballClient class with cache -> rate limit -> fetch -> validate chain
  - Zod schemas for all API-Football response types (leagues, teams, standings, fixtures, players)
  - CacheProxy with TTL-based file caching and subdirectory hashing
  - DailyQuotaTracker with header-based budget tracking and critical operation reserve
  - Endpoint constants and league ID mappings
affects:
  - 01-03 (seeding pipeline imports ApiFootballClient and schemas)
  - 06 (live data pipeline uses same client with different cache TTL)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Partial accept pattern: safeParse + log warnings + return data on schema mismatch"
    - "Cache-first request chain: cache -> quota -> rate limit -> fetch -> validate -> cache write"
    - "Subdirectory file cache: SHA-256 hash with first 2 chars as directory prefix"

key-files:
  created:
    - src/lib/api-football/client.ts
    - src/lib/api-football/types.ts
    - src/lib/api-football/endpoints.ts
    - src/lib/api-football/cache-proxy.ts
    - src/lib/api-football/rate-limiter.ts
  modified: []

key-decisions:
  - "Zod v4 used (matches installed version) -- safeParse and passthrough APIs are backward compatible"
  - "z.record requires two args in v4 -- fixed during compile verification"
  - "Cache returns stale data on schema evolution rather than re-fetching (preserves API quota)"

patterns-established:
  - "Partial accept: safeParse() always, never parse(). Log warnings, return data."
  - "Cache-first: every API call goes through cache proxy. Zero network calls when cache is warm."
  - "Quota reservation: DailyQuotaTracker.canMakeRequest(reserveForCritical=10) blocks when nearing limit."

# Metrics
duration: 5min
completed: 2026-02-04
---

# Phase 1 Plan 2: API-Football Client Summary

**API-Football client with file-cache proxy, 10 req/min rate limiter, daily quota tracker, and Zod schemas for all response types using safeParse partial accept pattern**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-04T19:53:05Z
- **Completed:** 2026-02-04T19:58:05Z
- **Tasks:** 2
- **Files created:** 5

## Accomplishments

- CacheProxy class with TTL-based file caching, SHA-256 key hashing, and 2-char subdirectory structure to avoid flat directories
- Rate limiter (10 tokens/minute) and DailyQuotaTracker reading API-Football response headers with budget reservation for critical operations
- Comprehensive Zod schemas for all API-Football response types: leagues, teams, standings, fixtures (basic + detailed with events/stats/lineups/players), player squads, player stats
- ApiFootballClient class chaining: cache check -> daily quota check -> rate limit -> HTTP fetch -> header quota update -> Zod safeParse -> cache write

## Task Commits

Each task was committed atomically:

1. **Task 1: File-cache proxy and rate limiter modules** - `0daafad` (feat)
2. **Task 2: Zod response schemas, endpoint definitions, and API client class** - `bc2f52b` (feat)

## Files Created/Modified

- `src/lib/api-football/cache-proxy.ts` - CacheProxy class with TTL file cache, buildCacheKey helper
- `src/lib/api-football/rate-limiter.ts` - createRateLimiter factory (10/min), DailyQuotaTracker class
- `src/lib/api-football/endpoints.ts` - API_FOOTBALL_BASE_URL, LEAGUE_IDS, LEAGUE_SLUGS, ENDPOINTS, SEASONS
- `src/lib/api-football/types.ts` - All Zod schemas and inferred TypeScript types for API-Football responses
- `src/lib/api-football/client.ts` - ApiFootballClient class with get() method and quota management

## Decisions Made

- Used Zod v4 (installed as `^4.3.6` by plan 01-01) -- the safeParse and passthrough APIs are backward compatible with v3 patterns from RESEARCH.md
- Cache returns stale data when schema evolves rather than re-fetching, to preserve API quota during development
- All Zod schemas use `.nullable().optional()` liberally and `.passthrough()` on all objects to tolerate API response variations
- Endpoint constants centralized in endpoints.ts -- no hardcoded league IDs in client code

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Zod v4 z.record() signature**
- **Found during:** Task 2 (TypeScript compile verification)
- **Issue:** Zod v4 requires `z.record(keySchema, valueSchema)` instead of v3's `z.record(valueSchema)`
- **Fix:** Changed `z.record(z.string())` to `z.record(z.string(), z.string())` in apiResponseSchema
- **Files modified:** src/lib/api-football/types.ts
- **Verification:** TypeScript compile passes clean
- **Committed in:** bc2f52b (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor Zod v4 API difference. No scope creep.

## Issues Encountered

- TypeScript `npx tsc` binary symlink was broken in node_modules/.bin (plan 01-01 parallel installation race condition). Worked around by calling `node node_modules/typescript/lib/tsc.js` directly.

## User Setup Required

**External services require manual configuration.** See [01-USER-SETUP.md](./01-USER-SETUP.md) for:
- API-Football API key configuration
- Environment variable setup (`API_FOOTBALL_KEY`)
- Verification command to test API key

## Next Phase Readiness

- API-Football client module is complete and ready for Plan 01-03 (seeding pipeline) to import
- All Zod schemas cover the response types needed for seeding leagues, teams, standings, fixtures, and players
- File-cache proxy ensures development iteration won't exhaust the 100 req/day free tier budget
- No blockers for Plan 01-03

---
*Phase: 01-data-foundation*
*Completed: 2026-02-04*
