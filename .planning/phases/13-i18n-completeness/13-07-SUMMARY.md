---
phase: 13-i18n-completeness
plan: 07
subsystem: ui
tags: [next-intl, recharts, i18n, ordinals, tooltips]

# Dependency graph
requires:
  - phase: 13-i18n-completeness (plans 01-06)
    provides: i18n infrastructure, getLocalizedOrdinal utility, complete locale message files
provides:
  - Translated chart tooltips across all 5 locale files
  - Locale-aware ordinal suffixes in Sparkline and BumpChart
  - Zero remaining hardcoded English in chart tooltip components
affects: [14-seo, 13-VERIFICATION]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Recharts tooltip i18n: useTranslations/useLocale in parent, formatter functions passed as props to custom tooltip components"

key-files:
  created: []
  modified:
    - src/messages/en.json
    - src/messages/es.json
    - src/messages/de.json
    - src/messages/it.json
    - src/messages/fr.json
    - src/components/league-table/Sparkline.tsx
    - src/components/team-detail/FixturesTab.tsx
    - src/components/team-detail/charts/BumpChart.tsx
    - src/components/team-detail/charts/CumulativeXgChart.tsx
    - src/components/team-detail/charts/CumulativePointsChart.tsx

key-decisions:
  - "Recharts tooltip i18n via prop-passing pattern (formatMatchweek/formatOrdinal callbacks) since Recharts clones tooltip elements outside React context"

patterns-established:
  - "Recharts custom tooltip i18n: hooks in parent component, formatter function props passed to tooltip child"

# Metrics
duration: 4min
completed: 2026-02-08
---

# Phase 13 Plan 07: Chart Tooltip i18n Gap Closure Summary

**Replaced hardcoded English "MW" matchweek abbreviations and ordinal suffixes in 5 chart tooltip components with locale-aware translations via next-intl and getLocalizedOrdinal**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-08T08:46:37Z
- **Completed:** 2026-02-08T08:50:46Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Added Charts.matchweekShort, Charts.points, and TeamFixtures.matchweekShort keys to all 5 locale files with football-domain-accurate abbreviations (MW/J/ST/G)
- Replaced hardcoded "MW" in Sparkline, BumpChart, CumulativeXgChart, CumulativePointsChart, and FixturesTab with translated matchweek labels
- Replaced local English-only ordinal() functions in Sparkline and BumpChart with getLocalizedOrdinal for locale-aware ordinal suffixes
- Replaced hardcoded "pts" in CumulativePointsChart with translated Charts.points key

## Task Commits

Each task was committed atomically:

1. **Task 1: Add matchweek abbreviation and points keys to locale files** - `ecd9155` (feat)
2. **Task 2: Wire chart components to translated matchweek and ordinals** - `8c61440` (feat)

## Files Created/Modified
- `src/messages/en.json` - Added Charts namespace (matchweekShort, points) and TeamFixtures.matchweekShort
- `src/messages/es.json` - Added Charts namespace and TeamFixtures.matchweekShort (J {week})
- `src/messages/de.json` - Added Charts namespace and TeamFixtures.matchweekShort (ST {week})
- `src/messages/it.json` - Added Charts namespace and TeamFixtures.matchweekShort (G {week})
- `src/messages/fr.json` - Added Charts namespace and TeamFixtures.matchweekShort (J {week})
- `src/components/league-table/Sparkline.tsx` - Replaced hardcoded MW and ordinal() with useTranslations + getLocalizedOrdinal
- `src/components/team-detail/FixturesTab.tsx` - Replaced hardcoded MW with t('matchweekShort') via matchweekLabel prop
- `src/components/team-detail/charts/BumpChart.tsx` - Replaced hardcoded MW and ordinal() with useTranslations + getLocalizedOrdinal
- `src/components/team-detail/charts/CumulativeXgChart.tsx` - Replaced hardcoded MW with useTranslations('Charts')
- `src/components/team-detail/charts/CumulativePointsChart.tsx` - Replaced hardcoded MW and pts with useTranslations('Charts')

## Decisions Made
- Recharts tooltip i18n uses prop-passing pattern: useTranslations/useLocale hooks called in parent component, formatter callback functions (formatMatchweek, formatOrdinal, formatPoints) passed as props to custom tooltip components. This is necessary because Recharts clones tooltip elements outside React provider context.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All chart tooltip components now render locale-appropriate matchweek abbreviations and ordinal suffixes
- Phase 13 i18n gap closure complete -- zero remaining hardcoded English strings in chart components
- Ready for Phase 14 (SEO) with full i18n coverage

---
*Phase: 13-i18n-completeness*
*Completed: 2026-02-08*

## Self-Check: PASSED
