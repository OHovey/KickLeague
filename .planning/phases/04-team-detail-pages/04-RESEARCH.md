# Phase 4: Team Detail Pages - Research

**Researched:** 2026-02-05
**Domain:** Team detail pages with tabbed layout (overview, performance, squad, fixtures), charting (bump chart, grouped bar chart, cumulative line chart), derived player statistics, fixture difficulty indicators
**Confidence:** HIGH

## Summary

Phase 4 builds team detail pages accessible via `/teams/[slug]`, presenting a tabbed interface with hero section, overview charts, performance analytics, squad data, and fixture schedule. The existing data layer provides nearly everything needed: the `teams` table has slug/name/logoUrl/stadiumName, `standings` has per-matchweek position/points/form/home-away splits, `fixtures` and `fixture_events` provide goal timing and results, and `fixture_stats` stores xG per team per fixture.

The primary technical challenges are: (1) deriving player season statistics (goals, assists, cards) by aggregating `fixture_events` since no player_season_stats table exists; (2) building a bump chart (position-over-time with rival teams) using Recharts `LineChart` with multiple `Line` components and inverted Y-axis -- Recharts 3 has no native bump chart component; (3) computing goals-by-15-minute-period from event minute data; (4) computing fixture difficulty indicators from opponent standings positions; and (5) building the win probability bar from odds data (which is not yet in the schema -- placeholder needed, similar to Phase 3's odds approach).

The project already uses Recharts 3.7.0, Radix Tabs 1.1.13, Drizzle ORM 0.45.1, and follows established server action and client wrapper patterns. No new dependencies are needed. The team detail page will be a server component at the route level (for SEO metadata) with client components for tab navigation and interactive charts.

**Primary recommendation:** Use the established project patterns (server actions, Radix Tabs + nuqs for tab state, Recharts for charts, Tailwind for styling). Build the bump chart as a multi-line `LineChart` with reversed Y-axis. Aggregate player stats from `fixture_events` with SQL queries rather than adding a new table. Use opponent league position for fixture difficulty colouring. Defer odds/win-probability to a placeholder (as Phase 3 did) since odds data pipeline is Phase 7.

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js (App Router) | 16.1.6 | Framework, routing, server actions | Already established |
| React | 19.2.3 | UI components | Already established |
| Drizzle ORM | 0.45.1 | Database queries with joins and aggregations | Already established |
| Recharts | 3.7.0 | Charts (bump chart, bar chart, line chart, cumulative xG) | Already in project, used for Sparkline |
| Tailwind CSS | 4.x | Styling (dark theme, responsive) | Already established |
| @radix-ui/react-tabs | 1.1.13 | Tab navigation (Overview, Performance, Squad, Fixtures) | Already used for league tabs and results/fixtures tabs |
| nuqs | 2.8.8 | URL state management (active tab) | Already used for league and tab state |
| clsx | 2.1.1 | Conditional class names | Already used |

### Supporting (No New Dependencies)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Recharts `LineChart` | 3.7.0 | Bump chart (position-over-time) and cumulative xG chart | Overview tab, Performance tab |
| Recharts `BarChart` | 3.7.0 | Grouped bar chart (goals by 15-min period) | Performance tab |
| Intl.DateTimeFormat | Native | Fixture date formatting | Fixtures tab |
| FormBadges component | Existing | Coloured W/D/L form dots | Hero section, Overview tab |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts `LineChart` for bump chart | @nivo/bump dedicated bump chart | Nivo has a purpose-built bump chart, but adds a new dependency (~50KB). Recharts is already in the project and a multi-line LineChart with inverted Y-axis achieves the same effect. |
| SQL aggregation for player stats | New `player_season_stats` table | A denormalized table would be faster to query but requires a new seed step and schema migration. Aggregating from `fixture_events` is sufficient for 380 fixtures per league and avoids schema changes. |
| Opponent position for fixture difficulty | Form-based or hybrid indicator | Position is stable, available in `standings`, and intuitive (top-6 = hard, bottom-3 = easy). Form-based requires extra computation with marginal benefit. |

**Installation:**
```bash
# No new dependencies needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    teams/
      [slug]/
        page.tsx                        # Team detail page (server component)
  components/
    team-detail/                        # NEW: Team detail components
      TeamHero.tsx                      # Hero section with logo, position, points, form
      TeamTabs.tsx                      # Tab navigation (client component, Radix + nuqs)
      OverviewTab.tsx                   # Season summary, bump chart, cumulative points, form run
      PerformanceTab.tsx                # Home/away splits, goals by period, xG, clean sheets, scoring-first record
      SquadTab.tsx                      # Top performers, position-grouped roster, minutes distribution
      FixturesTab.tsx                   # Chronological fixture list with difficulty colouring
      charts/
        BumpChart.tsx                   # Position-over-time bump chart (Recharts LineChart)
        CumulativePointsChart.tsx       # Cumulative points line chart
        GoalsByPeriodChart.tsx          # Grouped bar chart (scored vs conceded per 15-min interval)
        CumulativeXgChart.tsx           # Cumulative xG vs actual goals line chart
        HomeAwayBars.tsx                # Horizontal comparison bars for home/away splits
        MinutesDistribution.tsx         # Horizontal bars for player minutes
      actions.ts                        # Server actions for all team detail data
  lib/
    teams/                              # NEW: Team query layer
      queries.ts                        # Database queries for team data
```

### Pattern 1: Server Component Page with Client Tab Navigation
**What:** The page at `/teams/[slug]` is a server component that fetches initial data and resolves metadata. Tab switching is handled client-side with Radix Tabs + nuqs. Each tab's content is loaded via server actions when the tab becomes active.
**When to use:** Team detail page.
**Example:**
```typescript
// app/teams/[slug]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ThemeBackground } from '@/components/ThemeBackground';
import { TeamHero } from '@/components/team-detail/TeamHero';
import { TeamTabs } from '@/components/team-detail/TeamTabs';
import { fetchTeamBySlug } from '@/components/team-detail/actions';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const team = await fetchTeamBySlug(slug);
  if (!team) return { title: 'Team Not Found | KickData' };
  return { title: `${team.name} | KickData` };
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const team = await fetchTeamBySlug(slug);
  if (!team) return notFound();

  return (
    <>
      <ThemeBackground theme={team.leagueSlug} />
      <div className="min-h-screen">
        <TeamHero team={team} />
        <TeamTabs teamId={team.id} leagueId={team.leagueId} season={team.season} />
      </div>
    </>
  );
}
```
**Source:** Established pattern from `app/matches/[id]/page.tsx`.

### Pattern 2: Tab Content Lazy Loading via Server Actions
**What:** Each tab panel fetches its data when mounted. The Overview tab loads on initial render; Performance, Squad, and Fixtures tabs load data when the user switches to them. This avoids one massive query loading all data upfront.
**When to use:** Any tab that has substantial data to fetch.
**Example:**
```typescript
// components/team-detail/TeamTabs.tsx (client component)
'use client';
import * as Tabs from '@radix-ui/react-tabs';
import { parseAsStringEnum, useQueryState } from 'nuqs';

const TAB_VALUES = ['overview', 'performance', 'squad', 'fixtures'] as const;

export function TeamTabs({ teamId, leagueId, season }: Props) {
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum([...TAB_VALUES]).withDefault('overview')
  );

  return (
    <Tabs.Root value={tab} onValueChange={(v) => setTab(v as typeof TAB_VALUES[number])}>
      <Tabs.List>{/* tab triggers */}</Tabs.List>
      <Tabs.Content value="overview">
        <OverviewTab teamId={teamId} leagueId={leagueId} season={season} />
      </Tabs.Content>
      <Tabs.Content value="performance">
        <PerformanceTab teamId={teamId} leagueId={leagueId} season={season} />
      </Tabs.Content>
      {/* ... */}
    </Tabs.Root>
  );
}
```
**Source:** Established in `ResultsFixturesTabs.tsx` + `MatchListClient.tsx` pattern.

### Pattern 3: Aggregate Player Stats from fixture_events
**What:** Player goals, assists, and cards are derived by counting `fixture_events` rows grouped by playerId and event type. Minutes data is not stored in the current schema, so a proxy (appearances count from events) or a note about data limitations is used.
**When to use:** Squad tab top scorers, top assisters, cards received.
**Example:**
```typescript
// lib/teams/queries.ts
import { eq, and, sql, inArray } from 'drizzle-orm';

export async function getTeamPlayerStats(teamId: number, leagueId: number, season: string) {
  // Get all fixture IDs for this team in this season
  const teamFixtureIds = await getDb()
    .select({ id: fixtures.id })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.season, season),
        eq(fixtures.status, 'finished'),
        or(eq(fixtures.homeTeamId, teamId), eq(fixtures.awayTeamId, teamId))
      )
    );

  const fixtureIds = teamFixtureIds.map(f => f.id);
  if (fixtureIds.length === 0) return [];

  // Aggregate goals, assists, cards per player
  const stats = await getDb()
    .select({
      playerId: fixtureEvents.playerId,
      playerName: players.name,
      position: players.position,
      photoUrl: players.photoUrl,
      goals: sql<number>`SUM(CASE WHEN ${fixtureEvents.type} IN ('goal', 'penalty_scored') AND ${fixtureEvents.teamId} = ${teamId} THEN 1 ELSE 0 END)`,
      assists: sql<number>`COUNT(CASE WHEN ${fixtureEvents.type} IN ('goal', 'penalty_scored') AND ${fixtureEvents.assistPlayerId} = ${fixtureEvents.playerId} THEN 1 END)`,
      yellowCards: sql<number>`SUM(CASE WHEN ${fixtureEvents.type} = 'yellow_card' THEN 1 ELSE 0 END)`,
      redCards: sql<number>`SUM(CASE WHEN ${fixtureEvents.type} = 'red_card' THEN 1 ELSE 0 END)`,
    })
    .from(fixtureEvents)
    .innerJoin(players, eq(fixtureEvents.playerId, players.id))
    .where(
      and(
        inArray(fixtureEvents.fixtureId, fixtureIds),
        eq(fixtureEvents.teamId, teamId)
      )
    )
    .groupBy(fixtureEvents.playerId, players.name, players.position, players.photoUrl);

  return stats;
}
```
**Source:** Drizzle ORM aggregation pattern with raw SQL expressions.

### Pattern 4: Bump Chart as Multi-Line LineChart
**What:** A bump chart showing position over time for the team and its rivals. Uses Recharts `LineChart` with multiple `Line` components, reversed Y-axis (position 1 at top), and `type="bump"` or `type="monotone"` interpolation.
**When to use:** Overview tab position-over-time chart.
**Example:**
```typescript
// components/team-detail/charts/BumpChart.tsx
'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface BumpChartProps {
  data: Array<{ matchweek: number; [teamName: string]: number }>;
  focusTeam: string;
  rivalTeams: string[];
}

export function BumpChart({ data, focusTeam, rivalTeams }: BumpChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <XAxis dataKey="matchweek" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
        <YAxis
          reversed
          domain={[1, 'dataMax']}
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
        />
        <Tooltip />
        {/* Rival teams: thin, low opacity lines */}
        {rivalTeams.map((team) => (
          <Line
            key={team}
            type="monotone"
            dataKey={team}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1}
            dot={false}
          />
        ))}
        {/* Focus team: thick, prominent line */}
        <Line
          type="monotone"
          dataKey={focusTeam}
          stroke="#22c55e"
          strokeWidth={3}
          dot={{ r: 3, fill: '#22c55e' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```
**Source:** Recharts LineChart API, established Sparkline pattern in codebase.

### Anti-Patterns to Avoid
- **Loading all tab data on initial page load:** Each tab should lazy-load its data when activated. The overview tab loads on mount; other tabs load on first visit. This keeps the initial page load fast.
- **N+1 queries for player stats:** Do NOT loop through each player to count their goals. Use a single GROUP BY aggregation query.
- **Using a separate charting library for the bump chart:** Recharts is already in the project. A multi-line LineChart with reversed Y-axis IS a bump chart. Do not add @nivo/bump.
- **Storing derived stats in a new table:** For this phase, aggregating from fixture_events in SQL is fast enough and avoids schema migration. The event count for a team in a season is ~500-1000 rows.
- **Fetching all teams' position history for the bump chart:** Only fetch positions for the focus team plus ~5-8 nearby rivals (teams within +/- 3 positions of the focus team at the latest matchweek). This keeps the chart readable and the query efficient.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bump chart visualization | Custom SVG path rendering | Recharts `LineChart` with multiple `Line` components + reversed Y-axis | Recharts handles SVG, animation, tooltips, responsive sizing. The Sparkline component already demonstrates this pattern. |
| Tab navigation with URL persistence | Custom tab switcher with history API | Radix Tabs + nuqs `parseAsStringEnum` | Already in the project twice (league tabs, results/fixtures tabs). Handles accessibility, keyboard nav, URL sync. |
| Grouped bar chart | Custom SVG bars | Recharts `BarChart` with multiple `Bar` components (no stackId) | Side-by-side bars for scored vs conceded per period. Recharts handles axis, tooltip, responsive layout. |
| Home/away comparison bars | Recharts horizontal chart | Pure CSS percentage-width bars (same as ComparativeStats) | These are simple split bars, not data charts. The `ComparativeStats` component pattern already handles this. |
| Fixture difficulty colouring | Complex algorithm with form + position + xG | Simple position-based tiers from standings | Position 1-6 = hard (red), 7-14 = medium (amber), 15-20 = easy (green). Simple, intuitive, data already available. |
| Minutes distribution bars | Recharts horizontal bar chart | Pure CSS horizontal bars with percentage widths | Simple horizontal bars showing % of total minutes. CSS is simpler and lighter for this use case. |

**Key insight:** The project already has Recharts for real charts and CSS patterns for simple bars. Use the right tool for each: Recharts for interactive/complex charts (bump chart, bar chart, line chart), CSS for simple proportional bars (home/away splits, minutes distribution).

## Common Pitfalls

### Pitfall 1: Player Stats Missing Minutes Data
**What goes wrong:** The `players` table has no season stats. The `fixture_events` table records goals, cards, and substitutions with player IDs, but does NOT track minutes played per player per fixture. There is no `fixture_players` table with per-game minutes data.
**Why it happens:** The seed script fetches squad data (roster) and fixture events, but does not persist the per-player fixture statistics (which include minutes) from the detailed fixture API response.
**How to avoid:** For the Squad tab, aggregate what IS available: goals (from goal events where playerId matches), assists (from goal events where assistPlayerId matches), yellow/red cards (from card events). For minutes distribution, use a proxy: count distinct fixture appearances from events (number of fixtures where the player has at least one event) OR acknowledge the limitation and show "N/A" or "Appearances" instead of actual minutes. A future phase could add a `player_fixture_stats` table.
**Warning signs:** Attempting to query a non-existent minutes column, or getting zero results from a minutes query.

### Pitfall 2: Assist Counting Complexity
**What goes wrong:** Assists are stored on the GOAL event row as `assistPlayerId`, not as a separate "assist" event type. A naive query filtering `fixtureEvents.type = 'assist'` returns zero results.
**Why it happens:** The API-Football event model stores assists as a property of the goal event, and the seed script preserves this structure.
**How to avoid:** To count assists for a player, count goal events (type = 'goal' or 'penalty_scored') WHERE `assistPlayerId = player.id`. This is a different aggregation path than goals (which use `playerId`).
**Warning signs:** All players showing 0 assists, or assists not appearing in the squad tab.

### Pitfall 3: Bump Chart Performance with All Teams
**What goes wrong:** Fetching position history for all 20 teams across all matchweeks creates a dense, unreadable chart with 20 overlapping lines.
**Why it happens:** The CONTEXT.md says "shows team's position relative to rivals crossing paths over the season" -- this implies selective display, not all teams.
**How to avoid:** Select the focus team plus 5-8 rival teams. Rivals = teams within +/- 3 positions of the focus team at the latest matchweek. This shows meaningful competition context without clutter. Use low-opacity thin lines for rivals and a thick highlighted line for the focus team.
**Warning signs:** Chart becoming unreadable, slow rendering with many Line components.

### Pitfall 4: Cumulative xG Data Availability
**What goes wrong:** Not all leagues have xG data. The `league_config` table has a `hasXg` boolean flag. Attempting to show xG charts for leagues without xG data shows empty/broken charts.
**Why it happens:** Only certain leagues in the API-Football coverage include expected goals data.
**How to avoid:** Check `leagueConfig.hasXg` before rendering xG-related components. If false, hide the xG section or show "xG data not available for this league." The fixture_stats rows will have `xg: null` for leagues without coverage.
**Warning signs:** Charts with all-zero or null xG values, empty chart containers.

### Pitfall 5: Goals-by-Period Requires Minute Bucketing
**What goes wrong:** Goal events have a `minute` field (0-90+). Bucketing into 15-minute periods (0-15, 16-30, 31-45, 46-60, 61-75, 76-90) requires careful SQL or JS grouping. Extra-time goals (90+) need special handling.
**Why it happens:** The minute field is a raw integer, not pre-bucketed.
**How to avoid:** Use SQL CASE expressions or post-query JS to bucket: `Math.min(Math.floor((minute - 1) / 15), 5)` maps minutes 1-90 into 6 buckets (indices 0-5). Goals with minute > 90 go into the last bucket (76-90+). Count both goals scored BY the team and goals conceded BY the team (opponent scored) for the grouped bar chart.
**Warning signs:** Missing the 0-15 period, putting 90+ goals in a 7th bucket, or miscounting scored vs conceded.

### Pitfall 6: Scoring-First Record Requires Per-Fixture Analysis
**What goes wrong:** The "scoring-first win/draw/loss record" requires knowing which team scored first in each fixture, then checking the final result. This is not a simple aggregate.
**Why it happens:** No pre-computed "first scorer" field exists. It must be derived from the earliest goal event per fixture.
**How to avoid:** For each finished fixture involving the team: find the earliest goal event (MIN minute), check if the goal was scored by the team (teamId matches) or against them. Then cross-reference with the fixture's final score to determine if the team won, drew, or lost. Group results by "scored first" vs "conceded first" vs "0-0 draw".
**Warning signs:** Complex nested queries, forgetting own goals (which count as the opposing team scoring), ignoring fixtures where neither team scores first (0-0).

### Pitfall 7: Team Page Link Integration
**What goes wrong:** Building the team detail page but forgetting to add clickable links to it from existing pages (league table rows, match cards, match detail pages).
**Why it happens:** Focusing on the new page in isolation without updating existing components.
**How to avoid:** Team names in the league table `TableRow`, match cards `MatchCard`/`MatchCardExpanded`, and match detail `ScoreHero` should become `<Link href={/teams/${team.slug}>` elements. The `teams` table already has a `slug` column. This requires knowing the team slug in each component -- add it to existing queries that return team data.
**Warning signs:** Beautiful team page that no one can navigate to.

## Code Examples

### Query: Team by Slug with League Context
```typescript
// lib/teams/queries.ts
import { eq, and, max } from 'drizzle-orm';
import { getDb } from '@/db/connection';
import { teams, leagues, leagueConfig, standings } from '@/db/schema';

export async function getTeamBySlug(slug: string) {
  const rows = await getDb()
    .select({
      id: teams.id,
      apiId: teams.apiId,
      name: teams.name,
      shortName: teams.shortName,
      slug: teams.slug,
      logoUrl: teams.logoUrl,
      stadiumName: teams.stadiumName,
      leagueId: teams.leagueId,
      leagueSlug: leagues.slug,
      leagueName: leagues.name,
      currentSeason: leagues.currentSeason,
    })
    .from(teams)
    .innerJoin(leagues, eq(teams.leagueId, leagues.id))
    .where(eq(teams.slug, slug))
    .limit(1);

  return rows[0] ?? null;
}
```

### Query: Position History for Bump Chart
```typescript
// lib/teams/queries.ts
export async function getPositionHistory(
  leagueId: number,
  season: string,
  teamIds: number[]  // Focus team + rivals
) {
  const rows = await getDb()
    .select({
      matchweek: standings.matchweek,
      teamId: standings.teamId,
      teamName: teams.name,
      position: standings.position,
    })
    .from(standings)
    .innerJoin(teams, eq(standings.teamId, teams.id))
    .where(
      and(
        eq(standings.leagueId, leagueId),
        eq(standings.season, season),
        inArray(standings.teamId, teamIds)
      )
    )
    .orderBy(asc(standings.matchweek));

  // Transform to chart data format: [{ matchweek: 1, "Arsenal": 1, "Chelsea": 3, ... }]
  const chartData: Record<number, Record<string, number>> = {};
  for (const row of rows) {
    if (!chartData[row.matchweek]) {
      chartData[row.matchweek] = { matchweek: row.matchweek };
    }
    chartData[row.matchweek][row.teamName] = row.position;
  }
  return Object.values(chartData);
}
```

### Query: Goals by 15-Minute Period
```typescript
// lib/teams/queries.ts
export async function getGoalsByPeriod(
  teamId: number,
  leagueId: number,
  season: string
) {
  // Get all finished fixtures for this team
  const teamFixtures = await getDb()
    .select({ id: fixtures.id, homeTeamId: fixtures.homeTeamId })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.season, season),
        eq(fixtures.status, 'finished'),
        or(eq(fixtures.homeTeamId, teamId), eq(fixtures.awayTeamId, teamId))
      )
    );

  const fixtureIds = teamFixtures.map(f => f.id);
  if (fixtureIds.length === 0) return [];

  // Get all goal events from these fixtures
  const goals = await getDb()
    .select({
      minute: fixtureEvents.minute,
      teamId: fixtureEvents.teamId,
      type: fixtureEvents.type,
    })
    .from(fixtureEvents)
    .where(
      and(
        inArray(fixtureEvents.fixtureId, fixtureIds),
        inArray(fixtureEvents.type, ['goal', 'own_goal', 'penalty_scored'])
      )
    );

  // Bucket into 15-minute periods
  const periods = ['0-15', '16-30', '31-45', '46-60', '61-75', '76-90+'];
  const buckets = periods.map((label) => ({ period: label, scored: 0, conceded: 0 }));

  for (const goal of goals) {
    const bucketIndex = Math.min(Math.floor((goal.minute - 1) / 15), 5);
    const isOwnGoal = goal.type === 'own_goal';

    if (isOwnGoal) {
      // Own goals: teamId is the team that conceded
      if (goal.teamId === teamId) {
        buckets[bucketIndex].conceded++;
      } else {
        buckets[bucketIndex].scored++;
      }
    } else {
      // Regular/penalty goals
      if (goal.teamId === teamId) {
        buckets[bucketIndex].scored++;
      } else {
        buckets[bucketIndex].conceded++;
      }
    }
  }

  return buckets;
}
```

### Query: Cumulative xG Over Season
```typescript
// lib/teams/queries.ts
export async function getCumulativeXg(
  teamId: number,
  leagueId: number,
  season: string
) {
  const rows = await getDb()
    .select({
      matchweek: fixtures.matchweek,
      xg: fixtureStats.xg,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
      homeTeamId: fixtures.homeTeamId,
    })
    .from(fixtureStats)
    .innerJoin(fixtures, eq(fixtureStats.fixtureId, fixtures.id))
    .where(
      and(
        eq(fixtureStats.teamId, teamId),
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.season, season),
        eq(fixtures.status, 'finished')
      )
    )
    .orderBy(asc(fixtures.matchweek));

  let cumulativeXg = 0;
  let cumulativeGoals = 0;

  return rows.map(row => {
    cumulativeXg += row.xg ?? 0;
    const goalsThisGame = row.homeTeamId === teamId ? (row.homeScore ?? 0) : (row.awayScore ?? 0);
    cumulativeGoals += goalsThisGame;

    return {
      matchweek: row.matchweek,
      cumulativeXg: Math.round(cumulativeXg * 100) / 100,
      cumulativeGoals,
    };
  });
}
```

### Query: Player Stats Aggregation
```typescript
// lib/teams/queries.ts
export async function getPlayerStats(teamId: number, leagueId: number, season: string) {
  const teamFixtures = await getDb()
    .select({ id: fixtures.id })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.season, season),
        eq(fixtures.status, 'finished'),
        or(eq(fixtures.homeTeamId, teamId), eq(fixtures.awayTeamId, teamId))
      )
    );

  const fixtureIds = teamFixtures.map(f => f.id);
  if (fixtureIds.length === 0) return [];

  // Count goals scored by each player (goals + penalty_scored where teamId = our team)
  // Count assists (assistPlayerId on goal events for our team)
  // Count cards per player
  // Uses two queries: one for scorers/cards, one for assists

  const scorersAndCards = await getDb()
    .select({
      playerId: fixtureEvents.playerId,
      goals: sql<number>`SUM(CASE WHEN ${fixtureEvents.type} IN ('goal', 'penalty_scored') THEN 1 ELSE 0 END)`.as('goals'),
      yellowCards: sql<number>`SUM(CASE WHEN ${fixtureEvents.type} = 'yellow_card' THEN 1 ELSE 0 END)`.as('yellow_cards'),
      redCards: sql<number>`SUM(CASE WHEN ${fixtureEvents.type} = 'red_card' THEN 1 ELSE 0 END)`.as('red_cards'),
      appearances: sql<number>`COUNT(DISTINCT ${fixtureEvents.fixtureId})`.as('appearances'),
    })
    .from(fixtureEvents)
    .where(
      and(
        inArray(fixtureEvents.fixtureId, fixtureIds),
        eq(fixtureEvents.teamId, teamId),
        sql`${fixtureEvents.playerId} IS NOT NULL`
      )
    )
    .groupBy(fixtureEvents.playerId);

  const assists = await getDb()
    .select({
      assistPlayerId: fixtureEvents.assistPlayerId,
      assists: sql<number>`COUNT(*)`.as('assists'),
    })
    .from(fixtureEvents)
    .where(
      and(
        inArray(fixtureEvents.fixtureId, fixtureIds),
        eq(fixtureEvents.teamId, teamId),
        inArray(fixtureEvents.type, ['goal', 'penalty_scored']),
        sql`${fixtureEvents.assistPlayerId} IS NOT NULL`
      )
    )
    .groupBy(fixtureEvents.assistPlayerId);

  // Merge and join with player names
  // ... (merge scorersAndCards + assists by playerId, join with players table)
}
```

### Grouped Bar Chart: Goals by Period
```tsx
// components/team-detail/charts/GoalsByPeriodChart.tsx
'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface GoalsByPeriodChartProps {
  data: Array<{ period: string; scored: number; conceded: number }>;
}

export function GoalsByPeriodChart({ data }: GoalsByPeriodChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="period" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="scored" fill="#22c55e" name="Scored" />
        <Bar dataKey="conceded" fill="#ef4444" name="Conceded" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### Fixture Difficulty Colouring
```typescript
// Determine difficulty tier from opponent's league position
function getDifficultyColor(opponentPosition: number, totalTeams: number = 20): string {
  const topTier = Math.ceil(totalTeams * 0.3);    // positions 1-6
  const midTier = Math.ceil(totalTeams * 0.7);    // positions 7-14
  // Bottom tier: 15-20

  if (opponentPosition <= topTier) return 'bg-red-500/20 border-red-500/40';     // Hard
  if (opponentPosition <= midTier) return 'bg-amber-500/20 border-amber-500/40'; // Medium
  return 'bg-green-500/20 border-green-500/40';                                   // Easy
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Dedicated @nivo/bump for bump charts | Recharts `LineChart` with reversed Y-axis and multiple `Line` components | Recharts 3.0 (custom components, z-index control) | No additional dependency needed |
| Separate player stats table | Aggregate from fixture_events via SQL GROUP BY | N/A (project-specific) | No schema migration needed |
| Client-side data computation for charts | Server actions return chart-ready data | Established in project | Keeps client bundles lean, heavy computation server-side |

**Deprecated/outdated:**
- Recharts `<Customized />` wrapper: No longer needed in Recharts 3.0. Custom components render directly inside chart containers.
- Synchronous `params` in page components: Must `await params` in Next.js 16.

## Existing Codebase Assets

### Database Tables and Indexes (Ready to Query)
| Table | Key Fields | Relevant For |
|-------|-----------|-------------|
| `teams` | id, slug, name, shortName, logoUrl, stadiumName, leagueId | Hero section, navigation links |
| `standings` | teamId, leagueId, season, matchweek, position, points, form, homeWon/homeDrawn/homeLost/homeGoalsFor/homeGoalsAgainst, awayWon/... | Overview (bump chart, cumulative points, form), Performance (home/away splits) |
| `fixtures` | id, leagueId, season, matchweek, homeTeamId, awayTeamId, kickoff, status, homeScore, awayScore | Fixtures tab, derived stats |
| `fixture_events` | fixtureId, type, minute, teamId, playerId, assistPlayerId | Goals by period, player stats, scoring-first record |
| `fixture_stats` | fixtureId, teamId, xg | Cumulative xG chart |
| `players` | id, name, position, photoUrl, teamId | Squad tab player display |
| `league_config` | hasXg, hasPlayerStats | Conditional rendering of xG and player sections |

### Existing Components to Reuse
| Component | Location | Reuse For |
|-----------|----------|-----------|
| `FormBadges` | `components/league-table/FormBadges.tsx` | Hero section form dots, overview tab form run |
| `ThemeBackground` | `components/ThemeBackground.tsx` | League-themed background on team page |
| `ComparativeStats` ComparisonRow pattern | `components/match-detail/ComparativeStats.tsx` | Home/away split bars in performance tab |
| `Sparkline` (Recharts LineChart pattern) | `components/league-table/Sparkline.tsx` | Reference for bump chart implementation |
| `ScoreHero` TeamLogo pattern | `components/match-detail/ScoreHero.tsx` | Team logo rendering in hero section |

### Existing Queries to Reuse or Extend
| Query | Location | Adaptation For |
|-------|----------|---------------|
| `getLeagueBySlug` | `lib/standings/queries.ts` | Team page league resolution |
| `getLeagueConfig` | `lib/standings/queries.ts` | Check hasXg, hasPlayerStats flags |
| `getSparklineData` | `lib/standings/queries.ts` | Reference for position history query (extend to multiple teams) |
| `getTeamForm` | `lib/matches/queries.ts` | Hero section form display |
| Double-join with `alias()` | `lib/matches/queries.ts` | Fixture list with opponent team names |
| `getLeagueSlugById` | `components/match-detail/actions.ts` | Theme resolution |

## Open Questions

1. **Minutes Played Data Gap**
   - What we know: The `players` table has no minutes data. The `fixture_events` table does not track minutes played per player per fixture. The detailed fixture API response DOES include per-player minutes, but the seed script does not persist it to the database.
   - What's unclear: Should this phase add a new table/column for player minutes, or work with what's available?
   - Recommendation: Use "appearances" (count of distinct fixtures with events) as a proxy for minutes in this phase. The CONTEXT.md mentions "horizontal bars for minutes distribution" -- show these as appearance-based bars with a label like "Appearances" rather than "Minutes" unless a schema migration is added. A follow-up phase or enhancement can add true minutes tracking. This keeps Phase 4 focused on the page structure and avoids a schema migration.

2. **Odds Data for Upcoming Fixtures**
   - What we know: The CONTEXT.md and success criteria mention "odds" and "win probability bar" for upcoming fixtures. Odds data is not in the current database schema. Phase 7 handles The Odds API integration.
   - What's unclear: Should this phase build the odds/win-probability UI with mock data?
   - Recommendation: Same approach as Phase 3 -- build the fixture row layout with a placeholder for odds/win probability. When odds data becomes available (Phase 7), populate it. Show "Odds available soon" or conditionally render the section when data exists.

3. **Team Slug Availability in Existing Components**
   - What we know: The `teams` table has a `slug` column. Existing components (league table rows, match cards, match detail hero) display team names but do not currently link to team pages and may not have the slug available in their data.
   - What's unclear: How much refactoring of existing queries is needed to add slug to team data?
   - Recommendation: Add `slug` to the team data returned by existing queries (standings queries already join with the teams table; match queries already join teams). Then wrap team names in `<Link href={/teams/${slug}}>`. This is a small incremental change to existing queries, not a rewrite.

4. **Inline Fixture Preview on Hover**
   - What we know: CONTEXT.md says "fixture rows link to match detail pages with inline preview on hover/tap before navigating." This implies a tooltip or popover with match summary.
   - What's unclear: How complex should the preview be? Full score + key events, or just basic info?
   - Recommendation: Use a simple tooltip-style preview showing the score (for past fixtures) or kickoff time (for upcoming), key events summary (scorers), triggered on hover (desktop) or long-press (mobile). Keep it lightweight -- the main interaction is clicking through to the full match detail page.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: All source files in `src/` directory, database schema, existing components, server actions, seed scripts
- [Recharts LineChart API](https://recharts.github.io/en-US/api/LineChart/) - LineChart with multiple Line components
- [Recharts BarChart API](https://recharts.github.io/en-US/examples/) - Grouped bar chart pattern
- [Recharts 3.0 Migration Guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide) - Custom components, z-index, new features
- [Next.js Dynamic Routes Docs](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes) - Async params pattern
- [Radix UI Tabs](https://www.radix-ui.com/primitives/docs/components/tabs) - Tab component API

### Secondary (MEDIUM confidence)
- [Recharts grouped bar chart pattern](https://spin.atomicobject.com/stacked-bar-charts-recharts/) - Multiple `<Bar>` without stackId for side-by-side grouping
- [Recharts simple line chart example](https://recharts.github.io/en-US/examples/SimpleLineChart/) - Multi-line pattern reference

### Tertiary (LOW confidence)
- Training data: Bump chart as multi-line LineChart with reversed Y-axis is a well-established pattern, but no specific authoritative source was found for Recharts 3.x specifically. The existing Sparkline component in the codebase validates this approach with Recharts 3.7.0.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies needed, all libraries already in project
- Architecture: HIGH - Direct extension of Phase 2/3 patterns with clear structure
- Pitfalls: HIGH - Identified from schema analysis, seed script review, and established project patterns
- Code examples: MEDIUM - Aggregation queries are based on schema analysis, not tested against live data. The bump chart pattern is derived from Sparkline + Recharts docs.
- Data availability: MEDIUM - Player minutes gap identified, odds data confirmed unavailable, xG conditionality documented

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (stable stack, no fast-moving dependencies)
