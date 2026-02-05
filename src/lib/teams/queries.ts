// Team database queries for team detail pages

import {
  eq,
  and,
  asc,
  desc,
  max,
  min,
  inArray,
  gte,
  lte,
  or,
  sql,
  count,
  countDistinct,
  isNotNull,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getDb, isDatabaseConfigured } from '@/db/connection';
import { teams, leagues, standings, fixtures, fixtureEvents, fixtureStats, players } from '@/db/schema';

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

// ── Performance Queries (04-02) ───────────────────────────────────────────

export interface GoalsByPeriodBucket {
  period: string;
  scored: number;
  conceded: number;
}

export interface CumulativeXgPoint {
  matchweek: number;
  cumulativeXg: number;
  cumulativeGoals: number;
}

export interface CleanSheetsResult {
  cleanSheets: number;
  totalMatches: number;
}

export interface ScoringFirstRecord {
  scoredFirst: { wins: number; draws: number; losses: number; total: number };
  concededFirst: {
    wins: number;
    draws: number;
    losses: number;
    total: number;
  };
  noGoals: number;
}

/**
 * Bucket goal events into 6 x 15-minute periods.
 * Own goals by our team count as conceded; own goals by opponent count as scored for us.
 */
export async function getGoalsByPeriod(
  teamId: number,
  leagueId: number,
  season: string
): Promise<GoalsByPeriodBucket[]> {
  if (!isDatabaseConfigured()) return [];

  const teamFixtures = await getDb()
    .select({ id: fixtures.id })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.season, season),
        eq(fixtures.status, 'finished'),
        or(eq(fixtures.homeTeamId, teamId), eq(fixtures.awayTeamId, teamId))
      )
    );

  const fixtureIds = teamFixtures.map((f) => f.id);
  if (fixtureIds.length === 0) return [];

  const goals = await getDb()
    .select({
      minute: fixtureEvents.minute,
      teamId: fixtureEvents.teamId,
      type: fixtureEvents.type,
    })
    .from(fixtureEvents)
    .where(
      and(
        inArray(fixtureEvents.fixtureId, fixtureIds),
        inArray(fixtureEvents.type, ['goal', 'own_goal', 'penalty_scored'])
      )
    );

  const periods = ['0-15', '16-30', '31-45', '46-60', '61-75', '76-90+'];
  const buckets: GoalsByPeriodBucket[] = periods.map((label) => ({
    period: label,
    scored: 0,
    conceded: 0,
  }));

  for (const goal of goals) {
    const bucketIndex = Math.min(Math.floor((goal.minute - 1) / 15), 5);
    const isOwnGoal = goal.type === 'own_goal';

    if (isOwnGoal) {
      if (goal.teamId === teamId) {
        buckets[bucketIndex].conceded++;
      } else {
        buckets[bucketIndex].scored++;
      }
    } else {
      if (goal.teamId === teamId) {
        buckets[bucketIndex].scored++;
      } else {
        buckets[bucketIndex].conceded++;
      }
    }
  }

  return buckets;
}

/**
 * Compute cumulative xG vs actual goals over the season for a team.
 */
export async function getCumulativeXg(
  teamId: number,
  leagueId: number,
  season: string
): Promise<CumulativeXgPoint[]> {
  if (!isDatabaseConfigured()) return [];

  const rows = await getDb()
    .select({
      matchweek: fixtures.matchweek,
      xg: fixtureStats.xg,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
      homeTeamId: fixtures.homeTeamId,
    })
    .from(fixtureStats)
    .innerJoin(fixtures, eq(fixtureStats.fixtureId, fixtures.id))
    .where(
      and(
        eq(fixtureStats.teamId, teamId),
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.season, season),
        eq(fixtures.status, 'finished')
      )
    )
    .orderBy(asc(fixtures.matchweek));

  let cumulativeXg = 0;
  let cumulativeGoals = 0;

  return rows.map((row) => {
    cumulativeXg += row.xg ?? 0;
    const goalsThisGame =
      row.homeTeamId === teamId
        ? (row.homeScore ?? 0)
        : (row.awayScore ?? 0);
    cumulativeGoals += goalsThisGame;

    return {
      matchweek: row.matchweek ?? 0,
      cumulativeXg: Math.round(cumulativeXg * 100) / 100,
      cumulativeGoals,
    };
  });
}

/**
 * Count clean sheets: fixtures where the team conceded 0 goals.
 */
