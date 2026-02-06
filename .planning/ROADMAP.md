# Roadmap: FootballPulse

## Overview

FootballPulse delivers a CoinMarketCap-inspired football statistics platform across 7 phases. The journey starts with data foundations (schema, API client, seeding), builds the core league table experience with sparklines and league theming, expands into match and team detail pages, adds the interactive season timeline, automates the data pipeline for live updates, layers betting odds for monetisation, and finishes with 5-language localisation. Each phase delivers a complete, verifiable capability that builds on what came before.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Data Foundation** - Database schema, API client, data seeding for all 5 leagues
- [x] **Phase 2: League Tables & Navigation** - Core product: information-dense league tables with sparklines, theming, and mobile layout
- [x] **Phase 3: Match & Fixture Pages** - Recent results, upcoming fixtures, and match detail pages
- [x] **Phase 4: Team Detail Pages** - Team pages with overview, performance, squad, and fixtures tabs
- [x] **Phase 5: Season Timeline** - Interactive historical timeline to scrub through past matchweeks
- [x] **Phase 6: Live Data Pipeline** - Automated polling, match detection, standings recalculation, and real-time client updates
- [x] **Phase 7: Betting, Odds & Localisation** - Multi-bookmaker odds comparison, affiliate links, geo-compliance, and 5-language i18n
- [x] **Phase 8: Team Fixtures Odds Fix** - Thread showBetting through TeamTabs to FixturesTab (audit gap closure)

## Phase Details

### Phase 1: Data Foundation
**Goal**: All Big 5 league data is seeded and queryable -- the application has a working database with current-season fixtures, standings, and team data, plus a rate-limited API client that protects against budget exhaustion
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. Developer can run a seed command and populate Postgres with current-season fixtures, standings, and team data for all 5 leagues
  2. API-Football client enforces rate limiting and validates all responses with Zod schemas, preventing malformed data from entering the database
  3. Local file-cache proxy transparently intercepts API calls during development so daily quota is not consumed on repeated runs
  4. Database schema supports league-specific configurations (tiebreaker rules, zone definitions, team counts) as data, not hardcoded logic
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md -- Project scaffolding and complete PostgreSQL database schema with Drizzle ORM
- [x] 01-02-PLAN.md -- API-Football client with rate limiting, Zod validation, and file-cache proxy
- [x] 01-03-PLAN.md -- Data seeding pipeline for all 5 leagues with CLI interface

### Phase 2: League Tables & Navigation
**Goal**: Users can view information-dense league tables with sparklines, form guides, zone colouring, position change indicators, and full-page league theming across all 5 leagues on any device
**Depends on**: Phase 1
**Requirements**: TABL-01, TABL-02, TABL-03, TABL-04, TABL-05, TABL-06, TABL-07, LEAG-01, LEAG-02, LEAG-03, LEAG-04, MOBI-01, MOBI-02, MOBI-03
**Success Criteria** (what must be TRUE):
  1. User can view a league table showing P, W, D, L, GF, GA, GD, Pts with correct zone colouring, form dots, position change arrows, and inline sparkline charts for any of the 5 leagues
  2. User can switch leagues via tab navigation and the entire page theme (colours, gradients, backgrounds) transitions smoothly to match the selected league's branding
  3. League-specific tiebreaker rules produce correct table ordering (H2H for La Liga and Serie A, GD for Premier League, Bundesliga, and Ligue 1) whenever teams are level on points
  4. On mobile, the table shows condensed columns (position, team, P, GD, Pts, sparkline) with full detail accessible by tapping a row to expand it
  5. Selected league persists across page reloads via URL parameter and localStorage
**Plans**: 5 plans

Plans:
- [x] 02-01-PLAN.md -- Standings calculator with configurable tiebreaker chains (TDD)
- [x] 02-02-PLAN.md -- League theming infrastructure, tab navigation, and URL persistence
- [x] 02-03-PLAN.md -- Core league table component with zone colouring
- [x] 02-04-PLAN.md -- Visual enhancements: form badges, position change, sparklines
- [x] 02-05-PLAN.md -- Mobile responsive layout with expandable rows

