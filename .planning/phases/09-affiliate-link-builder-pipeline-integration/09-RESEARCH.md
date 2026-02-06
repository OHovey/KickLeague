# Phase 9: Affiliate Link Builder & Pipeline Integration - Research

**Researched:** 2026-02-06
**Domain:** Affiliate link construction, bookmaker URL tracking, data pipeline enrichment
**Confidence:** HIGH

## Summary

This phase adds affiliate link construction and tracking to an existing codebase that already has odds display (OddsComparisonTable, OddsCell), click tracking (POST /api/clicks), and a manual seed script (scripts/seed-odds.ts). The core work is: (1) a static config mapping bookmaker keys to affiliate programs and their tracking parameters, (2) a link builder function implementing a priority chain (API link > sid-constructed link > homepage fallback) with affiliate param appending, (3) integrating that builder into the seed script and creating an odds poll cron route, and (4) adding an `affiliateProgram` field to click tracking.

No new libraries are needed. This is pure application logic -- a config file, a pure function (link builder), pipeline integration points, a schema migration, and minor UI wiring. The Odds API already returns `link` and `sid` fields (client.ts already requests `includeLinks=true` and `includeSids=true`). The existing `home_link`, `draw_link`, `away_link` columns in `fixture_odds` already store link URLs. The existing `OddsCell` component already opens links on click and fires tracking events.

**Primary recommendation:** Build the link builder as a pure function in `src/lib/affiliate/link-builder.ts` that takes bookmaker key, API-provided link, sid, and outcome, and returns the best affiliate-enriched URL. Integrate it at the data layer (seed script + new odds cron route) so links are pre-computed and stored in the database, not constructed at render time.

## Standard Stack

### Core

No new libraries needed. This phase uses only existing project dependencies.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | (existing) | Schema migration for affiliate_clicks column | Already in project |
| zod | (existing) | Config validation | Already in project |
| next.js 16 | (existing) | API route for odds cron | Already in project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @upstash/qstash | (existing) | Signature verification for odds cron route | New cron route needs same auth pattern as poll-matches |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Static config object | Database table for affiliate programs | DB table is overkill -- 5 programs change rarely, env vars drive IDs |
| Pre-computed links in DB | Runtime link construction in OddsCell | Runtime adds latency and complexity to a client component; pre-computed means the DB is the source of truth |

## Architecture Patterns

### Recommended Project Structure

```
src/
  lib/
    affiliate/
      config.ts          # Bookmaker -> affiliate program mapping (AFCFG-01)
      link-builder.ts     # Pure function: priority chain + param appending (LINK-01, LINK-02)
      link-builder.test.ts # Unit tests for all link construction paths
  db/
    schema/
      odds.ts            # Add affiliateProgram to affiliate_clicks (ANLYT-01)
  app/
    api/
      cron/
        refresh-odds/
          route.ts       # New QStash cron for odds polling (LINK-04)
scripts/
  seed-odds.ts           # Modify to use link builder (LINK-03)
```

### Pattern 1: Static Affiliate Config Map

**What:** A TypeScript object mapping bookmaker keys (from The Odds API) to affiliate program metadata: program name, tracking parameter name, env var key for the affiliate ID, homepage URL, and optional sid URL template.

**When to use:** Every time a link needs to be constructed or enriched.

