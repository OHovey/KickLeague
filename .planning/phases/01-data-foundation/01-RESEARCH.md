# Phase 1: Data Foundation - Research

**Researched:** 2026-02-04
**Domain:** PostgreSQL schema design, API-Football integration, data seeding pipeline
**Confidence:** HIGH

## Summary

This phase builds the entire data layer for KickLeague: a PostgreSQL database (Neon serverless), an API-Football client with rate limiting and Zod validation, a local file-cache proxy for development, and a seeding pipeline for all 5 Big European leagues across 2 seasons (2024/25 and 2025/26).

The standard stack for this domain is Drizzle ORM (TypeScript-first, SQL-like API, built-in migration tooling) with Neon's serverless HTTP driver, Zod for runtime API response validation (with `drizzle-zod` bridging DB schemas and validation), the `limiter` npm package for token-bucket rate limiting, and a custom file-system cache proxy using Node.js `fs` with TTL-based invalidation.

The critical constraint is API-Football's free tier: 100 requests/day, 10 requests/minute. A full seed of 5 leagues x 2 seasons with detailed fixture data requires approximately 420-620 API calls. The file-cache proxy is essential -- it ensures the first complete seed caches all responses to disk so subsequent runs consume zero API quota. Seeding must be designed to be resumable and to work within the daily limit across multiple days if needed.

**Primary recommendation:** Use Drizzle ORM with Neon HTTP driver, design the schema with typed `league_config` table and `pgEnum` types, build a thin API-Football wrapper class with integrated rate limiting and file-cache proxy, and implement seeding as a CLI script (`tsx`) with per-league and resumable support.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | 0.36+ | PostgreSQL ORM with type-safe queries | TypeScript-first, SQL-like API, built-in relations, official Neon support |
| drizzle-kit | latest | Schema migrations and DB tooling | Official companion to drizzle-orm, handles generate/push/migrate |
| @neondatabase/serverless | latest | Neon PostgreSQL serverless driver | HTTP driver for Vercel/serverless, official Neon package |
| zod | 3.25+ | Runtime API response validation | TypeScript-first schema validation, inferred types, industry standard |
| drizzle-zod | latest | Generate Zod schemas from Drizzle tables | Bridges DB schema and validation, createInsertSchema/createSelectSchema |
| limiter | latest | Token bucket rate limiting | Built-in TypeScript types, simple await-based API, battle-tested |
| tsx | latest | Run TypeScript CLI scripts | Execute seed scripts without build step, fast startup |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| dotenv | latest | Environment variable loading | Loading DATABASE_URL, API keys from .env |
| commander | latest | CLI argument parsing | Seed command flags (--league, --all, --refresh) |
| chalk | latest | Terminal output coloring | Seed progress display, rate limit warnings |
| file-system-cache | 3.x | File-based caching utility | Alternative to hand-rolled fs cache (evaluate) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Drizzle ORM | Prisma | Prisma has better DX for beginners but heavier runtime, slower cold starts on serverless, less SQL-like API |
| limiter | p-ratelimit | p-ratelimit supports concurrency limits too, but limiter is simpler for single-client rate limiting |
| tsx | ts-node | tsx is faster (uses esbuild), no config needed, better for scripts |
| Hand-rolled file cache | file-system-cache npm | Hand-rolled gives more control over TTL and key hashing; npm package adds convenience |

**Installation:**
```bash
npm install drizzle-orm @neondatabase/serverless zod drizzle-zod limiter dotenv commander chalk
npm install -D drizzle-kit tsx @types/node typescript
```

## Architecture Patterns

### Recommended Project Structure

