---
phase: 10-geo-filtering
plan: 01
subsystem: geo
tags: [typescript, geo-filtering, bookmaker-availability, tdd, vitest]

# Dependency graph
requires:
  - phase: 07-geo-compliance
    provides: TIER_1_COUNTRIES set and shouldShowBetting() gate
provides:
  - "Static country-bookmaker availability config (BOOKMAKER_AVAILABILITY)"
  - "getAvailableBookmakers(countryCode) filtering function with GB fallback"
  - "isCountryMapped(countryCode) helper for fallback UX detection"
  - "BookmakerEntry interface for type-safe bookmaker priority entries"
affects: [10-02, 10-03, odds-actions, server-action-filtering]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Static TypeScript config for country-bookmaker matrix (no DB table)"
    - "Case-insensitive country code lookup with uppercase normalization"
    - "GB default fallback for unknown/null country codes"
    - "Priority-based sorting with alphabetical tiebreaker"

key-files:
  created:
    - src/lib/geo/bookmaker-availability.ts
    - src/lib/geo/bookmaker-availability.test.ts
  modified: []

key-decisions:
  - "Static TS config over DB table -- 8 bookmakers, 8 countries, infrequent changes, config+deploy workflow"
  - "Pre-sorted config entries with runtime sort safety net"
  - "Return array copies from getAvailableBookmakers to prevent internal state mutation"

patterns-established:
  - "BookmakerEntry { bookmakerKey, priority } interface for all bookmaker ordering"
  - "BOOKMAKER_AVAILABILITY Record<string, BookmakerEntry[]> as single source for country-bookmaker mapping"

# Metrics
duration: 2min
completed: 2026-02-06
---

# Phase 10 Plan 01: Bookmaker Availability Config and Filtering Summary

**Static country-bookmaker availability config with TDD-verified getAvailableBookmakers() and isCountryMapped() for all 8 Tier 1 countries**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-06T06:16:07Z
- **Completed:** 2026-02-06T06:18:11Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files created:** 2

## Accomplishments
- Complete country-bookmaker matrix for all 8 Tier 1 countries matching research data
- getAvailableBookmakers() with priority sorting, case-insensitive lookup, and GB fallback
- isCountryMapped() for detecting whether to show fallback region note
- 25 passing tests covering all countries, edge cases, fallback behavior, and sort ordering

## Task Commits

Each TDD phase was committed atomically:

1. **RED: Failing tests for bookmaker availability** - `e543e07` (test)
2. **GREEN: Implement bookmaker availability config and filtering** - `a014522` (feat)

_No refactor phase needed -- implementation was clean on first pass._

## Files Created/Modified
- `src/lib/geo/bookmaker-availability.ts` - Country-bookmaker availability config and filtering functions (getAvailableBookmakers, isCountryMapped, BOOKMAKER_AVAILABILITY, BookmakerEntry)
- `src/lib/geo/bookmaker-availability.test.ts` - 25 unit tests covering all 8 countries, fallback behavior, case insensitivity, sort ordering, immutability

## Decisions Made
- **Static TS config over DB table:** Only 8 bookmakers across 8 countries, user confirmed config+deploy workflow for updates. Avoids migration complexity, is type-safe and tree-shakeable.
- **Pre-sorted config with runtime safety net:** Entries stored in priority order in the const, but getAvailableBookmakers() sorts at runtime to guarantee correctness even if config ordering drifts.
- **Array copy on return:** getAvailableBookmakers() always returns a new array copy (`[...entries].sort()`) to prevent callers from mutating internal state.

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- bookmaker-availability module ready for integration in server actions (plan 10-02)
- getAvailableBookmakers() is the entry point for all country-based odds filtering
- isCountryMapped() will drive the "Showing bookmakers for your region" fallback note

## Self-Check: PASSED

---
*Phase: 10-geo-filtering*
*Completed: 2026-02-06*
