# Architecture Patterns

**Domain:** Football statistics and league table platform (CoinMarketCap-style)
**Researched:** 2026-02-04
**Overall Confidence:** HIGH (well-understood domain, established patterns, detailed spec available)

---

## Recommended Architecture

KickLeague is a **read-heavy, event-driven data platform** with three distinct execution contexts: user-facing rendering, background data ingestion, and asynchronous content generation. The architecture separates these cleanly while sharing a common data layer.

### High-Level System Diagram

```
                           EXTERNAL APIs
                    +-----------+-----------+
                    |           |           |
              API-Football  Odds API   Social APIs
              (matches)     (betting)  (X, Meta)
                    |           |           ^
                    v           v           |
              +-----+-----------+-----+     |
              |   INGESTION LAYER     |     |
              |  (QStash Cron Jobs)   |     |
              +-----------+-----------+     |
                          |                 |
                          v                 |
              +-----------+-----------+     |
              |   PROCESSING LAYER    |     |
              | (Next.js API Routes)  |-----+
              |                       |
              | - Match detection     |
              | - Table recalc        |
              | - Newsworthiness      |
              | - Content generation  |
              +-----------+-----------+
                          |
                    +-----+-----+
                    |           |
                    v           v
              +---------+ +---------+
              | Postgres| |  Redis  |
              |  (Neon) | |(Upstash)|
              +---------+ +---------+
                    |           |
                    +-----+-----+
                          |
                          v
              +-----------+-----------+
              |   SERVING LAYER       |
              | (Next.js App Router)  |
              |                       |
              | - RSC (server render) |
              | - API Routes (JSON)   |
              | - SSE endpoint        |
              +-----------+-----------+
                          |
                          v
              +-----------+-----------+
              |   EDGE / CDN LAYER    |
              |   (Vercel Edge)       |
              +-----------+-----------+
                          |
                          v
                       BROWSER
              (React client components)
```

### Three Execution Contexts

| Context | Runtime | Trigger | Examples |
|---------|---------|---------|----------|
| **Serving** | Vercel Serverless/Edge | User HTTP request | Page loads, API calls, SSE connections |
| **Ingestion** | QStash -> Vercel Serverless | Cron schedule | Match polling, fixture sync, odds refresh |
| **Processing** | Vercel Serverless (chained) | Ingestion events | Table recalculation, cache warming, social posting |

This separation matters because each context has different timeout requirements, error handling, and scaling characteristics. Vercel serverless functions have a 60-second timeout on Pro; ingestion jobs must complete within that window or be broken into chains.

---

## Component Boundaries

### 1. Data Ingestion Components

These components pull data from external APIs on schedule. They do NOT serve user requests.

| Component | Responsibility | Inputs | Outputs | Schedule |
|-----------|---------------|--------|---------|----------|
| `MatchPoller` | Poll API-Football for live/recent match status changes | API-Football `/fixtures` | Match status updates in Postgres, triggers to `MatchProcessor` | 60s during match windows, off otherwise |
| `FixtureSyncer` | Sync upcoming fixture schedule | API-Football `/fixtures` | Updated fixture records in Postgres, cache invalidation | Every 6 hours |
| `OddsRefresher` | Pull latest betting odds | The Odds API `/odds` | Updated odds in Postgres + Redis | Every 15 minutes |
| `DailyResyncer` | Full data integrity check | API-Football `/standings`, `/fixtures` | Corrected records, validation logs | Daily 04:00 UTC |

**Key design decision: Smart polling windows.** The `MatchPoller` should NOT poll every 60 seconds 24/7. That wastes API quota. Instead:

```typescript
// Pseudo-logic for smart polling
function shouldPoll(): boolean {
  // Check if any matches are scheduled within -2h to +4h window
  const matchesNearby = await db.matches.count({
    where: {
      kickoff: { gte: subHours(now, 2), lte: addHours(now, 4) },
      status: { in: ['scheduled', 'live'] }
    }
  });
  return matchesNearby > 0;
}
```

This reduces API-Football calls from ~1,440/day to ~200-400/day on match days and near-zero on off days. Critical for staying within the Pro tier's 120,000/month limit across 5 leagues.

