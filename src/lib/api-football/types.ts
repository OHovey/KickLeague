/**
 * Zod schemas for API-Football v3 response types.
 *
 * Design principles:
 * - Use `.passthrough()` on outer wrappers so extra fields don't fail validation
 * - Use `.nullable()` and `.optional()` liberally -- API-Football returns null for many fields
 * - Always use `safeParse()` (not `parse()`) when validating responses
 * - Export inferred TypeScript types via `z.infer<typeof schema>`
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Generic API response wrapper
// ---------------------------------------------------------------------------

/**
 * Generic paging info from API-Football responses.
 */
const pagingSchema = z
  .object({
    current: z.number(),
    total: z.number(),
  })
  .passthrough();

/**
 * Build a typed API response wrapper schema for a given response item schema.
 * API-Football wraps all responses in this structure.
 */
export function apiResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z
    .object({
      get: z.string().optional(),
      parameters: z.record(z.string(), z.string()).nullable().optional(),
      errors: z.array(z.unknown()).nullable().optional(),
      results: z.number().optional(),
      paging: pagingSchema.optional(),
      response: z.array(itemSchema),
    })
    .passthrough();
}

// ---------------------------------------------------------------------------
// League schemas
// ---------------------------------------------------------------------------

const leagueInfoSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    type: z.string().optional(),
    logo: z.string().nullable().optional(),
  })
  .passthrough();

const countrySchema = z
  .object({
    name: z.string().nullable().optional(),
    code: z.string().nullable().optional(),
    flag: z.string().nullable().optional(),
  })
  .passthrough();

const seasonCoverageSchema = z
  .object({
    fixtures: z
      .object({
        events: z.boolean().optional(),
        lineups: z.boolean().optional(),
        statistics_fixtures: z.boolean().optional(),
        statistics_players: z.boolean().optional(),
      })
      .passthrough()
      .optional(),
    standings: z.boolean().optional(),
    players: z.boolean().optional(),
    top_scorers: z.boolean().optional(),
    top_assists: z.boolean().optional(),
    top_cards: z.boolean().optional(),
    injuries: z.boolean().optional(),
    predictions: z.boolean().optional(),
    odds: z.boolean().optional(),
  })
  .passthrough();

const seasonSchema = z
  .object({
    year: z.number(),
    start: z.string().nullable().optional(),
    end: z.string().nullable().optional(),
    current: z.boolean().optional(),
    coverage: seasonCoverageSchema.optional(),
  })
  .passthrough();

export const leagueResponseItemSchema = z
  .object({
    league: leagueInfoSchema,
    country: countrySchema.optional(),
    seasons: z.array(seasonSchema).optional(),
  })
  .passthrough();

export const leagueResponseSchema = apiResponseSchema(leagueResponseItemSchema);

export type LeagueResponseItem = z.infer<typeof leagueResponseItemSchema>;
export type LeagueResponse = z.infer<typeof leagueResponseSchema>;

// ---------------------------------------------------------------------------
// Team schemas
// ---------------------------------------------------------------------------

const teamInfoSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    code: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    founded: z.number().nullable().optional(),
    national: z.boolean().nullable().optional(),
    logo: z.string().nullable().optional(),
  })
  .passthrough();

const venueSchema = z
  .object({
    id: z.number().nullable().optional(),
    name: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    capacity: z.number().nullable().optional(),
    surface: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
  })
  .passthrough();

export const teamResponseItemSchema = z
  .object({
    team: teamInfoSchema,
    venue: venueSchema.nullable().optional(),
  })
  .passthrough();

export const teamResponseSchema = apiResponseSchema(teamResponseItemSchema);

export type TeamResponseItem = z.infer<typeof teamResponseItemSchema>;
export type TeamResponse = z.infer<typeof teamResponseSchema>;

// ---------------------------------------------------------------------------
// Standings schemas
// ---------------------------------------------------------------------------

const standingTeamSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    logo: z.string().nullable().optional(),
  })
  .passthrough();

