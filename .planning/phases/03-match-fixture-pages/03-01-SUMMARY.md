---
phase: 03-match-fixture-pages
plan: 01
subsystem: matches
tags: [drizzle, queries, h2h, date-format, match-cards, tabs, nuqs, radix-ui]
depends_on:
  requires: [01-data-foundation, 02-league-tables]
  provides: [match-query-layer, date-utilities, match-card-components, matches-page]
  affects: [03-02, 03-03, 06-live-data, 07-odds-api]
tech-stack:
  added: []
  patterns: [alias-join-for-self-referencing-fk, batch-map-queries, server-action-with-map-serialization]
key-files:
  created:
    - src/lib/matches/queries.ts
    - src/lib/matches/h2h.ts
    - src/lib/dates/format.ts
    - src/components/matches/actions.ts
    - src/components/matches/MatchCard.tsx
    - src/components/matches/MatchCardExpanded.tsx
    - src/components/matches/MatchList.tsx
    - src/components/matches/MatchListClient.tsx
    - src/components/matches/ResultsFixturesTabs.tsx
    - src/app/matches/page.tsx
  modified: []
decisions:
  - id: 03-01-alias
    summary: "Used drizzle-orm alias() for double-join on teams table (homeTeam/awayTeam)"
  - id: 03-01-batch-form
    summary: "getTeamForm batch-fetches from standings at max matchweek to avoid per-card queries"
  - id: 03-01-map-serialize
    summary: "Server actions serialize Map to Record for transfer (Maps not JSON-serializable)"
  - id: 03-01-odds-placeholder
    summary: "Upcoming match cards show 'Odds coming soon' text placeholder for MATL-04 (Phase 7)"
  - id: 03-01-h2h-limit
    summary: "H2H summary uses last 10 meetings for stats, expanded card shows top 5"
metrics:
  duration: 4 min
  completed: 2026-02-05
---

# Phase 3 Plan 1: Match Query Layer, Cards & /matches Page Summary

**Match data access layer with alias joins, batch form/event queries, and a tabbed /matches page with grouped match cards showing scores, kickoff times, form dots, and expandable H2H context.**

## What Was Done

### Task 1: Match query layer and date formatting utilities (18a5818)

Created three utility modules:

- **src/lib/matches/queries.ts**: `getRecentMatches` and `getUpcomingFixtures` using drizzle-orm `alias()` for double-joining the teams table as homeTeam/awayTeam. `getKeyEventsForMatches` batch-fetches goals, own goals, penalties, and red cards using `inArray`. `getTeamForm` batch-fetches form strings from standings at the latest matchweek.

- **src/lib/matches/h2h.ts**: `getH2HMeetings` fetches last N finished meetings between two teams using OR conditions for home/away permutations. `getH2HSummary` computes wins/draws from meetings relative to team1/team2 perspective.

- **src/lib/dates/format.ts**: Four Intl-based formatters -- `formatKickoffTime` (locale-aware "15:00 GMT"), `formatMatchDate` ("Saturday 1 February"), `formatRelativeTime` (smart relative/absolute), `formatMatchDateTime` (combined). All accept Date or string input.

### Task 2: Match card components and /matches page (5c2d0dd)

Created seven files forming the complete match browsing UI:

- **Server actions** (actions.ts): `fetchRecentMatches` batch-fetches matches + events + form, serializing Maps to Records. `fetchUpcomingFixtures` fetches fixtures + form. `fetchH2HSummary` wraps H2H query.

- **MatchCard**: Displays home/away teams with logos, score (finished) or kickoff time (scheduled), form dots, key event summaries, mini H2H bar, and expand chevron. Links to `/matches/[id]`. Uses `suppressHydrationWarning` for timezone-sensitive times. Shows "Odds coming soon" placeholder for upcoming fixtures.

- **MatchCardExpanded**: Fetches H2H via server action on mount with useTransition. Shows skeleton while loading, then H2H record summary, last 5 meeting scores, and both teams' form using FormBadges.

- **MatchList**: Groups matches by matchweek with section headers. Renders MatchCards with show-more button.

- **MatchListClient**: Data-fetching wrapper using useTransition/useEffect pattern. Skeleton loading, league switching support, show-all re-fetch with limit 100.

- **ResultsFixturesTabs**: Radix UI Tabs synced to `?tab=results|fixtures` via nuqs. Renders MatchListClient with active tab.

- **Matches page**: Client page with Suspense boundary, LeagueTabs header, and ResultsFixturesTabs content.

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| 03-01-alias | drizzle-orm alias() for homeTeam/awayTeam double-join | Fixtures reference teams table twice; alias avoids ambiguous column names |
| 03-01-batch-form | Batch getTeamForm at max matchweek | Avoids N+1 per-card form queries; single query for all teams |
| 03-01-map-serialize | Serialize Maps to Records in server actions | Server actions must return JSON-serializable data; Maps are not |
| 03-01-odds-placeholder | "Odds coming soon" text on upcoming cards | Structural placeholder for MATL-04 without premature implementation |
| 03-01-h2h-limit | H2H uses 10 meetings for stats, shows 5 in UI | Balance between statistical significance and UI space |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- `npx tsc --noEmit` passes with zero errors
- `npm run build` succeeds with /matches in route table
- /matches page renders with Results/Fixtures tabs
- Match cards grouped by matchweek with section headers
- Graceful empty state when database not configured

## Next Phase Readiness

Plan 03-01 provides the foundational match query layer and card components that 03-02 (match detail page) and 03-03 (team profile pages) will build upon. The `MatchWithTeams` type and server action patterns established here will be reused across those plans.
