---
phase: 24-player-pages
plan: 02
subsystem: seo, api
tags: [json-ld, og-image, sitemap, structured-data, player-pages, hreflang]

# Dependency graph
requires:
  - phase: 24-player-pages
    plan: 01
    provides: "Player profile pages, getPlayerBySlug, getQualifyingPlayerSlugs, player routing"
provides:
  - "Person/Athlete JSON-LD on every qualifying player page"
  - "BreadcrumbList JSON-LD (Home > Team > Player) on every player page"
  - "Dynamic OG image with player name, position, team, and stat summary"
  - "Player sitemap segment with 5+ appearances qualifying filter"
  - "buildPerson JSON-LD builder in structured-data.ts"
affects: [seo, sitemap, social-sharing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Person JSON-LD with SportsTeam memberOf for player pages"
    - "OG image fetching both profile and season stats for rich stat line"
    - "Sitemap segment reusing existing qualifying player query"

key-files:
  created:
    - src/app/[locale]/players/[slug]/opengraph-image.tsx
  modified:
    - src/app/[locale]/players/[slug]/page.tsx
    - src/lib/seo/structured-data.ts
    - src/lib/seo/sitemap-queries.ts
    - src/lib/seo/sitemap-registry.ts

key-decisions:
  - "English-only OG images for players (consistent with leagues and stats OG image decision)"
  - "Weekly changefreq for player sitemap (stats change less frequently than league standings)"
  - "Reuse getQualifyingPlayerSlugs for sitemap instead of duplicating query logic"

patterns-established:
  - "Person JSON-LD with jobTitle as 'Professional Football {Position}' and SportsTeam memberOf"
  - "OG image includes stat summary line (Goals | Assists | Apps) via separate stats query"

# Metrics
duration: 8min
completed: 2026-02-12
---

# Phase 24 Plan 02: Player SEO Summary

**Person JSON-LD, dynamic OG images with stat summary, hreflang alternates, and player sitemap segment with 5+ appearances qualifying filter for ~1,794 players**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-12T21:42:02Z
- **Completed:** 2026-02-12T21:50:04Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Person/Athlete JSON-LD with SportsTeam memberOf on every qualifying player page
- Dynamic OG images showing player name, position, team, and season stat line (Goals | Assists | Apps)
- Player sitemap segment registered as 6th segment with weekly changefreq, only including players with 5+ appearances
- buildPerson JSON-LD builder added to structured-data.ts following existing pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Person JSON-LD, OG image, and hreflang alternates** - `e4752cd` (feat)
2. **Task 2: Register player sitemap segment** - `8d1fab4` (feat)

## Files Created/Modified

- `src/app/[locale]/players/[slug]/opengraph-image.tsx` - Dynamic OG image with player name, position, team, and stat line
- `src/app/[locale]/players/[slug]/page.tsx` - Added Person JSON-LD script tag and buildPerson import
- `src/lib/seo/structured-data.ts` - Added buildPerson JSON-LD builder function
- `src/lib/seo/sitemap-queries.ts` - Added getPlayerSitemapEntries reusing getQualifyingPlayerSlugs
- `src/lib/seo/sitemap-registry.ts` - Registered players segment (6th segment, weekly changefreq)

## Decisions Made

- **English-only OG images:** Consistent with leagues and stats OG image pattern -- language-neutral for social shares
- **Weekly changefreq for players sitemap:** Player stats only change when new matches are played, not daily like standings
- **Reuse getQualifyingPlayerSlugs:** Avoided duplicating the 5+ appearances SQL logic by importing from player queries

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All player SEO infrastructure complete: JSON-LD, OG images, hreflang, sitemap
- Phase 24 (Player Pages) is fully complete (2/2 plans)
- Ready for Phase 25 or milestone completion

## Self-Check: PASSED

- All 5 files verified present on disk
- Commit e4752cd verified in git log
- Commit 8d1fab4 verified in git log
- buildPerson export confirmed in structured-data.ts
- getPlayerSitemapEntries export confirmed in sitemap-queries.ts
- players segment confirmed in sitemap-registry.ts (6 total segments)

---
*Phase: 24-player-pages*
*Completed: 2026-02-12*
