---
phase: 13-i18n-completeness
plan: 01
subsystem: i18n
tags: [next-intl, i18n, localized-pathnames, ordinals, middleware, en.json]

# Dependency graph
requires:
  - phase: 12-site-chrome-homepage
    provides: Complete component set with hardcoded English strings
provides:
  - Complete en.json with 222 message keys across 18 namespaces
  - Localized pathname routing config (/, /matches, /matches/[id], /teams/[slug])
  - Middleware re-exporting proxy.ts for i18n URL rewriting + geo-compliance
  - Locale-aware ordinal utility (getLocalizedOrdinal) for 5 locales
  - navigationRouting (without pathnames) for backward-compatible Link usage
affects: [13-02, 13-03, 13-04, 13-05, 13-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dual routing configs: `routing` (with pathnames, for middleware) and `navigationRouting` (without pathnames, for Link/useRouter)"
    - "ICU message format for plurals: {count, plural, one {# win} other {# wins}}"
    - "Namespace-per-component-group pattern: MatchDetail, TeamOverview, TeamPerformance, etc."

key-files:
  created:
    - src/middleware.ts
    - src/lib/i18n/ordinals.ts
  modified:
    - src/messages/en.json
    - src/i18n/routing.ts
    - src/i18n/navigation.ts

key-decisions:
  - "Dual routing config to avoid breaking existing string-based Link usage while enabling localized pathnames for middleware"
  - "middleware.ts re-exports proxy.ts rather than duplicating i18n + geo logic"
  - "ICU plural format for count-dependent strings (wins, draws, meetings)"
  - "Added Matches.homeShort/(H), Matches.awayShort/(A), Matches.draws, Matches.form, Matches.noPreviousMeetings from MatchCardExpanded audit"

patterns-established:
  - "Namespace naming: PascalCase matching component group (MatchDetail, TeamOverview, etc.)"
  - "Ordinal utility at src/lib/i18n/ordinals.ts for locale-aware position suffixes"
  - "navigationRouting pattern for gradual migration to typed pathnames"

# Metrics
duration: 6min
completed: 2026-02-08
---

# Phase 13 Plan 01: i18n Infrastructure Summary

**Complete en.json with 222 message keys across 18 namespaces, localized pathname routing for 5 locales, and ordinal suffix utility**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-08T07:40:24Z
- **Completed:** 2026-02-08T07:46:04Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- en.json expanded from 107 lines / ~80 keys to 267 lines / 222 keys across 18 namespaces
- 8 new namespaces added: MatchDetail, TeamOverview, TeamPerformance, TeamSquad, TeamFixtures, StatHighlights, DataFreshness, Metadata
- Localized pathnames configured for all 4 page routes across 5 locales (e.g., /de/spiele, /es/partidos)
- Ordinal utility handles all 5 locales (en: 1st, de: 1., fr: 1er, es: 1.o, it: 1o)
- TypeScript compiles cleanly with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Add all new message keys to en.json** - `c6adeb3` (feat)
2. **Task 2: Create middleware, localized pathnames, and ordinal utility** - `2668272` (feat)

## Files Created/Modified
- `src/messages/en.json` - Complete English message file with 222 keys across 18 namespaces
- `src/i18n/routing.ts` - Added pathnames config for localized URLs + navigationRouting for backward compat
- `src/i18n/navigation.ts` - Updated to use navigationRouting (preserves string-based Link usage)
- `src/middleware.ts` - Re-exports proxy.ts for i18n routing + geo-compliance
- `src/lib/i18n/ordinals.ts` - Locale-aware ordinal suffix utility for 5 locales

## Decisions Made
- **Dual routing config:** Adding `pathnames` to `routing` causes next-intl to enforce typed pathname objects on `Link`/`useRouter`. Created `navigationRouting` (without pathnames) for `createNavigation()` so existing string-based Link usage continues to work. The full `routing` config is used by middleware for URL rewriting. Components can be gradually migrated to typed pathnames in future plans.
- **Middleware re-export:** The project already had `src/proxy.ts` implementing `createMiddleware(routing)` with geo-compliance headers. Rather than creating a duplicate middleware, `src/middleware.ts` simply re-exports from `proxy.ts`. This ensures localized pathname rewriting happens alongside existing geo-compliance logic.
- **ICU plural format:** Used ICU message format for count-dependent strings (wins, draws, meetings) to enable proper pluralization across locales.
- **Extra keys from audit cross-reference:** Found additional hardcoded strings in MatchCardExpanded.tsx ("Draws", "(H)", "(A)", "Form", "No previous meetings found") not in the original plan list. Added them as Matches namespace keys.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Typed pathnames broke existing Link usage**
- **Found during:** Task 2 (routing.ts update)
- **Issue:** Adding `pathnames` to `routing` made `createNavigation(routing)` enforce structured pathname objects on `Link`, breaking ~12 components using string paths like `/matches/${id}`
- **Fix:** Created `navigationRouting` (without pathnames) for `createNavigation()`. Updated `navigation.ts` to use `navigationRouting`. Middleware still uses full `routing` for URL rewriting.
- **Files modified:** src/i18n/routing.ts, src/i18n/navigation.ts
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** 2668272 (Task 2 commit)

**2. [Rule 3 - Blocking] Existing proxy.ts already implements middleware**
- **Found during:** Task 2 (middleware.ts creation)
- **Issue:** Plan specified creating `src/middleware.ts` with `createMiddleware(routing)`, but `src/proxy.ts` already implements this exact logic plus geo-compliance headers. Creating a separate middleware would duplicate logic and lose geo features.
- **Fix:** Made `src/middleware.ts` re-export from `proxy.ts` instead of creating standalone middleware
- **Files modified:** src/middleware.ts
- **Verification:** TypeScript compiles, proxy.ts routing config already uses the pathnames-enabled `routing`
- **Committed in:** 2668272 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for correct compilation and avoiding logic duplication. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- en.json is complete: plans 02-04 (component wiring) can reference all keys without adding new ones
- Localized pathnames ready: middleware will rewrite /de/spiele to /de/matches once app is running
- Ordinal utility ready: StatHighlights and other components can import getLocalizedOrdinal
- Plans 02-04 can run in parallel since en.json is finalized and each plan wires different component groups

---
*Phase: 13-i18n-completeness*
*Completed: 2026-02-08*

## Self-Check: PASSED
