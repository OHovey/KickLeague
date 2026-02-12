---
phase: 24-player-pages
plan: 01
subsystem: ui, database, api
tags: [player-pages, seo, i18n, drizzle, raw-sql, next-intl, isr]

# Dependency graph
requires:
  - phase: 23-stat-leaderboards
    provides: "Leaderboard queries pattern, raw SQL via db.execute, appearances approximation"
provides:
  - "Player profile pages at /players/[slug] with bio, stats, recent matches"
  - "Player slug column with unique index on players table"
  - "Player data queries: getPlayerBySlug, getPlayerSeasonStats, getPlayerRecentMatches, getQualifyingPlayerSlugs"
  - "fetchPlayerPageData server action with locale-aware team names"
  - "5+ appearances thin content guard for SEO"
  - "PlayerPage i18n namespace in 5 locales"
  - "Localized routing: /players/, /jugadores/, /spieler/, /giocatori/, /joueurs/"
affects: [24-02-player-sitemap, seo, sitemap]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Player slug generation from name with api_id suffix for uniqueness"
    - "Thin content guard: returning null/404 for players with < 5 appearances"
    - "Server-rendered player pages with ISR (30 min)"

key-files:
  created:
    - src/lib/players/queries.ts
    - src/components/player-page/actions.ts
    - src/app/[locale]/players/[slug]/page.tsx
    - drizzle/0005_blushing_sheva_callister.sql
    - scripts/migrate-player-slugs.ts
  modified:
    - src/db/schema/players.ts
    - src/i18n/routing.ts
    - src/messages/en.json
    - src/messages/es.json
    - src/messages/de.json
    - src/messages/it.json
    - src/messages/fr.json
    - src/lib/seed/seed-players.ts

key-decisions:
  - "Slug includes api_id suffix in seed to guarantee uniqueness without collision handling"
  - "Migration backfill uses LOWER-first ordering to preserve letters correctly"
  - "Types not re-exported from 'use server' modules (Next.js 16 Turbopack limitation)"
  - "Appearances approximated as distinct fixtures with events (same as leaderboard pattern)"
  - "Local PlayerPageData interface in page.tsx rather than importing from server action"

patterns-established:
  - "Player slug pattern: lowercase-name-with-hyphens-apiId for seed, lowercase-name-with-hyphens for migration backfill"
  - "Thin content guard: query returns null if appearances < 5, page returns notFound()"

# Metrics
duration: 10min
completed: 2026-02-12
---

# Phase 24 Plan 01: Player Pages Summary

**Player profile pages at /players/[slug] with photo, position badge, season stats cards, and recent match involvement with event badges, gated by 5+ appearances for thin content prevention**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-12T21:28:40Z
- **Completed:** 2026-02-12T21:39:09Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- Player slug column added to players table with unique index and migration backfill for 3,567 existing players
- Full player profile page with hero section (photo, position badge, team/league info), season stats cards (goals, assists, cards, appearances), and recent matches list with event badges
- 5+ appearances thin content guard preventing low-activity player pages from being indexed
- All 5 locale files have complete PlayerPage translations with football-accurate terminology
- Route registered with localized paths in 5 languages (players/jugadores/spieler/giocatori/joueurs)
- Build generates 8,972+ static player pages via ISR

## Task Commits

Each task was committed atomically:

1. **Task 1: Add player slug column, migration, and create player data queries** - `1a34ea1` (feat)
2. **Task 2: Create player page with routing, UI, and i18n keys** - `1af628a` (feat)

## Files Created/Modified

- `src/db/schema/players.ts` - Added slug column with unique index
- `drizzle/0005_blushing_sheva_callister.sql` - Migration: add slug, backfill, unique constraint
- `scripts/migrate-player-slugs.ts` - One-time migration script for existing data
- `src/lib/players/queries.ts` - getPlayerBySlug, getPlayerSeasonStats, getPlayerRecentMatches, getQualifyingPlayerSlugs
- `src/components/player-page/actions.ts` - fetchPlayerPageData server action
- `src/app/[locale]/players/[slug]/page.tsx` - Player profile page with full UI
- `src/i18n/routing.ts` - Added /players/[slug] with localized paths
- `src/messages/{en,es,de,it,fr}.json` - PlayerPage namespace and Metadata player keys
- `src/lib/seed/seed-players.ts` - Added slug generation for new player seeding

## Decisions Made

- **Slug includes api_id suffix in seed**: Guarantees uniqueness without needing collision detection logic. Migration backfill uses name-only slugs with api_id appended only for duplicates.
- **LOWER-first ordering in migration**: Initial migration had REGEXP_REPLACE before LOWER, stripping uppercase letters. Fixed to LOWER -> REPLACE -> REGEXP_REPLACE.
- **Types not re-exported from 'use server' modules**: Next.js 16 Turbopack treats 'use server' modules as action-only exports. TypeScript type re-exports are stripped at build time. Solution: import types directly from queries.ts in consumer pages.
- **Local PlayerPageData interface**: Defined in page.tsx rather than shared, avoiding server action export limitations.
- **Appearances approximation**: Same pattern as leaderboard queries -- distinct fixtures with events, consistent project-wide.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed migration slug generation order**
- **Found during:** Task 1 (migration backfill)
- **Issue:** Initial migration SQL had `LOWER(REGEXP_REPLACE(REPLACE(name, ...)))` which stripped uppercase letters before lowercasing them, resulting in truncated slugs like 'a-bayndr' instead of 'a-bayndr'
- **Fix:** Changed to `REGEXP_REPLACE(REPLACE(LOWER(name), ...), ...)` -- LOWER first, then replace spaces, then strip
- **Files modified:** drizzle/0005_blushing_sheva_callister.sql, scripts/migrate-player-slugs.ts
- **Verification:** Sample slugs verified correct (e.g., 't-heaton', 'diogo-dalot')
- **Committed in:** 1a34ea1 (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed seed script to include slug field**
- **Found during:** Task 1 (TypeScript compilation)
- **Issue:** Adding NOT NULL slug to schema caused seed script to fail tsc -- missing required field in insert
- **Fix:** Added generateSlug() function to seed script, includes api_id for guaranteed uniqueness
- **Files modified:** src/lib/seed/seed-players.ts
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 1a34ea1 (Task 1 commit)

**3. [Rule 3 - Blocking] Fixed type re-exports from 'use server' module**
- **Found during:** Task 2 (build)
- **Issue:** Next.js 16 Turbopack strips TypeScript type re-exports from 'use server' modules, causing build error "Export PlayerProfile doesn't exist in target module"
- **Fix:** Removed type re-exports from actions.ts, imported types directly from queries.ts in page.tsx
- **Files modified:** src/components/player-page/actions.ts, src/app/[locale]/players/[slug]/page.tsx
- **Verification:** `npm run build` succeeds, 8972+ player pages generated
- **Committed in:** 1af628a (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All fixes necessary for correct data and successful build. No scope creep.

## Issues Encountered

- drizzle-kit push interactive prompt blocked automated migration -- used direct SQL via @neondatabase/serverless instead
- Unique index had to be dropped and recreated during backfill to allow temporary duplicate slugs during the update

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Player pages are live and generating via ISR
- getQualifyingPlayerSlugs() ready for sitemap integration in 24-02
- Route registered in i18n routing for locale switching
- ~1,794 qualifying players across 5 leagues (8,972 paths across 5 locales)

---
*Phase: 24-player-pages*
*Completed: 2026-02-12*
