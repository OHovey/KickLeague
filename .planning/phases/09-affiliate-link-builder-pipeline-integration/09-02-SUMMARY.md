---
phase: 09-affiliate-link-builder-pipeline-integration
plan: 02
subsystem: database, api, ui
tags: [drizzle, migration, affiliate, click-tracking, seed-script, server-action]

# Dependency graph
requires:
  - phase: 09-01
    provides: "buildAffiliateLink, getAffiliateConfig exports for link enrichment and config lookup"
provides:
  - "affiliate_program column on affiliate_clicks table (nullable)"
  - "Click API stores affiliateProgram per click event"
  - "Server action returns affiliateProgram per odds row"
  - "OddsCell sends affiliateProgram in click tracking body"
  - "Seed script enriches links via buildAffiliateLink at ingestion time"
affects: [09-03-odds-cron-integration, analytics-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server-side affiliate config lookup (getAffiliateConfig) keeps config out of client bundle"
    - "Link enrichment at ingestion time (seed/cron) rather than at render time"

key-files:
  created:
    - drizzle/0003_young_network.sql
    - drizzle/meta/0003_snapshot.json
  modified:
    - src/db/schema/odds.ts
    - src/app/api/clicks/route.ts
    - src/components/odds/actions.ts
    - src/components/odds/OddsCell.tsx
    - src/components/odds/OddsComparisonTable.tsx
    - drizzle/meta/_journal.json
    - scripts/seed-odds.ts

key-decisions:
  - "affiliateProgram column is nullable -- existing click rows keep null, no backfill needed"
  - "Server action does affiliate config lookup, not client -- keeps affiliate config out of client bundle"
  - "Link enrichment at ingestion (seed/cron) not render time -- enriched URLs pre-stored in DB"

patterns-established:
  - "Affiliate config lookup in server actions: getAffiliateConfig(bookmakerKey)?.programName"
  - "Link builder integration pattern: buildAffiliateLink({ bookmakerKey, apiLink, sid }) at data write time"

# Metrics
duration: 3min
completed: 2026-02-06
---

# Phase 9 Plan 2: Schema Migration, Click Analytics & Seed Script Integration Summary

**Nullable affiliateProgram column on affiliate_clicks with full pipeline wiring: click API, server action, OddsCell, and seed script enrichment via buildAffiliateLink**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-06T05:25:27Z
- **Completed:** 2026-02-06T05:28:18Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Added nullable `affiliate_program` column to `affiliate_clicks` table with Drizzle migration
- Wired affiliateProgram through the full click tracking path: schema -> API -> server action -> OddsCell -> OddsComparisonTable
- Integrated buildAffiliateLink into seed script so odds rows store affiliate-enriched URLs at ingestion time

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema migration + click tracking wiring** - `44859c2` (feat)
2. **Task 2: Integrate link builder into seed script** - `74569ff` (feat)

**Plan metadata:** (pending)

## Files Created/Modified
- `drizzle/0003_young_network.sql` - Migration adding affiliate_program column to affiliate_clicks
- `drizzle/meta/0003_snapshot.json` - Drizzle migration snapshot
- `drizzle/meta/_journal.json` - Updated migration journal with 0003 entry
- `src/db/schema/odds.ts` - Added affiliateProgram to affiliateClicks table definition
- `src/app/api/clicks/route.ts` - Accepts and stores affiliateProgram from request body
- `src/components/odds/actions.ts` - Server action looks up getAffiliateConfig per row, returns affiliateProgram
- `src/components/odds/OddsCell.tsx` - Accepts affiliateProgram prop, includes in click tracking POST body
- `src/components/odds/OddsComparisonTable.tsx` - Passes affiliateProgram to all three OddsCell instances
- `scripts/seed-odds.ts` - Uses buildAffiliateLink for all outcomes, stores enriched URLs, logs enrichment count

## Decisions Made
- **affiliateProgram column is nullable** -- Existing click rows keep null. No migration backfill needed since historical clicks lack program data anyway.
- **Server-side affiliate config lookup** -- `getAffiliateConfig` runs in the server action, not the client. This keeps the full affiliate config map out of the client bundle.
- **Link enrichment at write time** -- buildAffiliateLink is called during seed/ingestion rather than at render time. Enriched URLs are stored directly in fixture_odds link columns.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused OddsFormat type import from OddsCell.tsx**
- **Found during:** Task 1 (OddsCell modification)
- **Issue:** `type OddsFormat` was imported but never used, would cause lint warnings
- **Fix:** Removed unused type import
- **Files modified:** src/components/odds/OddsCell.tsx
- **Verification:** TypeScript compiles cleanly
- **Committed in:** 44859c2 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug/cleanup)
**Impact on plan:** Trivial cleanup. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. The migration (0003_young_network.sql) will need to be applied to the production database when deploying.

## Next Phase Readiness
- Schema, click API, server action, UI, and seed script all wired with affiliateProgram
- Ready for 09-03 (odds cron integration) which will use the same buildAffiliateLink pattern in the cron job
- Migration 0003 ready to apply (`npx drizzle-kit push` or apply SQL directly)

## Self-Check: PASSED

---
*Phase: 09-affiliate-link-builder-pipeline-integration*
*Completed: 2026-02-06*
