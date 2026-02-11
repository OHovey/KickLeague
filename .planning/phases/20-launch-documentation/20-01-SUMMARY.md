---
phase: 20-launch-documentation
plan: 01
subsystem: docs
tags: [adsense, affiliate, dns, vercel, monetisation, checklist]

# Dependency graph
requires:
  - phase: 15-display-ads
    provides: "AdSense ad-config.ts with 8 named slots and publisher ID env var"
  - phase: 12-site-chrome-homepage
    provides: "Affiliate config.ts with 5 bookmaker program mappings"
provides:
  - "AdSense setup checklist (docs/ADSENSE_SETUP.md)"
  - "Affiliate program setup checklist (docs/AFFILIATE_SETUP.md)"
  - "DNS and domain setup checklist (docs/DNS_SETUP.md)"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: ["docs/ directory for operator checklists"]

key-files:
  created:
    - docs/ADSENSE_SETUP.md
    - docs/AFFILIATE_SETUP.md
    - docs/DNS_SETUP.md
  modified: []

key-decisions:
  - "Checklists reference exact env var names from source code for accuracy"
  - "All docs use markdown checkboxes for trackable action items"

patterns-established:
  - "Operator checklists: docs/ directory with actionable setup guides"

# Metrics
duration: 2min
completed: 2026-02-11
---

# Phase 20 Plan 01: Launch Documentation Summary

**Three actionable operator checklists for AdSense (9 env vars, ads.txt), affiliate programs (5 bookmaker signups), and DNS/domain configuration**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-11T02:10:26Z
- **Completed:** 2026-02-11T02:13:03Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments
- AdSense setup checklist with account creation, 8 ad unit slot creation, ads.txt update, and Vercel env var configuration
- Affiliate program setup checklist with signup steps for all 5 programs (Flutter, Entain, Kindred, 888, William Hill) and summary tracking table
- DNS/domain setup checklist with registrar guidance, Vercel domain linking, DNS records, SSL verification, and post-launch checks

## Task Commits

Each task was committed atomically:

1. **Task 1: Create AdSense setup checklist** - `d4b2424` (docs)
2. **Task 2: Create affiliate program setup checklist** - `bbbe99c` (docs)
3. **Task 3: Create DNS and domain setup checklist** - `596fb6f` (docs)

## Files Created
- `docs/ADSENSE_SETUP.md` - Complete AdSense setup checklist (account creation, 8 ad slots, ads.txt, verification)
- `docs/AFFILIATE_SETUP.md` - Complete affiliate program setup checklist (5 programs, 6 bookmakers, env var mapping)
- `docs/DNS_SETUP.md` - Complete DNS/domain setup checklist (domain purchase, DNS records, SSL, post-launch verification)

## Decisions Made
- Referenced exact env var names from source files (`ad-config.ts`, `config.ts`) rather than hardcoding -- ensures documentation stays accurate to codebase
- Used markdown checkboxes throughout for trackable action items
- Included troubleshooting sections in DNS guide (most common setup issues)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

These three checklists ARE the user setup documentation. The human steps documented include:
- **AdSense:** Account creation, ad unit creation, ads.txt update, Vercel env vars
- **Affiliates:** Program signups, ID/btag collection, Vercel env vars
- **DNS:** Domain purchase, DNS records, SSL verification, NEXT_PUBLIC_SITE_URL update

## Next Phase Readiness
- All documentation for v1.3 launch is complete
- No further plans in Phase 20 -- this is the final phase

## Self-Check: PASSED

All 3 created files verified on disk. All 3 task commits verified in git log.

---
*Phase: 20-launch-documentation*
*Completed: 2026-02-11*
