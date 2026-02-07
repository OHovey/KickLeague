# Domain Pitfalls

**Domain:** Football statistics and league table platform (Big 5 European leagues)
**Project:** KickLeague
**Researched:** 2026-02-04

---

## Critical Pitfalls

Mistakes that cause rewrites, data corruption, or project failure.

---

### Pitfall 1: League Table Tiebreaker Rules Are Not Universal

**What goes wrong:** Building a single sorting algorithm for all 5 leagues. The Premier League uses goal difference as the primary tiebreaker, but La Liga and Serie A use head-to-head record first. Bundesliga and Ligue 1 use goal difference first. If you hardcode one approach, tables for 2-3 leagues will be wrong whenever teams are level on points -- which happens constantly.

**Why it happens:** Developers test with one league (usually the Premier League) and assume the sorting logic generalises. H2H tiebreaking is also significantly harder to implement than GD tiebreaking because it requires querying the results between the specific tied teams, not just comparing aggregate numbers.

**Consequences:**
- Tables display incorrect positions for tied teams
- Zone colouring (Champions League, relegation) applied to wrong teams
- Users who know football will immediately notice and lose trust
- H2H tiebreaking between 3+ teams is a genuinely complex graph problem (A beat B, B beat C, C beat A -- circular H2H)

**Prevention:**
- Implement tiebreaker as a configurable chain per league from day one. Each league gets an ordered array of tiebreaker functions: `[h2hPoints, goalDifference, goalsFor, awayGoals, ...]`
- For H2H leagues (La Liga, Serie A): build a mini-league table from only the matches between the tied teams. If the mini-league also ties, fall back to overall goal difference
- Write unit tests with real-world examples of tied teams from each league. The 2022-23 Serie A relegation battle (Spezia, Verona, Cremonese all on 28 points) is a good H2H test case
- Store the tiebreaker configuration in the `leagues` table, not in application code

**Detection:** Compare your calculated table against the official league website after every matchweek for the first month. Discrepancies will surface quickly during congested mid-season periods.

**Phase:** Must be correct in Phase 1 (core tables). Getting this wrong in Phase 1 and fixing later means recalculating all historical snapshots.

**Confidence:** HIGH -- this is well-documented in league regulations.

---

### Pitfall 2: API-Football Free Tier Budget Exhaustion During Development

**What goes wrong:** The free tier allows 100 requests per day. A naive development setup that fetches live data on every page load, hot reload, or test run will exhaust the daily budget within minutes. Developers then either stall waiting for the quota to reset or switch to mocked data and lose touch with real API quirks.

**Why it happens:** 100 requests per day sounds like a lot until you realise:
- A single page load might need standings (1 req) + recent matches (1 req) + upcoming matches (1 req) + odds (1 req) = 4 requests minimum
- Hot module reload in Next.js dev triggers server component re-execution
- 5 leagues x multiple endpoints = requests multiply fast
- Automated tests hitting real API burn quota

**Consequences:**
- Development blocked by rate limits
- Switching to mocked data means real API data format quirks (null fields, inconsistent naming, timezone issues) surface only in production
- Potential RapidAPI account suspension if rate limits are bypassed

**Prevention:**
- Seed a local database with a complete API response dump on day one. Create a script that fetches all data for all 5 leagues (standings, fixtures, teams) in a single batch and saves it locally. This costs about 30-40 requests -- one day's budget
- Build a transparent proxy/cache layer: in development, all API calls go through a local file cache. If the response exists and is < 24h old, return cached. Otherwise, fetch and cache
- Use `Football-Data.org` as the development API (10 req/minute, no daily cap) and only switch to API-Football for integration testing
- Never call the real API in unit tests. Snapshot real responses and use them as fixtures

**Detection:** Track API usage in a simple counter. Log every outbound API call with a timestamp. Alert when 50% of daily budget is consumed.

**Phase:** Phase 1 setup task. The caching proxy should be the very first thing built before any API integration work.

**Confidence:** HIGH -- confirmed from spec (100 req/day limit).

---

### Pitfall 3: Matchweek Is Not a Clean Sequential Concept

**What goes wrong:** Treating "matchweek" as a clean integer sequence where all matches in matchweek N are completed before matchweek N+1 begins. In reality, matchweeks overlap, matches get postponed to later dates, and a team might play their matchweek 20 fixture while other teams are playing matchweek 23.

