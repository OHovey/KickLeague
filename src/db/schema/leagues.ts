import {
  pgTable,
  integer,
  varchar,
  boolean,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { zoneTypeEnum } from './enums';

export const leagues = pgTable('leagues', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  apiId: integer('api_id').notNull().unique(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  country: varchar('country', { length: 50 }).notNull(),
  logoUrl: varchar('logo_url', { length: 500 }),
  currentSeason: varchar('current_season', { length: 10 }).notNull(),
});

export const leagueConfig = pgTable(
  'league_config',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    leagueId: integer('league_id')
      .notNull()
      .references(() => leagues.id, { onDelete: 'cascade' }),
    season: varchar('season', { length: 10 }).notNull(),
    teamCount: integer('team_count').notNull(),
    // Stored as comma-separated enum values: "head_to_head,goal_difference,goals_for"
    tiebreakerOrder: varchar('tiebreaker_order', { length: 255 }).notNull(),
    matchweeksTotal: integer('matchweeks_total').notNull(),
    hasXg: boolean('has_xg').notNull().default(false),
    hasDetailedStats: boolean('has_detailed_stats').notNull().default(true),
    hasPlayerStats: boolean('has_player_stats').notNull().default(true),
  },
  (table) => [
    uniqueIndex('league_config_unique').on(table.leagueId, table.season),
  ]
);

export const leagueZones = pgTable(
  'league_zones',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    leagueId: integer('league_id')
      .notNull()
      .references(() => leagues.id, { onDelete: 'cascade' }),
    season: varchar('season', { length: 10 }).notNull(),
    zoneType: zoneTypeEnum('zone_type').notNull(),
    startPosition: integer('start_position').notNull(),
    endPosition: integer('end_position').notNull(),
    color: varchar('color', { length: 7 }).notNull(), // hex color e.g. #22c55e
  },
  (table) => [
    index('league_zones_lookup').on(table.leagueId, table.season),
  ]
);
