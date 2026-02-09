---
phase: 15-display-ads
plan: 01
subsystem: ui
tags: [adsense, ads, lazy-loading, intersection-observer, glassmorphism]

# Dependency graph
requires:
  - phase: 12-site-chrome-homepage
    provides: Glass-themed UI components and layout structure for ad integration
provides:
  - AdUnit client component with lazy loading, skeleton, and ad blocker collapse
  - Ad configuration constants with env-var-driven slot IDs
  - ads.txt publisher verification file
  - CSS unfilled ad collapse rule
affects: [15-02-PLAN]

# Tech tracking
tech-stack:
  added: [Google AdSense (pagead2.googlesyndication.com)]
  patterns: [module-level singleton script loader, IntersectionObserver lazy trigger, env-var-driven ad config]

key-files:
  created:
    - src/components/ads/ad-config.ts
    - src/components/ads/AdUnit.tsx
    - public/ads.txt
  modified:
    - src/app/globals.css
    - .env.example

key-decisions:
  - "Module-level script promise singleton ensures one AdSense script load across all AdUnit instances"
  - "IntersectionObserver rootMargin 200px pre-loads ads before they enter viewport"
  - "usePathname as ins element key forces React remount on client-side navigation"

patterns-established:
  - "AdUnit pattern: import slot from ad-config, pass slotId prop to AdUnit component"
  - "Graceful collapse: blocked/unfilled ads render null with no empty space"

# Metrics
duration: 2min
completed: 2026-02-09
---

# Phase 15 Plan 01: Ad Infrastructure Summary

**Reusable AdUnit client component with IntersectionObserver lazy loading, glass-themed skeleton, AdSense script singleton, and graceful ad blocker collapse**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-09T06:20:26Z
- **Completed:** 2026-02-09T06:22:09Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Self-contained AdUnit client component that handles entire AdSense lifecycle
- Module-level script loader shared across all component instances (no duplicate scripts)
- Glass-themed skeleton placeholder matching site aesthetic during ad load
- Belt-and-suspenders collapse: JS state + CSS rule for unfilled/blocked ads
- Full env var documentation for publisher ID and 8 named ad slots

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ad configuration and AdUnit client component** - `7157782` (feat)
2. **Task 2: Create ads.txt, CSS collapse rule, and update .env.example** - `4a32c09` (chore)

## Files Created/Modified
- `src/components/ads/ad-config.ts` - Publisher ID and 8 named slot configs from env vars
- `src/components/ads/AdUnit.tsx` - Client component: script load, IntersectionObserver, skeleton, collapse
- `public/ads.txt` - AdSense publisher verification placeholder
- `src/app/globals.css` - CSS collapse rule for unfilled adsbygoogle elements
- `.env.example` - Documents all AdSense env vars

## Decisions Made
- Module-level `scriptPromise` singleton prevents duplicate AdSense script tags across multiple AdUnit mounts
- 200px rootMargin on IntersectionObserver pre-loads ads slightly before visible for smoother UX
- `usePathname()` as `key` on the `<ins>` element forces React to remount on client-side navigation, ensuring fresh ad requests per route

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

When ready to enable ads, the user needs to:
- Replace `pub-XXXXXXXXXXXXXXXX` in `public/ads.txt` with their actual AdSense publisher ID
- Set `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` environment variable (e.g., `ca-pub-1234567890123456`)
- Set individual `NEXT_PUBLIC_AD_SLOT_*` environment variables with AdSense slot IDs

## Next Phase Readiness
- AdUnit component ready to be placed on pages in Plan 02
- All slot names defined in ad-config.ts match the page placements planned in 15-02

## Self-Check: PASSED

All files exist. All commits verified. All exports confirmed.

---
*Phase: 15-display-ads*
*Completed: 2026-02-09*