```
src/
  db/
    schema/
      leagues.ts           # leagues, league_config tables
      teams.ts             # teams table
      players.ts           # players table
      fixtures.ts          # fixtures, fixture_events, fixture_stats tables
      standings.ts         # standings table
      enums.ts             # shared pgEnum definitions
      relations.ts         # all Drizzle relation declarations
      index.ts             # barrel export of all schemas
    connection.ts          # Drizzle + Neon HTTP driver setup
    migrate.ts             # Migration runner
  lib/
    api-football/
      client.ts            # Core API client with rate limiter + cache
      types.ts             # Zod schemas for API-Football responses
      endpoints.ts         # Endpoint definitions and parameter types
      cache-proxy.ts       # File-system cache proxy layer
      rate-limiter.ts      # Rate limiter configuration
    seed/
      index.ts             # Main seed entrypoint (CLI)
      seed-leagues.ts      # League + config seeding
      seed-teams.ts        # Team seeding
      seed-players.ts      # Player seeding
      seed-fixtures.ts     # Fixture + events + stats seeding
      seed-standings.ts    # Standings seeding
      utils.ts             # Shared seeding utilities (upsert helpers)
drizzle/                   # Generated migration SQL files
drizzle.config.ts          # Drizzle Kit configuration
.cache/                    # Local file cache directory (gitignored)
```

### Pattern 1: Layered API Client with Cache Proxy

**What:** Wrap API-Football calls in a client class that chains: cache check -> rate limiter -> HTTP fetch -> Zod validation -> cache write.

**When to use:** Every API-Football call, both in seeding and future live data fetching.

**Example:**
```typescript
// src/lib/api-football/client.ts
import { RateLimiter } from 'limiter';
import { z } from 'zod';
import { CacheProxy } from './cache-proxy';

export class ApiFootballClient {
  private rateLimiter: RateLimiter;
  private cache: CacheProxy;
  private baseUrl = 'https://v3.football.api-sports.io';
  private dailyRemaining: number = 100;

  constructor(apiKey: string, options?: { cacheDir?: string; cacheTtlMs?: number }) {
    // 10 requests/minute on free tier
    this.rateLimiter = new RateLimiter({
      tokensPerInterval: 10,
      interval: 'minute',
    });
    this.cache = new CacheProxy(
      options?.cacheDir ?? '.cache/api-football',
      options?.cacheTtlMs ?? 24 * 60 * 60 * 1000 // 24 hours default TTL
    );
  }

  async get<T>(endpoint: string, params: Record<string, string>, schema: z.ZodSchema<T>): Promise<T> {
    const cacheKey = this.buildCacheKey(endpoint, params);

    // 1. Check cache
    const cached = await this.cache.get(cacheKey);
    if (cached) return schema.parse(JSON.parse(cached));

    // 2. Rate limit
    const remaining = await this.rateLimiter.removeTokens(1);
    if (remaining < 0) {
      console.log('Rate limited, waiting...');
    }

    // 3. Fetch
    const url = new URL(endpoint, this.baseUrl);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const response = await fetch(url.toString(), {
      headers: { 'x-apisports-key': this.apiKey },
    });

    // 4. Track daily quota from response headers
    this.dailyRemaining = parseInt(
      response.headers.get('x-ratelimit-requests-remaining') ?? '100'
    );

    const json = await response.json();

    // 5. Validate with Zod (partial accept pattern)
    const result = schema.safeParse(json);
    if (!result.success) {
      console.warn(`Validation warning for ${endpoint}:`, result.error.issues);
      // Attempt partial parse or return raw with warning
    }

    // 6. Cache the raw response
    await this.cache.set(cacheKey, JSON.stringify(json));

    return result.success ? result.data : json;
  }
}
```

### Pattern 2: Typed Schema with pgEnum and League Config Table

**What:** Use `pgEnum` for constrained values (match status, event types, tiebreaker methods) and a dedicated `league_config` table with typed columns instead of JSONB.

**When to use:** Schema definition for all league-specific configuration.

