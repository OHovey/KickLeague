# Feature Landscape

**Domain:** Football statistics and league table platforms
**Project:** KickLeague
**Researched:** 2026-02-04
**Competitors surveyed:** FotMob, WhoScored, SofaScore, Transfermarkt, FlashScore
**Overall confidence:** MEDIUM (based on training data knowledge of competitors; web verification tools were unavailable during this research session)

---

## Competitor Feature Matrix

Before categorising features, here is what each major competitor offers. This grounds the table-stakes vs differentiator analysis in observable reality rather than assumption.

| Feature Area | FotMob | WhoScored | SofaScore | Transfermarkt | FlashScore |
|---|---|---|---|---|---|
| League tables | Yes | Yes | Yes | Yes | Yes |
| Live scores | Yes (core) | Yes | Yes (core) | Limited | Yes (core) |
| Match stats | Yes | Yes (deep) | Yes (deep) | Basic | Yes |
| Player ratings | Yes (own) | Yes (core USP) | Yes (own) | No | Yes (basic) |
| xG data | Yes | No | Yes | No | No |
| Heatmaps | No | Yes | Yes | No | No |
| Transfer values | No | No | No | Yes (core USP) | No |
| H2H records | Yes | Yes | Yes | Yes | Yes |
| Form guides | Yes | Yes | Yes | No | Yes |
| Odds/betting | Yes | Yes | Yes | No | Yes |
| Push notifications | Yes (mobile) | No | Yes (mobile) | No | Yes (mobile) |
| Multi-league coverage | 100+ leagues | 100+ leagues | 100+ leagues | 100+ leagues | 100+ leagues |
| Season position chart | Yes | Yes | Partial | No | No |
| Squad/roster data | Yes | Yes | Yes | Yes (deep) | Yes |
| Video highlights | No | No | No | No | Links |
| Social/community | No | No | Polls | Forum | No |
| Dark mode | Yes | No | Yes | No | No |
| Localisation | Multi-lang | English-focused | Multi-lang | Multi-lang | Multi-lang |
| Sparklines in tables | No | No | No | No | No |
| Information density | Medium | Medium-High | Medium | High (text) | Low-Medium |

**Key observation:** No competitor does CoinMarketCap-style sparklines directly in league tables. This validates KickLeague's core differentiator. Transfermarkt is the closest to "information dense" but its density is text-heavy, not visual. FotMob and SofaScore are the UX benchmark for modern football data presentation.

---

## Table Stakes

Features users expect from any football statistics platform. Missing any of these means users will leave for a competitor that has them. These are non-negotiable for launch.

| Feature | Why Expected | Complexity | Competitor Coverage | Notes |
|---|---|---|---|---|
| **League table with core stats** (P, W, D, L, GF, GA, GD, Pts) | Literally the primary product. Every competitor has this. Users come for the table. | Low | 5/5 competitors | Must include zone colouring (CL, EL, relegation). Must handle league-specific tiebreakers correctly. |
| **Position change indicators** | Users want to know if their team moved up or down since last matchday. FotMob, SofaScore both show this. | Low | 4/5 competitors | Simple delta since last matchweek. The spec's multi-granularity (1/3/season) is a differentiator on top of table stakes. |
| **Form guide (last 5 results)** | Standard column on every league table. W/D/L dots or letters. Expected by all football fans. | Low | 4/5 competitors | Colour-coded dots (green/grey/red) are the standard. Hover to show opponent/score is a nice enhancement. |
| **Recent results list** | Users need to see what happened in the latest matchweek. | Low | 5/5 competitors | Scores, teams, date. Expandable detail is enhancement, not table stakes. |
| **Upcoming fixtures list** | Users want to know when the next matches are. Kickoff times in local timezone. | Low | 5/5 competitors | Must handle timezone conversion. Must show matchweek grouping. |
| **Team detail page** | Clicking a team name must lead somewhere meaningful. Basic season stats, squad, fixtures. | Medium | 5/5 competitors | Overview with season summary, recent results, upcoming fixtures at minimum. |
| **Match detail page** | Clicking a score/fixture must show match information. Events timeline, basic stats for completed matches. | Medium | 5/5 competitors | Goals, cards, substitutions timeline. Possession, shots, shots on target bars. |
| **League switching** | Must support multiple leagues. Single-league is not viable for a platform. | Low | 5/5 competitors | Tab or dropdown navigation. URL-based routing. Theme switching per league is differentiator. |
| **Mobile responsive design** | 60-70% of sports traffic is mobile. Not optional. | Medium | 5/5 competitors | Condensed column set on mobile. Expandable rows for detail. Touch-friendly interactions. |
| **Head-to-head records** | Pre-match context. All competitors show this on match pages. | Low-Medium | 5/5 competitors | Last 5 meetings, all-time record, venue-specific record. |
| **Team logos everywhere** | Visual identification. Tables, fixtures, match pages all need team crests. | Low | 5/5 competitors | Source from API. Cache locally. |
| **Fast page loads** | Sports fans are impatient. SofaScore and FotMob are instant. If the table takes 3 seconds to load, users leave. | Medium | 5/5 competitors | SSR/SSG for initial paint. Cache-first strategy. CDN edge caching. |
| **Match stats (completed)** | Possession, shots, shots on target, corners, fouls. Bar chart comparison format. | Low-Medium | 5/5 competitors | Visual bar comparison is the standard. FotMob and SofaScore do this well. |

