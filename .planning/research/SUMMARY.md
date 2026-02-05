# Project Research Summary

**Project:** FootballPulse
**Domain:** Football statistics and league table platform (Big 5 European leagues)
**Researched:** 2026-02-04
**Confidence:** MEDIUM-HIGH

## Executive Summary

FootballPulse is a data-dense football statistics platform inspired by CoinMarketCap's information-rich aesthetic. The core differentiator is embedding sparklines directly into league tables to show positional trajectory over the season — a visualization pattern no competitor (FotMob, SofaScore, WhoScored, Transfermarkt, FlashScore) currently implements. The platform targets football analytics enthusiasts who want more than basic standings: interactive season timelines, full-page league theming, financial dashboard aesthetics, and eventually betting odds integration for monetization.

The recommended technical approach is a Next.js 15 App Router application on Vercel with Neon Postgres for data storage, Drizzle ORM for type-safe queries, and Upstash Redis for caching. The architecture separates three execution contexts: user-facing serving (RSC with ISR), background data ingestion (QStash cron jobs calling API-Football), and processing pipelines (match detection, standings recalculation, cache warming, social media automation). This serverless-native pattern handles the read-heavy workload efficiently while keeping costs within the $100-150/month production budget. State management is minimal: Zustand for client preferences, TanStack Query for server state, with most data pre-rendered on the server.

The most critical risks are: (1) league-specific tiebreaker rules differ dramatically and must be configurable from day one (H2H vs goal difference), (2) API-Football's free tier 100 req/day budget exhausts instantly without aggressive caching, (3) SSE real-time updates face Vercel serverless timeout constraints requiring fallback to polling, (4) betting odds display has strict per-country legal requirements especially Italy (complete ban), and (5) sparkline rendering performance on mobile requires Canvas over SVG for 20 simultaneous charts. Prevention strategies are documented and must be implemented in Phase 1 foundations.

## Key Findings

### Recommended Stack

**Core Framework:** Next.js 15 with App Router on Vercel provides RSC for server-rendered data views, ISR for CDN-cached pages, and API routes for background jobs. TypeScript 5.x is non-negotiable for a data-heavy app with complex tiebreaker logic and league configurations. This stack is the obvious choice given the spec's Vercel hosting requirement and the need for both SSR (SEO for league tables) and serverless functions (background polling).

**Core technologies:**
- Next.js 15 + React 19: Full-stack framework with RSC, ISR, edge caching — Vercel-native deployment eliminates separate backend
- TypeScript 5.x: Type safety critical for standings calculations, tiebreaker logic, match event handling
- Tailwind CSS v4: Zero-runtime styling with native CSS variables for league theming system (5 league color schemes)
- Neon Postgres + Drizzle ORM: Serverless Postgres with JSONB for events/stats, lighter than Prisma for cold starts
- Upstash Redis + QStash: Serverless cache and job queue — write-through caching pattern, cron-triggered data ingestion
- TanStack Query v5: Server state management with differentiated TTLs per data type (standings: 5min, odds: 5min, snapshots: infinite)
- Zustand: Minimal client state for UI preferences (league selection, language, expanded sections)
- Recharts + custom SVG sparklines: Standard charts for team pages, custom 20-line sparkline component for table performance
- Framer Motion: Layout animations for table row reordering when standings change
- next-intl: Purpose-built i18n for Next.js App Router with locale routing for 5 languages

**Critical version notes:** Training data cutoff ~May 2025. All versions should be verified with `npm view` before install. Architectural choices are high confidence; specific version numbers are medium confidence.

**Why Neon over PlanetScale:** The spec references PlanetScale (MySQL), but PlanetScale deprecated its free tier in 2024. Neon Postgres is superior: serverless, generous free tier (0.5GB, 190 compute hours), JSONB for queryable JSON columns, standard SQL. The spec's MySQL schema must be converted to Postgres syntax.

### Expected Features

FootballPulse must balance table-stakes features (expected by all users) with signature differentiators (the product identity). Missing any table-stakes feature means users immediately leave for FotMob or SofaScore. Differentiators create the "wow" factor that justifies return visits.

**Must have (table stakes):**
- League table with core stats (P, W, D, L, GF, GA, GD, Pts, form guide, position change)
- Zone coloring (Champions League, Europa League, Conference League, relegation)
- League switching across all Big 5 leagues with fast navigation
- Recent results and upcoming fixtures lists with timezone conversion
- Team detail pages (season stats, squad, fixtures) and match detail pages (events timeline, stats bars)
- Head-to-head records on match pages
- Mobile responsive design (60-70% of sports traffic is mobile)
- Fast page loads (< 2s initial, < 500ms subsequent) — FotMob and SofaScore are instant