### 2. Data Processing Components

These components transform raw API data into the derived data the frontend needs.

| Component | Responsibility | Triggered By | Outputs |
|-----------|---------------|-------------|---------|
| `MatchProcessor` | Detect match completion, extract events | `MatchPoller` finding status change | Updated match record, trigger to `StandingsCalculator` |
| `StandingsCalculator` | Recalculate league table with correct tiebreakers | `MatchProcessor` on match completion | Updated standings rows, table snapshot, trigger to `CacheWarmer` |
| `CacheWarmer` | Pre-compute and write all cached views | `StandingsCalculator` completion | Warm Redis keys for league table, team details, recent matches |
| `NewsworthinessScorer` | Score match for social posting | `MatchProcessor` on match completion | Score + decision to queue social post |
| `ContentGenerator` | Generate social media posts via LLM | `NewsworthinessScorer` above threshold | Queued social posts |
| `SocialPoster` | Post to X/Instagram on schedule | Content queue + posting rules | Posted content, post IDs |

**Processing chain pattern:**

```
MatchPoller (cron)
  -> detects status change
  -> calls MatchProcessor (same invocation or chained via QStash)
    -> calls StandingsCalculator
      -> calls CacheWarmer
      -> calls SSE broadcast
    -> calls NewsworthinessScorer
      -> (if threshold met) calls ContentGenerator
        -> queues SocialPoster
```

**Why chain via QStash rather than doing everything in one function:** Vercel serverless has a 60s timeout. The full chain (API call + DB writes + standings recalc + cache warm + LLM call + social post) could exceed that. Breaking into chained QStash calls gives each step its own 60s budget and provides automatic retry on failure.

### 3. Data Storage Components

| Component | Technology | What It Stores | Access Pattern |
|-----------|-----------|----------------|----------------|
| **Primary Database** | Postgres (Neon) | All persistent data: leagues, teams, matches, standings, snapshots, odds, social posts | Write: ingestion/processing. Read: serving layer via ORM. |
| **Cache Layer** | Redis (Upstash) | Pre-computed JSON views, hot data | Write: CacheWarmer. Read: serving layer (cache-aside). |
| **CDN Cache** | Vercel Edge | HTTP response cache | Automatic via Cache-Control headers on responses. |
| **Blob Storage** | Vercel Blob (or none) | Generated social media images (Phase 2+) | Write: image generator. Read: social poster. |

### 4. Serving Components

These handle user-facing HTTP requests. They read from cache/database but never write to external APIs.

| Component | Type | Responsibility | Cache Strategy |
|-----------|------|---------------|----------------|
| **League Page (RSC)** | Server Component | Render league table, recent matches, upcoming fixtures | ISR with on-demand revalidation |
| **Team Page (RSC)** | Server Component | Render team detail with stats tabs | ISR with on-demand revalidation |
| **Match Page (RSC)** | Server Component | Render match detail (completed or upcoming) | ISR (completed: long TTL; upcoming: short TTL) |
| **Timeline API** | API Route | Return historical table snapshot for matchweek | Redis (forever cache for historical) |
| **SSE Endpoint** | API Route (streaming) | Push table updates to connected browsers | N/A (real-time stream) |
| **Odds API** | API Route | Return current odds for a match | Redis (15-min TTL) |

---

## Data Flow

### Flow 1: Match Completion (Primary Flow)

This is the most important data flow. Everything else is secondary.

```
1. QStash fires MatchPoller cron (every 60s during match windows)
2. MatchPoller calls API-Football GET /fixtures?live=all (or by date)
3. MatchPoller compares response to last known state in Redis
4. IF match status changed to 'FT':
   a. MatchProcessor writes final score + events to Postgres
   b. StandingsCalculator:
      - Reads all matches for the league+season from Postgres
      - Recalculates full table (not incremental -- safer, simpler)
      - Applies league-specific tiebreakers
      - Writes updated standings rows to Postgres
      - Writes table snapshot for this matchweek
   c. CacheWarmer:
      - Builds league table JSON (all columns, derived stats)
      - Builds affected team detail JSON
      - Writes to Redis with appropriate TTLs
      - Calls revalidatePath() for ISR invalidation
   d. SSE broadcast:
      - Publishes TABLE_UPDATE event via Redis Pub/Sub
      - Connected SSE clients receive update
   e. NewsworthinessScorer evaluates match
      - IF score >= threshold: queue ContentGenerator via QStash
5. IF match status is 'live' but score changed:
   - Update match record (for "live-ish" display)
   - Do NOT recalculate standings (match not finished)
```

