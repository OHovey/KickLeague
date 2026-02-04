import {
  pgTable,
  integer,
  varchar,
  timestamp,
  real,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { matchStatusEnum, eventTypeEnum } from './enums';
import { leagues } from './leagues';
import { teams } from './teams';
import { players } from './players';

export const fixtures = pgTable(
  'fixtures',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    apiId: integer('api_id').notNull().unique(),
    leagueId: integer('league_id')
      .notNull()
      .references(() => leagues.id),
    season: varchar('season', { length: 10 }).notNull(),
    matchweek: integer('matchweek'),
    homeTeamId: integer('home_team_id')
      .notNull()
      .references(() => teams.id),
    awayTeamId: integer('away_team_id')
      .notNull()
      .references(() => teams.id),
    kickoff: timestamp('kickoff', { withTimezone: true }).notNull(),
    status: matchStatusEnum('status').notNull().default('scheduled'),
    homeScore: integer('home_score'),
    awayScore: integer('away_score'),
    referee: varchar('referee', { length: 100 }),
    venue: varchar('venue', { length: 200 }),
  },
  (table) => [
    index('fixtures_league_season').on(table.leagueId, table.season),
    index('fixtures_kickoff').on(table.kickoff),
    index('fixtures_status').on(table.status),
    index('fixtures_home_team').on(table.homeTeamId),
    index('fixtures_away_team').on(table.awayTeamId),
  ]
);

export const fixtureEvents = pgTable(
  'fixture_events',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    fixtureId: integer('fixture_id')
      .notNull()
      .references(() => fixtures.id, { onDelete: 'cascade' }),
    type: eventTypeEnum('type').notNull(),
    minute: integer('minute').notNull(),
    extraMinute: integer('extra_minute'),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id),
    playerId: integer('player_id').references(() => players.id),
    assistPlayerId: integer('assist_player_id').references(() => players.id),
    detail: varchar('detail', { length: 100 }), // e.g. "Normal Goal", "Penalty"
  },
  (table) => [index('fixture_events_fixture').on(table.fixtureId)]
);

export const fixtureStats = pgTable(
  'fixture_stats',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    fixtureId: integer('fixture_id')
      .notNull()
      .references(() => fixtures.id, { onDelete: 'cascade' }),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id),
    possession: real('possession'),
    shots: integer('shots'),
    shotsOnTarget: integer('shots_on_target'),
    corners: integer('corners'),
    fouls: integer('fouls'),
    offsides: integer('offsides'),
    yellowCards: integer('yellow_cards'),
    redCards: integer('red_cards'),
    xg: real('xg'),
  },
  (table) => [
    uniqueIndex('fixture_stats_unique').on(table.fixtureId, table.teamId),
  ]
);
