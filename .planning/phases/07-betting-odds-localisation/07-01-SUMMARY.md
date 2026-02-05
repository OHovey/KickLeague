---
phase: 07-betting-odds-localisation
plan: 01
subsystem: api, database
tags: [odds-api, zod, drizzle, odds-conversion, betting]

# Dependency graph
requires:
  - phase: 01-data-foundation
    provides: fixtures table (foreign key target for fixture_odds and affiliate_clicks)
provides:
  - fixture_odds and affiliate_clicks database tables
  - Odds API client with quota tracking and Zod validation
  - Sport key mapping for Big 5 leagues
  - Odds format conversion (decimal/fractional/American) with tests
affects: [07-02 odds ingestion pipeline, 07-03 odds UI components, 07-04 geo-compliance]

# Tech tracking
tech-stack:
  added: []
  patterns: [Odds API partial-accept validation, response header quota tracking, common fractions lookup table]

key-files:
  created:
    - src/db/schema/odds.ts
    - src/lib/odds-api/client.ts
    - src/lib/odds-api/types.ts
    - src/lib/odds-api/sport-keys.ts
    - src/lib/odds-api/odds-format.ts
    - src/lib/odds-api/odds-format.test.ts
  modified:
    - src/db/schema/index.ts

key-decisions:
  - "Odds format conversion uses common fractions lookup table with GCD fallback (no external dependency)"
  - "Odds API client uses partial-accept Zod pattern matching api-football/client.ts conventions"
  - "Sport key map is static with runtime discovery available via fetchSportsKeys()"
  - "fixture_odds table stores prev_*_odds for movement tracking (shortened/drifted indicators)"

patterns-established:
  - "Odds API client: function-based (not class) with quota extraction from response headers"
  - "Common fractions lookup with GCD fallback for odds-format conversion"

# Metrics
duration: 3min
completed: 2026-02-05
---

# Phase 7 Plan 01: Odds API Client and Schema Summary

**Odds API v4 client with Zod validation, fixture_odds/affiliate_clicks schema, sport key mapping for Big 5 leagues, and tested decimal/fractional/American odds conversion**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-05T23:41:14Z
- **Completed:** 2026-02-05T23:44:23Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Database schema for odds storage with movement tracking (prev_*_odds) and affiliate click analytics
- Odds API client with includeLinks support, region filtering, and response header quota tracking
- Zod schemas for The Odds API v4 responses using partial-accept pattern
- Sport key mapping for all 5 Big 5 leagues (EPL, La Liga, Bundesliga, Serie A, Ligue 1)
- Odds format conversion with 19 passing tests covering decimal, fractional, and American formats

## Task Commits

Each task was committed atomically:

1. **Task 1: Database schema for odds and click tracking** - `611afe8` (feat)
2. **Task 2: Odds API client, Zod schemas, sport keys, and format conversion** - `44a6a17` (feat)

## Files Created/Modified
- `src/db/schema/odds.ts` - fixture_odds and affiliate_clicks table definitions with indexes
- `src/db/schema/index.ts` - Added barrel export for odds schema
- `src/lib/odds-api/client.ts` - The Odds API client with fetchOddsForSport and fetchSportsKeys
- `src/lib/odds-api/types.ts` - Zod schemas for API response validation (events, bookmakers, outcomes)
- `src/lib/odds-api/sport-keys.ts` - League slug to Odds API sport key mapping
- `src/lib/odds-api/odds-format.ts` - decimalToAmerican, decimalToFractional, formatOdds functions
- `src/lib/odds-api/odds-format.test.ts` - 19 tests for format conversion

## Decisions Made
- Odds format conversion uses a common fractions lookup table for 28 standard values with GCD-based simplification as fallback, avoiding any external dependency.
- Odds API client is function-based (not class-based) -- simpler than api-football/client.ts since The Odds API doesn't need file caching or rate limiting at the client level.
- Sport key map is a static Record with a runtime discovery function (fetchSportsKeys) for validation against live API.
- fixture_odds table uses prev_*_odds columns for movement tracking rather than a separate snapshots table (simpler, covers the primary use case of shortened/drifted indicators).
- Zod schemas use passthrough on all objects and nullable/optional liberally, matching the partial-accept pattern from 01-02.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in src/proxy.ts (unrelated to this plan) -- confirmed by stashing our changes and checking. No impact on our files.

## User Setup Required
**External services require manual configuration:**
- Set `ODDS_API_KEY` environment variable with key from https://the-odds-api.com/
- Run `npx drizzle-kit push` to create fixture_odds and affiliate_clicks tables in the database

## Next Phase Readiness
- Schema and client ready for odds ingestion pipeline (07-02)
- Sport key mapping covers all 5 Big 5 leagues
- Format conversion tested and ready for UI components (07-03)
- No blockers for subsequent plans

---
*Phase: 07-betting-odds-localisation*
*Completed: 2026-02-05*
