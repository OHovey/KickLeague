---
phase: 26-internal-discovery-links
plan: 01
subsystem: ui
tags: [next-intl, internal-links, discovery, seo, stat-highlights, league-table]

# Dependency graph
requires:
  - phase: 22-league-pages
    provides: League pages at /leagues/{slug}
  - phase: 23-stats-leaderboards
    provides: Stats leaderboard pages at /leagues/{slug}/stats/top-scorers
  - phase: 24-team-player-pages
    provides: Team pages at /teams/{slug}
  - phase: 12-site-chrome-homepage
    provides: StatHighlights and LeagueTable homepage components
provides:
  - Clickable stat highlight cards linking to league stats, match detail, and team pages
  - View full standings link from homepage league table to league page
  - Team slug fields in stat highlight query results
affects: [26-internal-discovery-links]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "StatCard href prop pattern for optional anchor wrapping"
    - "Conditional Wrapper component via tag name variable"

key-files:
  created: []
  modified:
    - src/components/stat-highlights/StatCard.tsx
    - src/components/stat-highlights/StatHighlights.tsx
    - src/lib/stats/queries.ts
    - src/components/league-table/LeagueTableClient.tsx
    - src/messages/en.json
    - src/messages/es.json
    - src/messages/de.json
    - src/messages/it.json
    - src/messages/fr.json

key-decisions:
  - "Used native anchor tag with conditional Wrapper pattern instead of next/link for stat cards (cards are client-side rendered with locale-prefixed hrefs)"
  - "Used next-intl Link component for league table standings link (consistent with existing navigation patterns)"
  - "Skipped aria-label i18n keys since card content already provides accessible text"

patterns-established:
  - "StatCard href prop: optional anchor wrapping via dynamic tag name variable"

# Metrics
duration: 3min
completed: 2026-02-12
---

# Phase 26 Plan 01: Homepage Discovery Links Summary

**Clickable stat highlight cards linking to leaderboards, matches, and teams, plus view-full-standings link on league table**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-12T23:11:44Z
- **Completed:** 2026-02-12T23:15:22Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Homepage stat highlight cards are now clickable: Top Scorer links to stats leaderboard, Biggest Upset links to match detail, Best Form links to team page
- League table footer now has a "View full standings" link to the dedicated league page
- All team slug fields added to stat query result types for URL construction
- All link text translated in 5 locales (en/es/de/it/fr)

## Task Commits

Each task was committed atomically:

1. **Task 1: Make stat highlight cards clickable links** - `c94a6cc` (feat)
2. **Task 2: Add view full standings link to league table** - `7fc44ea` (feat)

## Files Created/Modified
- `src/components/stat-highlights/StatCard.tsx` - Added optional href prop, renders as anchor when provided
- `src/components/stat-highlights/StatHighlights.tsx` - Wired href props for all three stat cards with locale-prefixed URLs
- `src/lib/stats/queries.ts` - Added teamSlug to TopScorerResult/FormTeamResult, homeTeamSlug/awayTeamSlug to BiggestUpsetResult
- `src/components/league-table/LeagueTableClient.tsx` - Added Link import and view full standings footer link
- `src/messages/en.json` - Added viewFullStandings key to LeagueTable namespace
- `src/messages/es.json` - Added viewFullStandings (Spanish)
- `src/messages/de.json` - Added viewFullStandings (German)
- `src/messages/it.json` - Added viewFullStandings (Italian)
- `src/messages/fr.json` - Added viewFullStandings (French)

## Decisions Made
- Used native anchor tag with conditional Wrapper pattern for stat cards since they are client-rendered with full locale-prefixed hrefs already computed
- Used next-intl Link component for league table standings link for consistent navigation behavior
- Skipped adding aria-label i18n keys since the card content (label, subject, stat) already serves as accessible text within the anchor

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Homepage components now provide natural discovery links to all programmatic SEO pages
- Ready for 26-02 (additional discovery links from other page types)

## Self-Check: PASSED

All 9 modified files verified on disk. Both task commits (c94a6cc, 7fc44ea) verified in git history.

---
*Phase: 26-internal-discovery-links*
*Completed: 2026-02-12*