**Why full recalculation, not incremental:** With only 18-20 teams per league, recalculating the entire table from match results is cheap (~5ms). Incremental updates are bug-prone (missed edge cases with tiebreakers, points deductions, postponed matches). Full recalc is idempotent and self-healing.

### Flow 2: User Page Load

```
1. User requests /premier-league
2. Vercel Edge checks CDN cache
   - HIT: Return cached HTML (fast, ~50ms)
   - MISS: Continue to origin
3. Next.js RSC renders on server:
   a. Check Redis for league:premier-league:table
      - HIT: Use cached JSON
      - MISS: Query Postgres, build JSON, write to Redis
   b. Check Redis for league:premier-league:recent
      - Same cache-aside pattern
   c. Check Redis for league:premier-league:upcoming
      - Same pattern
   d. Render HTML with data
4. Return HTML with Cache-Control: s-maxage=60, stale-while-revalidate=300
5. Browser hydrates React, establishes SSE connection for live updates
```

### Flow 3: Historical Timeline Interaction

```
1. User drags timeline slider to matchweek 15
2. Client sends GET /api/timeline?league=premier-league&matchweek=15
3. API route checks Redis for snapshot:premier-league:2025-26:15
   - HIT (expected -- historical snapshots cached forever): Return JSON
   - MISS: Query Postgres table_snapshots, write to Redis, return JSON
4. Client animates table transition to historical state
5. User can compare positions, points at that point in season
```

### Flow 4: Social Media Automation

```
1. MatchProcessor completes -> triggers NewsworthinessScorer
2. Scorer calculates score based on:
   - Goal count, comebacks, late drama, upsets, derbies, hat-tricks
3. IF score >= 30 (threshold):
   a. Build context object with match data, standings context, streaks
   b. Queue ContentGenerator via QStash (allows retry)
4. ContentGenerator:
   a. Calls LLM (Claude/GPT-4o-mini) with match context + prompt template
   b. Receives X post + Instagram caption
   c. Writes to social_posts table with status='queued'
5. SocialPoster (separate cron, every 2 minutes):
   a. Checks queue for posts ready to send
   b. Applies posting rules (max 6/day, stagger, quiet hours)
   c. Posts to X API, Meta Graph API
   d. Updates social_posts with post_id and status='posted'
```

---

## Recommended Architecture: Next.js App Router Structure

### Directory Layout

