---
phase: 25-head-to-head-pages
plan: 01
subsystem: ui, api, database
tags: [h2h, head-to-head, next.js, server-actions, raw-sql, i18n, isr]

# Dependency graph
requires:
  - phase: 04-team-detail-pages
    provides: getTeamBySlug query pattern, team schema
  - phase: 13-i18n-completeness
    provides: next-intl routing, locale files structure
  - phase: 14-seo-foundation
    provides: sitemap-queries pattern, structured-data builders
provides:
  - H2H data queries (getH2HMeetings, getH2HAggregateRecord, getTeamFormAndPosition, getQualifyingH2HPairs)
  - fetchH2HPageData server action with smart matchup slug parsing
  - /h2h/[matchup] page with aggregate record, form comparison, meeting history
  - H2HPage and Metadata h2h i18n keys in 5 locales
affects: [25-02 h2h sitemap, seo]

# Tech tracking
tech-stack:
  added: []
  patterns: [LEAST/GREATEST SQL for canonical pair dedup, smart slug parsing with DB lookup]

key-files:
  created:
    - src/lib/h2h/queries.ts
    - src/components/h2h-page/actions.ts
    - src/app/[locale]/h2h/[matchup]/page.tsx
  modified:
    - src/i18n/routing.ts
    - src/messages/en.json
    - src/messages/es.json
    - src/messages/de.json
    - src/messages/it.json
    - src/messages/fr.json

key-decisions:
  - "Smart matchup slug parsing: query all team slugs from DB and find valid -vs- split position (handles hyphenated team names like manchester-united)"
  - "LEAST/GREATEST SQL for qualifying pairs ensures canonical dedup regardless of home/away order"
  - "Inline FormBadgesInline for server-rendered form display (no client boundary needed)"
  - "No path localization for /h2h/ prefix (h2h is universally understood in football)"

patterns-established:
  - "H2H matchup slug format: {alphabetically-first-slug}-vs-{second-slug}"
  - "Smart slug parsing pattern: DB lookup of all valid slugs to disambiguate hyphenated names"

# Metrics
duration: 6min
completed: 2026-02-12
---

# Phase 25 Plan 01: H2H Page Data Layer and UI Summary

**Head-to-head comparison pages at /h2h/[matchup] with aggregate record, form comparison, meeting history, and 5-locale i18n -- 3165+ pages generated from qualifying team pairs**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-12T22:26:16Z
- **Completed:** 2026-02-12T22:32:20Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- H2H data layer with 4 query functions and smart matchup slug parser
- Full page UI with aggregate record card, most recent meeting, form comparison with W/D/L badges, and chronological meeting list
- 3165+ static H2H pages generated at build time with ISR revalidation
- Complete i18n coverage across all 5 locales (en/es/de/it/fr) including H2HPage namespace and Metadata keys

## Task Commits

Each task was committed atomically:

1. **Task 1: Create H2H data queries and server action** - `a8bf676` (feat)
2. **Task 2: Create H2H page with routing, UI, and i18n keys** - `f3b20ee` (feat)

## Files Created/Modified
- `src/lib/h2h/queries.ts` - H2H data queries: meetings, aggregate record, form/position, qualifying pairs
- `src/components/h2h-page/actions.ts` - Server action combining all queries with slug parsing and localization
- `src/app/[locale]/h2h/[matchup]/page.tsx` - H2H page with aggregate record, form comparison, meeting list
- `src/i18n/routing.ts` - Added /h2h/[matchup] pathname
- `src/messages/en.json` - H2HPage namespace + Metadata h2h keys (English)
- `src/messages/es.json` - H2HPage namespace + Metadata h2h keys (Spanish)
- `src/messages/de.json` - H2HPage namespace + Metadata h2h keys (German)
- `src/messages/it.json` - H2HPage namespace + Metadata h2h keys (Italian)
- `src/messages/fr.json` - H2HPage namespace + Metadata h2h keys (French)

## Decisions Made
- Smart matchup slug parsing queries all team slugs from DB to find the valid split position, handling hyphenated team names like "manchester-united-vs-manchester-city"
- LEAST/GREATEST SQL for qualifying pairs ensures canonical deduplication regardless of home/away order
- Inline FormBadgesInline component for server-rendered form display (avoids unnecessary client boundary)
- No path localization for /h2h/ prefix since "h2h" is universally understood in football context
- Thin content guard at 3 meetings minimum to avoid low-value SEO pages

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- H2H pages fully functional with data layer, UI, and i18n
- Ready for 25-02 (H2H sitemap registration) to add pages to sitemap index
- getQualifyingH2HPairs already exported for sitemap use

---
*Phase: 25-head-to-head-pages*
*Completed: 2026-02-12*
