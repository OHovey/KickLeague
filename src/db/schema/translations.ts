import {
  pgTable,
  integer,
  varchar,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { teams } from './teams';

/**
 * Per-locale team name translations.
 * Starts empty -- translations populated manually or via seed script.
 * When no translation exists for a locale, the English name from the teams table is used.
 */
export const teamTranslations = pgTable(
  'team_translations',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    locale: varchar('locale', { length: 5 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
  },
  (table) => [
    uniqueIndex('team_translations_team_locale').on(table.teamId, table.locale),
    index('team_translations_locale').on(table.locale),
  ]
);
