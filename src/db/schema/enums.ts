import { pgEnum } from 'drizzle-orm/pg-core';

export const matchStatusEnum = pgEnum('match_status', [
  'scheduled',
  'live',
  'finished',
  'postponed',
  'cancelled',
  'first_half',
  'halftime',
  'second_half',
  'extra_time',
  'penalties',
]);

export const eventTypeEnum = pgEnum('event_type', [
  'goal',
  'own_goal',
  'penalty_scored',
  'penalty_missed',
  'yellow_card',
  'red_card',
  'substitution',
  'var',
]);

export const tiebreakerMethodEnum = pgEnum('tiebreaker_method', [
  'goal_difference',
  'goals_for',
  'head_to_head',
  'away_goals',
]);

export const zoneTypeEnum = pgEnum('zone_type', [
  'champions_league',
  'champions_league_qualifying',
  'europa_league',
  'conference_league',
  'relegation_playoff',
  'relegation',
]);