**Why it happens:** The data model in the spec uses `matchweek: number` as a primary organising concept for snapshots and timeline. This works conceptually but breaks in practice because:
- Premier League fixtures are constantly rearranged for TV scheduling
- Postponements (weather, police requirements, European commitments) mean matches are replayed weeks or months later
- The Bundesliga has a winter break where some matchdays straddle calendar months
- Cup replays and European fixtures cause midweek reshuffling

**Consequences:**
- Interactive timeline shows incorrect table states. If you snapshot at "matchweek 20" but three teams haven't played their matchweek 20 fixture yet, the snapshot shows teams with different numbers of games played
- "Position change since last matchweek" is meaningless when matchweeks are interleaved
- Historical timeline has gaps or duplicates where matchweeks were split across weeks

**Prevention:**
- Snapshot the table after every individual match, not after every matchweek. Store snapshots keyed by `(league_id, match_id, timestamp)` rather than `(league_id, matchweek)`
- For the timeline UI, let users scrub by date or by "after match N of the season" rather than by matchweek number
- Display "Games Played" prominently in the table so users understand when teams have games in hand
- Add a "games in hand" indicator when teams are compared: "Arsenal have 2 games in hand over Man City"
- Consider using API-Football's `round` field but validate it -- it sometimes disagrees with official league matchweek numbering

**Detection:** During mid-season (December-February), check if your matchweek-based snapshots ever show teams with different `played` values that differ by more than 2. If so, your matchweek model is too coarse.

**Phase:** Phase 1 data model design. This affects the database schema fundamentally. The `table_snapshots` table should be redesigned before any data is stored.

**Confidence:** HIGH -- this is observable every season in the Premier League.

---

### Pitfall 4: SSE on Vercel Serverless Has Hard Duration Limits

**What goes wrong:** Implementing Server-Sent Events (SSE) as a persistent connection from a Vercel serverless function. Vercel functions have a maximum duration of 300 seconds (Hobby) or 800 seconds (Pro) with fluid compute enabled. SSE connections that exceed this are terminated with a 504 error. Without fluid compute, Hobby is 60 seconds and Pro is 300 seconds.

**Why it happens:** The spec calls for "Real-time push updates to connected clients (SSE)" but Vercel's serverless architecture is fundamentally request-response, not long-lived connections. Developers assume SSE will work like it does on a traditional Node.js server with persistent connections.

**Consequences:**
- SSE connections drop every 5-13 minutes depending on plan
- Users see stale data after disconnection unless reconnection logic is robust
- High frequency of function invocations drives up Vercel costs (each reconnection is a new function invocation)
- Under load, thousands of SSE reconnections create thundering herd problems

**Prevention:**
- Do not use SSE as the primary real-time mechanism on Vercel. Instead, use a polling strategy with smart intervals:
  - When matches are live: poll every 60 seconds
  - When no matches are live: poll every 5 minutes
  - Use the `stale-while-revalidate` pattern with TanStack Query's `refetchInterval`
- If true push is required, use a dedicated real-time service: Ably, Pusher, or Upstash's own SSE/WebSocket offering. These maintain persistent connections outside of Vercel's function lifecycle
- If staying with Vercel SSE: implement automatic reconnection with exponential backoff, last-event-ID tracking, and a maximum reconnection count before falling back to polling
- Consider Vercel's Edge Runtime for SSE -- it has a 25-second initial response requirement but can stream for up to 300 seconds. This is still limited

**Detection:** Monitor SSE connection durations in production. If median connection duration equals `maxDuration`, your connections are being killed.

**Phase:** Phase 2 (real-time updates). But the architecture decision should be made in Phase 1 so the polling infrastructure is built correctly from the start.

**Confidence:** HIGH -- verified from Vercel documentation. Hobby: 300s max, Pro: 800s max with fluid compute. Without fluid compute: Hobby 60s, Pro 300s.

---

### Pitfall 5: Points Deductions and Mid-Season Rule Changes

**What goes wrong:** Assuming league tables are purely derived from match results. In practice, points deductions happen regularly (financial fair play violations, administration, registration failures) and change the table retroactively. The spec includes a `points_adjustment` field but the pipeline doesn't account for when and how to apply it.

**Why it happens:** Points deductions are manual, unpredictable events that don't come through match data APIs. They are announced via league press releases, not API endpoints.