**Total table stakes: 13 features.** These must all be present in the launch product. Without them, users will immediately recognise the platform as inferior and leave.

---

## Differentiators

Features that set KickLeague apart. Not expected by users, but create the "wow" factor and justify return visits. Ordered by impact-to-effort ratio.

### Tier 1: Core Differentiators (define the product identity)

| Feature | Value Proposition | Complexity | Competitor Status | Notes |
|---|---|---|---|---|
| **Sparklines in league table** | The signature CoinMarketCap touch. No football site puts mini position-over-season charts directly in the standings table. Instantly communicates trajectory. | Medium | 0/5 competitors do this | This IS the product. Small SVG or canvas charts showing position (inverted Y) over matchweeks. Must be performant -- 20 sparklines rendering simultaneously. |
| **Financial dashboard aesthetic** | Dark theme, information density, data-forward design. Current football sites are either sparse (FlashScore) or cluttered-ugly (WhoScored). A clean, dense, dark dashboard is novel in football. | Medium | 0/5 competitors nail this | Think Bloomberg Terminal meets football. Requires careful typography, spacing, colour hierarchy. Design system investment pays off across every page. |
| **Full-page league theming** | Entire UI shifts colour scheme per league. Purple/green for PL, orange for La Liga, red for Bundesliga. No competitor does this. Creates emotional connection. | Medium | 0/5 competitors do this | CSS custom properties make this technically straightforward. The design work is the challenge -- each theme must be cohesive and readable. |
| **Interactive season timeline** | Scrub through the season to see the table at any historical matchweek. Brings the table to life. Answers "where were they at Christmas?" instantly. | High | 0/5 competitors (WhoScored has a static version) | Requires storing table snapshots per matchweek. Slider/scrubber UI with smooth table transitions. High impact, high effort. |

### Tier 2: Strong Differentiators (competitive advantage)

| Feature | Value Proposition | Complexity | Competitor Status | Notes |
|---|---|---|---|---|
| **Multi-granularity position change** | Show position change since last match, last 3 matches, and same point last season on hover. More context than any competitor provides. | Low | 0/5 show all three; most show only "since last match" | Low effort, high perceived value. Requires storing last-season position data. |
| **Points accumulation chart (team page)** | Cumulative points over season with last-season overlay. Shows pace visually. "Are they ahead or behind where they were last year?" | Medium | 1/5 (FotMob has this in some form) | Recharts line chart. Two series on same axes. Clean and effective. |
| **Goals by time period** | Bar chart showing when a team scores/concedes (0-15, 15-30, 30-45, 45-60, 60-75, 75-90). Reveals tactical patterns. | Medium | 2/5 (WhoScored, SofaScore have this) | Requires aggregating match event data by minute ranges. Useful for the analytics-minded fan. |
| **Fixture difficulty indicator** | Visual indicator of remaining schedule strength. "Easy run-in" or "nightmare fixtures ahead." | Medium | 0/5 do this well | Calculate based on opponent league position. Could be colour-coded dots, strength bar, or SOS metric. Unique value for late-season analysis. |
| **xG analysis** | Expected goals vs actual goals. xG league table. Over/underperformance tracking. Growing mainstream adoption. | Medium | 2/5 (FotMob, SofaScore) | Depends on API data availability. API-Football provides xG for most matches. Display as delta: "Arsenal: +8.4 xG overperformance." |
| **Scoring-first record** | Team's W/D/L record when scoring first vs conceding first. Reveals mentality/resilience. | Low | 1/5 (WhoScored has this buried) | Simple aggregation from match data. Interesting stat that fans cite but can't easily find. |

