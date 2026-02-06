---
phase: 07-betting-odds-localisation
plan: 02
subsystem: ui, api
tags: [odds-display, bookmaker-comparison, affiliate-tracking, odds-format, geo-compliance, betting]

# Dependency graph
requires:
  - phase: 07-01
    provides: fixture_odds schema, affiliate_clicks table, odds-format conversion functions
  - phase: 07-03
    provides: geo-compliance middleware (x-show-betting header), ResponsibleGambling component
provides:
  - OddsComparisonTable (Oddschecker-style multi-bookmaker comparison)
  - CompactOdds badge for fixture cards
  - OddsCell with movement indicators and affiliate click tracking
  - OddsFormatSwitcher with localStorage persistence (decimal/fractional/American)
  - Server actions for fetching and aggregating odds data
  - POST /api/clicks endpoint for affiliate click logging
  - Integration into match detail page, MatchCard, and FixturesTab
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [server-action-data-fetching, fire-and-forget-click-tracking, localStorage-format-persistence, geo-conditional-rendering]

key-files:
  created:
    - src/components/odds/OddsComparisonTable.tsx
    - src/components/odds/CompactOdds.tsx
    - src/components/odds/OddsCell.tsx
    - src/components/odds/OddsFormatSwitcher.tsx
    - src/components/odds/actions.ts
    - src/app/api/clicks/route.ts
  modified:
    - src/app/[locale]/matches/[id]/page.tsx
    - src/components/matches/MatchCard.tsx
    - src/components/team-detail/FixturesTab.tsx

key-decisions:
  - "OddsComparisonTable renders null when showBetting=false (geo-compliance enforced at component level)"
  - "Click tracking is fire-and-forget: POST to /api/clicks never blocks user navigation"
  - "OddsFormatSwitcher persists preference in localStorage key 'odds-format' (default: decimal)"
  - "Best odds per outcome highlighted in comparison table for quick visual scanning"
  - "CompactOdds shows best odds across all bookmakers as a horizontal badge on fixture cards"

patterns-established:
  - "Geo-conditional rendering: showBetting boolean prop gates all odds UI at component boundary"
  - "Fire-and-forget tracking: async POST without await, wrapped in try/catch to never block UX"
  - "localStorage preference persistence: read on mount with useState + useEffect hydration pattern"

# Metrics
duration: ~5min
completed: 2026-02-06
---

# Phase 7 Plan 02: Odds Display Components and Click Tracking Summary

**Oddschecker-style multi-bookmaker comparison table, compact odds badges, decimal/fractional/American format switching, movement indicators, affiliate click tracking API, and geo-compliant integration into match/fixture pages**

## Performance

- **Duration:** ~5 min (tasks 1-2), checkpoint approved on 2026-02-06
- **Started:** 2026-02-05
- **Completed:** 2026-02-06
- **Tasks:** 3 (2 auto + 1 checkpoint:human-verify)
- **Files modified:** 9

## Accomplishments
- Built Oddschecker-style OddsComparisonTable with bookmaker rows, best-odds highlighting, format switcher, and ResponsibleGambling footer
- Created CompactOdds badge component showing best odds per outcome with bookmaker count
- Implemented OddsCell with movement indicators (up/down arrows for shortened/drifted odds) and affiliate link click-through
- Built OddsFormatSwitcher with localStorage persistence for decimal/fractional/American toggle
- Created POST /api/clicks endpoint for affiliate click tracking with country geo-tagging
- Integrated odds display into match detail page (replacing "Odds coming soon" placeholder), MatchCard, and FixturesTab
- All odds UI respects geo-compliance: hidden when x-show-betting=0

## Task Commits

Each task was committed atomically:

1. **Task 1: Odds display components, format switcher, and server action** - `a95c439` (feat)
2. **Task 2: Click tracking API and page integration** - `e40b2d0` (feat)
3. **Task 3: Human verification** - checkpoint approved (no commit; verification only)

## Files Created/Modified

### Created
- `src/components/odds/OddsComparisonTable.tsx` - Full bookmaker comparison table with skeleton loading, empty state, best-odds highlighting
- `src/components/odds/CompactOdds.tsx` - Compact best-odds badge for fixture cards
- `src/components/odds/OddsCell.tsx` - Single odds cell with movement indicator, formatted display, and affiliate click tracking
- `src/components/odds/OddsFormatSwitcher.tsx` - Three-option toggle (decimal/fractional/American) with localStorage persistence
- `src/components/odds/actions.ts` - Server actions: fetchOddsForFixture, fetchCompactOdds
- `src/app/api/clicks/route.ts` - POST endpoint logging affiliate clicks with country, bookmaker, outcome, odds

### Modified
- `src/app/[locale]/matches/[id]/page.tsx` - Replaced "Odds coming soon" placeholder with OddsComparisonTable for upcoming fixtures
- `src/components/matches/MatchCard.tsx` - Added CompactOdds badge to upcoming fixture cards
- `src/components/team-detail/FixturesTab.tsx` - Added CompactOdds to upcoming fixtures in team fixture list

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| showBetting boolean prop on all odds components | Single geo-compliance gate: components render null when false, no leaked betting content |
| Fire-and-forget click tracking (no await) | User experience: clicking odds opens bookmaker immediately, tracking happens in background |
| localStorage for odds format preference | Persists across page navigations without server roundtrip; default to decimal (most common) |
| Best odds highlighting in comparison table | Visual emphasis guides users to best value, driving affiliate clicks |
| CompactOdds as horizontal badge (not expandable) | Fits within existing MatchCard layout without increasing card height |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- No upcoming fixtures with odds data in the database to visually verify the odds display during checkpoint. Structural correctness was confirmed via build compilation, geo-compliance header testing, and code review. A todo was added to seed sample upcoming fixtures with odds data for future visual testing.

## User Setup Required

- Seed sample upcoming fixtures with odds data to visually verify the OddsComparisonTable and CompactOdds components (see STATE.md pending todos).

## Next Phase Readiness

- Plan 07-02 completes the odds display and affiliate tracking layer
- All 5 plans in Phase 7 are now complete
- The full betting/odds/localisation stack is operational: schema, API client, geo-compliance, i18n routing, odds UI, click tracking, and team translations
- Remaining setup: seed odds data, set ODDS_API_KEY, and run drizzle-kit push for new tables

---
*Phase: 07-betting-odds-localisation*
*Completed: 2026-02-06*
