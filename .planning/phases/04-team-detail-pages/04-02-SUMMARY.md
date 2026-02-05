---
phase: 04-team-detail-pages
plan: 02
subsystem: ui, database
tags: [recharts, bump-chart, xg, home-away-splits, goals-by-period, server-actions, team-detail]

# Dependency graph
requires:
  - phase: 04-team-detail-pages
    plan: 01
    provides: team query layer, server actions, TeamTabs shell, tab placeholders
provides:
  - Overview tab with season summary, bump chart, cumulative points, form display
  - Performance tab with home/away splits, goals by period, xG analysis, clean sheets, scoring-first record
  - Performance query functions (getGoalsByPeriod, getCumulativeXg, getCleanSheets, getScoringFirstRecord)
  - Five chart components (BumpChart, CumulativePointsChart, GoalsByPeriodChart, CumulativeXgChart, HomeAwayBars)
affects: [04-03-squad-fixtures-tabs, future-xg-enhancements]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bump chart as Recharts LineChart with reversed Y-axis and multi-line rival overlay"
    - "Conditional xG rendering based on league config hasXg flag"
    - "CSS percentage-width bars for home/away splits (not Recharts)"
    - "Server action data loading on tab mount with useEffect + loading skeleton"

key-files:
  created:
    - src/components/team-detail/OverviewTab.tsx
    - src/components/team-detail/PerformanceTab.tsx
    - src/components/team-detail/charts/BumpChart.tsx
    - src/components/team-detail/charts/CumulativePointsChart.tsx
    - src/components/team-detail/charts/GoalsByPeriodChart.tsx
    - src/components/team-detail/charts/CumulativeXgChart.tsx
    - src/components/team-detail/charts/HomeAwayBars.tsx
  modified:
    - src/lib/teams/queries.ts
    - src/components/team-detail/actions.ts
    - src/components/team-detail/TeamTabs.tsx
    - src/lib/standings/calculate.ts
    - src/lib/standings/calculate.test.ts
    - src/lib/standings/queries.ts
    - src/components/league-table/TableRow.tsx
    - src/lib/matches/queries.ts

key-decisions:
  - "HomeAwayBars uses CSS percentage-width bars (not Recharts) -- consistent with ComparativeStats pattern"
  - "xG section omitted entirely (not rendered at all) when hasXg is false -- avoids empty chart state"
  - "Scoring-first record handles own goals: own goal by our team = opponent scored first"
  - "Goals bucketed with Math.min(Math.floor((minute-1)/15), 5) -- 90+ goals go to last bucket"
  - "CumulativePointsChart uses AreaChart with gradient fill for visual depth"

patterns-established:
  - "Chart component pattern: 'use client', custom tooltip, empty state fallback, ResponsiveContainer wrapper"
  - "Performance data flow: tab mounts -> fetchPerformanceData server action -> parallel queries -> typed response"

# Metrics
duration: 8.3min
completed: 2026-02-05
---

# Phase 4 Plan 2: Overview and Performance Tabs Summary

**Overview tab with season summary stat grid, bump chart (position over time with rivals), cumulative points area chart, and form badges; Performance tab with home/away CSS comparison bars, grouped goals-by-period bar chart, conditional cumulative xG dual-line chart, clean sheets count, and scoring-first W/D/L record**

## Performance

- **Duration:** 8.3 min
- **Started:** 2026-02-05T17:40:01Z
- **Completed:** 2026-02-05T17:48:18Z
- **Tasks:** 2
- **Files created:** 7
- **Files modified:** 8

## Accomplishments

- Five interactive Recharts chart components with custom tooltips, dark theme styling, and responsive containers
- Four performance query functions computing goals by 15-minute period, cumulative xG vs actual goals, clean sheets, and scoring-first record from fixture events
- Full fetchPerformanceData server action aggregating home/away standings splits with all performance metrics in parallel
- Overview tab showing season-at-a-glance with stat cards, bump chart showing team trajectory relative to nearby rivals, cumulative points area chart, and current form badges
- Performance tab delivering analytical depth with home/away comparison bars, goals timing analysis, conditional xG visualization, and derived statistics

