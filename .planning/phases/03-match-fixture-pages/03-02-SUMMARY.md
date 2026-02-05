---
phase: 03-match-fixture-pages
plan: 02
subsystem: ui
tags: [next.js, server-components, drizzle, match-detail, stats-bars, timeline, h2h]

# Dependency graph
requires:
  - phase: 03-01
    provides: "Match query layer (queries.ts, h2h.ts), date formatting (format.ts), /matches list page with MatchCard linking to /matches/[id]"
  - phase: 01-01
    provides: "fixtures, fixtureEvents, fixtureStats schema tables"
provides:
  - "Match detail page at /matches/[id] with completed and upcoming views"
  - "Server actions: fetchMatchDetail, fetchMatchStats, fetchMatchEvents, fetchUpcomingMatchContext"
  - "ScoreHero, StatsComparison, EventsTimeline, H2HSection, FormGuide, ComparativeStats components"
  - "Odds placeholder structural prep for Phase 7"
affects: [03-03, phase-7-odds-api]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dual-view page pattern: single route renders different component sets based on fixture status"
    - "StatBar component pattern: proportional horizontal bars meeting in center with home/away color coding"
    - "Center-line timeline: vertical events timeline with home/away side placement"
    - "getLeagueSlugById: league ID to slug resolution for theme background on non-search-param pages"

key-files:
  created:
    - src/components/match-detail/actions.ts
    - src/components/match-detail/ScoreHero.tsx
    - src/components/match-detail/StatsComparison.tsx
    - src/components/match-detail/EventsTimeline.tsx
    - src/components/match-detail/H2HSection.tsx
    - src/components/match-detail/FormGuide.tsx
    - src/components/match-detail/ComparativeStats.tsx
    - src/app/matches/[id]/page.tsx
  modified: []

key-decisions:
  - "03-02: getLeagueSlugById helper in actions.ts resolves fixture leagueId to slug for ThemeBackground on detail page (avoids nuqs dependency)."
  - "03-02: lowerIsBetter flag in ComparativeStats inverts bar widths for league position and goals conceded comparisons."
  - "03-02: Substitution events show assistPlayerName as 'for {player}' rather than 'Assist' for correct semantic meaning."

patterns-established:
  - "Dual-view server component: single async page branches on fixture.status to render completed vs upcoming component sets"
  - "StatBar proportional bar: homePercent = homeValue / (homeValue + awayValue) * 100 with 50/50 fallback for zero totals"

# Metrics
duration: 4min
completed: 2026-02-05
---

# Phase 3 Plan 2: Match Detail Page Summary

**Match detail page at /matches/[id] with FotMob-style stats comparison bars, center-line events timeline, H2H history, form guides, and comparative season stats for completed and upcoming matches**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-05T05:59:03Z
- **Completed:** 2026-02-05T06:03:03Z
- **Tasks:** 2
- **Files created:** 8

## Accomplishments
- Server actions for match detail data fetching with team joins, stats, events with player names, and upcoming match context
- Score hero component showing team logos/names with score (completed) or kickoff time (upcoming)
- FotMob-style horizontal stats comparison bars with proportional widths for possession, shots, xG, etc.
- Vertical center-line events timeline placing home events left and away events right with minute markers
- Head-to-head section with visual summary bar and last 5 meetings list
- Form guide and comparative season stats for upcoming matches
- Odds placeholder section for Phase 7 structural preparation
- Dynamic metadata with team names and score in page title

## Task Commits

Each task was committed atomically:

1. **Task 1: Create match detail server actions and all match detail components** - `9493662` (feat)
2. **Task 2: Create match detail dynamic route page at /matches/[id]** - `166bc95` (feat)

## Files Created/Modified
- `src/components/match-detail/actions.ts` - Server actions: fetchMatchDetail, fetchMatchStats, fetchMatchEvents, fetchUpcomingMatchContext, getLeagueSlugById
- `src/components/match-detail/ScoreHero.tsx` - Score banner with team logos, names, and score/kickoff time
- `src/components/match-detail/StatsComparison.tsx` - FotMob-style horizontal comparison bars for match stats
- `src/components/match-detail/EventsTimeline.tsx` - Vertical center-line timeline with home/away event placement
- `src/components/match-detail/H2HSection.tsx` - Head-to-head history with summary bar and last 5 meetings
- `src/components/match-detail/FormGuide.tsx` - Recent form display with W/D/L colored badges for both teams
- `src/components/match-detail/ComparativeStats.tsx` - Season stats comparison with position, points, goals, win rate
- `src/app/matches/[id]/page.tsx` - Dynamic route page branching completed vs upcoming match views

## Decisions Made
- **getLeagueSlugById helper**: Added to actions.ts to resolve fixture's leagueId to a league slug for ThemeBackground. The detail page doesn't have nuqs search params, so the league theme must be derived from the fixture data.
- **lowerIsBetter flag**: ComparativeStats uses an inverted bar width for league position and goals conceded, where lower values are better. This correctly shows the "better" team with a wider bar.
- **Substitution event semantics**: assistPlayerName shown as "for {player}" on substitutions rather than "Assist:" since it represents the player being substituted off.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Match detail page complete, ready for 03-03 (match list linking and refinements)
- All match-detail components are self-contained server components (no client-side state needed)
- Odds placeholder section ready for Phase 7 integration

---
*Phase: 03-match-fixture-pages*
*Completed: 2026-02-05*
