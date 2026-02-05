// Team database queries for team detail pages

import { eq, and, asc, desc, max, inArray, gte, lte } from 'drizzle-orm';
import { getDb, isDatabaseConfigured } from '@/db/connection';
import { teams, leagues, standings } from '@/db/schema';

// ── Types ──────────────────────────────────────────────────────────────────

export interface TeamWithLeague {
  id: number;
  apiId: number;
  name: string;
  shortName: string | null;
  slug: string;
  logoUrl: string | null;
  stadiumName: string | null;
  leagueId: number;
  leagueSlug: string;
  leagueName: string;
  currentSeason: string;
}

export interface TeamCurrentStandings {
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string | null;
  homeWon: number;
  homeDrawn: number;
  homeLost: number;
  homeGoalsFor: number;
  homeGoalsAgainst: number;
  awayWon: number;
  awayDrawn: number;
  awayLost: number;
  awayGoalsFor: number;
  awayGoalsAgainst: number;
}

export interface PositionHistoryPoint {
  matchweek: number;
  [teamName: string]: number;
}

export interface CumulativePointsPoint {
  matchweek: number;
  points: number;
}

// ── Queries ────────────────────────────────────────────────────────────────

/**
 * Fetch a team by slug, joining with leagues to get league context.
 */
export async function getTeamBySlug(
  slug: string
): Promise<TeamWithLeague | null> {
  if (!isDatabaseConfigured()) return null;

  const rows = await getDb()
    .select({
      id: teams.id,
      apiId: teams.apiId,
      name: teams.name,
      shortName: teams.shortName,
      slug: teams.slug,
      logoUrl: teams.logoUrl,
      stadiumName: teams.stadiumName,
      leagueId: teams.leagueId,
      leagueSlug: leagues.slug,
      leagueName: leagues.name,
      currentSeason: leagues.currentSeason,
    })
    .from(teams)
    .innerJoin(leagues, eq(teams.leagueId, leagues.id))
    .where(eq(teams.slug, slug))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Fetch the latest matchweek standings row for a specific team.
 * Finds max matchweek first, then fetches that row.
 */
export async function getTeamCurrentStandings(
  teamId: number,
  leagueId: number,
  season: string
): Promise<TeamCurrentStandings | null> {
  if (!isDatabaseConfigured()) return null;

  // Find max matchweek
  const maxResult = await getDb()
    .select({ maxWeek: max(standings.matchweek) })
    .from(standings)
    .where(
      and(eq(standings.leagueId, leagueId), eq(standings.season, season))
    );

  const maxWeek = maxResult[0]?.maxWeek;
  if (!maxWeek) return null;

  // Fetch that row for the team
  const rows = await getDb()
    .select({
      position: standings.position,
      played: standings.played,
      won: standings.won,
      drawn: standings.drawn,
      lost: standings.lost,
      goalsFor: standings.goalsFor,
      goalsAgainst: standings.goalsAgainst,
      goalDifference: standings.goalDifference,
      points: standings.points,
      form: standings.form,
      homeWon: standings.homeWon,
      homeDrawn: standings.homeDrawn,
      homeLost: standings.homeLost,
      homeGoalsFor: standings.homeGoalsFor,
      homeGoalsAgainst: standings.homeGoalsAgainst,
      awayWon: standings.awayWon,
      awayDrawn: standings.awayDrawn,
      awayLost: standings.awayLost,
      awayGoalsFor: standings.awayGoalsFor,
      awayGoalsAgainst: standings.awayGoalsAgainst,
    })
    .from(standings)
    .where(
      and(
        eq(standings.leagueId, leagueId),
        eq(standings.season, season),
        eq(standings.matchweek, maxWeek),
        eq(standings.teamId, teamId)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Fetch ALL matchweek positions for given teamIds.
 * Returns data shaped for the bump chart:
 * Array<{ matchweek: number; [teamName: string]: number }>
 */
export async function getPositionHistory(
  leagueId: number,
  season: string,
  teamIds: number[]
): Promise<PositionHistoryPoint[]> {
  if (!isDatabaseConfigured()) return [];
  if (teamIds.length === 0) return [];

  const rows = await getDb()
    .select({
      matchweek: standings.matchweek,
      teamName: teams.name,
      position: standings.position,
    })
    .from(standings)
    .innerJoin(teams, eq(standings.teamId, teams.id))
    .where(
      and(
        eq(standings.leagueId, leagueId),
        eq(standings.season, season),
        inArray(standings.teamId, teamIds)
      )
    )
    .orderBy(asc(standings.matchweek));

  // Pivot: group by matchweek, each entry has matchweek + team name keys with position values
  const chartData: Record<number, Record<string, number>> = {};
  for (const row of rows) {
    if (!chartData[row.matchweek]) {
      chartData[row.matchweek] = { matchweek: row.matchweek };
    }
    chartData[row.matchweek][row.teamName] = row.position;
  }

  return Object.values(chartData) as PositionHistoryPoint[];
}

/**
 * Fetch all matchweek standings for a team, ordered by matchweek asc.
 * Returns cumulative points per matchweek (already cumulative in standings table).
 */
export async function getCumulativePoints(
  teamId: number,
  leagueId: number,
  season: string
): Promise<CumulativePointsPoint[]> {
  if (!isDatabaseConfigured()) return [];

  const rows = await getDb()
    .select({
      matchweek: standings.matchweek,
      points: standings.points,
    })
    .from(standings)
    .where(
      and(
        eq(standings.leagueId, leagueId),
        eq(standings.season, season),
        eq(standings.teamId, teamId)
      )
    )
    .orderBy(asc(standings.matchweek));

  return rows;
}

/**
 * Find teams within +/- range positions of the focus team at the latest matchweek.
 * Returns array of team IDs (excluding the focus team).
 */
export async function getRivalTeamIds(
  teamId: number,
  leagueId: number,
  season: string,
  range: number = 3
): Promise<number[]> {
  if (!isDatabaseConfigured()) return [];

  // Find max matchweek
  const maxResult = await getDb()
    .select({ maxWeek: max(standings.matchweek) })
    .from(standings)
    .where(
      and(eq(standings.leagueId, leagueId), eq(standings.season, season))
    );

  const maxWeek = maxResult[0]?.maxWeek;
  if (!maxWeek) return [];

  // Find focus team's position
  const focusRows = await getDb()
    .select({ position: standings.position })
    .from(standings)
    .where(
      and(
        eq(standings.leagueId, leagueId),
        eq(standings.season, season),
        eq(standings.matchweek, maxWeek),
        eq(standings.teamId, teamId)
      )
    )
    .limit(1);

  const focusPosition = focusRows[0]?.position;
  if (!focusPosition) return [];

  // Find teams within +/- range positions
  const rivalRows = await getDb()
    .select({ teamId: standings.teamId })
    .from(standings)
    .where(
      and(
        eq(standings.leagueId, leagueId),
        eq(standings.season, season),
        eq(standings.matchweek, maxWeek),
        gte(standings.position, Math.max(1, focusPosition - range)),
        lte(standings.position, focusPosition + range)
      )
    );

  return rivalRows
    .map((r) => r.teamId)
    .filter((id) => id !== teamId);
}
