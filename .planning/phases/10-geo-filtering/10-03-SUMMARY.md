---
phase: 10-geo-filtering
plan: 03
subsystem: ui
tags: [react, i18n, geo-filtering, odds, ux-indicators, next-intl]

# Dependency graph
requires:
  - phase: 10-geo-filtering
    provides: getAvailableBookmakers(), isCountryMapped(), getGeoContext(), totalBookmakers in FixtureOddsResult
  - phase: 07-geo-compliance
    provides: x-user-country and x-show-betting proxy headers
  - phase: 09-affiliate-links
    provides: OddsComparisonTable, CompactOdds, odds server actions
provides:
  - "RegionNote component for geo-filtered bookmaker count indicator"
  - "OddsComparisonTable distinguishes 'no odds in DB' vs 'all odds filtered by region'"
  - "i18n translations for regionBookmakers, fallbackRegion, noOddsRegion in 5 languages"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RegionNote renders null when user sees full set (no unnecessary UI noise)"
    - "Three-state empty odds: no data, genuinely empty, region-filtered-out"

key-files:
  created:
    - src/components/odds/RegionNote.tsx
  modified:
    - src/components/odds/OddsComparisonTable.tsx
    - src/app/[locale]/matches/[id]/page.tsx
    - src/messages/en.json
    - src/messages/de.json
    - src/messages/fr.json
    - src/messages/es.json
    - src/messages/it.json

key-decisions:
  - "RegionNote renders null when filteredCount === totalCount and isMapped (no noise for full-set users)"
  - "Three-state empty odds: null/no-data -> noOdds, empty+totalBookmakers>0 -> noOddsRegion, empty+totalBookmakers===0 -> noOdds"

patterns-established:
  - "isMapped prop on OddsComparisonTable drives fallback vs filtered messaging"

# Metrics
duration: 3min
completed: 2026-02-06
---

# Phase 10 Plan 03: Region UX Indicators and i18n Summary

**RegionNote component showing filtered bookmaker counts with three-state empty odds handling, translated in EN/DE/FR/ES/IT**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-06T06:26:21Z
- **Completed:** 2026-02-06T06:29:27Z
- **Tasks:** 2
- **Files created:** 1
- **Files modified:** 7

## Accomplishments
- RegionNote component shows "{X} of {Y} bookmakers shown for your region" when user sees a filtered subset
- Unmapped countries see "Showing bookmakers for your region" (GB fallback) instead of misleading count
- OddsComparisonTable distinguishes "no odds in DB" (noOdds) from "all bookmakers filtered by region" (noOddsRegion)
- All 3 new i18n keys (regionBookmakers, fallbackRegion, noOddsRegion) translated in 5 languages with proper Unicode diacritics

## Task Commits

Each task was committed atomically:

1. **Task 1: Create RegionNote component and update OddsComparisonTable UX** - `cd594b3` (feat)
2. **Task 2: Add i18n translations for all 5 languages** - `bab1977` (feat)

## Files Created/Modified
- `src/components/odds/RegionNote.tsx` - New component showing filtered bookmaker count or fallback message
- `src/components/odds/OddsComparisonTable.tsx` - Added isMapped prop, RegionNote rendering, three-state empty odds logic
- `src/app/[locale]/matches/[id]/page.tsx` - Passes isMapped={isCountryMapped(countryCode)} to OddsComparisonTable
- `src/messages/en.json` - English translations for 3 new Odds keys
- `src/messages/de.json` - German translations for 3 new Odds keys
- `src/messages/fr.json` - French translations for 3 new Odds keys
- `src/messages/es.json` - Spanish translations for 3 new Odds keys
- `src/messages/it.json` - Italian translations for 3 new Odds keys

## Decisions Made
- **RegionNote renders null for full-set mapped users:** No unnecessary UI noise when filteredCount === totalCount and country is in the availability config.
- **Three-state empty odds distinction:** `data===null` or `totalBookmakers===0` uses existing `noOdds` message; `odds.length===0` with `totalBookmakers>0` uses new `noOddsRegion` message to explain regional filtering.

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 10 (Geo-Aware Bookmaker Filtering) is now complete across all 3 plans
- The full pipeline: static config (10-01) -> server-side filtering (10-02) -> UX indicators (10-03)
- v1.1 Affiliate Monetisation is fully complete (phases 08, 09, 10)

## Self-Check: PASSED

---
*Phase: 10-geo-filtering*
*Completed: 2026-02-06*
