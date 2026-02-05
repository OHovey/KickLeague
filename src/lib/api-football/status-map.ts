/**
 * Shared match status mapping utilities for API-Football status codes.
 *
 * Extracted from seed-fixtures.ts for use in both seeding and live pipeline.
 * The original mapStatus in seed-fixtures.ts is kept as-is to avoid breaking
 * the seed flow. This module adds type-safe helpers for live status checks.
 */

export type MatchStatus =
  | 'scheduled'
  | 'live'
  | 'finished'
  | 'postponed'
  | 'cancelled'
  | 'first_half'
  | 'halftime'
  | 'second_half'
  | 'extra_time'
  | 'penalties';

const STATUS_MAP: Record<string, MatchStatus> = {
  TBD: 'scheduled',
  NS: 'scheduled',
  '1H': 'first_half',
  HT: 'halftime',
  '2H': 'second_half',
  ET: 'extra_time',
  P: 'penalties',
  FT: 'finished',
  AET: 'finished',
  PEN: 'finished',
  BT: 'finished',
  SUSP: 'postponed',
  INT: 'postponed',
  PST: 'postponed',
  CANC: 'cancelled',
  ABD: 'cancelled',
  AWD: 'finished',
  WO: 'finished',
  LIVE: 'live',
};

/**
 * Map an API-Football status short code to our match_status enum.
 * Returns 'scheduled' for unknown or null/undefined inputs.
 */
export function mapStatus(short: string | null | undefined): MatchStatus {
  if (!short) return 'scheduled';
  return STATUS_MAP[short] ?? 'scheduled';
}

/** Status values representing an in-progress match */
const LIVE_STATUSES: ReadonlySet<MatchStatus> = new Set([
  'live',
  'first_half',
  'halftime',
  'second_half',
  'extra_time',
  'penalties',
]);

/** Check if a status represents an in-progress match */
export function isLiveStatus(status: MatchStatus): boolean {
  return LIVE_STATUSES.has(status);
}

/** Check if a status represents a completed match */
export function isFinishedStatus(status: MatchStatus): boolean {
  return status === 'finished';
}

/** Terminal statuses: no further updates expected */
const TERMINAL_STATUSES: ReadonlySet<MatchStatus> = new Set([
  'finished',
  'cancelled',
  'postponed',
]);

/** Check if a status represents a terminal state (no more updates expected) */
export function isTerminalStatus(status: MatchStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

/**
 * Extract the matchweek number from the API-Football round string.
 * "Regular Season - 23" -> 23
 * "Regular Season - 1" -> 1
 * Returns null for non-standard round formats.
 */
export function extractMatchweek(
  round: string | null | undefined,
): number | null {
  if (!round) return null;
  const match = round.match(/(\d+)\s*$/);
  return match ? parseInt(match[1], 10) : null;
}
