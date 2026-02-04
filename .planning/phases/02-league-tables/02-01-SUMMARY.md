---
phase: 02-league-tables
plan: 01
subsystem: standings
tags: [vitest, tdd, tiebreakers, sorting]

# Dependency graph
requires:
  - phase: 01-data-foundation
    provides: standings table schema with points, GD, GF fields; league_config with tiebreakerOrder
provides:
  - calculateStandings() function with configurable tiebreaker chains
  - applyTiebreakers() function for sorting tied teams
  - StandingsRow, TiebreakerMethod, H2HMatrix types
  - Test infrastructure (Vitest configured)
affects: [02-league-tables remaining plans, any UI rendering standings]

# Tech tracking
tech-stack:
  added: [vitest, @vitest/ui]
  patterns: [TDD red-green-refactor, configurable tiebreaker chain]

key-files:
  created:
    - src/lib/standings/calculate.ts
    - src/lib/standings/calculate.test.ts
    - vitest.config.mts
  modified:
    - package.json

key-decisions:
  - "H2H totals calculated only among tied teams (correct for multi-way ties)"
  - "Alphabetical fallback when all tiebreakers exhausted"
  - "Tiebreaker chain parsed from comma-separated string (matches DB schema)"

patterns-established:
  - "TDD: Write failing tests first, then implement to pass"
  - "Tiebreaker comparison returns 0 for equal, negative/positive for ordering"
  - "H2HMatrix keyed by teamId for O(1) lookup"

# Metrics
duration: 3min
completed: 2026-02-04
---

# Phase 02 Plan 01: Standings Calculator with Tiebreakers Summary

**Vitest test infrastructure configured with 14 passing tests covering calculateStandings() with league-specific tiebreaker chains (GD-first for PL/Bundesliga/Ligue1, H2H-first for La Liga/Serie A)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-04T23:32:20Z
- **Completed:** 2026-02-04T23:34:57Z
- **Tasks:** 2 TDD cycles (RED, GREEN)
- **Files modified:** 4

## Accomplishments

- Vitest configured for TypeScript with ESM support
- `calculateStandings()` sorts teams by points, applies tiebreaker chain, assigns positions
- `applyTiebreakers()` handles multi-way ties with proper H2H calculation
- 14 test cases covering all tiebreaker scenarios including edge cases

## Task Commits

Each task was committed atomically:

1. **Task 1-2: TDD RED phase - failing tests** - `54ec1e0` (test)
   - Vitest + config setup
   - 14 test cases written
2. **Task 3: TDD GREEN phase - implementation** - `fb0ca39` (feat)
   - Full implementation passing all tests

**Plan metadata:** (pending after summary creation)

## Files Created/Modified

- `src/lib/standings/calculate.ts` - Standings calculation with tiebreaker logic
- `src/lib/standings/calculate.test.ts` - 14 test cases for all scenarios
- `vitest.config.mts` - Vitest configuration for TypeScript
- `package.json` - Added test scripts and vitest dependencies

## Decisions Made

1. **H2H among tied teams only:** For multi-way ties (3+ teams), H2H points are calculated only between the tied teams, not overall season H2H. This matches La Liga/Serie A rules correctly.

2. **Alphabetical fallback:** When all tiebreakers are exhausted (same points, same GD, same GF, same H2H), teams are sorted alphabetically by name. This ensures deterministic ordering.

3. **ESM config format:** Used `vitest.config.mts` extension for ESM compatibility with Vite 7.x.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

1. **Vitest ESM compatibility:** Initial `vitest.config.ts` failed with `ERR_REQUIRE_ESM`. Fixed by renaming to `vitest.config.mts` for explicit ESM module format.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `calculateStandings()` ready for use in API routes and UI components
- Test infrastructure ready for additional test files
- H2H matrix will need to be built from fixtures data when rendering actual standings

---
*Phase: 02-league-tables*
*Completed: 2026-02-04*