**Example:**
```typescript
// src/db/schema/enums.ts
import { pgEnum } from 'drizzle-orm/pg-core';

export const matchStatusEnum = pgEnum('match_status', [
  'scheduled', 'live', 'finished', 'postponed', 'cancelled',
  'first_half', 'halftime', 'second_half', 'extra_time', 'penalties'
]);

export const eventTypeEnum = pgEnum('event_type', [
  'goal', 'own_goal', 'penalty_scored', 'penalty_missed',
  'yellow_card', 'red_card', 'substitution', 'var'
]);

export const tiebreakerMethodEnum = pgEnum('tiebreaker_method', [
  'goal_difference', 'goals_for', 'head_to_head', 'away_goals'
]);

export const zoneTypeEnum = pgEnum('zone_type', [
  'champions_league', 'champions_league_qualifying',
  'europa_league', 'conference_league',
  'relegation_playoff', 'relegation'
]);
```

### Pattern 3: Zone Definitions as Data Rows (Recommended)

**What:** Model zone definitions as rows in a `league_zones` table, each with a zone type, start position, end position, and display color. This is simpler than rule-based logic and directly maps to Phase 2's rendering needs.

**When to use:** Rendering zone highlights on league tables.

**Example:**
```typescript
// src/db/schema/leagues.ts
export const leagueZones = pgTable('league_zones', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  leagueId: integer('league_id').notNull().references(() => leagues.id),
  season: varchar('season', { length: 10 }).notNull(),
  zoneType: zoneTypeEnum('zone_type').notNull(),
  startPosition: integer('start_position').notNull(),
  endPosition: integer('end_position').notNull(),
  color: varchar('color', { length: 7 }).notNull(), // hex color
}, (table) => [
  uniqueIndex('league_zone_unique').on(
    table.leagueId, table.season, table.zoneType, table.startPosition
  ),
]);
```

**Zone data example (Premier League 2025/26):**
| zone_type | start | end | color |
|-----------|-------|-----|-------|
| champions_league | 1 | 4 | #22c55e |
| europa_league | 5 | 5 | #3b82f6 |
| conference_league | 6 | 6 | #93c5fd |
| relegation | 18 | 20 | #ef4444 |

This approach means the frontend simply queries zone rows for a league/season and applies position-range highlighting. No complex rule evaluation needed.

### Pattern 4: Upsert-Based Idempotent Seeding

**What:** Use Drizzle's `onConflictDoUpdate` for all seed operations so re-running is safe.

**When to use:** Every seed operation.

**Example:**
```typescript
// src/lib/seed/utils.ts
import { SQL, getTableColumns, sql } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

export function buildConflictUpdateColumns<
  T extends PgTable,
  Q extends keyof T['_']['columns']
>(table: T, columns: Q[]) {
  const cls = getTableColumns(table);
  return columns.reduce((acc, column) => {
    const colName = cls[column].name;
    acc[column] = sql.raw(`excluded.${colName}`);
    return acc;
  }, {} as Record<Q, SQL>);
}

// Usage in seed-teams.ts
await db.insert(teams)
  .values(teamData)
  .onConflictDoUpdate({
    target: teams.apiId,
    set: buildConflictUpdateColumns(teams, ['name', 'shortName', 'logoUrl', 'stadiumName']),
  });
```

### Anti-Patterns to Avoid

- **Storing events/stats as JSON blobs on the fixtures table:** Use separate normalized tables (`fixture_events`, `fixture_stats`) so data is queryable and indexable. The spec's original schema uses JSON columns for events/stats -- do NOT follow this.
- **Using serial columns for primary keys:** Use `integer().generatedAlwaysAsIdentity()` -- serial is deprecated in modern PostgreSQL best practices.
- **Hardcoding league zone definitions:** Store them as data rows, not in application code. Zones can change between seasons.
- **Making separate API calls for events and stats per fixture:** Use the batch `fixtures?ids=` endpoint (up to 20 IDs per call) which includes events, lineups, statistics, and player statistics all in one response.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rate limiting | Custom token bucket | `limiter` npm package | Edge cases in timing, async token removal, burst handling |
| Database migrations | Raw SQL files | `drizzle-kit generate` + `migrate` | Schema diffing, rollback support, version tracking |
| Zod schema from DB schema | Manual duplicate types | `drizzle-zod` createSelectSchema/createInsertSchema | Keeps types in sync automatically, reduces maintenance |
| CLI argument parsing | process.argv manual parsing | `commander` | Subcommands, help text, validation, type coercion |
| PostgreSQL connection pooling | Manual pool management | Neon serverless driver (HTTP) | Handles connection lifecycle in serverless, no pool needed |
| API response type definitions | Manual TypeScript interfaces | Zod schemas with `z.infer<>` | Single source of truth for both validation and types |