export async function getCleanSheets(
  teamId: number,
  leagueId: number,
  season: string
): Promise<CleanSheetsResult> {
  if (!isDatabaseConfigured()) return { cleanSheets: 0, totalMatches: 0 };

  const teamFixtures = await getDb()
    .select({
      homeTeamId: fixtures.homeTeamId,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
    })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.season, season),
        eq(fixtures.status, 'finished'),
        or(eq(fixtures.homeTeamId, teamId), eq(fixtures.awayTeamId, teamId))
      )
    );

  let cleanSheets = 0;
  for (const f of teamFixtures) {
    const conceded =
      f.homeTeamId === teamId ? (f.awayScore ?? 0) : (f.homeScore ?? 0);
    if (conceded === 0) cleanSheets++;
  }

  return { cleanSheets, totalMatches: teamFixtures.length };
}

/**
 * For each finished fixture, determine who scored first and what the final result was.
 */
export async function getScoringFirstRecord(
  teamId: number,
  leagueId: number,
  season: string
): Promise<ScoringFirstRecord> {
  if (!isDatabaseConfigured())
    return {
      scoredFirst: { wins: 0, draws: 0, losses: 0, total: 0 },
      concededFirst: { wins: 0, draws: 0, losses: 0, total: 0 },
      noGoals: 0,
    };

  const teamFixtures = await getDb()
    .select({
      id: fixtures.id,
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
        eq(fixtures.status, 'finished'),
        or(eq(fixtures.homeTeamId, teamId), eq(fixtures.awayTeamId, teamId))
      )
    );

  const fixtureIds = teamFixtures.map((f) => f.id);
  if (fixtureIds.length === 0)
    return {
      scoredFirst: { wins: 0, draws: 0, losses: 0, total: 0 },
      concededFirst: { wins: 0, draws: 0, losses: 0, total: 0 },
      noGoals: 0,
    };

  const goalEvents = await getDb()
    .select({
      fixtureId: fixtureEvents.fixtureId,
      minute: fixtureEvents.minute,
      teamId: fixtureEvents.teamId,
      type: fixtureEvents.type,
    })
    .from(fixtureEvents)
    .where(
      and(
        inArray(fixtureEvents.fixtureId, fixtureIds),
        inArray(fixtureEvents.type, ['goal', 'own_goal', 'penalty_scored'])
      )
    )
    .orderBy(asc(fixtureEvents.minute));

  // Pick earliest goal per fixture
  const firstGoalByFixture = new Map<
    number,
    { teamId: number; type: string }
  >();
  for (const ev of goalEvents) {
    if (!firstGoalByFixture.has(ev.fixtureId)) {
      firstGoalByFixture.set(ev.fixtureId, {
        teamId: ev.teamId,
        type: ev.type,
      });
    }
  }

  const result: ScoringFirstRecord = {
    scoredFirst: { wins: 0, draws: 0, losses: 0, total: 0 },
    concededFirst: { wins: 0, draws: 0, losses: 0, total: 0 },
    noGoals: 0,
  };

  for (const f of teamFixtures) {
    const hs = f.homeScore ?? 0;
    const as_ = f.awayScore ?? 0;
    const isHome = f.homeTeamId === teamId;

    const teamGoals = isHome ? hs : as_;
    const opponentGoals = isHome ? as_ : hs;
    const outcome: 'wins' | 'draws' | 'losses' =
      teamGoals > opponentGoals
        ? 'wins'
        : teamGoals === opponentGoals
          ? 'draws'
          : 'losses';

    if (hs === 0 && as_ === 0) {
      result.noGoals++;
      continue;
    }

    const firstGoal = firstGoalByFixture.get(f.id);
    if (!firstGoal) continue;

    let weScoredFirst: boolean;
    if (firstGoal.type === 'own_goal') {
      weScoredFirst = firstGoal.teamId !== teamId;
    } else {
      weScoredFirst = firstGoal.teamId === teamId;
    }

    if (weScoredFirst) {
      result.scoredFirst[outcome]++;
      result.scoredFirst.total++;
    } else {
      result.concededFirst[outcome]++;
      result.concededFirst.total++;
    }
  }

  return result;
}

// ── Squad & Fixtures Queries (04-03) ──────────────────────────────────────

export interface PlayerStat {
  playerId: number;
  name: string;
  position: string | null;
  photoUrl: string | null;
  number: number | null;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  appearances: number;
}

export interface FixtureTeam {
  id: number;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  slug: string;
}

export interface FixtureWithTeams {
  id: number;
  matchweek: number | null;
  kickoff: Date;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  venue: string | null;
  homeTeam: FixtureTeam;
  awayTeam: FixtureTeam;
}

/**
 * Aggregate player statistics from fixture events for a team's season.
 * Returns per-player stats: goals, assists, yellow/red cards, appearances.
 */