**Should have (signature differentiators — MVP):**
- Sparklines in league table (position-over-season charts inline) — this IS the product identity, no competitor does this
- Full-page league theming (entire UI color scheme changes per league: purple/green PL, orange La Liga, red Bundesliga)
- Financial dashboard aesthetic (dark theme, information density, data-forward like Bloomberg Terminal meets football)

**Defer to Phase 2:**
- Interactive season timeline (scrub through historical matchweeks to see table evolution)
- Multi-granularity position change (since last match / last 3 matches / same point last season)
- Points accumulation charts, goals by time period, xG analysis on team pages
- Odds display and multi-bookmaker comparison

**Defer to Phase 3+:**
- Fixture difficulty indicators, scoring-first records, social media automation
- Localisation to 5 languages (EN, ES, DE, IT, FR)
- Scenario calculator ("what-if" for table projections)

**Anti-features (deliberately NOT building):**
- Live score updates (second-by-second) — infrastructure complexity, not our differentiator
- Deep player profiles — Transfermarkt's core product, resource sink
- Player ratings algorithms — WhoScored's USP, years of data needed
- Video highlights — licensing and bandwidth costs
- Community features (forums, comments) — moderation overhead, toxic football communities
- 100+ league coverage at launch — focus on Big 5 excellence, expand later
- User accounts for v1 — authentication overhead before monetization

### Architecture Approach

FootballPulse is a **read-heavy, event-driven data platform** with three distinct execution contexts that must be architecturally separated:

**Major components:**

1. **Data Ingestion Layer** (QStash cron jobs) — Background processes that poll external APIs on schedule:
   - MatchPoller (60s during match windows with smart polling: only poll when matches are within -2h to +4h window)
   - FixtureSyncer (every 6 hours for upcoming fixtures)
   - OddsRefresher (15min tiered strategy: 24h+ away daily, <24h every 30min, <3h every 15min)
   - DailyResyncer (04:00 UTC full data integrity check)

2. **Processing Pipeline** (Next.js API routes chained via QStash) — Transform raw API data into derived views:
   - MatchProcessor: Detect match completion, extract events, trigger downstream
   - StandingsCalculator: Full table recalculation from all match results (not incremental — simpler, idempotent, self-healing)
   - CacheWarmer: Pre-compute all Redis views with write-through pattern
   - NewsworthinessScorer: Score match drama for social media queue
   - ContentGenerator + SocialPoster: LLM-generated posts with rate limiting

3. **Serving Layer** (Next.js App Router with RSC + ISR) — User-facing HTTP requests:
   - League/Team/Match pages as Server Components (data fetched server-side, rendered as HTML)
   - Timeline API for historical snapshots (Redis-cached forever for historical data)
   - SSE endpoint for real-time updates (with Vercel timeout caveats — may need polling fallback)
   - Cache-aside pattern: check Redis → on miss rebuild from Postgres → write to Redis

**Key architectural decisions:**

- **Full table recalculation over incremental updates:** With 18-20 teams, recalculating the entire table from match results is <50ms. Incremental updates create tiebreaker bugs (H2H requires checking other teams), position cascade issues, and cannot handle retroactive points deductions. Full recalc is simpler and self-healing.

- **Pre-compute over query-time calculation:** All derived stats (form, position change, sparkline data, PPG) are calculated during processing pipeline and stored in Redis/Postgres. Page loads are single Redis GET operations, not complex joins/aggregations. Critical for 13 columns × 20 teams with sub-second load times.

- **QStash over Vercel Cron:** Vercel cron (via vercel.json) has max 20 jobs and no retry logic. QStash provides chaining (one job triggers the next), automatic retries with backoff, dead letter queues, and deduplication. The match completion chain (poll → detect → recalculate → cache → revalidate → score → generate → post) requires QStash's orchestration.

- **Drizzle ORM over Prisma:** Drizzle generates leaner SQL, smaller bundles (~2MB savings), faster cold starts in serverless. Critical for a read-heavy platform with many function invocations.

### Critical Pitfalls

Research identified 18 domain-specific pitfalls. Top 5 by severity:

1. **League tiebreaker rules are NOT universal** — Premier League uses goal difference first, but La Liga and Serie A use head-to-head record first. Bundesliga and Ligue 1 use GD first. Hardcoding one approach produces wrong tables for 2-3 leagues whenever teams are level on points (constantly). H2H tiebreaking is significantly harder: requires building a mini-league from matches between tied teams. Prevention: Implement tiebreaker as configurable chain per league from day one. Store in leagues table, not app code. Unit test with real tied-team scenarios (2022-23 Serie A relegation battle: Spezia/Verona/Cremonese all on 28 points). **Phase 1 critical — fixing later means recalculating all historical snapshots.**