**Key insight:** The API-Football free tier (100 req/day) makes the file-cache proxy the most critical piece of infrastructure. Without it, development iteration is effectively blocked after a single seeding run. The cache proxy is simple enough to build custom (hash URL+params -> file on disk with TTL metadata), but it must be transparent to the client.

## Common Pitfalls

### Pitfall 1: Exhausting API Quota During Development
**What goes wrong:** Running the seed script multiple times during development burns through the daily 100-request quota in minutes.
**Why it happens:** No caching layer between the application and API-Football.
**How to avoid:** Build the file-cache proxy FIRST, before any seeding logic. Every API call must go through the cache. Cache files should be committed to `.gitignore` but persisted across runs.
**Warning signs:** `x-ratelimit-requests-remaining` header approaching 0; 429 errors from API.

### Pitfall 2: Batch Fixture Detail Calls Not Used
**What goes wrong:** Making one API call per fixture for events/stats = 380 calls per league per season = 3,800 calls for 5 leagues x 2 seasons.
**Why it happens:** Not knowing about the `fixtures?ids=` batch endpoint.
**How to avoid:** First call `fixtures?league={id}&season={year}` to get all fixture IDs with basic data. Then batch-fetch detailed data using `fixtures?ids={comma-separated-ids}` (max 20 IDs per call). This reduces 3,800 calls to approximately 190 calls.
**Warning signs:** Seed script taking many days to complete on free tier.

### Pitfall 3: Zod Parse vs SafeParse
**What goes wrong:** Using `schema.parse()` throws an exception on the first validation failure, aborting the entire seed for a single malformed field.
**Why it happens:** Default Zod behavior is strict -- parse throws, safeParse returns a result object.
**How to avoid:** Always use `safeParse()` for API responses. Log validation warnings but continue processing valid fields. This aligns with the "partial accept" decision from CONTEXT.md.
**Warning signs:** Seed script crashes with ZodError on specific leagues/fixtures where API data has slight schema variations.

### Pitfall 4: Not Tracking API-Football IDs Alongside Internal IDs
**What goes wrong:** No way to map API-Football entities back to the database for updates, causing duplicates on re-seed.
**Why it happens:** Using only auto-generated internal IDs without storing the API's foreign IDs.
**How to avoid:** Every table that maps to an API-Football entity must have an `api_id` column with a unique constraint. Use `api_id` as the upsert conflict target.
**Warning signs:** Duplicate teams, fixtures, or players after re-running seed.

### Pitfall 5: Neon Cold Starts and Connection Handling
**What goes wrong:** First database query after idle period takes 500ms+ due to Neon compute cold start.
**Why it happens:** Neon scales to zero when idle (free/hobby tier).
**How to avoid:** For seeding scripts (long-running), this is not an issue since the connection stays warm. For the API routes (Phase 2+), use Neon's HTTP driver which doesn't require persistent connections. Be aware of it but don't over-engineer.
**Warning signs:** Intermittent slow first queries in development.

