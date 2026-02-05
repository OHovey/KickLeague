import {
  pgTable,
  integer,
  varchar,
  timestamp,
  real,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { fixtures } from './fixtures';

/**
 * Current odds per fixture per bookmaker.
 * Upserted on each poll from The Odds API.
 * prev_*_odds columns enable movement tracking (shortened/drifted indicators).
 */
export const fixtureOdds = pgTable(
  'fixture_odds',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    fixtureId: integer('fixture_id')
      .notNull()
      .references(() => fixtures.id, { onDelete: 'cascade' }),
    bookmakerKey: varchar('bookmaker_key', { length: 50 }).notNull(),
    bookmakerTitle: varchar('bookmaker_title', { length: 100 }).notNull(),
    market: varchar('market', { length: 20 }).notNull().default('h2h'),
    homeOdds: real('home_odds').notNull(),
    drawOdds: real('draw_odds').notNull(),
    awayOdds: real('away_odds').notNull(),
    homeLink: varchar('home_link', { length: 1000 }),
    drawLink: varchar('draw_link', { length: 1000 }),
    awayLink: varchar('away_link', { length: 1000 }),
    prevHomeOdds: real('prev_home_odds'),
    prevDrawOdds: real('prev_draw_odds'),
    prevAwayOdds: real('prev_away_odds'),
    lastUpdated: timestamp('last_updated', { withTimezone: true }).notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('fixture_odds_unique').on(
      table.fixtureId,
      table.bookmakerKey,
      table.market
    ),
    index('fixture_odds_fixture').on(table.fixtureId),
  ]
);

/**
 * Click tracking for affiliate analytics.
 * Records each outbound click to a bookmaker with the odds at time of click.
 */
export const affiliateClicks = pgTable(
  'affiliate_clicks',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    fixtureId: integer('fixture_id')
      .notNull()
      .references(() => fixtures.id),
    bookmakerKey: varchar('bookmaker_key', { length: 50 }).notNull(),
    outcome: varchar('outcome', { length: 10 }).notNull(), // 'home', 'draw', 'away'
    odds: real('odds').notNull(),
    country: varchar('country', { length: 2 }),
    clickedAt: timestamp('clicked_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('affiliate_clicks_fixture').on(table.fixtureId),
    index('affiliate_clicks_time').on(table.clickedAt),
  ]
);
