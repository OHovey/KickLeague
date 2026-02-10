// Standings database queries with zone and tiebreaker integration

import { eq, and, desc, max, gte, asc, lte } from 'drizzle-orm';
import { getDb, isDatabaseConfigured } from '@/db/connection';
import {
  leagues,
  leagueConfig,
  leagueZones,
  standings,
  fixtures,
  teams,
} from '@/db/schema';
import {
  calculateStandings,
  type StandingsRow,
  type H2HMatrix,
} from './calculate';
import type { Zone } from '@/lib/zones';
import type { SparklineDataPoint } from '@/components/league-table/Sparkline';

export interface EnhancedStandingsRow extends StandingsRow {
  positionChange: number;
  sparklineData: SparklineDataPoint[];
}

export interface StandingsWithZones {
  standings: EnhancedStandingsRow[];
  zones: Zone[];
  config: {
    teamCount: number;
    tiebreakerOrder: string;
    matchweeksTotal: number;
    hasXg: boolean;
  } | null;
  league: {
    id: number;
    name: string;
    slug: string;
    currentSeason: string;
  } | null;
  matchweek: number | null;
  error?: 'database_not_configured' | 'league_not_found';
}

/**
 * Fetch league by slug
 */
export async function getLeagueBySlug(slug: string) {
  const result = await getDb()
    .select()
    .from(leagues)
    .where(eq(leagues.slug, slug))
    .limit(1);
  return result[0] ?? null;
}

/**
 * Fetch league config for a given league and season
 */
export async function getLeagueConfig(leagueId: number, season: string) {
  const result = await getDb()
    .select()
    .from(leagueConfig)
    .where(and(eq(leagueConfig.leagueId, leagueId), eq(leagueConfig.season, season)))
    .limit(1);
  return result[0] ?? null;
}

/**
 * Fetch all zones for a league and season
 */
export async function getLeagueZones(leagueId: number, season: string): Promise<Zone[]> {
  const result = await getDb()
    .select({
      zoneType: leagueZones.zoneType,
      startPosition: leagueZones.startPosition,
      endPosition: leagueZones.endPosition,
      color: leagueZones.color,
    })
    .from(leagueZones)
    .where(and(eq(leagueZones.leagueId, leagueId), eq(leagueZones.season, season)));

  return result as Zone[];
}

/**
 * Build H2H matrix from finished fixtures.
 * For each pair of teams, records points, goal difference, and goals for.
 */
async function buildH2HMatrix(leagueId: number, season: string): Promise<H2HMatrix> {
  // Fetch all finished fixtures for the season
  const fixtureRows = await getDb()
    .select({
      homeTeamId: fixtures.homeTeamId,
      awayTeamId: fixtures.awayTeamId,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
    })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.season, season),
        eq(fixtures.status, 'finished')
      )
    );

  const matrix: H2HMatrix = {};

  for (const f of fixtureRows) {
    if (f.homeScore === null || f.awayScore === null) continue;

    const homePoints = f.homeScore > f.awayScore ? 3 : f.homeScore === f.awayScore ? 1 : 0;
    const awayPoints = f.awayScore > f.homeScore ? 3 : f.awayScore === f.homeScore ? 1 : 0;

    // Home team's record against away team
    if (!matrix[f.homeTeamId]) matrix[f.homeTeamId] = {};
    const homeVsAway = matrix[f.homeTeamId][f.awayTeamId] || {
      points: 0,
      goalDifference: 0,
      goalsFor: 0,
    };
    homeVsAway.points += homePoints;
    homeVsAway.goalDifference += f.homeScore - f.awayScore;
    homeVsAway.goalsFor += f.homeScore;
    matrix[f.homeTeamId][f.awayTeamId] = homeVsAway;

    // Away team's record against home team
    if (!matrix[f.awayTeamId]) matrix[f.awayTeamId] = {};
    const awayVsHome = matrix[f.awayTeamId][f.homeTeamId] || {
      points: 0,
      goalDifference: 0,
      goalsFor: 0,
    };
    awayVsHome.points += awayPoints;
    awayVsHome.goalDifference += f.awayScore - f.homeScore;
    awayVsHome.goalsFor += f.awayScore;
    matrix[f.awayTeamId][f.homeTeamId] = awayVsHome;
  }

  return matrix;
}

/**
 * Get the latest matchweek for a league and season
 */
