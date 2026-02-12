---
phase: 22-league-landing-pages
plan: 02
subsystem: seo
tags: [next.js, seo, json-ld, opengraph, sitemap, structured-data, static-generation]

# Dependency graph
requires:
  - phase: 22-league-landing-pages/01
    provides: league landing pages with routing, i18n, and breadcrumb JSON-LD
  - phase: 21-sitemap-index-refactor
    provides: sitemap registry infrastructure for new page types
provides:
  - generateStaticParams for build-time generation of all 5 league pages
  - SportsOrganization JSON-LD structured data on each league page
  - Dynamic OG images for league pages (text-based, light gradient)
  - Leagues sitemap segment in sitemap-index (/sitemaps/leagues.xml)
  - getLeagueSitemapEntries query function
  - buildSportsOrganization JSON-LD builder
affects: [programmatic-seo, sitemap-index]

# Tech tracking
tech-stack:
  added: []
  patterns: [buildSportsOrganization JSON-LD builder, league OG image with text-only design]

key-files:
  created:
    - src/app/[locale]/leagues/[slug]/opengraph-image.tsx
  modified:
    - src/app/[locale]/leagues/[slug]/page.tsx
    - src/lib/seo/structured-data.ts
    - src/lib/seo/sitemap-registry.ts
    - src/lib/seo/sitemap-queries.ts

key-decisions:
  - "Text-only OG images for leagues (SVG logos are relative paths, not usable in ImageResponse)"
  - "Daily changefreq for leagues sitemap segment (standings change daily during season)"

patterns-established:
  - "buildSportsOrganization: JSON-LD builder for league-type entities following buildSportsTeam pattern"
  - "League OG image: text-only with light gradient matching team page fallback style"

# Metrics
duration: 3min
completed: 2026-02-12
---

# Phase 22 Plan 02: League SEO Infrastructure Summary

**SportsOrganization JSON-LD, OG images, generateStaticParams, and leagues sitemap segment for full search engine optimization of 25 league page URLs**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-12T20:26:31Z
- **Completed:** 2026-02-12T20:29:06Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- All 5 league pages prerendered at build time via generateStaticParams (25 URLs across 5 locales)
- SportsOrganization JSON-LD + BreadcrumbList JSON-LD on every league page
- Dynamic OG images (1200x630 PNG) for all league pages with league name and subtitle
- Leagues sitemap segment registered -- /sitemaps/leagues.xml with all 5 leagues and locale alternates
- Build output confirms league routes as SSG with 30-minute ISR revalidation

## Task Commits

Each task was committed atomically:

1. **Task 1: Add generateStaticParams, SportsOrganization JSON-LD to league pages** - `526218a` (feat)
2. **Task 2: Create OG image and register leagues sitemap segment** - `e16cab8` (feat)

## Files Created/Modified
- `src/app/[locale]/leagues/[slug]/page.tsx` - Added generateStaticParams + SportsOrganization JSON-LD injection
- `src/lib/seo/structured-data.ts` - Added buildSportsOrganization JSON-LD builder
- `src/app/[locale]/leagues/[slug]/opengraph-image.tsx` - Dynamic OG image for league pages
- `src/lib/seo/sitemap-queries.ts` - Added getLeagueSitemapEntries query function
- `src/lib/seo/sitemap-registry.ts` - Registered leagues segment in sitemap registry

## Decisions Made
- Used text-only OG images for leagues since league logo SVGs are relative paths (/leagues/premier-league.svg) and not usable in ImageResponse at build time
- Set daily changefreq for leagues sitemap segment since standings data updates daily during season

## Deviations from Plan

None - plan executed exactly as written. Note: generateMetadata with hreflang alternates was already implemented in Plan 01, so Task 1 focused on the remaining items (generateStaticParams and JSON-LD).

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 22 complete: all 5 league landing pages fully SEO-optimized
- 25 new indexable URLs (5 leagues x 5 locales) with metadata, OG images, JSON-LD, and sitemap entries
- Ready for next phase in programmatic SEO milestone

## Self-Check: PASSED

All 5 files verified as existing. Both task commits (526218a, e16cab8) verified in git log.

---
*Phase: 22-league-landing-pages*
*Completed: 2026-02-12*