## Task Commits

Each task was committed atomically:

1. **Task 1: Create performance queries, implement Overview tab with charts** - `c866624` (feat)
2. **Task 2: Create Performance tab with home/away splits, goals by period, xG, and derived stats** - `3547170` (feat)

## Files Created/Modified

- `src/components/team-detail/OverviewTab.tsx` - Season summary stat cards, bump chart, cumulative points, form display with lazy data loading
- `src/components/team-detail/PerformanceTab.tsx` - Home/away splits, goals by period, xG analysis (conditional), clean sheets, scoring-first record
- `src/components/team-detail/charts/BumpChart.tsx` - Position-over-time multi-line chart with reversed Y-axis, focus team highlighted green, rivals as faint lines
- `src/components/team-detail/charts/CumulativePointsChart.tsx` - Cumulative points area chart with green gradient fill
- `src/components/team-detail/charts/GoalsByPeriodChart.tsx` - Grouped bar chart with scored (green) vs conceded (red) per 15-minute period
- `src/components/team-detail/charts/CumulativeXgChart.tsx` - Dual-line chart with xG (dashed amber) vs actual goals (solid green)
- `src/components/team-detail/charts/HomeAwayBars.tsx` - CSS percentage-width comparison bars with blue (home) / amber (away) color scheme
- `src/lib/teams/queries.ts` - Added getGoalsByPeriod, getCumulativeXg, getCleanSheets, getScoringFirstRecord
- `src/components/team-detail/actions.ts` - Replaced fetchPerformanceData stub with full implementation and PerformanceData type
- `src/components/team-detail/TeamTabs.tsx` - Imported and rendered OverviewTab and PerformanceTab replacing placeholders

## Decisions Made

- HomeAwayBars uses CSS percentage-width bars rather than Recharts, consistent with the ComparativeStats pattern from match detail pages -- simple proportional bars are lighter than a full chart library
- xG section is omitted entirely when hasXg is false (not shown as empty/disabled) -- avoids visual clutter for leagues without xG data
- Own goals in scoring-first analysis: an own goal by our team means the opponent effectively scored first; correctly inverts the teamId check
- Goals-by-period bucketing uses `Math.min(Math.floor((minute - 1) / 15), 5)` so all 90+ minute goals merge into the "76-90+" bucket
- BumpChart shows focus team as thick green line with dots, rivals as thin white-20% opacity lines -- readable without clutter

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed StandingsRow missing teamSlug causing type errors**
- **Found during:** Task 1
- **Issue:** Plan 04-03 added teamSlug to StandingsRow interface but standings/queries.ts query did not include it in the select, and the test helper was missing it
- **Fix:** Added teamSlug to the standings query select and test helper function
- **Files modified:** src/lib/standings/calculate.ts, src/lib/standings/queries.ts, src/lib/standings/calculate.test.ts
- **Commit:** c866624

**2. [Rule 3 - Blocking] Included 04-03 linter changes for team page linking**
- **Found during:** Task 1
- **Issue:** The linter had auto-added team slug to MatchTeam type and TableRow for team page linking, but these changes were uncommitted
- **Fix:** Included the uncommitted linter changes (team slug in match queries, Link in TableRow) as they were necessary for proper team page navigation
- **Files modified:** src/lib/matches/queries.ts, src/components/league-table/TableRow.tsx
- **Commit:** c866624

## Issues Encountered

None.

## User Setup Required

None -- no external service configuration required.

## Next Phase Readiness

- All four tabs (Overview, Performance, Squad, Fixtures) are now fully implemented
- Team detail page is complete with hero section, tab navigation, and data-rich content
- Links to team pages exist from league table rows
- Phase 4 is ready for completion (plan 04-03 already committed)

---
*Phase: 04-team-detail-pages*
*Completed: 2026-02-05*
