'use server';

import {
  getStandingsWithZones,
  getMatchweekList,
  type EnhancedStandingsRow,
  type MatchweekListResult,
} from '@/lib/standings/queries';
import type { Zone } from '@/lib/zones';

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

  return {
    standings: data.standings,
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
