---
phase: 13-i18n-completeness
plan: 02
subsystem: ui
tags: [next-intl, useTranslations, getTranslations, i18n, league-table, timeline, data-freshness]

# Dependency graph
requires:
  - phase: 13-01
    provides: en.json message keys for LeagueTable, Timeline, DataFreshness namespaces
provides:
  - League table components wired to useTranslations/getTranslations
  - Timeline components wired to useTranslations
  - DataFreshness component wired to useTranslations
  - ZoneLegend translated via zone type mapping instead of ZONE_LABELS
affects: [13-03, 13-04, 13-05, 13-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server components use getTranslations from next-intl/server"
    - "Client components use useTranslations from next-intl"
    - "Zone labels mapped via ZONE_TRANSLATION_KEYS record instead of importing ZONE_LABELS"
    - "DataFreshness uses getTimeBucket for numeric calculation + formatRelativeTime for i18n formatting"

key-files:
  created: []
  modified:
    - src/components/league-table/LeagueTable.tsx
    - src/components/league-table/LeagueTableClient.tsx
    - src/components/league-table/ExpandedRowDetail.tsx
    - src/components/league-table/ZoneLegend.tsx
    - src/components/league-table/HistoricalBanner.tsx
    - src/components/timeline/SeasonTimeline.tsx
    - src/components/timeline/TimelineCircle.tsx
    - src/components/timeline/TimelineStrip.tsx
    - src/components/DataFreshness.tsx

key-decisions:
  - "ZoneLegend promoted to client component to use useTranslations hook; server component parents can still render it"
  - "DataFreshness refactored: split getRelativeTime into pure getTimeBucket (numbers) + formatRelativeTime (i18n strings via useCallback)"
  - "Developer-facing DB setup instructions (CLI steps) left untranslated; only user-visible headings/messages translated"

patterns-established:
  - "Zone type to translation key mapping: ZONE_TRANSLATION_KEYS record in ZoneLegend.tsx"
  - "Dual namespace pattern: const t = useTranslations('LeagueTable') + const tCommon = useTranslations('Common')"

# Metrics
duration: 5min
completed: 2026-02-08
---

# Phase 13 Plan 02: League Table, Timeline, and DataFreshness i18n Wiring Summary

**9 components wired to next-intl useTranslations/getTranslations -- all column headers, zone labels, expand controls, timeline aria-labels, and relative time strings now render from message keys**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-08T07:49:13Z
- **Completed:** 2026-02-08T07:54:06Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- League table column headers (Team, P, W, D, L, GF, GA, GD, Pts, Form, +/-, Trend) render from LeagueTable namespace keys
- Zone legend labels render from translated keys via ZONE_TRANSLATION_KEYS mapping instead of hardcoded ZONE_LABELS
- Timeline aria-labels for matchweek circles, nav arrows, and listbox use Timeline namespace interpolation
- DataFreshness relative time strings ("just now", "X min ago", "Xh ago") render from DataFreshness namespace keys
- Historical banner, expand/collapse controls, and all error states translated

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire i18n into league table components** - `f446c3d` (feat)
2. **Task 2: Wire i18n into timeline and DataFreshness components** - `b6888f3` (feat)

## Files Created/Modified
- `src/components/league-table/LeagueTable.tsx` - Server component with getTranslations for standings header, column headers, error states
- `src/components/league-table/LeagueTableClient.tsx` - Client component with useTranslations for column headers, expand controls, error states
- `src/components/league-table/ExpandedRowDetail.tsx` - Mobile expanded row with translated stat labels (Won, Drawn, Lost, GF, GA, +/-)
- `src/components/league-table/ZoneLegend.tsx` - Promoted to client component with zone type to translation key mapping
- `src/components/league-table/HistoricalBanner.tsx` - Translated viewing matchweek text and return button
- `src/components/timeline/SeasonTimeline.tsx` - Translated heading and subtitle
- `src/components/timeline/TimelineCircle.tsx` - Translated matchweek aria-labels with upcoming suffix
- `src/components/timeline/TimelineStrip.tsx` - Translated nav arrow and listbox aria-labels
- `src/components/DataFreshness.tsx` - Refactored relative time to use getTimeBucket + message key formatting

## Decisions Made
- ZoneLegend.tsx promoted to client component ('use client') to support useTranslations hook; this is safe because server component parents can render client component children
- DataFreshness.tsx refactored to separate pure time calculation (getTimeBucket) from i18n formatting (formatRelativeTime using useCallback), keeping reactivity with useEffect interval
- Developer-facing DB setup instructions (numbered CLI steps like "npx drizzle-kit push") intentionally left untranslated as they are technical/developer-facing

## Deviations from Plan

None - plan executed exactly as written. All en.json keys from Plan 01 were sufficient; no additional keys needed.

## Issues Encountered

Pre-existing `npm run build` error due to middleware/proxy dual-file detection from Phase 13-01 infrastructure setup. This is unrelated to i18n wiring and does not affect TypeScript compilation (`npx tsc --noEmit` passes clean).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All league table, timeline, and DataFreshness components are fully i18n-wired
- Ready for Plan 03 (matches page components) and Plan 04 (team page components)
- Zero hardcoded English user-visible strings remain in the 9 modified files

## Self-Check: PASSED

---
*Phase: 13-i18n-completeness*
*Completed: 2026-02-08*