**Real examples:**
- Everton: -8 points in 2023-24 for FFP breach (later reduced to -6 on appeal)
- Nottingham Forest: -4 points in 2023-24 for FFP breach
- Serie A regularly deducts points for match-fixing or financial irregularities
- Juventus: -15 points in 2022-23 season (later modified on appeal)

**Consequences:**
- Table shows wrong positions until deduction is manually applied
- Historical snapshots become wrong retroactively (the deduction applies to the current season, meaning all previous matchweek snapshots should be recalculated)
- If the deduction happens mid-season, the timeline feature shows a discontinuity that confuses users

**Prevention:**
- Build an admin interface or at minimum a database update script for applying points adjustments
- When a deduction is applied, trigger a full recalculation of all snapshots for that league/season
- Store deductions as events with metadata (reason, date announced, effective date, appeal status)
- Display deductions explicitly in the table: "Everton: 28 pts (-6)" so users understand why a team is lower than expected
- Monitor football news feeds for deduction announcements -- this is a manual process that cannot be automated reliably

**Detection:** Compare your calculated points against the official league table weekly. Any discrepancy of more than 0 points indicates a deduction you missed.

**Phase:** Phase 1 must support the `points_adjustment` field in calculations. The admin tooling can wait until Phase 2 or 3.

**Confidence:** HIGH -- points deductions occur every season across the Big 5.

---

### Pitfall 6: API-Football Data Format Inconsistencies and Null Handling

**What goes wrong:** Treating API-Football responses as consistently structured. In practice, data from different leagues, seasons, and match states has significant inconsistencies: null values where you expect numbers, missing nested objects, inconsistent status strings, and varying field names across endpoints.

**Why it happens:** API-Football aggregates data from multiple upstream sources per league. Each source has different data availability timelines and formats. The API normalises somewhat, but edge cases leak through.

**Known issues based on common API-Football patterns:**
- `statistics` endpoint returns null for some leagues/matches where data providers don't cover
- xG data (`expected_goals`) is not available for all leagues -- Ligue 1 and some Serie A matches may lack it
- Match `status` can be: `TBD`, `NS`, `1H`, `HT`, `2H`, `ET`, `P`, `FT`, `AET`, `PEN`, `BT`, `SUSP`, `INT`, `PST`, `CANC`, `ABD`, `AWD`, `WO`, `LIVE` -- many more than the 5 in the spec's enum
- Team names may differ across endpoints (e.g., "Man United" vs "Manchester United" vs "Manchester Utd")
- Fixture `round` strings are not standardised: "Regular Season - 1" vs "Matchday 1" vs "Round 1"
- Logos/images may return 404 after season changes

**Consequences:**
- Runtime crashes from accessing properties on null objects
- Incorrect statistics displays (showing 0 instead of "N/A" for missing xG)
- Match status handling breaks for statuses not in the enum
- Broken images across the site

**Prevention:**
- Define a strict internal data model and map API responses through a validation/transformation layer. Use Zod schemas to validate every API response
- Never trust API data directly. Transform to internal types at the ingestion boundary
- Handle all match statuses explicitly. Map the 20+ API-Football statuses to your 5 internal statuses with explicit mapping (e.g., `AET`, `PEN` -> `finished`; `PST` -> `postponed`; `ABD`, `CANC` -> `cancelled`; `SUSP`, `INT` -> handle as "in progress, check again")
- For images: proxy team logos through your own domain and cache them. Never link directly to API-Football's CDN
- Build null-safe accessor utilities: `match.stats?.xG?.home ?? null` everywhere, with UI components that handle null gracefully (show "N/A" or hide the stat)

**Detection:** Log every API response that fails Zod validation. Review these logs weekly. High failure rates indicate new data format changes from the API provider.

**Phase:** Phase 1, at the data ingestion layer. The Zod validation schemas and transformation layer should be built before any UI work.

**Confidence:** MEDIUM -- based on common patterns with sports data APIs. Specific field-level issues should be validated against actual API responses during development.

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or degraded user experience.

---

### Pitfall 7: Sparkline and Chart Rendering Performance on Mobile

**What goes wrong:** Rendering 20 SVG sparklines in a league table, plus position history charts, plus cumulative points charts, on a mobile device with limited GPU and memory. The page becomes janky, scrolling stutters, and initial render takes 2-3 seconds.

