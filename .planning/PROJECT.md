# KickLeague

## What This Is

KickLeague is a CoinMarketCap-inspired football league table and statistics platform covering Europe's Big 5 leagues (Premier League, La Liga, Bundesliga, Serie A, Ligue 1). It provides information-dense dashboards with real-time standings, match data, team analytics, historical trends via an interactive season timeline, betting odds comparison with geo-compliance, affiliate monetisation, full 5-language localisation, SEO discoverability, and display ad revenue — ready for public launch.

## Core Value

Football fans can see league standings with rich visual context — sparklines, trend indicators, form runs, position history, and comparative stats — presented with the information density of a financial dashboard, not the sparse tables found on most football sites.

## Requirements

### Validated

- ✓ League table with full stats, position change indicators, form column, and sparkline trends for all Big 5 leagues — v1.0
- ✓ League switching with full-page theming (colours, branding per league) — v1.0
- ✓ Recent matches and upcoming fixtures tables with inline H2H and form display — v1.0
- ✓ Team detail pages with tabbed stats (overview, performance, squad, fixtures) — v1.0
- ✓ Match detail pages for completed and upcoming matches — v1.0
- ✓ Interactive season timeline — drag/tap to view historical table states at any matchweek — v1.0
- ✓ Mobile-first responsive design with condensed mobile columns and expandable rows — v1.0
- ✓ Betting odds display with multi-bookmaker comparison, affiliate links, and geo-compliance — v1.0
- ✓ Localisation for 5 languages (EN, ES, DE, IT, FR) with locale-aware formatting — v1.0
- ✓ Affiliate link config, link builder, pipeline enrichment, geo-aware filtering — v1.1
- ✓ Data pipeline with polling, match completion detection, table recalculation, and cache invalidation — v1.0
- ✓ Real-time push updates to connected clients (smart polling) — v1.0
- ✓ Full rebrand to KickLeague (code, UI, package.json, metadata, wordmark, favicons, PWA manifest) — v1.2
- ✓ Site header with KickLeague wordmark and locale switcher on all pages via layout — v1.2
- ✓ Homepage three-card hero row with stat highlights (Top Scorer, Biggest Upset, Form Team) — v1.2
- ✓ Full i18n wiring: all user-visible strings translated, team names localised, chart tooltips internationalised — v1.2
- ✓ Tech debt resolved: getTeamName wiring, hardcoded season '2025', hardcoded English strings — v1.2
- ✓ Full SEO: meta tags, Open Graph images, sitemap.xml, robots.txt, JSON-LD structured data, hreflang alternates — v1.2
- ✓ Google AdSense integration with responsive ad units on 4 page types, betting content separation — v1.2

### Active

<!-- v1.3 Production Launch -->
- [ ] Production deployment on Vercel with Neon production database
- [ ] Error tracking and performance monitoring (Sentry + Vercel Analytics)
- [ ] Complete environment documentation and production README
- [ ] Verified data pipeline with cron jobs running and database current
- [ ] Security hardening (rate limiting, CSP headers)
- [ ] Manual setup steps documented (AdSense, affiliate programs, DNS)

### Out of Scope

- Real-time live match tracking (live scores updating second-by-second) — high complexity, not core to league table value
- User accounts and authentication — not needed for information consumption
- Scenario modelling / "what if" calculator — deferred to post-launch
- Push notifications — requires user accounts
- Additional leagues beyond Big 5 — focus on quality over breadth
- Mobile native app — web-first, responsive design covers mobile
- Video content — storage/bandwidth costs, not core value
- Live odds updating during matches — pre-match odds sufficient
- Automated social media posting — deferred (complexity, requires API upgrade first)

## Context

**Domain:** Football statistics and league standings for the European Big 5 leagues. The target audience is football fans who want more data density than typical sports sites provide — think CoinMarketCap but for football.

**Inspiration:** CoinMarketCap's dashboard aesthetic — sparklines in tables, trend indicators, information density, clean dark themes.

**Current state (v1.2 shipped):**
- 20,173 LOC TypeScript/TSX/CSS across ~150 source files
- 9 database tables + 4 enums (Drizzle ORM, PostgreSQL/Neon)
- 5 locale message files with next-intl routing (229+ keys each, EN/ES/DE/IT/FR)
- Automated polling pipeline with QStash cron + Vercel cron
- Geo-compliance system for betting content (8 Tier 1 countries, Italy banned)
- Full SEO suite: per-page meta, OG images, sitemap.xml, robots.txt, JSON-LD, hreflang
- Display ads with AdSense integration and betting content compliance
- KickLeague branding throughout (wordmark, favicons, PWA manifest, OG images)

