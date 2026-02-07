# Phase 7: Betting, Odds & Localisation - Research

**Researched:** 2026-02-05
**Domain:** Betting odds API integration, i18n routing, geo-compliance, affiliate tracking
**Confidence:** MEDIUM (most findings verified with official docs; some affiliate link specifics depend on runtime API testing)

## Summary

This phase adds two cross-cutting layers to KickLeague: (1) multi-bookmaker odds comparison with affiliate monetisation and geo-based compliance, and (2) five-language internationalisation with locale-aware formatting. Both are well-served by established libraries with clear integration patterns for the existing Next.js 16 App Router stack.

The odds pipeline uses The Odds API as the sole data provider. The API returns odds from multiple bookmakers across configurable regions (eu, uk), with built-in deep linking support for affiliate betslip URLs via the `includeLinks` parameter. Odds data should be cached in the database (not just file cache) since it needs to be served to multiple users and supports historical movement tracking. The 2-tier geo-compliance model (Tier 1: show betting, Tier 2: block all betting) maps cleanly to Vercel's `X-Vercel-IP-Country` header in proxy.ts, which provides ISO 3166-1 alpha-2 country codes at the edge.

For i18n, next-intl is the standard library for Next.js App Router internationalisation. It provides locale routing via `[locale]` path segments, translation message files, and built-in formatting that wraps `Intl.DateTimeFormat` and `Intl.NumberFormat`. The migration requires restructuring the app directory under `src/app/[locale]/` and adding a `proxy.ts` file (Next.js 16 naming) for locale negotiation. The existing date formatting in `src/lib/dates/format.ts` (currently hardcoded to `en-GB`) will be replaced by next-intl's `useFormatter` hook.

**Primary recommendation:** Use next-intl for all i18n (routing + messages + formatting), The Odds API with `includeLinks=true` + `regions=eu,uk` for odds data with native affiliate links, Vercel geo headers in proxy.ts for country detection, and a dedicated `fixture_odds` database table for cached odds with movement tracking.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-intl | latest (4.x) | i18n routing, translations, formatting | Official recommendation for Next.js App Router i18n; 3M+ weekly downloads; maintained by Next.js community |
| @vercel/functions | latest | Geo-detection via `geolocation()` helper | Official Vercel package; wraps X-Vercel-IP-Country headers cleanly |
| The Odds API v4 | v4 | Odds data, bookmaker links, deep links | Decision locked in CONTEXT.md; supports EU/UK regions, soccer, includeLinks |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| createNextIntlPlugin | (bundled with next-intl) | Next.js config wrapper | Required in next.config.ts to enable next-intl |
| Intl.DateTimeFormat | (browser built-in) | Date/time/number formatting | Used internally by next-intl's useFormatter; no extra dependency |
| Intl.NumberFormat | (browser built-in) | Number formatting per locale | Decimal separators (1,000 vs 1.000), currency |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| next-intl | next-i18next | next-i18next designed for Pages Router; next-intl is the App Router standard |
| next-intl | react-intl (FormatJS) | react-intl works but lacks next-intl's routing integration and App Router optimisations |
| @vercel/functions geo | MaxMind GeoIP2 | MaxMind more accurate but requires license, database updates, and self-hosting; Vercel headers are free and sufficient for country-level detection |
| Hand-rolled odds conversion | oddslib npm package | oddslib exists but the conversion math is trivial (3 formulas); no need for a dependency |