export async function getPlayerStats(
  teamId: number,
  leagueId: number,
  season: string
): Promise<PlayerStat[]> {
  if (!isDatabaseConfigured()) return [];

  // Step 1: Get all finished fixture IDs for this team in this season
  const teamFixtures = await getDb()
    .select({ id: fixtures.id })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.season, season),
        eq(fixtures.status, 'finished'),
        or(
          eq(fixtures.homeTeamId, teamId),
          eq(fixtures.awayTeamId, teamId)
        )
      )
    );

  const fixtureIds = teamFixtures.map((f) => f.id);
  if (fixtureIds.length === 0) return [];

  // Step 2: Get all players for this team from players table
  const allPlayers = await getDb()
    .select({
      id: players.id,
      name: players.name,
      position: players.position,
      photoUrl: players.photoUrl,
      number: players.number,
    })
    .from(players)
    .where(eq(players.teamId, teamId));

  // Step 3: Aggregate scorer + card events grouped by playerId
  const scorerCardRows = await getDb()
    .select({
      playerId: fixtureEvents.playerId,
      goals: sql<number>`count(*) filter (where ${fixtureEvents.type} in ('goal', 'penalty_scored'))`.as('goals'),
      yellowCards: sql<number>`count(*) filter (where ${fixtureEvents.type} = 'yellow_card')`.as('yellow_cards'),
      redCards: sql<number>`count(*) filter (where ${fixtureEvents.type} = 'red_card')`.as('red_cards'),
      appearances: sql<number>`count(distinct ${fixtureEvents.fixtureId})`.as('appearances'),
    })
    .from(fixtureEvents)
    .where(
      and(
        eq(fixtureEvents.teamId, teamId),
        inArray(fixtureEvents.fixtureId, fixtureIds),
        isNotNull(fixtureEvents.playerId)
      )
    )
    .groupBy(fixtureEvents.playerId);

  // Step 4: Aggregate assists (where assistPlayerId IS NOT NULL on goal events)
  const assistRows = await getDb()
    .select({
      assistPlayerId: fixtureEvents.assistPlayerId,
      assists: sql<number>`count(*)`.as('assists'),
    })
    .from(fixtureEvents)
    .where(
      and(
        eq(fixtureEvents.teamId, teamId),
        inArray(fixtureEvents.fixtureId, fixtureIds),
        isNotNull(fixtureEvents.assistPlayerId),
        inArray(fixtureEvents.type, ['goal', 'penalty_scored'])
      )
    )
    .groupBy(fixtureEvents.assistPlayerId);

  // Step 5: Merge into unified stats map
  const statsMap = new Map<
    number,
    { goals: number; assists: number; yellowCards: number; redCards: number; appearances: number }
  >();

  for (const row of scorerCardRows) {
    if (row.playerId === null) continue;
    statsMap.set(row.playerId, {
      goals: Number(row.goals) || 0,
      assists: 0,
      yellowCards: Number(row.yellowCards) || 0,
      redCards: Number(row.redCards) || 0,
      appearances: Number(row.appearances) || 0,
    });
  }

  for (const row of assistRows) {
    if (row.assistPlayerId === null) continue;
    const existing = statsMap.get(row.assistPlayerId);
    if (existing) {
      existing.assists = Number(row.assists) || 0;
    } else {
      statsMap.set(row.assistPlayerId, {
        goals: 0,
        assists: Number(row.assists) || 0,
        yellowCards: 0,
        redCards: 0,
        appearances: 0,
      });
    }
  }

  // Step 6: Build final array including all squad players (defaulting to 0 stats)
  return allPlayers.map((p) => {
    const s = statsMap.get(p.id);
    return {
      playerId: p.id,
      name: p.name,
      position: p.position,
      photoUrl: p.photoUrl,
      number: p.number,
      goals: s?.goals ?? 0,
      assists: s?.assists ?? 0,
      yellowCards: s?.yellowCards ?? 0,
      redCards: s?.redCards ?? 0,
      appearances: s?.appearances ?? 0,
    };
  });
}

/**
 * Fetch recent results and upcoming fixtures for a team.
 * Uses alias() for homeTeam/awayTeam double-join (established pattern).
 */
