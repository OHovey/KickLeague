---
phase: quick-2
plan: 01
subsystem: ui, database
tags: [drizzle, standings, i18n, next-intl, league-table]

requires:
  - phase: none
    provides: standalone fix
provides:
  - Fixed getPositionChanges query that finds actual previous matchweek with data
  - Clear "Mov" column header with localized tooltips across 5 locales
affects: [standings, league-table, i18n]

tech-stack:
  added: []
  patterns:
    - "Query actual data presence rather than assuming sequential matchweeks"

key-files:
  created: []
  modified:
    - src/lib/standings/queries.ts
    - src/messages/en.json
    - src/messages/de.json
    - src/messages/fr.json
    - src/messages/it.json
    - src/messages/es.json
    - src/components/league-table/LeagueTable.tsx
    - src/components/league-table/LeagueTableClient.tsx

key-decisions:
  - "Use MAX(matchweek) < current instead of hardcoded currentMatchweek - 1 to handle non-consecutive matchweeks"
  - "Use 'Mov' as universal abbreviation across all locales -- short, universally understood in football"

duration: 1min
completed: 2026-02-10
---

# Quick Task 2: Fix League Table Position Change Column Summary

**Fixed position change query to find actual previous matchweek with data, renamed ambiguous "+/-" header to "Mov" with localized tooltips**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-10T05:05:40Z
- **Completed:** 2026-02-10T05:07:02Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- getPositionChanges now queries MAX(matchweek) < currentMatchweek to find the real previous matchweek with data
- Handles single-matchweek case naturally (returns empty map, all teams show "-")
- Works correctly with non-consecutive matchweek numbers (e.g., 18 and 20 but not 19)
- Column header changed from "+/-" to "Mov" across all 5 locales (en, de, fr, it, es)
- Added positionChangeTooltip with localized explanations on hover

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix getPositionChanges to find actual previous matchweek** - `e564c7b` (fix)
2. **Task 2: Rename column header and add tooltip across all locales** - `81937b3` (feat)

## Files Created/Modified
- `src/lib/standings/queries.ts` - Rewrote getPositionChanges to query actual previous matchweek
- `src/messages/en.json` - Changed positionChange to "Mov", added positionChangeTooltip
- `src/messages/de.json` - Changed positionChange to "Mov", added positionChangeTooltip
- `src/messages/fr.json` - Changed positionChange to "Mov", added positionChangeTooltip
- `src/messages/it.json` - Changed positionChange to "Mov", added positionChangeTooltip
- `src/messages/es.json` - Changed positionChange to "Mov", added positionChangeTooltip
- `src/components/league-table/LeagueTable.tsx` - Added title attribute for tooltip on th element
- `src/components/league-table/LeagueTableClient.tsx` - Added title attribute for tooltip on div columnheader

## Decisions Made
- Used MAX(matchweek) < current instead of hardcoded currentMatchweek - 1 to handle non-consecutive matchweeks
- Used "Mov" as universal abbreviation across all locales -- short, universally understood in football context

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

---
*Quick task: 2-fix-league-table-column-showing-blanks-a*
*Completed: 2026-02-10*
