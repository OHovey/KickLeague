# Technology Stack

**Project:** FootballPulse
**Researched:** 2026-02-04
**Research mode:** Ecosystem (Stack dimension)
**Overall confidence:** MEDIUM — Web search and npm registry verification were unavailable during this session. Versions are based on training data (cutoff ~May 2025) and should be verified with `npm view <package> version` before `npm install`. Recommendations are architecturally sound regardless of minor version drift.

---

## Methodology Note

External verification tools (WebSearch, WebFetch, npm CLI) were unavailable during this research session. All version numbers are based on training knowledge with a cutoff around May 2025. Where uncertainty exists, it is flagged explicitly. The architectural rationale and library selection logic is HIGH confidence; specific version numbers are MEDIUM confidence and should be verified at install time.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Next.js** | `15.x` (latest stable) | Full-stack React framework | App Router is mature, RSC support, Vercel-native deployment, API routes eliminate separate backend, edge middleware for geo-targeting bookmakers. The spec already requires Vercel hosting, making Next.js the natural choice. | HIGH |
| **TypeScript** | `5.x` (latest stable) | Type safety | Non-negotiable for a data-heavy app with complex interfaces (standings, match events, tiebreaker logic). Catches entire categories of bugs in league table calculations. | HIGH |
| **React** | `19.x` | UI library | Ships with Next.js 15. React 19 brings improved server components, `use()` hook for promises, and better concurrent features. | MEDIUM (version) |

**Why Next.js over alternatives:**
- **Remix/React Router 7:** Strong contender, but Vercel-hosted Next.js has superior edge caching, ISR, and zero-config deployment. Remix would be the choice if deploying to Cloudflare Workers.
- **Astro:** Great for content sites but weak for the interactive dashboard features needed (timeline slider, real-time SSE updates, expandable table states). Too much client-side interactivity for Astro's island model.
- **SvelteKit:** Excellent DX but smaller ecosystem for the specific libraries needed (charting, i18n, animation). Team familiarity with React ecosystem is assumed.
- **Plain React + Vite:** Loses SSR/ISR benefits critical for SEO (league tables should be indexable) and Vercel's edge caching.

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Tailwind CSS** | `4.x` | Utility-first CSS | Tailwind v4 (released early 2025) has CSS-first configuration, faster builds, and native CSS variables — perfect for the league theming system. CSS custom properties for theme switching are first-class. If v4 causes issues, v3.4.x is rock-solid fallback. | MEDIUM (v4 stability) |
| **tailwind-merge** | `2.x` | Class conflict resolution | Essential when building reusable components with conditional styling (zone colours, form indicators). | HIGH |
| **clsx** | `2.x` | Conditional classnames | Lightweight utility for building dynamic class strings. | HIGH |

**Why Tailwind over alternatives:**
- **CSS Modules:** Viable but slower development velocity for a dashboard with dozens of small visual components (form dots, zone bars, sparklines).
- **Styled Components / Emotion:** Runtime CSS-in-JS has performance overhead. Tailwind's zero-runtime approach is better for data-dense tables with many rows.
- **Panda CSS:** Interesting zero-runtime alternative but ecosystem is less mature.

**League theming approach:** Use CSS custom properties at the `:root` level, switched via a data attribute (`data-league="premier-league"`). Tailwind v4's native CSS variable support makes this clean. No JS runtime theme computation needed.

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Zustand** | `5.x` | Client state | Minimal API, no boilerplate, perfect for the small amount of truly client-side state (selected league, UI preferences, language). Does NOT replace server state — that is TanStack Query's job. | HIGH |

**What goes in Zustand vs TanStack Query:**

| State | Manager | Why |
|-------|---------|-----|
| Current league selection | Zustand + URL | UI state, persisted to localStorage |
| Language preference | Zustand + localStorage | Client preference |
| Expanded/collapsed table states | Zustand | Ephemeral UI state |
| League standings data | TanStack Query | Server state with caching, refetching, SSE invalidation |
| Match data | TanStack Query | Server state |
| Odds data | TanStack Query | Server state with frequent refetching |

