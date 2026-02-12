'use server';

import { isDatabaseConfigured } from '@/db/connection';
import { getLeagueBySlug } from '@/lib/standings/queries';
import {
  getTopScorersLeaderboard,
  getTopAssistsLeaderboard,
  getDisciplinaryLeaderboard,
  type LeaderboardScorerRow,
  type LeaderboardAssistRow,
  type LeaderboardDisciplinaryRow,
} from '@/lib/stats/leaderboard-queries';
import { getLocale } from 'next-intl/server';
import { getLocalizedTeamNames } from '@/lib/teams/translations';

// -- Types -------------------------------------------------------------------

interface LeagueMetadata {
  id: number;
  name: string;
  slug: string;
  currentSeason: string;
  logoUrl: string | null;
  country: string;
}

export type LeaderboardData =
  | { type: 'scorers'; rows: LeaderboardScorerRow[]; league: LeagueMetadata }
  | { type: 'assists'; rows: LeaderboardAssistRow[]; league: LeagueMetadata }
  | { type: 'disciplinary'; rows: LeaderboardDisciplinaryRow[]; league: LeagueMetadata }
  | null;

const VALID_STAT_TYPES = ['top-scorers', 'top-assists', 'disciplinary'] as const;
export type StatType = (typeof VALID_STAT_TYPES)[number];

// -- Server Action -----------------------------------------------------------

/**
 * Fetch leaderboard data for a given league slug and stat type.
 * Returns typed union based on stat type, or null if database is unavailable
 * or league/stat is invalid.
 */
export async function fetchLeaderboardData(
  leagueSlug: string,
  statType: string
): Promise<LeaderboardData> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!VALID_STAT_TYPES.includes(statType as StatType)) {
    return null;
  }

  const league = await getLeagueBySlug(leagueSlug);
  if (!league) {
    return null;
  }

  const leagueMeta: LeagueMetadata = {
    id: league.id,
    name: league.name,
    slug: league.slug,
    currentSeason: league.currentSeason,
    logoUrl: league.logoUrl,
    country: league.country,
  };

  // Fetch the appropriate leaderboard data
  let result: LeaderboardData;

  switch (statType as StatType) {
    case 'top-scorers': {
      const rows = await getTopScorersLeaderboard(league.id, league.currentSeason);
      result = { type: 'scorers', rows, league: leagueMeta };
      break;
    }
    case 'top-assists': {
      const rows = await getTopAssistsLeaderboard(league.id, league.currentSeason);
      result = { type: 'assists', rows, league: leagueMeta };
      break;
    }
    case 'disciplinary': {
      const rows = await getDisciplinaryLeaderboard(league.id, league.currentSeason);
      result = { type: 'disciplinary', rows, league: leagueMeta };
      break;
    }
    default:
      return null;
  }

  // Localize team names
  if (result && result.rows.length > 0) {
    const locale = await getLocale();
    const teamIds: number[] = [];
    const englishNames = new Map<number, string>();

    for (const row of result.rows) {
      teamIds.push(row.teamId);
      englishNames.set(row.teamId, row.teamName);
    }

    const localizedNames = await getLocalizedTeamNames(
      [...new Set(teamIds)],
      locale,
      englishNames
    );

    result = {
      ...result,
      rows: result.rows.map((row) => ({
        ...row,
        teamName: localizedNames.get(row.teamId) ?? row.teamName,
      })),
    } as LeaderboardData & { rows: typeof result.rows };
  }

  return result;
}