### Tier 3: Nice-to-Have Differentiators (post-launch)

| Feature | Value Proposition | Complexity | Competitor Status | Notes |
|---|---|---|---|---|
| **"What if" scenario calculator** | Drag teams up/down, input hypothetical results, see table impact. Extremely engaging late-season. | High | 0/5 have this well | Deferred in spec to post-launch. Correct decision -- complex to build well, but massive engagement potential. |
| **Odds comparison with best-odds highlighting** | Multi-bookmaker comparison showing which bookie offers best value. Affiliate revenue driver. | Medium | 3/5 (FotMob, SofaScore, FlashScore) | Competitors have this but it is a revenue feature, not a competitive differentiation feature. KickLeague's version should be cleaner and more prominent. |
| **Social media automation** | Auto-generated match posts for X and Instagram. Growth channel, not a user-facing feature. | High | 0/5 do this as a product feature | This is a growth mechanism, not a product feature users see. Should be built after core product is solid. |
| **Season comparison mode** | Compare this season's trajectory with last season (or any historical season). | Medium | 1/5 (Transfermarkt has historical data) | Requires multi-season data ingestion. Very compelling for pre-season and title-race analysis. |
| **Embeddable widgets** | Let bloggers/podcasters embed KickLeague tables on their sites. Distribution channel. | Medium | 1/5 (Transfermarkt has this) | iframe widgets with branding. Growth mechanism that also provides backlinks for SEO. |

---

## Anti-Features

Features to deliberately NOT build. These are common in competitors but would either dilute KickLeague's focus, waste resources, or harm the product.

| Anti-Feature | Why Avoid | What to Do Instead |
|---|---|---|
| **Live score updates (second-by-second)** | Extremely high complexity (WebSocket infrastructure, sub-minute polling, real-time state management). FotMob, SofaScore, and FlashScore have massive engineering teams for this. It is their core product, not ours. Competing on live scores is a losing proposition. | Show "last updated" timestamps. Update tables when matches complete. Link out to a live score provider if needed. Our value is the table VIEW, not the live FEED. |
| **Player pages/profiles** | Deep player profiles are Transfermarkt's core product. Building a player database requires enormous data ingestion and maintenance. Not our differentiator. | Show player names in match events and squad lists. Link to Transfermarkt for full profiles if desired. Focus data investment on team-level analytics. |
| **Comprehensive player ratings** | WhoScored and SofaScore have proprietary rating algorithms built over years. Attempting our own ratings without the data depth invites unfavourable comparison. | Show goals, assists, minutes from API. Do not attempt to assign numerical player ratings. |
| **Video highlights** | Licensing costs, bandwidth costs, legal complexity. FlashScore links to third-party highlights. Not worth building. | Do not host or embed video. Optionally link to official league highlight channels. |
| **Community features (forums, comments, polls)** | Moderation overhead is enormous. Football communities are notoriously toxic. SofaScore has polls but they add noise, not signal. | No user-generated content. The product IS the data. Consider a curated insights/notes section written editorially instead. |
| **Fantasy football integration** | Requires a completely separate data model, scoring system, and user accounts. Different product entirely. | Do not build this. Different audience, different product. |
| **100+ league coverage at launch** | All competitors cover 100+ leagues. This requires massive API budget, data validation per league, and dilutes quality. | Launch with Big 5 only. Do them exceptionally well. Expand to additional European leagues (Eredivisie, Primeira Liga, Turkish Super Lig) post-traction. |
| **User accounts for v1** | Authentication, profile management, settings sync, GDPR compliance. Significant engineering overhead for features that don't generate revenue in v1. | Store preferences in localStorage. Add accounts when premium tier or personalisation features justify it. |
| **News/editorial content** | Requires writers or AI content that can't match established sports media. Dilutes the data-focused brand. | Do not write articles. Let the data speak. Social media posts are automated growth, not editorial content on-site. |
| **Match predictions/tips** | Legal grey area in many jurisdictions. Liability risk. Not our expertise. | Show odds from bookmakers. Let users draw their own conclusions. Do not make prediction claims. |
| **Native mobile app** | App store presence requires separate codebase (or React Native investment), app review cycles, update distribution. Web-first with PWA capabilities covers mobile. | Build an excellent mobile web experience. Consider PWA with install prompt. Native app only if web traffic proves sustained demand (100k+ monthly). |