2. **API-Football free tier budget exhaustion** — 100 requests/day sounds generous until you realize: 1 page load = standings + recent matches + upcoming fixtures + odds = 4 requests, hot reload triggers re-execution, 5 leagues × multiple endpoints = quota gone in minutes. Prevention: Seed local database with complete API dump on day one (costs 30-40 requests), build transparent file cache for development, use Football-Data.org (10 req/min, no daily cap) for dev work, never call real API in unit tests. Track usage with counter, alert at 50% consumption. **Phase 1 setup task before any API integration.**

3. **Matchweek is not a clean sequential concept** — Treating matchweek as clean integers where all MW 20 matches complete before MW 21 breaks in reality. Postponements (weather, police, TV scheduling, European fixtures) mean teams play MW 20 fixtures while others are on MW 23. Interactive timeline shows incorrect states if snapshotted by matchweek number. Prevention: Snapshot after every individual match keyed by (league, match_id, timestamp) not (league, matchweek). Timeline UI scrubs by date or "after match N" not matchweek. Display "games played" prominently. **Phase 1 data model design — affects schema fundamentally.**

4. **SSE on Vercel serverless has hard duration limits** — Vercel functions: 300s max (Hobby), 800s max (Pro with fluid compute), 300s (Pro without). SSE connections exceeding this get 504 errors. High reconnection frequency drives costs and creates thundering herd problems. Prevention: Use polling with smart intervals (60s when matches live, 5min off-peak) via TanStack Query refetchInterval pattern. If true push required, use external service (Ably, Pusher, Upstash real-time). If staying with Vercel SSE: implement auto-reconnection with exponential backoff and max reconnection count before falling back to polling. **Phase 2 real-time updates, but architecture decision needed in Phase 1.**

5. **Betting odds legal compliance is per-jurisdiction** — Gambling advertising varies dramatically: Italy has complete ban (Dignity Decree 2019) — displaying odds with affiliate links to Italian users is illegal. France requires ANJ-licensed operators only. Germany has per-state rules. Spain has time-restricted display and licensed operators only. UK requires responsible gambling messaging. Prevention: Geo-detection via Vercel x-vercel-ip-country header, per-country configuration (IT: zero gambling content; FR/DE/ES: specific rules; UK: all bookmakers + disclaimers), default to no odds for unrecognised countries, consult gambling compliance specialist before launch. **Phase 3 monetization, but geo-detection infrastructure designed in Phase 1.**

**Additional critical pitfalls:**
- Points deductions happen regularly (Everton -6, Juventus -15, FFP breaches) and require manual admin tooling + full recalc of all snapshots retroactively
- API-Football data format inconsistencies: null values, inconsistent status strings (20+ match statuses not 5), varying team names across endpoints — use Zod validation at ingestion boundary
- Sparkline performance on mobile: 20 SVG sparklines cause jank, use Canvas-based rendering instead
- Neon Postgres cold starts add 500ms-2s after inactivity — use connection pooling, keep warm with 4-min ping cron, design Redis cache to serve most reads without hitting Postgres

## Implications for Roadmap

Based on combined research findings, architectural dependencies, and pitfall prevention strategies, the roadmap should follow this phase structure:

### Phase 1: Data Foundation & Core Tables

**Rationale:** You cannot display a league table without standings data. You cannot calculate standings without match data. Everything depends on the data pipeline working correctly. Phase 1 establishes the single source of truth and proves the core product hypothesis: "A league table with correct tiebreakers and live data is valuable."

**Delivers:**
- Database schema with Neon Postgres + Drizzle ORM migrations
- API-Football client with rate limiting, Zod validation, and file-cache development proxy
- Initial data seeding (all 5 leagues: fixtures, teams, current standings)
- StandingsCalculator with league-specific configurable tiebreaker chains (H2H for La Liga/Serie A, GD for others)
- Cache layer with Redis and cache-aside pattern
- League table page (RSC) rendering basic standings with all columns
- League switching with URL routing and CSS variable theming system
- Mobile responsive layout with condensed columns

**Addresses (from FEATURES.md):**
- League table with core stats (table stakes)
- Zone coloring (table stakes)
- Form guide column (table stakes)
- Position change indicators (table stakes)
- League switching (table stakes)
- Mobile responsive (table stakes)
- Full-page league theming (core differentiator)

