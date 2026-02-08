---
phase: 14-seo-foundation
plan: 02
subsystem: seo
tags: [metadata, open-graph, hreflang, next-intl, i18n, seo]

# Dependency graph
requires:
  - phase: 14-01
    provides: metadataBase, Metadata translation keys (teamTitle, teamDescription, matchTitle, matchDescription)
  - phase: 13-01
    provides: routing.pathnames config with localized paths for all 5 locales
provides:
  - Complete SEO metadata on team detail pages (title, description, OG, hreflang)
  - Complete SEO metadata on match detail pages (spoiler-free OG, description, hreflang)
  - Hreflang alternates using localized pathnames from routing config
affects: [14-03, 14-04, 14-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "routing.pathnames lookup for hreflang alternates generation"
    - "Spoiler-free OG title pattern (browser tab shows score, social preview does not)"

key-files:
  created: []
  modified:
    - src/app/[locale]/teams/[slug]/page.tsx
    - src/app/[locale]/matches/[id]/page.tsx

key-decisions:
  - "OG title for match pages always uses spoiler-free format ({home} vs {away}) regardless of match status"
  - "Hreflang paths derived from routing.pathnames config for proper localization (e.g., /de/mannschaften/, /es/equipos/)"
  - "League name passed to teamTitle for complete '{team} - {league}' format"

patterns-established:
  - "Hreflang alternates pattern: routing.locales.map with routing.pathnames lookup and slug/id replacement"
  - "OG metadata pattern: always append '| KickLeague' suffix to OG title"

# Metrics
duration: 2min
completed: 2026-02-08
---

# Phase 14 Plan 02: Team & Match Page SEO Metadata Summary

**Full SEO metadata on team and match detail pages with translated descriptions, Open Graph tags, and localized hreflang alternates for all 5 locales**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-08T16:31:37Z
- **Completed:** 2026-02-08T16:33:18Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Team pages now have complete metadata: title with league name, translated description (team/league/season), OG tags, and hreflang alternates with localized paths
- Match pages now have spoiler-free OG title (never reveals scores in social previews), translated description, and hreflang alternates
- All hreflang paths properly localized using routing.pathnames config (e.g., /de/mannschaften/arsenal, /es/partidos/123)

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhance team page generateMetadata** - `8fffd9b` (feat)
2. **Task 2: Enhance match detail generateMetadata** - `073f416` (feat)

## Files Created/Modified
- `src/app/[locale]/teams/[slug]/page.tsx` - Enhanced generateMetadata with description, OG tags, and hreflang alternates using routing.pathnames
- `src/app/[locale]/matches/[id]/page.tsx` - Enhanced generateMetadata with spoiler-free OG title, description, and hreflang alternates

## Decisions Made
- OG title for match pages always uses spoiler-free format regardless of match status (browser tab shows score, social share does not)
- Hreflang alternates derived from routing.pathnames config for proper localized URLs
- League name now passed to teamTitle key for complete "{team} - {league}" format

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npm run build` fails with pre-existing Next.js 16.1.6 middleware/proxy conflict error (unrelated to this plan's changes). TypeScript compilation (`tsc --noEmit`) confirms zero type errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Team and match detail pages have complete SEO metadata
- Ready for 14-03 (structured data / JSON-LD) which builds on this metadata
- All 5 locales covered by hreflang alternates

## Self-Check: PASSED

---
*Phase: 14-seo-foundation*
*Completed: 2026-02-08*
