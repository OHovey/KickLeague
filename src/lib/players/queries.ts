// Player profile database queries.
//
// Note on "appearances": Same approach as leaderboard queries -- approximated
// as the number of distinct fixtures where the player had at least one event
// (as player_id or assist_player_id). Players who play full matches without
// any recorded event won't be counted.

import { sql } from 'drizzle-orm';
import { getDb } from '@/db/connection';

// -- Types -------------------------------------------------------------------

export interface PlayerProfile {
  id: number;
  apiId: number;
  name: string;
  slug: string;
  firstName: string | null;
  lastName: string | null;
  position: string | null;
  number: number | null;
  nationality: string | null;
  photoUrl: string | null;
  age: number | null;
  height: string | null;
  weight: string | null;
  teamId: number;
  teamName: string;
  teamSlug: string;
  teamLogoUrl: string | null;
  leagueId: number;
  leagueName: string;
  leagueSlug: string;
  leagueLogoUrl: string | null;
  currentSeason: string;
  appearances: number;
}

export interface PlayerSeasonStats {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  appearances: number;
}

export interface PlayerMatchEvent {
  type: string;
  minute: number;
  extraMinute: number | null;
}

export interface PlayerMatchInvolvement {
  fixtureId: number;
  kickoff: string;
  matchweek: number | null;
  homeTeamName: string;
  homeTeamLogoUrl: string | null;
  awayTeamName: string;
  awayTeamLogoUrl: string | null;
  homeScore: number | null;
  awayScore: number | null;
  events: PlayerMatchEvent[];
}

// -- Queries -----------------------------------------------------------------

/**
 * Fetch a player profile by slug, including team and league info.
 * Returns null if player not found OR if player has fewer than 5 appearances
 * (thin content guard for SEO).
 */
export async function getPlayerBySlug(
  slug: string
): Promise<PlayerProfile | null> {
  const db = getDb();

  const rows = await db.execute(sql`
    SELECT
      p.id,
      p.api_id,
      p.name,
      p.slug,
      p.first_name,
      p.last_name,
      p.position,
      p.number,
      p.nationality,
      p.photo_url,
      p.age,
      p.height,
      p.weight,
      t.id AS team_id,
      t.name AS team_name,
      t.slug AS team_slug,
      t.logo_url AS team_logo_url,
      l.id AS league_id,
      l.name AS league_name,
      l.slug AS league_slug,
      l.logo_url AS league_logo_url,
      l.current_season,
      (
        SELECT COUNT(DISTINCT fe.fixture_id)
        FROM fixture_events fe
        INNER JOIN fixtures f ON fe.fixture_id = f.id
        WHERE (fe.player_id = p.id OR fe.assist_player_id = p.id)
          AND f.league_id = l.id
          AND f.season = l.current_season
      ) AS appearances
    FROM players p
    INNER JOIN teams t ON p.team_id = t.id
    INNER JOIN leagues l ON t.league_id = l.id
    WHERE p.slug = ${slug}
  `);

  if (rows.rows.length === 0) {
    return null;
  }

  const row = rows.rows[0] as Record<string, unknown>;
  const appearances = Number(row.appearances);

  // Thin content guard: require at least 5 appearances
  if (appearances < 5) {
    return null;
  }

  return {
    id: Number(row.id),
    apiId: Number(row.api_id),
    name: String(row.name),
    slug: String(row.slug),
    firstName: row.first_name ? String(row.first_name) : null,
    lastName: row.last_name ? String(row.last_name) : null,
    position: row.position ? String(row.position) : null,
    number: row.number != null ? Number(row.number) : null,
    nationality: row.nationality ? String(row.nationality) : null,
    photoUrl: row.photo_url ? String(row.photo_url) : null,
    age: row.age != null ? Number(row.age) : null,
    height: row.height ? String(row.height) : null,
    weight: row.weight ? String(row.weight) : null,
    teamId: Number(row.team_id),
    teamName: String(row.team_name),
    teamSlug: String(row.team_slug),
    teamLogoUrl: row.team_logo_url ? String(row.team_logo_url) : null,
    leagueId: Number(row.league_id),
    leagueName: String(row.league_name),
    leagueSlug: String(row.league_slug),
    leagueLogoUrl: row.league_logo_url ? String(row.league_logo_url) : null,
    currentSeason: String(row.current_season),
    appearances,
  };
}

/**
 * Fetch aggregate season stats for a player.
 */
