import {
  pgTable,
  integer,
  varchar,
  timestamp,
  boolean,
  index,
} from 'drizzle-orm/pg-core';

export const apiCallLog = pgTable(
  'api_call_log',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    calledAt: timestamp('called_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    endpoint: varchar('endpoint', { length: 100 }).notNull(),
    leagueApiId: integer('league_api_id'),
    season: varchar('season', { length: 10 }),
    params: varchar('params', { length: 500 }),
    success: boolean('success').notNull(),
    httpStatus: integer('http_status'),
    responseTimeMs: integer('response_time_ms'),
    dailyRemaining: integer('daily_remaining'),
    errorMessage: varchar('error_message', { length: 500 }),
  },
  (table) => [index('api_call_log_called_at').on(table.calledAt)]
);
