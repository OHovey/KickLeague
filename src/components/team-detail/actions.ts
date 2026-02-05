'use server';

import {
  getTeamBySlug,
  getTeamCurrentStandings,
  getPositionHistory,
  getCumulativePoints,
  getRivalTeamIds,
  getGoalsByPeriod,
  getCumulativeXg,
  getCleanSheets,
  getScoringFirstRecord,
  getPlayerStats,
  getTeamFixtures,
  getOpponentPositions,
  type TeamWithLeague,
  type TeamCurrentStandings,
  type PositionHistoryPoint,
  type CumulativePointsPoint,
  type GoalsByPeriodBucket,
  type CumulativeXgPoint,
  type CleanSheetsResult,
  type ScoringFirstRecord,
  type PlayerStat,
  type FixtureWithTeams,
} from '@/lib/teams/queries';
import { getLeagueConfig } from '@/lib/standings/queries';

// ── Types ──────────────────────────────────────────────────────────────────

export interface TeamPageData {
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
  standings: TeamCurrentStandings | null;
  hasXg: boolean;
}

export interface SeasonSummary {
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
}

export interface OverviewData {
  positionHistory: PositionHistoryPoint[];
  cumulativePoints: CumulativePointsPoint[];
  focusTeamName: string;
  rivalTeamNames: string[];
  seasonSummary: SeasonSummary | null;
}

// ── Actions ────────────────────────────────────────────────────────────────

/**
 * Fetch team page data by slug. Bundles team info, current standings,
 * and league config flags.
 */
export async function fetchTeamBySlug(
  slug: string
): Promise<TeamPageData | null> {
  const team = await getTeamBySlug(slug);
  if (!team) return null;

  // Fetch current standings and league config in parallel
  const [currentStandings, config] = await Promise.all([
    getTeamCurrentStandings(team.id, team.leagueId, team.currentSeason),
    getLeagueConfig(team.leagueId, team.currentSeason),
  ]);

  return {
    id: team.id,
    apiId: team.apiId,
    name: team.name,
    shortName: team.shortName,
    slug: team.slug,
    logoUrl: team.logoUrl,
    stadiumName: team.stadiumName,
    leagueId: team.leagueId,
    leagueSlug: team.leagueSlug,
    leagueName: team.leagueName,
    currentSeason: team.currentSeason,
    standings: currentStandings,
    hasXg: config?.hasXg ?? false,
  };
}

/**
 * Fetch overview tab data: position history (bump chart), cumulative points,
 * and season summary.
 */
export async function fetchOverviewData(
  teamId: number,
  leagueId: number,
  season: string,
  teamName: string
): Promise<OverviewData> {
  // Get rival team IDs for bump chart
  const rivalIds = await getRivalTeamIds(teamId, leagueId, season);
  const allTeamIds = [teamId, ...rivalIds];

  // Fetch position history and cumulative points in parallel
  const [positionHistory, cumulativePoints, currentStandings] =
    await Promise.all([
      getPositionHistory(leagueId, season, allTeamIds),
      getCumulativePoints(teamId, leagueId, season),
      getTeamCurrentStandings(teamId, leagueId, season),
    ]);

  // Extract rival team names from position history data
  const rivalTeamNames: string[] = [];
  if (positionHistory.length > 0) {
    const firstRow = positionHistory[0];
    for (const key of Object.keys(firstRow)) {
      if (key !== 'matchweek' && key !== teamName) {
        rivalTeamNames.push(key);
      }
    }
  }

  // Build season summary from current standings
  const seasonSummary: SeasonSummary | null = currentStandings
    ? {
        position: currentStandings.position,
        played: currentStandings.played,
        won: currentStandings.won,
        drawn: currentStandings.drawn,
        lost: currentStandings.lost,
        goalsFor: currentStandings.goalsFor,
        goalsAgainst: currentStandings.goalsAgainst,
        goalDifference: currentStandings.goalDifference,
        points: currentStandings.points,
        form: currentStandings.form,
      }
    : null;

  return {
    positionHistory,
    cumulativePoints,
    focusTeamName: teamName,
    rivalTeamNames,
    seasonSummary,
  };
}

