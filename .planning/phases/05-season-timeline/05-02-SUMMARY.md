---
phase: 05-season-timeline
plan: 02
subsystem: ui
tags: [nuqs, timeline, auto-play, historical-standings, url-state, drag-scrub]

# Dependency graph
requires:
  - phase: 05-01
    provides: "Animated div-based CSS Grid league table with Motion layout animations, NumberFlow stat counters, matchweek-parameterized queries"
provides:
  - "useMatchweek hook for ?week= URL parameter"
  - "SeasonTimeline component with drag/tap matchweek selection"
  - "TimelineStrip with horizontal scrollable matchweek circles"
  - "TimelineControls with play/pause/replay auto-advance"
  - "useAutoPlay interval hook with proper cleanup"
  - "HistoricalBanner showing 'Viewing Matchweek N' with return-to-current"
  - "Full integration of timeline into LeagueTableWrapper and home page"
affects: [06-live-data, 07-betting-odds]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "nuqs parseAsInteger for integer URL parameters"
    - "useRef for interval ID management to prevent stale closures"
    - "Drag-to-scrub via mousedown/mousemove/mouseup with 5px threshold"
    - "Scroll-snap CSS for horizontal circle strip"

key-files:
  created:
    - "src/lib/hooks/use-matchweek.ts"
    - "src/components/timeline/SeasonTimeline.tsx"
    - "src/components/timeline/TimelineStrip.tsx"
    - "src/components/timeline/TimelineCircle.tsx"
    - "src/components/timeline/TimelineControls.tsx"
    - "src/components/timeline/useAutoPlay.ts"
    - "src/components/league-table/HistoricalBanner.tsx"
  modified:
    - "src/components/league-table/LeagueTableWrapper.tsx"

key-decisions:
  - "useMatchweek default value from latestCompleted matchweek -- null URL param shows current standings"
  - "Drag threshold of 5px to distinguish click from drag interaction on timeline strip"
  - "Auto-play restarts from matchweek 1 when replay button clicked at end"
  - "LeagueTableWrapper is the integration point managing matchweek state, timeline rendering, and historical banner"
  - "League change resets matchweek to null (current) via prevLeagueRef tracking"

patterns-established:
  - "Timeline component suite: SeasonTimeline orchestrates TimelineStrip + TimelineControls"
  - "useAutoPlay hook with ref-based interval management for stale closure prevention"
  - "HistoricalBanner conditional rendering based on isHistorical flag"

# Metrics
duration: 3min
completed: 2026-02-05
---

# Phase 5 Plan 02: Season Timeline UI and Integration Summary

**Interactive season timeline with drag/tap matchweek selection, auto-play, historical banner, and full league table integration via URL-synced ?week= parameter**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-05T19:24:16Z
- **Completed:** 2026-02-05T19:27:13Z
- **Tasks:** 2/2 auto tasks completed (Task 3 is checkpoint:human-verify)
- **Files modified:** 8

## Accomplishments
- Created nuqs-powered useMatchweek hook for ?week= URL parameter with shareable links
- Built complete timeline component suite: SeasonTimeline, TimelineStrip, TimelineCircle, TimelineControls
- Implemented useAutoPlay hook with interval-based auto-advance and proper cleanup
- Created HistoricalBanner component showing "Viewing Matchweek N" with return-to-current
- Wired timeline into LeagueTableWrapper with matchweek list fetching, league change reset, and historical data passing to LeagueTableClient

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useMatchweek hook, timeline components, and auto-play hook** - `9a083ba` (feat)
2. **Task 2: Create historical banner and wire timeline into league table** - `9a60aa2` (feat)

## Files Created/Modified
- `src/lib/hooks/use-matchweek.ts` - nuqs-powered hook for ?week= URL parameter
- `src/components/timeline/SeasonTimeline.tsx` - Main timeline container orchestrating strip, controls, and auto-play
- `src/components/timeline/TimelineStrip.tsx` - Horizontal scrollable circle strip with drag-to-scrub and keyboard nav
- `src/components/timeline/TimelineCircle.tsx` - Individual matchweek circle with filled/hollow/selected states
- `src/components/timeline/TimelineControls.tsx` - Play/pause/replay button with SVG icons
- `src/components/timeline/useAutoPlay.ts` - Auto-advance interval hook with proper cleanup
- `src/components/league-table/HistoricalBanner.tsx` - Colored banner showing "Viewing Matchweek N" with return-to-current
- `src/components/league-table/LeagueTableWrapper.tsx` - Integration point managing matchweek state, timeline rendering, and historical data

## Decisions Made
- useMatchweek uses `parseAsInteger.withDefault(latestMatchweek)` so null URL param defaults to current standings
- Drag threshold of 5px distinguishes click from drag interaction on timeline strip
- Auto-play replay restarts from matchweek 1 and uses setTimeout before toggle to avoid state race
- LeagueTableWrapper manages matchweek state via useMatchweek and passes `matchweek` prop to LeagueTableClient
- League switching detected via prevLeagueRef to reset matchweek selection to null (current)
- TimelineCircle uses forwardRef for ref-based scrollIntoView in TimelineStrip

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript narrowing issue with closest variable in getWeekAtPosition**
- **Found during:** Task 1 (TimelineStrip)
- **Issue:** TypeScript narrowed `closest` object to `never` after truthiness check because mutation in `forEach` callback is not tracked
- **Fix:** Replaced object-based tracking with separate `closestWeek` and `closestDistance` variables
- **Files modified:** src/components/timeline/TimelineStrip.tsx
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 9a083ba (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minimal -- TypeScript type narrowing fix, no scope change.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Awaiting user verification of the visual experience (Task 3 checkpoint)
- Timeline feature is structurally complete and builds successfully
- Phase 5 Plan 03 (if any) can proceed after user approval

---
*Phase: 05-season-timeline*
*Completed: 2026-02-05*