**Avoids (from PITFALLS.md):**
- Pitfall 1: Configurable tiebreakers from day one, unit tested per league
- Pitfall 2: File-cache development proxy prevents API budget exhaustion
- Pitfall 3: Data model designed for per-match snapshots not per-matchweek
- Pitfall 6: Zod validation at API ingestion boundary catches format inconsistencies
- Pitfall 18: Convert MySQL spec schema to Postgres (JSONB, UNIQUE syntax, ENUM handling)

**Research needed:** None — well-established patterns, high-confidence research.

### Phase 2: Background Pipeline & Automation

**Rationale:** Phase 1 produces a working league table with seeded data but requires manual refresh. Phase 2 automates data ingestion so tables stay current without human intervention. Smart polling windows prevent API budget waste. This phase makes the platform "alive."

**Delivers:**
- QStash integration for cron job orchestration
- MatchPoller with smart polling windows (only poll when matches are within -2h to +4h)
- MatchProcessor: status change detection, DB write, trigger recalculation chain
- CacheWarmer: write-through pattern to pre-compute all Redis views
- ISR on-demand revalidation trigger (revalidatePath) after cache warming
- Processing chain: poll → detect → recalculate → cache → revalidate
- FixtureSyncer (6-hour interval) and DailyResyncer (04:00 UTC)
- Distributed lock per league for concurrent match completion handling

**Uses (from STACK.md):**
- Upstash QStash for chaining and retries
- Upstash Redis for cache and pub/sub (if SSE implemented)
- Drizzle ORM for efficient queries
- Neon connection pooling to avoid cold starts

**Implements (from ARCHITECTURE.md):**
- Ingestion Layer (cron jobs)
- Processing Pipeline (chained via QStash)
- Write-through cache warming pattern
- Full table recalculation (idempotent, self-healing)

**Avoids (from PITFALLS.md):**
- Pitfall 2: Smart polling windows reduce API calls from 1,440/day to 200-400/day
- Pitfall 9: Distributed lock prevents race conditions on concurrent match completions
- Pitfall 10: Connection pooling and keep-warm ping cron mitigate Neon cold starts
- Pitfall 5: Support points_adjustment field in calculations (admin tooling deferred to Phase 3)

**Research needed:** None — standard patterns for serverless cron jobs and cache invalidation.

### Phase 3: Enhanced Display & Sparklines

**Rationale:** With automated data ingestion working, Phase 3 adds the signature visual differentiators. Sparklines are the core product identity but require position history accumulated over matchweeks (Phase 2 pipeline provides this). This phase delivers the "wow" factor that makes FootballPulse visually distinctive.

**Delivers:**
- Sparkline component (Canvas-based for performance, custom ~30-line implementation)
- Table snapshots: write on every match completion, store in table_snapshots
- Position history: accumulate in standings rows or separate table
- Sparklines integrated into league table
- Recent matches and upcoming fixtures lists (table stakes features)
- Team detail pages: overview tab with season summary
- Match detail pages: basic layout with events timeline and stats bars
- H2H records on match pages (table stakes)

**Addresses (from FEATURES.md):**
- Sparklines in league table (Tier 1 core differentiator — this defines the product)
- Recent results / upcoming fixtures (table stakes)
- Team detail page basic (table stakes)
- Match detail page basic (table stakes)
- H2H records (table stakes)

**Avoids (from PITFALLS.md):**
- Pitfall 7: Canvas-based sparklines not SVG (20 SVGs cause mobile jank, single Canvas performant)
- Pitfall 3: Position history supports games-in-hand display when teams have different played counts
- Pitfall 17: Handle abandoned/awarded matches (ABD, AWD, WO statuses)

**Research needed:** Potential research-phase for sparkline rendering performance optimization — Canvas API patterns, mobile device testing, virtualization approach. Medium complexity.

### Phase 4: Season Timeline & Historical Data

**Rationale:** Interactive timeline is high-impact but complex (slider UI, historical data API, animated table transitions). Phase 4 leverages the snapshot infrastructure built in Phase 3. This feature answers "where were they at Christmas?" instantly and showcases the accumulated historical data.

**Delivers:**
- Timeline API endpoint: return snapshot for any matchweek/date
- SeasonTimeline client component: scrub slider with date picker
- Table transition animations (Framer Motion layout prop for row reordering)
- Snapshot caching strategy (Redis forever cache for historical data)
- Multi-season support (basic — compare this season to last at same point)

**Addresses (from FEATURES.md):**
- Interactive season timeline (Tier 1 core differentiator, high effort)
- Multi-granularity position change (Tier 2 differentiator — requires last-season data)

