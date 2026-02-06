# Milestone v1: MVP

**Status:** SHIPPED 2026-02-06
**Phases:** 1-8
**Total Plans:** 26

## Overview

FootballPulse delivers a CoinMarketCap-inspired football statistics platform across 8 phases. The journey starts with data foundations (schema, API client, seeding), builds the core league table experience with sparklines and league theming, expands into match and team detail pages, adds the interactive season timeline, automates the data pipeline for live updates, layers betting odds for monetisation, finishes with 5-language localisation, and closes with a gap fix for team fixture odds threading.

## Phases

### Phase 1: Data Foundation
**Goal**: All Big 5 league data is seeded and queryable -- the application has a working database with current-season fixtures, standings, and team data, plus a rate-limited API client that protects against budget exhaustion
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md -- Project scaffolding and complete PostgreSQL database schema with Drizzle ORM
- [x] 01-02-PLAN.md -- API-Football client with rate limiting, Zod validation, and file-cache proxy
- [x] 01-03-PLAN.md -- Data seeding pipeline for all 5 leagues with CLI interface

### Phase 2: League Tables & Navigation
**Goal**: Users can view information-dense league tables with sparklines, form guides, zone colouring, position change indicators, and full-page league theming across all 5 leagues on any device
**Depends on**: Phase 1
**Requirements**: TABL-01, TABL-02, TABL-03, TABL-04, TABL-05, TABL-06, TABL-07, LEAG-01, LEAG-02, LEAG-03, LEAG-04, MOBI-01, MOBI-02, MOBI-03
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
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md -- Match query layer, date utilities, and match list page with Results/Fixtures tabs
- [x] 03-02-PLAN.md -- Match detail page for completed and upcoming matches (score hero, stats, events, H2H, form, comparative stats)
- [x] 03-03-PLAN.md -- Home page match preview section and header navigation

### Phase 4: Team Detail Pages
**Goal**: Users can explore any team's season in depth through a tabbed detail page covering overview stats, performance analytics, squad data, and fixture schedule
**Depends on**: Phase 3
**Requirements**: TEAM-01, TEAM-02, TEAM-03, TEAM-04, TEAM-05
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md -- Team query layer, page route, hero section, and tab navigation
- [x] 04-02-PLAN.md -- Overview and performance tabs with charts (bump chart, cumulative points, goals by period, xG, home/away splits)
- [x] 04-03-PLAN.md -- Squad tab, fixtures tab, and team page link integration across existing components

### Phase 5: Season Timeline
**Goal**: Users can scrub through the season to see how the league table looked at any point in history, with smooth animated transitions as teams move up and down
**Depends on**: Phase 2
**Requirements**: TIME-01, TIME-02, TIME-03, DATA-05
**Plans**: 3 plans

Plans:
- [x] 05-01-PLAN.md -- Historical standings data layer + animated div-based CSS Grid table with Motion and NumberFlow
- [x] 05-02-PLAN.md -- Timeline UI with drag/tap/auto-play, historical banner, and full page integration
- [x] 05-03-PLAN.md -- Navigation arrows for ~5 week jumps on the timeline strip

### Phase 6: Live Data Pipeline
**Goal**: The platform stays current without manual intervention -- matches are polled automatically, standings recalculate on match completion, caches invalidate, and connected browsers receive updates in near real-time
**Depends on**: Phase 1, Phase 2
**Requirements**: DATA-03, DATA-04, DATA-06
**Plans**: 3 plans

Plans:
- [x] 06-01-PLAN.md -- Server-side pipeline: api_call_log schema, shared status-map, fixture-window detection, match polling, QStash cron route
- [x] 06-02-PLAN.md -- Match completion chain, standings recalculation, daily resync with drift detection, Vercel cron route
- [x] 06-03-PLAN.md -- Browser smart polling: usePolling hook, /api/updates/check route, DataFreshness indicator, LeagueTableWrapper integration

### Phase 7: Betting, Odds & Localisation
**Goal**: Users can compare betting odds across bookmakers with proper legal compliance per jurisdiction, and the entire platform is available in 5 languages with locale-aware formatting
**Depends on**: Phase 3
**Requirements**: ODDS-01, ODDS-02, ODDS-03, ODDS-04, I18N-01, I18N-02, I18N-03, I18N-04
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
**Gap Closure**: Closes integration gap (TeamTabs -> FixturesTab showBetting) and E2E flow gap (geo-compliance on team pages) from v1 audit
**Plans**: 1 plan

Plans:
- [x] 08-01-PLAN.md -- Thread showBetting through TeamTabs to FixturesTab

## Progress

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

---

## Milestone Summary

**Key Decisions:**
- Next.js 16 + Postgres/Neon over spec's Next.js 14 + MySQL (good)
- Drizzle ORM for SQL-close queries with complex aggregations
- Server actions for all client-server data fetching
- nuqs for URL state management (league, tab, matchweek)
- proxy.ts for combined i18n + geo-detection middleware
- Motion layout="position" for animated table row reordering
- Smart polling over SSE for browser updates
- Partial-accept Zod pattern for API resilience

**Issues Resolved:**
- H2H tiebreaker calculation for multi-way ties (Phase 2)
- Fixture events batch seeding on API-Football free tier (Phase 1)
- showBetting prop not threaded through MatchList chain (Phase 7 fix)
- showBetting prop not threaded through TeamTabs to FixturesTab (Phase 8 fix)

**Technical Debt Incurred:**
- Timeline navigation arrows scroll-only (regression from 2b5c055, correct code existed in f536af0)
- Team name translation helper orphaned (getTeamName never called in components)
- Hardcoded season '2025' in LeagueTableWrapper
- Phase 2 missing formal VERIFICATION.md
- UI text hardcoded English in many components despite message files existing

---

_For current project status, see .planning/PROJECT.md_