### Pitfall 6: Coverage Gaps in API-Football Data
**What goes wrong:** Assuming all 5 leagues have identical data coverage (xG, player stats, detailed events).
**Why it happens:** API-Football's `coverage` field per league varies. Some leagues may lack xG or detailed statistics.
**How to avoid:** Fetch league coverage data first and store it in a `coverage_metadata` table. Seed scripts should check coverage before attempting to fetch specific data types. Null-out unavailable stats rather than erroring.
**Warning signs:** Validation errors concentrated on specific leagues (especially Ligue 1, lower-tier Serie A data).

## Code Examples

### Drizzle Schema: League Config Table (Typed Columns)

```typescript
// src/db/schema/leagues.ts
import { pgTable, integer, varchar, boolean, pgEnum, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { tiebreakerMethodEnum } from './enums';
import { relations } from 'drizzle-orm';

export const leagues = pgTable('leagues', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  apiId: integer('api_id').notNull().unique(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  country: varchar('country', { length: 50 }).notNull(),
  logoUrl: varchar('logo_url', { length: 500 }),
  currentSeason: varchar('current_season', { length: 10 }).notNull(),
});

export const leagueConfig = pgTable('league_config', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  leagueId: integer('league_id').notNull().references(() => leagues.id, { onDelete: 'cascade' }),
  season: varchar('season', { length: 10 }).notNull(),
  teamCount: integer('team_count').notNull(),
  tiebreakerOrder: varchar('tiebreaker_order', { length: 255 }).notNull(),
    // Stored as comma-separated enum values: "head_to_head,goal_difference,goals_for"
  matchweeksTotal: integer('matchweeks_total').notNull(),
  hasXg: boolean('has_xg').notNull().default(false),
  hasDetailedStats: boolean('has_detailed_stats').notNull().default(true),
  hasPlayerStats: boolean('has_player_stats').notNull().default(true),
}, (table) => [
  uniqueIndex('league_config_unique').on(table.leagueId, table.season),
]);

export const leagueZones = pgTable('league_zones', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  leagueId: integer('league_id').notNull().references(() => leagues.id, { onDelete: 'cascade' }),
  season: varchar('season', { length: 10 }).notNull(),
  zoneType: zoneTypeEnum('zone_type').notNull(),
  startPosition: integer('start_position').notNull(),
  endPosition: integer('end_position').notNull(),
  color: varchar('color', { length: 7 }).notNull(),
}, (table) => [
  index('league_zones_lookup').on(table.leagueId, table.season),
]);

// Relations
export const leaguesRelations = relations(leagues, ({ many }) => ({
  config: many(leagueConfig),
  zones: many(leagueZones),
  teams: many(teams),
}));
```

### Drizzle Schema: Fixtures with Normalized Events and Stats