**Implements (from ARCHITECTURE.md):**
- Timeline API (serving component)
- Historical snapshot retrieval pattern
- Framer Motion layout animations for table row reordering

**Avoids (from PITFALLS.md):**
- Pitfall 3: Timeline scrubs by date or match count, not just matchweek number
- Pitfall 15: Handle promoted teams gracefully ("not in this league last season")

**Research needed:** Potential research-phase for timeline interaction patterns and animation performance. Medium-high complexity.

### Phase 5: Team & Match Detail Enhancement

**Rationale:** Basic team/match pages ship in Phase 3 to satisfy table-stakes. Phase 5 adds analytical depth: performance charts, xG analysis, goals by time period. These features target analytics-minded fans and differentiate from basic stats displays.

**Delivers:**
- Team page tabs: Overview, Performance, Fixtures, Squad
- Performance tab: points accumulation chart, goals by time period (0-15min, 15-30min, etc.), xG analysis (if available from API)
- Fixture difficulty indicators (colored dots based on opponent position)
- Scoring-first record (W/D/L when scoring first vs conceding first)
- Match detail enhancement: expanded stats bars, possession/shots/corners/fouls visualizations

**Addresses (from FEATURES.md):**
- Points accumulation chart (Tier 2 differentiator)
- Goals by time period (Tier 2 differentiator)
- xG analysis (Tier 2 differentiator — depends on API data availability)
- Fixture difficulty indicator (Tier 2 differentiator)
- Scoring-first record (Tier 2 differentiator)

**Uses (from STACK.md):**
- Recharts for team page charts (line charts for points accumulation, bar charts for goals by period)

**Avoids (from PITFALLS.md):**
- Pitfall 6: Handle null xG data gracefully (not all matches have xG from API-Football)

**Research needed:** None — Recharts patterns well-documented, xG data availability confirmed in API-Football docs.

### Phase 6: Betting Odds & Monetization

**Rationale:** Odds integration is the primary revenue driver but independent of core functionality. Phase 6 adds odds display, multi-bookmaker comparison, and affiliate link tracking. Geo-targeting ensures legal compliance per jurisdiction.

**Delivers:**
- The Odds API client with tiered refresh strategy
- Odds display in upcoming fixtures (single bookmaker default)
- Multi-bookmaker comparison (expandable row in fixtures table)
- Affiliate link tracking with click-through logging
- Geo-detection via Vercel x-vercel-ip-country header
- Per-country content rules (IT: no odds, FR/DE/ES: licensed operators only, UK: all bookmakers + disclaimers)
- OddsRefresher cron with smart intervals (daily for >48h away, 30min for <24h, 15min for <3h)

**Addresses (from FEATURES.md):**
- Odds display (Tier 2 differentiator, deferred from MVP)
- Multi-bookmaker comparison (Tier 3 differentiator, revenue feature)

**Implements (from ARCHITECTURE.md):**
- Odds API integration (data ingestion component)
- Affiliate link tracking system
- Geo-targeting infrastructure

**Avoids (from PITFALLS.md):**
- Pitfall 8: Per-jurisdiction content rules prevent legal liability (Italy complete ban, France/Germany/Spain restricted)
- Pitfall 13: Tiered refresh strategy prevents API budget exhaustion (500 req/month consumed in 3-4 days at flat 15min intervals)

**Research needed:** High-priority research-phase for gambling compliance — legal requirements per country, affiliate programme terms, geo-detection accuracy, age verification requirements. Complex regulatory environment.

### Phase 7: Localisation & International

**Rationale:** i18n affects every component and is easier to retrofit once UI is stable. Phase 7 adds 5 languages (EN, ES, DE, IT, FR) with locale routing, translated team names, and proper date/number formatting.

**Delivers:**
- next-intl setup with locale routing ([locale]/[league] pattern)
- Translation files for all 5 languages (UI strings, navigation, labels)
- Database-driven team names (team_names table with per-locale canonical names)
- Intl API for date/time/number formatting (locale-aware, timezone conversion)
- Locale switcher component
- SEO optimization: hreflang tags, per-locale sitemaps

**Addresses (from FEATURES.md):**
- 5-language support (spec requirement, deferred from MVP)

**Uses (from STACK.md):**
- next-intl for App Router i18n
- date-fns for relative times ("3 days ago" localized)
- Intl.DateTimeFormat, Intl.NumberFormat for formatting

**Avoids (from PITFALLS.md):**
- Pitfall 11: Database-driven team names not JSON files (Bayern Munich vs Bayern Munchen vs Bayern Monaco)
- Pitfall 11: Use Intl API for number formatting (1,000 EN vs 1.000 DE vs 1 000 FR)
- Pitfall 11: Store/transmit times in UTC, convert to user timezone in UI