**Installation:**
```bash
npm install next-intl @vercel/functions
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── i18n/
│   ├── routing.ts          # defineRouting({ locales, defaultLocale })
│   ├── request.ts          # getRequestConfig — locale validation + message loading
│   └── navigation.ts       # createNavigation(routing) — locale-aware Link, redirect, etc.
├── messages/
│   ├── en.json             # English translations
│   ├── es.json             # Spanish translations
│   ├── de.json             # German translations
│   ├── it.json             # Italian translations
│   └── fr.json             # French translations
├── proxy.ts                # Next.js 16 proxy (was middleware.ts) — locale + geo detection
├── app/
│   └── [locale]/           # ALL pages move under this segment
│       ├── layout.tsx      # NextIntlClientProvider + locale validation
│       ├── page.tsx        # Home page (was src/app/page.tsx)
│       ├── matches/
│       │   └── [id]/
│       │       └── page.tsx
│       ├── teams/
│       │   └── [slug]/
│       │       └── page.tsx
│       └── api/            # API routes stay OUTSIDE [locale] — excluded by proxy matcher
├── db/
│   └── schema/
│       ├── odds.ts         # NEW: fixture_odds, odds_snapshots, affiliate_clicks tables
│       └── translations.ts # NEW: team_translations, league_translations tables
├── lib/
│   ├── odds-api/
│   │   ├── client.ts       # The Odds API client (similar pattern to api-football/client.ts)
│   │   ├── cache-proxy.ts  # File cache for odds responses (short TTL: 5-15 min)
│   │   ├── types.ts        # Zod schemas for API response validation
│   │   ├── sport-keys.ts   # Mapping: internal league IDs → Odds API sport keys
│   │   └── odds-format.ts  # Decimal ↔ fractional ↔ American conversion functions
│   ├── geo/
│   │   ├── compliance.ts   # Tier 1/Tier 2 country lists, shouldShowBetting(countryCode)
│   │   └── types.ts        # GeoContext type
│   └── dates/
│       └── format.ts       # REFACTOR: remove hardcoded 'en-GB', use next-intl formatter
└── components/
    ├── odds/
    │   ├── OddsComparisonTable.tsx  # Full bookmaker comparison (match detail page)
    │   ├── CompactOdds.tsx          # Best odds badge (fixture cards)
    │   ├── OddsCell.tsx             # Single odds value with movement indicator + affiliate link
    │   ├── OddsFormatSwitcher.tsx   # Decimal/Fractional/American toggle
    │   └── ResponsibleGambling.tsx  # 18+ footer banner
    └── i18n/
        └── LanguagePicker.tsx       # Header language selector dropdown
```

### Pattern 1: Proxy Composition (Geo + i18n in one file)
**What:** Combine geo-detection and locale routing in a single proxy.ts file
**When to use:** Always — this is the single entry point for request processing
**Example:**
```typescript
// src/proxy.ts (Next.js 16 naming)
// Source: https://next-intl.dev/docs/routing/middleware
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const TIER_1_COUNTRIES = new Set([
  'GB', 'DK', 'SE', 'FR', 'PT', 'AT', 'CH', 'DE'
]);

export default function proxy(request: NextRequest) {
  // 1. Geo detection from Vercel headers
  const country = request.headers.get('x-vercel-ip-country') ?? 'XX';
  const showBetting = TIER_1_COUNTRIES.has(country);

  // 2. i18n routing
  const handleI18nRouting = createMiddleware(routing);
  const response = handleI18nRouting(request);

  // 3. Pass geo context to downstream components via headers
  response.headers.set('x-user-country', country);
  response.headers.set('x-show-betting', showBetting ? '1' : '0');

  return response;
}

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};
```