```typescript
// src/db/schema/fixtures.ts
import { pgTable, integer, varchar, timestamp, real, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { matchStatusEnum, eventTypeEnum } from './enums';
import { leagues } from './leagues';
import { teams } from './teams';
import { players } from './players';
import { relations } from 'drizzle-orm';

export const fixtures = pgTable('fixtures', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  apiId: integer('api_id').notNull().unique(),
  leagueId: integer('league_id').notNull().references(() => leagues.id),
  season: varchar('season', { length: 10 }).notNull(),
  matchweek: integer('matchweek'),
  homeTeamId: integer('home_team_id').notNull().references(() => teams.id),
  awayTeamId: integer('away_team_id').notNull().references(() => teams.id),
  kickoff: timestamp('kickoff', { withTimezone: true }).notNull(),
  status: matchStatusEnum('status').notNull().default('scheduled'),
  homeScore: integer('home_score'),
  awayScore: integer('away_score'),
  referee: varchar('referee', { length: 100 }),
  venue: varchar('venue', { length: 200 }),
}, (table) => [
  index('fixtures_league_season').on(table.leagueId, table.season),
  index('fixtures_kickoff').on(table.kickoff),
  index('fixtures_status').on(table.status),
  index('fixtures_home_team').on(table.homeTeamId),
  index('fixtures_away_team').on(table.awayTeamId),
]);

export const fixtureEvents = pgTable('fixture_events', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  fixtureId: integer('fixture_id').notNull().references(() => fixtures.id, { onDelete: 'cascade' }),
  type: eventTypeEnum('type').notNull(),
  minute: integer('minute').notNull(),
  extraMinute: integer('extra_minute'),
  teamId: integer('team_id').notNull().references(() => teams.id),
  playerId: integer('player_id').references(() => players.id),
  assistPlayerId: integer('assist_player_id').references(() => players.id),
  detail: varchar('detail', { length: 100 }), // e.g., "Normal Goal", "Penalty", etc.
}, (table) => [
  index('fixture_events_fixture').on(table.fixtureId),
]);

export const fixtureStats = pgTable('fixture_stats', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  fixtureId: integer('fixture_id').notNull().references(() => fixtures.id, { onDelete: 'cascade' }),
  teamId: integer('team_id').notNull().references(() => teams.id),
  possession: real('possession'),
  shots: integer('shots'),
  shotsOnTarget: integer('shots_on_target'),
  corners: integer('corners'),
  fouls: integer('fouls'),
  offsides: integer('offsides'),
  yellowCards: integer('yellow_cards'),
  redCards: integer('red_cards'),
  xg: real('xg'),
}, (table) => [
  uniqueIndex('fixture_stats_unique').on(table.fixtureId, table.teamId),
]);
```

### File-Cache Proxy Implementation

```typescript
// src/lib/api-football/cache-proxy.ts
import { readFile, writeFile, mkdir, stat } from 'fs/promises';
import { createHash } from 'crypto';
import { join } from 'path';

interface CacheEntry {
  data: string;
  timestamp: number;
  ttlMs: number;
}

export class CacheProxy {
  constructor(
    private cacheDir: string,
    private defaultTtlMs: number = 24 * 60 * 60 * 1000
  ) {}

  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  private filePath(key: string): string {
    const hash = this.hashKey(key);
    // Use first 2 chars as subdirectory to avoid flat directory with thousands of files
    return join(this.cacheDir, hash.slice(0, 2), `${hash}.json`);
  }

  async get(key: string): Promise<string | null> {
    try {
      const path = this.filePath(key);
      const content = await readFile(path, 'utf-8');
      const entry: CacheEntry = JSON.parse(content);

      if (Date.now() - entry.timestamp > entry.ttlMs) {
        return null; // Expired
      }
      return entry.data;
    } catch {
      return null; // Cache miss
    }
  }

  async set(key: string, data: string, ttlMs?: number): Promise<void> {
    const path = this.filePath(key);
    const dir = join(path, '..');
    await mkdir(dir, { recursive: true });

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttlMs: ttlMs ?? this.defaultTtlMs,
    };
    await writeFile(path, JSON.stringify(entry));
  }
}
```

### Drizzle + Neon Connection Setup

```typescript
// src/db/connection.ts
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// For serverless (Next.js API routes, Vercel)
export const db = drizzle(process.env.DATABASE_URL!, { schema });

// For seed scripts (long-running), same driver works fine
// Neon HTTP driver doesn't need persistent connections
```

### Drizzle Config

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Seed CLI Entry Point

```typescript
// src/lib/seed/index.ts
import { Command } from 'commander';

const program = new Command();

program
  .name('seed')
  .description('Seed KickLeague database from API-Football')
  .option('--league <slug>', 'Seed a specific league (e.g., premier-league)')
  .option('--all', 'Seed all 5 leagues')
  .option('--refresh', 'Only fetch data newer than last seed')
  .option('--season <year>', 'Specific season year (e.g., 2025)', '2025')
  .option('--no-cache', 'Bypass file cache (uses API quota)')
  .action(async (options) => {
    // ... orchestrate seeding
  });

program.parse();
```

## API-Football Endpoint Reference

### League IDs (Verified)

