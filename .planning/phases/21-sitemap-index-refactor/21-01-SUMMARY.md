---
phase: 21-sitemap-index-refactor
plan: 01
subsystem: seo
tags: [sitemap, xml, seo, next.js-route-handler, i18n, hreflang]

# Dependency graph
requires:
  - phase: 14-seo-foundation
    provides: "Original monolithic sitemap.ts and sitemap-queries.ts"
provides:
  - "Sitemap-index serving at /sitemap.xml with per-type segment sitemaps"
  - "Central sitemap registry pattern for extensible segment addition"
  - "XML generation utilities with xhtml:link locale alternates"
  - "Database-driven sitemap entries for teams and matches"
affects: [21-02-verification, future-page-types, programmatic-seo]

# Tech tracking
tech-stack:
  added: []
  patterns: [sitemap-index-pattern, segment-registry, xhtml-link-alternates]

key-files:
  created:
    - src/lib/seo/sitemap-registry.ts
    - src/lib/seo/sitemap-xml.ts
    - src/app/sitemap.xml/route.ts
    - src/app/sitemaps/[segment]/route.ts
  modified:
    - src/lib/seo/sitemap-queries.ts

key-decisions:
  - "Used src/app/sitemap.xml/route.ts directory-based route for /sitemap.xml path"
  - "Used kickoff timestamp as lastmod for match entries (no updatedAt column)"
  - "Only include segments with entries in sitemap-index (skip empty)"

patterns-established:
  - "Sitemap registry: add new page types by pushing to sitemapSegments array"
  - "XML generation: buildSitemapXml handles locale alternates automatically"

# Metrics
duration: 3min
completed: 2026-02-12
---

# Phase 21 Plan 01: Sitemap Index Refactor Summary

**Segmented sitemap-index at /sitemap.xml with registry pattern, per-type XML sitemaps for static/teams/matches, and xhtml:link alternates for 5 locales**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-12T19:41:37Z
- **Completed:** 2026-02-12T19:45:12Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Central sitemap registry with 3 segments (static, teams, matches) extensible by pushing to array
- XML generation utilities producing valid sitemap-index and sitemap XML with xhtml:link hreflang alternates
- Route handlers serving /sitemap.xml as sitemap-index and /sitemaps/{name}.xml for per-type sitemaps
- Built-in pagination support for segments exceeding 50,000 URL spec limit

## Task Commits

Each task was committed atomically:

1. **Task 1: Create sitemap registry, XML utilities, and updated queries** - `a054956` (feat)
2. **Task 2: Replace monolithic sitemap.ts with sitemap-index route handler and create segment route** - `91d8988` (feat)

## Files Created/Modified
- `src/lib/seo/sitemap-registry.ts` - Central segment registry with SitemapEntry/SitemapSegment types and 3 initial segments
- `src/lib/seo/sitemap-xml.ts` - buildSitemapIndexXml and buildSitemapXml with locale alternate generation
- `src/lib/seo/sitemap-queries.ts` - Added getTeamSitemapEntries and getMatchSitemapEntries returning SitemapEntry arrays
- `src/app/sitemap.xml/route.ts` - Route handler serving sitemap-index XML at /sitemap.xml
- `src/app/sitemaps/[segment]/route.ts` - Dynamic route handler serving per-segment sitemap XML with pagination

## Decisions Made
- Used `src/app/sitemap.xml/` directory name for route handler to serve at exactly `/sitemap.xml` path -- Next.js 16 supports dots in directory-based routes
- Used fixtures.kickoff as lastmod for match sitemap entries since no updatedAt column exists on the fixtures table
- Used `new Date()` for team lastmod since no updatedAt column exists on the teams table
- Only populated segments appear in sitemap-index (empty segments omitted)

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None -- no external service configuration required.

## Next Phase Readiness
- Sitemap infrastructure is complete and ready for Plan 02 verification
- Registry pattern ready for future page types (leagues, players, stats, h2h) to register with zero infrastructure changes
- Robots.txt already points to /sitemap.xml (unchanged URL)

## Self-Check: PASSED

All 6 files verified present. Both commit hashes (a054956, 91d8988) found in git log.

---
*Phase: 21-sitemap-index-refactor*
*Completed: 2026-02-12*