**Why it happens:** Each sparkline is an SVG element with potentially 38 data points. A table with 20 teams means 20 SVGs rendering simultaneously. Add Framer Motion animations for row expansion, and the browser's paint budget is exceeded. Recharts, while "lightweight," still bundles significant JavaScript.

**Consequences:**
- Mobile Lighthouse performance score drops below 50
- Users on mid-range Android devices experience scroll jank
- Table expansion animations drop frames
- Core Web Vitals (LCP, INP) fail, hurting SEO

**Prevention:**
- Use Canvas-based sparklines instead of SVG. A single canvas element for the sparkline column is far more performant than 20 individual SVGs. Libraries like `sparkline-canvas` or a custom tiny Canvas renderer (20 lines of code) outperform Recharts for this use case
- Virtualise the table: only render rows visible in the viewport. TanStack Virtual is the standard approach
- Lazy-load charts that are below the fold or in expandable sections. Only render the Recharts components when the section is expanded
- Pre-render sparkline data as static images during the build/cache-warming step if real-time sparkline updates are not needed
- Benchmark on a real mid-range Android device (Samsung A-series), not just Chrome DevTools throttling

**Detection:** Test on a real Android device with Chrome DevTools remote debugging. If INP (Interaction to Next Paint) exceeds 200ms on the main table, there is a rendering performance problem.

**Phase:** Phase 2 (sparklines and charts). But the choice of charting approach should be decided in Phase 1 architecture to avoid a Recharts-to-Canvas migration later.

**Confidence:** MEDIUM -- based on general web performance knowledge. Exact Recharts performance depends on implementation.

---

### Pitfall 8: Betting Odds Legal Compliance Is Per-Jurisdiction, Not Global

**What goes wrong:** Displaying betting odds and affiliate links uniformly to all users regardless of their location. Gambling advertising is heavily regulated and varies dramatically by country, and even by region within countries.

**Why it happens:** The spec plans for geo-targeted bookmaker display but underestimates the complexity. It is not just "show different bookmakers per country" -- some jurisdictions prohibit any gambling advertising, some require specific disclaimers, and some require age verification gates before showing odds.

**Key regulations:**
- **UK:** Must display responsible gambling messaging. Affiliate sites need a Gambling Commission license if they actively promote gambling. Passive odds display is a grey area
- **Italy:** Complete ban on gambling advertising since 2019 (Dignity Decree). Displaying odds with affiliate links to Italian users is illegal
- **France:** ANJ (Autorite nationale des jeux) restricts advertising. Only licensed operators can be promoted
- **Germany:** Interstate Treaty on Gambling limits advertising. Different rules per Bundesland (state)
- **Spain:** Royal Decree 958/2020 heavily restricts gambling advertising. No odds display during live events, watershed restrictions

**Consequences:**
- Legal liability in Italy and potentially other jurisdictions
- Affiliate accounts terminated for non-compliant traffic
- Fines from gambling regulators
- App store rejection if a mobile version is ever built

