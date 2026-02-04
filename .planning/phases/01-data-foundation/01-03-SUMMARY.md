---
phase: 01-data-foundation
plan: 03
subsystem: data-pipeline
tags: [seed, cli, upsert, api-football, drizzle, commander]

dependency-graph:
  requires: ["01-01", "01-02"]
  provides: ["seed-pipeline", "cli-seed-command", "idempotent-upserts"]
  affects: ["02-standings-api", "06-live-pipeline"]

tech-stack:
  added: []
  patterns: ["upsert-with-buildConflictUpdateColumns", "two-phase-fixture-seed", "batch-api-calls-chunk-20", "cli-entrypoint-commander"]

file-tracking:
  key-files:
    created:
      - src/lib/seed/utils.ts
      - src/lib/seed/seed-leagues.ts
      - src/lib/seed/seed-teams.ts
      - src/lib/seed/seed-players.ts
      - src/lib/seed/seed-fixtures.ts
      - src/lib/seed/seed-standings.ts
      - src/lib/seed/index.ts
    modified:
      - package.json

decisions:
  - id: "01-03-01"
    description: "League zones use delete-then-insert per league+season rather than individual upserts (no single-zone unique constraint)"
  - id: "01-03-02"
    description: "Fixture events use delete-then-insert per fixture for idempotent re-runs (no composite unique on events)"
  - id: "01-03-03"
    description: "Points deduction auto-detected by comparing actual points vs expected (won*3 + drawn)"
  - id: "01-03-04"
    description: "Refresh mode still re-fetches teams for ID map but skips player seeding"

metrics:
  duration: "5 min"
  completed: "2026-02-04"
---

# Phase 1 Plan 3: Data Seeding Pipeline Summary

**Idempotent CLI seed pipeline connecting schema and API client into a working data population tool.**

## What Was Built

### Utility Module (src/lib/seed/utils.ts)
- `buildConflictUpdateColumns(table, columns)` -- Drizzle upsert helper that maps column names to `excluded.{col}` SQL references using `getTableColumns`
- `chunk(array, size)` -- splits arrays into batches (used for 20-ID fixture detail calls)
- `formatProgress(current, total, label)` -- human-readable progress like `[15/96] Seeding teams...`
- `delay(ms)` -- sleep helper for rate-limit display

### League Seeder (src/lib/seed/seed-leagues.ts)
- Fetches league data from `/leagues?id={id}` for all 5 Big European leagues
- Upserts `leagues` table using `apiId` as conflict target
- Upserts `league_config` per season with hardcoded tiebreaker orders:
  - PL/Bundesliga: goal_difference, goals_for, head_to_head
  - La Liga/Serie A: head_to_head, goal_difference, goals_for
  - Ligue 1: goal_difference, goals_for, head_to_head
- Upserts `league_zones` per season with complete zone specifications for all 5 leagues
- Derives matchweeksTotal from teamCount: (teamCount - 1) * 2

### Team Seeder (src/lib/seed/seed-teams.ts)
- Fetches from `/teams?league={id}&season={year}`
- Generates URL-safe slugs from team names
- Returns `Map<apiId, dbId>` for downstream seeders

### Player Seeder (src/lib/seed/seed-players.ts)
- Fetches squads from `/players/squads?team={id}` per team
- Maps API positions (Goalkeeper/Defender/Midfielder/Attacker) to short codes (GK/DEF/MID/FWD)
- Splits full names into first/last for search support

### Fixture Seeder (src/lib/seed/seed-fixtures.ts)
- **Phase A**: Single API call `/fixtures?league={id}&season={year}` for all basic fixture data
- **Phase B**: Batch detail calls `/fixtures?ids={comma-separated}` in chunks of 20
- Maps API-Football status short codes (FT, NS, HT, etc.) to our match_status enum
- Extracts matchweek numbers from round strings like "Regular Season - 23"
- Maps event types: Goal -> goal/own_goal/penalty_scored, Card -> yellow_card/red_card, Subst -> substitution, VAR -> var
- Parses statistics from string format: "Ball Possession" -> possession, "67%" -> 67.0, "expected_goals" -> xg

### Standings Seeder (src/lib/seed/seed-standings.ts)
- Fetches current standings snapshot from `/standings?league={id}&season={year}`
- Determines matchweek from max played games across all teams
- Auto-detects points deductions by comparing actual vs expected points
- Maps home/away splits directly from API response

### CLI Entrypoint (src/lib/seed/index.ts)
- Commander CLI with flags: `--all`, `--league <slug>`, `--refresh`, `--season <year>`, `--no-cache`
- Validates DATABASE_URL and API_FOOTBALL_KEY before starting
- Orchestrates seed order: leagues -> teams -> players -> fixtures -> standings
- Per-league error isolation: failures skip to next league
- Quota exhaustion detection with human-readable resume guidance
- Summary printer with per-league-season breakdown and totals

### Package.json
- Added `"seed": "tsx src/lib/seed/index.ts"` script
- Enables: `npm run seed -- --all` or `npm run seed -- --league premier-league`

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **League zones: delete+insert vs upsert** -- Zone rows lack a single-row unique constraint (zones span ranges), so we delete all zones for a league+season then re-insert. Simpler and guarantees spec changes propagate.

2. **Fixture events: delete+insert per fixture** -- Events have no composite unique constraint (same type, minute, team is possible for double yellows etc.), so we delete existing events per fixture before re-inserting on detail fetch.

3. **Points deduction auto-detection** -- Rather than requiring manual input, deductions are detected by comparing `actual_points < won*3 + drawn*1`. This catches known deductions (e.g., Everton) without API support.

4. **Refresh mode re-fetches teams** -- Even in refresh mode, teams are re-seeded (from cache) to build the apiId->dbId map needed by fixtures and standings. Players are skipped since squad changes are rare mid-season.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| b1854b6 | feat | Upsert utilities and individual seed modules |
| b9e461f | feat | Seed CLI entrypoint and package.json script |

## Next Phase Readiness

Phase 1 is now complete. The database schema, API client, and seed pipeline form a working data foundation. Phase 2 (Standings API + Server Components) can begin immediately.

**Prerequisites for running the seed:**
- DATABASE_URL must point to a provisioned Neon Postgres instance
- API_FOOTBALL_KEY must be set (free tier: 100 req/day)
- Run `npx drizzle-kit push` to apply schema before first seed