### Pattern 2: Odds Data Pipeline (Fetch → Cache → Serve)
**What:** Fetch odds from The Odds API, store in database, serve from cache
**When to use:** For all odds display (comparison tables, compact odds)
**Example:**
```typescript
// Source: https://the-odds-api.com/liveapi/guides/v4/
// Similar pattern to existing src/lib/api-football/client.ts

const SPORT_KEY_MAP: Record<string, string> = {
  'premier-league': 'soccer_epl',
  'la-liga': 'soccer_spain_la_liga',
  'bundesliga': 'soccer_germany_bundesliga',
  'serie-a': 'soccer_italy_serie_a',
  'ligue-1': 'soccer_france_ligue_one',
};

interface OddsApiResponse {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    key: string;
    title: string;
    last_update: string;
    markets: {
      key: string;
      outcomes: {
        name: string;
        price: number;
        link?: string;   // betslip deep link (when includeLinks=true)
        sid?: string;     // source ID for custom link construction
      }[];
    }[];
  }[];
}

async function fetchOdds(sportKey: string, regions: string = 'eu,uk'): Promise<OddsApiResponse[]> {
  const url = new URL(`/v4/sports/${sportKey}/odds`, 'https://api.the-odds-api.com');
  url.searchParams.set('apiKey', process.env.ODDS_API_KEY!);
  url.searchParams.set('regions', regions);
  url.searchParams.set('markets', 'h2h');
  url.searchParams.set('oddsFormat', 'decimal');
  url.searchParams.set('includeLinks', 'true');
  url.searchParams.set('includeSids', 'true');

  const res = await fetch(url.toString());
  // Track quota from response headers
  const remaining = res.headers.get('x-requests-remaining');
  const used = res.headers.get('x-requests-used');
  console.log(`[odds-api] Quota: ${remaining} remaining, ${used} used`);

  return res.json();
}
```

### Pattern 3: Odds Format Conversion (Pure Functions)
**What:** Convert between decimal, fractional, and American odds formats
**When to use:** When user selects their preferred odds format
**Example:**
```typescript
// src/lib/odds-api/odds-format.ts
// Conversion formulas are mathematical standards — no library needed

export function decimalToAmerican(decimal: number): string {
  if (decimal >= 2.0) {
    return `+${Math.round((decimal - 1) * 100)}`;
  }
  return `${Math.round(-100 / (decimal - 1))}`;
}

export function decimalToFractional(decimal: number): string {
  const numerator = decimal - 1;
  // Use a lookup table for common fractional odds
  const COMMON_FRACTIONS: Record<string, string> = {
    '0.1': '1/10', '0.2': '1/5', '0.25': '1/4', '0.33': '1/3',
    '0.5': '1/2', '0.67': '2/3', '1': '1/1', '1.5': '3/2',
    '2': '2/1', '2.5': '5/2', '3': '3/1', '4': '4/1',
    '5': '5/1', '9': '9/1', '10': '10/1',
  };
  const key = numerator.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  if (COMMON_FRACTIONS[key]) return COMMON_FRACTIONS[key];

  // GCD-based simplification for non-standard values
  const scale = 100;
  const num = Math.round(numerator * scale);
  const den = scale;
  const g = gcd(num, den);
  return `${num / g}/${den / g}`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
```

### Pattern 4: Database Schema for Odds & Click Tracking
**What:** Store odds snapshots and affiliate click events
**When to use:** Odds pipeline ingestion and click tracking
**Example:**
```typescript
// src/db/schema/odds.ts
import { pgTable, integer, varchar, timestamp, real, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { fixtures } from './fixtures';

// Current odds per fixture per bookmaker (upserted on each poll)
export const fixtureOdds = pgTable(
  'fixture_odds',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    fixtureId: integer('fixture_id').notNull().references(() => fixtures.id, { onDelete: 'cascade' }),
    bookmakerKey: varchar('bookmaker_key', { length: 50 }).notNull(),
    bookmakerTitle: varchar('bookmaker_title', { length: 100 }).notNull(),
    market: varchar('market', { length: 20 }).notNull().default('h2h'),
    homeOdds: real('home_odds').notNull(),
    drawOdds: real('draw_odds').notNull(),
    awayOdds: real('away_odds').notNull(),
    homeLink: varchar('home_link', { length: 1000 }),
    drawLink: varchar('draw_link', { length: 1000 }),
    awayLink: varchar('away_link', { length: 1000 }),
    // For movement tracking
    prevHomeOdds: real('prev_home_odds'),
    prevDrawOdds: real('prev_draw_odds'),
    prevAwayOdds: real('prev_away_odds'),
    lastUpdated: timestamp('last_updated', { withTimezone: true }).notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('fixture_odds_unique').on(table.fixtureId, table.bookmakerKey, table.market),
    index('fixture_odds_fixture').on(table.fixtureId),
  ]
);

// Click tracking for affiliate analytics
export const affiliateClicks = pgTable(
  'affiliate_clicks',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    fixtureId: integer('fixture_id').notNull().references(() => fixtures.id),
    bookmakerKey: varchar('bookmaker_key', { length: 50 }).notNull(),
    outcome: varchar('outcome', { length: 10 }).notNull(), // 'home', 'draw', 'away'
    odds: real('odds').notNull(),
    country: varchar('country', { length: 2 }),
    clickedAt: timestamp('clicked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('affiliate_clicks_fixture').on(table.fixtureId),
    index('affiliate_clicks_time').on(table.clickedAt),
  ]
);
```

