---
phase: 09-affiliate-link-builder-pipeline-integration
plan: 03
subsystem: api
tags: [cron, qstash, odds-api, affiliate, pipeline, upsert]

# Dependency graph
requires:
  - phase: 09-01
    provides: "buildAffiliateLink and affiliate config for link enrichment"
provides:
  - "QStash-triggered cron route for automated odds refresh at /api/cron/refresh-odds"
  - "refreshOdds() pipeline function polling all 5 leagues with affiliate enrichment"
affects: ["10-deploy-production"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Odds refresh pipeline with per-league error isolation and budget awareness"
    - "Affiliate link enrichment at data ingestion time (not at render time)"

key-files:
  created:
    - "src/lib/pipeline/refresh-odds.ts"
    - "src/app/api/cron/refresh-odds/route.ts"
  modified: []

key-decisions:
  - "Duplicate ODDS_TO_DB_NAME in refresh module rather than extracting from seed script"
  - "Only update odds for fixtures already in DB (no fixture creation in cron)"
  - "Quota threshold of 50 remaining before stopping further league fetches"

patterns-established:
  - "Cron odds pipeline: fetch -> match fixtures -> enrich links -> upsert"

# Metrics
duration: 2min
completed: 2026-02-06
---

# Phase 9 Plan 3: Odds Cron Route Summary

**QStash-triggered cron route polling all 5 leagues via The Odds API, enriching each outcome through buildAffiliateLink, and upserting into fixture_odds with budget awareness**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-06T05:26:48Z
- **Completed:** 2026-02-06T05:28:54Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- Created refreshOdds() pipeline function that polls all 5 leagues, matches events to existing fixtures, enriches links, and upserts odds
- Created /api/cron/refresh-odds route with QStash signature verification matching poll-matches pattern
- Budget awareness: logs quota after each league, warns and stops at threshold of 50 remaining
- Per-league error isolation: one league failing does not abort the entire run

## Task Commits

Each task was committed atomically:

1. **Task 1: Create odds refresh pipeline logic** - `74569ff` (feat)
2. **Task 2: Create cron route with QStash auth** - `3ef49e9` (feat)

## Files Created/Modified
- `src/lib/pipeline/refresh-odds.ts` - Core odds refresh logic: fetches odds for 5 leagues, matches to DB fixtures, enriches via buildAffiliateLink, upserts into fixture_odds
- `src/app/api/cron/refresh-odds/route.ts` - QStash-triggered POST handler + dev-only GET handler, delegates to refreshOdds()

## Decisions Made
- Duplicated ODDS_TO_DB_NAME mapping in refresh module rather than extracting shared module from seed script (seed script is standalone, mapping is small)
- Only updates odds for fixtures already in DB with status='scheduled' (cron does not create fixtures -- that is the job of API-Football polling)
- Set quota warning threshold at 50 remaining to prevent quota exhaustion across 5 leagues
- Expanded team name mapping to cover La Liga, Bundesliga, Serie A, and Ligue 1 teams beyond what seed-odds.ts had for PL only

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. The cron route uses existing QSTASH_CURRENT_SIGNING_KEY, QSTASH_NEXT_SIGNING_KEY, ODDS_API_KEY, and DATABASE_URL environment variables.

## Next Phase Readiness
- LINK-04 satisfied: cron route uses link builder to enrich odds rows on each refresh
- Phase 09 complete: all 3 plans delivered (config, schema+UI, cron)
- Ready for Phase 10 (production deployment) when env vars are provisioned

## Self-Check: PASSED

---
*Phase: 09-affiliate-link-builder-pipeline-integration*
*Completed: 2026-02-06*
