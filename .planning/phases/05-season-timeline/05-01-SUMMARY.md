---
phase: 05-season-timeline
plan: 01
subsystem: ui, database
tags: [motion, number-flow, css-grid, animation, league-table, standings]

# Dependency graph
requires:
  - phase: 02-league-tables
    provides: "League table components (TableRow, LeagueTableClient), standings queries, zone system"
provides:
  - "Matchweek-parameterized standings queries (getStandingsWithZones with optional matchweek)"
  - "Matchweek list query (getMatchweekList) for timeline controls"
  - "Div-based CSS Grid league table with Motion layout animations"
  - "NumberFlow digit-spin stat cells for animated number transitions"
  - "fetchMatchweekList server action"
affects: [05-season-timeline plan 02 (timeline slider), 05-season-timeline plan 03 (playback)]

# Tech tracking
tech-stack:
  added: [motion, "@number-flow/react"]
  patterns: ["CSS Grid div-based table layout for animation support", "Motion layout='position' with staggered spring for row reordering", "NumberFlow digit-spin for animated stat counters"]

key-files:
  created:
    - "src/components/league-table/AnimatedTableRow.tsx"
    - "src/components/league-table/AnimatedStatCell.tsx"
  modified:
    - "src/lib/standings/queries.ts"
    - "src/components/league-table/actions.ts"
    - "src/components/league-table/LeagueTableClient.tsx"
    - "package.json"

key-decisions:
  - "layout='position' chosen over layout={true} to avoid child element distortion during animation"
  - "NumberFlow trend={0} for shortest-path digit spin (no forced up/down direction)"
  - "lte bound added to sparkline query so historical matchweek views don't leak future data"
  - "TableRow.tsx kept in place (unused LeagueTable.tsx server component still references it)"

patterns-established:
  - "AnimatedTableRow: Motion layout='position' with staggered spring delay (index * 0.015) for cascading row animation"
  - "AnimatedStatCell: NumberFlow wrapper pattern for any numeric cell needing animated transitions"
  - "CSS Grid 14-column template for league table (shared between header and rows)"

# Metrics
duration: 4min
completed: 2026-02-05
---

# Phase 5 Plan 01: Animated League Table and Matchweek Queries Summary

**Div-based CSS Grid league table with Motion layout animations, NumberFlow stat counters, and matchweek-parameterized historical standings queries**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-05T19:15:15Z
- **Completed:** 2026-02-05T19:19:32Z
- **Tasks:** 2
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments
- Added optional matchweek parameter to getStandingsWithZones for historical data retrieval
- Created getMatchweekList function returning matchweek availability array per league
- Converted league table from HTML `<table>` to CSS Grid `<div>` layout enabling CSS transform animations
- Integrated Motion layout="position" with staggered spring transitions for smooth row reordering
- Added NumberFlow digit-spin transitions for all numeric stat cells

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and add matchweek-parameterized standings queries** - `bcbbb81` (feat)
2. **Task 2: Refactor league table from HTML table to animated div-based CSS Grid** - `5036c7a` (feat)

## Files Created/Modified
- `src/components/league-table/AnimatedStatCell.tsx` - NumberFlow-wrapped stat cell for animated number transitions
- `src/components/league-table/AnimatedTableRow.tsx` - Motion-powered div-based table row with layout="position" and stagger delay
- `src/lib/standings/queries.ts` - getStandingsWithZones with optional matchweek, getMatchweekList, lte-bounded sparklines
- `src/components/league-table/actions.ts` - fetchStandings with matchweek param, fetchMatchweekList server action, config in result
- `src/components/league-table/LeagueTableClient.tsx` - Div-based CSS Grid layout with LayoutGroup, AnimatedTableRow, matchweek prop
- `package.json` - Added motion and @number-flow/react dependencies

## Decisions Made
- Used `layout="position"` (not `layout={true}`) to prevent child distortion during animation -- only position animates, not scale
- NumberFlow `trend={0}` means digits find shortest rotation path (no directional bias)
- Added `lte(standings.matchweek, currentMatchweek)` to sparkline query -- without this, viewing matchweek 10 would show sparkline data through matchweek 20+
- Kept TableRow.tsx in place since the server-rendered LeagueTable.tsx still imports it (though that component is currently unused)
- React.memo wraps AnimatedTableRow to prevent unnecessary re-renders that could disrupt Motion's layout tracking

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added upper bound to sparkline query for historical matchweek correctness**
- **Found during:** Task 1 (modifying getSparklineData)
- **Issue:** Sparkline query only had `gte(startMatchweek)` lower bound but no upper bound. When viewing historical matchweek 10, sparklines would include data from matchweeks 11-20+, showing "future" data.
- **Fix:** Added `lte(standings.matchweek, currentMatchweek)` filter condition
- **Files modified:** src/lib/standings/queries.ts
- **Verification:** Query now correctly scopes sparkline data to [max(1, currentMatchweek-9), currentMatchweek]
- **Committed in:** bcbbb81 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Essential correctness fix for historical matchweek views. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AnimatedTableRow and AnimatedStatCell are ready for Plan 02's timeline slider to drive matchweek changes
- fetchMatchweekList server action provides the data source for timeline controls
- LeagueTableClient accepts optional matchweek prop for Plan 02 integration
- Motion LayoutGroup wraps the row group for synchronized animations when data changes

---
*Phase: 05-season-timeline*
*Completed: 2026-02-05*
