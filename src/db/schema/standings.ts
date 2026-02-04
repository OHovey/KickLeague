import {
  pgTable,
  integer,
  varchar,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { leagues } from './leagues';
import { teams } from './teams';

export const standings = pgTable(
  'standings',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    leagueId: integer('league_id')
      .notNull()
      .references(() => leagues.id),
    season: varchar('season', { length: 10 }).notNull(),
    matchweek: integer('matchweek').notNull(),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id),
    position: integer('position').notNull(),
    played: integer('played').notNull(),
    won: integer('won').notNull(),
    drawn: integer('drawn').notNull(),
    lost: integer('lost').notNull(),
    goalsFor: integer('goals_for').notNull(),
    goalsAgainst: integer('goals_against').notNull(),
    goalDifference: integer('goal_difference').notNull(),
    points: integer('points').notNull(),
    form: varchar('form', { length: 10 }), // last 5 results as "WWDLW"
    homeWon: integer('home_won').notNull(),
    homeDrawn: integer('home_drawn').notNull(),
    homeLost: integer('home_lost').notNull(),
    homeGoalsFor: integer('home_goals_for').notNull(),
    homeGoalsAgainst: integer('home_goals_against').notNull(),
    awayWon: integer('away_won').notNull(),
    awayDrawn: integer('away_drawn').notNull(),
    awayLost: integer('away_lost').notNull(),
    awayGoalsFor: integer('away_goals_for').notNull(),
    awayGoalsAgainst: integer('away_goals_against').notNull(),
    pointsDeduction: integer('points_deduction').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('standings_unique').on(
      table.leagueId,
      table.season,
      table.matchweek,
      table.teamId
    ),
    index('standings_league_season_week').on(
      table.leagueId,
      table.season,
      table.matchweek
    ),
  ]
);
