/**
 * API-Football endpoint definitions, league ID mappings, and constants.
 *
 * All league IDs and endpoint paths are centralized here.
 * No other module should hardcode these values.
 */

export const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";

/**
 * League slug to API-Football ID mapping.
 * Verified against: https://www.api-football.com/news/post/leagues-teams-ids
 */
export const LEAGUE_IDS = {
  "premier-league": 39,
  "la-liga": 140,
  bundesliga: 78,
  "serie-a": 135,
  "ligue-1": 61,
} as const;

/**
 * Reverse mapping: API-Football ID to league slug.
 */
export const LEAGUE_SLUGS: Record<number, LeagueSlug> = {
  39: "premier-league",
  140: "la-liga",
  78: "bundesliga",
  135: "serie-a",
  61: "ligue-1",
};

/**
 * Union type of all supported league slugs.
 */
export type LeagueSlug = keyof typeof LEAGUE_IDS;

/**
 * API-Football endpoint paths.
 */
export const ENDPOINTS = {
  leagues: "/leagues",
  teams: "/teams",
  standings: "/standings",
  fixtures: "/fixtures",
  players: "/players",
  playerSquads: "/players/squads",
} as const;

/**
 * Seasons to seed: current and previous.
 * API-Football uses the start year (e.g., 2025 for the 2025/26 season).
 */
export const SEASONS: number[] = [2025, 2024];