### Pattern 5: Translation File Structure
**What:** JSON message files per locale with namespaced keys
**When to use:** All translated UI strings
**Example:**
```json
// messages/en.json
{
  "Common": {
    "appName": "KickLeague",
    "backToMatches": "Back to matches",
    "loading": "Loading..."
  },
  "Navigation": {
    "matches": "Matches",
    "language": "Language"
  },
  "Odds": {
    "comparisonTitle": "Odds Comparison",
    "bestOdds": "Best odds",
    "fromBookmakers": "from {count} bookmakers",
    "home": "Home",
    "draw": "Draw",
    "away": "Away",
    "noOdds": "Odds not available",
    "comingSoon": "Odds comparison coming soon",
    "movement": {
      "shortened": "Shortened",
      "drifted": "Drifted"
    }
  },
  "ResponsibleGambling": {
    "message": "18+ | Please gamble responsibly",
    "helpLink": "Get help"
  },
  "Formats": {
    "decimal": "Decimal",
    "fractional": "Fractional",
    "american": "American"
  }
}
```

### Anti-Patterns to Avoid
- **Storing odds only in file cache:** File cache is per-instance and lost on redeploy. Odds data needs to be in the database for multi-user serving, movement tracking, and persistence across deployments.
- **Blocking page render on odds API:** Odds should load asynchronously or from database cache. Never make the main page SSR wait on a third-party API call.
- **Checking geo-compliance client-side only:** Geo-blocking must happen server-side (proxy.ts / server components). Client-side checks can be bypassed and violate compliance requirements.
- **Translating at build time only:** Team names come from the database, not static message files. Database-driven translations (team_translations table) are needed alongside static messages.
- **Hardcoding country lists in multiple files:** The Tier 1/Tier 2 compliance config should be a single source of truth, ideally a config object, not scattered across proxy.ts, components, and API routes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| i18n routing with locale path prefixes | Custom regex-based URL rewriting | next-intl middleware + [locale] segment | Handles Accept-Language negotiation, cookie persistence, redirect loops, static rendering |
| Date/number locale formatting | Custom format functions per locale | next-intl `useFormatter` wrapping `Intl.DateTimeFormat` / `Intl.NumberFormat` | Browser Intl APIs handle all locale rules (decimal separators, date ordering, timezone names) |
| Geo-detection from IP | IP-to-country lookup service | Vercel `X-Vercel-IP-Country` header via `@vercel/functions` geolocation() | Free, automatic on Vercel, no external service dependency, country-level accuracy sufficient |
| Odds format conversion | npm package (oddslib, odds-converter) | 3 pure functions (~20 lines total) | The math is trivial: American = (d-1)*100 or -100/(d-1); Fractional = GCD simplification of (d-1) |
| Affiliate deep links | Custom URL construction per bookmaker | The Odds API `includeLinks=true` parameter | API returns direct betslip URLs per outcome; fallback hierarchy (outcome > market > event) |
| Translation message loading | Custom file-system loader | next-intl `getRequestConfig` + dynamic imports | Handles code splitting, server/client boundary, locale validation |

**Key insight:** The combination of next-intl (routing + translations + formatting), Vercel geo headers (compliance), and The Odds API's includeLinks (affiliate links) means almost no custom infrastructure is needed. The main custom work is the database layer (odds caching, click tracking, team translations) and the UI components.

