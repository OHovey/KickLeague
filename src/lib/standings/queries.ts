// Standings database queries with zone and tiebreaker integration

import { eq, and, desc, max } from 'drizzle-orm';
import { db } from '@/db/connection';
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

export interface StandingsWithZones {
  standings: StandingsRow[];
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
}

/**
 * Fetch league by slug
 */
export async function getLeagueBySlug(slug: string) {
  const result = await db
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
  const result = await db
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
  const result = await db
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
  const fixtureRows = await db
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
  const result = await db
    .select({ maxWeek: max(standings.matchweek) })
    .from(standings)
    .where(and(eq(standings.leagueId, leagueId), eq(standings.season, season)));
  return result[0]?.maxWeek ?? null;
}

/**
 * Fetch standings with zones, applying tiebreakers for proper ordering.
 * This is the main query used by the LeagueTable component.
 */
export async function getStandingsWithZones(
  leagueSlug: string,
  season?: string
): Promise<StandingsWithZones> {
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

  // 4. Get the latest matchweek with data
  const matchweek = await getLatestMatchweek(league.id, targetSeason);
  if (matchweek === null) {
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
  const standingsRows = await db
    .select({
      teamId: standings.teamId,
      teamName: teams.name,
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
        eq(standings.matchweek, matchweek)
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

  return {
    standings: sortedStandings,
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
    matchweek,
  };
}
