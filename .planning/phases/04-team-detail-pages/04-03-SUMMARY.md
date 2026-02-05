---
phase: 04-team-detail-pages
plan: 03
subsystem: ui
tags: [react, next.js, drizzle, squad, fixtures, server-actions, team-links]

# Dependency graph
requires:
  - phase: 04-team-detail-pages (plan 01)
    provides: Team detail page shell, tab navigation, team queries, server action stubs
provides:
  - Squad tab with top performer callout cards and position-grouped roster
  - Fixtures tab with chronological timeline, W/D/L indicators, difficulty colouring
  - Team page links from league table, match cards, and match detail pages
  - Team page discoverability from every place team names appear
affects:
  - 07-betting-odds (odds placeholder in fixtures tab ready for Phase 7)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fixture difficulty colouring based on opponent league position (1-6 hard, 7-14 medium, 15+ easy)"
    - "Position-grouped roster with appearance distribution bars"
    - "Nested navigation in cards via useRouter + stopPropagation (avoids nested <a> tags)"

key-files:
  created:
    - src/components/team-detail/SquadTab.tsx
    - src/components/team-detail/FixturesTab.tsx
  modified:
    - src/lib/teams/queries.ts
    - src/components/team-detail/actions.ts
    - src/components/team-detail/TeamTabs.tsx
    - src/components/matches/MatchCard.tsx
    - src/components/match-detail/ScoreHero.tsx
    - src/components/match-detail/actions.ts

key-decisions:
  - "Appearances used as proxy for minutes distribution (minutes data not available from API)"
  - "Nested link navigation uses useRouter + stopPropagation in MatchCard to avoid invalid nested <a> tags"
  - "Fixture difficulty thresholds: position 1-6 = hard (red), 7-14 = medium (amber), 15+ = easy (green)"
  - "Top performers skip cards when stat is 0 (e.g., no assists in season yet)"

patterns-established:
  - "Fixture difficulty colouring: color-coded by opponent position for visual fixture analysis"
  - "Position-grouped roster: GK/DEF/MID/FWD sections with stats table per group"

# Metrics
duration: 8min
completed: 2026-02-05
---

# Phase 4 Plan 3: Squad Tab, Fixtures Tab, and Team Page Links Summary

**Squad tab with top performer cards and position-grouped roster, fixtures tab with difficulty colouring and match links, team names linked throughout app**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-02-05T17:39:57Z
- **Completed:** 2026-02-05T17:47:35Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Squad tab shows top scorer, top assister, and most booked player callout cards with position-grouped roster including appearance distribution bars
- Fixtures tab displays last 10 results with W/D/L indicators and next 5 upcoming matches with fixture difficulty colouring based on opponent league position
- Team names in match cards, match detail ScoreHero, and league table rows are clickable links to team detail pages
- All four team detail tabs now render actual components (Overview, Performance, Squad, Fixtures)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Squad and Fixtures tabs with queries and server actions** - `27be82f` (feat)
2. **Task 2: Add team page links to match cards and match detail** - `1bb7b2e` (feat)

## Files Created/Modified
- `src/components/team-detail/SquadTab.tsx` - Client component: top performer cards + position-grouped roster with stats
- `src/components/team-detail/FixturesTab.tsx` - Client component: recent results + upcoming fixtures with difficulty colouring
- `src/lib/teams/queries.ts` - Added getPlayerStats, getTeamFixtures, getOpponentPositions query functions
- `src/components/team-detail/actions.ts` - Implemented fetchSquadData and fetchFixturesData server actions
- `src/components/team-detail/TeamTabs.tsx` - Replaced Squad and Fixtures tab placeholders with real components
- `src/components/matches/MatchCard.tsx` - Added team name click handlers navigating to /teams/{slug}
- `src/components/match-detail/ScoreHero.tsx` - Wrapped team names in Link components to /teams/{slug}
- `src/components/match-detail/actions.ts` - Added slug to MatchDetailTeam and fetchMatchDetail query

## Decisions Made
- Used `useRouter` + `stopPropagation` pattern for team links inside MatchCard (which is already wrapped in a Link to the match detail page) to avoid invalid nested `<a>` tags
- Fixture difficulty thresholds set at position 1-6 (hard/red), 7-14 (medium/amber), 15+ (easy/green) -- standard football analytics convention
- Appearances used as proxy for minutes distribution since per-match minutes data is not available from the API
- Top performer cards conditionally rendered only when stat > 0 to avoid showing empty "Top Scorer: 0 goals" cards early in season

## Deviations from Plan

None -- plan executed exactly as written. Note: The parallel 04-02 plan had already implemented the league table team links (teamSlug in StandingsRow, TableRow Link) and match query slug additions before this plan reached Task 2, so those changes were already in place.

## Issues Encountered
- Parallel execution with 04-02: The other plan committed changes to shared files (queries.ts, actions.ts, TeamTabs.tsx) between Task 1 and Task 2 of this plan. No conflicts occurred since both plans appended to the end of shared files as instructed. The 04-02 plan also proactively added teamSlug to standings and match queries, making some of Task 2's planned changes already complete.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All four team detail tabs are fully functional (Overview, Performance, Squad, Fixtures)
- Phase 04 (Team Detail Pages) is complete with all 3 plans executed
- Ready for Phase 05 (Player Detail Pages) which can build on the player data and team page foundation
- Odds placeholder in Fixtures tab ready for Phase 7 integration

---
*Phase: 04-team-detail-pages*
*Completed: 2026-02-05*
