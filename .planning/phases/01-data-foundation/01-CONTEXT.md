# Phase 1: Data Foundation - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Database schema, API-Football client, and data seeding pipeline for all 5 Big European leagues (Premier League, La Liga, Serie A, Bundesliga, Ligue 1). This phase delivers the data layer that all subsequent phases build on. Live automated updates belong in Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Schema design
- League-specific configuration stored in a dedicated `league_config` table with typed columns (tiebreaker_method, relegation_zone_size, etc.) — not a JSONB blob
- Players and basic stats seeded in Phase 1 alongside teams, fixtures, and standings — avoids migration later for Phase 4's squad tab
- Full match events stored per fixture (goals with minute, cards, substitutions) — not just scores
- Detailed match statistics included (possession, shots, xG where available)

### Zone definitions
- Claude's Discretion: approach for modelling zone definitions (position ranges vs rule-based) — pick what best serves Phase 2's rendering needs

### API client behavior
- Prioritized API budget: reserve a portion of daily quota for critical operations (live updates in Phase 6), block non-critical seeds first when approaching limits
- File-cache proxy uses TTL-based invalidation with configurable expiry (e.g., 24 hours) — cached responses expire and re-fetch automatically
- Partial accept on validation failures: accept fields that pass Zod validation, null-out or skip what doesn't, log warnings — don't reject entire responses for partial schema mismatches
- Log errors only — no request-level logging for every API call. Failures and validation warnings are logged in detail.

### Seeding workflow
- Per-league seeding supported: `seed --league premier-league` or `seed --all`
- Upsert on re-run: insert new records, update existing ones. Idempotent, safe to run multiple times
- Rate limit pauses surfaced to developer: show "Rate limited, waiting 30s..." messages so they know what's happening
- Lightweight refresh command included: fetches only data newer than last seed, not a full reseed. Keeps data fresh during development before Phase 6 automates this.

### Data freshness scope
- Seed current season (2025/26) plus previous season (2024/25) — provides H2H history for Phase 3 match pages
- Entities seeded: leagues, teams, fixtures (with full events and detailed stats), standings, players with basic stats
- Coverage metadata tracked per league/stat type for stats with incomplete availability (xG in Ligue 1, some Serie A matches) — enables UI to show "data unavailable" vs empty state

### Claude's Discretion
- Zone definition modelling approach
- Seed command output format and verbosity style
- Exact rate limiting implementation (token bucket, sliding window, etc.)
- Compression and temp file handling for cache proxy
- Database migration tool choice

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Key constraint: the schema must support league-specific configurations as data (not hardcoded logic) per the roadmap success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-data-foundation*
*Context gathered: 2026-02-04*
