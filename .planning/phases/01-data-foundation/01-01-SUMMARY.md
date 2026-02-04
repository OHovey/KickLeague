---
phase: 01-data-foundation
plan: 01
subsystem: database
tags: [next.js, drizzle-orm, neon, postgresql, schema, typescript]

requires: []
provides:
  - Next.js 15 project with App Router and TypeScript
  - Complete Drizzle ORM schema (9 tables, 4 enums, 16 FKs, 13 indexes)
  - Neon HTTP driver connection module with typed db export
  - Drizzle Kit configuration for migration generation
  - Initial SQL migration file
affects:
  - 01-02 (API client needs db connection and schema types for validation)
  - 01-03 (seeding pipeline inserts into these tables)
  - All future phases (every phase queries this schema)

tech-stack:
  added:
    - next@16.1.6
    - drizzle-orm@0.45.1
    - drizzle-kit@0.31.8
    - "@neondatabase/serverless@1.0.2"
    - zod@4.3.6
    - drizzle-zod@0.8.3
    - limiter@3.0.0
    - dotenv@17.2.3
    - commander@14.0.3
    - chalk@5.6.2
    - tsx@4.21.0
  patterns:
    - "integer().generatedAlwaysAsIdentity() for all primary keys (not serial)"
    - "pgEnum for constrained value types (match_status, event_type, zone_type, tiebreaker_method)"
    - "Normalized child tables for fixture events and stats (not JSON blobs)"
    - "Zone definitions as data rows in league_zones table (not hardcoded)"
    - "Tiebreaker configuration as comma-separated string in league_config"
    - "apiId unique column on every API-Football entity table for idempotent upserts"
    - "Named Drizzle relations for disambiguation (homeTeam/awayTeam on fixtures)"

key-files:
  created:
    - drizzle.config.ts
    - src/db/connection.ts
    - src/db/schema/enums.ts
    - src/db/schema/leagues.ts
    - src/db/schema/teams.ts
    - src/db/schema/players.ts
    - src/db/schema/fixtures.ts
    - src/db/schema/standings.ts
    - src/db/schema/relations.ts
    - src/db/schema/index.ts
    - .env.example
    - drizzle/0000_worthless_matthew_murdock.sql
  modified:
    - package.json
    - .gitignore

key-decisions:
  - "Zone definitions modelled as position-range data rows in league_zones table -- simplest approach for Phase 2 rendering"
  - "Tiebreaker order stored as comma-separated string (not array column) for Drizzle compatibility"
  - "Home/away splits included in standings table to avoid JOIN overhead for team detail pages"
  - "Form stored as simple string (WWDLW) rather than array for display simplicity"

patterns-established:
  - "Schema file per domain entity: enums.ts, leagues.ts, teams.ts, players.ts, fixtures.ts, standings.ts, relations.ts, index.ts"
  - "Barrel export from src/db/schema/index.ts re-exports all schema modules"
  - "Connection via drizzle-orm/neon-http with schema parameter for typed queries"

duration: 6min
completed: 2026-02-04
---

# Phase 1 Plan 1: Project Scaffolding & Database Schema Summary

**Next.js 15 project with Drizzle ORM schema defining 9 PostgreSQL tables (leagues, teams, players, fixtures, events, stats, standings, league_config, league_zones) with identity PKs, normalized relations, and api_id unique constraints for idempotent API-Football upserts.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-04T19:51:13Z
- **Completed:** 2026-02-04T19:56:49Z
- **Tasks:** 2/2
- **Files created:** 12
- **Files modified:** 2

## Accomplishments

- Scaffolded Next.js 15 project with all Phase 1 dependencies (Drizzle ORM, Neon driver, Zod, limiter, commander, chalk, tsx)
- Created complete database schema with 9 tables, 4 pgEnum types, 16 foreign keys, and 13 indexes
- Generated initial SQL migration via drizzle-kit (verified 173 lines of valid DDL)
- All TypeScript schema files compile without errors
- Schema supports league-specific configurations (tiebreaker rules, zone definitions, team counts) as queryable data rows

## Task Commits

Each task was committed atomically:

1. **Task 1: Project scaffolding and dependency installation** - `274e70c` (feat)
2. **Task 2: Complete database schema with all tables, enums, and relations** - `943cbe7` (feat)

## Files Created/Modified

- `package.json` - Next.js 15 project with all Phase 1 dependencies
- `.gitignore` - Added .env, .env.local, .cache/ exclusions
- `.env.example` - Documents DATABASE_URL and API_FOOTBALL_KEY
- `drizzle.config.ts` - Drizzle Kit config pointing to schema directory with Neon credentials
- `src/db/connection.ts` - Drizzle + Neon HTTP driver connection with typed schema
- `src/db/schema/enums.ts` - 4 pgEnum definitions (match_status, event_type, tiebreaker_method, zone_type)
- `src/db/schema/leagues.ts` - leagues, league_config, league_zones tables
- `src/db/schema/teams.ts` - teams table with api_id unique, league FK
- `src/db/schema/players.ts` - players table with api_id unique, team FK
- `src/db/schema/fixtures.ts` - fixtures, fixture_events, fixture_stats normalized tables
- `src/db/schema/standings.ts` - standings table with per-matchweek data and home/away splits
- `src/db/schema/relations.ts` - All Drizzle relation declarations (leagues, teams, players, fixtures, standings)
- `src/db/schema/index.ts` - Barrel export of all schema modules
- `drizzle/0000_worthless_matthew_murdock.sql` - Initial SQL migration (9 tables, 4 enums)

## Decisions Made

1. **Zone definitions as position-range rows:** Modelled in `league_zones` table with startPosition/endPosition/color columns. Each zone type (champions_league, europa_league, relegation, etc.) is a row. Simplest approach for Phase 2 to query and render as position-range highlights.

2. **Tiebreaker order as comma-separated string:** Stored in `league_config.tiebreaker_order` as e.g. "head_to_head,goal_difference,goals_for". PostgreSQL array columns are supported by Drizzle but comma-separated is simpler to parse and more portable.

3. **Home/away splits in standings table:** Included homeWon/homeDrawn/homeLost/homeGoalsFor/homeGoalsAgainst and away equivalents directly in the standings table. Avoids JOIN overhead when rendering team detail performance tabs in Phase 4.

4. **Named relations for disambiguation:** Used Drizzle's `relationName` parameter for homeTeam/awayTeam on fixtures and eventPlayer/eventAssistPlayer on fixture events to avoid ambiguous relation resolution.

## Deviations from Plan

None -- plan executed exactly as written.

## Next Phase Readiness

**For Plan 01-02 (API-Football Client):**
- Schema types are available via barrel export for Zod schema generation with drizzle-zod
- All api_id columns have unique constraints ready for upsert conflict targets
- Connection module exports typed `db` instance ready for query operations

**For Plan 01-03 (Data Seeding):**
- All tables ready to receive seeded data
- league_config and league_zones tables ready for per-league configuration rows
- standings table supports per-matchweek snapshots for historical timeline (Phase 5)

**User setup required:** Neon database must be provisioned and DATABASE_URL configured before Plan 01-03 can seed data. See `01-USER-SETUP.md`.
