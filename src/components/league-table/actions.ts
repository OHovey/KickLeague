'use server';

import { getStandingsWithZones, type EnhancedStandingsRow } from '@/lib/standings/queries';
import type { Zone } from '@/lib/zones';

export interface StandingsResult {
  standings: EnhancedStandingsRow[];
  zones: Zone[];
  matchweek: number | null;
  leagueName: string | null;
  error?: 'database_not_configured' | 'league_not_found';
}

export async function fetchStandings(league: string): Promise<StandingsResult> {
  const data = await getStandingsWithZones(league);

  return {
    standings: data.standings,
    zones: data.zones,
    matchweek: data.matchweek,
    leagueName: data.league?.name ?? null,
    error: data.error,
  };
}
