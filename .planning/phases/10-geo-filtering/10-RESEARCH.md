# Phase 10: Geo-Aware Bookmaker Filtering - Research

**Researched:** 2026-02-06
**Domain:** Geo-based bookmaker filtering, European gambling licensing, static config architecture
**Confidence:** HIGH

## Summary

This phase adds country-level bookmaker filtering on top of the existing geo-compliance system (Phase 7) and affiliate pipeline (Phase 9). The existing codebase already has: (1) `proxy.ts` setting `x-user-country` and `x-show-betting` headers, (2) a `TIER_1_COUNTRIES` set in `src/lib/geo/compliance.ts` that gates all betting content, (3) odds display in three locations (OddsComparisonTable on match detail pages, CompactOdds on MatchCard fixture cards, CompactOdds on team FixturesTab), and (4) server actions `fetchOddsForFixture` and `fetchCompactOdds` that query the database without any country-based filtering.

The core work is: (1) create a static TypeScript config mapping country codes to available bookmaker keys with priority ordering, (2) create a filtering function that takes a country code and returns the ordered list of allowed bookmaker keys, (3) thread the user's country code from proxy headers through to the odds server actions, (4) filter and sort odds rows in the server actions before returning to components, and (5) add UX indicators (bookmaker count note, "no odds in your region" message, silent omission for restricted countries).