| League | API ID | Season Format |
|--------|--------|---------------|
| Premier League | 39 | 2025 (for 2025/26 season) |
| La Liga | 140 | 2025 |
| Bundesliga | 78 | 2025 |
| Serie A | 135 | 2025 |
| Ligue 1 | 61 | 2025 |

### Key Endpoints for Seeding

| Endpoint | Parameters | Returns | Calls per League |
|----------|-----------|---------|-----------------|
| `GET /leagues` | `id={leagueId}` | League info + coverage | 1 total |
| `GET /teams` | `league={id}&season={year}` | All teams in league | 1 |
| `GET /standings` | `league={id}&season={year}` | Full league table | 1 |
| `GET /fixtures` | `league={id}&season={year}` | All fixtures (basic) | 1 |
| `GET /fixtures` | `ids={comma-separated}` (max 20) | Detailed fixture data with events, stats, lineups, player stats | ~19 (380/20) |
| `GET /players/squads` | `team={id}` | Current squad for team | 1 per team (~20) |
| `GET /players` | `league={id}&season={year}&page={n}` | Paginated player data with stats | ~35-40 pages |

### Rate Limit Headers

| Header | Scope | Description |
|--------|-------|-------------|
| `x-ratelimit-requests-limit` | Daily | Total daily requests allowed (100 on free tier) |
| `x-ratelimit-requests-remaining` | Daily | Remaining daily requests |
| `X-RateLimit-Limit` | Per Minute | Max per minute (10 on free tier) |
| `X-RateLimit-Remaining` | Per Minute | Remaining per minute |

### Seeding Budget Estimate (5 Leagues x 2 Seasons)

| Step | Calls | Cumulative |
|------|-------|------------|
| League info (all 5) | 5 | 5 |
| Teams (5 leagues x 2 seasons) | 10 | 15 |
| Standings (5 leagues x 2 seasons) | 10 | 25 |
| Fixtures basic (5 leagues x 2 seasons) | 10 | 35 |
| Fixtures detailed, batched by 20 IDs (~19 calls per league-season for ~380 fixtures; ~17 for ~306 in 18-team leagues) | ~180 | ~215 |
| Player squads (by team, ~96 unique teams x 2 seasons) | ~192 | ~407 |
| **Total estimated** | | **~400-420 calls** |

**With file cache:** First seed takes ~4-5 days on free tier (100/day). All subsequent runs are instant (cached). On Basic plan ($9.99/mo, 7,500/month = 250/day), first seed completes in ~2 days.

**Optimization:** Seed one season at a time. Current season first (2025/26), then previous (2024/25). Prioritize fixtures with detailed data for current season.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prisma as default ORM | Drizzle ORM gaining major adoption | 2024-2025 | Lighter runtime, faster serverless cold starts, SQL-like API |
| `serial` / `bigserial` PKs | `integer().generatedAlwaysAsIdentity()` | PostgreSQL 10+ / Drizzle 2024 | Identity columns are PostgreSQL standard, serial is legacy |
| JSON/JSONB for events/stats | Normalized tables with proper relations | Always best practice | Queryable, indexable, type-safe |
| `drizzle-kit push` for production | `drizzle-kit generate` + `migrate` for production | Always | Push is dev-only convenience; generate creates trackable migrations |
| Separate Zod schemas from DB types | `drizzle-zod` auto-generation | drizzle-zod 0.36+ | Single source of truth, less maintenance |

**Deprecated/outdated:**
- Prisma for new serverless projects: Heavier runtime, slower cold starts. Still works but Drizzle is better fit for Vercel serverless.
- `serial` column type: Use identity columns instead.
- Storing API cache in Redis during development: Unnecessary complexity. File-system cache is simpler, free, and persistent across restarts.

## Open Questions