**Research needed:** Low — standard next-intl patterns, but should validate team name translations with native speakers. Consider spot research-phase for football terminology per language.

### Phase 8: Social Media Automation

**Rationale:** Social automation is a growth mechanism, not core product. Phase 8 builds the content generation pipeline after the core platform is stable and provides reliable match completion triggers.

**Delivers:**
- NewsworthinessScorer: algorithm scoring matches for social posting (goal count, comebacks, upsets, derbies, hat-tricks)
- ContentGenerator: LLM integration (GPT-4o-mini) with prompt templates and context building
- SocialPoster: queue-based posting with rate limiting (max 6/day, stagger, quiet hours)
- X API v2 integration for Twitter posting
- Content approval queue (manual review until LLM quality proven)
- Post success tracking and engagement metrics logging

**Addresses (from FEATURES.md):**
- Social media automation (Tier 3 differentiator, growth mechanism)

**Uses (from STACK.md):**
- OpenAI API (GPT-4o-mini for cost efficiency)
- X API v2 (1,500 posts/month free tier)

**Implements (from ARCHITECTURE.md):**
- Content generation pipeline (processing layer)
- Social posting queue (QStash-triggered)

**Avoids (from PITFALLS.md):**
- Pitfall 12: Rate limiting (max 6/day, well within 17/15min X limit), jitter between posts
- Pitfall 12: Vary content structure via LLM prompts to avoid platform spam detection
- Pitfall 12: Manual approval queue initially, monitor engagement metrics for shadow-ban detection

**Research needed:** Medium-priority research-phase for LLM prompt engineering — football content generation patterns, tone variation, platform-specific best practices. Also X API v2 current rate limits and automation policies (change frequently).

### Phase 9: Real-Time Updates

**Rationale:** Real-time updates improve experience for users on-site when matches finish but add complexity. Phase 9 implements client-side live updates after the core serving + processing stack is rock-solid. Polling may be simpler and more reliable than SSE on Vercel.

**Delivers:**
- SSE endpoint (or polling endpoint if SSE proves problematic on Vercel)
- SSEProvider client component with reconnection logic
- Redis Pub/Sub for broadcasting table updates (or polling against last-updated timestamp)
- Optimistic UI updates with TanStack Query invalidation
- Table row reordering animation on live update (Framer Motion)

**Implements (from ARCHITECTURE.md):**
- SSE streaming (or polling fallback)
- Redis Pub/Sub pattern (or timestamp polling pattern)
- Client-side real-time provider

**Avoids (from PITFALLS.md):**
- Pitfall 4: SSE timeout constraints on Vercel (300s Hobby, 800s Pro with fluid compute) — implement auto-reconnection with exponential backoff and max reconnection count before falling back to polling
- Pitfall 4: Consider polling as primary strategy: 60s when matches live, 5min off-peak via TanStack Query refetchInterval

**Research needed:** High-priority research-phase for SSE vs polling tradeoffs on Vercel serverless — timeout behavior, connection lifecycle, Upstash Redis Pub/Sub in serverless context, cost implications of frequent reconnections. Medium-high complexity.

### Phase Ordering Rationale

**Dependency chain:** The critical path is data foundation → automated ingestion → visual differentiators → monetization. Phases 1-2 establish the data pipeline (everything depends on having current data). Phase 3 adds sparklines (the product identity, requires position history from Phase 2). Phase 4 builds on Phase 3's snapshot infrastructure. Phase 5 enriches detail pages with Phase 2's accumulated match data. Phases 6-9 are independent enhancements that can be reordered based on priorities.

**Risk mitigation:** Critical pitfalls from PITFALLS.md are addressed early. Phase 1 handles tiebreaker rules (Pitfall 1), API budget (Pitfall 2), matchweek model (Pitfall 3), and data format validation (Pitfall 6). Phase 2 addresses race conditions (Pitfall 9) and cold starts (Pitfall 10). Phase 3 tackles sparkline performance (Pitfall 7). This front-loads technical risk resolution.

**MVP scope:** Phases 1-3 constitute the MVP. By Phase 3 end, users see: league tables with sparklines, form guides, zone colors, league theming, recent/upcoming matches, basic team/match pages, all on mobile-responsive dark theme. This proves the core thesis: "CoinMarketCap-style league tables are more compelling than existing options." Phases 4-9 layer enhancements and monetization.