**Prevention:**
- Implement geo-detection (via Vercel's `x-vercel-ip-country` header) and maintain a per-country configuration:
  - `IT`: No odds, no affiliate links, no gambling content whatsoever
  - `FR`: Only ANJ-licensed operators, specific disclaimer required
  - `DE`: Limited operators, state-specific rules (simplify to most restrictive)
  - `ES`: Time-restricted display, licensed operators only
  - `UK`: All bookmakers, but include responsible gambling messaging and GamStop links
- Default to "no odds display" for unrecognised countries
- Consult a gambling compliance specialist before launching odds features. This is not something to figure out from blog posts
- Keep affiliate compliance requirements documented per partner -- each affiliate programme has its own rules about how odds must be displayed

**Detection:** Before launch, verify with a VPN from each target country that the correct content is displayed. Italian users should see zero gambling content.

**Phase:** Phase 3 (monetisation). But the geo-detection infrastructure should be designed in Phase 1 so the conditional rendering pattern is established.

**Confidence:** MEDIUM -- based on general knowledge of European gambling regulation. Specific legal advice is needed for compliance.

---

### Pitfall 9: Cache Invalidation Race Conditions on Match Completion

**What goes wrong:** When a match ends, the pipeline triggers: update DB -> invalidate cache -> push to clients. But if a user request arrives between "update DB" and "invalidate cache," they get old cached data. Worse, if cache invalidation fails silently, stale data persists for the full TTL (30 minutes per spec).

**Why it happens:** The spec's write-through pattern looks correct in pseudocode but distributed systems have ordering problems:
- Redis `SET` and Postgres `UPDATE` are not atomic across systems
- If the Postgres write succeeds but Redis write fails (network blip, Upstash rate limit), the cache is stale
- Multiple matches ending simultaneously (Saturday 3pm kickoffs: up to 10 Premier League matches end within minutes) create concurrent recalculation jobs that can overwrite each other
- Vercel serverless cold starts mean the invalidation function might be slow to start

**Consequences:**
- Users see outdated league tables for up to 30 minutes after match completion
- Two concurrent recalculations can produce inconsistent states (match A updates the table, then match B's recalculation overwrites with a state that doesn't include match A)
- Social media posts generated from stale data contain wrong information

**Prevention:**
- Use a versioned cache strategy: include a version number in the cache key. Each recalculation increments the version. Old versions are never read
- Serialise recalculations per league using a distributed lock (Upstash Redis `SET NX EX` pattern). If a recalculation is already in progress for a league, queue the next one
- Use cache-aside with short TTLs instead of write-through: cache has a 60-second TTL, and every read checks if the cache is valid. On miss, recompute from the database (which is always the source of truth)
- Implement an explicit "last_updated" timestamp on the table response. The UI compares this to the last known update time and shows a "table updating..." indicator if data is stale
- For Saturday 3pm batches: debounce recalculations. If multiple matches end within a 2-minute window, batch them into a single recalculation

**Detection:** Log the timestamp delta between "match marked as finished in DB" and "cache successfully updated." If this exceeds 5 seconds regularly, there is a race condition or failure in the pipeline.

**Phase:** Phase 1 (data pipeline). The cache strategy must be designed correctly from the start. Retrofitting versioned caching is painful.

**Confidence:** HIGH -- this is a well-known distributed systems problem.

---

### Pitfall 10: Neon Postgres Cold Starts on Serverless

**What goes wrong:** Neon's serverless Postgres suspends inactive compute endpoints after a period of inactivity. When a request arrives after suspension, the database must "wake up," adding 500ms-2s to the first query. On a football stats site with irregular traffic patterns (heavy during match days, dead at 3am), cold starts happen frequently.

**Why it happens:** Neon's free tier and lower paid tiers suspend compute after 5 minutes of inactivity. This is by design to save costs, but it means first-request latency is poor. Combined with Vercel function cold starts, a cold request can take 3-5 seconds total.

**Consequences:**
- First visitor after a quiet period sees a slow page load (3-5 seconds)
- API routes that query the database directly have unpredictable latency
- Cron jobs that run during off-peak hours hit cold start penalty every time
- Perceived performance is poor even though subsequent requests are fast

**Prevention:**
- Use Neon's connection pooling endpoint (PgBouncer-based) rather than direct connections. This reduces connection establishment overhead
- Use the `@neondatabase/serverless` driver which is optimised for serverless environments and uses HTTP/WebSocket connections that are faster to establish
- Keep the database warm with a lightweight cron job that runs every 4 minutes during expected active hours (pings the database with a simple `SELECT 1`)
- Design the caching layer (Redis) to serve most reads without hitting Postgres. If Redis has the data, the Postgres cold start is irrelevant
- On Neon's paid plans, configure the auto-suspend timeout to a longer period (or disable it entirely if budget permits)
- Use connection pooling with a pool size appropriate for serverless (Neon recommends pool sizes of 5-10 for serverless, not the default 20+)

**Detection:** Track P95 database query latency. If P95 is 10x higher than P50, cold starts are the likely cause.

**Phase:** Phase 1 (infrastructure setup). Connection configuration and caching strategy must be correct from the start.

**Confidence:** MEDIUM -- based on general knowledge of Neon's architecture. Specific cold start durations should be measured during development.

---

### Pitfall 11: Localisation Is More Than String Translation

**What goes wrong:** Treating i18n as "translate the UI strings into 5 languages" and shipping. In practice, football localisation involves team names, competition names, date/time formatting, number formatting, and cultural context that string replacement cannot handle.

**Why it happens:** The spec correctly identifies localised content (team names, date formats, number formats) but underestimates the edge cases:
- Team names are not simply translated. "Bayern Munich" (English) vs "Bayern Munchen" (German) vs "Bayern Monaco" (Italian). The "correct" name depends on the user's language AND the convention in that language's football culture
- "Real Madrid" stays "Real Madrid" in all languages, but "Atletico Madrid" is sometimes "Atletico de Madrid" in Spanish
- Date formats: "15 Feb" (English) vs "15 fev." (French) vs "15. Feb." (German)
- Match times must be displayed in the user's local timezone, not the league's timezone. A 15:00 GMT kickoff is 16:00 CET for German users
- Ordinal numbers: "1st" (English), "1er" (French), "1." (German)
- Number formatting: "1,000" (English) vs "1.000" (German/Italian/Spanish) vs "1 000" (French)

**Consequences:**
- Incorrect team names destroy credibility with local audiences
- Wrong timezone display means users miss match kickoffs
- Number formatting confusion (is "1.500" one and a half, or one thousand five hundred?)

**Prevention:**
- Create a `team_names` localisation table in the database, not in i18n JSON files. Each team has a canonical name per locale. Populate from official league sources
- Use the `Intl` API (built into modern browsers and Node.js) for date, time, and number formatting rather than custom format strings. `Intl.DateTimeFormat`, `Intl.NumberFormat` handle locale-specific formatting correctly
- Always store and transmit times in UTC. Convert to local timezone in the UI layer using the user's browser timezone (`Intl.DateTimeFormat` with `timeZone` option)
- Use `next-intl` (spec says react-i18next but PROJECT.md says next-intl -- use next-intl as it is purpose-built for Next.js App Router) with ICU message syntax for plurals and ordinals
- Have a native speaker review each language's content, especially team names and football terminology. Machine translation of football jargon is poor ("clean sheet" does not translate literally)

**Detection:** Open the site with browser language set to each supported locale and visually audit every page. Check team names against each league's official website in that language.

**Phase:** Phase 2 (localisation). But the data model must accommodate per-locale team names from Phase 1 schema design.

**Confidence:** HIGH -- these are well-known i18n challenges, amplified by football-specific naming conventions.

---

### Pitfall 12: Social Media API Rate Limits and Platform Policy Violations

**What goes wrong:** Automated posting to X (Twitter) and Instagram gets the account suspended for violating platform automation policies, or rate-limited so posts fail silently.

**Why it happens:**
- X API v2 free tier: 1,500 posts/month and 17 requests/15 minutes. But the free tier also has severe read limits and may not include all posting endpoints
- X's automation policy requires that automated posts be clearly identifiable and not misleading. Purely automated accounts that post only match results can be flagged as spam
- Instagram's Graph API requires a Facebook Business account and does not support direct image upload from server -- only published images via URL. The API has its own rate limits and content policies
- If content is generated by LLM and posts sound too similar or formulaic, platforms may flag the account

**Consequences:**
- Account suspension (permanent on X for repeated violations)
- Posts failing silently, losing the growth channel
- Investment in social media automation infrastructure with no return

**Prevention:**
- Start with X only. Instagram automation is significantly more complex (requires image hosting, Facebook Business integration, content approval workflows)
- On X: mix automated posts with some manual engagement (replies, retweets). Purely automated accounts are more likely to be flagged
- Rate limit your posting: maximum 4-6 posts per day, well within the 17/15min limit. Implement a queue with jitter (random delay of 30-120 seconds between posts)
- Vary content structure. The LLM prompt should produce genuinely different post styles, not just fill-in-the-blank templates. Include system prompts that enforce variation
- Store all generated content for review before posting. Implement a human approval queue initially until the LLM quality is proven
- Use X API's `app_id` user agent correctly. Register the app properly with accurate description of automated posting functionality
- Monitor account health: if impressions suddenly drop to zero, the account may be shadow-banned

**Detection:** Track post success rates and engagement metrics. If posts succeed (200 response) but get zero impressions, the account may be shadow-banned. Log every API response, including rate limit headers (`x-rate-limit-remaining`).

**Phase:** Phase 3 (social media automation). This is correctly deprioritised in the spec.

**Confidence:** MEDIUM -- specific rate limits should be verified against current X API documentation at implementation time, as they change frequently.

---

### Pitfall 13: The Odds API Request Budget Is Tighter Than It Looks

**What goes wrong:** The free tier of The Odds API (500 requests/month) runs out quickly because each request for odds returns all bookmakers for all markets. To get odds for all Big 5 leagues with multiple bookmakers, you need:
- 5 leagues x odds request = 5 requests minimum per refresh
- At 15-minute refresh intervals during match days: 5 x 4/hour x ~8 active hours = 160 requests per match day
- With 2-3 match days per week: 320-480 requests/week

The free tier is consumed in 3-4 days.

**Why it happens:** The spec plans for 15-minute odds refresh, which is reasonable for user experience but expensive for API budget. Each API call to The Odds API counts as one "request" regardless of how many bookmakers/markets are returned, but you still need per-league calls.

**Consequences:**
- Odds data becomes stale (hours or days old) once the budget is exhausted
- Affiliate revenue depends on accurate, current odds -- stale odds drive users to competitors
- Upgrading to the $25/month tier (20,000 requests) solves the problem but adds to baseline costs before any revenue

**Prevention:**
- Cache odds aggressively. Odds for matches more than 2 days away change slowly -- refresh daily, not every 15 minutes
- Tiered refresh strategy:
  - Matches > 48 hours away: refresh once daily
  - Matches 24-48 hours away: refresh every 4 hours
  - Matches < 24 hours away: refresh every 30 minutes
  - Match day (< 3 hours to kickoff): refresh every 15 minutes
- Use API-Football's built-in odds endpoint instead of a separate API. API-Football Pro tier ($49.99/month) includes odds data, eliminating a separate API cost
- Budget for the $25/month Odds API tier from the start. The free tier is only viable for development

**Detection:** Track remaining API budget and alert at 50% consumption. Log the `X-Requests-Remaining` header from every Odds API response.

**Phase:** Phase 3 (betting/odds integration). This is a monetisation feature and should not consume development API budget.

**Confidence:** MEDIUM -- specific Odds API pricing and request counting should be verified against current documentation.

---

## Minor Pitfalls

Mistakes that cause annoyance or minor issues but are fixable.

---

### Pitfall 14: Zone Configurations Change Between Seasons

**What goes wrong:** Hardcoding Champions League spots, Europa League spots, and relegation zones. These change based on coefficient rankings, fair play standings, and other teams' results in European competitions. For example, if a country's cup winner already qualifies through league position, the Conference League spot slides down.

**Prevention:**
- Store zone configurations in the database per league per season, not in application code
- Check official league sources at season start and update zone configs
- Display a "zones may change" disclaimer for borderline positions

**Phase:** Phase 1 (league configuration).

**Confidence:** HIGH -- zone changes happen every 2-3 years per league.

---

### Pitfall 15: Team Relegation and Promotion Between Seasons

**What goes wrong:** Teams that were in the Big 5 last season are relegated, and new teams are promoted. The system needs to handle team roster changes between seasons, including new team logos, names, slugs, and historical data continuity.

**Prevention:**
- Design the data model with season-scoping from the start. The `teams` table should be season-independent, but `standings` and `matches` are season-scoped
- Build a season transition script that fetches the new season's team list from the API and creates any missing teams
- Handle promoted teams gracefully in comparison features ("at this point last season" -- the team wasn't in this league last season)

**Phase:** Phase 1 (data model design). Season transitions only happen once a year but must be designed for from the start.

**Confidence:** HIGH -- relegation/promotion happens every season.

---

### Pitfall 16: Vercel Response Body Size Limit

**What goes wrong:** A full league table response with all standings, sparkline data, form arrays, and position history for 20 teams can exceed Vercel's 4.5 MB response body limit if not carefully managed.

**Prevention:**
- Paginate or split responses: send table data separately from sparkline data
- Use compression (Vercel enables gzip by default, but the 4.5 MB limit applies to uncompressed data)
- Send sparkline data as compact arrays of integers, not full JSON objects
- Avoid sending the full 38-matchweek position history in the main table response -- lazy-load it when the sparkline is rendered

**Detection:** Monitor response sizes during development. If any API route returns more than 2 MB, investigate.

**Phase:** Phase 1 (API design).

**Confidence:** HIGH -- verified from Vercel documentation (4.5 MB limit).

---

### Pitfall 17: Abandoned and Void Matches

**What goes wrong:** Not handling matches that are abandoned mid-game, voided, or awarded (e.g., 3-0 forfeit). These rare events break the standard "scheduled -> live -> finished" flow.

**Prevention:**
- Handle all API-Football match statuses including `ABD` (abandoned), `AWD` (awarded/walkover), `WO` (walkover), and `CANC` (cancelled)
- Awarded matches (e.g., 3-0 walkovers) should be treated as finished with the awarded score for table calculation purposes
- Abandoned matches that are replayed: the original match should be marked as void and not counted in statistics

**Phase:** Phase 1 (match status handling). Rare but must be handled correctly when it occurs.

**Confidence:** MEDIUM -- match abandonments happen 1-2 times per season across the Big 5.

---

### Pitfall 18: League Table Spec Mentions Planetscale but Project Uses Neon

**What goes wrong:** The spec references Planetscale (MySQL) in several places, but PROJECT.md specifies Neon (Postgres). SQL syntax differences between MySQL and Postgres are significant: JSON column handling, `ENUM` types, auto-increment behavior, and date functions differ.

**Prevention:**
- Do not copy SQL from the spec verbatim. The `ENUM` type used in the spec's schema exists in Postgres but is handled differently. `JSON` columns should be `JSONB` in Postgres for better query performance
- Use Drizzle ORM or Prisma to abstract SQL differences. If using raw SQL, audit every query for Postgres compatibility
- The spec's `UNIQUE KEY` syntax should be `UNIQUE` (constraint) or `CREATE UNIQUE INDEX` in Postgres
- Test all database operations against Neon specifically, not a local MySQL instance

**Phase:** Phase 1 (database setup). Address immediately when translating the spec to implementation.

**Confidence:** HIGH -- the spec explicitly uses MySQL syntax that will not work in Postgres.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: Core tables | Tiebreaker rules wrong for H2H leagues | Unit test with real tied-team scenarios from every league |
| Phase 1: Data pipeline | API budget exhaustion during development | Build file-cache proxy before any API calls |
| Phase 1: Data model | Matchweek as clean sequential concept | Snapshot per match, not per matchweek |
| Phase 1: Database | MySQL syntax from spec used in Postgres | Audit all SQL, use JSONB, fix ENUM/UNIQUE syntax |
| Phase 1: Caching | Race conditions on concurrent match completions | Distributed lock per league, versioned cache keys |
| Phase 2: Sparklines | SVG sparklines cause mobile jank | Use Canvas-based rendering, virtualise table rows |
| Phase 2: Real-time | SSE connections killed by Vercel function timeout | Use polling with smart intervals, or external real-time service |
| Phase 2: Localisation | Team names and number formats wrong per locale | Database-driven team names, use `Intl` API |
| Phase 2: Timeline | Matchweek gaps from postponed fixtures | Date-based or match-count-based timeline instead |
| Phase 3: Betting | Illegal odds display in Italy, restricted in France/Spain/Germany | Geo-detection with per-country content rules, default to no-odds |
| Phase 3: Social media | Account suspension from automation detection | Rate limit posts, vary content, mix with manual engagement |
| Phase 3: Odds refresh | API budget consumed in days at 15-min intervals | Tiered refresh based on proximity to kickoff |

---

## Sources

- Vercel Functions Duration Limits: [official documentation](https://vercel.com/docs/functions/configuring-functions/duration) -- verified 2026-02-04. Hobby: 300s max (fluid compute), 60s (without). Pro: 800s (fluid compute), 300s (without).
- Vercel Functions Limitations: [official documentation](https://vercel.com/docs/functions/limitations) -- verified 2026-02-04. 4.5 MB response body limit, 1024 file descriptors, 250 MB bundle size.
- Football-League-MVP-Spec.md: project specification document, internal.
- League tiebreaker rules: Based on established knowledge of UEFA member association regulations. Premier League uses GD, La Liga/Serie A use H2H. Should be verified against current season regulations at implementation time.
- Gambling regulations: Based on general knowledge of European gambling law. Italy's Dignity Decree (2019), Spain's Royal Decree 958/2020, France's ANJ, UK Gambling Commission, Germany's Interstate Treaty. Legal advice recommended before launching betting features.
- API-Football documentation: Based on known API structure. Specific endpoint behaviors and rate limits should be verified against current API-Football v3 documentation during Phase 1.
- Neon Postgres: Based on general knowledge of serverless Postgres cold start behavior. Specific cold start times and plan limits should be verified against current Neon documentation.