export interface HomeAwaySplit {
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface PerformanceData {
  homeSplit: HomeAwaySplit;
  awaySplit: HomeAwaySplit;
  goalsByPeriod: GoalsByPeriodBucket[];
  cumulativeXg: CumulativeXgPoint[];
  cleanSheets: CleanSheetsResult;
  scoringFirstRecord: ScoringFirstRecord;
  hasXg: boolean;
  totalXg: number;
  totalGoals: number;
}

/**
 * Fetch performance tab data: home/away splits, goals by period,
 * cumulative xG, clean sheets, and scoring-first record.
 */
export async function fetchPerformanceData(
  teamId: number,
  leagueId: number,
  season: string
): Promise<PerformanceData> {
  const [
    currentStandings,
    goalsByPeriod,
    cumulativeXg,
    cleanSheets,
    scoringFirstRecord,
    config,
  ] = await Promise.all([
    getTeamCurrentStandings(teamId, leagueId, season),
    getGoalsByPeriod(teamId, leagueId, season),
    getCumulativeXg(teamId, leagueId, season),
    getCleanSheets(teamId, leagueId, season),
    getScoringFirstRecord(teamId, leagueId, season),
    getLeagueConfig(leagueId, season),
  ]);

  const hasXg = config?.hasXg ?? false;

  // Extract home/away splits from standings
  const homeSplit: HomeAwaySplit = currentStandings
    ? {
        won: currentStandings.homeWon,
        drawn: currentStandings.homeDrawn,
        lost: currentStandings.homeLost,
        goalsFor: currentStandings.homeGoalsFor,
        goalsAgainst: currentStandings.homeGoalsAgainst,
        goalDifference:
          currentStandings.homeGoalsFor - currentStandings.homeGoalsAgainst,
      }
    : { won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 };

  const awaySplit: HomeAwaySplit = currentStandings
    ? {
        won: currentStandings.awayWon,
        drawn: currentStandings.awayDrawn,
        lost: currentStandings.awayLost,
        goalsFor: currentStandings.awayGoalsFor,
        goalsAgainst: currentStandings.awayGoalsAgainst,
        goalDifference:
          currentStandings.awayGoalsFor - currentStandings.awayGoalsAgainst,
      }
    : { won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 };

  // Get xG totals from cumulative data
  const lastXgPoint = cumulativeXg[cumulativeXg.length - 1];
  const totalXg = lastXgPoint?.cumulativeXg ?? 0;
  const totalGoals = lastXgPoint?.cumulativeGoals ?? 0;

  return {
    homeSplit,
    awaySplit,
    goalsByPeriod,
    cumulativeXg,
    cleanSheets,
    scoringFirstRecord,
    hasXg,
    totalXg,
    totalGoals,
  };
}

export interface SquadData {
  playerStats: PlayerStat[];
  totalFixtures: number;
}

/**
 * Fetch squad tab data: player stats aggregated from fixture events,
 * merged with full roster from players table.
 */
export async function fetchSquadData(
  teamId: number,
  leagueId: number,
  season: string
): Promise<SquadData> {
  const playerStats = await getPlayerStats(teamId, leagueId, season);

  // totalFixtures = max appearances across all players, or count of finished fixtures
  const maxApps = playerStats.reduce((mx, p) => Math.max(mx, p.appearances), 0);

  return {
    playerStats,
    totalFixtures: maxApps || 1, // avoid division by zero
  };
}

export interface FixturesData {
  recent: FixtureWithTeams[];
  upcoming: FixtureWithTeams[];
  opponentPositions: Record<number, number>;
}

/**
 * Fetch fixtures tab data: recent results, upcoming fixtures, and opponent
 * league positions for difficulty colouring.
 */
export async function fetchFixturesData(
  teamId: number,
  leagueId: number,
  season: string
): Promise<FixturesData> {
  const [fixtureData, positionsMap] = await Promise.all([
    getTeamFixtures(teamId, leagueId, season),
    getOpponentPositions(leagueId, season),
  ]);

  // Serialize Map to Record for server action JSON transfer
  const opponentPositions: Record<number, number> = {};
  for (const [k, v] of positionsMap) {
    opponentPositions[k] = v;
  }

  return {
    recent: fixtureData.recent,
    upcoming: fixtureData.upcoming,
    opponentPositions,
  };
}
