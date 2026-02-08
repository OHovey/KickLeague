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
import { getLocale } from 'next-intl/server';
import { getLocalizedTeamNames } from '@/lib/teams/translations';
import { inArray } from 'drizzle-orm';
import { getDb } from '@/db/connection';
import { teams } from '@/db/schema';

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

  // Localize team name
  const locale = await getLocale();
  const englishNames = new Map<number, string>([[team.id, team.name]]);
  const localizedNames = await getLocalizedTeamNames([team.id], locale, englishNames);

  return {
    id: team.id,
    apiId: team.apiId,
    name: localizedNames.get(team.id) ?? team.name,
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

  // Localize team names for position history chart keys
  const locale = await getLocale();

  // Fetch English names for all team IDs to build the English->localized mapping
  const teamRows = await getDb()
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(inArray(teams.id, allTeamIds));

  const englishNames = new Map(teamRows.map((t) => [t.id, t.name]));
  const localizedNames = await getLocalizedTeamNames(allTeamIds, locale, englishNames);

  // Build English->Localized name mapping for remapping chart keys
  const nameRemap = new Map<string, string>();
  for (const t of teamRows) {
    const localized = localizedNames.get(t.id) ?? t.name;
    if (localized !== t.name) {
      nameRemap.set(t.name, localized);
    }
  }

  // Remap position history keys from English to localized names
  const localizedHistory = positionHistory.map((point) => {
    const remapped: PositionHistoryPoint = { matchweek: point.matchweek };
    for (const [key, value] of Object.entries(point)) {
      if (key === 'matchweek') continue;
      const localizedKey = nameRemap.get(key) ?? key;
      remapped[localizedKey] = value;
    }
    return remapped;
  });

  // Extract rival team names from localized position history data
  const localizedFocusName = localizedNames.get(teamId) ?? teamName;
  const rivalTeamNames: string[] = [];
  if (localizedHistory.length > 0) {
    const firstRow = localizedHistory[0];
    for (const key of Object.keys(firstRow)) {
      if (key !== 'matchweek' && key !== localizedFocusName) {
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
    positionHistory: localizedHistory,
    cumulativePoints,
    focusTeamName: localizedFocusName,
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

  // Localize team names across all fixtures
  const locale = await getLocale();
  const allFixtures = [...fixtureData.recent, ...fixtureData.upcoming];
  const allTeamIds = [...new Set(allFixtures.flatMap((f) => [f.homeTeam.id, f.awayTeam.id]))];
  const englishNames = new Map<number, string>();
  for (const f of allFixtures) {
    englishNames.set(f.homeTeam.id, f.homeTeam.name);
    englishNames.set(f.awayTeam.id, f.awayTeam.name);
  }
  const localizedNames = await getLocalizedTeamNames(allTeamIds, locale, englishNames);

  const localizeFixtures = (list: typeof fixtureData.recent) =>
    list.map((f) => ({
      ...f,
      homeTeam: { ...f.homeTeam, name: localizedNames.get(f.homeTeam.id) ?? f.homeTeam.name },
      awayTeam: { ...f.awayTeam, name: localizedNames.get(f.awayTeam.id) ?? f.awayTeam.name },
    }));

  return {
    recent: localizeFixtures(fixtureData.recent),
    upcoming: localizeFixtures(fixtureData.upcoming),
    opponentPositions,
  };
}
