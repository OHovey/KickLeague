---
created: 2026-02-06T00:01
title: Add three-card hero row to homepage
area: ui
files:
  - src/app/[locale]/page.tsx
  - src/components/matches/MatchCard.tsx
  - src/components/matches/MatchCardExpanded.tsx
  - src/components/matches/actions.ts
  - src/lib/matches/queries.ts
  - src/components/odds/CompactOdds.tsx
---

## Problem

The homepage currently jumps straight into the league table and match preview section. There's no at-a-glance summary of the most important information for the currently selected league. A three-card hero row at the top would give users immediate context about what just happened, what's coming next, and a key league insight — all before scrolling.

### Requested cards

1. **Most Recent Result** — The last completed match in the selected league. Show teams, score, date. Compact MatchCard style.

2. **Next Upcoming Match** — The next scheduled fixture in the selected league. Include betting odds and bookmaker links (leverage existing CompactOdds and affiliate link infrastructure from v1.1).

3. **League Spotlight card (suggested)** — Top scorer in the selected league. This complements the table (standings) and matches (cards 1 & 2) by surfacing player-level data. Shows player name, team, goal count. Falls back to "League leader" (top of standings with points + form) if player data isn't seeded yet.

### Design intent

- Three equal-width cards in a responsive row (`grid grid-cols-1 md:grid-cols-3 gap-4`)
- Sits between LeagueTabs and LeagueTableWrapper on the homepage
- Cards use league theme colors (existing `LEAGUE_THEMES` system)
- Reactive to league tab switching (cards update when `useLeague()` league changes)

## Solution

- Create `HeroCards` client component that uses `useLeague()` to get selected league
- Server actions to fetch: most recent completed match, next upcoming match (with odds), and top scorer / league leader
- Reuse existing MatchCard / CompactOdds components where possible
- New `LeagueSpotlightCard` component for card 3
- Insert `<HeroCards />` into homepage `<main>` above `LeagueTableWrapper`
