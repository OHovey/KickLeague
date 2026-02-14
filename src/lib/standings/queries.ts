// Standings database queries with zone and tiebreaker integration

import { eq, and, desc, max, gte, asc, lte, sql, ne } from 'drizzle-orm';
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
export async function getLatestMatchweek(leagueId: number, season: string): Promise<number | null> {
  const result = await getDb()
    .select({ maxWeek: max(standings.matchweek) })
    .from(standings)
    .where(and(eq(standings.leagueId, leagueId), eq(standings.season, season)));
  return result[0]?.maxWeek ?? null;
}

/**
 * Detect the in-progress matchweek for a league/season.
 * An in-progress matchweek has at least one finished fixture AND at least one non-finished fixture,
 * AND is after the latest completed matchweek (to exclude earlier weeks with postponed games).
 */
export async function getInProgressMatchweek(
  leagueId: number,
  season: string,
  latestCompletedMatchweek: number
): Promise<number | null> {
  const db = getDb();

  // Get matchweeks AFTER latestCompleted that have at least one finished fixture
  const finishedRows = await db
    .selectDistinct({ matchweek: fixtures.matchweek })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.season, season),
        eq(fixtures.status, 'finished'),
        sql`${fixtures.matchweek} IS NOT NULL`,
        sql`${fixtures.matchweek} > ${latestCompletedMatchweek}`
      )
    );

  // Get matchweeks AFTER latestCompleted that have at least one non-finished fixture
  const nonFinishedRows = await db
    .selectDistinct({ matchweek: fixtures.matchweek })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.season, season),
        ne(fixtures.status, 'finished'),
        sql`${fixtures.matchweek} IS NOT NULL`,
        sql`${fixtures.matchweek} > ${latestCompletedMatchweek}`
      )
    );

  const finishedWeeks = new Set(
    finishedRows.map((r) => r.matchweek).filter((m): m is number => m !== null)
  );
  const nonFinishedWeeks = new Set(
    nonFinishedRows.map((r) => r.matchweek).filter((m): m is number => m !== null)
  );

  // In-progress = intersection (has both finished and non-finished fixtures)
  const inProgressWeeks: number[] = [];
  for (const week of finishedWeeks) {
    if (nonFinishedWeeks.has(week)) {
      inProgressWeeks.push(week);
    }
  }

  if (inProgressWeeks.length === 0) return null;
  return Math.min(...inProgressWeeks);
}

/**
 * Compute live standings on-the-fly for an in-progress matchweek.
 * Takes the last completed matchweek's standings as baseline and accumulates
 * finished fixture results from the target matchweek on top.
 */
