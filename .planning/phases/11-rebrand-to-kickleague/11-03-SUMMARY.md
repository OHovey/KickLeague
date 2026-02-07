---
phase: 11-rebrand-to-kickleague
plan: 03
subsystem: ui
tags: [pwa, manifest, opengraph, og-image, header, svg, branding]

# Dependency graph
requires:
  - phase: 11-01
    provides: "KickLeague name established across codebase"
  - phase: 11-02
    provides: "Wordmark SVG, icon-only SVG, PWA icon PNGs"
provides:
  - "PWA web app manifest (manifest.webmanifest)"
  - "OG image generator for social previews (1200x630)"
  - "Header with inline SVG football icon and branded wordmark text"
affects: [11-04, seo, social-sharing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Next.js metadata file convention for manifest.ts"
    - "Next.js ImageResponse API for OG image generation"
    - "Inline SVG with currentColor for theme-aware icons"

key-files:
  created:
    - src/app/manifest.ts
    - src/app/opengraph-image.tsx
  modified:
    - src/components/header/Header.tsx

key-decisions:
  - "Inline SVG icon + styled HTML text instead of full SVG-text wordmark (avoids font-embedding issues)"
  - "Football icon uses stroke=currentColor for hover state inheritance"

patterns-established:
  - "PWA manifest via manifest.ts metadata file convention"
  - "OG images via opengraph-image.tsx with Satori/ImageResponse"

# Metrics
duration: 2min
completed: 2026-02-07
---

# Phase 11 Plan 03: Brand Asset Wiring Summary

**PWA manifest, OG image generator, and Header wordmark with inline SVG football icon**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-07T08:12:22Z
- **Completed:** 2026-02-07T08:14:05Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- PWA manifest serves at /manifest.webmanifest with KickLeague name, dark theme, and icon references
- OG image auto-generates a 1200x630 dark card with football icon, KickLeague text, and tagline
- Header displays inline SVG football icon alongside styled italic bold "KickLeague" text

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PWA web app manifest** - `5a9e7da` (feat)
2. **Task 2: Create OG image generator for social previews** - `98b4c28` (feat)
3. **Task 3: Upgrade Header to display SVG wordmark** - `85a26f5` (feat)

## Files Created/Modified
- `src/app/manifest.ts` - PWA web app manifest with KickLeague branding and dark theme colors
- `src/app/opengraph-image.tsx` - OG image generator producing 1200x630 branded social card
- `src/components/header/Header.tsx` - Updated to display inline SVG football icon with styled wordmark text

## Decisions Made
- Used inline SVG football icon + styled HTML `<span>` for the wordmark instead of inlining the full wordmark.svg (which uses `<text>` elements requiring font embedding). This gives identical visual result with reliable rendering.
- Football icon uses `stroke="currentColor"` so it inherits text color and responds to hover states.
- OG image inlines the football icon SVG directly in JSX since ImageResponse/Satori cannot load external files.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All brand assets are wired into the application
- Ready for Plan 04 (favicon and remaining metadata updates)
- Build passes with all three new metadata files

---
*Phase: 11-rebrand-to-kickleague*
*Completed: 2026-02-07*

## Self-Check: PASSED
