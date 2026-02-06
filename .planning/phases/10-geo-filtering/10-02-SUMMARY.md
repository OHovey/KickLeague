---
phase: 10-geo-filtering
plan: 02
subsystem: geo
tags: [typescript, geo-filtering, server-actions, odds-pipeline, country-code]

# Dependency graph
requires:
  - phase: 10-geo-filtering
    provides: getAvailableBookmakers() and isCountryMapped() from plan 10-01
  - phase: 07-geo-compliance
    provides: x-user-country and x-show-betting proxy headers
  - phase: 09-affiliate-links
    provides: Odds server actions (fetchOddsForFixture, fetchCompactOdds)
provides:
  - "getGeoContext() server action returning showBetting, countryCode, and isMapped"
  - "Country-filtered fetchOddsForFixture with priority-based sorting"
  - "Country-filtered fetchCompactOdds computing best odds from only available bookmakers"
  - "Country code threaded through all 3 odds display locations"
affects: [10-03, odds-display, region-ux-indicators]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "getGeoContext() replaces getShowBetting() as single geo context accessor"
    - "Server-side bookmaker filtering -- restricted bookmaker data never reaches the client"
    - "Priority-based odds row sorting replaces best-odds-descending sorting"
    - "countryCode parameter on all odds server actions for consistent filtering"

key-files:
  created: []
  modified:
    - src/components/matches/actions.ts
    - src/components/odds/actions.ts
    - src/components/odds/OddsComparisonTable.tsx
    - src/components/matches/MatchListClient.tsx
    - src/components/team-detail/TeamTabs.tsx
    - src/components/team-detail/FixturesTab.tsx
    - src/app/[locale]/matches/[id]/page.tsx

key-decisions:
  - "getGeoContext replaces getShowBetting entirely (no deprecated alias kept)"
  - "Filter-then-sort in server actions ensures best-odds highlighting uses only available bookmakers"
  - "FixtureOddsResult.totalBookmakers tracks pre-filter count for future region UX indicators"

patterns-established:
  - "geoContext state shape: { showBetting, countryCode, isMapped } used by all client components needing geo info"
  - "All odds server actions require countryCode parameter -- no unfiltered odds fetches"

# Metrics
duration: 3min
completed: 2026-02-06
---

# Phase 10 Plan 02: Country Code Threading and Odds Pipeline Filtering Summary

**Country-filtered odds pipeline with getGeoContext() replacing getShowBetting(), priority-based sorting in server actions, and countryCode threaded through all 3 display locations**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-06T06:20:06Z
- **Completed:** 2026-02-06T06:23:40Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- getGeoContext() returns showBetting, countryCode, and isMapped from proxy headers, replacing getShowBetting entirely
- fetchOddsForFixture filters odds by country-available bookmakers and sorts by priority (not by best odds)
- fetchCompactOdds filters to allowed bookmakers BEFORE computing best odds, ensuring CompactOdds reflects only available bookmakers
- All 3 odds display locations (match detail page, match list, team fixtures tab) pass countryCode through to server actions
- FixtureOddsResult includes totalBookmakers count for future "X of Y bookmakers" UX indicator

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace getShowBetting with getGeoContext and update odds server actions** - `e09c65f` (feat)
2. **Task 2: Thread country code through all odds display call sites** - `04e1c9c` (feat)

## Files Created/Modified
- `src/components/matches/actions.ts` - Replaced getShowBetting with getGeoContext; added isCountryMapped import
- `src/components/odds/actions.ts` - Added countryCode parameter to both server actions; filter by getAvailableBookmakers; sort by priority; added totalBookmakers to FixtureOddsResult
- `src/components/odds/OddsComparisonTable.tsx` - Added countryCode prop; passes to fetchOddsForFixture
- `src/components/matches/MatchListClient.tsx` - Uses getGeoContext; passes countryCode to fetchCompactOdds
- `src/components/team-detail/TeamTabs.tsx` - Uses getGeoContext; passes countryCode to FixturesTab
- `src/components/team-detail/FixturesTab.tsx` - Accepts countryCode prop; passes to fetchCompactOdds
- `src/app/[locale]/matches/[id]/page.tsx` - Reads x-user-country header; passes countryCode to OddsComparisonTable

## Decisions Made
- **getGeoContext replaces getShowBetting entirely:** No deprecated alias kept -- all callers updated in the same plan. Fewer lines, no dead code.
- **Filter-then-sort pattern:** Filtering happens before mapping to OddsRow, then sorted by priority. Best-odds highlighting in components works automatically since it computes from the filtered data.
- **totalBookmakers in FixtureOddsResult:** Pre-filter count stored for Plan 03's "X of Y bookmakers shown" UX indicator.

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All odds data flows are now country-filtered server-side
- totalBookmakers and isMapped values are available for Plan 03's UX indicators (RegionNote, "no odds in your region" message)
- CompactOdds already handles empty data gracefully; OddsComparisonTable's existing empty-state message will show when all bookmakers are filtered out

## Self-Check: PASSED

---
*Phase: 10-geo-filtering*
*Completed: 2026-02-06*