**Example:**
```typescript
// src/lib/affiliate/config.ts

export interface AffiliateProgram {
  /** Human-readable program name for analytics */
  programName: string;
  /** The query parameter name this program uses for tracking */
  trackingParam: string;
  /** Environment variable name holding the affiliate ID */
  envVar: string;
  /** Bookmaker homepage URL (last-resort fallback) */
  homepage: string;
  /** Optional template for constructing deep links from sid.
   *  Use {sid} as placeholder. */
  sidTemplate?: string;
}

/**
 * Map from The Odds API bookmaker_key to affiliate program config.
 *
 * Not every bookmaker has an affiliate program. Bookmakers not in this
 * map will use API-provided links (if any) without affiliate tracking,
 * or no link at all.
 */
export const AFFILIATE_CONFIG: Record<string, AffiliateProgram> = {
  // Flutter Group
  paddypower: {
    programName: 'paddy_power',
    trackingParam: 'AFF_ID',
    envVar: 'PADDY_POWER_AFF_ID',
    homepage: 'https://www.paddypower.com/football',
  },
  // Entain Partners
  coral: {
    programName: 'entain',
    trackingParam: 'btag',
    envVar: 'ENTAIN_BTAG',
    homepage: 'https://www.coral.co.uk/football',
  },
  ladbrokes_uk: {
    programName: 'entain',
    trackingParam: 'btag',
    envVar: 'ENTAIN_BTAG',
    homepage: 'https://www.ladbrokes.com/football',
  },
  // Kindred Group
  unibet_uk: {
    programName: 'kindred',
    trackingParam: 'utm_source',
    envVar: 'KINDRED_AFF_ID',
    homepage: 'https://www.unibet.co.uk/football',
  },
  // 888
  '888sport': {
    programName: '888',
    trackingParam: 'a_aid',
    envVar: '888_AFF_ID',
    homepage: 'https://www.888sport.com/football',
  },
  // William Hill
  williamhill: {
    programName: 'william_hill',
    trackingParam: 'btag',
    envVar: 'WILLIAM_HILL_BTAG',
    homepage: 'https://sports.williamhill.com/betting/en-gb/football',
  },
};

/** Get affiliate config for a bookmaker, or undefined if not mapped */
export function getAffiliateConfig(bookmakerKey: string): AffiliateProgram | undefined {
  return AFFILIATE_CONFIG[bookmakerKey];
}

/** Get the affiliate ID from env vars, or undefined if not set */
export function getAffiliateId(config: AffiliateProgram): string | undefined {
  return process.env[config.envVar] || undefined;
}
```

### Pattern 2: Link Builder Pure Function

**What:** A pure function implementing the priority chain: API-provided deep link > sid-constructed deep link > bookmaker homepage fallback. Then appends the affiliate tracking parameter if an affiliate ID is configured.

**When to use:** Called during data ingestion (seed script, odds cron poll) to pre-compute enriched links before storing in DB.

**Example:**
```typescript
// src/lib/affiliate/link-builder.ts

import { getAffiliateConfig, getAffiliateId } from './config';

interface BuildLinkInput {
  bookmakerKey: string;
  apiLink: string | null;    // From The Odds API 'link' field
  sid: string | null;         // From The Odds API 'sid' field
}

interface BuildLinkResult {
  url: string | null;
  affiliateProgram: string | null;
}

/**
 * Build the best available affiliate-enriched link for a bookmaker outcome.
 *
 * Priority chain (LINK-01):
 * 1. API-provided deep link (e.g. Sky Bet betslip links)
 * 2. Sid-constructed deep link using bookmaker's URL template
 * 3. Bookmaker homepage fallback
 *
 * If no affiliate config exists for this bookmaker, returns the API link as-is.
 * If affiliate config exists but ID is not set, returns the link without tracking (AFCFG-03).
 */
export function buildAffiliateLink(input: BuildLinkInput): BuildLinkResult {
  const config = getAffiliateConfig(input.bookmakerKey);

  // Step 1: Determine base URL via priority chain
  let baseUrl: string | null = null;

  if (input.apiLink) {
    // Priority 1: API-provided deep link
    baseUrl = input.apiLink;
  } else if (input.sid && config?.sidTemplate) {
    // Priority 2: Construct from sid template
    baseUrl = config.sidTemplate.replace('{sid}', input.sid);
  } else if (config?.homepage) {
    // Priority 3: Homepage fallback
    baseUrl = config.homepage;
  }

  // No config AND no API link = no link possible
  if (!baseUrl) {
    return { url: null, affiliateProgram: null };
  }

  // Step 2: Append affiliate tracking param if configured
  if (config) {
    const affiliateId = getAffiliateId(config);
    if (affiliateId) {
      baseUrl = appendTrackingParam(baseUrl, config.trackingParam, affiliateId);
    }
    return { url: baseUrl, affiliateProgram: config.programName };
  }

  // Bookmaker not in affiliate config -- return API link as-is
  return { url: baseUrl, affiliateProgram: null };
}

/**
 * Append a tracking query parameter to a URL.
 * Handles both URLs with existing query strings and those without.
 */
function appendTrackingParam(url: string, param: string, value: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${param}=${encodeURIComponent(value)}`;
}
```

### Pattern 3: Pipeline Integration (Seed + Cron)

**What:** The link builder is called during data ingestion, not at render time. Both the seed script and the new odds cron route call `buildAffiliateLink()` for each outcome before upserting the `fixture_odds` row.

**When to use:** Every time odds data enters the system.

**Example:**
```typescript
// Integration point in seed-odds.ts and refresh-odds cron

