# Phase 12: Site Chrome & Homepage - Research

**Researched:** 2026-02-07
**Domain:** Next.js App Router layout, Drizzle ORM queries, Tailwind CSS component design
**Confidence:** HIGH

## Summary

Phase 12 adds a consistent site header to every page, an engaging homepage with three stat-highlight cards (Top Scorer, Biggest Upset, Form Team), and fixes the hardcoded season year. The codebase is well-structured for all three concerns: the header component already exists and just needs layout-level placement plus the sticky-to-static change; the database schema has all the data needed for stat cards (fixtureEvents for goals, fixtureOdds for upset detection, standings for form); and the `leagues.currentSeason` field already provides the dynamic season year everywhere except one hardcoded `'2025'` in `LeagueTableWrapper.tsx`.

The main architectural decision is where to place the Header component. Currently it's rendered inside each page's client component (`page.tsx`). Moving it to the `[locale]/layout.tsx` server component ensures every page gets it automatically, but the Header is a client component that uses `usePathname`. This is fine -- Next.js App Router supports client components inside server component layouts. The stat cards require three new server action queries and a client component that calls them when the league changes.

**Primary recommendation:** Move Header into `[locale]/layout.tsx`, create three server-action query functions for stat data, build a `StatHighlights` client component that fetches on league change, and replace the one hardcoded `'2025'` with a dynamic season lookup.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Header contains: KickLeague wordmark, matches link (previous results + fixtures), locale switcher
- League navigation is NOT in the header -- separate component concern
- Locale switcher is a dropdown menu
- Header is static (scrolls with page, not sticky)
- No hero section or banner -- stat cards sit directly between header and existing league picker
- Three stat cards in a horizontal row, stacking on mobile
- Stat cards are visually prominent (bold colors, larger text, eye-catching)
- Everything below stat cards (league picker, table) stays as-is
- Three cards: Top Scorer, Biggest Upset, Form Team
- Data is league-specific -- cards update when the user selects a different league
- Rich content per card: stat + context (e.g., player name, team badge, goal count)
- Matches link goes to a single page showing both recent results and upcoming fixtures
- Matches page is league-specific (e.g., /en/premier-league/matches)
- Locale switching preserves current page (EN on /en/premier-league -> ES goes to /es/premier-league)
- Existing league picker behavior unchanged

### Claude's Discretion
- Header mobile adaptation approach
- Biggest Upset calculation method
- Stat card visual design details (spacing, typography, exact styling)
- Loading/error states for stat cards

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

No new libraries are needed. This phase uses entirely existing dependencies.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | App Router layouts, server actions | Already in project |
| next-intl | ^4.8.2 | i18n routing, locale-aware navigation | Already in project |
| drizzle-orm | ^0.45.1 | Database queries for stat data | Already in project |
| tailwindcss | ^4 | Styling for header, stat cards | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | ^2.1.1 | Conditional class names | Stat card active states |
| nuqs | ^2.8.8 | URL query state for league | Already used by useLeague hook |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server actions for stat data | API routes | Server actions are the established pattern in this codebase; API routes would be inconsistent |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Changes to Project Structure
```
src/
├── app/[locale]/
│   ├── layout.tsx           # ADD: Header component here (renders on all pages)
│   └── page.tsx             # MODIFY: Remove Header from here, add StatHighlights
├── components/
│   ├── header/
│   │   └── Header.tsx       # MODIFY: Remove sticky, change to static positioning
│   └── stat-highlights/     # NEW: Stat card components
│       ├── StatHighlights.tsx       # Client component: orchestrates 3 cards
│       ├── StatCard.tsx             # Presentational card component
│       └── actions.ts               # Server actions for stat queries
└── lib/
    └── stats/
        └── queries.ts       # NEW: Database queries for top scorer, upset, form team
```

### Pattern 1: Layout-Level Header (Every Page)
**What:** Move `<Header />` from individual page components into `src/app/[locale]/layout.tsx`
**When to use:** When a component must appear on every page under a route segment
**Why it works here:** The `[locale]/layout.tsx` already wraps all pages. Adding Header here guarantees it appears on the homepage, matches page, team detail page, and any future pages.

