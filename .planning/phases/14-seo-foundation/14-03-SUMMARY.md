---
phase: 14-seo-foundation
plan: 03
subsystem: seo
tags: [robots.txt, sitemap.xml, next-intl, drizzle, i18n, seo]

# Dependency graph
requires:
  - phase: 14-01
    provides: SEO metadata foundation with metadataBase and hreflang config
  - phase: 13-i18n-completeness
    provides: routing.pathnames config with localized URLs
provides:
  - robots.txt generation blocking /api/* and /cron/*
  - Dynamic sitemap.xml with all pages and localized alternates
  - Database queries for team slugs and finished match IDs
affects: [14-04, 14-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Next.js file-convention robots.ts/sitemap.ts at app root (outside [locale])"
    - "routing.pathnames for localized URL resolution in non-component contexts"

key-files:
  created:
    - src/app/robots.ts
    - src/app/sitemap.ts
    - src/lib/seo/sitemap-queries.ts
  modified: []

key-decisions:
  - "Removed deprecated middleware.ts (proxy.ts only for Next.js 16 compatibility)"
  - "Cast pathConfig to Record<string,string> for TypeScript union narrowing"
  - "Only finished matches in sitemap (upcoming have thin content)"

patterns-established:
  - "Sitemap localized path resolution: routing.pathnames + locale prefix"
  - "SEO query pattern: isDatabaseConfigured() guard with empty-array fallback"

# Metrics
duration: 5min
completed: 2026-02-08
---

# Phase 14 Plan 03: Robots.txt and Sitemap.xml Summary

**Dynamic robots.txt and sitemap.xml via Next.js file conventions, with localized alternates for all 5 locales using routing.pathnames**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-08T16:32:29Z
- **Completed:** 2026-02-08T16:37:27Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- robots.txt blocks /api/* and /cron/*, allows everything else, references /sitemap.xml
- Dynamic sitemap.xml lists homepage, matches page, all team pages, and all finished match pages
- Every sitemap entry has xhtml:link alternates for all 5 locales with correctly localized paths (spiele, partidos, mannschaften, equipos, etc.)
- Database queries gracefully handle missing DB configuration

## Task Commits

Each task was committed atomically:

1. **Task 1: Create sitemap database queries and robots.ts** - `e81b5c8` (feat)
2. **Task 2: Create sitemap.ts with localized alternates** - `86fbc35` (feat)

## Files Created/Modified
- `src/app/robots.ts` - Generates /robots.txt with allow/disallow rules and sitemap reference
- `src/app/sitemap.ts` - Generates /sitemap.xml dynamically with localized alternates for all pages
- `src/lib/seo/sitemap-queries.ts` - Database queries for getAllTeamSlugs() and getFinishedMatchIds()
- `src/middleware.ts` - DELETED (removed deprecated file; proxy.ts is canonical for Next.js 16)

## Decisions Made
- Removed deprecated middleware.ts which only re-exported proxy.ts -- Next.js 16.1.6 rejects having both files
- Used `as Record<string, string>` cast in getLocalizedPath for pathConfig union type narrowing
- Only finished matches included in sitemap (upcoming matches have thin content per research recommendations)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed deprecated middleware.ts for Next.js 16 compatibility**
- **Found during:** Task 1 (build verification)
- **Issue:** Next.js 16.1.6 errors when both middleware.ts and proxy.ts exist. middleware.ts only re-exported proxy.ts.
- **Fix:** Deleted middleware.ts; proxy.ts is the canonical middleware file
- **Files modified:** src/middleware.ts (deleted)
- **Verification:** Dev server starts successfully, robots.txt and sitemap.xml both accessible
- **Committed in:** e81b5c8 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for runtime verification. middleware.ts was redundant (only re-exported proxy.ts). No scope creep.

## Issues Encountered
- Pre-existing Next.js 16 middleware/proxy conflict prevented `npm run build` and `next dev`. Resolved by removing the deprecated middleware.ts re-export file.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- robots.txt and sitemap.xml are live and working
- Sitemap provides foundation for search engine discovery of all localized pages
- Ready for structured data (14-04) and canonical URL work (14-05)

---
*Phase: 14-seo-foundation*
*Completed: 2026-02-08*

## Self-Check: PASSED
