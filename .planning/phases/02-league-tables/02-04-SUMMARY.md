---
phase: 02-league-tables
plan: 04
subsystem: ui
tags: [recharts, sparkline, form-badges, position-change, react, league-table]

# Dependency graph
requires:
  - phase: 02-03
    provides: League table with zone colors and standings data
provides:
  - Form badges component (WWDLW colored letters)
  - Position change indicator (up/down arrows with magnitude)
  - Sparkline chart with inverted Y-axis (position trajectory)
  - Enhanced standings query with position change and sparkline data
affects: [02-05, team-detail, responsive-design]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Recharts LineChart with inverted YAxis for position data
    - Memoized sparkline for 20-row rendering performance
    - EnhancedStandingsRow type extending base StandingsRow

key-files:
  created:
    - src/components/league-table/FormBadges.tsx
    - src/components/league-table/PositionChange.tsx
    - src/components/league-table/Sparkline.tsx
    - src/components/league-table/ExpandedRowDetail.tsx
  modified:
    - src/lib/standings/queries.ts
    - src/components/league-table/TableRow.tsx
    - src/components/league-table/LeagueTable.tsx
    - src/components/league-table/LeagueTableClient.tsx
    - src/components/league-table/actions.ts

key-decisions:
  - "Sparkline Y-axis inverted so line going UP = team improving toward 1st"
  - "Custom tooltip types defined locally to avoid recharts v3 typing issues"
  - "Position change calculated as previousPosition - currentPosition (positive = moved up)"

patterns-established:
  - "Recharts with custom tooltip: define local TooltipPayload interface, avoid importing internal types"
  - "EnhancedStandingsRow: pattern for extending base types with computed visual data"

# Metrics
duration: 4min
completed: 2026-02-04
---

# Phase 2 Plan 4: Visual Enhancements Summary

**Form badges (WWDLW colored letters), position change indicators (arrows with magnitude), and sparkline charts showing position trajectory with inverted Y-axis**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-04T23:47:01Z
- **Completed:** 2026-02-04T23:50:50Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- FormBadges renders last 5 results as colored letter badges (W=green, D=gray, L=red)
- PositionChange shows direction and magnitude with Unicode arrows
- Sparkline displays position trajectory over last 10 matchweeks with inverted Y-axis
- All visual components integrated into both desktop and mobile table views

## Task Commits

Each task was committed atomically:

1. **Task 1: Create FormBadges and PositionChange** - `ec85625` (feat)
2. **Task 2: Create Sparkline with inverted Y-axis** - `4207386` (feat)
3. **Task 3: Integrate visual components into table** - `a348fe5` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `src/components/league-table/FormBadges.tsx` - Renders W/D/L letters as colored badges
- `src/components/league-table/PositionChange.tsx` - Shows arrows and magnitude for position changes
- `src/components/league-table/Sparkline.tsx` - Recharts LineChart with inverted Y-axis and tooltip
- `src/components/league-table/ExpandedRowDetail.tsx` - Mobile expanded row with visual components
- `src/lib/standings/queries.ts` - Added getSparklineData, getPositionChanges helpers
- `src/components/league-table/TableRow.tsx` - Added Form, +/-, Trend columns
- `src/components/league-table/LeagueTable.tsx` - Updated header with new columns
- `src/components/league-table/LeagueTableClient.tsx` - Updated header and types
- `src/components/league-table/actions.ts` - Updated to use EnhancedStandingsRow

## Decisions Made
- Sparkline Y-axis inverted (reversed={true}) so position 1 appears at top, making "line going up = improving"
- Custom tooltip types defined locally to work around recharts v3 typing issues
- Position change calculated as previousPosition - currentPosition (positive means team moved up the table)
- Ordinal helper added for position display (1st, 2nd, 3rd, etc.)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created missing ExpandedRowDetail component**
- **Found during:** Task 2 (TypeScript check)
- **Issue:** TableRow imported ExpandedRowDetail which did not exist
- **Fix:** Created minimal ExpandedRowDetail component with grid layout for mobile stats
- **Files modified:** src/components/league-table/ExpandedRowDetail.tsx
- **Verification:** TypeScript compiles without errors
- **Committed in:** 4207386 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Missing component from prior plan was necessary for TypeScript to compile. No scope creep.

## Issues Encountered
- Recharts v3 has different TypeScript types - resolved by defining custom TooltipPayload interface locally instead of importing from recharts internals

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Visual enhancements complete: form, position change, sparklines all rendering
- Ready for Phase 2 Plan 5 (final polish or remaining tasks)
- Sparkline data fetched in parallel (20 queries) - may need optimization for large datasets

---
*Phase: 02-league-tables*
*Completed: 2026-02-04*
