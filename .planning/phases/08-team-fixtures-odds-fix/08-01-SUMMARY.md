---
phase: 08-team-fixtures-odds-fix
plan: 01
subsystem: ui
tags: [react, betting, geo-compliance, showBetting, team-detail]

# Dependency graph
requires:
  - phase: 07-betting-odds-localisation
    provides: getShowBetting server action, FixturesTab showBetting prop, CompactOdds component
provides:
  - showBetting prop threaded from TeamTabsInner to FixturesTab via getShowBetting() server action
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "showBetting fetch-on-mount pattern reused from MatchListClient in TeamTabs"

key-files:
  created: []
  modified:
    - src/components/team-detail/TeamTabs.tsx

key-decisions:
  - "Reused exact same pattern as MatchListClient: useState(false) + useEffect fetch getShowBetting"

patterns-established:
  - "All client components rendering betting UI must fetch showBetting via getShowBetting() on mount"

# Metrics
duration: 1min
completed: 2026-02-06
---

# Phase 8 Plan 1: Thread showBetting Through TeamTabs to FixturesTab Summary

**showBetting geo-compliance prop threaded from TeamTabsInner to FixturesTab using getShowBetting() server action fetch on mount**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-06T02:08:55Z
- **Completed:** 2026-02-06T02:09:44Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Fixed audit gap where betting odds were hidden on team fixture pages for ALL users regardless of geo-location
- Threaded showBetting prop from TeamTabsInner to FixturesTab, matching the pattern already established in MatchListClient
- Users in non-restricted countries will now see CompactOdds on team fixture upcoming matches

## Task Commits

Each task was committed atomically:

1. **Task 1: Add showBetting state and fetch to TeamTabsInner** - `bccbe1e` (feat)

## Files Created/Modified
- `src/components/team-detail/TeamTabs.tsx` - Added useState/useEffect imports, getShowBetting import, showBetting state + fetch in TeamTabsInner, passed showBetting prop to FixturesTab

## Decisions Made
- Reused exact same pattern as MatchListClient.tsx (commit 6dc00d9): `useState(false)` + `useEffect(() => getShowBetting().then(setShowBetting), [])` -- consistent approach across all betting-aware client components

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Gap closure complete for team fixtures odds display
- No further plans in phase 08

## Self-Check: PASSED

---
*Phase: 08-team-fixtures-odds-fix*
*Completed: 2026-02-06*