## Common Pitfalls

### Pitfall 1: App Router Layout Restructure Breaks Existing Routes
**What goes wrong:** Moving all pages under `[locale]/` breaks existing bookmarks, internal links, and API routes.
**Why it happens:** The `[locale]` segment changes every URL. Links like `/matches/123` become `/en/matches/123`.
**How to avoid:** (1) Proxy.ts handles redirect from `/matches/123` to `/en/matches/123` automatically via next-intl middleware. (2) API routes (`/api/cron/*`, `/api/updates/*`) must be EXCLUDED from the locale matcher — they stay at `/api/...` not `/en/api/...`. The matcher pattern `/((?!api|trpc|_next|_vercel|.*\\..*).*)`  already excludes them.
**Warning signs:** 404s on API cron routes after deployment, redirect loops on the home page.

### Pitfall 2: Odds API Quota Exhaustion
**What goes wrong:** Running out of The Odds API monthly credits, causing odds to go stale or disappear.
**Why it happens:** Each request costs `markets * regions` credits. With h2h market + eu,uk regions = 2 credits per request. Polling 5 leagues every 15 minutes = 5 * 4 * 24 * 2 = 960 credits/day = ~28,800/month. Free tier is only 500/month.
**How to avoid:** (1) Use paid plan (20K plan at $30/month covers this easily). (2) Poll only upcoming fixtures (next 7 days), not all fixtures. (3) Cache aggressively in database — serve from DB, not API. (4) Track quota via response headers (`x-requests-remaining`).
**Warning signs:** `x-requests-remaining` dropping faster than expected, 429 status codes.

### Pitfall 3: Geo Headers Empty in Local Development
**What goes wrong:** `X-Vercel-IP-Country` is always undefined locally, so betting content never shows or always shows during development.
**Why it happens:** Vercel geo headers only exist on deployed Vercel infrastructure.
**How to avoid:** (1) Use environment variable override for local dev: `OVERRIDE_COUNTRY=GB`. (2) Default to showing betting content in development mode. (3) Test geo-blocking on Vercel preview deployments.
**Warning signs:** Odds always/never visible in local dev, compliance not testable locally.

### Pitfall 4: Hydration Mismatches with Locale-Formatted Dates
**What goes wrong:** Server renders dates/numbers in one locale format, client hydrates with a different one, causing React hydration errors.
**Why it happens:** Server doesn't know user's timezone or preferred locale without the proxy passing it down. The existing `formatKickoffTime` already uses `suppressHydrationWarning` for this reason.
**How to avoid:** (1) Use next-intl's `setRequestLocale()` in layouts and pages to ensure consistent server/client locale. (2) For timezone-dependent displays, continue using `suppressHydrationWarning` as the codebase already does. (3) Use next-intl's `useFormatter` hook which handles the server/client boundary correctly.
**Warning signs:** React hydration warnings in console, dates flickering on page load.

### Pitfall 5: Stale Affiliate Links After Odds Change
**What goes wrong:** Displayed odds show 2.50 but the affiliate link leads to a bookmaker page where the odds have already changed.
**Why it happens:** Odds change frequently; cached links may point to stale betslip states.
**How to avoid:** (1) Accept this as inherent to odds comparison — the link is the entry point, not a guarantee. (2) Show "last updated" timestamp on odds. (3) Use `includeLinks=true` to get the latest links with each odds refresh. (4) Short cache TTL for odds (5-15 minutes for upcoming matches).
**Warning signs:** User complaints about price differences between site and bookmaker.

### Pitfall 6: Translation Key Sprawl
**What goes wrong:** Hundreds of unorganised translation keys make maintenance painful and translations incomplete.
**Why it happens:** No naming convention, keys added ad-hoc, no tooling to detect missing translations.
**How to avoid:** (1) Namespace keys by feature area (Common, Navigation, Odds, MatchDetail, etc.). (2) Start with English as the source file, then translate. (3) Use TypeScript type safety — next-intl supports typed message keys. (4) Build a CI check that compares key sets across language files.
**Warning signs:** Missing translations showing raw keys in production, inconsistent naming.