// For each bookmaker outcome:
const homeResult = buildAffiliateLink({
  bookmakerKey: bookmaker.key,
  apiLink: homeOutcome.link ?? null,
  sid: homeOutcome.sid ?? null,
});

// Store enriched link in DB:
await db.insert(fixtureOdds).values({
  // ...existing fields...
  homeLink: homeResult.url,
  // ...
});
```

### Anti-Patterns to Avoid

- **Runtime link construction in React components:** OddsCell should read pre-computed links from the database, not call the link builder. This keeps the client component simple and ensures consistency.
- **Storing affiliate IDs in the database:** Affiliate IDs should only live in environment variables. The config maps bookmaker keys to env var names, not to the IDs themselves.
- **Coupling affiliate config to geo-filtering:** Phase 10 handles geo-filtering. Phase 9's config should not include country availability data -- keep concerns separate.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL query param manipulation | Custom string manipulation | `URL` class or simple `includes('?')` check | Edge cases with URL encoding, hash fragments |
| Environment variable loading | Custom config loader | `process.env[varName]` with undefined check | Standard Node.js pattern, no library needed |
| Cron route auth | Custom auth middleware | Same QStash signature pattern as `poll-matches/route.ts` | Already proven in the codebase |

**Key insight:** This phase is almost entirely application logic (config data + a pure function + DB integration). No libraries needed beyond what's already in the project.

## Common Pitfalls

### Pitfall 1: Forgetting to Handle Missing Affiliate IDs Gracefully

**What goes wrong:** If the code crashes or returns empty links when an env var is not set, users see broken odds with no links at all.
**Why it happens:** Treating missing affiliate ID as an error instead of a normal state.
**How to avoid:** The link builder MUST return a usable link even when the affiliate ID is not configured (AFCFG-03). The priority chain still runs -- the only difference is no tracking param is appended.
**Warning signs:** `if (!affiliateId) return null` or `throw` patterns in the link builder.

### Pitfall 2: Not Storing sid Values from the API

**What goes wrong:** The API returns `sid` values that enable deep link construction (AFCFG-04), but they're discarded during ingestion because the schema only stores the final computed link.
**Why it happens:** The current `fixtureOdds` schema has `homeLink`, `drawLink`, `awayLink` columns but no sid columns.
**How to avoid:** Two options:
  - **Option A (recommended):** Compute the enriched link at ingestion time and store only the final URL. The sid is consumed by the link builder and doesn't need to persist.
  - **Option B:** Add `homeSid`, `drawSid`, `awaySid` columns. Only needed if links need to be re-constructed later without re-fetching from the API.
**Recommendation:** Option A. The link builder runs at ingestion time. If affiliate config changes, the next poll cycle re-computes all links automatically.

### Pitfall 3: Bookmaker Key Mismatches

**What goes wrong:** The affiliate config uses keys like `paddypower` but the Odds API returns keys like `paddypower_gb` or a different variant.
**Why it happens:** The Odds API's bookmaker keys can vary by region (e.g. `unibet_uk` vs `unibet`).
**How to avoid:** Run the check-db.ts script to see all actual bookmaker keys in the database. Map those exact keys in the affiliate config. Use a prefix-matching fallback if needed (e.g., any key starting with `unibet` maps to Kindred).
**Warning signs:** Affiliate config entries that never match any odds row.

### Pitfall 4: Creating an Odds Cron Without Budget Awareness

**What goes wrong:** The odds cron poll burns through The Odds API quota (500 req/month on free tier) by polling all 5 leagues every 30 minutes.
**Why it happens:** Copying the match polling pattern without considering the different API's budget constraints.
**How to avoid:** The odds cron should be conservative -- perhaps once daily or on-demand. It should log quota usage from The Odds API's `x-requests-remaining` header. Consider only refreshing odds for matches within 48 hours of kickoff.
**Warning signs:** The free tier (500 req/month) being exhausted within days.

### Pitfall 5: Click Tracking Schema Migration Breaking Existing Data

**What goes wrong:** Adding a NOT NULL column `affiliate_program` to the existing `affiliate_clicks` table fails because existing rows have no value.
**Why it happens:** Not considering existing data in the migration.
**How to avoid:** Add the column as `varchar NULLABLE` (not NOT NULL). Existing clicks without affiliate program info retain null values. New clicks populate the field.

## Code Examples

### Existing Integration Points (verified from codebase)

**Seed script odds insertion (scripts/seed-odds.ts:200-235):**
```typescript
// Current: stores API link directly
homeLink: homeOutcome.link ?? null,
drawLink: drawOutcome.link ?? null,
awayLink: awayOutcome.link ?? null,