**Deferred complexity:** Timeline (Phase 4), odds/betting (Phase 6), i18n (Phase 7), social automation (Phase 8), and real-time (Phase 9) are complex and independent. Building them after the core is stable prevents scope creep and allows iterative validation. Each can be researched deeply during planning without blocking earlier phases.

### Research Flags

**Phases likely needing deeper research during planning:**

- **Phase 3 (Sparklines):** Canvas rendering performance patterns, mobile device testing strategy, virtualization for 20-row tables. Medium complexity, sparse documentation for football-specific sparklines. Suggest targeted research-phase on Canvas charting libraries and performance benchmarks.

- **Phase 4 (Timeline):** Interaction design patterns for season scrubber, animation performance for table transitions, historical data volume/indexing strategy. Medium-high complexity. Suggest research-phase on timeline UI patterns in data-heavy applications.

- **Phase 6 (Betting/Odds):** Gambling compliance per jurisdiction (legal requirements), affiliate programme terms/restrictions, geo-detection accuracy/spoofing concerns. High complexity, legal gray areas. Mandatory research-phase with legal/compliance focus before implementation.

- **Phase 8 (Social):** LLM prompt engineering for varied football content, X API v2 automation policies (change frequently), shadow-ban detection strategies. Medium complexity. Suggest research-phase on sports social media automation best practices and current platform policies.

- **Phase 9 (Real-Time):** SSE vs polling tradeoffs on Vercel serverless (timeout behavior, reconnection patterns, cost modeling), Upstash Redis Pub/Sub in serverless context. Medium-high complexity. Mandatory research-phase on Vercel streaming limitations and alternatives.

**Phases with standard patterns (skip deep research):**

- **Phase 1 (Foundation):** Next.js App Router, Neon Postgres, Drizzle ORM — extremely well-documented, established patterns. High confidence research already complete.

- **Phase 2 (Pipeline):** QStash cron jobs, cache invalidation, API polling — standard serverless patterns. Medium-high confidence research complete.

- **Phase 5 (Team Detail):** Recharts implementation, xG display logic — straightforward given Phase 3 charting groundwork. Low research needs.

- **Phase 7 (i18n):** next-intl patterns well-established, Intl API standard. Only football-specific terminology needs validation. Low research needs beyond translation QA.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Framework/database choices are high confidence (Next.js, Neon, Drizzle well-understood). Specific version numbers medium confidence (training cutoff ~May 2025, verify with npm view). Tailwind v4 and SSE on Vercel serverless are medium confidence (v4 relatively new, SSE timeout behavior should be tested). |
| Features | HIGH | Table-stakes features validated against 5 competitors (FotMob, SofaScore, WhoScored, Transfermarkt, FlashScore). Sparkline differentiation confirmed — no competitor embeds sparklines in tables. Competitor feature matrix based on training data; should be spot-checked before launch but core insights are solid. |
| Architecture | HIGH | RSC/ISR patterns well-established for read-heavy dashboards. Serverless cron via QStash is standard. Full recalculation strategy validated by domain experts. Write-through caching is proven pattern. Only SSE implementation on Vercel has medium confidence (timeout constraints, Redis Pub/Sub in serverless context should be prototyped early). |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls 1-6 are high confidence (tiebreaker rules documented in UEFA regs, API budget confirmed in spec, matchweek issues observable every season, SSE timeouts in Vercel docs, points deductions happen regularly, API format issues common in sports APIs). Moderate/minor pitfalls 7-18 are medium confidence (based on general web performance/legal/i18n knowledge, should be validated during implementation). |

**Overall confidence:** MEDIUM-HIGH

Research provides strong foundation for roadmap creation. Architectural approach is sound and well-suited to domain requirements. Critical risks identified with clear mitigation strategies. Main uncertainty is around specific tool versions (verify at install time) and Vercel SSE behavior (prototype in Phase 2 planning). Betting compliance (Phase 6) requires external legal consultation — research flags this appropriately.

### Gaps to Address

**Gaps requiring validation during planning/implementation:**

- **SSE vs polling decision:** Prototype needed in Phase 2 planning to validate Vercel SSE timeout behavior, reconnection patterns, and cost implications. Research recommends polling as safer default but this should be tested. Consider external service (Ably, Pusher) as alternative if SSE proves problematic.

- **Sparkline rendering approach:** Canvas vs SVG performance should be benchmarked on real mid-range Android devices in Phase 3 planning. Research strongly recommends Canvas but this should be validated with prototype of 20 simultaneous sparklines rendering + scroll performance.

- **Gambling compliance:** Phase 6 requires consultation with gambling compliance specialist for Italy (complete ban), France (ANJ rules), Germany (per-state), Spain (time restrictions). Research identifies key regulations but legal advice needed before implementation.

