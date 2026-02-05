---
phase: 04-team-detail-pages
plan: 01
subsystem: ui, database
tags: [drizzle, radix-tabs, nuqs, next.js-dynamic-routes, team-detail, server-actions]

# Dependency graph
requires:
  - phase: 01-data-foundation
    provides: teams, standings, leagues tables and schema
  - phase: 02-league-tables
    provides: getLeagueConfig, FormBadges, ThemeBackground, Radix Tabs + nuqs pattern
  - phase: 03-match-fixture-pages
    provides: server action pattern (actions.ts), dynamic route pattern, Header component
provides:
  - Team query layer (getTeamBySlug, getTeamCurrentStandings, getPositionHistory, getCumulativePoints, getRivalTeamIds)
  - Server actions (fetchTeamBySlug, fetchOverviewData, stub actions for performance/squad/fixtures)
  - Dynamic route at /teams/[slug] with SEO metadata
  - TeamHero component with logo, name, stadium, position, points, form
  - TeamTabs shell with Radix Tabs + nuqs URL state persistence
  - TeamPageData type used by all subsequent team detail components
affects: [04-02-performance-tab, 04-03-squad-fixtures-tabs, team-linking-from-league-tables]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Team detail page pattern: server component page -> fetchTeamBySlug -> TeamHero + TeamTabs"
    - "Rival team detection for bump chart: +/- 3 positions at latest matchweek"
    - "Position history pivot: rows -> { matchweek, [teamName]: position } for Recharts"

key-files:
  created:
    - src/lib/teams/queries.ts
    - src/components/team-detail/actions.ts
    - src/components/team-detail/TeamHero.tsx
    - src/components/team-detail/TeamTabs.tsx
    - src/app/teams/[slug]/page.tsx
  modified: []

key-decisions:
  - "TeamPageData bundles team info + current standings + hasXg flag in a single server action call"
  - "fetchOverviewData takes teamName as parameter (for pivot extraction) rather than re-querying"
  - "Tab content placeholders for plans 04-02 and 04-03 to fill"

patterns-established:
  - "Team page data flow: page.tsx -> fetchTeamBySlug -> TeamHero (server) + TeamTabs (client)"
  - "Query layer separation: lib/teams/queries.ts for raw DB queries, components/team-detail/actions.ts for server actions"

# Metrics
duration: 2.5min
completed: 2026-02-05
---

# Phase 4 Plan 1: Team Detail Page Foundation Summary

**Team detail page at /teams/[slug] with Drizzle query layer, server actions, hero section (logo, position, points, form), and four-tab navigation shell using Radix Tabs + nuqs**

## Performance

- **Duration:** 2.5 min
- **Started:** 2026-02-05T17:32:14Z
- **Completed:** 2026-02-05T17:34:41Z
- **Tasks:** 2
- **Files created:** 5

## Accomplishments
- Team query layer with 5 database query functions covering team lookup, standings, position history, cumulative points, and rival detection
- Server actions bundling team + standings + league config for the page, plus overview data with bump chart and cumulative points support
- Dynamic route at /teams/[slug] with metadata generation, league-themed background, header, hero section, and tabbed navigation
- Four-tab UI shell (Overview, Performance, Squad, Fixtures) with URL-persisted active tab via ?tab= query parameter

## Task Commits

Each task was committed atomically:

1. **Task 1: Create team query layer and server actions** - `409def4` (feat)
2. **Task 2: Create team detail page route, hero section, and tab navigation** - `fa3c306` (feat)

## Files Created/Modified
- `src/lib/teams/queries.ts` - Team database queries (getTeamBySlug, getTeamCurrentStandings, getPositionHistory, getCumulativePoints, getRivalTeamIds)
- `src/components/team-detail/actions.ts` - Server actions (fetchTeamBySlug, fetchOverviewData, stub tab actions)
- `src/components/team-detail/TeamHero.tsx` - Hero section with logo, name, stadium, position callout, points, GD, form badges
- `src/components/team-detail/TeamTabs.tsx` - Client-side Radix Tabs with nuqs URL state, Suspense-wrapped
- `src/app/teams/[slug]/page.tsx` - Dynamic route with metadata, ThemeBackground, Header, TeamHero, TeamTabs

## Decisions Made
- TeamPageData type bundles team info, current standings, and hasXg flag into a single object -- avoids multiple round trips from components
- fetchOverviewData accepts teamName as parameter to extract rival names from the pivot data without re-querying
- Hero section shows position, points, played, and goal difference as the four prominent callout numbers (balances identity and performance)
- Tab content areas are placeholder dividers for plans 04-02 and 04-03 to fill with real components

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Query layer and server actions ready for plans 04-02 (Performance tab) and 04-03 (Squad + Fixtures tabs) to build on
- TeamTabs component accepts teamId, leagueId, season, teamName, hasXg -- all needed by tab content components
- fetchOverviewData is fully implemented and ready for the Overview tab component
- Stub actions (fetchPerformanceData, fetchSquadData, fetchFixturesData) provide the interface for subsequent plans

---
*Phase: 04-team-detail-pages*
*Completed: 2026-02-05*