**Why Zustand over alternatives:**
- **Redux Toolkit:** Overkill. FootballPulse has very little client-only state. Redux's boilerplate is unjustified here.
- **Jotai:** Atomic model is powerful but Zustand's store model maps better to the "global preferences" pattern needed here.
- **React Context:** Fine for theme/language, but Zustand avoids the re-render cascade problem when league selection changes.
- **No state library:** Tempting given how little client state exists, but Zustand's persistence middleware (for localStorage sync) and devtools justify its tiny footprint.

### Data Fetching & Server State

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **TanStack Query** | `5.x` | Server state management | Handles caching, background refetching, stale-while-revalidate, optimistic updates. Critical for a data-heavy dashboard where standings/matches/odds each have different TTLs. SSE events can trigger query invalidation for real-time feel. | HIGH |

**Key TanStack Query patterns for FootballPulse:**

```typescript
// Different stale times per data type
const STALE_TIMES = {
  standings: 5 * 60 * 1000,     // 5 min — updated by SSE invalidation
  recentMatches: 5 * 60 * 1000, // 5 min
  upcomingMatches: 15 * 60 * 1000, // 15 min
  odds: 5 * 60 * 1000,          // 5 min — more volatile
  teamDetail: 10 * 60 * 1000,   // 10 min
  snapshot: Infinity,            // Historical data never changes
};
```

**Why TanStack Query over alternatives:**
- **SWR:** Similar concept but TanStack Query has superior devtools, better mutation support, and more granular cache control. For a dashboard with 5+ distinct data types each needing different caching strategies, TanStack Query wins.
- **Next.js `fetch()` caching alone:** Insufficient. Client-side cache invalidation on SSE events requires a client-side cache manager. Next.js server-side caching (ISR) complements TanStack Query, it does not replace it.
- **Apollo Client:** GraphQL-oriented. Our data sources are REST APIs.

### Charts & Data Visualization

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Recharts** | `2.x` | Charts (position history, goals by period, xG trends) | React-native, good customisation, handles the chart types needed (line, bar, area). Lighter than D3 for the chart complexity required. | HIGH |
| **Custom SVG sparklines** | N/A | Inline table sparklines | Recharts is overkill for the tiny sparklines in table rows. Write a ~30 line SVG component for position sparklines. Better performance when rendering 20 sparklines per table. | HIGH |

**Why Recharts over alternatives:**
- **D3.js:** Too low-level. We need ~5 chart types, not a full visualization framework. D3's imperative API fights React's declarative model.
- **Visx (Airbnb):** Excellent D3+React primitives but requires more code for each chart. Good choice if Recharts proves limiting, but for standard line/bar/area charts Recharts is faster to ship.
- **Nivo:** Beautiful defaults but heavier bundle. Recharts is lighter for the chart types needed.
- **Chart.js / react-chartjs-2:** Canvas-based, harder to style with the league theming system. SVG-based (Recharts) integrates better with CSS custom properties for theme colours.
- **Tremor:** Opinionated dashboard components. Good for admin dashboards but too constrained for the custom CoinMarketCap aesthetic.

**Critical decision: Custom sparklines, not a library.** The league table renders 18-20 rows, each with a sparkline. Using a full charting library for each sparkline creates unnecessary DOM weight and bundle size. A simple SVG polyline component with ~20 data points is trivial and performant:

```typescript
function Sparkline({ data, color }: { data: number[]; color: string }) {
  // ~30 lines of code, renders an SVG polyline
  // Inverted Y-axis (position 1 at top)
}
```

### Animation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Framer Motion** | `11.x` | Layout animations, page transitions | Table row reordering animation, league theme transitions, expandable section animations, season timeline interactions. Framer Motion's `layout` prop handles the table position shuffling that is core to the product experience. | MEDIUM (version) |