// After Phase 9: use link builder
const homeResult = buildAffiliateLink({
  bookmakerKey: bookmaker.key,
  apiLink: homeOutcome.link ?? null,
  sid: homeOutcome.sid ?? null,
});
// ... then store homeResult.url as homeLink
```

**OddsCell click handler (src/components/odds/OddsCell.tsx:39-53):**
```typescript
// Current: sends bookmakerKey to click tracking
body: JSON.stringify({ fixtureId, bookmakerKey, outcome, odds: value }),

// After Phase 9: also send affiliateProgram
body: JSON.stringify({
  fixtureId, bookmakerKey, outcome, odds: value,
  affiliateProgram: affiliateProgram ?? null,
}),
```

**Click tracking API (src/app/api/clicks/route.ts:48-54):**
```typescript
// Current: records bookmakerKey only
await db.insert(affiliateClicks).values({
  fixtureId, bookmakerKey, outcome, odds, country,
});

// After Phase 9: also record affiliateProgram
await db.insert(affiliateClicks).values({
  fixtureId, bookmakerKey, outcome, odds, country,
  affiliateProgram: body.affiliateProgram ?? null,
});
```

### New Odds Cron Route Pattern

```typescript
// src/app/api/cron/refresh-odds/route.ts
// Follows same pattern as poll-matches/route.ts

import { fetchOddsForSport } from '@/lib/odds-api/client';
import { buildAffiliateLink } from '@/lib/affiliate/link-builder';
import { SPORT_KEY_MAP } from '@/lib/odds-api/sport-keys';
// ... QStash verification, DB upsert with link builder
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sky Bet only bookmaker with API deep links | Still the case as of Feb 2026 | N/A | Must construct links for all other bookmakers via sid or homepage |
| Odds only seeded manually via script | Phase 9 adds cron-based refresh | Phase 9 | Links refresh automatically on each poll cycle |

**Key facts from existing research (HIGH confidence, from `.planning/research/affiliate-links/`):**
- Only Sky Bet provides deep links via The Odds API
- Sky Bet's affiliate program is CLOSED (invite-only since 2017)
- Betfair terminated UK/IE affiliate programme July 2025
- 5 active affiliate programs to sign up for: Paddy Power, Entain (Coral + Ladbrokes), Kindred (Unibet), 888, William Hill
- 40 bookmakers in the database from `regions=eu,uk`
- Tracking parameter names: `AFF_ID` (Paddy Power), `btag` (Entain, William Hill), `utm_source`/`pid` (Kindred), `a_aid` (888)

## Schema Changes Required

### 1. Add `affiliate_program` column to `affiliate_clicks`

```sql
ALTER TABLE affiliate_clicks
ADD COLUMN affiliate_program VARCHAR(50);
```

In Drizzle schema:
```typescript
affiliateProgram: varchar('affiliate_program', { length: 50 }),
```

### 2. No Changes to `fixture_odds`

The existing `home_link`, `draw_link`, `away_link` columns (varchar 1000) are sufficient. Links are currently stored as API-provided URLs or null. After Phase 9, they'll contain affiliate-enriched URLs instead.

## Data Flow

