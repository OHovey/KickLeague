# Phase 3: Match & Fixture Pages - Research

**Researched:** 2026-02-05
**Domain:** Match list UI, match detail pages, date/timezone formatting, expandable cards, comparison bars, events timeline
**Confidence:** HIGH

## Summary

Phase 3 builds on the existing data layer (fixtures, fixture_events, fixture_stats tables already seeded) and Phase 2's UI patterns (server actions, client wrappers, Tailwind dark theme, Radix Tabs, nuqs URL state). The main work is creating new database query functions, server actions, and React components for match lists and match detail pages.

The project already has all match data in the database (fixtures with scores, events with minute/type/player, stats with possession/shots/xG). The key technical challenges are: (1) building efficient queries for recent results and upcoming fixtures with team data, (2) building H2H queries between two specific teams, (3) formatting dates/times in the user's timezone without additional dependencies, (4) creating expandable match cards with rich previews, (5) building a comparison bar component and events timeline from scratch (pure CSS/Tailwind, no library needed), and (6) setting up Next.js dynamic routes for match detail pages.

**Primary recommendation:** Use the established project patterns (server actions for data, client wrappers for state bridging, Tailwind for styling, Radix Tabs for tab switching) and native `Intl.DateTimeFormat` / `Intl.RelativeTimeFormat` for all date/time formatting. Build comparison bars and the events timeline as pure CSS components -- no charting library needed for these simple visualizations. Use Next.js App Router dynamic routes at `/matches/[id]` for match detail pages.

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js (App Router) | 16.1.6 | Framework, routing, server actions | Already established |
| React | 19.2.3 | UI components | Already established |
| Drizzle ORM | 0.45.1 | Database queries with joins | Already established |
| Tailwind CSS | 4.x | Styling (dark theme, responsive) | Already established |
| @radix-ui/react-tabs | 1.1.13 | Results/Fixtures tab switching | Already used for league tabs |
| nuqs | 2.8.8 | URL state management (league, tab) | Already used for league selection |
| clsx | 2.1.1 | Conditional class names | Already used |

### Supporting (No New Dependencies)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Intl.DateTimeFormat | Native | Timezone-aware date/time formatting | Kickoff times, match dates |
| Intl.RelativeTimeFormat | Native | Relative time ("2 hours ago") | Recent match timestamps |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native Intl APIs | date-fns + date-fns-tz | Adds ~10KB bundle; Intl is sufficient for display formatting, zero bundle cost |
| Pure CSS comparison bars | Recharts horizontal bars | Overkill; these are simple percentage-width divs, not data charts |
| Timeline library | react-vertical-timeline-component | Adds dependency for something easily built with CSS flexbox/grid |

**Installation:**
```bash
# No new dependencies needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── page.tsx                           # Home (league table + match previews)
│   └── matches/
│       ├── page.tsx                        # Matches page (Results/Fixtures tabs)
│       └── [id]/
│           └── page.tsx                    # Match detail page (completed or upcoming)
├── components/
│   ├── league-nav/                         # Existing league tabs
│   ├── league-table/                       # Existing table components
│   ├── matches/                            # NEW: Match list components
│   │   ├── MatchCard.tsx                   # Single match card (preview)
│   │   ├── MatchCardExpanded.tsx           # Expanded card with H2H
│   │   ├── MatchList.tsx                   # List of match cards with matchweek grouping
│   │   ├── MatchListClient.tsx             # Client wrapper (data fetching via server action)
│   │   ├── MatchPreviewSection.tsx         # Home page preview (5 recent + 5 upcoming)
│   │   ├── ResultsFixturesTabs.tsx         # Results/Fixtures tab switcher
│   │   └── actions.ts                      # Server actions for match data
│   ├── match-detail/                       # NEW: Match detail page components
│   │   ├── ScoreHero.tsx                   # Score banner with team logos
│   │   ├── StatsComparison.tsx             # Horizontal comparison bars
│   │   ├── EventsTimeline.tsx              # Vertical center-line timeline
│   │   ├── H2HSection.tsx                  # Head-to-head history
│   │   ├── FormGuide.tsx                   # Team form runs (reuses FormBadges pattern)
│   │   ├── ComparativeStats.tsx            # Key stat comparison for upcoming matches
│   │   └── actions.ts                      # Server actions for match detail data
│   └── header/                             # NEW: Header nav
│       └── Header.tsx                      # Site title + Matches link
├── lib/
│   ├── matches/                            # NEW: Match query layer
│   │   ├── queries.ts                      # Database queries for matches
│   │   └── h2h.ts                          # Head-to-head calculation
│   └── dates/                              # NEW: Date/time formatting utilities
│       └── format.ts                       # Intl-based formatters
```