export async function getPlayerSeasonStats(
  playerId: number,
  leagueId: number,
  season: string
): Promise<PlayerSeasonStats> {
  const db = getDb();

  const rows = await db.execute(sql`
    SELECT
      COUNT(CASE WHEN fe.player_id = ${playerId} AND fe.type IN ('goal', 'penalty_scored') THEN 1 END) AS goals,
      COUNT(CASE WHEN fe.assist_player_id = ${playerId} AND fe.type IN ('goal', 'penalty_scored') THEN 1 END) AS assists,
      COUNT(CASE WHEN fe.player_id = ${playerId} AND fe.type = 'yellow_card' THEN 1 END) AS yellow_cards,
      COUNT(CASE WHEN fe.player_id = ${playerId} AND fe.type = 'red_card' THEN 1 END) AS red_cards,
      (
        SELECT COUNT(DISTINCT fe2.fixture_id)
        FROM fixture_events fe2
        INNER JOIN fixtures f2 ON fe2.fixture_id = f2.id
        WHERE (fe2.player_id = ${playerId} OR fe2.assist_player_id = ${playerId})
          AND f2.league_id = ${leagueId}
          AND f2.season = ${season}
      ) AS appearances
    FROM fixture_events fe
    INNER JOIN fixtures f ON fe.fixture_id = f.id
    WHERE (fe.player_id = ${playerId} OR fe.assist_player_id = ${playerId})
      AND f.league_id = ${leagueId}
      AND f.season = ${season}
  `);

  const row = rows.rows[0] as Record<string, unknown>;

  return {
    goals: Number(row.goals ?? 0),
    assists: Number(row.assists ?? 0),
    yellowCards: Number(row.yellow_cards ?? 0),
    redCards: Number(row.red_cards ?? 0),
    appearances: Number(row.appearances ?? 0),
  };
}

/**
 * Fetch last N matches a player was involved in, with their events in each.
 */
export async function getPlayerRecentMatches(
  playerId: number,
  leagueId: number,
  season: string,
  limit: number = 10
): Promise<PlayerMatchInvolvement[]> {
  const db = getDb();

  // Step 1: get distinct fixture_ids where player has events, ordered by kickoff DESC
  const fixtureRows = await db.execute(sql`
    SELECT DISTINCT f.id AS fixture_id, f.kickoff
    FROM fixture_events fe
    INNER JOIN fixtures f ON fe.fixture_id = f.id
    WHERE (fe.player_id = ${playerId} OR fe.assist_player_id = ${playerId})
      AND f.league_id = ${leagueId}
      AND f.season = ${season}
    ORDER BY f.kickoff DESC
    LIMIT ${limit}
  `);

  if (fixtureRows.rows.length === 0) {
    return [];
  }

  const fixtureIds = fixtureRows.rows.map(
    (r: Record<string, unknown>) => Number(r.fixture_id)
  );

  // Step 2: get match details + player events for those fixtures
  const idList = sql.join(fixtureIds.map((id) => sql`${id}`), sql`, `);

  const matchRows = await db.execute(sql`
    SELECT
      f.id AS fixture_id,
      f.kickoff,
      f.matchweek,
      ht.name AS home_team_name,
      ht.logo_url AS home_team_logo_url,
      at.name AS away_team_name,
      at.logo_url AS away_team_logo_url,
      f.home_score,
      f.away_score
    FROM fixtures f
    INNER JOIN teams ht ON f.home_team_id = ht.id
    INNER JOIN teams at ON f.away_team_id = at.id
    WHERE f.id IN (${idList})
    ORDER BY f.kickoff DESC
  `);

  const eventRows = await db.execute(sql`
    SELECT
      fe.fixture_id,
      fe.type,
      fe.minute,
      fe.extra_minute
    FROM fixture_events fe
    WHERE fe.fixture_id IN (${idList})
      AND (fe.player_id = ${playerId} OR fe.assist_player_id = ${playerId})
    ORDER BY fe.fixture_id, fe.minute
  `);

  // Group events by fixture_id
  const eventsByFixture = new Map<number, PlayerMatchEvent[]>();
  for (const row of eventRows.rows as Record<string, unknown>[]) {
    const fid = Number(row.fixture_id);
    if (!eventsByFixture.has(fid)) {
      eventsByFixture.set(fid, []);
    }
    eventsByFixture.get(fid)!.push({
      type: String(row.type),
      minute: Number(row.minute),
      extraMinute: row.extra_minute != null ? Number(row.extra_minute) : null,
    });
  }

  return (matchRows.rows as Record<string, unknown>[]).map((row) => ({
    fixtureId: Number(row.fixture_id),
    kickoff: String(row.kickoff),
    matchweek: row.matchweek != null ? Number(row.matchweek) : null,
    homeTeamName: String(row.home_team_name),
    homeTeamLogoUrl: row.home_team_logo_url
      ? String(row.home_team_logo_url)
      : null,
    awayTeamName: String(row.away_team_name),
    awayTeamLogoUrl: row.away_team_logo_url
      ? String(row.away_team_logo_url)
      : null,
    homeScore: row.home_score != null ? Number(row.home_score) : null,
    awayScore: row.away_score != null ? Number(row.away_score) : null,
    events: eventsByFixture.get(Number(row.fixture_id)) ?? [],
  }));
}

/**
 * Get slugs of all players with 5+ appearances in the current season.
 * Used for generateStaticParams and sitemap.
 */
export async function getQualifyingPlayerSlugs(): Promise<string[]> {
  const db = getDb();

  const rows = await db.execute(sql`
    SELECT p.slug
    FROM players p
    INNER JOIN teams t ON p.team_id = t.id
    INNER JOIN leagues l ON t.league_id = l.id
    INNER JOIN fixture_events fe ON (fe.player_id = p.id OR fe.assist_player_id = p.id)
    INNER JOIN fixtures f ON fe.fixture_id = f.id AND f.league_id = l.id AND f.season = l.current_season
    GROUP BY p.id, p.slug
    HAVING COUNT(DISTINCT fe.fixture_id) >= 5
    ORDER BY p.slug
  `);

  return rows.rows.map((r: Record<string, unknown>) => String(r.slug));
}
