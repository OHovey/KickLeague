import {
  pgTable,
  integer,
  varchar,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const feedback = pgTable(
  'feedback',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    message: varchar('message', { length: 2000 }).notNull(),
    page: varchar('page', { length: 500 }),
    locale: varchar('locale', { length: 10 }),
  },
  (table) => [index('feedback_created_at').on(table.createdAt)]
);