```
src/
  app/
    [locale]/
      [league]/
        page.tsx              # League home (RSC)
        team/[slug]/
          page.tsx            # Team detail (RSC)
        match/[id]/
          page.tsx            # Match detail (RSC)
        history/[matchweek]/
          page.tsx            # Historical view (RSC)
      layout.tsx              # Root layout with league theme provider
      page.tsx                # Redirect to default league
    api/
      cron/
        poll-matches/route.ts    # QStash cron endpoint
        sync-fixtures/route.ts   # QStash cron endpoint
        refresh-odds/route.ts    # QStash cron endpoint
        daily-resync/route.ts    # QStash cron endpoint
        post-social/route.ts     # QStash cron endpoint
      timeline/route.ts          # Historical snapshot API
      sse/route.ts               # SSE endpoint
      revalidate/route.ts        # On-demand ISR revalidation
  lib/
    db/
      schema.ts               # Drizzle schema definitions
      queries/                 # Query functions by domain
        leagues.ts
        standings.ts
        matches.ts
        odds.ts
        snapshots.ts
        social.ts
    cache/
      redis.ts                 # Upstash Redis client
      keys.ts                  # Cache key constants + builders
      warmer.ts                # Cache warming logic
    api-football/
      client.ts                # API-Football HTTP client
      types.ts                 # API response types
      transforms.ts            # API response -> domain model
    odds-api/
      client.ts                # The Odds API HTTP client
      types.ts
      transforms.ts
    processing/
      match-processor.ts       # Match completion logic
      standings-calculator.ts  # Table recalculation engine
      tiebreakers.ts           # League-specific tiebreaker rules
      newsworthiness.ts        # Scoring algorithm
    social/
      content-generator.ts     # LLM content generation
      poster.ts                # Platform posting logic
      platforms/
        x.ts                   # X/Twitter API client
        instagram.ts           # Meta Graph API client
    domain/
      types.ts                 # Core domain types
      leagues.ts               # League configs (zones, tiebreakers)
      themes.ts                # League theme definitions
  components/
    league-table/
      LeagueTable.tsx          # Main table (server component)
      TableRow.tsx             # Row with all columns
      FormIndicator.tsx        # W/D/L dots
      Sparkline.tsx            # Position sparkline (client)
      PositionChange.tsx       # Delta indicator
      ZoneBadge.tsx            # Qualification/relegation colour
    matches/
      RecentMatches.tsx        # Recent matches table
      UpcomingMatches.tsx      # Upcoming fixtures with odds
      MatchDetail.tsx          # Full match view
    timeline/
      SeasonTimeline.tsx       # Interactive slider (client)
    team/
      TeamHeader.tsx           # Hero section
      TeamStats.tsx            # Tabbed stats view
    odds/
      OddsComparison.tsx       # Multi-bookmaker odds table
      AffiliateLink.tsx        # Tracked affiliate link
    layout/
      LeagueTabs.tsx           # League switching
      ThemeProvider.tsx         # CSS variable theming (client)
      LanguageSwitcher.tsx     # i18n selector
    shared/
      SSEProvider.tsx          # SSE connection manager (client)
```

### Server vs Client Component Split

**Server Components (RSC) -- the majority:**
- League table rendering (data fetching + HTML)
- Match lists (recent, upcoming)
- Team detail page content
- Match detail page content

**Client Components -- interactive elements only:**
- `SeasonTimeline` -- drag/tap interaction
- `Sparkline` -- canvas/SVG rendering with hover
- `ThemeProvider` -- CSS variable management
- `SSEProvider` -- real-time connection
- `LanguageSwitcher` -- client-side locale change
- Expandable table sections -- animation state
- Odds format toggle (decimal/fractional/american)

**Rationale:** Server components for data display means zero client-side JavaScript for the bulk of content. The league table, which is the primary view, renders entirely on the server. Only interactive widgets need client-side JS. This gives excellent Core Web Vitals (critical for SEO and for the information-dense dashboard experience).

---

## Patterns to Follow

### Pattern 1: Cache-Aside with Write-Through Warming

**What:** On data change, immediately write the new cache value (write-through). On read, fall back to database if cache misses (cache-aside). Combine both for reliability.

**Why:** Pure cache-aside creates cold-start latency. Pure write-through risks stale data if the write fails. The combination ensures reads are always fast AND data is always fresh.

```typescript
// Write-through on match completion (processing side)
async function warmLeagueCache(leagueSlug: string) {
  const standings = await db.getStandings(leagueSlug);
  const enriched = enrichWithDerivedStats(standings); // form, sparklines, deltas
  await redis.set(
    cacheKeys.leagueTable(leagueSlug),
    JSON.stringify(enriched),
    { ex: 1800 } // 30 min TTL as safety net
  );
}

// Cache-aside on page load (serving side)
async function getLeagueTable(leagueSlug: string) {
  const cached = await redis.get(cacheKeys.leagueTable(leagueSlug));
  if (cached) return JSON.parse(cached);

  // Cache miss -- rebuild from DB
  const standings = await db.getStandings(leagueSlug);
  const enriched = enrichWithDerivedStats(standings);
  await redis.set(
    cacheKeys.leagueTable(leagueSlug),
    JSON.stringify(enriched),
    { ex: 1800 }
  );
  return enriched;
}
```

### Pattern 2: Idempotent Processing with QStash