**Why Framer Motion over alternatives:**
- **CSS transitions/animations:** Sufficient for simple fades (theme switching) but cannot handle layout animations (table row reordering when standings change). The "wow" moment of seeing rows slide into new positions requires Framer Motion's `layout` animation.
- **React Spring:** Good physics-based animations but Framer Motion's `AnimatePresence` and `layout` features are specifically what this product needs.
- **GSAP:** Imperative animation library, fights React's model. Framer Motion is React-native.
- **Motion One:** Lighter but lacks layout animation support.

**Performance note:** Framer Motion adds ~30-40KB to the bundle. Worth it for the table reordering animation and expandable sections, but be deliberate — only use it where CSS cannot achieve the effect.

### Internationalisation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **next-intl** | `3.x` or `4.x` | i18n for Next.js App Router | Purpose-built for Next.js App Router with RSC support. Handles routing (`/en/premier-league`, `/es/premier-league`), message formatting, date/number formatting. The spec requires 5 languages — next-intl handles this cleanly with per-locale message files. | MEDIUM (version — may have shipped v4) |

**Why next-intl over alternatives:**
- **react-i18next:** The spec originally suggests this, but next-intl is superior for Next.js App Router. react-i18next requires more setup for RSC and does not handle locale-based routing natively.
- **next-translate:** Less maintained, smaller community.
- **Paraglide (Inlang):** Interesting compiler-based approach with smaller bundle, but less mature ecosystem. Worth watching.
- **ICU MessageFormat directly:** Too low-level. next-intl wraps ICU format with React integration.

**Key i18n considerations for FootballPulse:**
- Team names: Some have official translations (e.g., "Bayern Munich" vs "Bayern Munchen"), others do not. Store canonical + translated names in the database.
- Date formats: DD/MM/YYYY for UK/EU, locale-aware via `Intl.DateTimeFormat`.
- Number formats: 1,000 (EN) vs 1.000 (DE/ES/IT/FR). Use `Intl.NumberFormat`.
- Odds formats: Decimal (EU default), fractional (UK), American (US). This is a user preference, not a locale mapping.

---

## Database

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Neon Postgres** | Serverless | Primary database | Serverless Postgres with branching, generous free tier (0.5 GB storage, 190 compute hours), scales to production within budget. PostgreSQL's JSONB columns are ideal for the `events`, `stats`, `form`, `position_history` fields. Native `GENERATE_SERIES` for matchweek data generation. | HIGH |
| **Drizzle ORM** | `0.3x.x` | Database ORM | Type-safe SQL with zero abstraction cost. Generates raw SQL, so no ORM performance penalty for the complex standing calculation queries. Schema-as-code with migrations. Lighter than Prisma, faster queries. | HIGH |

**Why Neon over alternatives:**
- **Supabase:** Also Postgres, also serverless. Supabase bundles auth, storage, realtime — features FootballPulse doesn't need for v1. Neon is more focused (just the database) and has better Vercel integration with connection pooling via `@neondatabase/serverless`. Supabase is a fine alternative if Neon's free tier is exhausted.
- **PlanetScale:** The spec originally proposed this. PlanetScale deprecated their free tier in 2024 and uses MySQL, not Postgres. PostgreSQL is superior for this use case (JSONB, richer query capabilities, standard SQL). **Do not use PlanetScale.**
- **Vercel Postgres (powered by Neon):** Possible but has markup over direct Neon pricing. Use Neon directly for cost control.
- **Railway Postgres:** Good alternative with simple pricing but less serverless-optimised than Neon.
- **SQLite (Turso):** Interesting for edge but the relational complexity of standings + matches + teams + snapshots benefits from a proper relational database with JOINs.

**Why Drizzle over alternatives:**
- **Prisma:** Higher overhead, heavier bundle (Prisma Client), cold start issues in serverless. Drizzle generates leaner queries and has no runtime engine.
- **Kysely:** Type-safe query builder but less ecosystem (no migration tool built-in). Drizzle covers both ORM and migrations.
- **Raw SQL:** Viable but loses type safety. With ~15 tables and complex joins for standings calculations, type safety pays for itself.
- **TypeORM / MikroORM:** Heavy, not serverless-optimised, decorator-based APIs feel dated.

