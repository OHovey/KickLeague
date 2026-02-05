---
phase: 07-betting-odds-localisation
plan: 05
subsystem: i18n, database
tags: [localisation, team-translations, date-formatting, locale-aware, intl-api, drizzle]
dependency-graph:
  requires:
    - phase: 07-04
      provides: next-intl i18n infrastructure, locale routing, useLocale hook availability
  provides:
    - team_translations database table for per-locale team names
    - getTeamName / getTeamTranslations / getLocalizedTeamNames helpers with English fallback
    - locale-aware date formatting functions (backward compatible)
    - formatNumber helper for locale-specific number separators
  affects: [07-02, 07-03]
tech-stack:
  added: []
  patterns: [locale-parameter-with-default, useLocale-in-client-components, locale-prop-for-server-components]
key-files:
  created:
    - src/db/schema/translations.ts
    - src/lib/teams/translations.ts
  modified:
    - src/db/schema/index.ts
    - src/db/schema/relations.ts
    - src/lib/dates/format.ts
    - src/components/matches/MatchCard.tsx
    - src/components/matches/MatchPreviewSection.tsx
    - src/components/matches/MatchCardExpanded.tsx
    - src/components/team-detail/FixturesTab.tsx
    - src/components/match-detail/ScoreHero.tsx
    - src/components/match-detail/H2HSection.tsx
    - src/app/[locale]/matches/[id]/page.tsx
key-decisions:
  - "Date format functions keep en-GB default for backward compatibility rather than requiring locale everywhere"
  - "Client components use useLocale() from next-intl; server components accept locale as optional prop"
  - "team_translations table starts empty; English name from teams table is the fallback"
  - "getLocalizedTeamNames skips DB query entirely for locale='en' (optimization)"
patterns-established:
  - "Locale parameter pattern: all Intl formatting functions accept optional locale with sensible default"
  - "Client locale pattern: useLocale() at component level, passed down to utility functions"
  - "Server locale pattern: locale from page params passed as prop to server components"
  - "Translation fallback pattern: Map-based lookup with ?? englishName"
metrics:
  duration: 5 min
  completed: 2026-02-05
---

# Phase 7 Plan 05: Team Name Localisation and Locale-Aware Formatting Summary

**team_translations schema with English fallback resolution, locale-aware date/number formatting across all match/fixture components via Intl APIs**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-05T23:52:29Z
- **Completed:** 2026-02-05T23:57:20Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Created team_translations table with (teamId, locale) unique constraint and locale index
- Built translation resolution helpers: getTeamTranslations (batch DB query), getTeamName (pure fallback), getLocalizedTeamNames (convenience wrapper)
- Refactored all 5 date formatting functions to accept optional locale parameter with backward-compatible defaults
- Added formatNumber helper for locale-specific number formatting (1,000 vs 1.000 vs 1 000)
- Integrated locale into 6 client components via useLocale() and 2 server components via locale prop
- Match detail page passes locale from params to ScoreHero and H2HSection

## Task Commits

Each task was committed atomically:

1. **Task 1: Team translations schema and resolution helper** - `e77a92c` (feat)
2. **Task 2: Locale-aware date/number formatting and component integration** - `353eaec` (feat)

## Files Created/Modified

### Created
- `src/db/schema/translations.ts` - team_translations table with (teamId, locale) unique index
- `src/lib/teams/translations.ts` - getTeamTranslations, getTeamName, getLocalizedTeamNames helpers

### Modified
- `src/db/schema/index.ts` - Added translations barrel export
- `src/db/schema/relations.ts` - Added teamTranslations relation to teams, teamTranslationsRelations
- `src/lib/dates/format.ts` - Added locale parameter to all functions, added formatNumber
- `src/components/matches/MatchCard.tsx` - useLocale() for formatMatchDateShort and formatKickoffTime
- `src/components/matches/MatchPreviewSection.tsx` - useLocale() for CompactFixtureRow formatKickoffTime
- `src/components/matches/MatchCardExpanded.tsx` - useLocale() for formatMatchDate in H2H meetings
- `src/components/team-detail/FixturesTab.tsx` - useLocale() passed to FixtureRow formatKickoffTime
- `src/components/match-detail/ScoreHero.tsx` - locale prop for formatKickoffTime and formatMatchDate
- `src/components/match-detail/H2HSection.tsx` - locale prop for formatMatchDate
- `src/app/[locale]/matches/[id]/page.tsx` - Passes locale to ScoreHero and H2HSection

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| en-GB default for all date format functions | Backward compatibility: existing callers don't need to change |
| useLocale() in client components, locale prop in server components | Follows next-intl best practices: hooks in client, props in server |
| team_translations starts empty | Translation data populated manually or via future seed; English fallback ensures no missing text |
| getLocalizedTeamNames skips DB for locale='en' | Optimization: English names already in the teams table, no translation lookup needed |
| formatKickoffTime keeps undefined as locale default | Preserves existing behavior where browser default determines time format (12h vs 24h) |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

- Run `npx drizzle-kit push` to create team_translations table in the database.

## Next Phase Readiness

Plan 07-05 completes the data-driven localisation layer:
- **07-02** (Odds ingestion pipeline): Can proceed independently; team translations available if needed for odds matching
- **07-03** (Odds UI components): Can use locale context for odds value formatting
- All date/number formatting is now locale-aware throughout the match/fixture display components
- Team translation table is ready for population via seed script or manual entry

---
*Phase: 07-betting-odds-localisation*
*Completed: 2026-02-05*
