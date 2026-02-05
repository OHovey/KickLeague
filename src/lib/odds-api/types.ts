/**
 * Zod schemas for The Odds API v4 response types.
 *
 * Design principles (matching api-football/types.ts):
 * - Use `.passthrough()` on all objects so extra fields don't fail validation
 * - Use `.nullable()` and `.optional()` liberally
 * - Always use `safeParse()` (not `parse()`) when validating responses
 * - Export inferred TypeScript types via `z.infer<typeof schema>`
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Outcome (single odds value for one selection)
// ---------------------------------------------------------------------------

export const oddsOutcomeSchema = z
  .object({
    name: z.string(),
    price: z.number(),
    link: z.string().nullable().optional(),
    sid: z.string().nullable().optional(),
  })
  .passthrough();

export type OddsOutcome = z.infer<typeof oddsOutcomeSchema>;

// ---------------------------------------------------------------------------
// Market (e.g. h2h, spreads, totals)
// ---------------------------------------------------------------------------

export const oddsMarketSchema = z
  .object({
    key: z.string(),
    last_update: z.string(),
    outcomes: z.array(oddsOutcomeSchema),
  })
  .passthrough();

export type OddsMarket = z.infer<typeof oddsMarketSchema>;

// ---------------------------------------------------------------------------
// Bookmaker (one bookmaker's odds for an event)
// ---------------------------------------------------------------------------

export const oddsBookmakerSchema = z
  .object({
    key: z.string(),
    title: z.string(),
    last_update: z.string(),
    markets: z.array(oddsMarketSchema),
  })
  .passthrough();

export type OddsBookmaker = z.infer<typeof oddsBookmakerSchema>;

// ---------------------------------------------------------------------------
// Event (one match/fixture with all bookmakers' odds)
// ---------------------------------------------------------------------------

export const oddsEventSchema = z
  .object({
    id: z.string(),
    sport_key: z.string(),
    sport_title: z.string(),
    commence_time: z.string(),
    home_team: z.string(),
    away_team: z.string(),
    bookmakers: z.array(oddsBookmakerSchema),
  })
  .passthrough();

export type OddsEvent = z.infer<typeof oddsEventSchema>;

// ---------------------------------------------------------------------------
// Full response (array of events)
// ---------------------------------------------------------------------------

export const oddsApiResponseSchema = z.array(oddsEventSchema);

export type OddsApiResponse = z.infer<typeof oddsApiResponseSchema>;

// ---------------------------------------------------------------------------
// Sports discovery response (GET /v4/sports)
// ---------------------------------------------------------------------------

export const sportSchema = z
  .object({
    key: z.string(),
    group: z.string(),
    title: z.string(),
    description: z.string(),
    active: z.boolean(),
    has_outrights: z.boolean(),
  })
  .passthrough();

export const sportsApiResponseSchema = z.array(sportSchema);

export type Sport = z.infer<typeof sportSchema>;
export type SportsApiResponse = z.infer<typeof sportsApiResponseSchema>;
