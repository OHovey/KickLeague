import { pgTable, integer, varchar, index } from 'drizzle-orm/pg-core';
import { leagues } from './leagues';

export const teams = pgTable(
  'teams',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    apiId: integer('api_id').notNull().unique(),
    leagueId: integer('league_id')
      .notNull()
      .references(() => leagues.id),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 100 }).notNull(),
    shortName: varchar('short_name', { length: 50 }),
    abbreviation: varchar('abbreviation', { length: 3 }),
    logoUrl: varchar('logo_url', { length: 500 }),
    stadiumName: varchar('stadium_name', { length: 200 }),
    founded: integer('founded'),
    country: varchar('country', { length: 50 }),
  },
  (table) => [index('teams_league_idx').on(table.leagueId)]
);
