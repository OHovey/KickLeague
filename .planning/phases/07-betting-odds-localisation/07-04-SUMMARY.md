---
phase: 07-betting-odds-localisation
plan: 04
subsystem: i18n
tags: [next-intl, i18n, localisation, routing, proxy, language-picker]
dependency-graph:
  requires: []
  provides: [locale-routing, translation-messages, language-picker, locale-aware-navigation]
  affects: [07-02, 07-03, 07-05]
tech-stack:
  added: [next-intl]
  patterns: [locale-segment-routing, proxy-middleware-locale-negotiation, locale-aware-link-components]
key-files:
  created:
    - src/i18n/routing.ts
    - src/i18n/request.ts
    - src/i18n/navigation.ts
    - src/proxy.ts
    - src/messages/en.json
    - src/messages/es.json
    - src/messages/de.json
    - src/messages/it.json
    - src/messages/fr.json
    - src/app/[locale]/layout.tsx
    - src/app/[locale]/page.tsx
    - src/app/[locale]/matches/page.tsx
    - src/app/[locale]/matches/[id]/page.tsx
    - src/app/[locale]/teams/[slug]/page.tsx
    - src/components/i18n/LanguagePicker.tsx
  modified:
    - next.config.ts
    - package.json
    - src/app/layout.tsx
    - src/components/header/Header.tsx
    - src/components/matches/MatchPreviewSection.tsx
    - src/components/matches/MatchCard.tsx
    - src/components/league-table/AnimatedTableRow.tsx
    - src/components/league-table/TableRow.tsx
    - src/components/team-detail/FixturesTab.tsx
    - src/components/match-detail/ScoreHero.tsx
decisions:
  - Root layout.tsx simplified to pass-through shell; real layout with providers lives in [locale]/layout.tsx
  - All component Link/useRouter imports migrated from next/link to @/i18n/navigation for locale-aware routing
  - proxy.ts uses NextRequest type (not plain Request) for next-intl middleware compatibility
  - Translation files use ASCII-safe text (no special characters) for cross-platform compatibility
metrics:
  duration: 5 min
  completed: 2026-02-05
---

# Phase 7 Plan 04: next-intl i18n Setup Summary

**One-liner:** next-intl i18n with 5-locale routing, proxy-based locale negotiation, 80-key translation files, app restructure under [locale], and header language picker.

## What Was Done

### Task 1: next-intl Configuration, Proxy, and Message Files
- Installed `next-intl` package
- Created `src/i18n/routing.ts` with 5 locales (en, es, de, it, fr) and `en` as default
- Created `src/i18n/request.ts` with `getRequestConfig` for server-side locale resolution and dynamic message loading
- Created `src/i18n/navigation.ts` exporting locale-aware `Link`, `redirect`, `usePathname`, `useRouter`, `getPathname`
- Created `src/proxy.ts` with `createMiddleware(routing)` for locale negotiation; matcher excludes `/api/*`, `/_next/*`, static files
- Updated `next.config.ts` with `createNextIntlPlugin()` wrapper
- Created 5 translation message files (80 keys each) covering: Common, Navigation, LeagueTable, Matches, Teams, Timeline, Odds, Formats, ResponsibleGambling, Footer

### Task 2: App Directory Restructure and Language Picker
- Created `src/app/[locale]/layout.tsx` with `NextIntlClientProvider`, Geist fonts, `NuqsAdapter`, `generateStaticParams`, locale validation, and `setRequestLocale`
- Moved all pages under `[locale]` segment: home, matches, match detail, team detail
- Updated server component pages to accept `locale` in params and call `setRequestLocale`
- Simplified root `src/app/layout.tsx` to a minimal pass-through shell (returns `children` directly)
- Created `src/components/i18n/LanguagePicker.tsx` with dropdown showing 5 locales with display names
- Updated `Header.tsx` to use `LanguagePicker` and locale-aware `Link`/`usePathname` from `@/i18n/navigation`
- Updated 6 components (`MatchPreviewSection`, `AnimatedTableRow`, `MatchCard`, `TableRow`, `FixturesTab`, `ScoreHero`) to use locale-aware `Link` and `useRouter` from `@/i18n/navigation`
- Removed old page files from non-locale paths
- API routes (`/api/cron/*`, `/api/updates/*`) remain unaffected at their original paths

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] proxy.ts Request type mismatch**
- **Found during:** Task 1 verification
- **Issue:** `createMiddleware` expects `NextRequest`, not plain `Request`
- **Fix:** Changed proxy function parameter type from `Request` to `NextRequest` with import from `next/server`
- **Files modified:** `src/proxy.ts`
- **Commit:** ae604f2

**2. [Rule 3 - Blocking] Component Link imports not locale-aware**
- **Found during:** Task 2
- **Issue:** 6 components used `Link` from `next/link` and `useRouter` from `next/navigation`, which would generate non-locale-prefixed URLs (e.g., `/matches/123` instead of `/en/matches/123`)
- **Fix:** Updated all component imports to use `Link`, `useRouter`, `usePathname` from `@/i18n/navigation`
- **Files modified:** `MatchPreviewSection.tsx`, `AnimatedTableRow.tsx`, `MatchCard.tsx`, `TableRow.tsx`, `FixturesTab.tsx`, `ScoreHero.tsx`
- **Commit:** 8f92dab

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Root layout as pass-through shell | next-intl pattern: [locale]/layout.tsx owns html/body/providers; root layout just returns children |
| All Link imports migrated to @/i18n/navigation | Ensures every internal link respects current locale prefix in URL |
| proxy.ts uses NextRequest type | Required by next-intl createMiddleware; plain Request lacks cookies/nextUrl properties |
| ASCII-safe translations | Avoids encoding issues across different systems and editors |

## Verification

- `npx tsc --noEmit` passes with zero errors
- `npm run build` succeeds: 14 static pages generated across 5 locales
- Build output confirms locale-prefixed routes: `/en`, `/es/matches`, `/de`, etc.
- API routes (`/api/cron/daily-resync`, `/api/cron/poll-matches`, `/api/updates/check`) remain at original paths
- Proxy middleware active for locale negotiation
- All 5 message files have identical 80-key structures

## Commits

| Hash | Message |
|------|---------|
| ae604f2 | feat(07-04): next-intl configuration, proxy.ts, and translation files |
| 8f92dab | feat(07-04): restructure app under [locale] segment with language picker |

## Next Phase Readiness

Plan 07-04 provides the i18n infrastructure that plans 07-02, 07-03, and 07-05 can build upon:
- **07-02** (Odds ingestion pipeline): Can use locale context from proxy headers for geo-compliance
- **07-03** (Odds UI components): Can use translation keys from `Odds.*` namespace
- **07-05** (Integration and verification): i18n routing is in place for full integration testing