**Schema note:** The spec's SQL schema uses MySQL syntax (`ENUM`, `UNIQUE KEY`). Convert to PostgreSQL: use Postgres `enum` types or check constraints, `UNIQUE` constraints, `TIMESTAMPTZ` instead of `TIMESTAMP`, and JSONB instead of JSON for queryable JSON columns.

---

## Cache & Queue

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Upstash Redis** | Serverless | Cache layer | Serverless Redis with REST API (works in edge/serverless without persistent connections). Pay-per-request pricing fits the budget. 10,000 commands/day free tier. Write-through cache pattern for standings data. | HIGH |
| **Upstash QStash** | Serverless | Job queue | Serverless job queue for scheduled tasks (match polling, odds refresh, social media posting, daily resync). HTTP-based — triggers Next.js API routes on schedule. No infrastructure to manage. | HIGH |

**Why Upstash over alternatives:**
- **Redis Cloud (Redis Labs):** Requires persistent connections, not ideal for serverless. Upstash's REST API works everywhere.
- **Vercel KV (powered by Upstash):** Markup over direct Upstash pricing. Use Upstash directly.
- **Vercel Cron:** Only handles scheduling, not queuing with retries. QStash provides both scheduling AND reliable delivery with retries, dead-letter queues.
- **BullMQ + Redis:** Requires a persistent server process. Incompatible with serverless architecture.
- **Inngest:** Interesting serverless workflow engine, could replace QStash for complex workflows. Slightly more complex but better for the multi-step match completion flow (detect -> recalculate -> cache -> broadcast -> social). Worth evaluating if QStash's simple HTTP trigger model proves limiting. | MEDIUM confidence alternative |

**Cache key strategy (from spec, validated):**
```
league:{slug}:table          TTL 30min, invalidate on match complete
league:{slug}:recent         TTL 30min, invalidate on match complete
league:{slug}:upcoming       TTL 1hr, invalidate on fixture sync
team:{id}:detail             TTL 30min, invalidate on team match complete
match:{id}:detail            TTL 24hr, invalidate on match update
odds:{matchId}               TTL 15min, invalidate on odds refresh
snapshot:{league}:{mw}       TTL infinite (immutable historical data)
h2h:{team1}:{team2}          TTL 24hr, invalidate on match between them
```

---

## Real-Time Updates

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Server-Sent Events (SSE)** via Next.js API routes | N/A | Push updates to clients | Unidirectional (server to client) is all that is needed — clients never push data. SSE is simpler than WebSocket, works through CDNs/proxies, auto-reconnects natively. Vercel supports SSE on serverless functions (with streaming response). | HIGH |

**Implementation approach:**