export async function getTeamFixtures(
  teamId: number,
  leagueId: number,
  season: string,
  options?: { recentLimit?: number; upcomingLimit?: number }
): Promise<{ recent: FixtureWithTeams[]; upcoming: FixtureWithTeams[] }> {
  if (!isDatabaseConfigured()) return { recent: [], upcoming: [] };

  const recentLimit = options?.recentLimit ?? 10;
  const upcomingLimit = options?.upcomingLimit ?? 5;

  const homeTeam = alias(teams, 'homeTeam');
  const awayTeam = alias(teams, 'awayTeam');

  // Recent finished results (newest first)
  const recentRows = await getDb()
    .select({
      id: fixtures.id,
      matchweek: fixtures.matchweek,
      kickoff: fixtures.kickoff,
      status: fixtures.status,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
      venue: fixtures.venue,
      homeTeamId: homeTeam.id,
      homeTeamName: homeTeam.name,
      homeTeamShortName: homeTeam.shortName,
      homeTeamLogoUrl: homeTeam.logoUrl,
      homeTeamSlug: homeTeam.slug,
      awayTeamId: awayTeam.id,
      awayTeamName: awayTeam.name,
      awayTeamShortName: awayTeam.shortName,
      awayTeamLogoUrl: awayTeam.logoUrl,
      awayTeamSlug: awayTeam.slug,
    })
    .from(fixtures)
    .innerJoin(homeTeam, eq(fixtures.homeTeamId, homeTeam.id))
    .innerJoin(awayTeam, eq(fixtures.awayTeamId, awayTeam.id))
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.season, season),
        eq(fixtures.status, 'finished'),
        or(
          eq(fixtures.homeTeamId, teamId),
          eq(fixtures.awayTeamId, teamId)
        )
      )
    )
    .orderBy(desc(fixtures.kickoff))
    .limit(recentLimit);

  // Upcoming scheduled fixtures (soonest first)
  const upcomingRows = await getDb()
    .select({
      id: fixtures.id,
      matchweek: fixtures.matchweek,
      kickoff: fixtures.kickoff,
      status: fixtures.status,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
      venue: fixtures.venue,
      homeTeamId: homeTeam.id,
      homeTeamName: homeTeam.name,
      homeTeamShortName: homeTeam.shortName,
      homeTeamLogoUrl: homeTeam.logoUrl,
      homeTeamSlug: homeTeam.slug,
      awayTeamId: awayTeam.id,
      awayTeamName: awayTeam.name,
      awayTeamShortName: awayTeam.shortName,
      awayTeamLogoUrl: awayTeam.logoUrl,
      awayTeamSlug: awayTeam.slug,
    })
    .from(fixtures)
    .innerJoin(homeTeam, eq(fixtures.homeTeamId, homeTeam.id))
    .innerJoin(awayTeam, eq(fixtures.awayTeamId, awayTeam.id))
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.season, season),
        eq(fixtures.status, 'scheduled'),
        or(
          eq(fixtures.homeTeamId, teamId),
          eq(fixtures.awayTeamId, teamId)
        )
      )
    )
    .orderBy(asc(fixtures.kickoff))
    .limit(upcomingLimit);

  const mapRow = (row: (typeof recentRows)[0]): FixtureWithTeams => ({
    id: row.id,
    matchweek: row.matchweek,
    kickoff: row.kickoff,
    status: row.status,
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    venue: row.venue,
    homeTeam: {
      id: row.homeTeamId,
      name: row.homeTeamName,
      shortName: row.homeTeamShortName,
      logoUrl: row.homeTeamLogoUrl,
      slug: row.homeTeamSlug,
    },
    awayTeam: {
      id: row.awayTeamId,
      name: row.awayTeamName,
      shortName: row.awayTeamShortName,
      logoUrl: row.awayTeamLogoUrl,
      slug: row.awayTeamSlug,
    },
  });

  return {
    recent: recentRows.map(mapRow),
    upcoming: upcomingRows.map(mapRow),
  };
}

/**
 * Fetch the current league position for every team.
 * Returns Map<teamId, position> for fixture difficulty colouring.
 */
export async function getOpponentPositions(
  leagueId: number,
  season: string
): Promise<Map<number, number>> {
  if (!isDatabaseConfigured()) return new Map();

  // Find max matchweek
  const maxResult = await getDb()
    .select({ maxWeek: max(standings.matchweek) })
    .from(standings)
    .where(
      and(eq(standings.leagueId, leagueId), eq(standings.season, season))
    );

  const maxWeek = maxResult[0]?.maxWeek;
  if (!maxWeek) return new Map();

  const rows = await getDb()
    .select({
      teamId: standings.teamId,
      position: standings.position,
    })
    .from(standings)
    .where(
      and(
        eq(standings.leagueId, leagueId),
        eq(standings.season, season),
        eq(standings.matchweek, maxWeek)
      )
    );

  const posMap = new Map<number, number>();
  for (const row of rows) {
    posMap.set(row.teamId, row.position);
  }
  return posMap;
}