### Phase 3: Match & Fixture Pages
**Goal**: Users can browse recent results and upcoming fixtures for any league, and drill into individual match pages for detailed stats, events, and head-to-head records
**Depends on**: Phase 2
**Requirements**: MATL-01, MATL-02, MATL-03, MATL-04, MTCH-01, MTCH-02, MTCH-03
**Success Criteria** (what must be TRUE):
  1. User can view the last 10 completed matches for any league with scores, team names, and key match events
  2. User can view the next 10 upcoming fixtures with kickoff times displayed in their local timezone
  3. User can expand a match list row to see H2H summary and trend information without navigating away
  4. User can open a completed match page showing score, events timeline, match stats comparison bars, and head-to-head history
  5. User can open an upcoming match page showing odds comparison from multiple bookmakers, both teams' recent form, H2H last 5 meetings, and key comparative stats
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md -- Match query layer, date utilities, and match list page with Results/Fixtures tabs
- [x] 03-02-PLAN.md -- Match detail page for completed and upcoming matches (score hero, stats, events, H2H, form, comparative stats)
- [x] 03-03-PLAN.md -- Home page match preview section and header navigation

### Phase 4: Team Detail Pages
**Goal**: Users can explore any team's season in depth through a tabbed detail page covering overview stats, performance analytics, squad data, and fixture schedule
**Depends on**: Phase 3
**Requirements**: TEAM-01, TEAM-02, TEAM-03, TEAM-04, TEAM-05
**Success Criteria** (what must be TRUE):
  1. User can navigate to a team page and see a hero section with the team's logo, name, stadium, current position, points total, and recent form
  2. User can view an overview tab with season summary, position chart over time, cumulative points chart, and current form run
  3. User can view a performance tab with home/away splits, goals scored by 15-minute period, xG analysis (where data is available), clean sheets count, and scoring-first win/draw/loss record
  4. User can view a squad tab showing top scorers, top assisters, cards received, and minutes distribution across the squad
  5. User can view a fixtures tab with the next 5 upcoming matches including odds and fixture difficulty colouring, plus the last 10 results
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md -- Team query layer, page route, hero section, and tab navigation
- [x] 04-02-PLAN.md -- Overview and performance tabs with charts (bump chart, cumulative points, goals by period, xG, home/away splits)
- [x] 04-03-PLAN.md -- Squad tab, fixtures tab, and team page link integration across existing components

### Phase 5: Season Timeline
**Goal**: Users can scrub through the season to see how the league table looked at any point in history, with smooth animated transitions as teams move up and down
**Depends on**: Phase 2
**Requirements**: TIME-01, TIME-02, TIME-03, DATA-05
**Success Criteria** (what must be TRUE):
  1. User can see a timeline bar showing all matchweeks as filled (completed) or empty (upcoming) circles
  2. User can drag or tap to any completed matchweek and the league table updates to show the historical standings at that point
  3. Table rows animate smoothly when the selected matchweek changes, with teams visibly sliding to their new positions
**Plans**: 3 plans

Plans:
- [x] 05-01-PLAN.md -- Historical standings data layer + animated div-based CSS Grid table with Motion and NumberFlow
- [x] 05-02-PLAN.md -- Timeline UI with drag/tap/auto-play, historical banner, and full page integration
- [x] 05-03-PLAN.md -- Navigation arrows for ~5 week jumps on the timeline strip

### Phase 6: Live Data Pipeline
**Goal**: The platform stays current without manual intervention -- matches are polled automatically, standings recalculate on match completion, caches invalidate, and connected browsers receive updates in near real-time
**Depends on**: Phase 1, Phase 2
**Requirements**: DATA-03, DATA-04, DATA-06
**Success Criteria** (what must be TRUE):
  1. During match windows, the system automatically polls for match updates at 60-second intervals and detects match completions without human intervention
  2. When a match completes, standings are recalculated, Redis cache is invalidated, and ISR pages are revalidated within 2 minutes
  3. Connected browsers receive table updates without manual page refresh (via SSE or smart polling fallback)
  4. Off-peak polling is throttled to conserve API budget, with a daily full resync at 04:00 UTC to catch any missed updates
