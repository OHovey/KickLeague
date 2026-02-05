---
phase: 06-live-data-pipeline
plan: 03
subsystem: ui
tags: [polling, react-hooks, data-freshness, adaptive-interval, auto-refresh]

# Dependency graph
requires:
  - phase: 02-league-tables
    provides: LeagueTableWrapper integration point, LeagueTableClient with useEffect data fetching
  - phase: 01-data-foundation
    provides: standings and fixtures schema with updatedAt, leagues with slug
provides:
  - Browser polling endpoint (GET /api/updates/check) returning latest updatedAt and matchWindowActive flag
  - usePolling React hook with adaptive intervals (30s match window, 5min off-peak)
  - DataFreshness relative time display component
  - Auto-refresh integration in LeagueTableWrapper via React key remount
affects: [06-live-data-pipeline future plans, any real-time UI updates]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Adaptive polling: 30s during match windows, 5min off-peak"
    - "React key remount pattern for silent data refresh"
    - "useRef for stale closure protection in polling callbacks"
    - "Separate reset useEffect for league/season change tracking"

key-files:
  created:
    - src/app/api/updates/check/route.ts
    - src/lib/hooks/use-polling.ts
    - src/components/DataFreshness.tsx
  modified:
    - src/components/league-table/LeagueTableWrapper.tsx

key-decisions:
  - "League-specific match window check (not global) for precise polling intervals"
  - "React key remount strategy for data refresh (simplest approach, LeagueTableClient refetches on mount)"
  - "Season hardcoded to '2025' with TODO to derive dynamically from league config"
  - "Polling disabled during historical matchweek viewing"
  - "Stale closure protection via useRef for onUpdate callback"

patterns-established:
  - "API route with force-dynamic for polling endpoints"
  - "Custom hook with adaptive interval based on server-provided flag"
  - "DataFreshness pattern for relative time display with auto-refresh"

# Metrics
duration: 3min
completed: 2026-02-05
---

# Phase 6 Plan 3: Browser Smart Polling Summary

**Adaptive-interval browser polling with usePolling hook, /api/updates/check endpoint, and silent league table auto-refresh via React key remount**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-05T22:04:34Z
- **Completed:** 2026-02-05T22:07:11Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- GET /api/updates/check returns latest standings updatedAt timestamp and matchWindowActive flag per-league (DB-only, no external API calls)
- usePolling hook polls at 30s during match windows and 5min off-peak, with stale closure protection and proper cleanup
- DataFreshness component shows "just now" / "X min ago" / "Xh ago" with 30s relative time refresh
- LeagueTableWrapper silently refreshes table via React key remount when data changes, disables polling for historical views

## Task Commits

Each task was committed atomically:

1. **Task 1: Updates check route and usePolling hook** - `3583da8` (feat)
2. **Task 2: DataFreshness component and LeagueTableWrapper integration** - `67fdf70` (feat)

## Files Created/Modified
- `src/app/api/updates/check/route.ts` - Browser polling endpoint; returns updatedAt + matchWindowActive for a specific league/season
- `src/lib/hooks/use-polling.ts` - Custom React hook with adaptive polling intervals, stale closure protection, and interval cleanup
- `src/components/DataFreshness.tsx` - Relative time display component ("Last updated: X min ago") with 30s auto-refresh
- `src/components/league-table/LeagueTableWrapper.tsx` - Integrated usePolling + DataFreshness; React key remount triggers silent data refresh

## Decisions Made
- **League-specific match window check:** The updates/check route checks match window for the specific league the user is viewing (not all leagues globally). This is more precise and avoids unnecessary fast-polling when only other leagues have active matches.
- **React key remount for refresh:** Using `key={league-refreshKey}` on LeagueTableClient forces a full remount which re-runs the useEffect that fetches standings. This is the simplest approach since data fetching is already driven by useEffect on mount.
- **Season hardcoded to '2025':** Added TODO to derive dynamically. SEASONS[0] is 2025, and all current league data uses this season.
- **Polling disabled for historical views:** When `isHistorical` is true, no point polling for changes to past matchweek data.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing `npm run build` failure from Phase 6 Plan 01/02 cron route: `src/lib/api-football/client.ts` uses `.js` import extensions that Turbopack cannot resolve. This is unrelated to Plan 03 changes. TypeScript compilation (`npx tsc --noEmit`) passes cleanly, confirming all new code is type-correct.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Browser polling loop is complete: server detects changes (Plan 01/02), browser detects timestamps (Plan 03), UI refreshes silently
- The pre-existing build failure from `.js` imports in api-football client needs to be addressed separately (likely by removing `.js` extensions or configuring Turbopack)
- Season should be derived dynamically from league config in a future iteration

---
*Phase: 06-live-data-pipeline*
*Completed: 2026-02-05*
