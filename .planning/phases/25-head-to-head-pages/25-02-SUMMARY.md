---
phase: 25-head-to-head-pages
plan: 02
subsystem: seo, ui, api
tags: [h2h, og-image, sitemap, cross-links, json-ld, i18n]

# Dependency graph
requires:
  - phase: 25-01
    provides: H2H page with data layer, UI, and i18n
  - phase: 14-seo-foundation
    provides: sitemap-queries pattern, structured-data builders, sitemap-registry
  - phase: 24-01
    provides: Player pages with slug routing
provides:
  - Dynamic OG images for H2H pages (1200x630)
  - H2H sitemap segment (7th segment in registry)
  - Cross-links between all page types (team, league, player, h2h)
  - getH2HPairsForTeam query for team page cross-links
  - getH2HSitemapEntries for sitemap generation
affects: [seo, crawlability, internal-linking]

# Tech tracking
tech-stack:
  added: []
  patterns: [cross-link sections at page bottom, player slug in squad roster links]

key-files:
  created:
    - src/app/[locale]/h2h/[matchup]/opengraph-image.tsx
  modified:
    - src/lib/seo/sitemap-queries.ts
    - src/lib/seo/sitemap-registry.ts
    - src/lib/h2h/queries.ts
    - src/lib/teams/queries.ts
    - src/components/team-detail/SquadTab.tsx
    - src/app/[locale]/teams/[slug]/page.tsx
    - src/app/[locale]/leagues/[slug]/page.tsx
    - src/messages/en.json
    - src/messages/es.json
    - src/messages/de.json
    - src/messages/it.json
    - src/messages/fr.json

key-decisions:
  - "English-only OG images for H2H (consistent with leagues, stats, players)"
  - "Weekly changefreq for H2H sitemap (meetings data rarely changes)"
  - "Added slug to PlayerStat interface to enable squad roster links to player pages"
  - "H2H section on team page limited to 5 opponents sorted by meeting count"
  - "Statistics section added to league page between top scorers and recent matches"

patterns-established:
  - "Cross-link section pattern: compact list with logos, names, and chevron arrows"
  - "Squad roster players link to /players/[slug] via useLocale()"

# Metrics
duration: 9min
completed: 2026-02-12
---

# Phase 25 Plan 02: H2H SEO Infrastructure and Cross-Links Summary

**Dynamic OG images, sitemap segment (7th), and full cross-linking between team/league/player/H2H pages across 5 locales**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-12T22:34:23Z
- **Completed:** 2026-02-12T22:44:15Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Dynamic OG image for H2H pages showing team names, aggregate record, and meeting count (1200x630 PNG, text-only)
- H2H sitemap segment registered as 7th in sitemap-registry with weekly changefreq
- BreadcrumbList JSON-LD already in place from 25-01 (no additional work needed)
- Team pages now show H2H matchups section with up to 5 opponent links
- Squad tab roster rows and top performer cards now link to player profile pages
- League pages now have Statistics section with links to 3 stat leaderboard pages
- All new i18n keys translated across 5 locales (en/es/de/it/fr)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add OG image, JSON-LD, and H2H sitemap segment** - `5e2fcd5` (feat)
2. **Task 2: Wire cross-links between all page types** - `3336a6b` (feat)

## Files Created/Modified
- `src/app/[locale]/h2h/[matchup]/opengraph-image.tsx` - Dynamic OG image with team names, aggregate record
- `src/lib/seo/sitemap-queries.ts` - Added getH2HSitemapEntries using getQualifyingH2HPairs
- `src/lib/seo/sitemap-registry.ts` - Registered h2h as 7th sitemap segment
- `src/lib/h2h/queries.ts` - Added getH2HPairsForTeam query and H2HOpponentLink type
- `src/lib/teams/queries.ts` - Added slug to PlayerStat interface and getPlayerStats select
- `src/components/team-detail/SquadTab.tsx` - Player names link to /players/[slug], top performers link too
- `src/app/[locale]/teams/[slug]/page.tsx` - Added H2H matchups section below tabs
- `src/app/[locale]/leagues/[slug]/page.tsx` - Added Statistics section with stat page links
- `src/messages/{en,es,de,it,fr}.json` - Added headToHead, meetingsLabel, statistics, stat type keys

## Cross-Link Audit Results

| From | To | Status |
|------|-----|--------|
| Team page -> H2H pages | /h2h/[matchup] | Added (H2H matchups section) |
| Team page -> Player pages | /players/[slug] | Added (squad roster + top performers) |
| League page -> Stats pages | /leagues/[slug]/stats/[stat] | Added (Statistics section) |
| League page -> Team pages | /teams/[slug] | Already existed (standings table rows) |
| Player page -> Team page | /teams/[slug] | Already existed (24-01) |
| H2H page -> Team pages | /teams/[slug] | Already existed (25-01) |
| H2H page -> Match pages | /matches/[id] | Already existed (25-01) |

## Decisions Made
- English-only OG images for H2H pages (consistent with leagues, stats, and players decisions)
- Weekly changefreq for H2H sitemap segment (meeting data changes infrequently)
- Added slug to PlayerStat interface and query to support player page links from squad tab
- H2H section on team page shows top 5 opponents by meeting count (keeps section compact)
- Statistics section placed above recent/upcoming matches on league page for visibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] Added slug to PlayerStat interface**
- **Found during:** Task 2
- **Issue:** PlayerStat interface lacked slug field, preventing squad roster links to player pages
- **Fix:** Added slug to PlayerStat interface, select query, and return mapping in getPlayerStats
- **Files modified:** src/lib/teams/queries.ts
- **Commit:** 3336a6b

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 25 (Head-to-Head Pages) is now complete
- All H2H pages have OG images, JSON-LD, and sitemap coverage
- Internal link graph is fully connected across all 5 page types
- Ready for milestone completion

---
*Phase: 25-head-to-head-pages*
*Completed: 2026-02-12*