```typescript
// /api/sse/[league]/route.ts
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Subscribe to Redis pub/sub or poll for changes
      // Send events: TABLE_UPDATE, MATCH_COMPLETE, ODDS_UPDATE
    }
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Why SSE over alternatives:**
- **WebSocket:** Bidirectional, but FootballPulse only needs server-to-client pushes. WebSocket adds complexity (connection management, reconnection logic, proxy issues) for no benefit.
- **Polling:** Simpler but wastes bandwidth and adds latency. SSE gives instant updates when standings change.
- **Pusher / Ably:** Third-party services add cost and another dependency. SSE from our own API routes is free and sufficient for the expected traffic volume.
- **Supabase Realtime:** Would require Supabase as database. Too coupled.

**Vercel SSE caveat:** Vercel serverless functions have a 30-second timeout on Hobby, 5-minute on Pro. For SSE, the client must handle reconnection. Consider Vercel's streaming support or a dedicated SSE endpoint on a long-running function if needed. This is a known trade-off of serverless — flag for Phase 2 when implementing SSE.

---

## API Data Sources

| Service | Purpose | Free Tier | Production Cost | Confidence |
|---------|---------|-----------|-----------------|------------|
| **API-Football** (RapidAPI) | Match data, standings, events, stats | 100 req/day | $49.99/month (Pro: 120K req/month) | HIGH |
| **The Odds API** | Betting odds, multi-bookmaker | 500 req/month | $25-75/month | HIGH |
| **Football-Data.org** | Validation, backup data | 10 req/min | Free for basic use | HIGH |

**API-Football is the correct choice.** It covers all Big 5 leagues with consistent data structures, includes match events (goals, cards), statistics, H2H, and predicted lineups. The free tier is sufficient for development with proper caching.

**Rate limit strategy for development (100 req/day):**
1. Seed database with a full snapshot on day 1 (use all 100 requests)
2. Subsequent days: poll only for changes (fixture status changes), ~10-20 requests/day
3. Cache aggressively — most data does not change between matches
4. Mock data for UI development, real API for integration testing

---

## Social Media & AI

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **OpenAI API** (GPT-4o-mini) | Latest | Social post generation | Cheapest capable model for short-form content generation. ~$0.15 per 1M input tokens. At ~50 posts/month, cost is negligible (<$1/month). | HIGH |
| **X API v2** | Free tier | Post to X/Twitter | 1,500 posts/month free. Sufficient for ~50 automated posts/month. | HIGH |
| **Meta Graph API** | v19+ | Post to Instagram | Requires Business account. No strict posting limits. | MEDIUM |
| **Sharp** | `0.33.x` | Image generation for social cards | Node.js image processing for match result cards. Fast, server-side, no external service needed. | HIGH |

**Why GPT-4o-mini over alternatives:**
- **Claude (Anthropic):** Higher quality writing but more expensive for this simple task. GPT-4o-mini is sufficient for 280-character tweets.
- **Llama/Mistral (self-hosted):** Unnecessary complexity. API call for 50 posts/month costs under $1.
- **Template-based (no AI):** Viable for v1 but produces repetitive, detectable posts. LLM adds variety and tone.

---

## Infrastructure

| Service | Provider | Tier | Cost Estimate | Confidence |
|---------|----------|------|---------------|------------|
| Hosting | Vercel | Pro | $20/month | HIGH |
| Database | Neon Postgres | Launch (or Scale) | $0-19/month | HIGH |
| Cache | Upstash Redis | Pay-as-you-go | ~$3-5/month | HIGH |
| Queue | Upstash QStash | Pay-as-you-go | ~$1-3/month | HIGH |
| Football API | API-Football | Pro | $49.99/month | HIGH |
| Odds API | The Odds API | Starter | $25/month | HIGH |
| LLM | OpenAI | Pay-as-you-go | ~$1-5/month | HIGH |
| Domain | Any registrar | N/A | ~$10-15/year | HIGH |
| **Total** | | | **~$100-120/month** | |

This fits comfortably within the stated $100-150/month budget.

**Free tier during development:**
- Vercel Hobby: Free
- Neon Free Tier: 0.5 GB, 190 compute hours
- Upstash Redis Free: 10K commands/day
- Upstash QStash Free: 500 messages/day
- API-Football Free: 100 req/day
- The Odds API Free: 500 req/month
- OpenAI: Pay-as-you-go (negligible during dev)

**Total development cost: $0/month** (all free tiers)

---

## Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| **date-fns** | `3.x` or `4.x` | Date formatting, relative times | "3 days ago", matchweek date ranges, timezone-aware kickoff times. Tree-shakeable, unlike Moment.js or Luxon. | HIGH |
| **zod** | `3.x` | Runtime validation | Validate API-Football responses, form inputs, API route params. Pairs with TypeScript for end-to-end type safety. | HIGH |
| **@vercel/analytics** | Latest | Web analytics | Free with Vercel Pro. Track page views, engagement by league. | HIGH |
| **@vercel/speed-insights** | Latest | Performance monitoring | Core Web Vitals monitoring. Critical for a data-dense page. | HIGH |
| **next-sitemap** | `4.x` | SEO sitemaps | Generate sitemaps for league/team/match pages. Important for organic traffic. | HIGH |
| **sharp** | `0.33.x` | Image processing | Social media card generation, team logo processing. | HIGH |
| **@upstash/redis** | Latest | Redis client | Serverless-compatible Redis client with REST transport. | HIGH |
| **@upstash/qstash** | Latest | QStash client | Job scheduling and queue management. | HIGH |
| **@neondatabase/serverless** | Latest | Neon database driver | Serverless-compatible Postgres driver over WebSocket/HTTP. | HIGH |
| **drizzle-kit** | Latest | Migration tooling | Database migrations, schema push, studio. Dev dependency. | HIGH |

---

## Dev Dependencies

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| **ESLint** | `9.x` | Linting | Flat config (ESLint 9). Use `@eslint/js` + `typescript-eslint`. | HIGH |
| **Prettier** | `3.x` | Code formatting | Consistent formatting. Use `prettier-plugin-tailwindcss` for class sorting. | HIGH |
| **Vitest** | `2.x` | Unit/integration testing | Faster than Jest, native TypeScript, Vite-compatible. Test tiebreaker logic, standings calculations. | HIGH |
| **Playwright** | `1.x` | E2E testing | Test league switching, theme transitions, sparkline rendering. | HIGH |
| **Husky** | `9.x` | Git hooks | Pre-commit linting, pre-push testing. | MEDIUM |
| **lint-staged** | `15.x` | Staged file linting | Only lint changed files in pre-commit. | MEDIUM |

**Why Vitest over Jest:**
- Native TypeScript support without `ts-jest` configuration
- Compatible with Vite's transform pipeline
- Watch mode is significantly faster
- Same API as Jest (easy migration if needed)

---

## Alternatives Considered (Full Summary)

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 15 | Remix, SvelteKit | Vercel-native, RSC, ISR, edge caching |
| Database | Neon Postgres | Supabase, PlanetScale | Neon is focused/cheaper; PlanetScale killed free tier and uses MySQL |
| ORM | Drizzle | Prisma, Kysely | Lighter, faster queries, better serverless cold starts |
| State | Zustand | Redux Toolkit, Jotai | Minimal client state; Zustand's simplicity matches the need |
| Data fetching | TanStack Query v5 | SWR, raw fetch | Superior cache control, devtools, mutation support |
| Charts | Recharts + custom SVG | D3, Visx, Nivo | Right complexity level; custom sparklines for table performance |
| Animation | Framer Motion | CSS, React Spring | Layout animation for table row reordering |
| i18n | next-intl | react-i18next, next-translate | Purpose-built for Next.js App Router with RSC support |
| Styling | Tailwind CSS v4 | CSS Modules, styled-components | Zero-runtime, CSS variables for theming, fastest development |
| Testing | Vitest + Playwright | Jest + Cypress | Faster, native TS, modern |
| Real-time | SSE | WebSocket, Pusher | Unidirectional is sufficient, simpler, cheaper |
| Queue | Upstash QStash | Inngest, BullMQ | Serverless-native, no infrastructure, HTTP-based triggers |

---

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| **PlanetScale** | Deprecated free tier, MySQL only. The spec references it but it should be replaced with Neon Postgres. |
| **Moment.js** | Deprecated, huge bundle. Use date-fns. |
| **Redux** | Overkill for the minimal client state in this app. |
| **D3.js (directly)** | Too low-level for the chart types needed. Imperative API fights React. |
| **Prisma** | Heavy runtime, slow cold starts in serverless, unnecessary abstraction layer. |
| **Socket.io / WebSocket** | Bidirectional not needed. SSE is simpler and sufficient. |
| **Express / standalone server** | Vercel serverless functions handle everything. No need for a separate server. |
| **MongoDB** | Relational data (standings, teams, matches, leagues) with complex JOINs. PostgreSQL is the correct choice. |
| **Firebase** | Vendor lock-in, Firestore's NoSQL model is wrong for relational league data, more expensive at scale. |
| **Chakra UI / MUI** | Component libraries add bloat and fight the custom CoinMarketCap aesthetic. Tailwind gives full design control. |
| **react-i18next** | Works but next-intl is purpose-built for Next.js App Router. The spec mentions react-i18next but next-intl is the better choice. |
| **Canvas-based charts** | SVG-based charts (Recharts) integrate with CSS custom properties for league theming. Canvas charts need manual colour management. |

---

## Installation

```bash
# Core framework
npx create-next-app@latest footballpulse --typescript --tailwind --eslint --app --src-dir