### Pitfall 7: proxy.ts Running on Node.js, Not Edge
**What goes wrong:** Performance expectations based on edge middleware don't apply; proxy.ts in Next.js 16 runs on Node.js runtime.
**Why it happens:** Next.js 16 renamed middleware.ts to proxy.ts and changed the runtime from edge to Node.js.
**How to avoid:** (1) Accept this is the new standard — proxy.ts runs on Node.js. (2) Keep proxy logic lightweight (geo header read + next-intl routing only). (3) Don't put heavy computation in proxy.ts.
**Warning signs:** Increased TTFB if proxy.ts does too much work.

## Code Examples

### next-intl Routing Configuration
```typescript
// src/i18n/routing.ts
// Source: https://next-intl.dev/docs/routing/setup
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es', 'de', 'it', 'fr'],
  defaultLocale: 'en',
});
```

### next-intl Request Configuration
```typescript
// src/i18n/request.ts
// Source: https://next-intl.dev/docs/routing/setup
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

### next-intl Navigation Helpers
```typescript
// src/i18n/navigation.ts
// Source: https://next-intl.dev/docs/routing/navigation
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

### Locale Layout with Provider
```typescript
// src/app/[locale]/layout.tsx
// Source: https://next-intl.dev/docs/routing/setup
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### next.config.ts with next-intl Plugin
```typescript
// next.config.ts
// Source: https://next-intl.dev/docs/getting-started/app-router
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {};
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
```

### Locale-Aware Date Formatting (Replacing Current Implementation)
```typescript
// In a client component:
// Source: https://next-intl.dev/docs/usage/dates-times
import { useFormatter } from 'next-intl';