async function computeLiveStandings(
  leagueId: number,
  season: string,
  matchweek: number
): Promise<StandingsRow[]> {
  const db = getDb();

  // 1. Get baseline standings from the last completed matchweek
  const baselineMatchweek = matchweek - 1;
  const baselineRows = baselineMatchweek >= 1
    ? await db
        .select({
          teamId: standings.teamId,
          teamName: teams.name,
          teamSlug: teams.slug,
          teamLogoUrl: teams.logoUrl,
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
            eq(standings.leagueId, leagueId),
            eq(standings.season, season),
            eq(standings.matchweek, baselineMatchweek)
          )
        )
    : [];

  // Build baseline map: teamId -> stats
  const teamStatsMap = new Map<
    number,
    {
      teamId: number;
      teamName: string;
      teamSlug: string;
      teamLogoUrl: string | null;
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDifference: number;
      points: number;
      form: string;
    }
  >();

  for (const row of baselineRows) {
    teamStatsMap.set(row.teamId, {
      teamId: row.teamId,
      teamName: row.teamName,
      teamSlug: row.teamSlug,
      teamLogoUrl: row.teamLogoUrl,
      played: row.played,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      goalDifference: row.goalDifference,
      points: row.points,
      form: row.form ?? '',
    });
  }

  // 2. Get finished fixtures for the in-progress matchweek
  const finishedFixtures = await db
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
        eq(fixtures.matchweek, matchweek),
        eq(fixtures.status, 'finished')
      )
    );

  // If no baseline and no fixtures, we need team info from fixtures table
  if (baselineRows.length === 0) {
    // Get all teams involved in this matchweek's fixtures
    const allFixtures = await db
      .select({
        homeTeamId: fixtures.homeTeamId,
        awayTeamId: fixtures.awayTeamId,
      })
      .from(fixtures)
      .where(
        and(
          eq(fixtures.leagueId, leagueId),
          eq(fixtures.season, season),
          eq(fixtures.matchweek, matchweek)
        )
      );

    const allTeamIds = new Set<number>();
    for (const f of allFixtures) {
      allTeamIds.add(f.homeTeamId);
      allTeamIds.add(f.awayTeamId);
    }

    // Fetch team names
    for (const teamId of allTeamIds) {
      if (!teamStatsMap.has(teamId)) {
        const teamRow = await db
          .select({ name: teams.name, slug: teams.slug, logoUrl: teams.logoUrl })
          .from(teams)
          .where(eq(teams.id, teamId))
          .limit(1);
        if (teamRow[0]) {
          teamStatsMap.set(teamId, {
            teamId,
            teamName: teamRow[0].name,
            teamSlug: teamRow[0].slug,
            teamLogoUrl: teamRow[0].logoUrl ?? null,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
            form: '',
          });
        }
      }
    }
  }

  // 3. Accumulate finished fixture results on top of baseline
  for (const f of finishedFixtures) {
    if (f.homeScore === null || f.awayScore === null) continue;

    const homeStats = teamStatsMap.get(f.homeTeamId);
    const awayStats = teamStatsMap.get(f.awayTeamId);

    if (homeStats) {
      homeStats.played++;
      homeStats.goalsFor += f.homeScore;
      homeStats.goalsAgainst += f.awayScore;
      homeStats.goalDifference = homeStats.goalsFor - homeStats.goalsAgainst;

      if (f.homeScore > f.awayScore) {
        homeStats.won++;
        homeStats.points += 3;
        homeStats.form = (homeStats.form + 'W').slice(-5);
      } else if (f.homeScore < f.awayScore) {
        homeStats.lost++;
        homeStats.form = (homeStats.form + 'L').slice(-5);
      } else {
        homeStats.drawn++;
        homeStats.points += 1;
        homeStats.form = (homeStats.form + 'D').slice(-5);
      }
    }

    if (awayStats) {
      awayStats.played++;
      awayStats.goalsFor += f.awayScore;
      awayStats.goalsAgainst += f.homeScore;
      awayStats.goalDifference = awayStats.goalsFor - awayStats.goalsAgainst;

      if (f.awayScore > f.homeScore) {
        awayStats.won++;
        awayStats.points += 3;
        awayStats.form = (awayStats.form + 'W').slice(-5);
      } else if (f.awayScore < f.homeScore) {
        awayStats.lost++;
        awayStats.form = (awayStats.form + 'L').slice(-5);
      } else {
        awayStats.drawn++;
        awayStats.points += 1;
        awayStats.form = (awayStats.form + 'D').slice(-5);
      }
    }
  }

  // 4. Sort by points desc, goal difference desc, goals for desc, assign positions
  const sorted = [...teamStatsMap.values()]
    .filter((t) => t.played > 0)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

  return sorted.map((row, index) => ({
    teamId: row.teamId,
    teamName: row.teamName,
    teamSlug: row.teamSlug,
    teamLogoUrl: row.teamLogoUrl ?? null,
    position: index + 1,
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDifference: row.goalDifference,
    points: row.points,
    form: row.form || null,
  }));
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
  matchweeks: Array<{ number: number; completed: boolean; inProgress: boolean }>;
  latestCompleted: number;
  inProgress: number | null;
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
    return { matchweeks: [], latestCompleted: 0, inProgress: null, season: season ?? new Date().getFullYear().toString(), config: null };
  }

  const league = await getLeagueBySlug(leagueSlug);
  if (!league) {
    return { matchweeks: [], latestCompleted: 0, inProgress: null, season: season ?? new Date().getFullYear().toString(), config: null };
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

  // Detect in-progress matchweek (only after latest completed, to ignore postponed games)
  const inProgress = await getInProgressMatchweek(league.id, targetSeason, latestCompleted);

  const matchweeks: Array<{ number: number; completed: boolean; inProgress: boolean }> = [];
  for (let i = 1; i <= matchweeksTotal; i++) {
    matchweeks.push({
      number: i,
      completed: completedSet.has(i),
      inProgress: i === inProgress,
    });
  }

  return {
    matchweeks,
    latestCompleted,
    inProgress,
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

  // 4. Get latest completed matchweek and detect in-progress matchweek
  const latestCompleted = await getLatestMatchweek(league.id, targetSeason);
  const inProgressWeek = await getInProgressMatchweek(league.id, targetSeason, latestCompleted ?? 0);

  // 5. Determine matchweek: use provided value, fall back to in-progress, then latest completed
  let resolvedMatchweek: number | null;
  if (matchweek !== undefined) {
    resolvedMatchweek = matchweek;
  } else if (inProgressWeek !== null) {
    resolvedMatchweek = inProgressWeek;
  } else {
    resolvedMatchweek = latestCompleted;
  }

  const configResult = config
    ? {
        teamCount: config.teamCount,
        tiebreakerOrder: config.tiebreakerOrder,
        matchweeksTotal: config.matchweeksTotal,
        hasXg: config.hasXg,
      }
    : null;

  if (resolvedMatchweek === null) {
    return {
      standings: [],
      zones: await getLeagueZones(league.id, targetSeason),
      config: configResult,
      league: {
        id: league.id,
        name: league.name,
        slug: league.slug,
        currentSeason: league.currentSeason,
      },
      matchweek: null,
    };
  }

  // 6. Determine if this matchweek is in-progress
  const isInProgress = resolvedMatchweek === inProgressWeek;

  // 7. Fetch standings - either live-computed or from DB
  let standingsRows: StandingsRow[];

  if (isInProgress) {
    // Compute live standings from baseline + finished fixtures
    standingsRows = await computeLiveStandings(league.id, targetSeason, resolvedMatchweek);
  } else {
    // Use pre-computed standings from DB
    standingsRows = await getDb()
      .select({
        teamId: standings.teamId,
        teamName: teams.name,
        teamSlug: teams.slug,
        teamLogoUrl: teams.logoUrl,
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
  }

  // 8. Fetch zones
  const zones = await getLeagueZones(league.id, targetSeason);

  // 9. Apply tiebreakers if config exists (for both live and DB standings)
  let sortedStandings: StandingsRow[] = standingsRows;
  if (config && standingsRows.length > 0) {
    const h2hMatrix = await buildH2HMatrix(league.id, targetSeason);
    sortedStandings = calculateStandings(standingsRows, config, h2hMatrix);
  }

  // 10. Fetch position changes
  // For in-progress matchweek, compare live positions against last completed matchweek
  let positionChanges: Map<number, number>;

  if (isInProgress && latestCompleted !== null) {
    // Get last completed matchweek positions from DB
    const prevPositions = await getDb()
      .select({
        teamId: standings.teamId,
        position: standings.position,
      })
      .from(standings)
      .where(
        and(
          eq(standings.leagueId, league.id),
          eq(standings.season, targetSeason),
          eq(standings.matchweek, latestCompleted)
        )
      );

    const prevPosMap = new Map(prevPositions.map((p) => [p.teamId, p.position]));
    positionChanges = new Map<number, number>();

    for (const row of sortedStandings) {
      const prevPos = prevPosMap.get(row.teamId);
      if (prevPos !== undefined) {
        positionChanges.set(row.teamId, prevPos - row.position);
      } else {
        positionChanges.set(row.teamId, 0);
      }
    }
  } else {
    positionChanges = await getPositionChanges(league.id, targetSeason, resolvedMatchweek);
  }

  // 11. Fetch sparkline data for each team (in parallel)
  // For in-progress matchweek, use last completed week for sparkline data (live week has no DB entry)
  const sparklineWeek = isInProgress && latestCompleted !== null
    ? latestCompleted
    : resolvedMatchweek;

  const sparklinePromises = sortedStandings.map((row) =>
    getSparklineData(league.id, targetSeason, row.teamId, sparklineWeek)
  );
  const sparklineResults = await Promise.all(sparklinePromises);

  // 12. Enhance standings with position change and sparkline data
  const enhancedStandings: EnhancedStandingsRow[] = sortedStandings.map((row, index) => ({
    ...row,
    positionChange: positionChanges.get(row.teamId) ?? 0,
    sparklineData: sparklineResults[index],
  }));

  return {
    standings: enhancedStandings,
    zones,
    config: configResult,
    league: {
      id: league.id,
      name: league.name,
      slug: league.slug,
      currentSeason: league.currentSeason,
    },
    matchweek: resolvedMatchweek,
  };
}