# State & data fetching
npm install zustand @tanstack/react-query

# Database
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit

# Cache & queue
npm install @upstash/redis @upstash/qstash

# Charts & animation
npm install recharts framer-motion

# i18n
npm install next-intl

# Utilities
npm install date-fns zod sharp

# Analytics & SEO
npm install @vercel/analytics @vercel/speed-insights next-sitemap

# Dev dependencies
npm install -D vitest @vitejs/plugin-react prettier prettier-plugin-tailwindcss \
  @playwright/test husky lint-staged typescript-eslint @eslint/js
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...@ep-xxx.us-east-2.aws.neon.tech/footballpulse

# Cache
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Queue
QSTASH_TOKEN=...
QSTASH_CURRENT_SIGNING_KEY=...
QSTASH_NEXT_SIGNING_KEY=...

# APIs
RAPIDAPI_KEY=...               # For API-Football
ODDS_API_KEY=...               # For The Odds API

# Social
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...
INSTAGRAM_ACCESS_TOKEN=...

# AI
OPENAI_API_KEY=...

# App
NEXT_PUBLIC_BASE_URL=https://footballpulse.com
```

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Framework (Next.js 15) | HIGH | Mature, well-understood, Vercel-native |
| Database (Neon + Drizzle) | HIGH | Strong architectural fit; verify Drizzle version at install |
| State (Zustand + TanStack Query) | HIGH | Standard pattern for this type of app |
| Charts (Recharts + custom SVG) | HIGH | Correct complexity level |
| i18n (next-intl) | MEDIUM | Verify latest version; may have breaking changes in v4 |
| Animation (Framer Motion) | MEDIUM | Verify bundle size impact; may need lazy loading |
| Styling (Tailwind v4) | MEDIUM | v4 was relatively new as of training cutoff; fallback to v3.4 if unstable |
| Real-time (SSE on Vercel) | MEDIUM | Vercel's SSE support has timeout constraints; test early |
| Specific version numbers | MEDIUM | All versions should be verified with `npm view` before installing |

---

## Key Risks

1. **Vercel SSE timeout:** Vercel Pro has 5-minute function timeout. SSE connections must handle reconnection. Test this in Phase 2 before committing to the pattern. Fallback: polling with TanStack Query's `refetchInterval`.

2. **Tailwind v4 maturity:** If v4 has ecosystem compatibility issues (with Framer Motion, Recharts), fall back to Tailwind v3.4 which is battle-tested. The theming approach works with both versions.

3. **Neon cold starts:** Serverless Postgres can have cold start latency. Neon's connection pooling and the Upstash Redis cache layer in front mitigate this. Test P99 latency during development.

4. **Drizzle stability:** Drizzle ORM is pre-1.0 (0.3x). The API is stable in practice but monitor for breaking changes across minor versions. Pin the version in package.json.

5. **Bundle size:** Recharts + Framer Motion + TanStack Query add meaningful client bundle. Use dynamic imports (`next/dynamic`) for charts and heavy components below the fold. Target < 200KB first-load JS.

---

## Sources

All recommendations based on training data (cutoff ~May 2025). Version numbers should be verified via `npm view <package> version` before installation. Architectural patterns are based on established best practices for Next.js dashboard applications deployed to Vercel.

Key references from training data:
- Next.js App Router documentation (vercel.com/docs)
- TanStack Query documentation (tanstack.com/query)
- Drizzle ORM documentation (orm.drizzle.team)
- Neon documentation (neon.tech/docs)
- Upstash documentation (upstash.com/docs)
- Tailwind CSS v4 release notes (tailwindcss.com)
