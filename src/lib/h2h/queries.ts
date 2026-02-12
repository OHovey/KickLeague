// Head-to-head data queries for H2H comparison pages.
//
// Queries fixtures between two teams, computes aggregate records,
// fetches current form/position, and identifies qualifying pairs
// (3+ meetings threshold for thin content guard).

import { sql } from 'drizzle-orm';
import { getDb } from '@/db/connection';

// -- Types -------------------------------------------------------------------

export interface H2HMeeting {
  fixtureId: number;
  kickoff: string;
  matchweek: number | null;
  venue: string | null;
  homeTeamId: number;
  homeTeamName: string;
  homeTeamSlug: string;
  homeTeamLogoUrl: string | null;
  awayTeamId: number;
  awayTeamName: string;
  awayTeamSlug: string;
  awayTeamLogoUrl: string | null;
  homeScore: number | null;
  awayScore: number | null;
}

export interface H2HAggregateRecord {
  team1Wins: number;
  team2Wins: number;
  draws: number;
  team1Goals: number;
  team2Goals: number;
  totalMeetings: number;
}

export interface TeamFormAndPosition {
  teamId: number;
  teamName: string;
  teamSlug: string;
  teamLogoUrl: string | null;
  leagueSlug: string;
  leagueName: string;
  position: number;
  played: number;
  points: number;
  form: string | null;
}

export interface H2HTeamPair {
  team1Slug: string;
  team2Slug: string;
}

export interface H2HOpponentLink {
  opponentName: string;
  opponentSlug: string;
  opponentLogoUrl: string | null;
  matchupSlug: string;
  meetingCount: number;
}

// -- Queries -----------------------------------------------------------------

/**
 * Fetch all finished meetings between two teams (by slug).
 * Returns meetings ordered by kickoff DESC (most recent first).
 */
export async function getH2HMeetings(
  team1Slug: string,
  team2Slug: string
): Promise<H2HMeeting[]> {
  const db = getDb();

  const rows = await db.execute(sql`
    SELECT
      f.id AS fixture_id,
      f.kickoff,
      f.matchweek,
      f.venue,
      f.home_team_id,
      ht.name AS home_team_name,
      ht.slug AS home_team_slug,
      ht.logo_url AS home_team_logo_url,
      f.away_team_id,
      at2.name AS away_team_name,
      at2.slug AS away_team_slug,
      at2.logo_url AS away_team_logo_url,
      f.home_score,
      f.away_score
    FROM fixtures f
    INNER JOIN teams ht ON f.home_team_id = ht.id
    INNER JOIN teams at2 ON f.away_team_id = at2.id
    WHERE f.status = 'finished'
      AND (
        (ht.slug = ${team1Slug} AND at2.slug = ${team2Slug})
        OR (ht.slug = ${team2Slug} AND at2.slug = ${team1Slug})
      )
    ORDER BY f.kickoff DESC
  `);

  return (rows.rows as Record<string, unknown>[]).map((row) => ({
    fixtureId: Number(row.fixture_id),
    kickoff: String(row.kickoff),
    matchweek: row.matchweek != null ? Number(row.matchweek) : null,
    venue: row.venue ? String(row.venue) : null,
    homeTeamId: Number(row.home_team_id),
    homeTeamName: String(row.home_team_name),
    homeTeamSlug: String(row.home_team_slug),
    homeTeamLogoUrl: row.home_team_logo_url
      ? String(row.home_team_logo_url)
      : null,
    awayTeamId: Number(row.away_team_id),
    awayTeamName: String(row.away_team_name),
    awayTeamSlug: String(row.away_team_slug),
    awayTeamLogoUrl: row.away_team_logo_url
      ? String(row.away_team_logo_url)
      : null,
    homeScore: row.home_score != null ? Number(row.home_score) : null,
    awayScore: row.away_score != null ? Number(row.away_score) : null,
  }));
}

/**
 * Pure function: compute aggregate record from meetings.
 * team1Id/team2Id follow the URL slug order (first team = team1).
 */
export function getH2HAggregateRecord(
  meetings: H2HMeeting[],
  team1Id: number,
  team2Id: number
): H2HAggregateRecord {
  let team1Wins = 0;
  let team2Wins = 0;
  let draws = 0;
  let team1Goals = 0;
  let team2Goals = 0;

  for (const m of meetings) {
    const hs = m.homeScore ?? 0;
    const as_ = m.awayScore ?? 0;

    // Determine which score belongs to which team
    const t1Goals = m.homeTeamId === team1Id ? hs : as_;
    const t2Goals = m.homeTeamId === team1Id ? as_ : hs;

    team1Goals += t1Goals;
    team2Goals += t2Goals;

    if (t1Goals > t2Goals) {
      team1Wins++;
    } else if (t2Goals > t1Goals) {
      team2Wins++;
    } else {
      draws++;
    }
  }

  return {
    team1Wins,
    team2Wins,
    draws,
    team1Goals,
    team2Goals,
    totalMeetings: meetings.length,
  };
}