**Primary recommendation:** Use a static TypeScript config file (`src/lib/geo/bookmaker-availability.ts`) rather than a database table. The mapping changes infrequently (config change + deploy per the user's decision), there are only 8 bookmakers and ~15-20 country entries, and this avoids migration complexity. All filtering happens server-side in the existing server actions so no new API endpoints are needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Country-level granularity only (ISO country codes, no sub-regions)
- Map every country where at least one of the 8 bookmakers is licensed (best-effort research by Claude)
- Reuse existing proxy header geo detection from Phase 7
- Countries that ban online gambling entirely: hide odds section silently (no message, no gambling content shown)
- Updates via config change + deploy (changes are infrequent)
- Unknown/unmapped countries: show GB bookmaker set as default (all 8 bookmakers)
- Geo detection failure (no header/IP): treat same as unknown country -- GB default
- Show subtle note when serving fallback: "Showing bookmakers for your region" or similar
- Accept geo headers as-is -- no VPN detection or override attempts
- Manual priority number per bookmaker per country in the config
- Ties broken alphabetically
- Consistent ordering everywhere bookmakers appear (odds tables, match pages, team tabs)
- No user preference override -- everyone in the same country sees the same order
- Odds table shrinks to show only available bookmakers (no empty columns)
- When no bookmakers available for a match in user's country: show "No odds available in your region" message
- Subtle count indicator: "3 of 8 bookmakers shown for your region"
- Restricted countries: silently omit the odds section entirely (no message, no gambling references)

### Claude's Discretion
- Storage approach for the mapping data (static config vs DB table -- user said "you decide")
- Exact placement and styling of the region note and bookmaker count
- How to integrate filtering into the existing odds display pipeline
- Specific list of restricted countries

### Deferred Ideas (OUT OF SCOPE)
- User preference for bookmaker ordering (pin favorite bookmaker first) -- future feature
- Sub-region granularity (e.g. UK nations with different licensing) -- not needed for current 8 bookmakers
</user_constraints>

## Standard Stack

### Core

No new libraries needed. This phase uses only existing project dependencies.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next.js 16 | (existing) | Proxy headers for geo context | Already in project |
| next-intl | (existing) | Translation keys for new UX strings | Already in project |
| drizzle-orm | (existing) | No schema changes needed | Already in project |

### Supporting

None -- this is pure application logic with static config.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Static TS config | Database table (geo_bookmaker_availability) | DB table is overkill: 8 bookmakers, ~20 countries, infrequent changes, user explicitly said "config change + deploy" is fine. Static config avoids migration, is type-safe, tree-shakeable, and testable without DB |
| Server-side filtering in actions | Client-side filtering in components | Server-side is better: prevents restricted bookmaker data from ever reaching the client, aligns with existing server action pattern, single filtering point |

## The 8 Bookmakers

These are the bookmaker keys from The Odds API that the project currently uses (confirmed from `AFFILIATE_CONFIG` in `src/lib/affiliate/config.ts` and the `uk`/`eu` region lists):

| Bookmaker Key | Display Name | Affiliate Program | API Region |
|---------------|-------------|-------------------|------------|
| `paddypower` | Paddy Power | Flutter Group | uk |
| `coral` | Coral | Entain Partners | uk |
| `ladbrokes_uk` | Ladbrokes | Entain Partners | uk |
| `unibet_uk` | Unibet | Kindred Group | uk |
| `williamhill` | William Hill | William Hill | uk |
| `sport888` | 888sport | 888 | uk |
| `skybet` | Sky Bet | (none configured) | uk |
| `betfair_sb_uk` | Betfair Sportsbook | (none configured) | uk |

**Note:** All 8 use the `uk` region key in The Odds API, but `888sport` uses key `sport888` in the API while the affiliate config maps `888sport`. The actual bookmaker keys stored in `fixture_odds.bookmaker_key` are whatever The Odds API returns. The seed/refresh pipeline stores these directly from `bookmaker.key` in the API response.

**Important:** Need to verify whether the key in the DB is `sport888` or `888sport`. The affiliate config maps `888sport` but The Odds API bookmaker list shows the key as `sport888`. This discrepancy should be validated during implementation.

## Country-Bookmaker Availability Matrix

Based on research into each bookmaker's licensing and accepted territories. This is best-effort from public sources -- licensing changes frequently.

**Confidence: MEDIUM** -- based on CheekPunter restriction lists, Wikipedia, and official help pages. Not verified against each bookmaker's current T&Cs directly.

### Tier 1 Countries (Show Betting Content -- from Phase 7 compliance.ts)

| Country | Code | Available Bookmakers | Notes |
|---------|------|---------------------|-------|
| United Kingdom | GB | All 8 | Primary market, all bookmakers licensed |
| Ireland | IE | paddypower, coral, ladbrokes_uk, unibet_uk, williamhill, sport888, skybet, betfair_sb_uk | Most UK bookmakers also serve Ireland |
| Sweden | SE | unibet_uk, williamhill, coral, ladbrokes_uk, betfair_sb_uk | Regulated market, several UK bookmakers accept Swedish customers |
| Denmark | DK | unibet_uk, betfair_sb_uk | Highly regulated, most UK bookmakers restricted |
| France | FR | unibet_uk | Very restricted market -- most UK bookmakers blocked. Unibet operates via separate French license (unibet.fr) |
| Portugal | PT | betfair_sb_uk | Limited availability |
| Austria | AT | unibet_uk, williamhill, betfair_sb_uk | Relatively open market |
| Switzerland | CH | unibet_uk, williamhill, betfair_sb_uk | Open to international operators |
| Germany | DE | williamhill, betfair_sb_uk | Regulated since 2021. Many UK bookmakers restricted. William Hill limited services |

### Restricted Countries (No Betting Content -- Tier 2 from Phase 7)

All countries NOT in the TIER_1_COUNTRIES set are already blocked by the existing `shouldShowBetting()` function. No changes needed here -- the existing system silently hides all betting content for these countries.

From Phase 7 CONTEXT.md:
> **Tier 2 -- Geo-block ALL betting content:** Italy, Belgium, Norway, Netherlands, Poland, Spain, and all other countries

### Countries That Completely Ban Online Gambling

These overlap with Tier 2 (already blocked) so no additional handling needed:
- Most Middle Eastern countries
- North Korea
- China (mainland)

The existing Phase 7 Tier 2 system already blocks these.

### Note on Ireland (IE)

Ireland is NOT in the current `TIER_1_COUNTRIES` set but the success criteria mention showing bookmakers. Looking at the current code:

```typescript
export const TIER_1_COUNTRIES = new Set<string>([
  'GB', 'DK', 'SE', 'FR', 'PT', 'AT', 'CH', 'DE',
]);
```

Ireland (IE) is **missing** from Tier 1. This means Irish users currently see NO betting content. This may be intentional (Phase 7 decided the tier list) or an oversight. Most of the 8 bookmakers accept Irish customers. **This should be flagged to the user during planning** -- Ireland is a major market for these bookmakers.

## Architecture Patterns

### Recommended Project Structure

```
src/
  lib/
    geo/
      compliance.ts              # Existing -- TIER_1_COUNTRIES, shouldShowBetting()
      types.ts                   # Existing -- GeoContext interface
      bookmaker-availability.ts  # NEW -- country->bookmaker mapping + filtering
      bookmaker-availability.test.ts  # NEW -- unit tests
  components/
    odds/
      actions.ts                 # MODIFY -- add country parameter, filter/sort results
      OddsComparisonTable.tsx    # MODIFY -- pass country, show bookmaker count note
      CompactOdds.tsx            # MODIFY -- accept filtered bookmaker count
      RegionNote.tsx             # NEW -- subtle "X of Y bookmakers for your region" indicator
  proxy.ts                       # EXISTING -- already sets x-user-country header
  messages/
    en.json                      # MODIFY -- add new i18n keys for geo UX
    de.json, fr.json, etc.       # MODIFY -- translations for new keys
```

### Pattern 1: Static Config with Type-Safe Lookup

**What:** A TypeScript module exporting a `BOOKMAKER_AVAILABILITY` map from ISO country code to an array of `{ bookmakerKey, priority }` entries, plus a `getAvailableBookmakers(countryCode)` function that returns the filtered, sorted list.

**When to use:** Every time odds need to be filtered by country.

**Example:**
```typescript
// src/lib/geo/bookmaker-availability.ts

interface BookmakerEntry {
  bookmakerKey: string;
  priority: number;  // lower = shown first (1 = top priority)
}

/** Country -> available bookmakers with priority ordering */
const BOOKMAKER_AVAILABILITY: Record<string, BookmakerEntry[]> = {
  GB: [
    { bookmakerKey: 'paddypower', priority: 1 },
    { bookmakerKey: 'williamhill', priority: 2 },
    { bookmakerKey: 'coral', priority: 3 },
    { bookmakerKey: 'ladbrokes_uk', priority: 4 },
    { bookmakerKey: 'skybet', priority: 5 },
    { bookmakerKey: 'unibet_uk', priority: 6 },
    { bookmakerKey: 'sport888', priority: 7 },
    { bookmakerKey: 'betfair_sb_uk', priority: 8 },
  ],
  FR: [
    { bookmakerKey: 'unibet_uk', priority: 1 },
  ],
  // ... more countries
};

const GB_DEFAULT = BOOKMAKER_AVAILABILITY['GB'];

/**
 * Get available bookmakers for a country, sorted by priority.
 * Falls back to GB set for unknown/unmapped countries.
 */
export function getAvailableBookmakers(countryCode: string | null): BookmakerEntry[] {
  if (!countryCode) return GB_DEFAULT;
  const entries = BOOKMAKER_AVAILABILITY[countryCode.toUpperCase()];
  if (!entries) return GB_DEFAULT;
  // Sort by priority, then alphabetically by key for ties
  return [...entries].sort((a, b) =>
    a.priority !== b.priority
      ? a.priority - b.priority
      : a.bookmakerKey.localeCompare(b.bookmakerKey)
  );
}

/**
 * Check if a country is mapped (vs falling back to GB default).
 * Used to show "Showing bookmakers for your region" note on fallback.
 */
export function isCountryMapped(countryCode: string | null): boolean {
  if (!countryCode) return false;
  return countryCode.toUpperCase() in BOOKMAKER_AVAILABILITY;
}
```

### Pattern 2: Server Action Filtering Integration

**What:** The existing `fetchOddsForFixture` and `fetchCompactOdds` server actions gain a `countryCode` parameter. They call `getAvailableBookmakers()` to get the allowed set, then filter DB results to only include those bookmakers, sorted by priority.

**When to use:** Every odds fetch operation.

**Example:**
```typescript
// In src/components/odds/actions.ts

export async function fetchOddsForFixture(
  fixtureId: number,
  countryCode: string | null  // NEW parameter
): Promise<FixtureOddsResult | null> {
  // ... existing DB query ...

  // Get allowed bookmakers for this country
  const available = getAvailableBookmakers(countryCode);
  const allowedKeys = new Set(available.map(b => b.bookmakerKey));
  const priorityMap = new Map(available.map(b => [b.bookmakerKey, b.priority]));

  // Filter to only allowed bookmakers
  const filtered = oddsRows.filter(r => allowedKeys.has(r.bookmakerKey));

  // Sort by priority (not by odds anymore)
  filtered.sort((a, b) => {
    const pA = priorityMap.get(a.bookmakerKey) ?? 999;
    const pB = priorityMap.get(b.bookmakerKey) ?? 999;
    if (pA !== pB) return pA - pB;
    return a.bookmakerKey.localeCompare(b.bookmakerKey);
  });

  return {
    odds: filtered,
    fetchedAt: latestFetchedAt.toISOString(),
    totalBookmakers: oddsRows.length,  // NEW: for "X of Y" display
  };
}
```

### Pattern 3: Country Code Threading

**What:** The user's country code needs to flow from proxy headers through to server actions. The existing pattern uses `headers()` in server actions to read `x-show-betting`. Extend this to also read `x-user-country`.

**Key integration points:**

1. **Match detail page** (`src/app/[locale]/matches/[id]/page.tsx`): Already reads `x-show-betting` from headers. Add `x-user-country` read, pass to `OddsComparisonTable`.

2. **MatchListClient** (`src/components/matches/MatchListClient.tsx`): Already calls `getShowBetting()` server action. Add a `getCountryCode()` server action or extend `getShowBetting()` to return both values.

3. **TeamTabs** (`src/components/team-detail/TeamTabs.tsx`): Same pattern as MatchListClient -- calls `getShowBetting()`, needs country code too.

**Recommended approach:** Create a single `getGeoContext()` server action that returns `{ showBetting: boolean, countryCode: string | null, isMapped: boolean }`. Replace all `getShowBetting()` calls with this. This avoids multiple header reads and provides all geo info in one call.

```typescript
// In src/components/matches/actions.ts (or new geo actions file)

export async function getGeoContext(): Promise<{
  showBetting: boolean;
  countryCode: string | null;
  isMapped: boolean;
}> {
  const headerStore = await headers();
  const countryCode = headerStore.get('x-user-country') ?? null;
  const showBetting = headerStore.get('x-show-betting') === '1';
  return {
    showBetting,
    countryCode,
    isMapped: isCountryMapped(countryCode),
  };
}
```

### Anti-Patterns to Avoid

- **Client-side filtering:** Never send all 8 bookmakers' data to the client and filter there. A French user should never receive UK-only bookmaker odds in the response payload.
- **Separate API endpoint for geo config:** Overkill -- the config is static and can be imported directly in server actions. No need for a `/api/geo-config` route.
- **Modifying the database query to filter by bookmaker:** While you could add a `WHERE bookmaker_key IN (...)` clause, it is simpler and more maintainable to query all odds and filter in JS. The dataset is tiny (max 8 rows per fixture).
- **Storing country availability in the database:** Adds migration complexity, requires admin UI for updates, and the data changes infrequently (user confirmed config+deploy workflow).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Geo detection | Custom IP lookup service | Existing `x-vercel-ip-country` header via proxy.ts | Already implemented in Phase 7, Vercel does it for free |
| Country code validation | Custom ISO code validator | Simple string uppercasing + map lookup | Only 15-20 entries, not worth a library |
| Bookmaker licensing data | Scraping bookmaker websites | Static config with best-effort research | Data changes infrequently, manual updates are fine |

## Common Pitfalls

### Pitfall 1: Forgetting to Update CompactOdds Data

**What goes wrong:** `fetchCompactOdds` returns best odds across ALL bookmakers, not just the ones available in the user's country. A French user might see "best odds 2.50 from 8 bookmakers" but clicking through shows only Unibet.

**Why it happens:** `fetchCompactOdds` is a separate server action from `fetchOddsForFixture` and is easy to forget when adding filtering.

**How to avoid:** Both `fetchOddsForFixture` AND `fetchCompactOdds` must accept a `countryCode` parameter and filter. The compact odds should show "from N bookmakers" where N is the filtered count.

**Warning signs:** Mismatch between compact odds bookmaker count and full comparison table row count.

### Pitfall 2: Sorting by Priority Breaks "Best Odds" Highlighting

**What goes wrong:** The current OddsComparisonTable sorts by best home odds descending. Phase 10 changes sorting to priority order. The "best odds" highlighting (green) must still work correctly after re-sorting.

**Why it happens:** Best odds calculation happens after sorting. If you compute best odds on the full set then filter, the "best" marker might refer to a filtered-out bookmaker.

**How to avoid:** Compute `bestHome`/`bestDraw`/`bestAway` AFTER filtering, not before. The existing code already does this in the component from the `data.odds` array, so as long as the server action returns only filtered rows, this works automatically.

**Warning signs:** No row in the table has the green "best" highlight.

### Pitfall 3: Country Code Case Sensitivity

**What goes wrong:** Vercel's `x-vercel-ip-country` returns uppercase (e.g., "GB"), but the config map keys must match exactly. If someone adds a lowercase entry to the config, lookups fail silently and fall back to GB default.

**Why it happens:** TypeScript Record keys are case-sensitive.

**How to avoid:** Always `toUpperCase()` the country code before lookup. Document that config keys MUST be uppercase ISO 3166-1 alpha-2. Add a type assertion or validation.

### Pitfall 4: OddsComparisonTable's showBetting Check Is Binary

**What goes wrong:** Currently, if `showBetting=true`, the component renders regardless. But Phase 10 introduces a state where betting is "shown" (Tier 1 country) but zero bookmakers are available for a specific match. The component must handle: odds loaded but empty after filtering.

**Why it happens:** The existing `noOdds` state only triggers when no odds exist in the DB at all. After geo filtering, odds may exist but be empty for a particular country.

**How to avoid:** The server action should return filtered results. If the filtered array is empty, the existing `!data || data.odds.length === 0` check handles it -- but the message should change from "Odds not available" to "No odds available in your region" when odds exist but are filtered out. This requires passing additional context (e.g., `totalBookmakers` vs `filteredBookmakers`).

### Pitfall 5: Missing Ireland (IE) in Tier 1

**What goes wrong:** Irish users see no betting content at all because IE is not in `TIER_1_COUNTRIES`. Most of the 8 bookmakers (Paddy Power, Coral, Ladbrokes, William Hill, 888sport, Sky Bet, Unibet, Betfair) accept Irish customers.

**Why it happens:** Phase 7's CONTEXT.md defined 8 Tier 1 countries and did not include Ireland. This may have been intentional (affiliate licensing) or an oversight.

**How to avoid:** Flag this to the user during planning. If IE should show betting content, add it to `TIER_1_COUNTRIES` as part of this phase. If intentionally excluded, document why.

## Code Examples

### Reading Country Code in Server Actions

```typescript
// src/components/matches/actions.ts

import { headers } from 'next/headers';
import { isCountryMapped } from '@/lib/geo/bookmaker-availability';

export async function getGeoContext(): Promise<{
  showBetting: boolean;
  countryCode: string | null;
  isMapped: boolean;
}> {
  const headerStore = await headers();
  const countryCode = headerStore.get('x-user-country') ?? null;
  const showBetting = headerStore.get('x-show-betting') === '1';
  return {
    showBetting,
    countryCode,
    isMapped: isCountryMapped(countryCode),
  };
}
```

### Filtering Odds in Server Action

```typescript
// Modified fetchOddsForFixture in src/components/odds/actions.ts

import { getAvailableBookmakers } from '@/lib/geo/bookmaker-availability';

export async function fetchOddsForFixture(
  fixtureId: number,
  countryCode: string | null
): Promise<FixtureOddsResult | null> {
  if (!isDatabaseConfigured()) return null;

  const db = getDb();
  const rows = await db
    .select()
    .from(fixtureOdds)
    .where(eq(fixtureOdds.fixtureId, fixtureId));

  if (rows.length === 0) return null;

  const available = getAvailableBookmakers(countryCode);
  const allowedKeys = new Set(available.map(b => b.bookmakerKey));
  const priorityMap = new Map(available.map(b => [b.bookmakerKey, b.priority]));

  const oddsRows: OddsRow[] = rows
    .filter(r => allowedKeys.has(r.bookmakerKey))
    .map(r => {
      const affiliateCfg = getAffiliateConfig(r.bookmakerKey);
      return {
        bookmakerKey: r.bookmakerKey,
        bookmakerTitle: r.bookmakerTitle,
        homeOdds: r.homeOdds,
        drawOdds: r.drawOdds,
        awayOdds: r.awayOdds,
        homeLink: r.homeLink,
        drawLink: r.drawLink,
        awayLink: r.awayLink,
        prevHomeOdds: r.prevHomeOdds,
        prevDrawOdds: r.prevDrawOdds,
        prevAwayOdds: r.prevAwayOdds,
        affiliateProgram: affiliateCfg?.programName ?? null,
        lastUpdated: r.lastUpdated.toISOString(),
      };
    })
    .sort((a, b) => {
      const pA = priorityMap.get(a.bookmakerKey) ?? 999;
      const pB = priorityMap.get(b.bookmakerKey) ?? 999;
      if (pA !== pB) return pA - pB;
      return a.bookmakerKey.localeCompare(b.bookmakerKey);
    });

  const latestFetchedAt = rows.reduce(
    (latest, r) => (r.fetchedAt > latest ? r.fetchedAt : latest),
    rows[0].fetchedAt
  );

  return {
    odds: oddsRows,
    fetchedAt: latestFetchedAt.toISOString(),
    totalBookmakers: rows.length,
  };
}
```

### Region Note Component

```typescript
// src/components/odds/RegionNote.tsx

'use client';

import { useTranslations } from 'next-intl';

interface RegionNoteProps {
  filteredCount: number;
  totalCount: number;
  isFallback: boolean;
}

export function RegionNote({ filteredCount, totalCount, isFallback }: RegionNoteProps) {
  const t = useTranslations('Odds');

  if (filteredCount === totalCount && !isFallback) return null;

  return (
    <p className="text-center text-[11px] text-white/30">
      {isFallback
        ? t('fallbackRegion')
        : t('regionBookmakers', { shown: filteredCount, total: totalCount })}
    </p>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Binary show/hide betting | Per-bookmaker filtering by country | Phase 10 (now) | Users see only relevant bookmakers, not all-or-nothing |
| Sort by best odds | Sort by country priority | Phase 10 (now) | Locally popular bookmakers shown first |
| Single `showBetting` flag | `showBetting` + `countryCode` + `isMapped` | Phase 10 (now) | More granular geo context available to components |

## Bookmaker Licensing Research Summary

**Confidence: MEDIUM** -- based on public restriction lists and help pages. Licensing changes frequently.

### Key findings for the country-bookmaker matrix:

| Bookmaker | Primary Markets | Broadly Available In | Notably Restricted In |
|-----------|----------------|---------------------|----------------------|
| Paddy Power | GB, IE | GB, IE, SE, FI, CH, CZ, GR, MT | FR, DE, IT, ES, DK, NL |
| Coral | GB, IE | GB, IE, SE, NL, IS, SK, SI, CZ, HR | FR, DE, IT, ES, DK, AT |
| Ladbrokes | GB, IE | GB, IE, SE, ES (via sportium.es), BE (via ladbrokes.be) | FR, DE, IT, AT, NL |
| Unibet | GB, Wide EU | GB, IE, SE, AT, CH, DE, PT, BE, NL, FI, RO, BG | FR (separate unibet.fr), IT, ES, DK (separate) |
| William Hill | GB | GB, IE, SE, AT, DE, SK, SI, LU, NO, IS | FR, DK, CZ, PT, PL, BE |
| 888sport | GB, Wide | GB, IE, AT, CH | FR, DE, IT, ES, DK, BE, BG, HU, RO |
| Sky Bet | GB, IE | GB, IE, GI, IM | Almost everywhere else |
| Betfair SB | GB | GB, IE, SE, AT, DK, PT | FR, DE (exchange only), most others |

### Recommended Simplified Matrix for Tier 1 Countries

This is what should go in the config. Only Tier 1 countries (from existing compliance.ts) need bookmaker entries. All other countries are already blocked by the Tier 2 system.

| Country | Available Bookmakers (ordered by priority) |
|---------|-------------------------------------------|
| **GB** | All 8: paddypower(1), williamhill(2), coral(3), ladbrokes_uk(4), skybet(5), unibet_uk(6), sport888(7), betfair_sb_uk(8) |
| **DK** | betfair_sb_uk(1), unibet_uk(2) |
| **SE** | unibet_uk(1), williamhill(2), coral(3), ladbrokes_uk(4), betfair_sb_uk(5) |
| **FR** | unibet_uk(1) |
| **PT** | betfair_sb_uk(1) |
| **AT** | unibet_uk(1), williamhill(2), sport888(3), betfair_sb_uk(4) |
| **CH** | unibet_uk(1), williamhill(2), sport888(3), betfair_sb_uk(4) |
| **DE** | williamhill(1), betfair_sb_uk(2) |

**Priority rationale:** The priority numbers reflect market dominance and brand recognition in each country. For example, Paddy Power is #1 in GB (iconic British/Irish brand), Unibet is #1 in France and Scandinavia (Kindred Group is Nordic-headquartered).

## Open Questions

1. **Ireland (IE) Missing from Tier 1**
   - What we know: IE is not in `TIER_1_COUNTRIES`. Most of the 8 bookmakers accept Irish customers. Paddy Power is literally an Irish company.
   - What's unclear: Was this intentional in Phase 7 (affiliate licensing concern) or an oversight?
   - Recommendation: Ask the user. If IE should show betting, add it to `TIER_1_COUNTRIES` and add an IE entry to the bookmaker availability config. If intentionally excluded, document the reason.

2. **888sport Bookmaker Key Discrepancy**
   - What we know: The Odds API lists the key as `sport888` (in the uk region bookmaker list). The affiliate config maps `888sport`. The DB stores whatever key comes from the API response.
   - What's unclear: Which key is actually stored in `fixture_odds.bookmaker_key`? This depends on what The Odds API returns in `bookmaker.key`.
   - Recommendation: Check the database for the actual stored key. If it is `sport888`, the affiliate config `888sport` entry may never match. This might be a pre-existing bug from Phase 9 (or the API may use `888sport` as the key despite the region list showing `sport888`).

3. **Unibet Regional Keys**
   - What we know: The Odds API has `unibet_uk` in the UK region and separate `unibet_eu` / `unibet` keys in the EU region (e.g., for France, Italy, Netherlands, Sweden).
   - What's unclear: The current system only fetches with `regions=eu,uk`. For a French user, should we show odds from `unibet_eu` (French Unibet) instead of `unibet_uk`? The current DB may only have `unibet_uk` data.
   - Recommendation: For v1, keep it simple -- filter based on whatever keys exist in the DB. The current odds fetch uses `regions=eu,uk` so both `unibet_uk` and EU variants may appear. Map all Unibet variants to the same availability entry if they appear.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/proxy.ts`, `src/lib/geo/compliance.ts`, `src/lib/geo/types.ts`, `src/components/odds/actions.ts`, `src/components/odds/OddsComparisonTable.tsx`, `src/components/odds/CompactOdds.tsx`, `src/components/matches/MatchCard.tsx`, `src/components/matches/MatchListClient.tsx`, `src/components/team-detail/FixturesTab.tsx`, `src/components/team-detail/TeamTabs.tsx`, `src/app/[locale]/matches/[id]/page.tsx`, `src/lib/affiliate/config.ts`, `src/lib/affiliate/link-builder.ts`, `src/lib/pipeline/refresh-odds.ts`, `src/lib/odds-api/client.ts`

### Secondary (MEDIUM confidence)
- [The Odds API documentation (bookmaker list by region)](https://the-odds-api.com/sports-odds-data/bookmaker-apis.html) -- verified bookmaker keys and region assignments
- [The Odds API v4 documentation](https://the-odds-api.com/liveapi/guides/v4/) -- regions and bookmakers parameters

### Tertiary (LOW-MEDIUM confidence)
- [CheekPunter - Paddy Power country restrictions](https://www.cheekypunter.com/faq/paddy-power-country-restrictions/) -- accepted territories list
- [CheekPunter - Coral restricted countries](https://www.cheekypunter.com/faq/coral-restricted-countries/) -- 23 unrestricted territories
- [CheekPunter - Ladbrokes restrictions](https://www.cheekypunter.com/faq/ladbrokes-restrictions/) -- 6 primary operating countries
- [CheekPunter - Unibet country restrictions](https://www.cheekypunter.com/faq/unibet-country-restrictions/) -- restricted countries list
- [CheekPunter - 888sport restricted countries](https://www.cheekypunter.com/faq/888sport-restricted-countries/) -- restricted territories
- [CheekPunter - William Hill restricted countries](https://www.cheekypunter.com/faq/william-hill-restricted-countries/) -- accepted European countries
- [Sky Bet accepted countries](https://support.skybet.com/app/answers/detail/accepted-countries-using-your-account-abroad/) -- UK/Ireland only
- [BettingExpert - Sky Bet licence](https://www.bettingexpert.com/bookmakers/skybet/licence) -- licensing jurisdictions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries needed, pure application logic
- Architecture: HIGH -- verified against existing codebase patterns, clear integration points
- Country-bookmaker matrix: MEDIUM -- based on public restriction lists, licensing changes frequently
- Pitfalls: HIGH -- derived from direct codebase analysis

**Research date:** 2026-02-06
**Valid until:** 2026-03-06 (bookmaker licensing data may change; codebase patterns stable)
