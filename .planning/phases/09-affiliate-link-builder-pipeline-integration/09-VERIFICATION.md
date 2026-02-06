---
phase: 09-affiliate-link-builder-pipeline-integration
verified: 2026-02-06T05:32:00Z
status: passed
score: 5/5 must-haves verified
---

# Phase 9: Affiliate Link Builder & Pipeline Integration Verification Report

**Phase Goal:** Every bookmaker odds link carries affiliate tracking when configured, constructed via the best available method, and the data pipeline enriches links automatically at ingestion time

**Verified:** 2026-02-06T05:32:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Clicking a bookmaker's odds cell navigates to that bookmaker with affiliate tracking parameter in the URL (when affiliate ID is configured via env var) | ✓ VERIFIED | - OddsCell.tsx lines 41-55: click handler opens `link` prop via `window.open(link, '_blank')`<br>- Link comes from server action (actions.ts line 76: `affiliateProgram: affiliateCfg?.programName ?? null`)<br>- Links stored in DB are enriched via buildAffiliateLink (link-builder.ts lines 72-77: appends tracking param when affiliateId exists)<br>- Seed script (seed-odds.ts lines 204-219) and cron (refresh-odds.ts lines 256-270) both call buildAffiliateLink<br>- appendTrackingParam helper (link-builder.ts lines 92-99) constructs URL with encoded tracking param |
| 2 | Clicking a bookmaker's odds cell still navigates to the bookmaker even when no affiliate ID is configured (link works, just without tracking) | ✓ VERIFIED | - link-builder.ts lines 72-77: when affiliateId is undefined, baseUrl is returned without tracking param<br>- link-builder.ts line 49 comment: "graceful degradation per AFCFG-03"<br>- Test suite line 8: "returns API link without tracking param when affiliate ID is not configured" (PASSING)<br>- Test suite line 15: "returns homepage without tracking param when affiliate ID is not set" (PASSING) |
| 3 | Links follow the priority chain: API-provided deep link is used when available, sid-constructed deep link when API link is missing, bookmaker homepage as last resort | ✓ VERIFIED | - link-builder.ts lines 52-64 implements exact priority chain:<br>  1. Line 55-57: if apiLink exists, use it<br>  2. Line 58-60: else if sid AND sidTemplate exist, construct from template<br>  3. Line 61-63: else if homepage exists, use homepage fallback<br>- Test suite line 9: "falls back to homepage when no API link and no sidTemplate" (PASSING)<br>- Test suite line 10: "uses homepage fallback with tracking param when no API link and no sid" (PASSING) |
| 4 | Running the seed script or triggering the cron poll produces odds rows with affiliate-enriched links stored in the database | ✓ VERIFIED | - **Seed script** (seed-odds.ts):<br>  - Line 21: imports buildAffiliateLink<br>  - Lines 204-219: calls buildAffiliateLink for home/draw/away outcomes<br>  - Lines 234-238: stores enriched URLs in homeLink/drawLink/awayLink columns<br>  - Line 255: logs "Affiliate-enriched: ${affiliateEnriched}"<br>- **Cron route** (refresh-odds.ts):<br>  - Line 18: imports buildAffiliateLink<br>  - Lines 256-270: calls buildAffiliateLink for all outcomes<br>  - Lines 288-290 & 306-308: stores enriched URLs in upsert<br>  - Line 148: logs enrichment count per league<br>- Both write to same fixture_odds table (schema/odds.ts lines 30-32) |
| 5 | Click tracking analytics record which affiliate program (not just bookmaker key) was associated with each click | ✓ VERIFIED | - **Schema** (schema/odds.ts line 66): `affiliateProgram: varchar('affiliate_program', { length: 50 })`<br>- **Migration** (0003_young_network.sql): adds affiliate_program column (nullable)<br>- **UI** (OddsCell.tsx line 46): sends affiliateProgram in fetch body<br>- **API** (api/clicks/route.ts line 54): stores `affiliateProgram: body.affiliateProgram ?? null`<br>- **Server Action** (actions.ts lines 63-76): looks up programName via getAffiliateConfig, returns in OddsRow interface<br>- **Full wiring verified:** OddsComparisonTable (lines 156/166/176) → OddsCell (line 13 prop, line 46 tracking) → API (line 54 store) → DB (schema line 66) |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/affiliate/config.ts` | Bookmaker-to-affiliate-program mapping with env var references | ✓ VERIFIED | - 112 lines, substantive implementation<br>- Exports: AffiliateProgram type, AFFILIATE_CONFIG map, getAffiliateConfig, getAffiliateId<br>- Maps 6 bookmaker keys to 5 programs (lines 49-95)<br>- Includes trackingParam, envVar, homepage per program<br>- Used by link-builder.ts (line 16 import) and actions.ts (line 6 import) |
| `src/lib/affiliate/link-builder.ts` | Pure link construction function with priority chain | ✓ VERIFIED | - 100 lines, substantive implementation<br>- Exports: buildAffiliateLink function, BuildLinkInput, BuildLinkResult types<br>- Priority chain (lines 52-64): API link > sid template > homepage<br>- Tracking param appending (lines 72-77) with URL encoding (line 98)<br>- Used by seed-odds.ts (line 21), refresh-odds.ts (line 18) |
| `src/lib/affiliate/link-builder.test.ts` | Unit tests covering all link builder paths | ✓ VERIFIED | - 221 lines (min requirement: 80)<br>- 16 tests, all PASSING (verified via vitest run)<br>- Covers: config lookup (4 tests), affiliate ID handling (2 tests), link building (10 tests)<br>- Tests include: priority chain, graceful degradation, URL encoding, query string handling, shared programs |
| `src/db/schema/odds.ts` | affiliateProgram column on affiliate_clicks table | ✓ VERIFIED | - Line 66: `affiliateProgram: varchar('affiliate_program', { length: 50 })`<br>- Nullable column (no .notNull())<br>- Migration 0003_young_network.sql adds column<br>- Migration tracked in _journal.json |
| `src/app/api/clicks/route.ts` | Click API accepting and storing affiliateProgram field | ✓ VERIFIED | - Line 13 comment: "Body includes affiliateProgram"<br>- Line 54: stores `affiliateProgram: body.affiliateProgram ?? null`<br>- Gracefully handles missing field (defaults to null) |
| `src/components/odds/actions.ts` | Server action looks up and returns affiliateProgram per odds row | ✓ VERIFIED | - Line 6: imports getAffiliateConfig<br>- Line 22: OddsRow interface includes `affiliateProgram: string | null`<br>- Lines 63-76: map function looks up config and sets programName<br>- Server-side lookup keeps config out of client bundle |
| `src/components/odds/OddsCell.tsx` | OddsCell passing affiliateProgram in click tracking | ✓ VERIFIED | - Line 13: prop `affiliateProgram: string | null`<br>- Line 46: includes affiliateProgram in fetch body<br>- Fire-and-forget pattern (lines 43-49) never blocks user click |
| `src/components/odds/OddsComparisonTable.tsx` | Passes affiliateProgram to all three OddsCell instances | ✓ VERIFIED | - Lines 156, 166, 176: `affiliateProgram={row.affiliateProgram}`<br>- Passes to home, draw, away cells respectively |
| `scripts/seed-odds.ts` | Seed script using link builder for affiliate-enriched links | ✓ VERIFIED | - Line 21: imports buildAffiliateLink<br>- Lines 204-219: calls for all three outcomes<br>- Lines 234-238: stores enriched URLs<br>- Line 255: logs enrichment count |
| `src/lib/pipeline/refresh-odds.ts` | Core odds refresh logic with link builder integration | ✓ VERIFIED | - 326 lines, substantive implementation<br>- Line 18: imports buildAffiliateLink<br>- Lines 256-270: calls for each outcome during ingestion<br>- Lines 288-290, 306-308: stores enriched URLs in upsert<br>- Budget awareness (lines 119-127): stops if quota < 50<br>- Per-league error isolation (lines 129-155) |
| `src/app/api/cron/refresh-odds/route.ts` | QStash-triggered cron endpoint for odds polling | ✓ VERIFIED | - 55 lines, substantive implementation<br>- Line 1: imports refreshOdds from pipeline<br>- Lines 6-46: POST handler with QStash signature verification<br>- Lines 48-54: GET handler (dev-only)<br>- Matches poll-matches pattern exactly (lazy Receiver import, signature verification) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| link-builder.ts | config.ts | import getAffiliateConfig, getAffiliateId | ✓ WIRED | Line 16: `import { getAffiliateConfig, getAffiliateId } from './config'`<br>Lines 50, 73 use these functions |
| OddsCell.tsx | /api/clicks | fetch POST with affiliateProgram in body | ✓ WIRED | Lines 43-49: fetch with affiliateProgram in JSON body<br>API route line 54 receives and stores it |
| actions.ts | config.ts | getAffiliateConfig lookup | ✓ WIRED | Line 6: imports getAffiliateConfig<br>Line 63: `getAffiliateConfig(r.bookmakerKey)` in map |
| OddsComparisonTable.tsx | OddsCell.tsx | affiliateProgram prop | ✓ WIRED | Lines 156/166/176 pass row.affiliateProgram to OddsCell<br>OddsCell line 13 receives prop |
| seed-odds.ts | link-builder.ts | buildAffiliateLink calls | ✓ WIRED | Line 21 import, lines 204-219 call buildAffiliateLink<br>Results stored in DB (lines 234-238) |
| refresh-odds.ts | link-builder.ts | buildAffiliateLink calls | ✓ WIRED | Line 18 import, lines 256-270 call buildAffiliateLink<br>Results stored in upsert (lines 288-290, 306-308) |
| refresh-odds.ts | odds-api/client.ts | fetchOddsForSport | ✓ WIRED | Line 15 import, line 196 calls fetchOddsForSport(sportKey)<br>Returns events with quota info |
| cron/refresh-odds/route.ts | refresh-odds.ts | refreshOdds() | ✓ WIRED | Line 1 import, lines 44 & 52 call refreshOdds()<br>Returns result as JSON |

### Requirements Coverage

| Requirement | Status | Supporting Evidence |
|-------------|--------|---------------------|
| AFCFG-01: System maps each bookmaker key to its affiliate program's tracking parameter name, URL template, and affiliate ID reference | ✓ SATISFIED | config.ts lines 49-95: AFFILIATE_CONFIG maps 6 bookmaker keys with trackingParam, envVar, homepage, optional sidTemplate |
| AFCFG-02: Affiliate IDs are loaded from environment variables per program (one env var per program) | ✓ SATISFIED | config.ts lines 109-111: getAffiliateId reads process.env[config.envVar]<br>5 unique envVars defined across programs |
| AFCFG-03: Bookmaker links work for users even when affiliate ID is not yet configured (link without tracking param) | ✓ SATISFIED | link-builder.ts lines 72-77: returns URL without tracking param when affiliateId undefined<br>Tests verify graceful degradation |
| AFCFG-04: System constructs per-outcome deep links using API `sid` field when available | ✓ SATISFIED | link-builder.ts lines 58-60: constructs from sidTemplate.replace('{sid}', input.sid)<br>Priority chain uses sid when API link missing |
| LINK-01: Link builder applies priority chain: API-provided deep link > sid-constructed deep link > bookmaker homepage fallback | ✓ SATISFIED | link-builder.ts lines 52-64: exact three-level priority implementation<br>Tests verify each level |
| LINK-02: Affiliate tracking parameter is appended to all constructed links when affiliate ID is configured | ✓ SATISFIED | link-builder.ts lines 72-77: appends tracking param via appendTrackingParam helper<br>Tests verify URL encoding and query string handling |
| LINK-03: Seed script uses link builder to enrich odds rows with affiliate links at ingestion time | ✓ SATISFIED | seed-odds.ts lines 204-219: buildAffiliateLink called for all outcomes<br>Lines 234-238: enriched URLs stored in fixture_odds |
| LINK-04: Cron poll route uses link builder to enrich odds rows with affiliate links on each refresh | ✓ SATISFIED | refresh-odds.ts lines 256-270: buildAffiliateLink called during cron ingestion<br>Lines 288-290, 306-308: enriched URLs stored via upsert |
| ANLYT-01: Click tracking records which affiliate program was used (not just bookmaker key) | ✓ SATISFIED | Full wiring: schema (line 66) → API (line 54) → server action (lines 63-76) → OddsCell (lines 13, 46) → OddsComparisonTable (lines 156/166/176)<br>All 5 components verified |

**Coverage:** 9/9 requirements satisfied

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | - | - | - | - |

**Notes:**
- No TODO/FIXME comments in implementation files
- No placeholder returns or stub patterns
- No console.log-only implementations
- The word "placeholder" in config.ts line 24 is documentation for the {sid} template format, not a stub
- All tests passing (16/16)
- TypeScript compiles cleanly (0 errors)

### Human Verification Required

The following items require manual testing to fully verify goal achievement:

#### 1. End-to-End Affiliate Link Click Flow

**Test:** 
1. Set an affiliate ID env var (e.g., `PADDY_POWER_AFF_ID=test123`)
2. Run seed script or trigger cron to populate odds
3. Navigate to a fixture with odds
4. Click a Paddy Power odds cell
5. Inspect the opened URL

**Expected:** 
- URL should contain `?AFF_ID=test123` (or `&AFF_ID=test123` if URL already has query params)
- Clicking opens the bookmaker's site in a new tab
- Click is tracked in affiliate_clicks table with `affiliate_program='paddy_power'`

**Why human:** Requires browser interaction, external URL navigation, and database inspection

#### 2. Graceful Degradation Without Affiliate IDs

**Test:**
1. Ensure NO affiliate env vars are set (unset all PADDY_POWER_AFF_ID, ENTAIN_BTAG, etc.)
2. Run seed script or trigger cron
3. Click a bookmaker odds cell

**Expected:**
- URL should NOT contain any affiliate tracking parameters
- Link should still open the bookmaker's site (homepage or deep link if API-provided)
- Click is still tracked but `affiliate_program` is null in database

**Why human:** Requires verifying absence of tracking params in real URLs, browser navigation

#### 3. Priority Chain Behavior

**Test:**
1. Find an odds event where The Odds API provides deep links (API `link` field populated)
2. Find an odds event where API link is missing but `sid` is provided
3. Verify stored URLs in database

**Expected:**
- Case 1: homeLink/drawLink/awayLink should be the API-provided deep link + tracking param
- Case 2: homeLink/drawLink/awayLink should be the homepage + tracking param (since no sidTemplate configured yet)
- URLs should be stored in DB, not constructed at render time

**Why human:** Requires inspecting actual Odds API response data and correlating with stored DB values

#### 4. Cron Route Execution

**Test:**
1. Trigger GET /api/cron/refresh-odds in development
2. Check server logs for quota tracking and enrichment counts
3. Verify database was updated with fresh odds

**Expected:**
- Logs show "X leagues polled, Y events processed, Z odds upserted, W enriched"
- Quota remaining logged after each league
- fixture_odds table updated with new odds and enriched links
- No errors for unmapped teams (skipped with warning)

**Why human:** Requires triggering cron endpoint, reading server logs, database inspection

#### 5. Affiliate Program Analytics

**Test:**
1. Click several bookmaker odds cells (mix of different programs: paddy_power, entain, kindred)
2. Query affiliate_clicks table: `SELECT affiliate_program, COUNT(*) FROM affiliate_clicks GROUP BY affiliate_program`

**Expected:**
- Results show clicks grouped by program name (not bookmaker key)
- Coral and Ladbrokes clicks both show `affiliate_program='entain'` (shared program)
- Unknown bookmakers (no affiliate config) show `affiliate_program=null`

**Why human:** Requires multiple user interactions and SQL query analysis

---

## Overall Assessment

**Status:** PASSED

All automated checks passed:
- ✓ All 5 success criteria verified with code evidence
- ✓ All 11 required artifacts exist, are substantive, and are wired correctly
- ✓ All 8 key links verified in codebase
- ✓ All 9 requirements satisfied
- ✓ 16/16 tests passing
- ✓ 0 TypeScript errors
- ✓ No anti-patterns or stub implementations found
- ✓ All plans executed exactly as specified (no scope creep)

The phase goal is achieved: **Every bookmaker odds link carries affiliate tracking when configured, constructed via the best available method, and the data pipeline enriches links automatically at ingestion time.**

### Evidence Summary

**Link Builder Core (09-01):**
- Pure function with 3-level priority chain implemented and tested
- Graceful degradation verified (links work without affiliate IDs)
- 6 bookmaker keys mapped to 5 programs with correct tracking params
- 221 lines of tests covering all edge cases (16/16 passing)

**Pipeline Integration (09-02):**
- Schema migration adds nullable affiliateProgram column
- Full wiring: DB schema → API → server action → OddsCell → OddsComparisonTable
- Seed script enriches links at ingestion time
- Server-side config lookup keeps affiliate data out of client bundle

**Cron Automation (09-03):**
- QStash-authenticated cron route matches established pattern
- refreshOdds() pipeline polls all 5 leagues with link enrichment
- Budget awareness prevents quota exhaustion (stops at < 50 remaining)
- Per-league error isolation ensures partial success on failures

### Human Verification Next Steps

While all automated checks pass, the 5 human verification items above should be tested before deploying to production. These verify:
1. Real browser click behavior with affiliate tracking
2. Graceful degradation in production environment
3. Priority chain with actual Odds API data
4. Cron execution in deployed environment
5. Analytics grouping by program

---

*Verified: 2026-02-06T05:32:00Z*
*Verifier: Claude (gsd-verifier)*
