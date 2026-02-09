---
phase: 15-display-ads
plan: 02
subsystem: ui
tags: [adsense, ads, ad-placement, betting-compliance, responsive-ads]

# Dependency graph
requires:
  - phase: 15-display-ads
    plan: 01
    provides: AdUnit client component, ad-config with named slot IDs
  - phase: 12-site-chrome-homepage
    provides: Page layouts and content sections for ad placement
provides:
  - 2 responsive ad units on each of 4 page types (homepage, matches, match detail, team detail)
  - Betting content structural separation on match detail pages
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [AdUnit placement between content sections, betting content structural gap compliance]

key-files:
  created: []
  modified:
    - src/app/[locale]/page.tsx
    - src/app/[locale]/matches/page.tsx
    - src/app/[locale]/matches/[id]/page.tsx
    - src/app/[locale]/teams/[slug]/page.tsx

key-decisions:
  - "Ad placements follow user decisions: homepage top before StatHighlights, homepage bottom between LeagueTable and MatchPreviews"
  - "Upcoming match Ad 2 placed after H2HSection (before ComparativeStats) to maintain structural gap from OddsComparisonTable"

patterns-established:
  - "Ad placement pattern: import AdUnit + AD_SLOTS, render AdUnit with named slotId between content sections"
  - "Betting compliance pattern: at least one full content section between any ad and odds/bookmaker content"

# Metrics
duration: 2min
completed: 2026-02-09
---

# Phase 15 Plan 02: Ad Placements Summary

**Responsive AdUnit placements on all 4 page types (2 per page) with betting content structural separation maintained via ComparativeStats gap**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-09T06:24:12Z
- **Completed:** 2026-02-09T06:26:34Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- All 4 page types now display 2 responsive ad units each between content sections
- Homepage ads positioned per user decisions: before stat highlights and between league table and match previews
- Match detail page maintains betting content compliance: ComparativeStats as structural gap between nearest ad and OddsComparisonTable on upcoming matches
- Both completed and upcoming match detail branches have independent ad placements

## Task Commits

Each task was committed atomically:

1. **Task 1: Place ad units on homepage and matches page** - `2a10703` (feat)
2. **Task 2: Place ad units on match detail and team detail pages** - `095fb53` (feat)

## Files Created/Modified
- `src/app/[locale]/page.tsx` - Added 2 AdUnit placements: before StatHighlights, between LeagueTable and MatchPreviews
- `src/app/[locale]/matches/page.tsx` - Added 2 AdUnit placements: after h1 before tabs, after tabs
- `src/app/[locale]/matches/[id]/page.tsx` - Added 4 AdUnit instances (2 per branch): completed (after ScoreHero, after EventsTimeline), upcoming (after FormGuide, after H2HSection)
- `src/app/[locale]/teams/[slug]/page.tsx` - Added 2 AdUnit placements: after TeamHero, after TeamTabs

## Decisions Made
- Homepage top ad placed before StatHighlights (not after) per user decision "primary ad just before the 3 stat-highlight cards"
- Upcoming match branch: Ad 2 placed after H2HSection and before ComparativeStats (not directly before OddsComparisonTable) to ensure at least one full content section between any ad and odds content per compliance requirement
- Completed match branch has no odds content, so both ads can be placed freely between content sections

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

AdSense environment variables from Plan 01 setup still apply. No additional configuration needed for placements.

## Next Phase Readiness
- Phase 15 (Display Ads) is now complete: ad infrastructure (Plan 01) and ad placements (Plan 02) both done
- All 8 named ad slots from ad-config.ts are wired to page placements
- Ads will render when NEXT_PUBLIC_ADSENSE_PUBLISHER_ID and NEXT_PUBLIC_AD_SLOT_* env vars are set

## Self-Check: PASSED

All files exist. All commits verified. AdUnit count per page verified (2 homepage, 2 matches, 4 match detail, 2 team detail).

---
*Phase: 15-display-ads*
*Completed: 2026-02-09*
