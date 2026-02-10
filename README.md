# KickLeague

CoinMarketCap-style football league stats dashboard for Europe's Big 5 leagues.

KickLeague presents league standings, match results, team profiles, and betting odds through an information-dense dark glassmorphism interface. Features include sparkline charts, form run indicators, position history bump charts, cumulative xG visualisations, and live betting odds -- all available in 5 languages.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router), TypeScript, React 19 |
| Styling | Tailwind CSS 4, dark glassmorphism theme |
| Database | PostgreSQL (Neon serverless), Drizzle ORM |
| Data Sources | API-Football (RapidAPI), The Odds API |
| Internationalisation | next-intl (EN, ES, DE, IT, FR) |
| URL State | nuqs |
| Charts | Recharts |
| Animations | Motion (Framer Motion) |
| Cron / Queue | Upstash QStash, Vercel Cron |
| Monitoring | Sentry, Vercel Analytics, Vercel Speed Insights |
| Hosting | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or pnpm)
- PostgreSQL database ([Neon](https://neon.tech) recommended for serverless)
- API-Football key from [RapidAPI](https://rapidapi.com/api-sports/api/api-football)
- The Odds API key from [the-odds-api.com](https://the-odds-api.com)

### Setup

```bash
# 1. Clone the repository
git clone <repo-url> kickleague
cd kickleague

# 2. Copy environment variables and fill in values
cp .env.example .env.local

# 3. Install dependencies
npm install

# 4. Apply database migrations
npx drizzle-kit push

# 5. Seed all 5 leagues (current + previous season)
npm run seed -- --all

# 6. Start development server
npm run dev
```

The app runs at `http://localhost:3000`.

## Environment Variables

See [`.env.example`](.env.example) for the complete list with descriptions, sources, and format placeholders.

### Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon) |
| `API_FOOTBALL_KEY` | Yes | RapidAPI key for API-Football v3 |
| `ODDS_API_KEY` | Yes | The Odds API key for betting odds |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical site URL for SEO and OG images |
| `NEXT_PUBLIC_SENTRY_DSN` | Yes | Client-side Sentry DSN |
| `SENTRY_DSN` | Yes | Server-side Sentry DSN |
| `SENTRY_AUTH_TOKEN` | Yes | Sentry auth token for source map uploads |
| `SENTRY_ORG` | Yes | Sentry organization slug |
| `SENTRY_PROJECT` | Yes | Sentry project slug |
| `QSTASH_TOKEN` | Yes* | QStash token (setup script only) |
| `QSTASH_CURRENT_SIGNING_KEY` | Yes | QStash webhook signature verification |
| `QSTASH_NEXT_SIGNING_KEY` | Yes | QStash next rotation signing key |
| `CRON_SECRET` | Yes | Bearer token for Vercel cron auth |
| `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` | No | Google AdSense publisher ID |
| `NEXT_PUBLIC_AD_SLOT_*` | No | 8 AdSense ad unit slot IDs |
| Affiliate IDs | No | 5 bookmaker affiliate program IDs |
| `OVERRIDE_COUNTRY` | No | Force geo-detection for local dev |

## Architecture Overview

```
src/
  app/
    [locale]/             Pages (homepage, matches, match detail, team detail)
    api/
      cron/               Cron routes (poll-matches, daily-resync, refresh-odds)
      clicks/             Affiliate click tracking
      csp-report/         CSP violation reports
      updates/            Live update checks
  components/
    ads/                  Google AdSense display ad components
    header/               Site header and navigation
    i18n/                 Language switcher
    league-nav/           League selector tabs
    league-table/         Standings table with sparklines, form runs, zone indicators
    match-detail/         Individual match breakdown (events, stats, odds)
    matches/              Match list and preview sections
    odds/                 Betting odds display and affiliate links
    stat-highlights/      Homepage stat highlight cards
    team-detail/          Team profile with charts (bump, cumulative points, xG, goals by period)
    timeline/             Match event timeline
  db/schema/              Drizzle ORM schema (14 tables)
  lib/
    affiliate/            Affiliate program config and link building
    api-football/         API-Football client, rate limiter, endpoints
    dates/                Date formatting utilities
    geo/                  Country detection for affiliate targeting
    hooks/                React hooks (league state via nuqs)
    i18n/                 Internationalisation config and routing
    matches/              Match data queries and transformations
    odds-api/             The Odds API client
    pipeline/             Data pipeline utilities
    seed/                 Seed CLI and per-entity seed functions
    seo/                  SEO metadata, structured data, sitemap generation
    standings/            Standings queries and historical computation
    stats/                Statistical calculations and highlights
    teams/                Team data queries
    themes/               Per-league colour themes
  messages/               i18n translation files (en, es, de, it, fr)
scripts/                  CLI tools (QStash setup, seed helpers, DB verification)
drizzle/                  SQL migration files
public/                   Static assets (favicons, ads.txt, icons)
```

## Data Pipeline

### Initial Seed

The seed CLI loads all data from API-Football in dependency order: leagues, teams, players, fixtures (with events and stats), standings, then computes historical standings from fixture results.

```bash
# Seed all 5 leagues (current + previous season)
npm run seed -- --all

# Seed a single league
npm run seed -- --league premier-league

# Lightweight incremental refresh (fixtures + standings only)
npm run seed -- --refresh --all

# Specific season
npm run seed -- --season 2024 --league serie-a

# Bypass file cache (uses API quota)
npm run seed -- --all --no-cache
```

All writes use upsert (onConflictDoUpdate), so re-runs are safe. A file cache (`seed-cache/`) stores API responses to avoid repeat calls.

### Automated Updates (Cron)

Three scheduled jobs keep data fresh after the initial seed:

| Job | Trigger | Schedule | Purpose |
|-----|---------|----------|---------|
| poll-matches | QStash | Every 30 minutes | Fetch recent fixture results and update standings |
| refresh-odds | QStash | Every 6 hours | Refresh betting odds for upcoming matches |
| daily-resync | Vercel Cron | 4:00 AM UTC | Full re-seed of current season standings |

### Setting Up QStash Schedules

After deploying, create the QStash schedules:

```bash
QSTASH_TOKEN=your-token DEPLOY_URL=https://your-app.vercel.app npm run setup-qstash
```

The Vercel cron for daily-resync is configured in `vercel.json` and activates automatically on deployment.

## Deployment

### Deploy to Vercel

```bash
# Option 1: CLI
vercel

# Option 2: Connect GitHub repo in Vercel dashboard for automatic deploys
```

### Post-Deployment Steps

1. **Set environment variables** in Vercel dashboard (Settings > Environment Variables). Copy all required values from `.env.example`.

2. **Apply database migrations** against the production database:
   ```bash
   DATABASE_URL=your-production-url npx drizzle-kit push
   ```

3. **Seed production data**:
   ```bash
   DATABASE_URL=your-production-url API_FOOTBALL_KEY=your-key npm run seed -- --all
   ```

4. **Create QStash schedules**:
   ```bash
   QSTASH_TOKEN=your-token DEPLOY_URL=https://your-app.vercel.app npm run setup-qstash
   ```

5. **Verify** the Vercel cron (`vercel.json`) is active for daily-resync at 4:00 AM UTC.

## Leagues Covered

| League | Country | Teams | API-Football ID |
|--------|---------|-------|-----------------|
| Premier League | England | 20 | 39 |
| La Liga | Spain | 20 | 140 |
| Bundesliga | Germany | 18 | 78 |
| Serie A | Italy | 20 | 135 |
| Ligue 1 | France | 18 | 61 |

## License

This is a private project. All rights reserved.
