'use server';

import {
  getStandingsWithZones,
  getMatchweekList,
  type EnhancedStandingsRow,
  type MatchweekListResult,
} from '@/lib/standings/queries';
import type { Zone } from '@/lib/zones';
import { getLocale } from 'next-intl/server';
import { getLocalizedTeamNames } from '@/lib/teams/translations';

export interface StandingsResult {
  standings: EnhancedStandingsRow[];
  zones: Zone[];
  matchweek: number | null;
  leagueName: string | null;
  config: {
    teamCount: number;
    tiebreakerOrder: string;
    matchweeksTotal: number;
    hasXg: boolean;
  } | null;
  error?: 'database_not_configured' | 'league_not_found';
}

export async function fetchStandings(league: string, matchweek?: number): Promise<StandingsResult> {
  const data = await getStandingsWithZones(league, undefined, matchweek);

  // Localize team names
  const locale = await getLocale();
  const teamIds = data.standings.map((s) => s.teamId);
  const englishNames = new Map(data.standings.map((s) => [s.teamId, s.teamName]));
  const localizedNames = await getLocalizedTeamNames(teamIds, locale, englishNames);

  const standings = data.standings.map((s) => ({
    ...s,
    teamName: localizedNames.get(s.teamId) ?? s.teamName,
  }));

  return {
    standings,
    zones: data.zones,
    matchweek: data.matchweek,
    leagueName: data.league?.name ?? null,
    config: data.config,
    error: data.error,
  };
}

export async function fetchMatchweekList(league: string): Promise<MatchweekListResult> {
  return getMatchweekList(league);
}
