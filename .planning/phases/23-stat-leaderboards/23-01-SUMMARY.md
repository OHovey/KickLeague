---
phase: 23-stat-leaderboards
plan: 01
subsystem: ui, database, api
tags: [drizzle, sql, next-intl, leaderboard, player-stats, isr]

# Dependency graph
requires:
  - phase: 22-league-landing-pages
    provides: League page pattern, ThemeBackground, LEAGUE_THEMES, i18n routing
provides:
  - 3 leaderboard query functions (top scorers, top assists, disciplinary)
  - fetchLeaderboardData server action with team localization
  - 15 new ISR pages at /leagues/[slug]/stats/[stat]
  - StatsPage i18n namespace in all 5 locales
affects: [23-02 (sitemap/SEO for stat pages), league-page (link to stats)]

# Tech tracking
tech-stack:
  added: []
  patterns: [raw SQL queries via db.execute for complex aggregations with subqueries]

key-files:
  created:
    - src/lib/stats/leaderboard-queries.ts
    - src/components/leaderboard/actions.ts
    - src/app/[locale]/leagues/[slug]/stats/[stat]/page.tsx
  modified:
    - src/i18n/routing.ts
    - src/messages/en.json
    - src/messages/es.json
    - src/messages/de.json
    - src/messages/it.json
    - src/messages/fr.json

key-decisions:
  - "Raw SQL via db.execute for leaderboard queries (complex aggregations with correlated subqueries not expressible in Drizzle query builder)"
  - "Appearances approximated as distinct fixtures with events (no lineup table available)"
  - "Tab navigation between stat types using simple anchor links (no client-side state needed)"

patterns-established:
  - "Leaderboard query pattern: raw SQL with correlated subqueries for appearance counts"
  - "Stats page pattern: /leagues/[slug]/stats/[stat] with generateStaticParams for all combinations"

# Metrics
duration: 4min
completed: 2026-02-12
---

# Phase 23 Plan 01: Stat Leaderboards Data Layer & Pages Summary

**Three leaderboard types (top scorers, top assists, disciplinary) with raw SQL queries, server action, and 15 ISR pages across 5 leagues with tab navigation and i18n**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-12T20:57:28Z
- **Completed:** 2026-02-12T21:01:24Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Three leaderboard query functions with complex SQL aggregations, appearance subqueries, and per-appearance rate calculations
- Server action with database check, league resolution, stat type dispatch, and team name localization
- 15 statically-generated leaderboard pages (5 leagues x 3 stat types) with 30-minute ISR
- Glassmorphism data tables with player photos, team logos, mobile-responsive column hiding
- Tab navigation between stat types, back-to-league link, and empty state handling
- Full i18n coverage with StatsPage namespace in all 5 locales

## Task Commits

Each task was committed atomically:

1. **Task 1: Create leaderboard database queries and server action** - `f2cfc9a` (feat)
2. **Task 2: Create leaderboard page with routing and i18n** - `6d1fc42` (feat)

## Files Created/Modified
- `src/lib/stats/leaderboard-queries.ts` - Three query functions for scorers, assists, disciplinary leaderboards
- `src/components/leaderboard/actions.ts` - Server action with typed union return and team localization
- `src/app/[locale]/leagues/[slug]/stats/[stat]/page.tsx` - Leaderboard page with table, tabs, hero section
- `src/i18n/routing.ts` - Added /leagues/[slug]/stats/[stat] pathname with 5 locale variants
- `src/messages/en.json` - Added StatsPage namespace (16 keys)
- `src/messages/es.json` - Spanish translations for StatsPage
- `src/messages/de.json` - German translations for StatsPage
- `src/messages/it.json` - Italian translations for StatsPage
- `src/messages/fr.json` - French translations for StatsPage

## Decisions Made
- Used raw SQL (db.execute) for leaderboard queries because the complex aggregations with correlated subqueries for appearance counts are not expressible in Drizzle's query builder
- Approximated "appearances" as distinct fixtures where the player has any event (no lineup/minutes table exists) -- acceptable because leaderboard players by definition have events
- Used simple anchor links for tab navigation between stat types rather than client-side routing, keeping the page server-rendered

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 15 leaderboard pages are live and generating via ISR
- Ready for 23-02 to add sitemap segments and SEO enhancements for stat pages
- League pages could add links to stat leaderboards in a future iteration

## Self-Check: PASSED

All 9 files verified present. Both task commits (f2cfc9a, 6d1fc42) verified in git log.

---
*Phase: 23-stat-leaderboards*
*Completed: 2026-02-12*
