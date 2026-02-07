# KickLeague

## What This Is

KickLeague is a CoinMarketCap-inspired football league table and statistics platform covering Europe's Big 5 leagues (Premier League, La Liga, Bundesliga, Serie A, Ligue 1). It provides information-dense dashboards with real-time standings, match data, team analytics, historical trends via an interactive season timeline, betting odds comparison with geo-compliance, and 5-language localisation.

## Core Value

Football fans can see league standings with rich visual context — sparklines, trend indicators, form runs, position history, and comparative stats — presented with the information density of a financial dashboard, not the sparse tables found on most football sites.

## Requirements

### Validated

- ✓ League table with full stats, position change indicators, form column, and sparkline trends for all Big 5 leagues — v1
- ✓ League switching with full-page theming (colours, branding per league) — v1
- ✓ Recent matches and upcoming fixtures tables with inline H2H and form display — v1
- ✓ Team detail pages with tabbed stats (overview, performance, squad, fixtures) — v1
- ✓ Match detail pages for completed and upcoming matches — v1
- ✓ Interactive season timeline — drag/tap to view historical table states at any matchweek — v1
- ✓ Mobile-first responsive design with condensed mobile columns and expandable rows — v1
- ✓ Betting odds display with multi-bookmaker comparison, affiliate links, and geo-compliance — v1
- ✓ Localisation for 5 languages (EN, ES, DE, IT, FR) with locale-aware formatting — v1
- ✓ Affiliate link config, link builder, pipeline enrichment, geo-aware filtering — v1.1
- ✓ Data pipeline with polling, match completion detection, table recalculation, and cache invalidation — v1
- ✓ Real-time push updates to connected clients (smart polling) — v1

### Active

- [ ] Full rebrand from KickLeague/KickLeague to KickLeague (code, UI, package.json, repo, metadata) — v1.2
- [ ] Site header with logo/wordmark and locale switcher on all pages via layout — v1.2
- [ ] Homepage three-card hero row with key stat highlights (Top Scorer, Biggest Upset, Form Team) — v1.2
- [ ] Full i18n wiring: audit all components, wire every user-visible string to message files — v1.2
- [ ] Tech debt: orphaned getTeamName wiring, hardcoded season '2025' — v1.2
- [ ] Full SEO: meta tags, Open Graph, sitemap.xml, robots.txt, JSON-LD, hreflang, canonicals, semantic HTML, page speed — v1.2
- [ ] Google AdSense integration with responsive ad slots on key pages — v1.2

### Out of Scope

- Real-time live match tracking (live scores updating second-by-second) — high complexity, not core to league table value
- User accounts and authentication — not needed for information consumption
- Scenario modelling / "what if" calculator — deferred to post-launch
- Push notifications — requires user accounts
- Additional leagues beyond Big 5 — focus on quality over breadth
- Mobile native app — web-first, responsive design covers mobile
- Video content — storage/bandwidth costs, not core value
- Live odds updating during matches — pre-match odds sufficient
- Automated social media posting — deferred to v2 (complexity, requires API upgrade first)

## Context

**Domain:** Football statistics and league standings for the European Big 5 leagues. The target audience is football fans who want more data density than typical sports sites provide — think CoinMarketCap but for football.

**Inspiration:** CoinMarketCap's dashboard aesthetic — sparklines in tables, trend indicators, information density, clean dark themes.

**Current state (v1 shipped):**
- 122 TypeScript source files, 16,526 LOC
- 9 database tables + 4 enums (Drizzle ORM, PostgreSQL/Neon)
- 5 locale message files with next-intl routing
- Automated polling pipeline with QStash cron + Vercel cron
- Geo-compliance system for betting content (8 Tier 1 countries, Italy banned)

**Data sources:**
- Primary: API-Football (via RapidAPI) — free tier for development (100 req/day), Pro tier ($49.99/month) for production
- Odds: The Odds API — free tier (500 req/month), paid from $25/month
- Backup: Football-Data.org — free, rate-limited, for validation

**League-specific rules:** Each league has different tiebreaker orders (GD vs H2H priority), different zone configurations (Champions League spots, relegation playoff rules), and different team counts (18 vs 20).