**Plans**: 3 plans

Plans:
- [x] 06-01-PLAN.md -- Server-side pipeline: api_call_log schema, shared status-map, fixture-window detection, match polling, QStash cron route
- [x] 06-02-PLAN.md -- Match completion chain, standings recalculation, daily resync with drift detection, Vercel cron route
- [x] 06-03-PLAN.md -- Browser smart polling: usePolling hook, /api/updates/check route, DataFreshness indicator, LeagueTableWrapper integration

### Phase 7: Betting, Odds & Localisation
**Goal**: Users can compare betting odds across bookmakers with proper legal compliance per jurisdiction, and the entire platform is available in 5 languages with locale-aware formatting
**Depends on**: Phase 3
**Requirements**: ODDS-01, ODDS-02, ODDS-03, ODDS-04, I18N-01, I18N-02, I18N-03, I18N-04
**Success Criteria** (what must be TRUE):
  1. User can view odds from multiple bookmakers on upcoming match pages, displayed in their preferred format (decimal, fractional, or American)
  2. Affiliate links track click-throughs and bookmaker display is geo-targeted to show only locally licensed operators
  3. Users in restricted jurisdictions (Italy: complete ban) see no betting content whatsoever; other restricted countries see only compliant bookmakers
  4. User can switch the UI between English, Spanish, German, Italian, and French with all labels, navigation, and team names translated
  5. Dates, times, and numbers format correctly per locale (e.g., 1,000 in EN vs 1.000 in DE), and kickoff times display in the user's timezone
**Plans**: 5 plans

Plans:
- [x] 07-01-PLAN.md -- Odds API client, database schema, Zod types, and format conversion (Wave 1)
- [x] 07-02-PLAN.md -- Multi-bookmaker odds display, affiliate click tracking, and page integration (Wave 3)
- [x] 07-03-PLAN.md -- Geo-detection, compliance config, and responsible gambling component (Wave 2)
- [x] 07-04-PLAN.md -- next-intl setup, locale routing, app restructure under [locale], language picker (Wave 1)
- [x] 07-05-PLAN.md -- Team name translations, locale-aware date/number formatting (Wave 2)

### Phase 8: Team Fixtures Odds Fix
**Goal**: Betting odds display correctly on team fixture pages for users in non-restricted countries, completing the geo-compliance flow end-to-end
**Depends on**: Phase 7
**Requirements**: MATL-04 (partial), MTCH-03 (partial)
**Gap Closure**: Closes integration gap (TeamTabs → FixturesTab showBetting) and E2E flow gap (geo-compliance on team pages) from v1 audit
**Success Criteria** (what must be TRUE):
  1. Users in non-restricted countries see betting odds on team fixture pages (CompactOdds on upcoming fixtures)
  2. Users in restricted jurisdictions (Italy) continue to see no betting content on team fixture pages
  3. The showBetting prop flows from TeamTabs through to FixturesTab following the same pattern used in MatchListClient
**Plans**: 1 plan

Plans:
- [x] 08-01-PLAN.md -- Thread showBetting through TeamTabs to FixturesTab

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data Foundation | 3/3 | Complete | 2026-02-04 |
| 2. League Tables & Navigation | 5/5 | Complete | 2026-02-05 |
| 3. Match & Fixture Pages | 3/3 | Complete | 2026-02-05 |
| 4. Team Detail Pages | 3/3 | Complete | 2026-02-05 |
| 5. Season Timeline | 3/3 | Complete | 2026-02-05 |
| 6. Live Data Pipeline | 3/3 | Complete | 2026-02-05 |
| 7. Betting, Odds & Localisation | 5/5 | Complete | 2026-02-06 |
| 8. Team Fixtures Odds Fix | 1/1 | Complete | 2026-02-06 |
