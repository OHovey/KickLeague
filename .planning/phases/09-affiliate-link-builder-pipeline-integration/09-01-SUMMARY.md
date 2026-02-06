---
phase: 09-affiliate-link-builder-pipeline-integration
plan: 01
subsystem: affiliate-links
tags: [affiliate, link-builder, config, tdd, pure-function]
requires: []
provides: [affiliate-config-map, link-builder-function, BuildLinkInput-type, BuildLinkResult-type]
affects: [09-02, 09-03, 10-01]
tech-stack:
  added: []
  patterns: [priority-chain-link-construction, env-var-affiliate-ids, static-config-map]
key-files:
  created: [src/lib/affiliate/config.ts, src/lib/affiliate/link-builder.ts, src/lib/affiliate/link-builder.test.ts]
  modified: []
key-decisions:
  - No sidTemplate configured initially -- homepage fallback used until affiliate program docs available
  - Affiliate IDs read from env vars at runtime, never stored in code or DB
  - encodeURIComponent used for tracking param values to handle special characters
  - Shared entain program for coral and ladbrokes_uk with same ENTAIN_BTAG env var
patterns-established:
  - Priority chain (API link > sid template > homepage fallback) for link construction
  - Graceful degradation -- links work without affiliate IDs, just without tracking
  - Pure function at data layer, not runtime construction in components
duration: 2min
completed: 2026-02-06
---

# Phase 9 Plan 01: Affiliate Config & Link Builder Summary

**TDD-built pure link builder implementing priority chain (API link > sid > homepage) with env-var-driven affiliate tracking param appending across 6 bookmaker keys and 5 programs.**

## Performance

- Duration: 2 minutes
- TDD cycle: RED (failing tests) -> GREEN (implementation) -> REFACTOR (cleanup)
- 16 tests, all passing
- 221 lines of test code (min requirement: 80)
- 0 TypeScript errors

## Accomplishments

1. Created static affiliate config map with 6 bookmaker keys mapped to 5 affiliate programs
2. Implemented link builder pure function with 3-level priority chain
3. Affiliate tracking param appending with URL-encoding and query string handling
4. Graceful degradation when affiliate IDs are not configured
5. Full test coverage including edge cases (URL encoding, existing query strings, shared programs)

## Task Commits

| Phase | Commit | Description |
|-------|--------|-------------|
| RED | dfe655c | Failing tests for all 8+ cases |
| GREEN | b9a9fac | Config map + link builder implementation |
| REFACTOR | 0767af7 | Remove unused test imports |

## Files Created/Modified

### Created
- `src/lib/affiliate/config.ts` -- AffiliateProgram type, AFFILIATE_CONFIG map, getAffiliateConfig(), getAffiliateId()
- `src/lib/affiliate/link-builder.ts` -- buildAffiliateLink(), BuildLinkInput, BuildLinkResult types
- `src/lib/affiliate/link-builder.test.ts` -- 16 unit tests covering all priority chain paths

### Modified
None.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| No sidTemplate values configured | Bookmaker sid URL templates not available until affiliate program approval; homepage fallback is sufficient for now |
| env vars for affiliate IDs, not code/DB | IDs change per deployment, should not be committed; `process.env[config.envVar]` pattern is simple and secure |
| encodeURIComponent on tracking values | Prevents URL injection from affiliate ID values containing special chars |
| Shared Entain program for coral + ladbrokes_uk | Both brands are Entain Partners, use same btag tracking system |

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

Plan 09-02 (schema migration, click analytics wiring, seed script integration) can proceed immediately. It will:
- Import `buildAffiliateLink` from `src/lib/affiliate/link-builder.ts`
- Use it in `scripts/seed-odds.ts` to enrich links at ingestion time
- Add `affiliateProgram` column to `affiliate_clicks` schema
- Wire affiliate program data through OddsCell click tracking

## Self-Check: PASSED
