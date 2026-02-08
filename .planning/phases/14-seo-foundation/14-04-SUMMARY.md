---
phase: 14-seo-foundation
plan: 04
subsystem: ui
tags: [og-image, social-sharing, satori, imageresponse, opengraph]

# Dependency graph
requires:
  - phase: 14-01
    provides: "metadataBase and metadata foundation for OG image URL resolution"
provides:
  - "Dynamic OG image generators for all 4 page types (homepage, matches, team, match detail)"
  - "Light high-contrast visual style for social media previews"
  - "Spoiler-free match OG images (no scores)"
affects: [14-05, future-social-sharing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Light gradient OG images (#f8f9fa to #e9ecef) with dark text for social feed visibility"
    - "Direct DB queries in OG images instead of server actions (avoids getLocale context issues)"
    - "CamelCase SVG attributes (strokeWidth, strokeLinejoin) for Satori compatibility"

key-files:
  created:
    - src/app/[locale]/opengraph-image.tsx
    - src/app/[locale]/matches/opengraph-image.tsx
    - src/app/[locale]/matches/[id]/opengraph-image.tsx
    - src/app/[locale]/teams/[slug]/opengraph-image.tsx
  modified: []

key-decisions:
  - "Used direct DB queries for match OG instead of fetchMatchDetail server action (avoids next-intl getLocale() context requirement)"
  - "OG images use English team names (no localization) for maximum social sharing reach"
  - "Light gradient style (#f8f9fa to #e9ecef) with #1a1a2e dark text per user decision"

patterns-established:
  - "OG image fallback pattern: return branded KickLeague fallback for missing/invalid data"
  - "Ordinal suffix helper (getOrdinalSuffix) for position display in OG images"

# Metrics
duration: 2min
completed: 2026-02-08
---

# Phase 14 Plan 04: OG Images Summary

**Dynamic OG image generators for 4 page types using Next.js ImageResponse with light high-contrast style, team logos/positions, and spoiler-free match previews**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-08T16:33:17Z
- **Completed:** 2026-02-08T16:35:31Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments
- Homepage OG image with KickLeague branding and football icon SVG
- Matches list OG image with "Results & Fixtures" heading
- Team page OG image showing team logo, name, and league position with ordinal suffix
- Match detail OG image showing team names/logos without scores (spoiler-free sharing)
- Graceful fallback images for all error/missing data cases

## Task Commits

Each task was committed atomically:

1. **Task 1: Create default and matches list OG images with light style** - `d5fe7c4` (feat)
2. **Task 2: Create team and match detail OG images with dynamic data** - `06fe77a` (feat)

## Files Created/Modified
- `src/app/[locale]/opengraph-image.tsx` - Default locale-scoped OG image with KickLeague branding and football icon
- `src/app/[locale]/matches/opengraph-image.tsx` - Matches list page OG image with "Results & Fixtures"
- `src/app/[locale]/matches/[id]/opengraph-image.tsx` - Match detail OG with team names/logos, no scores
- `src/app/[locale]/teams/[slug]/opengraph-image.tsx` - Team OG with logo, name, and league position

## Decisions Made
- Used direct DB queries for match detail OG image instead of `fetchMatchDetail` server action, which calls `getLocale()` from `next-intl/server` and requires i18n request context that may not be available during OG image generation
- OG images display English team names (not localized) since social media previews should be universally readable
- Kept existing root `src/app/opengraph-image.tsx` (dark theme) as fallback for bare `/` redirect; new locale-scoped ones use light theme

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used direct DB query instead of fetchMatchDetail server action**
- **Found during:** Task 2 (Match detail OG image)
- **Issue:** Plan suggested using `fetchMatchDetail` from `@/components/match-detail/actions`, but this server action calls `getLocale()` from `next-intl/server` which requires i18n request context that OG image generation may not have
- **Fix:** Wrote an inline Drizzle query fetching only the fields needed for the OG image (status, team names, logos)
- **Files modified:** `src/app/[locale]/matches/[id]/opengraph-image.tsx`
- **Verification:** TypeScript compilation passes with no errors
- **Committed in:** `06fe77a`

---

**Total deviations:** 1 auto-fixed (1 bug prevention)
**Impact on plan:** Essential for reliable OG image rendering. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 page types now have OG image generators
- OG images will be resolved via metadataBase from 14-01
- Ready for structured data (14-05) or any remaining SEO plans

## Self-Check: PASSED

---
*Phase: 14-seo-foundation*
*Completed: 2026-02-08*
