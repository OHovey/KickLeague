---
phase: 13-i18n-completeness
plan: 04
subsystem: ui
tags: [next-intl, useTranslations, getTranslations, i18n, team-detail, header, stat-highlights, ordinals]

# Dependency graph
requires:
  - phase: 13-01
    provides: en.json message keys and i18n infrastructure (ordinals utility, routing config)
provides:
  - Team detail components wired to message keys (TeamTabs, TeamHero, OverviewTab, PerformanceTab, SquadTab, FixturesTab, HomeAwayBars)
  - Header and LanguagePicker wired to Navigation namespace
  - StatHighlights using locale-aware ordinals and StatHighlights namespace
  - Layout metadata via generateMetadata with getTranslations
affects: [13-05, 13-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useTranslations hook in client components for namespace-scoped translation"
    - "getTranslations in server components and generateMetadata for translated metadata"
    - "getLocalizedOrdinal utility connected to StatHighlights for locale-aware ordinal formatting"
    - "Translation function passed as callback for dynamic labels (opponentPositionLabel)"

key-files:
  created: []
  modified:
    - src/components/team-detail/TeamTabs.tsx
    - src/components/team-detail/TeamHero.tsx
    - src/components/team-detail/OverviewTab.tsx
    - src/components/team-detail/PerformanceTab.tsx
    - src/components/team-detail/SquadTab.tsx
    - src/components/team-detail/FixturesTab.tsx
    - src/components/team-detail/charts/HomeAwayBars.tsx
    - src/app/[locale]/teams/[slug]/page.tsx
    - src/components/header/Header.tsx
    - src/components/i18n/LanguagePicker.tsx
    - src/components/stat-highlights/StatHighlights.tsx
    - src/components/stat-highlights/StatCard.tsx
    - src/app/[locale]/layout.tsx
    - src/messages/en.json

key-decisions:
  - "TeamHero converted to client component ('use client') to use useTranslations hook"
  - "FixturesTab passes opponentPositionLabel as callback to DifficultyBadge to avoid useTranslations in nested non-component function"
  - "Layout switched from static metadata export to generateMetadata for translated description"
  - "StatHighlights replaces hardcoded getOrdinalSuffix with getLocalizedOrdinal from i18n/ordinals"
  - "en.json percentOfMatches key updated to use {percent} parameter for flexible formatting"
  - "Added Teams.gd and TeamPerformance.noHomeAwayData keys to en.json"

patterns-established:
  - "Callback pattern: pass translation function to child components that need dynamic translated strings"
  - "generateMetadata with getTranslations for locale-aware page metadata"

# Metrics
duration: 7min
completed: 2026-02-08
---

# Phase 13 Plan 04: Team/Header/StatHighlights i18n Wiring Summary

**All team detail, header, stat highlights, and layout components wired to message keys via useTranslations/getTranslations, with locale-aware ordinals in StatHighlights**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-08T07:50:40Z
- **Completed:** 2026-02-08T07:57:48Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Wired 7 team detail components (TeamTabs, TeamHero, OverviewTab, PerformanceTab, SquadTab, FixturesTab, HomeAwayBars) to Teams/TeamOverview/TeamPerformance/TeamSquad/TeamFixtures namespaces
- Wired Header and LanguagePicker to Navigation namespace with translated nav links and aria-labels
- Connected StatHighlights to getLocalizedOrdinal utility, replacing hardcoded English ordinal suffixes
- Converted layout.tsx from static metadata to generateMetadata with getTranslations for translated description

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire i18n into team detail components and team page** - `35a0cd5` (feat)
2. **Task 2: Wire i18n into header, stat highlights, homepage, and layout** - `d52955b` (feat)

## Files Created/Modified
- `src/components/team-detail/TeamTabs.tsx` - Tab labels from Teams namespace
- `src/components/team-detail/TeamHero.tsx` - Position/points/played/gd/form labels translated
- `src/components/team-detail/OverviewTab.tsx` - Season summary stats and chart headings from TeamOverview
- `src/components/team-detail/PerformanceTab.tsx` - ~25 strings from TeamPerformance namespace
- `src/components/team-detail/SquadTab.tsx` - Position groups, column headers, top performer labels
- `src/components/team-detail/FixturesTab.tsx` - Section headings and opponent position tooltip
- `src/components/team-detail/charts/HomeAwayBars.tsx` - Home/away legend from TeamPerformance
- `src/app/[locale]/teams/[slug]/page.tsx` - Metadata and error strings translated via getTranslations
- `src/components/header/Header.tsx` - Nav link and aria-label from Navigation namespace
- `src/components/i18n/LanguagePicker.tsx` - Select language aria-label translated
- `src/components/stat-highlights/StatHighlights.tsx` - Labels from StatHighlights, ordinals via getLocalizedOrdinal
- `src/components/stat-highlights/StatCard.tsx` - Empty state text from Common.noDataAvailable
- `src/app/[locale]/layout.tsx` - Metadata description via generateMetadata
- `src/messages/en.json` - Added gd, noHomeAwayData keys; updated percentOfMatches format

## Decisions Made
- TeamHero converted to client component to use useTranslations (was previously a plain server component with no directive)
- FixturesTab passes opponentPositionLabel as callback function to DifficultyBadge child to avoid hooks in non-component functions
- Layout switched from static `export const metadata` to async `generateMetadata` to use getTranslations for translated description
- en.json `percentOfMatches` updated from static "% of matches" to `"{percent}% of matches"` for parameterized formatting
- Added `Teams.gd` key for goal difference label in TeamHero
- Added `TeamPerformance.noHomeAwayData` key for empty state in HomeAwayBars

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added missing en.json keys**
- **Found during:** Task 1 (team detail wiring)
- **Issue:** `Teams.gd`, `TeamPerformance.noHomeAwayData` keys not in en.json from Plan 01
- **Fix:** Added keys to en.json; updated `percentOfMatches` to accept `{percent}` parameter
- **Files modified:** src/messages/en.json
- **Verification:** TypeScript passes, keys resolve correctly
- **Committed in:** 35a0cd5 (Task 1 commit)

**2. [Rule 3 - Blocking] TeamHero needed 'use client' directive**
- **Found during:** Task 1 (TeamHero wiring)
- **Issue:** TeamHero was not a client component, but useTranslations requires client context
- **Fix:** Added 'use client' directive to TeamHero.tsx
- **Files modified:** src/components/team-detail/TeamHero.tsx
- **Verification:** Component renders correctly, TypeScript passes
- **Committed in:** 35a0cd5 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Both fixes necessary for correct i18n operation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All team detail, header, stat highlights, and layout components now use message keys
- Ready for Plan 05 (remaining component i18n) or Plan 06 (locale message file population)
- Pre-existing TypeScript error in EventsTimeline.tsx (from another plan) does not affect this plan's scope

## Self-Check: PASSED

---
*Phase: 13-i18n-completeness*
*Completed: 2026-02-08*