**Monetisation strategy:** Betting affiliate links (primary, ~70% projected revenue), display advertising (secondary), premium tier (tertiary, post-launch). Projected ~$100-150/month infrastructure cost, revenue target of $5,900/month by month 10-12.

**Known tech debt (from v1 audit — targeted for v1.2):**
- Team name translation helper (getTeamName) exists but never called — team names always English
- Hardcoded season '2025' in LeagueTableWrapper
- UI text still hardcoded English in many components despite message files existing

## Constraints

- **Tech stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Recharts, Framer Motion (motion), NumberFlow, next-intl, nuqs, Drizzle ORM
- **Database**: PostgreSQL (Neon — serverless)
- **Queue**: Upstash QStash (serverless job queue)
- **Hosting**: Vercel
- **API budget**: Free tier during development; ~$100-150/month total infrastructure at production
- **API rate limits**: 100 requests/day on API-Football free tier during development — requires efficient polling and caching
- **League data**: 5 leagues, ~96 teams, ~380 matches per league per season = ~1,900 matches total

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js 16 + Postgres over spec's Next.js 14 + MySQL | Spec referenced Next.js 14 and Planetscale; both have moved on. Postgres is more flexible and Neon offers better free tier | ✓ Good — no issues |
| API-Football free tier for development | Real data from day one; 100 req/day sufficient for development with proper caching | ✓ Good — cache proxy eliminates repeated API calls |
| Phased delivery: core tables first, then enhancements, then monetisation | Validates core value (information-dense tables) before investing in affiliate/social complexity | ✓ Good — 8 phases delivered in 2 days |
| Dark theme as default | Matches CoinMarketCap aesthetic and league branding works better on dark backgrounds | ✓ Good — league gradient theming works well on dark |
| Drizzle ORM over Prisma | Lighter, SQL-closer, better for complex queries (aggregations, window functions) | ✓ Good — no ORM limitations hit |
| Server actions for client-server data fetching | Simpler than API routes for same-origin data, works with Next.js 16 patterns | ✓ Good — clean pattern throughout |
| nuqs for URL state management | Type-safe URL params for league, tab, matchweek selection; persists state across navigation | ✓ Good — works with Suspense boundaries |
| proxy.ts for middleware (Next.js 16 pattern) | Next.js 16 uses proxy.ts instead of middleware.ts | ✓ Good — handles i18n + geo-detection |
| Motion layout="position" for table animations | Prevents child element distortion during FLIP animations (vs layout={true}) | ✓ Good — smooth row reordering |
| Partial-accept Zod pattern | safeParse always, passthrough on objects, log warnings but return data on schema mismatch | ✓ Good — resilient to API schema changes |
| Smart polling over SSE | Browser polls /api/updates/check at adaptive intervals; simpler than SSE, works on all platforms | ✓ Good — no WebSocket server needed |
| Geo-compliance via proxy headers | proxy.ts sets x-show-betting header; components gate on showBetting prop | ✓ Good — single enforcement point |
| Combined betting + i18n in Phase 7 | Both are cross-cutting enhancements independent of core product | ✓ Good — natural pairing |

## Current Milestone: v1.2 Polish, SEO & Launch Readiness

**Goal:** Make KickLeague launch-ready with full rebrand, site header, homepage hero, complete i18n wiring, SEO foundations, display ads, and tech debt cleanup.

**Target features:**
- Full rebrand from KickLeague/KickLeague to KickLeague (code, UI, package.json, repo, all metadata)
- Site header component with KickLeague wordmark and locale switcher on every page
- Homepage hero row with three stat-highlight cards (Top Scorer, Biggest Upset, Form Team)
- Full i18n pass: wire every user-visible hardcoded English string to next-intl message files
- Tech debt fixes: timeline arrow navigation, getTeamName wiring, dynamic season year
- Full SEO suite: meta tags, Open Graph, sitemap.xml, robots.txt, JSON-LD structured data, hreflang, canonical URLs, semantic HTML audit, page speed optimization
- Google AdSense integration with responsive ad units on key pages

---
*Last updated: 2026-02-06 after v1.2 milestone start*