**What:** Every processing step should be idempotent -- running it twice produces the same result. QStash provides automatic retries, so handlers MUST handle duplicate delivery.

**Why:** Serverless functions can timeout, QStash retries on failure. If `StandingsCalculator` runs twice for the same match, the table must still be correct.

```typescript
// Idempotent match processing
async function processMatchCompletion(matchApiId: number) {
  // Check if already processed (idempotency key)
  const existing = await db.matches.findByApiId(matchApiId);
  if (existing?.status === 'finished' && existing.processedAt) {
    return; // Already processed, skip
  }

  // Process...
  await db.matches.update({
    where: { apiId: matchApiId },
    data: { status: 'finished', score: ..., processedAt: new Date() }
  });

  // Full recalculation is inherently idempotent
  await recalculateStandings(existing.leagueId);
}
```

### Pattern 3: League-Specific Configuration Objects

**What:** Encode all league-specific rules (tiebreakers, zones, team count) in configuration objects, not conditional logic.

**Why:** The five leagues have different tiebreaker orders, zone configurations, and team counts. Scattering `if (league === 'la-liga')` throughout the codebase creates bugs. A single config object per league keeps rules centralized.

```typescript
const LEAGUE_CONFIGS: Record<LeagueSlug, LeagueConfig> = {
  'premier-league': {
    teamCount: 20,
    tiebreakers: ['goal_difference', 'goals_for', 'head_to_head'],
    zones: [
      { positions: [1, 4], type: 'champions_league', color: '#00FF85' },
      { positions: [5, 5], type: 'europa_league', color: '#0077FF' },
      { positions: [6, 6], type: 'conference_league', color: '#88CCFF' },
      { positions: [18, 20], type: 'relegation', color: '#FF4444' },
    ],
  },
  'la-liga': {
    teamCount: 20,
    tiebreakers: ['head_to_head', 'goal_difference', 'goals_for'],
    zones: [ /* ... */ ],
  },
  // ... etc
};
```

### Pattern 4: SSE via Redis Pub/Sub

**What:** Use Redis Pub/Sub as the transport between processing functions (which write updates) and SSE endpoints (which stream to browsers). Each SSE connection subscribes to a Redis channel.

**Why:** Vercel serverless functions are stateless -- you cannot hold a WebSocket connection or store in-memory state. Redis Pub/Sub bridges the gap: the processing function publishes an event, and all active SSE connections (potentially across multiple Vercel instances) receive it.

```typescript
// SSE endpoint (src/app/api/sse/route.ts)
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const subscriber = redis.subscribe('table-updates');

      subscriber.on('message', (channel, message) => {
        controller.enqueue(
          encoder.encode(`data: ${message}\n\n`)
        );
      });

      request.signal.addEventListener('abort', () => {
        subscriber.unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Publishing side (in CacheWarmer)
await redis.publish('table-updates', JSON.stringify({
  type: 'TABLE_UPDATE',
  league: leagueSlug,
  matchweek: currentMatchweek,
}));
```

**Important caveat:** Upstash Redis has a connection limit and Pub/Sub may not be the best fit for many concurrent SSE connections on serverless. An alternative is polling from the client every 30-60 seconds against a "last-updated" timestamp in Redis, which is simpler and more serverless-friendly. See the Pitfalls section for details.

### Pattern 5: ISR with On-Demand Revalidation

**What:** Use Next.js Incremental Static Regeneration (ISR) for pages, with on-demand revalidation triggered by the processing pipeline when data changes.

**Why:** Most page views happen between match completions. The table does not change every second -- it changes when a match ends. ISR serves static HTML at CDN speed for the 99% of requests between updates, and on-demand revalidation ensures freshness within seconds of a match completing.