function MatchKickoff({ kickoff }: { kickoff: Date }) {
  const format = useFormatter();

  // Replaces current formatKickoffTime() which is hardcoded to en-GB
  const time = format.dateTime(kickoff, {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return <span suppressHydrationWarning>{time}</span>;
}
```

### Locale-Aware Number Formatting
```typescript
// Source: https://next-intl.dev/docs/usage/numbers
import { useFormatter } from 'next-intl';

function StatValue({ value }: { value: number }) {
  const format = useFormatter();
  // 1,000 in EN vs 1.000 in DE — handled automatically
  return <span>{format.number(value)}</span>;
}
```

### The Odds API Request with Deep Links
```typescript
// src/lib/odds-api/client.ts
// Source: https://the-odds-api.com/liveapi/guides/v4/

const BASE_URL = 'https://api.the-odds-api.com';

export async function fetchOddsForSport(
  sportKey: string,
  options: {
    regions?: string;
    markets?: string;
    eventIds?: string[];
  } = {}
) {
  const url = new URL(`/v4/sports/${sportKey}/odds`, BASE_URL);
  url.searchParams.set('apiKey', process.env.ODDS_API_KEY!);
  url.searchParams.set('regions', options.regions ?? 'eu,uk');
  url.searchParams.set('markets', options.markets ?? 'h2h');
  url.searchParams.set('oddsFormat', 'decimal');
  url.searchParams.set('dateFormat', 'iso');
  url.searchParams.set('includeLinks', 'true');
  url.searchParams.set('includeSids', 'true');

  if (options.eventIds?.length) {
    url.searchParams.set('eventIds', options.eventIds.join(','));
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Odds API error: ${response.status}`);
  }

  // Track quota
  const quotaInfo = {
    remaining: Number(response.headers.get('x-requests-remaining')),
    used: Number(response.headers.get('x-requests-used')),
    lastCost: Number(response.headers.get('x-requests-last')),
  };

  const data = await response.json();
  return { data, quota: quotaInfo };
}
```

### Geo-Compliance Config
```typescript
// src/lib/geo/compliance.ts

export const TIER_1_COUNTRIES = new Set([
  'GB', // United Kingdom
  'DK', // Denmark
  'SE', // Sweden
  'FR', // France
  'PT', // Portugal
  'AT', // Austria
  'CH', // Switzerland
  'DE', // Germany
]);

// Everything else is Tier 2 (blocked)
export function shouldShowBetting(countryCode: string | null): boolean {
  if (!countryCode) return false;
  return TIER_1_COUNTRIES.has(countryCode.toUpperCase());
}

export function getComplianceContext(countryCode: string | null) {
  return {
    countryCode: countryCode?.toUpperCase() ?? null,
    showBetting: shouldShowBetting(countryCode),
    // Italy specifically mentioned as "complete ban" in requirements
    isCompletelyBanned: countryCode?.toUpperCase() === 'IT',
  };
}
```

### Affiliate Click Tracking API Route
```typescript
// src/app/api/clicks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/connection';
import { affiliateClicks } from '@/db/schema';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const country = request.headers.get('x-vercel-ip-country');

  await getDb().insert(affiliateClicks).values({
    fixtureId: body.fixtureId,
    bookmakerKey: body.bookmakerKey,
    outcome: body.outcome,
    odds: body.odds,
    country: country ?? null,
  });

  return NextResponse.json({ ok: true });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| middleware.ts (edge runtime) | proxy.ts (Node.js runtime) | Next.js 16.0 (Dec 2025) | File must be named proxy.ts, function export named proxy, runs on Node.js |
| next-i18next (Pages Router) | next-intl (App Router) | ~2023 onward | next-intl is the standard for App Router; next-i18next for Pages Router only |
| react-intl standalone | next-intl (wraps Intl APIs + adds routing) | ~2023 | next-intl adds App Router integration, SSR message passing, routing |
| Manual IP geolocation services | Vercel built-in geo headers | Available since 2022 | No external dependency needed on Vercel deployments |
| The Odds API v3 | The Odds API v4 | 2021 | v4 added includeLinks, includeSids, per-event odds, historical data |

**Deprecated/outdated:**
- `middleware.ts` filename: Still works in Next.js 16 but deprecated; use `proxy.ts`
- `req.geo` on NextRequest: Only available in middleware/proxy, not in server components. Use `@vercel/functions` geolocation() helper or read headers directly.
- Pages Router i18n config (`next.config.js i18n` key): Not supported in App Router; use next-intl middleware instead.

## Open Questions

1. **The Odds API Sport Key Discovery**
   - What we know: The API uses sport keys like `soccer_epl`, `soccer_germany_bundesliga`, `soccer_spain_la_liga`, `soccer_italy_serie_a`, `soccer_france_ligue_one`. These are confirmed by search results and documentation examples.
   - What's unclear: The `/v4/sports` endpoint documentation sample doesn't list all available soccer keys in the example response. The Big 5 league keys are confirmed by multiple sources but are LOW confidence because we haven't made a live API call.
   - Recommendation: On first implementation, call `/v4/sports` with a live API key to get the definitive list and map to internal league slugs. This costs 0 credits.

2. **includeLinks Bookmaker Coverage**
   - What we know: The API's includeLinks parameter returns betslip deep links. FanDuel and Betfair are confirmed to support deep links. The response structure includes link fields at outcome, market, and event levels.
   - What's unclear: Which EU/UK bookmakers actually return deep links? Not all bookmakers support this. Some may only return event-level links (bookmaker's match page), not outcome-level betslip links.
   - Recommendation: Test with a live API call using `includeLinks=true&regions=eu,uk` and inspect which bookmakers provide outcome-level links. Build the UI to gracefully handle missing links (fall back to bookmaker homepage).

3. **Odds API Paid Plan Needed**
   - What we know: Free tier = 500 credits/month. h2h + eu,uk = 2 credits per request. Even conservative polling (5 leagues, 4x/day) uses ~300 credits/month.
   - What's unclear: Will the actual polling frequency and number of concurrent leagues stay within the 20K plan ($30/month)?
   - Recommendation: Start with the 20K plan ($30/month). Implement quota monitoring from day one. Log `x-requests-remaining` in the api_call_log table.

4. **Team Name Translation Sources**
   - What we know: Team names need to be translated per locale (I18N-03). The database currently stores one `name` per team in the `teams` table.
   - What's unclear: Where to source official translated team names? Options: (a) manual curation, (b) Wikipedia API, (c) hardcoded lookup table for ~100 teams.
   - Recommendation: Start with a `team_translations` database table with manual curation for the ~100 teams across 5 leagues. Most European club names are recognisable across languages (e.g., "Bayern Munich" vs "Bayern München"), so the translation scope is manageable. Flag any team without a translation to fall back to the English name.

5. **Germany Revenue-Share Restriction**
   - What we know: CONTEXT.md notes that Germany bans revenue-share affiliate models; must use CPC/CPA deals. This is described as a "business constraint, not a code concern."
   - What's unclear: Does the code need to handle Germany differently (e.g., different affiliate links)?
   - Recommendation: The code treats Germany the same as other Tier 1 countries. The business constraint is about the commercial arrangement with bookmakers, not the display logic. No code differentiation needed.

## Sources

### Primary (HIGH confidence)
- [The Odds API v4 Documentation](https://the-odds-api.com/liveapi/guides/v4/) - Endpoints, parameters, response format, quota system
- [The Odds API Deep Links](https://the-odds-api.com/releases/deep-links.html) - includeLinks parameter, betslip URL structure
- [next-intl Routing Setup](https://next-intl.dev/docs/routing/setup) - routing.ts, middleware/proxy.ts, [locale] segment
- [next-intl App Router Getting Started](https://next-intl.dev/docs/getting-started/app-router) - Installation, config files, translation usage
- [next-intl Middleware/Proxy](https://next-intl.dev/docs/routing/middleware) - Proxy composition, matcher config, Accept-Language detection
- [next-intl Date/Time Formatting](https://next-intl.dev/docs/usage/dates-times) - useFormatter, dateTime, relativeTime
- [next-intl Number Formatting](https://next-intl.dev/docs/usage/numbers) - Locale-aware number formatting, decimal separators
- [Vercel Geo IP Headers](https://vercel.com/kb/guide/geo-ip-headers-geolocation-vercel-functions) - X-Vercel-IP-Country, @vercel/functions geolocation()
- [Next.js 16 proxy.ts Migration](https://nextjs.org/docs/messages/middleware-to-proxy) - middleware.ts renamed to proxy.ts, Node.js runtime

### Secondary (MEDIUM confidence)
- [The Odds API Football Coverage](https://the-odds-api.com/sports-odds-data/football-odds.html) - Confirmed coverage of Big 5 leagues
- [The Odds API Bookmaker List](https://the-odds-api.com/sports-odds-data/bookmaker-apis.html) - EU/UK bookmaker keys and regional mapping
- [Next.js 16 Upgrading Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) - proxy.ts breaking changes
- [The Odds API Pricing](https://the-odds-api.com/) - 500 free credits, paid plans from $30/month

### Tertiary (LOW confidence)
- Sport key naming convention (soccer_epl, soccer_germany_bundesliga, etc.) - Confirmed by multiple search results but not from a single authoritative full list; needs live API validation
- includeLinks response structure at outcome level - Confirmed by deep links docs and search results, but exact field placement for EU bookmakers needs live testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - next-intl and Vercel geo headers are well-documented with official sources
- Architecture: HIGH - Patterns derived from official next-intl docs + existing codebase patterns
- The Odds API integration: MEDIUM - API docs are comprehensive but some details (sport keys, bookmaker link coverage) need live API validation
- Geo-compliance: MEDIUM - Vercel headers verified; country tier lists are business decisions from CONTEXT.md
- Pitfalls: HIGH - Common i18n/odds pitfalls well-documented in community and official sources
- Affiliate link tracking: MEDIUM - includeLinks feature confirmed but exact bookmaker support in EU/UK regions needs testing

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days — both next-intl and The Odds API are stable)
