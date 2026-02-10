---
phase: quick
plan: 1
subsystem: ui, database
tags: [drizzle, standings, stat-highlights, i18n, homepage]

# Dependency graph
requires:
  - phase: 01-data-foundation
    provides: "fixtures and standings tables with position data"
provides:
  - "Working biggest upset stat card using standings position gap"
  - "Position-based upset detection query (getBiggestUpset)"
affects: [stat-highlights, homepage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Standings position gap for upset detection instead of odds"

key-files:
  created: []
  modified:
    - src/lib/stats/queries.ts
    - src/components/stat-highlights/StatHighlights.tsx
    - src/messages/en.json
    - src/messages/es.json
    - src/messages/fr.json
    - src/messages/it.json
    - src/messages/de.json

key-decisions:
  - "Use standings position gap instead of fixture odds for upset detection -- odds data only exists for upcoming fixtures, not finished ones"

patterns-established:
  - "Standings self-join with aliases for per-team position lookup at a given matchweek"

# Metrics
duration: 2min
completed: 2026-02-10
---

# Quick Task 1: Fix Empty Biggest Upset Card on Homepage Summary

**Replaced odds-based upset detection with standings position gap, fixing the permanently empty biggest upset card**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-10T04:56:29Z
- **Completed:** 2026-02-10T04:58:28Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Fixed root cause: INNER JOIN on fixture_odds returned 0 rows because odds are only seeded for upcoming (not finished) fixtures
- Rewrote getBiggestUpset to use standings position data (always available for finished fixtures)
- Updated all 5 locale translation files with position-gap-based context string

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite getBiggestUpset query to use standings position gap** - `f30236e` (fix)
2. **Task 2: Update component and translations for position-based upset context** - `0a0c054` (fix)

## Files Created/Modified
- `src/lib/stats/queries.ts` - Rewrote getBiggestUpset with dual standings join, removed fixtureOdds import, changed BiggestUpsetResult type
- `src/components/stat-highlights/StatHighlights.tsx` - Updated context prop from winnerAtOdds to positionGapContext
- `src/messages/en.json` - "{gap} places apart"
- `src/messages/es.json` - "{gap} puestos de diferencia"
- `src/messages/fr.json` - "{gap} places d'ecart"
- `src/messages/it.json` - "{gap} posizioni di distacco"
- `src/messages/de.json` - "{gap} Platze Unterschied"

## Decisions Made
- Used standings position gap instead of fixture odds -- odds data is only seeded for upcoming/scheduled fixtures via The Odds API, never for finished fixtures, making the odds-based approach structurally impossible
- Joined standings table twice (aliased as home_standings and away_standings) to look up each team's league position at the fixture's matchweek
- Kept the query as a single SELECT with inline CASE expressions rather than splitting into subqueries

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Biggest upset card will now display real data when standings data is present in the database
- The pending todo "Investigate empty biggest upset card on homepage" can be removed from STATE.md

---
*Quick Task: 1-fix-empty-biggest-upset-card-on-homepage*
*Completed: 2026-02-10*