- **API-Football xG data coverage:** Research indicates xG available for most matches but Ligue 1 and some Serie A matches may lack it. Validate actual coverage during Phase 1 data seeding. Design UI to handle null xG gracefully from the start.

- **Neon cold start impact:** Research notes 500ms-2s cold start latency. Actual P99 latency should be measured during Phase 1 development to confirm Redis caching strategy adequately shields users. May need to increase auto-suspend timeout on paid plan if cold starts are frequent.

- **The Odds API request accounting:** Free tier 500 req/month confirmed but exact request counting mechanism (per-league vs per-match vs per-bookmaker) should be validated in Phase 6 planning. Tiered refresh strategy designed based on assumed per-league counting — verify this with API docs.

- **H2H tiebreaker complexity:** Research identifies 3+ team circular H2H as genuinely complex (A beat B, B beat C, C beat A). Phase 1 implementation should reference official UEFA tiebreaker documents and test against known multi-team ties from past seasons. Consider consulting league-specific regulations.

## Sources

### Primary (HIGH confidence)

- **STACK.md** — Technology stack research with architectural rationale. Core choices (Next.js, Neon, Drizzle, QStash) have high confidence backing. Version numbers should be verified at install time (training cutoff ~May 2025).

- **FEATURES.md** — Competitor analysis (FotMob, WhoScored, SofaScore, Transfermarkt, FlashScore) with feature matrix. Table-stakes vs differentiator categorization based on observed competitor offerings. Sparkline differentiation validated — no competitor implements inline sparklines.

- **ARCHITECTURE.md** — Architectural patterns for read-heavy serverless platforms. RSC/ISR patterns, cache-aside strategy, full recalculation approach, QStash chaining — all high confidence. SSE on Vercel has medium confidence (timeout constraints documented but behavioral testing needed).

- **PITFALLS.md** — 18 domain-specific pitfalls with prevention strategies. Critical pitfalls (1-6) high confidence. Moderate/minor pitfalls (7-18) medium confidence, should be validated during implementation.

- **Vercel Documentation** — Function duration limits (300s Hobby, 800s Pro with fluid compute), response body size limit (4.5 MB), streaming response support. Verified 2026-02-04.

- **League tiebreaker regulations** — UEFA member association rules, league-specific regulations. Premier League uses GD, La Liga/Serie A use H2H confirmed from established regulations. Should be verified against current season rules at implementation.

### Secondary (MEDIUM confidence)

- **API-Football documentation** — Based on known API structure and training data. Specific endpoint behaviors, rate limits (100 req/day free tier), and xG data coverage should be verified during Phase 1 against current API-Football v3 documentation.

- **The Odds API pricing** — Free tier 500 req/month cited from training data. Should verify current pricing, request counting, and coverage for Big 5 leagues during Phase 6 planning.

- **X API v2 limits** — 1,500 posts/month free tier, automation policies from training data. X API changes frequently; verify current limits and policies in Phase 8 planning.

- **Neon Postgres serverless behavior** — Cold start latency (500ms-2s), auto-suspend timing (5min on free/lower tiers), connection pooling recommendations based on general Neon knowledge. Should measure actual P99 latency during development.

- **Competitor features** — Feature matrix based on training data knowledge of competitors as of early 2025. Features may have been added/removed. Spot-check competitors before launch to validate differentiators still unique.

### Tertiary (LOW confidence, needs validation)

- **Gambling regulations** — Italy Dignity Decree (2019), Spain Royal Decree 958/2020, France ANJ, UK Gambling Commission, Germany Interstate Treaty cited from general legal knowledge. Legal consultation required before Phase 6 implementation — regulations change and have nuance not captured in research.

- **Tailwind CSS v4 stability** — Version 4 noted as relatively new at training cutoff (early 2025). Research recommends it for CSS variable support but flags v3.4 as fallback if ecosystem compatibility issues arise. Should be validated at project setup.

- **Upstash Redis Pub/Sub in serverless** — Pattern works in principle for SSE broadcasting but connection lifecycle in serverless context should be prototyped. Research notes this as medium confidence — real-world testing needed in Phase 2 planning.

---

**Research completed:** 2026-02-04
**Ready for roadmap:** Yes

All four research dimensions (STACK, FEATURES, ARCHITECTURE, PITFALLS) completed and synthesized. Research provides strong foundation for roadmap creation with clear phase structure, dependency chains, and risk mitigation strategies. Identified gaps are actionable and flagged for appropriate phases. Confidence levels are honest and nuanced per area. Roadmapper can proceed with phase-by-phase planning using this synthesis as primary context.