```typescript
// In the league page (RSC)
export const revalidate = 300; // Fallback: revalidate every 5 minutes

// In the processing pipeline (after cache warming)
async function triggerRevalidation(leagueSlug: string) {
  await fetch(`${process.env.SITE_URL}/api/revalidate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.REVALIDATE_SECRET}` },
    body: JSON.stringify({
      paths: [
        `/${leagueSlug}`,
        // Team pages for both teams in the match
        `/${leagueSlug}/team/${homeTeamSlug}`,
        `/${leagueSlug}/team/${awayTeamSlug}`,
      ],
    }),
  });
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side Data Fetching for Primary Views

**What:** Using TanStack Query or `useEffect` to fetch league table data on the client.

**Why bad:** The league table is the primary view. Client-side fetching means: (1) blank screen or loading spinner on first load, (2) layout shift when data arrives, (3) no SEO for table content, (4) wasted API calls since every visitor fetches the same data. This directly undermines the "information-dense dashboard" goal -- CoinMarketCap renders data server-side.

**Instead:** Render the league table as a Server Component. The HTML arrives with data already populated. Use client-side fetching ONLY for interactive updates after initial load (SSE pushes, timeline slider changes).

### Anti-Pattern 2: Polling External APIs from Client

**What:** Having the browser call API-Football or The Odds API directly.

**Why bad:** Exposes API keys, multiplies API calls by visitor count, cannot cache effectively, rate limits hit instantly. 5,000 visitors each polling API-Football = 5,000 calls per poll interval.

**Instead:** All external API calls happen server-side in background jobs. The browser only talks to your Next.js API routes and SSE endpoint.

### Anti-Pattern 3: Storing Derived Data Without Source Data

**What:** Only storing the calculated standings without keeping the individual match results that produced them.

**Why bad:** When tiebreaker rules need correction, when a match result is amended, or when you add a new derived stat (like xG-based position), you need to recalculate from source data. If you only stored the standings, you cannot recalculate.

**Instead:** Store both raw match data (source of truth) and calculated standings (derived, rebuildable). The standings table is a materialized view of match results.

### Anti-Pattern 4: One Giant Cron Job

**What:** A single scheduled function that polls matches AND syncs fixtures AND refreshes odds AND posts to social media.

**Why bad:** Different concerns have different frequencies (60s vs 6h vs 15min), different failure modes, and different timeout requirements. Bundling them means a failure in odds refresh blocks match polling.

**Instead:** Separate QStash cron jobs per concern, each with its own schedule, retry policy, and error handling.

### Anti-Pattern 5: Real-Time via WebSockets on Vercel Serverless

**What:** Using WebSocket connections (ws, Socket.io) for real-time updates on Vercel.

**Why bad:** Vercel serverless functions are stateless and short-lived. They cannot maintain persistent WebSocket connections. Socket.io requires a persistent server process.

**Instead:** Use SSE (Server-Sent Events) which works with HTTP streaming responses, or use a polling approach with short intervals (30s). For true WebSocket needs, use a dedicated service like Ably, Pusher, or Upstash's real-time features. Given that table updates are infrequent (a few times per match day), SSE or smart polling is sufficient.

---

## Scalability Considerations

| Concern | Current Scale (5 leagues) | At 20 Leagues | At 50 Leagues |
|---------|--------------------------|---------------|---------------|
| **Database size** | ~10K match rows/season, ~500 snapshot rows | ~40K matches, ~2K snapshots | ~100K matches, ~5K snapshots. Still trivially small for Postgres. |
| **API calls** | ~4K/day to API-Football on match days | ~16K/day. Needs higher tier. | ~40K/day. Enterprise tier. |
| **Redis memory** | ~5MB (all cached views) | ~20MB | ~50MB. Still well within Upstash free/cheap tiers. |
| **SSE connections** | ~100-1K concurrent | Shard by league channel | Consider dedicated real-time service (Ably/Pusher) |
| **Build time** | ~96 team pages + 5 league pages | ~400 team pages | ~1000 pages. ISR handles this -- pages built on-demand. |
| **Processing** | 1-2 match completions per batch | 5-10 per batch | Queue-based. QStash handles concurrency. |

**Key insight:** This platform is read-heavy with infrequent writes. 5 leagues with ~1,900 matches/season means roughly 10 matches per day during the season, concentrated on weekends. The write load is tiny. The read load is the scaling concern, and the CDN + Redis + ISR stack handles that efficiently without architectural changes.

---

## Build Order

The build order is dictated by data dependencies. You cannot display a league table without standings data. You cannot calculate standings without match data. You cannot show sparklines without historical snapshots.

### Phase 1: Data Foundation (Build First)

**Must exist before anything else works.**

1. **Database schema + migrations** (Drizzle + Neon)
   - leagues, teams, matches, standings tables
   - Seed with league and team reference data

2. **API-Football client + transforms**
   - HTTP client with rate limiting
   - Response type definitions
   - Transform functions: API response -> domain models

3. **Initial data seeding job**
   - Pull current season fixtures
   - Pull current standings
   - Populate database with real data

4. **StandingsCalculator**
   - Full recalculation from match results
   - League-specific tiebreaker engine
   - Position change calculation

**Why first:** Without data in the database, the frontend has nothing to display. Without the standings calculator, data cannot be processed. This phase makes the system functional (if not yet user-facing).

### Phase 2: Core Serving Layer (Build Second)

**Makes data visible to users.**

5. **Cache layer** (Redis keys, cache-aside reads)
6. **League home page** (RSC rendering table, recent, upcoming)
7. **League table component** (all columns, zone colors, form dots)
8. **League switching** (tabs, theming via CSS variables)
9. **Mobile responsive layout** (condensed columns, expandable rows)

**Why second:** The primary user value -- seeing the league table -- requires a working serving layer. This phase produces something deployable and testable.

### Phase 3: Background Pipeline (Build Third)

**Makes data stay current automatically.**

10. **MatchPoller cron** (QStash -> API-Football -> match detection)
11. **MatchProcessor** (status change -> DB write -> trigger recalc)
12. **CacheWarmer** (pre-compute views after recalculation)
13. **ISR revalidation trigger** (on-demand after cache warm)
14. **Smart polling windows** (only poll when matches are nearby)

**Why third:** The system works without the pipeline -- you just need to trigger data refresh manually or via the daily resync. The pipeline automates what could be done manually. Building it third means you can test the full serving stack with seeded data before adding automation complexity.

### Phase 4: Enhanced Display (Build Fourth)

**Rich data visualization.**

15. **Sparkline component** (position history chart)
16. **Table snapshots** (write on match completion, store historically)
17. **Season timeline** (interactive slider + historical snapshot API)
18. **Team detail pages** (stats tabs: overview, performance, fixtures)
19. **Match detail pages** (completed + upcoming layouts)

**Why fourth:** These features enhance the core table but are not required for the core value proposition to work. Sparklines require position history (accumulated over matchweeks), and the timeline requires snapshots (accumulated over matchweeks). Building these after the pipeline means historical data starts accumulating naturally.

### Phase 5: Odds + Monetisation (Build Fifth)

**Revenue generation.**

20. **Odds API client + refresh job**
21. **Odds display in upcoming matches** (single bookmaker)
22. **Multi-bookmaker comparison** (expandable row)
23. **Affiliate link tracking** (click tracking, geo-targeting)

**Why fifth:** Odds integration is independent of the core data pipeline. It has its own API, its own refresh schedule, and its own cache TTLs. Building it after the core platform is stable reduces integration complexity.

### Phase 6: Social Automation (Build Sixth)

**Growth engine.**

24. **Newsworthiness scorer**
25. **LLM content generator** (prompt templates, context building)
26. **Social posting queue** (rate limiting, posting rules)
27. **X API integration**
28. **Meta/Instagram API integration**

**Why sixth:** Social automation is a growth mechanism, not core product functionality. It depends on the match processing pipeline being stable (reliable triggers), but no user-facing feature depends on it. It can also be tested manually before automation.

### Phase 7: SSE + Real-Time (Build Seventh)

**Live updates for connected users.**

29. **Redis Pub/Sub or polling mechanism**
30. **SSE endpoint** (or polling endpoint)
31. **Client-side SSE provider** (reconnection, state management)
32. **Optimistic UI updates** (animate table changes)

**Why seventh:** Real-time updates are a nice-to-have that improves the experience for users who happen to be on the site when a match finishes. The ISR revalidation from Phase 3 already ensures the page is fresh within ~60 seconds. SSE makes it instant but adds complexity (connection management, serverless limitations). Build it last so the core experience is solid without it.

### Phase 8: Localisation + Polish (Build Last)

**International reach.**

33. **next-intl setup** (locale routing, message files)
34. **Translation files** (5 languages x all UI strings)
35. **Date/number formatting** (locale-aware)
36. **SEO optimization** (structured data, meta tags per page)

**Why last:** i18n affects every component and is easier to retrofit once the component structure is stable. Adding it too early means every UI change requires updating 5 translation files.

---

## Key Architectural Decisions

### Decision 1: Drizzle ORM over Prisma

**Recommendation:** Use Drizzle ORM with Neon's serverless driver.

**Rationale:** Drizzle generates SQL-like TypeScript, produces smaller bundles for serverless (critical on Vercel), and has first-class support for Neon's HTTP-based serverless driver (`@neondatabase/serverless`). Prisma's query engine adds ~2MB to cold starts. For a read-heavy platform with many serverless function invocations, this matters.

**Confidence:** MEDIUM (based on training data; verify Drizzle + Neon serverless driver compatibility with current versions via docs).

### Decision 2: Pre-Compute Over Query-Time Calculation

**Recommendation:** Calculate all derived stats (form, position change, sparkline data, PPG) during the processing pipeline and store them in Redis/Postgres. Do NOT calculate them at query time.

**Rationale:** The league table page includes ~13 columns per team, ~20 teams per league. Calculating form (last 5 match results), position change (diff from previous matchweek), and sparkline data (position at every matchweek) from raw match data on every page load would require joining matches, filtering, sorting, and aggregating. Pre-computing once on match completion and caching the result means page loads are a single Redis GET.

### Decision 3: QStash Over Vercel Cron

**Recommendation:** Use QStash for all scheduled and chained jobs, not Vercel's built-in cron.

**Rationale:** Vercel cron (via `vercel.json`) supports a maximum of 20 cron jobs with minimum 1-minute intervals on Pro. QStash provides: (1) more granular scheduling, (2) automatic retries with backoff, (3) chaining (one job triggers the next), (4) dead letter queues for failed jobs, (5) deduplication. The match processing chain (poll -> detect -> recalculate -> cache -> revalidate -> score -> generate -> post) benefits enormously from QStash's chaining and retry capabilities.

### Decision 4: Full Table Recalculation Over Incremental Updates

**Recommendation:** On every match completion, recalculate the entire league table from all match results.

**Rationale:** With 18-20 teams and 380 matches per league per season, full recalculation is trivially fast (<50ms). Incremental updates (only updating the two teams that played) introduce bugs with: tiebreaker recalculation (head-to-head requires checking other teams), position changes cascading (team A moves up, team B moves down, which affects team C's zone), and points deductions applied retroactively. Full recalculation is simpler, idempotent, and self-healing.

---

## Sources and Confidence Notes

| Claim | Confidence | Basis |
|-------|-----------|-------|
| Next.js App Router RSC/ISR patterns | HIGH | Well-established patterns, documented in Next.js docs |
| Vercel serverless 60s timeout on Pro | MEDIUM | Based on training data -- verify with current Vercel docs |
| Upstash Redis Pub/Sub for SSE | MEDIUM | Pattern works in principle; verify Upstash serverless Redis supports Pub/Sub subscriptions in serverless context |
| Drizzle ORM bundle size advantage | MEDIUM | Based on training data -- verify current benchmarks |
| QStash chaining capabilities | MEDIUM | Based on training data -- verify current QStash docs for chaining/callback features |
| Full recalculation performance (<50ms) | HIGH | 20 teams, simple arithmetic -- trivially fast for any database |
| ISR on-demand revalidation via revalidatePath | HIGH | Core Next.js feature, well-documented |
| Smart polling window concept | HIGH | Standard optimization, no external dependency |

**Key items to verify before implementation:**
- Upstash Redis Pub/Sub behavior in Vercel serverless (connection lifecycle)
- QStash callback/chaining API (exact syntax and limitations)
- Drizzle + Neon serverless driver current compatibility
- Vercel Pro plan cron job limits (may have changed)
- SSE response streaming support in Next.js App Router on Vercel (verify no edge runtime required)