---

## Feature Dependencies

Understanding what must be built before what. This directly informs phase structure.

```
Data Pipeline (API ingestion, DB storage)
  |
  +-- League Tables (standings calculation, tiebreakers)
  |     |
  |     +-- Position Change Indicators (requires previous matchweek data)
  |     |
  |     +-- Form Guide (requires match result history)
  |     |
  |     +-- Sparklines (requires position history across matchweeks)
  |     |
  |     +-- Season Timeline (requires table snapshots per matchweek)
  |     |
  |     +-- Zone Colouring (requires league-specific configuration)
  |
  +-- Recent Results / Upcoming Fixtures
  |     |
  |     +-- Match Detail Pages (requires match events + stats ingestion)
  |     |     |
  |     |     +-- H2H Records (requires historical match data)
  |     |     |
  |     |     +-- Odds Display (requires Odds API integration)
  |     |           |
  |     |           +-- Multi-Bookmaker Comparison (requires affiliate setup)
  |     |
  |     +-- Team Detail Pages (requires standings + match data)
  |           |
  |           +-- Performance Tab (requires aggregated match stats)
  |           |     |
  |           |     +-- xG Analysis (requires xG data from API)
  |           |     |
  |           |     +-- Goals by Period (requires match events with minutes)
  |           |     |
  |           |     +-- Scoring First Record (requires match timeline data)
  |           |
  |           +-- Squad Tab (requires player data from API)
  |           |
  |           +-- Fixtures Tab with Difficulty (requires opponent position data)
  |
  +-- League Theming (independent, can be built in parallel)
  |
  +-- Localisation (independent, can be built in parallel but best after UI stabilises)
  |
  +-- Social Media Automation (requires match completion detection + LLM integration)

Cache Layer (Redis) -- needed once data exists
  |
  +-- SSE Real-Time Updates (requires cache invalidation pipeline)
```

### Critical Path

The critical dependency chain for MVP is:

1. **Data pipeline** -- everything depends on having data
2. **Standings calculation** with correct tiebreakers -- the core product
3. **League table UI** with basic columns -- the core view
4. **Match/fixture lists** -- the secondary content
5. **Team and match detail pages** -- the click-through destinations

Sparklines, timeline, and odds are enhancements that layer on top of this chain.

---

## MVP Recommendation

### Must ship at launch (or users will not return)

1. League table with P, W, D, L, GF, GA, GD, Pts, form guide, position change
2. Zone colouring (CL, EL, Conference League, relegation)
3. League switching across all Big 5 leagues
4. Recent results and upcoming fixtures
5. Basic team detail page (overview, season stats, fixtures)
6. Basic match detail page (events, stats)
7. Mobile responsive layout
8. Dark theme default with league-specific accent colours
9. H2H records on match pages

### Should ship at launch (signature differentiators)

10. Sparklines in league table (this is the product identity -- ship it with MVP)
11. Full-page league theming (visually distinctive, moderate effort)
12. Financial dashboard aesthetic (design system investment)

