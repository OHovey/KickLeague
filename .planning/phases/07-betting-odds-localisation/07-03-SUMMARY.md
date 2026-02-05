---
phase: 07-betting-odds-localisation
plan: 03
subsystem: geo-compliance
tags: [geo-detection, compliance, proxy, responsible-gambling]

dependency-graph:
  requires: [07-04]
  provides: [geo-compliance-config, geo-headers, responsible-gambling-component]
  affects: [07-02, 07-05]

tech-stack:
  added: []
  patterns: [proxy-composition, header-based-context-passing, single-source-of-truth-config]

key-files:
  created:
    - src/lib/geo/types.ts
    - src/lib/geo/compliance.ts
    - src/components/odds/ResponsibleGambling.tsx
  modified:
    - src/proxy.ts

decisions:
  - id: 07-03-01
    decision: "TIER_1_COUNTRIES as Set<string> single source of truth in compliance.ts"
    reason: "Avoids scattered country lists across proxy, components, and API routes"
  - id: 07-03-02
    decision: "OVERRIDE_COUNTRY env var takes priority over Vercel headers for local dev"
    reason: "Vercel geo headers only exist in deployed environment; dev needs testing capability"
  - id: 07-03-03
    decision: "Default country code is 'XX' (unknown) which maps to Tier 2 (blocked)"
    reason: "Fail-safe: unknown users see no betting content rather than improperly showing it"
  - id: 07-03-04
    decision: "ResponsibleGambling uses external link to begambleaware.org"
    reason: "Standard responsible gambling resource; can be updated per jurisdiction later"

metrics:
  duration: 1 min
  completed: 2026-02-05
---

# Phase 7 Plan 03: Geo-Detection & Compliance Summary

**Geo compliance config with Tier 1/Tier 2 country classification, proxy.ts extended with x-user-country and x-show-betting headers, and ResponsibleGambling footer component.**

## What Was Done

### Task 1: Geo Compliance Config and Types
Created `src/lib/geo/types.ts` with the `GeoContext` interface (countryCode + showBetting). Created `src/lib/geo/compliance.ts` as the single source of truth for country classification:
- `TIER_1_COUNTRIES` Set with 8 countries (GB, DK, SE, FR, PT, AT, CH, DE)
- `shouldShowBetting()` returns true only for Tier 1; null/undefined returns false
- `getComplianceContext()` builds a full GeoContext from a raw country code
- All unlisted countries default to Tier 2 (blocked) -- fail-safe design

**Commit:** 976e705

### Task 2: Extend Proxy with Geo Headers + ResponsibleGambling Component
Updated `src/proxy.ts` to combine i18n routing with geo detection:
- Reads country from `OVERRIDE_COUNTRY` env var (dev priority), `x-vercel-ip-country` header, or defaults to `'XX'`
- Calls `shouldShowBetting()` from compliance.ts
- Sets `x-user-country` and `x-show-betting` headers on every proxied response
- Header values: `'1'` for Tier 1 countries, `'0'` for all others

Created `src/components/odds/ResponsibleGambling.tsx`:
- Client component with `show` boolean prop (renders null when false)
- 18+ badge in a styled circular pill
- Translated message and help link via next-intl `useTranslations`
- Tailwind dark footer bar styling (bg-zinc-900, border-zinc-700)
- Links to begambleaware.org with noopener/noreferrer

**Commit:** d92e729

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| 07-03-01 | TIER_1_COUNTRIES as single Set in compliance.ts | Avoids duplicating country lists across codebase |
| 07-03-02 | OVERRIDE_COUNTRY env var for local dev testing | Vercel geo headers unavailable locally |
| 07-03-03 | Default 'XX' maps to Tier 2 (blocked) | Fail-safe: unknown geo = no betting content |
| 07-03-04 | begambleaware.org as help link target | Standard responsible gambling resource |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

1. `npx tsc --noEmit` -- passed with zero errors
2. `npm run build` -- succeeded, all routes compiled
3. `shouldShowBetting('GB')` returns true (Tier 1)
4. `shouldShowBetting('IT')` returns false (Tier 2)
5. `shouldShowBetting(null)` returns false (no country = blocked)
6. Default 'XX' country code correctly blocked
7. ResponsibleGambling renders when show=true, returns null when show=false
8. Translation keys `ResponsibleGambling.message` and `ResponsibleGambling.helpLink` exist in all locale files

## Artifacts

| File | Purpose | Exports |
|------|---------|---------|
| `src/lib/geo/types.ts` | GeoContext type definition | `GeoContext` |
| `src/lib/geo/compliance.ts` | Tier 1/Tier 2 country classification | `TIER_1_COUNTRIES`, `shouldShowBetting`, `getComplianceContext` |
| `src/proxy.ts` | Combined i18n + geo detection proxy | `proxy` (default), `config` |
| `src/components/odds/ResponsibleGambling.tsx` | 18+ responsible gambling footer banner | `ResponsibleGambling` |

## Next Phase Readiness

Plan 07-02 (odds display components) can now use `x-show-betting` header to conditionally render odds content. Plan 07-05 (integration/polish) can wire ResponsibleGambling into the page layout. The compliance config is ready to be consumed by any component or server action via `shouldShowBetting()` or `getComplianceContext()`.
