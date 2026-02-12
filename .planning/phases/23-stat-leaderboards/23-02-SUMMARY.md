---
phase: 23-stat-leaderboards
plan: 02
subsystem: seo, ui
tags: [next-intl, json-ld, og-image, sitemap, hreflang, schema-org, metadata]

# Dependency graph
requires:
  - phase: 23-stat-leaderboards
    plan: 01
    provides: 15 leaderboard pages at /leagues/[slug]/stats/[stat], routing config, StatsPage i18n namespace
  - phase: 22-league-landing-pages
    provides: OG image pattern, generateMetadata pattern, league page SEO pattern
  - phase: 21-sitemap-index-refactor
    provides: Sitemap registry pattern, SitemapEntry interface, sitemap-queries module
provides:
  - Full SEO metadata (title, description, hreflang alternates) on all 15 leaderboard pages
  - ItemList + BreadcrumbList JSON-LD structured data on all 15 leaderboard pages
  - Dynamic OG images for all league/stat combinations
  - Stats sitemap segment with 15 entries and locale alternates
  - buildItemList function in structured-data.ts
affects: [future stat page types, any new sitemap segments]

# Tech tracking
tech-stack:
  added: []
  patterns: [ItemList JSON-LD for leaderboard-style pages, multi-param hreflang alternate generation]

key-files:
  created:
    - src/app/[locale]/leagues/[slug]/stats/[stat]/opengraph-image.tsx
  modified:
    - src/app/[locale]/leagues/[slug]/stats/[stat]/page.tsx
    - src/lib/seo/structured-data.ts
    - src/lib/seo/sitemap-registry.ts
    - src/lib/seo/sitemap-queries.ts
    - src/messages/en.json
    - src/messages/es.json
    - src/messages/de.json
    - src/messages/it.json
    - src/messages/fr.json

key-decisions:
  - "English-only OG images (language-neutral for social shares, avoids locale-specific image generation)"
  - "Daily changefreq for stats sitemap (leaderboard data changes as new matches are played)"
  - "Metadata namespace for stats SEO keys (consistent with league/team metadata pattern)"

patterns-established:
  - "Multi-param hreflang pattern: replace multiple [param] placeholders in routing.pathnames for alternates"
  - "buildItemList reusable for any ranked/ordered list JSON-LD (players, teams, etc.)"

# Metrics
duration: 3min
completed: 2026-02-12
---

# Phase 23 Plan 02: Stat Leaderboard SEO Infrastructure Summary

**Full SEO metadata, JSON-LD ItemList/BreadcrumbList, dynamic OG images, and stats sitemap segment for all 15 leaderboard pages across 5 locales**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-12T21:03:46Z
- **Completed:** 2026-02-12T21:07:30Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Enhanced generateMetadata with i18n title/description using Metadata namespace and hreflang alternates for all 5 locales
- Added BreadcrumbList (Home > League > Stat Type) and ItemList (player rankings) JSON-LD structured data
- Created dynamic OG image route showing stat type name, league name, and KickLeague branding
- Added buildItemList to structured-data.ts as a reusable JSON-LD builder
- Registered stats sitemap segment producing 15 entries (5 leagues x 3 stat types) with locale alternates
- Added Metadata i18n keys in all 5 locales (statsTitle, statsDescription, stat type display names)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add generateMetadata, JSON-LD, and OG images to leaderboard pages** - `916c788` (feat)
2. **Task 2: Register stats sitemap segment** - `29085ab` (feat)

## Files Created/Modified
- `src/app/[locale]/leagues/[slug]/stats/[stat]/page.tsx` - Enhanced with generateMetadata (hreflang), JSON-LD scripts
- `src/app/[locale]/leagues/[slug]/stats/[stat]/opengraph-image.tsx` - Dynamic OG image for stat/league combinations
- `src/lib/seo/structured-data.ts` - Added buildItemList function for ItemList JSON-LD
- `src/lib/seo/sitemap-queries.ts` - Added getStatsSitemapEntries for leagues x stat types
- `src/lib/seo/sitemap-registry.ts` - Registered stats segment with daily changefreq
- `src/messages/en.json` - Added statsTitle, statsDescription, stat type name keys
- `src/messages/es.json` - Spanish translations for stats metadata
- `src/messages/de.json` - German translations for stats metadata
- `src/messages/it.json` - Italian translations for stats metadata
- `src/messages/fr.json` - French translations for stats metadata

## Decisions Made
- Used English-only OG images (language-neutral for social sharing, avoids per-locale image generation complexity)
- Set daily changefreq for stats sitemap since leaderboard rankings change with each match
- Used Metadata namespace for stats SEO keys, consistent with existing league/team metadata pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 15 leaderboard pages have complete SEO infrastructure matching league and team page quality
- Phase 23 is fully complete (both plans done)
- Stats sitemap segment is registered and will be included in /sitemap.xml index

## Self-Check: PASSED

All 10 files verified present. Both task commits (916c788, 29085ab) verified in git log.

---
*Phase: 23-stat-leaderboards*
*Completed: 2026-02-12*