### Defer to Phase 2

- Interactive season timeline (high complexity, requires snapshot infrastructure)
- Multi-granularity position change (requires previous-season data)
- Points accumulation charts on team pages
- Goals by time period charts
- xG analysis
- Odds display and comparison

### Defer to Phase 3+

- Fixture difficulty indicator
- Scoring-first records
- Social media automation
- Multi-bookmaker odds with affiliates
- Localisation (5 languages)
- Scenario calculator

### Rationale for ordering

The MVP must prove the core thesis: **"A CoinMarketCap-style league table is more compelling than what exists."** This means the table itself -- with sparklines, form, position changes, zone colours, dark theme, league theming -- must be excellent on day one. Everything else (odds, social, i18n) is layered on after the core experience validates.

Sparklines belong in MVP, not Phase 2, because without them KickLeague is just another league table site. They are the single feature that makes a first-time visitor say "this is different."

---

## Complexity Estimates

| Feature | Dev Effort | Design Effort | Data Dependency | Risk |
|---|---|---|---|---|
| League table (basic) | 2-3 days | 2 days | API-Football standings | Low |
| Form guide column | 0.5 days | 0.5 days | Match history | Low |
| Position change | 0.5 days | 0.5 days | Previous matchweek | Low |
| Zone colouring | 0.5 days | 0.5 days | League config | Low |
| Sparklines in table | 2-3 days | 1 day | Position history | Medium (performance with 20 charts) |
| League switching + theming | 2-3 days | 3 days | League config | Medium (theme consistency) |
| Recent results list | 1 day | 1 day | Match data | Low |
| Upcoming fixtures list | 1 day | 1 day | Fixture data | Low |
| Team detail page (basic) | 3-4 days | 2 days | Multiple endpoints | Medium |
| Match detail page | 2-3 days | 2 days | Match events + stats | Medium |
| H2H records | 1-2 days | 1 day | H2H API endpoint | Low |
| Mobile responsive | 3-4 days | 3 days | N/A | Medium (table layout challenges) |
| Data pipeline | 4-5 days | 0 days | API-Football | High (polling, error handling, rate limits) |
| Season timeline | 4-5 days | 2 days | Table snapshots | High (interaction design, data volume) |
| Odds integration | 2-3 days | 1 day | Odds API | Medium (API integration) |
| Localisation (5 langs) | 3-4 days | 1 day | Translation files | Medium (translation quality) |
| Social media automation | 5-7 days | 1 day | Match events + LLM | High (LLM integration, API quotas) |
| Scenario calculator | 5-7 days | 3 days | Current standings | High (complex state management) |

---

## Sources and Confidence

| Claim | Confidence | Source |
|---|---|---|
| Competitor feature coverage matrix | MEDIUM | Training data knowledge of FotMob, WhoScored, SofaScore, Transfermarkt, FlashScore as of early 2025. Features may have changed since. |
| No competitor has sparklines in league tables | MEDIUM | Based on extensive use of all five competitors in training data. This is a strong signal -- it is an unusual UI pattern for sports. Verify by checking competitors before building. |
| No competitor does full-page league theming | MEDIUM | Same basis. Competitors use league logos and headers but do not shift the entire colour scheme. |
| 60-70% mobile traffic for sports sites | MEDIUM | Industry standard widely cited in sports media analytics. |
| xG availability in API-Football | HIGH | Documented in API-Football documentation and widely used by developers. |
| Tiebreaker rules per league | HIGH | Well-documented by UEFA and league governing bodies. Confirmed in project spec. |
| Live scores require heavy infrastructure | HIGH | Well-understood engineering challenge. WebSocket management, sub-minute polling, state reconciliation are non-trivial at scale. |

**Gaps to validate before building:**
- Verify current competitor features by visiting each site (features may have been added/removed since training cutoff)
- Confirm API-Football free tier still offers 100 requests/day (API pricing changes frequently)
- Confirm The Odds API coverage for all Big 5 leagues
- Test sparkline rendering performance with 20 simultaneous charts in a table (prototype before committing)