const standingRecordSchema = z
  .object({
    played: z.number().nullable().optional(),
    win: z.number().nullable().optional(),
    draw: z.number().nullable().optional(),
    lose: z.number().nullable().optional(),
    goals: z
      .object({
        for: z.number().nullable().optional(),
        against: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

const standingEntrySchema = z
  .object({
    rank: z.number(),
    team: standingTeamSchema,
    points: z.number().nullable().optional(),
    goalsDiff: z.number().nullable().optional(),
    group: z.string().nullable().optional(),
    form: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    all: standingRecordSchema.nullable().optional(),
    home: standingRecordSchema.nullable().optional(),
    away: standingRecordSchema.nullable().optional(),
    update: z.string().nullable().optional(),
  })
  .passthrough();

const standingsLeagueSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    country: z.string().nullable().optional(),
    logo: z.string().nullable().optional(),
    flag: z.string().nullable().optional(),
    season: z.number(),
    standings: z.array(z.array(standingEntrySchema)),
  })
  .passthrough();

export const standingsResponseItemSchema = z
  .object({
    league: standingsLeagueSchema,
  })
  .passthrough();

export const standingsResponseSchema = apiResponseSchema(
  standingsResponseItemSchema
);

export type StandingsResponseItem = z.infer<typeof standingsResponseItemSchema>;
export type StandingsResponse = z.infer<typeof standingsResponseSchema>;
export type StandingEntry = z.infer<typeof standingEntrySchema>;

// ---------------------------------------------------------------------------
// Fixture schemas (basic)
// ---------------------------------------------------------------------------

const fixtureInfoSchema = z
  .object({
    id: z.number(),
    referee: z.string().nullable().optional(),
    timezone: z.string().nullable().optional(),
    date: z.string(),
    timestamp: z.number().nullable().optional(),
    periods: z
      .object({
        first: z.number().nullable().optional(),
        second: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    venue: z
      .object({
        id: z.number().nullable().optional(),
        name: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    status: z
      .object({
        long: z.string().nullable().optional(),
        short: z.string().nullable().optional(),
        elapsed: z.number().nullable().optional(),
      })
      .passthrough(),
  })
  .passthrough();

const fixtureLeagueSchema = z
  .object({
    id: z.number(),
    name: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    logo: z.string().nullable().optional(),
    flag: z.string().nullable().optional(),
    season: z.number(),
    round: z.string().nullable().optional(),
  })
  .passthrough();

const fixtureTeamSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    logo: z.string().nullable().optional(),
    winner: z.boolean().nullable().optional(),
  })
  .passthrough();

const fixtureGoalsSchema = z
  .object({
    home: z.number().nullable().optional(),
    away: z.number().nullable().optional(),
  })
  .passthrough();

const fixtureScoreSchema = z
  .object({
    halftime: fixtureGoalsSchema.nullable().optional(),
    fulltime: fixtureGoalsSchema.nullable().optional(),
    extratime: fixtureGoalsSchema.nullable().optional(),
    penalty: fixtureGoalsSchema.nullable().optional(),
  })
  .passthrough();

export const fixtureBasicResponseItemSchema = z
  .object({
    fixture: fixtureInfoSchema,
    league: fixtureLeagueSchema,
    teams: z
      .object({
        home: fixtureTeamSchema,
        away: fixtureTeamSchema,
      })
      .passthrough(),
    goals: fixtureGoalsSchema.nullable().optional(),
    score: fixtureScoreSchema.nullable().optional(),
  })
  .passthrough();

export const fixtureBasicResponseSchema = apiResponseSchema(
  fixtureBasicResponseItemSchema
);

export type FixtureBasicResponseItem = z.infer<
  typeof fixtureBasicResponseItemSchema
>;
export type FixtureBasicResponse = z.infer<typeof fixtureBasicResponseSchema>;

// ---------------------------------------------------------------------------
// Fixture schemas (detailed: events, statistics, lineups, players)
// ---------------------------------------------------------------------------

const fixtureEventSchema = z
  .object({
    time: z
      .object({
        elapsed: z.number().nullable().optional(),
        extra: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    team: z
      .object({
        id: z.number().nullable().optional(),
        name: z.string().nullable().optional(),
        logo: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    player: z
      .object({
        id: z.number().nullable().optional(),
        name: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    assist: z
      .object({
        id: z.number().nullable().optional(),
        name: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    type: z.string().nullable().optional(),
    detail: z.string().nullable().optional(),
    comments: z.string().nullable().optional(),
  })
  .passthrough();

const fixtureStatValueSchema = z.union([
  z.string(),
  z.number(),
  z.null(),
]);

const fixtureStatItemSchema = z
  .object({
    type: z.string().nullable().optional(),
    value: fixtureStatValueSchema.optional(),
  })
  .passthrough();

const fixtureTeamStatisticsSchema = z
  .object({
    team: z
      .object({
        id: z.number().nullable().optional(),
        name: z.string().nullable().optional(),
        logo: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    statistics: z.array(fixtureStatItemSchema).nullable().optional(),
  })
  .passthrough();

const lineupPlayerSchema = z
  .object({
    id: z.number().nullable().optional(),
    name: z.string().nullable().optional(),
    number: z.number().nullable().optional(),
    pos: z.string().nullable().optional(),
    grid: z.string().nullable().optional(),
  })
  .passthrough();

const fixtureLineupSchema = z
  .object({
    team: z
      .object({
        id: z.number().nullable().optional(),
        name: z.string().nullable().optional(),
        logo: z.string().nullable().optional(),
        colors: z.unknown().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    coach: z
      .object({
        id: z.number().nullable().optional(),
        name: z.string().nullable().optional(),
        photo: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    formation: z.string().nullable().optional(),
    startXI: z
      .array(
        z
          .object({ player: lineupPlayerSchema.nullable().optional() })
          .passthrough()
      )
      .nullable()
      .optional(),
    substitutes: z
      .array(
        z
          .object({ player: lineupPlayerSchema.nullable().optional() })
          .passthrough()
      )
      .nullable()
      .optional(),
  })
  .passthrough();

const playerStatGameSchema = z
  .object({
    minutes: z.number().nullable().optional(),
    number: z.number().nullable().optional(),
    position: z.string().nullable().optional(),
    rating: z.string().nullable().optional(),
    captain: z.boolean().nullable().optional(),
    substitute: z.boolean().nullable().optional(),
  })
  .passthrough();

const playerStatDetailSchema = z
  .object({
    total: z.number().nullable().optional(),
    conceded: z.number().nullable().optional(),
    assists: z.number().nullable().optional(),
    saves: z.number().nullable().optional(),
  })
  .passthrough();

const playerStatPassesSchema = z
  .object({
    total: z.number().nullable().optional(),
    key: z.number().nullable().optional(),
    accuracy: z.string().nullable().optional(),
  })
  .passthrough();

const fixturePlayerStatSchema = z
  .object({
    games: playerStatGameSchema.nullable().optional(),
    offsides: z.number().nullable().optional(),
    shots: z
      .object({
        total: z.number().nullable().optional(),
        on: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    goals: playerStatDetailSchema.nullable().optional(),
    passes: playerStatPassesSchema.nullable().optional(),
    tackles: z
      .object({
        total: z.number().nullable().optional(),
        blocks: z.number().nullable().optional(),
        interceptions: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    duels: z
      .object({
        total: z.number().nullable().optional(),
        won: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    dribbles: z
      .object({
        attempts: z.number().nullable().optional(),
        success: z.number().nullable().optional(),
        past: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    fouls: z
      .object({
        drawn: z.number().nullable().optional(),
        committed: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    cards: z
      .object({
        yellow: z.number().nullable().optional(),
        red: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    penalty: z
      .object({
        won: z.number().nullable().optional(),
        committed: z.number().nullable().optional(),
        scored: z.number().nullable().optional(),
        missed: z.number().nullable().optional(),
        saved: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

const fixturePlayerSchema = z
  .object({
    player: z
      .object({
        id: z.number().nullable().optional(),
        name: z.string().nullable().optional(),
        photo: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    statistics: z.array(fixturePlayerStatSchema).nullable().optional(),
  })
  .passthrough();

const fixturePlayersTeamSchema = z
  .object({
    team: z
      .object({
        id: z.number().nullable().optional(),
        name: z.string().nullable().optional(),
        logo: z.string().nullable().optional(),
        update: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    players: z.array(fixturePlayerSchema).nullable().optional(),
  })
  .passthrough();

export const fixtureDetailedResponseItemSchema = z
  .object({
    fixture: fixtureInfoSchema,
    league: fixtureLeagueSchema,
    teams: z
      .object({
        home: fixtureTeamSchema,
        away: fixtureTeamSchema,
      })
      .passthrough(),
    goals: fixtureGoalsSchema.nullable().optional(),
    score: fixtureScoreSchema.nullable().optional(),
    events: z.array(fixtureEventSchema).nullable().optional(),
    statistics: z.array(fixtureTeamStatisticsSchema).nullable().optional(),
    lineups: z.array(fixtureLineupSchema).nullable().optional(),
    players: z.array(fixturePlayersTeamSchema).nullable().optional(),
  })
  .passthrough();

export const fixtureDetailedResponseSchema = apiResponseSchema(
  fixtureDetailedResponseItemSchema
);

export type FixtureDetailedResponseItem = z.infer<
  typeof fixtureDetailedResponseItemSchema
>;
export type FixtureDetailedResponse = z.infer<
  typeof fixtureDetailedResponseSchema
>;
export type FixtureEvent = z.infer<typeof fixtureEventSchema>;

// ---------------------------------------------------------------------------
// Player squad schemas
// ---------------------------------------------------------------------------

const squadPlayerSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    age: z.number().nullable().optional(),
    number: z.number().nullable().optional(),
    position: z.string().nullable().optional(),
    photo: z.string().nullable().optional(),
  })
  .passthrough();

export const playerSquadResponseItemSchema = z
  .object({
    team: z
      .object({
        id: z.number(),
        name: z.string(),
        logo: z.string().nullable().optional(),
      })
      .passthrough(),
    players: z.array(squadPlayerSchema),
  })
  .passthrough();

export const playerSquadResponseSchema = apiResponseSchema(
  playerSquadResponseItemSchema
);

export type PlayerSquadResponseItem = z.infer<
  typeof playerSquadResponseItemSchema
>;
export type PlayerSquadResponse = z.infer<typeof playerSquadResponseSchema>;
export type SquadPlayer = z.infer<typeof squadPlayerSchema>;

// ---------------------------------------------------------------------------
// Player stats schemas (paginated /players endpoint)
// ---------------------------------------------------------------------------

const playerInfoSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    firstname: z.string().nullable().optional(),
    lastname: z.string().nullable().optional(),
    age: z.number().nullable().optional(),
    birth: z
      .object({
        date: z.string().nullable().optional(),
        place: z.string().nullable().optional(),
        country: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    nationality: z.string().nullable().optional(),
    height: z.string().nullable().optional(),
    weight: z.string().nullable().optional(),
    injured: z.boolean().nullable().optional(),
    photo: z.string().nullable().optional(),
  })
  .passthrough();

const playerSeasonStatsSchema = z
  .object({
    team: z
      .object({
        id: z.number().nullable().optional(),
        name: z.string().nullable().optional(),
        logo: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    league: z
      .object({
        id: z.number().nullable().optional(),
        name: z.string().nullable().optional(),
        country: z.string().nullable().optional(),
        logo: z.string().nullable().optional(),
        flag: z.string().nullable().optional(),
        season: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    games: z
      .object({
        appearances: z.number().nullable().optional(),
        lineups: z.number().nullable().optional(),
        minutes: z.number().nullable().optional(),
        number: z.number().nullable().optional(),
        position: z.string().nullable().optional(),
        rating: z.string().nullable().optional(),
        captain: z.boolean().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    substitutes: z
      .object({
        in: z.number().nullable().optional(),
        out: z.number().nullable().optional(),
        bench: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    shots: z
      .object({
        total: z.number().nullable().optional(),
        on: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    goals: z
      .object({
        total: z.number().nullable().optional(),
        conceded: z.number().nullable().optional(),
        assists: z.number().nullable().optional(),
        saves: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    passes: z
      .object({
        total: z.number().nullable().optional(),
        key: z.number().nullable().optional(),
        accuracy: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    tackles: z
      .object({
        total: z.number().nullable().optional(),
        blocks: z.number().nullable().optional(),
        interceptions: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    duels: z
      .object({
        total: z.number().nullable().optional(),
        won: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    dribbles: z
      .object({
        attempts: z.number().nullable().optional(),
        success: z.number().nullable().optional(),
        past: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    fouls: z
      .object({
        drawn: z.number().nullable().optional(),
        committed: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    cards: z
      .object({
        yellow: z.number().nullable().optional(),
        yellowred: z.number().nullable().optional(),
        red: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    penalty: z
      .object({
        won: z.number().nullable().optional(),
        committed: z.number().nullable().optional(),
        scored: z.number().nullable().optional(),
        missed: z.number().nullable().optional(),
        saved: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

export const playerStatsResponseItemSchema = z
  .object({
    player: playerInfoSchema,
    statistics: z.array(playerSeasonStatsSchema),
  })
  .passthrough();

export const playerStatsResponseSchema = apiResponseSchema(
  playerStatsResponseItemSchema
);

export type PlayerStatsResponseItem = z.infer<
  typeof playerStatsResponseItemSchema
>;
export type PlayerStatsResponse = z.infer<typeof playerStatsResponseSchema>;
