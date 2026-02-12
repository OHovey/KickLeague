// Leaderboard database queries for top scorers, top assists, and disciplinary tables.
//
// Note on "appearances": Since we don't have a player_fixtures/lineup table,
// appearances are approximated as the number of distinct fixtures where the
// player had at least one event. Players who play full matches without any
// recorded event won't be counted. This is acceptable because leaderboard
// players (top scorers, top assist makers, most-carded) by definition have
// events in their matches.

import { eq, and, sql, isNotNull } from 'drizzle-orm';
import { getDb } from '@/db/connection';
import { fixtureEvents, fixtures, players, teams } from '@/db/schema';

// -- Types -------------------------------------------------------------------

export interface LeaderboardScorerRow {
  playerId: number;
  playerName: string;
  playerPhotoUrl: string | null;
  teamId: number;
  teamName: string;
  teamLogoUrl: string | null;
  goals: number;
  appearances: number;
  goalsPerAppearance: number;
}

export interface LeaderboardAssistRow {
  playerId: number;
  playerName: string;
  playerPhotoUrl: string | null;
  teamId: number;
  teamName: string;
  teamLogoUrl: string | null;
  assists: number;
  appearances: number;
  assistsPerAppearance: number;
}

export interface LeaderboardDisciplinaryRow {
  playerId: number;
  playerName: string;
  playerPhotoUrl: string | null;
  teamId: number;
  teamName: string;
  teamLogoUrl: string | null;
  yellowCards: number;
  redCards: number;
  appearances: number;
}

// -- Queries -----------------------------------------------------------------

/**
 * Top scorers leaderboard.
 * Counts goals + penalty_scored events grouped by player.
 * Includes appearances (distinct fixtures with any event) and goals per appearance.
 */
export async function getTopScorersLeaderboard(
  leagueId: number,
  season: string,
  limit: number = 20
): Promise<LeaderboardScorerRow[]> {
  const db = getDb();

  const rows = await db.execute(sql`
    SELECT
      p.id AS player_id,
      p.name AS player_name,
      p.photo_url AS player_photo_url,
      t.id AS team_id,
      t.name AS team_name,
      t.logo_url AS team_logo_url,
      COUNT(fe.id) AS goals,
      (
        SELECT COUNT(DISTINCT fe2.fixture_id)
        FROM fixture_events fe2
        INNER JOIN fixtures f2 ON fe2.fixture_id = f2.id
        WHERE fe2.player_id = p.id
          AND f2.league_id = ${leagueId}
          AND f2.season = ${season}
      ) AS appearances,
      ROUND(
        CAST(COUNT(fe.id) AS DECIMAL) /
        NULLIF((
          SELECT COUNT(DISTINCT fe2.fixture_id)
          FROM fixture_events fe2
          INNER JOIN fixtures f2 ON fe2.fixture_id = f2.id
          WHERE fe2.player_id = p.id
            AND f2.league_id = ${leagueId}
            AND f2.season = ${season}
        ), 0),
        2
      ) AS goals_per_appearance
    FROM fixture_events fe
    INNER JOIN fixtures f ON fe.fixture_id = f.id
    INNER JOIN players p ON fe.player_id = p.id
    INNER JOIN teams t ON p.team_id = t.id
    WHERE f.league_id = ${leagueId}
      AND f.season = ${season}
      AND fe.player_id IS NOT NULL
      AND fe.type IN ('goal', 'penalty_scored')
    GROUP BY p.id, p.name, p.photo_url, t.id, t.name, t.logo_url
    ORDER BY goals DESC, goals_per_appearance DESC
    LIMIT ${limit}
  `);

  return rows.rows.map((row: Record<string, unknown>) => ({
    playerId: Number(row.player_id),
    playerName: String(row.player_name),
    playerPhotoUrl: row.player_photo_url ? String(row.player_photo_url) : null,
    teamId: Number(row.team_id),
    teamName: String(row.team_name),
    teamLogoUrl: row.team_logo_url ? String(row.team_logo_url) : null,
    goals: Number(row.goals),
    appearances: Number(row.appearances),
    goalsPerAppearance: Number(row.goals_per_appearance ?? 0),
  }));
}

/**
 * Top assists leaderboard.
 * Counts goal/penalty_scored events from the assist_player_id perspective.
 * Includes appearances and assists per appearance.
 */
