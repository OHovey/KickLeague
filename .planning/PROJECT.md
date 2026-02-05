# FootballPulse

## What This Is

FootballPulse is a CoinMarketCap-inspired football league table and statistics platform covering Europe's Big 5 leagues (Premier League, La Liga, Bundesliga, Serie A, Ligue 1). It provides information-dense dashboards with real-time standings, match data, historical trends via an interactive season timeline, betting odds comparison, and automated AI-powered social media content generation for organic growth.

## Core Value

Football fans can see league standings with rich visual context — sparklines, trend indicators, form runs, position history, and comparative stats — presented with the information density of a financial dashboard, not the sparse tables found on most football sites.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] League table with full stats, position change indicators, form column, and sparkline trends for all Big 5 leagues
- [ ] League switching with full-page theming (colours, branding per league)
- [ ] Recent matches and upcoming fixtures tables with expandable detail rows
- [ ] Team detail pages with tabbed stats (overview, performance, squad, fixtures, H2H)
- [ ] Match detail pages for completed and upcoming matches
- [ ] Interactive season timeline — drag/tap to view historical table states at any matchweek
- [ ] Mobile-first responsive design with condensed mobile columns and expandable rows
- [ ] Betting odds display with multi-bookmaker comparison and affiliate links
- [ ] Automated social media posting (X, Instagram) triggered by newsworthy match events
- [ ] Localisation for 5 languages (EN, ES, DE, IT, FR)
- [ ] Data pipeline with polling, match completion detection, table recalculation, and cache invalidation
- [ ] Real-time push updates to connected clients (SSE)

### Out of Scope

- Real-time live match tracking (live scores updating second-by-second) — high complexity, not core to league table value
- User accounts and authentication — not needed for v1 information consumption
- Scenario modelling / "what if" calculator — deferred to post-launch
- Push notifications — requires user accounts
- Additional leagues beyond Big 5 — focus on quality over breadth for v1
- Mobile native app — web-first, responsive design covers mobile
- Video content — storage/bandwidth costs, not core value
- Live odds updating during matches — deferred, pre-match odds sufficient for v1

## Context

**Domain:** Football statistics and league standings for the European Big 5 leagues. The target audience is football fans who want more data density than typical sports sites provide — think CoinMarketCap but for football.

**Inspiration:** CoinMarketCap's dashboard aesthetic — sparklines in tables, trend indicators, information density, clean dark themes.

**Data sources:**
- Primary: API-Football (via RapidAPI) — free tier for development (100 req/day), Pro tier ($49.99/month) for production
- Odds: The Odds API — free tier (500 req/month), paid from $25/month
- Backup: Football-Data.org — free, rate-limited, for validation

**League-specific rules:** Each league has different tiebreaker orders (GD vs H2H priority), different zone configurations (Champions League spots, relegation playoff rules), and different team counts (18 vs 20).

**Monetisation strategy:** Betting affiliate links (primary, ~70% projected revenue), display advertising (secondary), premium tier (tertiary, post-launch). Projected ~$100-150/month infrastructure cost, revenue target of $5,900/month by month 10-12.

**Existing spec:** A detailed product specification exists at `football-league-mvp-spec.md` covering page layouts, data models, SQL schema, API endpoints, caching strategy, social media automation logic, and monetisation projections.

## Constraints

- **Tech stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Zustand, TanStack Query, Recharts, Framer Motion, next-intl for i18n
- **Database**: PostgreSQL (Neon or Supabase — serverless, modern alternative to Planetscale)
- **Cache**: Upstash Redis (serverless, Vercel integration)
- **Queue**: Upstash QStash (serverless job queue)
- **Hosting**: Vercel
- **API budget**: Free tier during development; ~$100-150/month total infrastructure at production
- **API rate limits**: 100 requests/day on API-Football free tier during development — requires efficient polling and caching
- **League data**: 5 leagues, ~96 teams, ~380 matches per league per season = ~1,900 matches total

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Modernize stack from spec (Next.js 15, Postgres over MySQL) | Spec referenced Next.js 14 and Planetscale; both have moved on. Postgres is more flexible and Neon/Supabase offer better free tiers | -- Pending |
| API-Football free tier for development | Real data from day one; 100 req/day sufficient for development with proper caching | -- Pending |
| Phased delivery: core tables first, then enhancements, then monetisation | Validates core value (information-dense tables) before investing in affiliate/social complexity | -- Pending |
| Dark theme as default | Matches CoinMarketCap aesthetic and league branding works better on dark backgrounds | -- Pending |

---
*Last updated: 2026-02-04 after initialization*
