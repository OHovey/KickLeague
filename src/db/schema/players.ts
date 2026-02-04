import { pgTable, integer, varchar, index } from 'drizzle-orm/pg-core';
import { teams } from './teams';

export const players = pgTable(
  'players',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    apiId: integer('api_id').notNull().unique(),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id),
    name: varchar('name', { length: 100 }).notNull(),
    firstName: varchar('first_name', { length: 50 }),
    lastName: varchar('last_name', { length: 50 }),
    position: varchar('position', { length: 10 }), // GK, DEF, MID, FWD
    number: integer('number'),
    nationality: varchar('nationality', { length: 50 }),
    photoUrl: varchar('photo_url', { length: 500 }),
    age: integer('age'),
    height: varchar('height', { length: 10 }), // e.g. "183 cm"
    weight: varchar('weight', { length: 10 }), // e.g. "76 kg"
  },
  (table) => [index('players_team_idx').on(table.teamId)]
);