**Current state of `[locale]/layout.tsx`:**
```typescript
// Currently just wraps children with providers
export default async function LocaleLayout({ children, params }: Props) {
  // ...locale validation...
  return (
    <html lang={locale}>
      <body className={...}>
        <NextIntlClientProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Target state:**
```typescript
export default async function LocaleLayout({ children, params }: Props) {
  // ...locale validation...
  return (
    <html lang={locale}>
      <body className={...}>
        <NextIntlClientProvider>
          <NuqsAdapter>
            <Header />
            {children}
          </NuqsAdapter>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Critical detail:** The `<Header />` is a `'use client'` component. This is perfectly fine inside a server component layout in Next.js App Router -- the server component renders the client component boundary, and the client component hydrates on the client.

**Confidence:** HIGH -- verified from existing codebase patterns (Header is already used as a client component inside pages)

### Pattern 2: League-Reactive Data Fetching for Stat Cards
**What:** Use `useEffect` triggered by league changes to call server actions, similar to the existing `LeagueTableWrapper` and `MatchPreviewSection` patterns.
**When to use:** When data must update client-side based on URL query state.

**Existing pattern in the codebase (`MatchPreviewSection.tsx`):**
```typescript
// This is the established pattern for league-reactive data loading
const { league } = useLeague();
const [data, setData] = useState<DataType[]>([]);
const [isPending, startTransition] = useTransition();

useEffect(() => {
  startTransition(async () => {
    const result = await fetchSomeData(league);
    setData(result);
  });
}, [league]);
```

The StatHighlights component should follow this exact pattern:
- Call `useLeague()` to get the current league slug
- `useEffect` on league changes to call a server action
- Display skeleton/loading state during transitions
- Render stat cards with fetched data

**Confidence:** HIGH -- directly observed in `src/components/matches/MatchPreviewSection.tsx` lines 208-237

### Pattern 3: Server Action Query Pattern
**What:** All data queries in this codebase use the `'use server'` action pattern
**When to use:** For fetching data from the database in response to client-side events.

**Established pattern:**
```typescript
// src/components/some-feature/actions.ts
'use server';

import { getDb, isDatabaseConfigured } from '@/db/connection';
import { someTable } from '@/db/schema';

export async function fetchSomeData(leagueSlug: string) {
  if (!isDatabaseConfigured()) return { data: null, error: 'database_not_configured' };

  const league = await getLeagueBySlug(leagueSlug);
  if (!league) return { data: null, error: 'league_not_found' };

  // Query using league.currentSeason for dynamic season
  const result = await getDb().select(...).from(...).where(...);
  return { data: result };
}
```

**Confidence:** HIGH -- this exact pattern is used in `src/components/league-table/actions.ts`, `src/components/matches/actions.ts`, `src/components/match-detail/actions.ts`

### Anti-Patterns to Avoid
- **Rendering Header inside each page:** Duplicates code, pages can forget to include it, inconsistent behavior. Move to layout instead.
- **Using API routes for stat card data:** The codebase consistently uses server actions (`'use server'`), not API routes, for data fetching from components. API routes are only used for cron jobs and polling endpoints.
- **Fetching all stat data in the layout (server-side):** The league is stored in URL query state (`?league=premier-league`) which is only known client-side. The layout renders server-side before query params are available, so stat data must be fetched client-side on league change.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Locale-preserving navigation | Custom URL rewriting | `router.replace(pathname, { locale: newLocale })` from `@/i18n/navigation` | Already implemented in `LanguagePicker.tsx` -- locale switching preserving current page is a built-in feature of next-intl |
| League state management | Custom context/store | `useLeague()` hook from `@/lib/hooks/use-league.ts` | Already uses `nuqs` for URL-synced query state |
| Season year resolution | Hardcoded year strings | `league.currentSeason` from leagues table | The `leagues` table already stores `currentSeason` per league |

**Key insight:** Almost everything needed for this phase already exists in the codebase. The work is primarily wiring existing patterns together and writing three new database queries.

## Common Pitfalls

### Pitfall 1: Sticky Header Offset Cascade
**What goes wrong:** The current Header is `sticky top-0 z-20`, and the LeagueTabs bar is `sticky top-[49px] z-10` (positioned below the header). If the Header becomes static (non-sticky), the `top-[49px]` offset on LeagueTabs becomes wrong -- it would leave a 49px gap at the top when the header scrolls away.
**Why it happens:** The `49px` offset is the exact height of the sticky header. With a static header, LeagueTabs should stick to `top-0`.
**How to avoid:** When changing Header from `sticky` to static, also update all `top-[49px]` references to `top-0`. There are exactly 2 occurrences:
  - `src/app/[locale]/page.tsx` line 40
  - `src/app/[locale]/matches/page.tsx` line 18
**Warning signs:** Large gap above the league tabs when scrolling down the page.

### Pitfall 2: Duplicate Header Rendering
**What goes wrong:** After moving Header to layout, forgetting to remove it from individual pages results in two headers.
**Why it happens:** Header is currently rendered inside `HomeContent()` in `page.tsx` and `MatchesContent()` in `matches/page.tsx`.
**How to avoid:** Search for all `<Header />` usages and remove from individual pages after adding to layout. Current locations:
  - `src/app/[locale]/page.tsx` line 39 (inside `HomeContent`)
  - `src/app/[locale]/matches/page.tsx` line 17 (inside `MatchesContent`)
**Warning signs:** Two headers visible on any page.

### Pitfall 3: Missing Header on Match Detail and Team Detail Pages
**What goes wrong:** The match detail page (`/matches/[id]`) and team detail page (`/teams/[slug]`) are server components that currently don't render a Header at all.
**Why it happens:** These pages were built before the Header component existed or before it was standardized.
**How to avoid:** Moving Header to layout automatically fixes this -- no extra work needed.
**Warning signs:** N/A -- the layout approach prevents this entirely.

### Pitfall 4: Serialization Issues in Server Actions
**What goes wrong:** Returning `Date` objects or `Map` instances from server actions causes serialization errors.
**Why it happens:** Server actions serialize return values via JSON-like protocol. Complex types aren't supported.
**How to avoid:** Follow existing pattern: convert Dates to ISO strings, Maps to plain objects, before returning from server actions. See `src/components/matches/actions.ts` for examples.
**Warning signs:** Runtime error: "Only plain objects can be passed to Client Components from Server Components".

### Pitfall 5: Matches Page Route Change
**What goes wrong:** The context says matches page should be league-specific (e.g., `/en/premier-league/matches`) but the current route is `/en/matches`.
**Why it happens:** The current URL structure uses query params for league (`?league=premier-league`), not path segments.
**How to avoid:** The existing matches page at `/en/matches` already uses `useLeague()` which reads the `?league=` query param. The "league-specific" requirement from context is already satisfied via query params -- the URL effectively becomes `/en/matches?league=premier-league`. No route restructuring is needed since the league context travels via query string. The matches Link in the header should continue pointing to `/matches` which will inherit the current league query param.
**Warning signs:** Breaking existing routes by adding unnecessary path segments.

## Code Examples

### Top Scorer Query
**Source:** Derived from existing schema analysis of `fixtureEvents` and `players` tables

The `fixtureEvents` table records every goal event with `type = 'goal'` or `type = 'penalty_scored'`, linked to a `playerId`. Counting goals per player for a league's current season yields the top scorer.

```typescript
// src/lib/stats/queries.ts
import { eq, and, sql, desc, count } from 'drizzle-orm';
import { getDb } from '@/db/connection';
import { fixtureEvents, fixtures, players, teams } from '@/db/schema';

export async function getTopScorer(leagueId: number, season: string) {
  const db = getDb();

  const result = await db
    .select({
      playerId: fixtureEvents.playerId,
      playerName: players.name,
      teamId: teams.id,
      teamName: teams.name,
      teamLogoUrl: teams.logoUrl,
      goalCount: count(fixtureEvents.id).as('goal_count'),
    })
    .from(fixtureEvents)
    .innerJoin(fixtures, eq(fixtureEvents.fixtureId, fixtures.id))
    .innerJoin(players, eq(fixtureEvents.playerId, players.id))
    .innerJoin(teams, eq(players.teamId, teams.id))
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.season, season),
        sql`${fixtureEvents.type} IN ('goal', 'penalty_scored')`
      )
    )
    .groupBy(
      fixtureEvents.playerId,
      players.name,
      teams.id,
      teams.name,
      teams.logoUrl
    )
    .orderBy(desc(sql`goal_count`))
    .limit(1);

  return result[0] ?? null;
}
```

**Confidence:** HIGH -- uses existing tables and established query patterns from `src/lib/matches/queries.ts`

### Biggest Upset Query (Odds-Based Approach -- Recommended)
**Source:** Derived from existing `fixtureOdds` and `fixtures` schema

An "upset" is when the team with the highest odds (biggest underdog) wins. The `fixtureOdds` table stores pre-match odds per bookmaker. The magnitude of the upset is the winning team's odds -- higher odds = bigger upset.

```typescript
export async function getBiggestUpset(leagueId: number, season: string) {
  const db = getDb();

  // Find finished matches where the underdog won, ranked by the underdog's odds
  // Use the max odds across bookmakers for the winning side as the upset magnitude
  const result = await db
    .select({
      fixtureId: fixtures.id,
      homeTeamId: fixtures.homeTeamId,
      awayTeamId: fixtures.awayTeamId,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
      matchweek: fixtures.matchweek,
      // Average home odds and away odds across bookmakers for this fixture
      avgHomeOdds: sql<number>`AVG(${fixtureOdds.homeOdds})`.as('avg_home_odds'),
      avgAwayOdds: sql<number>`AVG(${fixtureOdds.awayOdds})`.as('avg_away_odds'),
    })
    .from(fixtures)
    .innerJoin(fixtureOdds, eq(fixtureOdds.fixtureId, fixtures.id))
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.season, season),
        eq(fixtures.status, 'finished'),
        // Only include decisive results (not draws)
        sql`${fixtures.homeScore} != ${fixtures.awayScore}`
      )
    )
    .groupBy(
      fixtures.id,
      fixtures.homeTeamId,
      fixtures.awayTeamId,
      fixtures.homeScore,
      fixtures.awayScore,
      fixtures.matchweek
    )
    .orderBy(
      // Order by the winning side's average odds (descending = biggest upset first)
      desc(sql`CASE
        WHEN ${fixtures.homeScore} > ${fixtures.awayScore} THEN AVG(${fixtureOdds.homeOdds})
        ELSE AVG(${fixtureOdds.awayOdds})
      END`)
    )
    .limit(1);

  if (!result[0]) return null;

  // Enrich with team details
  // ... (fetch team names, logos, etc.)
}
```

**Why odds-based over position-based:** The codebase already has comprehensive odds data in `fixtureOdds` (populated by the refresh-odds pipeline). Odds capture real-world expectations far more accurately than league position alone. A mid-table team beating the leader is less of an upset than a relegation-threatened team beating anyone at 10/1 odds. The odds data is readily available per fixture per bookmaker.

**Fallback consideration:** Some completed fixtures may lack odds data (if odds weren't captured before the match). The query naturally excludes these since the INNER JOIN on `fixtureOdds` filters them out. If no fixtures have odds, the query returns null and the card can show a "No data yet" state.

**Confidence:** HIGH for the approach, MEDIUM for the exact SQL (may need refinement during implementation)

### Form Team Query
**Source:** Derived from existing `standings.form` column

The `standings` table already stores a `form` varchar (e.g., "WWWWW") per team per matchweek. The "Form Team" is the team with the best current form. Count wins (W) in the form string, then use draws (D) as tiebreaker.

```typescript
export async function getFormTeam(leagueId: number, season: string) {
  const db = getDb();

  // Get latest matchweek
  const maxWeekResult = await db
    .select({ maxWeek: sql<number>`MAX(${standings.matchweek})` })
    .from(standings)
    .where(
      and(eq(standings.leagueId, leagueId), eq(standings.season, season))
    );

  const maxWeek = maxWeekResult[0]?.maxWeek;
  if (!maxWeek) return null;

  // Get all teams' form at the latest matchweek, scored by wins then draws
  const result = await db
    .select({
      teamId: standings.teamId,
      teamName: teams.name,
      teamLogoUrl: teams.logoUrl,
      form: standings.form,
      position: standings.position,
      points: standings.points,
    })
    .from(standings)
    .innerJoin(teams, eq(standings.teamId, teams.id))
    .where(
      and(
        eq(standings.leagueId, leagueId),
        eq(standings.season, season),
        eq(standings.matchweek, maxWeek)
      )
    )
    .orderBy(
      // Score form: W=3, D=1, L=0 (using character counting)
      desc(sql`
        (LENGTH(${standings.form}) - LENGTH(REPLACE(${standings.form}, 'W', ''))) * 3 +
        (LENGTH(${standings.form}) - LENGTH(REPLACE(${standings.form}, 'D', '')))
      `)
    )
    .limit(1);

  return result[0] ?? null;
}
```

**Confidence:** HIGH -- the `standings.form` column is already populated and used by existing components (FormBadges, FormGuide). The scoring formula (W=3, D=1) mirrors football points.

### Dynamic Season Fix
**Source:** Direct observation in codebase

The only hardcoded `'2025'` is in `src/components/league-table/LeagueTableWrapper.tsx` line 40:
```typescript
const { lastUpdated } = usePolling({
  leagueSlug: league,
  season: '2025',  // <-- This is the hardcoded value
  onUpdate: () => setRefreshKey((k) => k + 1),
  enabled: !isHistorical,
});
```

**Fix approach:** The `LeagueTableWrapper` already calls `fetchMatchweekList(league)` which internally calls `getMatchweekList` which resolves `league.currentSeason`. Expose the season from this call and pass it to `usePolling`. Alternatively, add a dedicated server action to fetch the current season for a league.

The `usePolling` hook calls `/api/updates/check?leagueSlug=...&season=...`. The API route uses the season parameter to query standings. So passing the dynamic season from the leagues table fixes the entire chain.

**Confidence:** HIGH -- verified all references to `'2025'` in the `src/` directory (only 1 match in component code)

### Header Static Positioning Change
**Source:** Direct observation in `src/components/header/Header.tsx`

```typescript
// Current (line 11):
<header className="sticky top-0 z-20 border-b border-white/10 bg-black/20 backdrop-blur-md">

// Target:
<header className="border-b border-white/10 bg-black/20 backdrop-blur-md">
```

And update league tabs offset in both pages:
```typescript
// Current (pages that use top-[49px]):
<div className="sticky top-[49px] z-10 ...">

// Target (header no longer sticky, tabs stick to top):
<div className="sticky top-0 z-10 ...">
```

**Confidence:** HIGH -- directly observed CSS classes

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-page Header rendering | Layout-level Header rendering | This phase | Guarantees header on every page |
| Sticky header + offset league tabs | Static header + `top-0` league tabs | This phase | Simpler CSS, header scrolls away |
| Hardcoded `season: '2025'` | Dynamic `league.currentSeason` | This phase | Season-proof, no annual code changes |

## Discretion Recommendations

### Header Mobile Adaptation
**Recommendation:** Keep the same layout on mobile. The header only contains three elements (wordmark, matches link, locale switcher), which fit comfortably in a single row even on 320px screens. No hamburger menu needed.

- Wordmark: reduce font size slightly on mobile (`text-lg` -> `text-base` at `sm:` breakpoint)
- Matches link: keep visible, it's a single word
- Locale switcher: already compact (shows "EN" with dropdown)

This approach avoids complexity (no mobile menu state, no animation) and the header's minimal content doesn't justify a hamburger.

**Confidence:** HIGH -- the existing header already works on mobile with these three elements

### Biggest Upset Calculation Method
**Recommendation:** Use odds-based calculation.

**Reasoning:**
1. The codebase already has rich odds data in `fixtureOdds` from The Odds API pipeline
2. Odds capture real-world expectations (e.g., a bottom team beating a top team at home might not be as much of an upset as the odds suggest if they traditionally perform well at home)
3. Multiple bookmaker odds can be averaged for robustness
4. The magnitude of upset has a natural numeric scale (higher odds = bigger upset)

**Fallback:** If a league has no odds data (unlikely given the pipeline), fall back to position-based: largest position gap where the lower-positioned team won. But odds should be available for all 5 leagues.

**Confidence:** HIGH -- fixtureOdds data is well-populated by the automated refresh-odds pipeline

### Stat Card Visual Design
**Recommendation:** Use a card design consistent with the existing codebase aesthetic (dark glassmorphism: `bg-white/5 backdrop-blur-sm rounded-lg border border-white/10`) but with accent colors and larger typography to make cards "eye-catching" as requested.

Structure per card:
- Card label (small, muted): "Top Scorer", "Biggest Upset", "Form Team"
- Primary stat (large, bold, white): e.g., "15 goals", "Matchweek 12", "WWWWW"
- Subject line (medium, bright): e.g., player name, "TeamA 2-1 TeamB", team name
- Context (small, muted): e.g., team name + badge, odds info, league position
- Team badge (small logo image, 24-32px)

Use league accent colors for highlights where appropriate (available via `LEAGUE_THEMES[league].colors.accent`).

**Confidence:** MEDIUM -- visual design is subjective, but consistent with existing UI patterns

### Loading/Error States for Stat Cards
**Recommendation:**
- **Loading:** Three skeleton cards matching the final card dimensions, with `animate-pulse` on content areas. Follow the exact skeleton pattern used in `TableSkeleton` and `CompactSkeleton`.
- **Error/no data:** Show the card shell with a muted "No data available" message inside. Don't hide cards entirely -- the layout should remain stable.
- **Partial data:** If one query fails but others succeed, show available cards and a subtle placeholder for the failed one.

**Confidence:** HIGH -- matches existing error handling patterns in the codebase

## Open Questions

1. **Matches page route structure**
   - What we know: Context says "Matches page is league-specific (e.g., /en/premier-league/matches)". Current route is `/en/matches` with league via query param (`?league=premier-league`).
   - What's unclear: Whether the user wants actual path-based routing (`/en/premier-league/matches`) or is satisfied with the current query-param approach (`/en/matches?league=premier-league`).
   - Recommendation: Keep the current query-param approach. Changing to path-based routing would require restructuring the entire app's routing (every page would need a `[league]` segment), which is out of scope for this phase. The query param approach already makes the page "league-specific" in behavior. The example in CONTEXT.md may have been illustrative rather than prescriptive.

2. **Own goals counting for Top Scorer**
   - What we know: `fixtureEvents` has `type = 'goal'`, `type = 'own_goal'`, and `type = 'penalty_scored'`
   - What's unclear: Whether own goals should count toward the scorer (they shouldn't -- own goals are credited to the opposing team's total, not the player's goal tally)
   - Recommendation: Count only `type IN ('goal', 'penalty_scored')` for the top scorer query. Exclude `own_goal`.

3. **Odds data coverage**
   - What we know: The `refresh-odds` pipeline fetches odds for scheduled (upcoming) matches only. Once a match finishes, its odds data may or may not remain in the database.
   - What's unclear: Whether odds data persists for finished matches or gets cleaned up.
   - Recommendation: The schema has no cleanup logic visible -- odds should persist. But the query should be tested to verify odds data exists for finished fixtures. If not, the "Biggest Upset" card would show no data, and a position-based fallback should be implemented.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** -- Direct reading of all relevant source files
  - `src/app/[locale]/layout.tsx` -- Current layout structure
  - `src/app/[locale]/page.tsx` -- Current homepage with Header
  - `src/components/header/Header.tsx` -- Current Header implementation
  - `src/components/i18n/LanguagePicker.tsx` -- Locale switching implementation
  - `src/components/league-table/LeagueTableWrapper.tsx` -- Hardcoded '2025' location
  - `src/components/matches/MatchPreviewSection.tsx` -- League-reactive data fetching pattern
  - `src/components/matches/actions.ts` -- Server action pattern
  - `src/db/schema/fixtures.ts` -- fixtureEvents table (goals for top scorer)
  - `src/db/schema/odds.ts` -- fixtureOdds table (odds for upset detection)
  - `src/db/schema/standings.ts` -- standings.form column (form team)
  - `src/db/schema/leagues.ts` -- leagues.currentSeason column
  - `src/i18n/routing.ts` -- Locale routing configuration
  - `src/i18n/navigation.ts` -- Navigation utilities (Link, usePathname, useRouter)

### Secondary (MEDIUM confidence)
- Next.js App Router documentation -- Client components in server component layouts (verified by existing codebase usage)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new libraries, all existing tools
- Architecture: HIGH -- Follows established codebase patterns exactly
- Database queries: HIGH for top scorer and form team, MEDIUM for biggest upset SQL
- Pitfalls: HIGH -- Identified from direct codebase analysis
- Visual design: MEDIUM -- Subjective, but aligned with existing aesthetic

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (stable -- no external dependencies changing)