### Pattern 1: Server Action Data Fetching (Established)
**What:** Server actions fetch data from the database, client components call them via useEffect + useTransition.
**When to use:** All data fetching in client components.
**Example:**
```typescript
// components/matches/actions.ts
'use server';

import { getRecentMatches, getUpcomingFixtures } from '@/lib/matches/queries';

export async function fetchRecentMatches(league: string, limit: number = 10) {
  return getRecentMatches(league, limit);
}

export async function fetchUpcomingFixtures(league: string, limit: number = 10) {
  return getUpcomingFixtures(league, limit);
}
```

```typescript
// components/matches/MatchListClient.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useLeague } from '@/lib/hooks/use-league';
import { fetchRecentMatches, fetchUpcomingFixtures } from './actions';

export function MatchListClient() {
  const { league } = useLeague();
  const [isPending, startTransition] = useTransition();
  // ... fetch data in useEffect via startTransition
}
```
**Source:** Established pattern in `src/components/league-table/LeagueTableClient.tsx` and `actions.ts`.

### Pattern 2: Next.js 16 Dynamic Routes with Async Params
**What:** Match detail pages use dynamic `[id]` route segments. In Next.js 16, `params` is a Promise that must be awaited.
**When to use:** Match detail page at `/matches/[id]`.
**Example:**
```typescript
// app/matches/[id]/page.tsx
export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const matchId = parseInt(id, 10);
  // Fetch match data server-side
  // Determine if completed or upcoming, render appropriate view
}
```
**Source:** [Next.js Dynamic Routes Docs](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes), [Async params in Next.js 16](https://dev.to/peterlidee/async-params-and-searchparams-in-next-16-5ge9)

### Pattern 3: Client Wrapper for State Bridging (Established)
**What:** A thin client component reads URL state (league from nuqs), passes it as a prop to the data-fetching client component.
**When to use:** Any component that needs to react to league changes.
**Example:**
```typescript
// Follows exact pattern from LeagueTableWrapper.tsx
'use client';
import { useLeague } from '@/lib/hooks/use-league';
import { MatchListClient } from './MatchListClient';

export function MatchListWrapper() {
  const { league } = useLeague();
  return <MatchListClient league={league} />;
}
```
**Source:** Established pattern in `src/components/league-table/LeagueTableWrapper.tsx`.

### Pattern 4: URL Tab State with nuqs
**What:** Use nuqs to sync the active tab (Results/Fixtures) to the URL query parameter so it persists and can be linked to.
**When to use:** Results/Fixtures tab on `/matches` page, and "View all" links from the home page preview.
**Example:**
```typescript
'use client';
import { parseAsStringEnum, useQueryState } from 'nuqs';

const TABS = ['results', 'fixtures'] as const;

export function useMatchTab() {
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum([...TABS]).withDefault('results')
  );
  return { tab, setTab };
}
```
**Source:** Established pattern from `src/lib/hooks/use-league.ts` using nuqs.

### Anti-Patterns to Avoid
- **Fetching all fixtures then filtering client-side:** The fixtures table can have ~380 rows per league. Always filter by status and limit in the SQL query.
- **Using server components for data that changes with client-side league selection:** League selection is client-side state managed by nuqs. Use the established server action pattern, not RSC data fetching.
- **Building the comparison bars with a charting library:** These are simple percentage-width divs. Using Recharts would add complexity and bundle size for no benefit.
- **Hand-rolling timezone conversion:** Use `Intl.DateTimeFormat` with `timeZone: undefined` (auto-detects user timezone). Do NOT try to detect timezone with custom code.
- **Storing formatted dates in the database:** The `kickoff` column is already `timestamp with time zone`. Formatting happens at render time in the browser.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Timezone-aware time display | Custom UTC offset calculation | `Intl.DateTimeFormat` with `timeZoneName: 'short'` | Browser auto-detects timezone; handles DST correctly |
| Relative time ("2 hours ago") | Custom time-ago function | `Intl.RelativeTimeFormat` + simple unit calculator | Built into every modern browser, handles locale correctly |
| Date formatting ("Saturday 1 February") | Custom date string building | `Intl.DateTimeFormat` with `weekday: 'long', day: 'numeric', month: 'long'` | Handles locale, avoids formatting bugs |
| Tab component with URL sync | Custom tab switcher | Radix UI Tabs + nuqs | Already in the project, accessible, handles keyboard nav |
| Match card expand/collapse | Custom disclosure component | `useState` toggle (same as TableRow) | Simple boolean toggle, no library needed; matches existing pattern |

**Key insight:** The project already has all the infrastructure. No new dependencies are needed. The main work is database queries and React components using established patterns.

## Common Pitfalls

### Pitfall 1: Server/Client Timezone Mismatch
**What goes wrong:** Dates rendered on the server (SSR) use the server's timezone. When hydration occurs, the client re-renders with the user's timezone, causing a hydration mismatch.
**Why it happens:** `Intl.DateTimeFormat` with auto-detected timezone returns different strings on server vs client.
**How to avoid:** Format timezone-sensitive dates ONLY in client components. Pass raw ISO timestamps from the server, format them client-side. Alternatively, use `suppressHydrationWarning` on the time element.
**Warning signs:** Console warnings about hydration mismatch on date/time elements.

### Pitfall 2: N+1 Query Problem in Match Lists
**What goes wrong:** Fetching match data, then looping through to fetch team names, form data, or events for each match individually.
**Why it happens:** Not joining team data in the initial query or not batch-fetching related data.
**How to avoid:** Use Drizzle's `innerJoin` to join teams in the fixtures query. Fetch form data and H2H data in batch queries, not per-match.
**Warning signs:** Slow page loads, many database round-trips per page load.

### Pitfall 3: Next.js 16 Async Params
**What goes wrong:** Treating `params` as a synchronous object in page components causes runtime errors.
**Why it happens:** Next.js 16 changed params to be a Promise. The project uses Next.js 16.1.6.
**How to avoid:** Always `await params` in async server components, or use `use(params)` in client components.
**Warning signs:** Build errors about params type, runtime "Cannot read property of Promise" errors.

### Pitfall 4: Match Card Expand State During League Switching
**What goes wrong:** Expanded match cards remain expanded when the user switches leagues, showing stale data from the previous league.
**Why it happens:** Expand state is local React state, not reset when league changes.
**How to avoid:** Use the league as a React key on the match list component, forcing a full re-mount on league change. Or clear expand state in the league change effect.
**Warning signs:** Seeing old league match details in expanded cards after switching.

### Pitfall 5: Form Data Calculation Complexity
**What goes wrong:** Attempting to compute form (last 5 results W/D/L) on the fly from fixtures by ordering by date, rather than using the form data already stored in standings.
**Why it happens:** Not realizing the standings table already has a `form` column.
**How to avoid:** Use the `form` column from the `standings` table for team form display. For match card form dots, query the latest standings row for each team.
**Warning signs:** Excessive fixture queries just to determine form strings that already exist.

### Pitfall 6: H2H Query Performance
**What goes wrong:** Building H2H records by scanning all fixtures for a team pair across multiple seasons.
**Why it happens:** Not scoping H2H queries to the correct season and not indexing properly.
**How to avoid:** The H2H for match cards only needs current-season data (already built via `buildH2HMatrix` in queries.ts). For match detail H2H "last 5 meetings," query fixtures for the team pair ordered by kickoff DESC, limit 5 -- this hits the existing `fixtures_home_team` and `fixtures_away_team` indexes.
**Warning signs:** Slow H2H calculations, full table scans.

## Code Examples

### Query: Recent Finished Matches with Team Data
```typescript
// Source: Drizzle ORM select/join pattern (established in queries.ts)
import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '@/db/connection';
import { fixtures, teams } from '@/db/schema';
import { alias } from 'drizzle-orm/pg-core';

const homeTeam = alias(teams, 'homeTeam');
const awayTeam = alias(teams, 'awayTeam');

export async function getRecentMatches(leagueId: number, season: string, limit: number = 10) {
  return getDb()
    .select({
      id: fixtures.id,
      matchweek: fixtures.matchweek,
      kickoff: fixtures.kickoff,
      status: fixtures.status,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
      venue: fixtures.venue,
      homeTeam: {
        id: homeTeam.id,
        name: homeTeam.name,
        shortName: homeTeam.shortName,
        logoUrl: homeTeam.logoUrl,
      },
      awayTeam: {
        id: awayTeam.id,
        name: awayTeam.name,
        shortName: awayTeam.shortName,
        logoUrl: awayTeam.logoUrl,
      },
    })
    .from(fixtures)
    .innerJoin(homeTeam, eq(fixtures.homeTeamId, homeTeam.id))
    .innerJoin(awayTeam, eq(fixtures.awayTeamId, awayTeam.id))
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.season, season),
        eq(fixtures.status, 'finished')
      )
    )
    .orderBy(desc(fixtures.kickoff))
    .limit(limit);
}
```

### Query: Head-to-Head Last N Meetings
```typescript
// Source: Drizzle ORM pattern, uses existing indexes
import { eq, and, or, desc } from 'drizzle-orm';

export async function getH2HMeetings(
  team1Id: number,
  team2Id: number,
  limit: number = 5
) {
  return getDb()
    .select({
      id: fixtures.id,
      kickoff: fixtures.kickoff,
      homeTeamId: fixtures.homeTeamId,
      awayTeamId: fixtures.awayTeamId,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
    })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.status, 'finished'),
        or(
          and(eq(fixtures.homeTeamId, team1Id), eq(fixtures.awayTeamId, team2Id)),
          and(eq(fixtures.homeTeamId, team2Id), eq(fixtures.awayTeamId, team1Id))
        )
      )
    )
    .orderBy(desc(fixtures.kickoff))
    .limit(limit);
}
```

### Timezone-Aware Date Formatting (Client-Side)
```typescript
// Source: Native Intl API (MDN Web Docs)
// lib/dates/format.ts

export function formatKickoffTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(d);
  // Output: "15:00 GMT" or "10:00 EST" depending on user's timezone
}

export function formatMatchDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
  // Output: "Saturday 1 February"
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      .format(-diffMinutes, 'minute');
  }
  if (diffHours < 24) {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      .format(-diffHours, 'hour');
  }
  // Beyond 24 hours, return absolute date
  return formatMatchDate(d);
}
```

### Comparison Bar Component (Pure CSS/Tailwind)
```tsx
// Source: FotMob-style stats comparison, pure CSS implementation
interface StatBarProps {
  label: string;
  homeValue: number;
  awayValue: number;
  format?: (val: number) => string;
}

function StatBar({ label, homeValue, awayValue, format }: StatBarProps) {
  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;
  const formatFn = format ?? ((v: number) => String(v));

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm text-white/70">
        <span className="font-medium text-white">{formatFn(homeValue)}</span>
        <span className="text-xs uppercase tracking-wider">{label}</span>
        <span className="font-medium text-white">{formatFn(awayValue)}</span>
      </div>
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
        <div
          className="rounded-l-full bg-blue-500 transition-all duration-500"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="rounded-r-full bg-red-500 transition-all duration-500"
          style={{ width: `${awayPercent}%` }}
        />
      </div>
    </div>
  );
}
```

### Events Timeline Component (Pure CSS)
```tsx
// Source: Custom implementation following context decisions
// Vertical center line, home events left, away events right

interface TimelineEvent {
  minute: number;
  extraMinute: number | null;
  type: string;
  teamSide: 'home' | 'away';
  playerName: string | null;
  detail: string | null;
}

function EventsTimeline({ events, homeTeamId }: { events: TimelineEvent[]; homeTeamId: number }) {
  return (
    <div className="relative">
      {/* Center line */}
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/20" />

      {events.map((event, i) => {
        const isHome = event.teamSide === 'home';
        return (
          <div key={i} className="relative flex items-center py-2">
            {/* Home side (left) */}
            <div className={`flex-1 text-right pr-4 ${isHome ? '' : 'invisible'}`}>
              <span className="text-sm text-white">{event.playerName}</span>
              {/* Event icon */}
            </div>

            {/* Minute marker (center) */}
            <div className="z-10 flex h-6 w-10 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white/70">
              {event.minute}{event.extraMinute ? `+${event.extraMinute}` : ''}'
            </div>

            {/* Away side (right) */}
            <div className={`flex-1 pl-4 ${!isHome ? '' : 'invisible'}`}>
              <span className="text-sm text-white">{event.playerName}</span>
              {/* Event icon */}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Smart Default Tab Selection
```typescript
// Determine which tab to show by default
function getDefaultTab(recentMatches: Match[], upcomingFixtures: Match[]): 'results' | 'fixtures' {
  if (recentMatches.length === 0) return 'fixtures';
  if (upcomingFixtures.length === 0) return 'results';

  // If any match finished today, show results
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const hasMatchToday = recentMatches.some(m => {
    const matchDate = new Date(m.kickoff);
    matchDate.setHours(0, 0, 0, 0);
    return matchDate.getTime() === today.getTime();
  });

  return hasMatchToday ? 'results' : 'fixtures';
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params` as sync object | `params` as Promise (await) | Next.js 15+, enforced in 16 | All dynamic route pages must `await params` |
| date-fns for timezone display | Native Intl APIs | Browser support matured ~2022 | Zero bundle cost for date formatting |
| Separate pages for results/fixtures | Single page with tabbed UI | UX pattern consensus | Fewer routes, smoother tab switching |
| Charting library for stat bars | Pure CSS percentage-width divs | - | Simpler, lighter, more customizable |

**Deprecated/outdated:**
- Synchronous `params` in Next.js page components: Enforced as async in Next.js 16. Must `await params`.
- `moment.js` for date formatting: Deprecated in favor of Intl APIs or date-fns/Luxon.

## Existing Codebase Assets

### Database Schema (Ready to Query)
The following tables are already populated and indexed:

| Table | Key Fields | Relevant For |
|-------|-----------|-------------|
| `fixtures` | id, leagueId, season, matchweek, homeTeamId, awayTeamId, kickoff, status, homeScore, awayScore, venue | Match lists, match detail pages |
| `fixture_events` | fixtureId, type, minute, extraMinute, teamId, playerId, detail | Events timeline |
| `fixture_stats` | fixtureId, teamId, possession, shots, shotsOnTarget, corners, fouls, xg | Stats comparison bars |
| `teams` | id, name, shortName, abbreviation, logoUrl | Team display in match cards |
| `standings` | teamId, form, position, points, goalsFor | Form guide, comparative stats |
| `players` | id, name, firstName, lastName | Player names in events |

### Existing Indexes
- `fixtures_league_season(leagueId, season)` - Filter by league
- `fixtures_kickoff(kickoff)` - Order by date
- `fixtures_status(status)` - Filter finished/scheduled
- `fixtures_home_team(homeTeamId)` and `fixtures_away_team(awayTeamId)` - H2H queries
- `fixture_events_fixture(fixtureId)` - Events for a match
- `fixture_stats_unique(fixtureId, teamId)` - Stats for a match

### Existing Patterns to Reuse
- **Server action pattern:** `actions.ts` calling query functions, consumed by client components via `useTransition`
- **Client wrapper pattern:** Thin client component reading `useLeague()` hook, passing league prop to data-fetching component
- **Skeleton loading:** Pulse-animated skeleton divs during data fetch
- **Zone color indicator:** Left-border color technique from TableRow
- **Form badges:** `FormBadges` component already handles "WWDLW" string to colored badges
- **Theme integration:** `data-theme` attribute and CSS variables for league-specific colors
- **Expandable rows:** `useState` toggle pattern from TableRow

### Drizzle ORM Notes
- Version 0.45.1 uses V1 relations API (`relations()` function, not `defineRelations`)
- Use core query builder with `select().from().innerJoin().where().orderBy().limit()` for complex queries (same pattern as standings queries)
- For table aliases (home team vs away team join), use `alias()` from `drizzle-orm/pg-core`
- The `NeonHttpDatabase` type is used throughout -- serverless, no connection pool management needed

## Open Questions

1. **Odds data for upcoming matches (MATL-04, MTCH-03)**
   - What we know: The CONTEXT.md mentions odds comparison, and success criteria #5 references "odds comparison from multiple bookmakers." However, The Odds API integration is explicitly Phase 7 work.
   - What's unclear: Should Phase 3 build the odds display UI with placeholder/mock data, or should odds display be fully deferred to Phase 7?
   - Recommendation: Build the upcoming match page structure without odds. Add a placeholder section that says "Odds comparison coming soon" or conditionally render odds when data exists. Phase 7 adds the data pipeline and populates it. This avoids blocking Phase 3 on Phase 7 infrastructure.

2. **Cross-season H2H data**
   - What we know: The database only stores the current season (2025) and previous season (2024). H2H "last 5 meetings" may span beyond available data.
   - What's unclear: Should H2H show "last 5 available meetings" even if that's only 2-3 matches, or should it attempt to fetch more historical data?
   - Recommendation: Show whatever H2H data exists with a note like "Based on last N meetings (current + previous season)" if fewer than 5 are available. Do not add historical data fetching to this phase.

3. **Header navigation design scope**
   - What we know: CONTEXT.md says this phase adds a "Matches" link to the header nav. Language selection is deferred to Phase 7.
   - What's unclear: How much header redesign is needed -- just adding a link, or restructuring the current sticky header?
   - Recommendation: Minimal change -- add a "Matches" link alongside the existing league tabs. Keep the existing header structure. Phase 7 will address full header nav design with language selection.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: All source files in `src/` directory, database schema, existing components, server actions
- [Next.js 16 Dynamic Routes Docs](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes) - Async params pattern
- [Drizzle ORM Select & Joins](https://orm.drizzle.team/docs/select) - Query builder patterns
- [Drizzle ORM Joins](https://orm.drizzle.team/docs/joins) - Table alias and join patterns
- [Radix UI Tabs](https://www.radix-ui.com/primitives/docs/components/tabs) - Tab component API

### Secondary (MEDIUM confidence)
- [MDN Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) - Native date formatting
- [MDN Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat) - Relative time formatting
- [Next.js 16 Async Params Blog](https://dev.to/peterlidee/async-params-and-searchparams-in-next-16-5ge9) - Migration guide
- [date-fns v4.0 Blog](https://blog.date-fns.org/v40-with-time-zone-support/) - Confirmed Intl is sufficient for display-only formatting

### Tertiary (LOW confidence)
- [soccer_match_timeline GitHub](https://github.com/the-guitarman/soccer_match_timeline) - Reference for timeline UI pattern (vanilla JS, not directly usable)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, all patterns established in codebase
- Architecture: HIGH - Direct extension of Phase 2 patterns with clear file structure
- Pitfalls: HIGH - Identified from codebase analysis and framework documentation
- Code examples: HIGH - Based on existing codebase patterns and verified API docs
- Open questions: MEDIUM - Odds/H2H scope needs product decision

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (stable stack, no fast-moving dependencies)