async function getLatestMatchweek(leagueId: number, season: string): Promise<number | null> {
  const result = await getDb()
    .select({ maxWeek: max(standings.matchweek) })
    .from(standings)
    .where(and(eq(standings.leagueId, leagueId), eq(standings.season, season)));
  return result[0]?.maxWeek ?? null;
}

/**
 * Get sparkline data for a specific team - last 10 matchweeks of position data.
 * Returns array of { matchweek, position } sorted by matchweek ascending.
 */
async function getSparklineData(
  leagueId: number,
  season: string,
  teamId: number,
  currentMatchweek: number
): Promise<SparklineDataPoint[]> {
  const startMatchweek = Math.max(1, currentMatchweek - 9);

  const result = await getDb()
    .select({
      matchweek: standings.matchweek,
      position: standings.position,
    })
    .from(standings)
    .where(
      and(
        eq(standings.leagueId, leagueId),
        eq(standings.season, season),
        eq(standings.teamId, teamId),
        gte(standings.matchweek, startMatchweek),
        lte(standings.matchweek, currentMatchweek)
      )
    )
    .orderBy(asc(standings.matchweek));

  return result;
}

/**
 * Get position change for teams from previous matchweek.
 * Returns a map of teamId -> position change (positive = moved up).
 */
async function getPositionChanges(
  leagueId: number,
  season: string,
  currentMatchweek: number
): Promise<Map<number, number>> {
  const positionChanges = new Map<number, number>();

  // Find the actual previous matchweek that has data (not hardcoded currentMatchweek - 1)
  const prevResult = await getDb()
    .select({ maxWeek: max(standings.matchweek) })
    .from(standings)
    .where(
      and(
        eq(standings.leagueId, leagueId),
        eq(standings.season, season),
        lte(standings.matchweek, currentMatchweek - 1)
      )
    );
  const previousMatchweek = prevResult[0]?.maxWeek;

  if (previousMatchweek === null || previousMatchweek === undefined) {
    return positionChanges; // No earlier matchweek exists
  }

  // Get current positions
  const currentPositions = await getDb()
    .select({
      teamId: standings.teamId,
      position: standings.position,
    })
    .from(standings)
    .where(
      and(
        eq(standings.leagueId, leagueId),
        eq(standings.season, season),
        eq(standings.matchweek, currentMatchweek)
      )
    );

  // Get previous matchweek positions (using actual previous matchweek with data)
  const previousPositions = await getDb()
    .select({
      teamId: standings.teamId,
      position: standings.position,
    })
    .from(standings)
    .where(
      and(
        eq(standings.leagueId, leagueId),
        eq(standings.season, season),
        eq(standings.matchweek, previousMatchweek)
      )
    );

  const prevPosMap = new Map(previousPositions.map(p => [p.teamId, p.position]));

  for (const current of currentPositions) {
    const prevPos = prevPosMap.get(current.teamId);
    if (prevPos !== undefined) {
      // Positive change = moved up (lower position number is better)
      positionChanges.set(current.teamId, prevPos - current.position);
    } else {
      positionChanges.set(current.teamId, 0);
    }
  }

  return positionChanges;
}

export interface MatchweekListResult {
  matchweeks: Array<{ number: number; completed: boolean }>;
  latestCompleted: number;
  season: string;
  config: { matchweeksTotal: number } | null;
}

/**
 * Get list of matchweeks for a league with completed/upcoming status.
 * Returns an array of matchweeks with their completion status and the latest completed matchweek number.
 */
export async function getMatchweekList(
  leagueSlug: string,
  season?: string
): Promise<MatchweekListResult> {
  if (!isDatabaseConfigured()) {
    return { matchweeks: [], latestCompleted: 0, season: season ?? new Date().getFullYear().toString(), config: null };
  }

  const league = await getLeagueBySlug(leagueSlug);
  if (!league) {
    return { matchweeks: [], latestCompleted: 0, season: season ?? new Date().getFullYear().toString(), config: null };
  }

  const targetSeason = season ?? league.currentSeason;
  const config = await getLeagueConfig(league.id, targetSeason);

  // Query distinct matchweeks that have standings data
  const completedRows = await getDb()
    .selectDistinct({ matchweek: standings.matchweek })
    .from(standings)
    .where(
      and(
        eq(standings.leagueId, league.id),
        eq(standings.season, targetSeason)
      )
    )
    .orderBy(asc(standings.matchweek));

  const completedSet = new Set(completedRows.map(r => r.matchweek));
  const matchweeksTotal = config?.matchweeksTotal ?? 38;
  const latestCompleted = completedRows.length > 0
    ? completedRows[completedRows.length - 1].matchweek
    : 0;

  const matchweeks: Array<{ number: number; completed: boolean }> = [];
  for (let i = 1; i <= matchweeksTotal; i++) {
    matchweeks.push({ number: i, completed: completedSet.has(i) });
  }

  return {
    matchweeks,
    latestCompleted,
    season: targetSeason,
    config: config ? { matchweeksTotal: config.matchweeksTotal } : null,
  };
}