/**
 * Fetch current form and league position for a team by slug.
 * Uses the latest matchweek in standings for the team's current season.
 */
export async function getTeamFormAndPosition(
  teamSlug: string
): Promise<TeamFormAndPosition | null> {
  const db = getDb();

  const rows = await db.execute(sql`
    SELECT
      t.id AS team_id,
      t.name AS team_name,
      t.slug AS team_slug,
      t.logo_url AS team_logo_url,
      l.slug AS league_slug,
      l.name AS league_name,
      s.position,
      s.played,
      s.points,
      s.form
    FROM standings s
    INNER JOIN teams t ON s.team_id = t.id
    INNER JOIN leagues l ON s.league_id = l.id
    WHERE t.slug = ${teamSlug}
      AND s.season = l.current_season
      AND s.matchweek = (
        SELECT MAX(s2.matchweek)
        FROM standings s2
        WHERE s2.league_id = l.id
          AND s2.season = l.current_season
      )
    LIMIT 1
  `);

  if (rows.rows.length === 0) {
    return null;
  }

  const row = rows.rows[0] as Record<string, unknown>;

  return {
    teamId: Number(row.team_id),
    teamName: String(row.team_name),
    teamSlug: String(row.team_slug),
    teamLogoUrl: row.team_logo_url ? String(row.team_logo_url) : null,
    leagueSlug: String(row.league_slug),
    leagueName: String(row.league_name),
    position: Number(row.position),
    played: Number(row.played),
    points: Number(row.points),
    form: row.form ? String(row.form) : null,
  };
}

/**
 * Get all team pairs with 3+ finished meetings.
 * LEAST/GREATEST ensures each pair is counted once regardless of home/away.
 * Slugs are returned in alphabetical order for canonical URL consistency.
 */
export async function getQualifyingH2HPairs(): Promise<H2HTeamPair[]> {
  const db = getDb();

  const rows = await db.execute(sql`
    SELECT t1.slug AS team1_slug, t2.slug AS team2_slug
    FROM fixtures f
    INNER JOIN teams t1 ON LEAST(f.home_team_id, f.away_team_id) = t1.id
    INNER JOIN teams t2 ON GREATEST(f.home_team_id, f.away_team_id) = t2.id
    WHERE f.status = 'finished'
    GROUP BY t1.slug, t2.slug
    HAVING COUNT(*) >= 3
    ORDER BY t1.slug, t2.slug
  `);

  return (rows.rows as Record<string, unknown>[]).map((row) => {
    const slug1 = String(row.team1_slug);
    const slug2 = String(row.team2_slug);
    // Ensure alphabetical order for canonical URLs
    return slug1 < slug2
      ? { team1Slug: slug1, team2Slug: slug2 }
      : { team1Slug: slug2, team2Slug: slug1 };
  });
}

/**
 * Get qualifying H2H opponents for a specific team (3+ meetings).
 * Returns up to `limit` opponents sorted by meeting count descending.
 * Used for team page cross-links to H2H pages.
 */
export async function getH2HPairsForTeam(
  teamSlug: string,
  limit = 5
): Promise<H2HOpponentLink[]> {
  const db = getDb();

  const rows = await db.execute(sql`
    SELECT
      opp.name AS opponent_name,
      opp.slug AS opponent_slug,
      opp.logo_url AS opponent_logo_url,
      COUNT(*) AS meeting_count
    FROM fixtures f
    INNER JOIN teams t ON (t.id = f.home_team_id OR t.id = f.away_team_id)
    INNER JOIN teams opp ON (
      (opp.id = f.home_team_id OR opp.id = f.away_team_id) AND opp.id != t.id
    )
    WHERE f.status = 'finished'
      AND t.slug = ${teamSlug}
    GROUP BY opp.id, opp.name, opp.slug, opp.logo_url
    HAVING COUNT(*) >= 3
    ORDER BY COUNT(*) DESC
    LIMIT ${limit}
  `);

  return (rows.rows as Record<string, unknown>[]).map((row) => {
    const oppSlug = String(row.opponent_slug);
    // Build canonical matchup slug (alphabetical order)
    const matchupSlug = teamSlug < oppSlug
      ? `${teamSlug}-vs-${oppSlug}`
      : `${oppSlug}-vs-${teamSlug}`;

    return {
      opponentName: String(row.opponent_name),
      opponentSlug: oppSlug,
      opponentLogoUrl: row.opponent_logo_url
        ? String(row.opponent_logo_url)
        : null,
      matchupSlug,
      meetingCount: Number(row.meeting_count),
    };
  });
}
