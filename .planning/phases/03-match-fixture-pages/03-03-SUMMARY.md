---
phase: 03-match-fixture-pages
plan: 03
subsystem: ui
tags: [next.js, react, match-card, header, navigation, h2h, form-badges]

# Dependency graph
requires:
  - phase: 03-match-fixture-pages/03-01
    provides: "Match query layer, MatchCard, MatchList, server actions"
  - phase: 03-match-fixture-pages/03-02
    provides: "Match detail page at /matches/[id]"
provides:
  - "Home page match preview section with 5 recent + 5 upcoming matches"
  - "Site header with KickData title and Matches navigation link"
  - "Inline H2H and form display on match cards (no expand required)"
  - "Visible match date on every card"
affects: [04-player-profiles, 06-live-data]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lazy-load supplementary data inline with skeleton placeholder"
    - "Short date format (formatMatchDateShort) for compact card display"

key-files:
  created:
    - src/components/matches/MatchPreviewSection.tsx
    - src/components/header/Header.tsx
  modified:
    - src/components/matches/MatchCard.tsx
    - src/app/page.tsx
    - src/app/matches/page.tsx
    - src/lib/dates/format.ts

key-decisions:
  - "H2H data lazy-loaded inline on mount (not batch-fetched) to avoid N+1 upfront queries"
  - "Expand/collapse removed -- all card info visible by default for better UX"
  - "formatMatchDateShort added for compact 'Sat 1 Feb' display on cards"

patterns-established:
  - "Inline lazy-load pattern: fetch on mount, show skeleton, replace with content"
  - "Card date always visible in compact uppercase format"

# Metrics
duration: 6min
completed: 2026-02-05
---

# Phase 3 Plan 3: Home Page Preview + Header + Match Card UI Refinement Summary

**Home page match previews with site header navigation, plus inline H2H/form display and visible dates on match cards after checkpoint feedback**

## Performance

- **Duration:** 6 min (including checkpoint iteration)
- **Started:** 2026-02-05T06:17:41Z
- **Completed:** 2026-02-05T06:23:18Z
- **Tasks:** 2 (1 auto + 1 checkpoint with UI feedback)
- **Files modified:** 6

## Accomplishments
- Home page shows MatchPreviewSection with 5 recent results and 5 upcoming fixtures (desktop only)
- Header component with "KickData" title and "Matches" navigation link on both pages
- Match cards now show date, form badges, and H2H bar inline without expand/collapse interaction
- Added formatMatchDateShort utility for compact card date display

## Task Commits

Each task was committed atomically:

1. **Task 1: Create MatchPreviewSection, Header, and integrate into home page** - `c239129` (feat)
2. **Checkpoint feedback: Match card UI improvements** - `2e9e028` (fix)

## Files Created/Modified
- `src/components/matches/MatchPreviewSection.tsx` - Home page preview section with compact match cards
- `src/components/header/Header.tsx` - Site header with title and Matches link
- `src/app/page.tsx` - Integrates Header and MatchPreviewSection
- `src/app/matches/page.tsx` - Adds Header for consistent navigation
- `src/components/matches/MatchCard.tsx` - Refactored: visible date, inline form badges, lazy-loaded H2H bar, removed expand toggle
- `src/lib/dates/format.ts` - Added formatMatchDateShort for "Sat 1 Feb" format

## Decisions Made
- H2H data lazy-loaded inline per card on mount with skeleton placeholder (avoids expensive batch queries for all visible cards while still showing data by default)
- Removed expand/collapse pattern entirely -- form badges and H2H bar always visible on card, improving discoverability
- Short date format "Sat 1 Feb" used on cards for compact display; full format reserved for detail pages
- MatchCardExpanded component now orphaned (no longer imported) -- its H2H fetch logic moved into MatchCard as H2HInline sub-component

## Deviations from Plan

### Checkpoint Feedback Changes

**1. Add visible date to match list items**
- **Requested by:** User during checkpoint review
- **Change:** Added formatMatchDateShort display at top of each MatchCard
- **Files modified:** src/components/matches/MatchCard.tsx, src/lib/dates/format.ts
- **Committed in:** 2e9e028

**2. Remove expand/collapse -- show H2H and form inline**
- **Requested by:** User during checkpoint review
- **Change:** Removed expand button and MatchCardExpanded import; integrated FormBadges and lazy-loaded H2H bar directly into MatchCard layout
- **Files modified:** src/components/matches/MatchCard.tsx
- **Committed in:** 2e9e028

---

**Total deviations:** 2 (both from user checkpoint feedback)
**Impact on plan:** UI improvements requested by user. No scope creep -- same data displayed in better layout.

## Issues Encountered
None -- feedback changes were straightforward restructuring of existing components.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 (Match & Fixture Pages) is now complete
- Match query layer, matches page, match detail page, and home page integration all delivered
- Ready for Phase 4 (Player Profiles)
- Missing fixtures/match stats data noted by user is a database seeding issue, not a code concern

---
*Phase: 03-match-fixture-pages*
*Completed: 2026-02-05*