/**
 * Fetch standings with zones, applying tiebreakers for proper ordering.
 * This is the main query used by the LeagueTable component.
 * When matchweek is provided, returns standings for that specific matchweek.
 * When not provided, uses the latest matchweek with data.
 */
export async function getStandingsWithZones(
  leagueSlug: string,
  season?: string,
  matchweek?: number
): Promise<StandingsWithZones> {
  // 0. Check if database is configured
  if (!isDatabaseConfigured()) {
    return {
      standings: [],
      zones: [],
      config: null,
      league: null,
      matchweek: null,
      error: 'database_not_configured',
    };
  }

  // 1. Fetch league by slug
  const league = await getLeagueBySlug(leagueSlug);
  if (!league) {
    return {
      standings: [],
      zones: [],
      config: null,
      league: null,
      matchweek: null,
    };
  }

  // 2. Determine season (use provided or league's current)
  const targetSeason = season ?? league.currentSeason;

  // 3. Fetch league config
  const config = await getLeagueConfig(league.id, targetSeason);

  // 4. Determine matchweek: use provided value or fall back to latest
  const resolvedMatchweek = matchweek ?? await getLatestMatchweek(league.id, targetSeason);
  if (resolvedMatchweek === null) {
    return {
      standings: [],
      zones: await getLeagueZones(league.id, targetSeason),
      config: config
        ? {
            teamCount: config.teamCount,
            tiebreakerOrder: config.tiebreakerOrder,
            matchweeksTotal: config.matchweeksTotal,
            hasXg: config.hasXg,
          }
        : null,
      league: {
        id: league.id,
        name: league.name,
        slug: league.slug,
        currentSeason: league.currentSeason,
      },
      matchweek: null,
    };
  }

  // 5. Fetch raw standings rows joined with team names
  const standingsRows = await getDb()
    .select({
      teamId: standings.teamId,
      teamName: teams.name,
      teamSlug: teams.slug,
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
    })
    .from(standings)
    .innerJoin(teams, eq(standings.teamId, teams.id))
    .where(
      and(
        eq(standings.leagueId, league.id),
        eq(standings.season, targetSeason),
        eq(standings.matchweek, resolvedMatchweek)
      )
    )
    .orderBy(desc(standings.points), standings.position);

  // 6. Fetch zones
  const zones = await getLeagueZones(league.id, targetSeason);

  // 7. Apply tiebreakers if config exists
  let sortedStandings: StandingsRow[] = standingsRows;
  if (config && standingsRows.length > 0) {
    // Build H2H matrix for H2H tiebreaker (La Liga, Serie A)
    const h2hMatrix = await buildH2HMatrix(league.id, targetSeason);
    sortedStandings = calculateStandings(standingsRows, config, h2hMatrix);
  }

  // 8. Fetch position changes
  const positionChanges = await getPositionChanges(league.id, targetSeason, resolvedMatchweek);

  // 9. Fetch sparkline data for each team (in parallel)
  const sparklinePromises = sortedStandings.map(row =>
    getSparklineData(league.id, targetSeason, row.teamId, resolvedMatchweek)
  );
  const sparklineResults = await Promise.all(sparklinePromises);

  // 10. Enhance standings with position change and sparkline data
  const enhancedStandings: EnhancedStandingsRow[] = sortedStandings.map((row, index) => ({
    ...row,
    positionChange: positionChanges.get(row.teamId) ?? 0,
    sparklineData: sparklineResults[index],
  }));

  return {
    standings: enhancedStandings,
    zones,
    config: config
      ? {
          teamCount: config.teamCount,
          tiebreakerOrder: config.tiebreakerOrder,
          matchweeksTotal: config.matchweeksTotal,
          hasXg: config.hasXg,
        }
      : null,
    league: {
      id: league.id,
      name: league.name,
      slug: league.slug,
      currentSeason: league.currentSeason,
    },
    matchweek: resolvedMatchweek,
  };
}