```
The Odds API ──[includeLinks=true, includeSids=true]──> Raw Response
                                                           │
                                                    link, sid per outcome
                                                           │
                                              ┌────────────▼──────────────┐
                                              │      Link Builder         │
                                              │  1. API link? Use it      │
                                              │  2. sid + template? Build │
                                              │  3. Homepage fallback     │
                                              │  4. Append ?param=id      │
                                              └────────────┬──────────────┘
                                                           │
                                                    enriched URL
                                                           │
                                              ┌────────────▼──────────────┐
                                              │    fixture_odds table     │
                                              │  home_link = enriched URL │
                                              │  draw_link = enriched URL │
                                              │  away_link = enriched URL │
                                              └────────────┬──────────────┘
                                                           │
                                              ┌────────────▼──────────────┐
                                              │     OddsCell component    │
                                              │  onClick: track + open    │
                                              └──────────────────────────┘
```

## Open Questions

1. **Exact bookmaker keys in the database**
   - What we know: The check-db.ts script lists all 40 bookmakers. The research doc (01-bookmaker-coverage.md) categorizes them as UK/EU/international.
   - What's unclear: The exact keys used by the Odds API for each bookmaker we want to map (e.g., is it `unibet_uk`, `unibet`, or `unibet_eu`?).
   - Recommendation: Run `check-db.ts` or query the DB directly before writing the config to get exact keys. The config should map ALL keys that we have affiliate programs for.

2. **Odds cron route scope and frequency**
   - What we know: LINK-04 requires a cron poll route that enriches odds with affiliate links. The Odds API has a 500 req/month free tier budget.
   - What's unclear: How often to poll (daily? match-day only?) and whether to poll all 5 leagues or just those with upcoming matches.
   - Recommendation: Start with a daily poll for all leagues. At 5 leagues x 1 poll/day = 150 req/month, well within budget. The architecture research suggested smart intervals, but daily is sufficient for pre-match odds.

3. **Sid template URLs per bookmaker**
   - What we know: The `sid` field contains bookmaker-specific IDs. Different bookmakers use different URL patterns.
   - What's unclear: The exact URL template for constructing deep links from sids for each bookmaker. This depends on bookmaker documentation received after affiliate program approval.
   - Recommendation: Start without sid templates (use API link or homepage fallback only). Add sid templates as bookmaker-specific documentation becomes available after affiliate program approval. The config structure supports this via the optional `sidTemplate` field.

4. **OddsCell needs affiliateProgram data to send in click tracking**
   - What we know: The click tracking API needs to record which affiliate program was used (ANLYT-01). OddsCell currently only has `bookmakerKey`.
   - What's unclear: Whether to look up the affiliate program client-side (from a shared config) or pass it from the server as additional data alongside the odds rows.
   - Recommendation: Pass `affiliateProgram` from the server action (`fetchOddsForFixture`) alongside each odds row. This avoids importing server-side config into client components.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/db/schema/odds.ts`, `scripts/seed-odds.ts`, `src/components/odds/OddsCell.tsx`, `src/components/odds/OddsComparisonTable.tsx`, `src/app/api/clicks/route.ts`, `src/lib/odds-api/client.ts`, `src/lib/odds-api/types.ts`
- Existing research: `.planning/research/affiliate-links/01-bookmaker-coverage.md`, `.planning/research/affiliate-links/02-affiliate-link-construction.md`
- Requirements: `.planning/REQUIREMENTS.md` (AFCFG-01 through ANLYT-01)
- Roadmap: `.planning/ROADMAP.md` (Phase 9 description and success criteria)

### Secondary (MEDIUM confidence)
- [The Odds API Deep Links documentation](https://the-odds-api.com/releases/deep-links.html) - link/sid field structure, priority chain pattern
- [The Odds API v4 documentation](https://the-odds-api.com/liveapi/guides/v4/) - includeLinks, includeSids parameters

### Tertiary (LOW confidence)
- Affiliate tracking parameter names (AFF_ID, btag, a_aid, utm_source) - from prior research and web search, exact params should be verified against each program's dashboard after sign-up

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, all existing project code
- Architecture: HIGH - config + pure function + pipeline integration is the established pattern
- Pitfalls: HIGH - identified from direct codebase inspection
- Affiliate parameter names: MEDIUM - from prior research, needs verification after program sign-up
- Sid URL templates: LOW - not available until affiliate programs approve and provide docs

**Research date:** 2026-02-06
**Valid until:** 2026-03-06 (stable domain -- affiliate programs and APIs don't change frequently)