1. **API-Football free tier season access**
   - What we know: Free tier limits "available seasons." Docs say all endpoints are available but limited.
   - What's unclear: Whether 2024/25 (previous season) data is accessible on free tier, or only current season.
   - Recommendation: Attempt to fetch 2024/25 data early in seeding. If blocked, fall back to current season only and defer historical data to when on a paid plan.

2. **Player stats granularity on free tier**
   - What we know: The `/players` endpoint returns paginated data with stats, `/players/squads` returns current squad.
   - What's unclear: Whether free tier returns full player statistics or limited fields.
   - Recommendation: Use `/players/squads` for basic squad data (name, position, number). If full stats are available, fetch via `/players` endpoint with pagination. Store what's available, null-out what isn't.

3. **API-Football response pagination details**
   - What we know: `/players` endpoint paginates at 20 results per page. Fixtures batch endpoint allows 20 IDs.
   - What's unclear: Exact pagination behavior for other endpoints, total page counts.
   - Recommendation: Always check `response.paging.total` in API responses and iterate accordingly.

4. **Neon free tier compute limits**
   - What we know: Neon free tier has compute hour limits and scales to zero.
   - What's unclear: Whether a large seeding operation (400+ DB writes) fits within free tier compute limits.
   - Recommendation: Monitor compute usage during first seed. Neon's free tier provides 0.25 compute units which should be sufficient for seeding, but validate early.

## Sources

### Primary (HIGH confidence)
- [Drizzle ORM - Get Started with Neon](https://orm.drizzle.team/docs/get-started/neon-new) - Connection setup, schema syntax, migration commands
- [Drizzle ORM - Connect Neon](https://orm.drizzle.team/docs/connect-neon) - Driver selection (HTTP vs WebSocket)
- [Drizzle ORM - PostgreSQL Column Types](https://orm.drizzle.team/docs/column-types/pg) - Full column type reference including identity columns
- [Drizzle ORM - Upsert Guide](https://orm.drizzle.team/docs/guides/upsert) - onConflictDoUpdate patterns
- [Drizzle ORM - drizzle-zod](https://orm.drizzle.team/docs/zod) - Zod schema generation from tables
- [API-Football Rate Limit](https://www.api-football.com/news/post/how-ratelimit-works) - Rate limit headers, free tier limits
- [API-Football League IDs](https://www.api-football.com/news/post/leagues-teams-ids) - Verified league IDs
- [Zod Official Docs](https://zod.dev/) - Schema validation API, safeParse usage
- [limiter npm package](https://www.npmjs.com/package/limiter) - Token bucket rate limiter API

### Secondary (MEDIUM confidence)
- [API-Football Save Calls Guide](https://www.api-football.com/news/post/how-to-save-calls-to-the-api) - Batch endpoint optimization
- [API-Football Fixtures Guide](https://www.api-football.com/news/post/how-to-get-all-fixtures-data-from-one-league) - Batch fixture fetching (20 IDs max)
- [Drizzle ORM PostgreSQL Best Practices 2025](https://gist.github.com/productdevbook/7c9ce3bbeb96b3fabc3c7c2aa2abc717) - Community best practices guide
- [Vercel Postgres Drizzle Template](https://vercel.com/templates/next.js/postgres-drizzle) - Official Vercel starter

### Tertiary (LOW confidence)
- Seeding budget estimate: Calculated from endpoint documentation but not validated against actual API behavior. Actual call counts may vary depending on pagination and league-specific data availability.
- `file-system-cache` npm suitability: Not deeply evaluated. Custom implementation may be simpler for this specific use case.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Drizzle + Neon + Zod is well-documented with official tutorials and Vercel integration
- Architecture: HIGH - Schema patterns follow Drizzle docs and PostgreSQL best practices; API client pattern is standard
- API-Football integration: MEDIUM - Endpoint paths and IDs verified but response structures not deeply validated; seeding budget is estimated
- Pitfalls: HIGH - Based on documented rate limits, known Zod behavior, and API-Football's published guides

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days - stack is stable, API-Football v3 is mature)