**Data sources:**
- Primary: API-Football (via RapidAPI) — Pro tier ($49.99/month, upgraded 2026-02-09)
- Odds: The Odds API — free tier (500 req/month), paid from $25/month
- Backup: Football-Data.org — free, rate-limited, for validation

**League-specific rules:** Each league has different tiebreaker orders (GD vs H2H priority), different zone configurations (Champions League spots, relegation playoff rules), and different team counts (18 vs 20).

**Monetisation strategy:** Betting affiliate links (primary, ~70% projected revenue), display advertising (secondary), premium tier (tertiary, post-launch). Projected ~$100-150/month infrastructure cost, revenue target of $5,900/month by month 10-12.

**Known tech debt:** None remaining from v1.0/v1.1 — all resolved in v1.2.

## Constraints

- **Tech stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Recharts, Framer Motion (motion), NumberFlow, next-intl, nuqs, Drizzle ORM
- **Database**: PostgreSQL (Neon — serverless)
- **Queue**: Upstash QStash (serverless job queue)
- **Hosting**: Vercel
- **API budget**: ~$100-150/month total infrastructure at production (API-Football Pro tier active)
- **API rate limits**: Pro tier (7,500 req/day on API-Football) — sufficient for 60s polling
- **League data**: 5 leagues, ~96 teams, ~380 matches per league per season = ~1,900 matches total

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js 16 + Postgres over spec's Next.js 14 + MySQL | Spec referenced Next.js 14 and Planetscale; both have moved on. Postgres is more flexible and Neon offers better free tier | ✓ Good — no issues |
| API-Football free tier for development | Real data from day one; 100 req/day sufficient for development with proper caching | ✓ Good — cache proxy eliminates repeated API calls |
| Phased delivery: core tables first, then enhancements, then monetisation | Validates core value (information-dense tables) before investing in affiliate/social complexity | ✓ Good — 15 phases delivered in 5 days |
| Dark theme as default | Matches CoinMarketCap aesthetic and league branding works better on dark backgrounds | ✓ Good — league gradient theming works well on dark |
| Drizzle ORM over Prisma | Lighter, SQL-closer, better for complex queries (aggregations, window functions) | ✓ Good — no ORM limitations hit |
| Server actions for client-server data fetching | Simpler than API routes for same-origin data, works with Next.js 16 patterns | ✓ Good — clean pattern throughout |
| nuqs for URL state management | Type-safe URL params for league, tab, matchweek selection; persists state across navigation | ✓ Good — works with Suspense boundaries |
| proxy.ts for middleware (Next.js 16 pattern) | Next.js 16 uses proxy.ts instead of middleware.ts | ✓ Good — handles i18n + geo-detection |
| Motion layout="position" for table animations | Prevents child element distortion during FLIP animations (vs layout={true}) | ✓ Good — smooth row reordering |
| Partial-accept Zod pattern | safeParse always, passthrough on objects, log warnings but return data on schema mismatch | ✓ Good — resilient to API schema changes |
| Smart polling over SSE | Browser polls /api/updates/check at adaptive intervals; simpler than SSE, works on all platforms | ✓ Good — no WebSocket server needed |
| Geo-compliance via proxy headers | proxy.ts sets x-show-betting header; components gate on showBetting prop | ✓ Good — single enforcement point |
| title.template metadata pattern | Automatic KickLeague suffix on all pages via layout.tsx title.template | ✓ Good — consistent branding |
| Inline SVG wordmark (not font-embedded) | Avoids font-loading complexity; works in OG images via Satori/ImageResponse | ✓ Good — renders everywhere |
| ICU plural format for i18n | Handles count-dependent strings (wins, meetings, goals) across all 5 locales | ✓ Good — natural translations |
| Light OG images (not dark theme) | High contrast required for social media preview cards; dark images look bad in feeds | ✓ Good — readable previews |
| Spoiler-free OG titles for match pages | Browser tab shows score, social share does not — prevents score spoilers | ✓ Good — user-friendly |
| IntersectionObserver for ad lazy loading | Ads load when 200px from viewport; module-level singleton prevents duplicate script loads | ✓ Good — minimal performance impact |
| Betting content separation for ads | At least one full content section between any ad unit and odds/bookmaker content | ✓ Good — compliance maintained |

## Current Milestone: v1.3 Production Launch

**Goal:** Deploy KickLeague to production with monitoring, verified data pipeline, security hardening, and documentation — everything needed to go live.

**Target features:**
- Production Vercel + Neon deployment with all env vars configured
- Sentry error tracking + Vercel Analytics
- Production README and complete env documentation
- QStash cron schedules running, database seeded and current
- Rate limiting on public endpoints, CSP headers
- Manual steps documented (AdSense units, affiliate signups, DNS)

---
*Last updated: 2026-02-10 after v1.3 milestone started*
