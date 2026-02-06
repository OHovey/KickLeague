# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-06)

**Core value:** Football fans can see league standings with rich visual context -- sparklines, trend indicators, form runs, position history -- presented with the information density of a financial dashboard.
**Current focus:** v1.1 Affiliate Monetisation -- COMPLETE (all 3 phases, 6 plans)

## Current Position

Phase: 10 of 10 (Geo-Aware Bookmaker Filtering)
Plan: 3 of 3 complete
Status: Phase complete -- v1.1 complete
Last activity: 2026-02-06 -- Completed 10-03-PLAN.md (Region UX Indicators & i18n)

Progress: [████████████] 100% (v1.1: 6/6 plans)

## Performance Metrics

**v1 Velocity:**
- Total plans completed: 26
- Average duration: 3.8 min
- Total execution time: ~1.77 hours
- Timeline: 2 days (2026-02-04 to 2026-02-06)

**v1.1 Velocity:**
- Total plans completed: 6
- Average duration: 2.5 min
- Total execution time: 15 min

## Accumulated Context

### Decisions

All v1 decisions logged in PROJECT.md Key Decisions table.

| Decision | Plan | Rationale |
|----------|------|-----------|
| No sidTemplate in initial config | 09-01 | Bookmaker sid URL templates not available until affiliate program approval |
| env vars for affiliate IDs | 09-01 | IDs change per deployment, never committed to code or DB |
| encodeURIComponent on tracking values | 09-01 | Prevents URL injection from special chars in affiliate IDs |
| Shared Entain program for coral + ladbrokes_uk | 09-01 | Both brands use Entain Partners, same btag tracking |
| affiliateProgram column nullable | 09-02 | Existing click rows keep null, no backfill needed |
| Server-side affiliate config lookup | 09-02 | getAffiliateConfig runs in server action, keeps config out of client bundle |
| Link enrichment at write time | 09-02 | buildAffiliateLink called at ingestion (seed/cron), enriched URLs pre-stored in DB |
| Duplicate ODDS_TO_DB_NAME in refresh module | 09-03 | Seed script is standalone, mapping is small, avoids coupling |
| Cron only updates existing fixtures | 09-03 | No fixture creation in odds cron -- that is API-Football polling's job |
| Quota threshold 50 for early stop | 09-03 | Prevents quota exhaustion when polling 5 leagues sequentially |
| Static TS config over DB table for bookmaker availability | 10-01 | 8 bookmakers, 8 countries, infrequent changes, config+deploy workflow |
| Pre-sorted config with runtime sort safety net | 10-01 | Entries stored in priority order, runtime sort guarantees correctness |
| Array copy on return from getAvailableBookmakers | 10-01 | Prevents callers from mutating internal state |
| getGeoContext replaces getShowBetting entirely | 10-02 | No deprecated alias -- all callers updated in same plan |
| Filter-then-sort in server actions | 10-02 | Best-odds highlighting uses only available bookmakers automatically |
| totalBookmakers in FixtureOddsResult | 10-02 | Pre-filter count stored for future region UX indicators |
| RegionNote renders null for full-set mapped users | 10-03 | No unnecessary UI noise when user sees all bookmakers |
| Three-state empty odds distinction | 10-03 | null/no-data -> noOdds, filtered-out -> noOddsRegion, genuinely empty -> noOdds |

### Pending Todos

- Provision production infrastructure (Neon, Vercel, QStash, Odds API)
- API-Football subscription upgrade for fixture events/stats data
- Seed historical standings data for sparklines/position changes
- Set environment variables for cron routes and APIs
- Sign up for 5 affiliate programs (Paddy Power, Entain, Kindred, 888, William Hill)
- Collect affiliate IDs/btags from each dashboard after approval
- Apply migration 0003_young_network.sql to production database

### Tech Debt (from v1 audit)

- Timeline navigation arrows scroll-only (regression 2b5c055)
- Team name translation helper orphaned (getTeamName never called)
- Hardcoded season '2025' in LeagueTableWrapper
- UI text hardcoded English despite message files existing

### Blockers/Concerns

None -- v1.1 complete. All 10 phases done.

## Session Continuity

Last session: 2026-02-06
Stopped at: Completed 10-03-PLAN.md -- v1.1 complete
Resume file: None
