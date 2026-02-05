'use server';

import {
  getTeamBySlug,
  getTeamCurrentStandings,
  getPositionHistory,
  getCumulativePoints,
  getRivalTeamIds,
  type TeamWithLeague,
  type TeamCurrentStandings,
  type PositionHistoryPoint,
  type CumulativePointsPoint,
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

/**
 * Fetch performance tab data.
 * Stub -- implemented in plan 04-02.
 */
export async function fetchPerformanceData(
  teamId: number,
  leagueId: number,
  season: string
): Promise<null> {
  return null;
}

/**
 * Fetch squad tab data.
 * Stub -- implemented in plan 04-03.
 */
export async function fetchSquadData(
  teamId: number,
  leagueId: number,
  season: string
): Promise<null> {
  return null;
}

/**
 * Fetch fixtures tab data.
 * Stub -- implemented in plan 04-03.
 */
export async function fetchFixturesData(
  teamId: number,
  leagueId: number,
  season: string
): Promise<null> {
  return null;
}