export async function getTopAssistsLeaderboard(
  leagueId: number,
  season: string,
  limit: number = 20
): Promise<LeaderboardAssistRow[]> {
  const db = getDb();

  const rows = await db.execute(sql`
    SELECT
      p.id AS player_id,
      p.name AS player_name,
      p.photo_url AS player_photo_url,
      t.id AS team_id,
      t.name AS team_name,
      t.logo_url AS team_logo_url,
      COUNT(fe.id) AS assists,
      (
        SELECT COUNT(DISTINCT fe2.fixture_id)
        FROM fixture_events fe2
        INNER JOIN fixtures f2 ON fe2.fixture_id = f2.id
        WHERE (fe2.player_id = p.id OR fe2.assist_player_id = p.id)
          AND f2.league_id = ${leagueId}
          AND f2.season = ${season}
      ) AS appearances,
      ROUND(
        CAST(COUNT(fe.id) AS DECIMAL) /
        NULLIF((
          SELECT COUNT(DISTINCT fe2.fixture_id)
          FROM fixture_events fe2
          INNER JOIN fixtures f2 ON fe2.fixture_id = f2.id
          WHERE (fe2.player_id = p.id OR fe2.assist_player_id = p.id)
            AND f2.league_id = ${leagueId}
            AND f2.season = ${season}
        ), 0),
        2
      ) AS assists_per_appearance
    FROM fixture_events fe
    INNER JOIN fixtures f ON fe.fixture_id = f.id
    INNER JOIN players p ON fe.assist_player_id = p.id
    INNER JOIN teams t ON p.team_id = t.id
    WHERE f.league_id = ${leagueId}
      AND f.season = ${season}
      AND fe.assist_player_id IS NOT NULL
      AND fe.type IN ('goal', 'penalty_scored')
    GROUP BY p.id, p.name, p.photo_url, t.id, t.name, t.logo_url
    ORDER BY assists DESC, assists_per_appearance DESC
    LIMIT ${limit}
  `);

  return rows.rows.map((row: Record<string, unknown>) => ({
    playerId: Number(row.player_id),
    playerName: String(row.player_name),
    playerPhotoUrl: row.player_photo_url ? String(row.player_photo_url) : null,
    teamId: Number(row.team_id),
    teamName: String(row.team_name),
    teamLogoUrl: row.team_logo_url ? String(row.team_logo_url) : null,
    assists: Number(row.assists),
    appearances: Number(row.appearances),
    assistsPerAppearance: Number(row.assists_per_appearance ?? 0),
  }));
}

/**
 * Disciplinary leaderboard.
 * Counts yellow and red cards separately per player.
 * Sorted by weighted score: (yellowCards + redCards * 2) DESC, then yellowCards DESC.
 */
export async function getDisciplinaryLeaderboard(
  leagueId: number,
  season: string,
  limit: number = 20
): Promise<LeaderboardDisciplinaryRow[]> {
  const db = getDb();

  const rows = await db.execute(sql`
    SELECT
      p.id AS player_id,
      p.name AS player_name,
      p.photo_url AS player_photo_url,
      t.id AS team_id,
      t.name AS team_name,
      t.logo_url AS team_logo_url,
      COUNT(CASE WHEN fe.type = 'yellow_card' THEN 1 END) AS yellow_cards,
      COUNT(CASE WHEN fe.type = 'red_card' THEN 1 END) AS red_cards,
      (
        SELECT COUNT(DISTINCT fe2.fixture_id)
        FROM fixture_events fe2
        INNER JOIN fixtures f2 ON fe2.fixture_id = f2.id
        WHERE fe2.player_id = p.id
          AND f2.league_id = ${leagueId}
          AND f2.season = ${season}
      ) AS appearances
    FROM fixture_events fe
    INNER JOIN fixtures f ON fe.fixture_id = f.id
    INNER JOIN players p ON fe.player_id = p.id
    INNER JOIN teams t ON p.team_id = t.id
    WHERE f.league_id = ${leagueId}
      AND f.season = ${season}
      AND fe.player_id IS NOT NULL
      AND fe.type IN ('yellow_card', 'red_card')
    GROUP BY p.id, p.name, p.photo_url, t.id, t.name, t.logo_url
    ORDER BY
      (COUNT(CASE WHEN fe.type = 'yellow_card' THEN 1 END) +
       COUNT(CASE WHEN fe.type = 'red_card' THEN 1 END) * 2) DESC,
      COUNT(CASE WHEN fe.type = 'yellow_card' THEN 1 END) DESC
    LIMIT ${limit}
  `);

  return rows.rows.map((row: Record<string, unknown>) => ({
    playerId: Number(row.player_id),
    playerName: String(row.player_name),
    playerPhotoUrl: row.player_photo_url ? String(row.player_photo_url) : null,
    teamId: Number(row.team_id),
    teamName: String(row.team_name),
    teamLogoUrl: row.team_logo_url ? String(row.team_logo_url) : null,
    yellowCards: Number(row.yellow_cards),
    redCards: Number(row.red_cards),
    appearances: Number(row.appearances),
  }));
}
