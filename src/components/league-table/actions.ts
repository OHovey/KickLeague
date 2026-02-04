'use server';

import { getStandingsWithZones } from '@/lib/standings/queries';
import type { StandingsRow } from '@/lib/standings/calculate';
import type { Zone } from '@/lib/zones';

export interface StandingsResult {
  standings: StandingsRow[];
  zones: Zone[];
  matchweek: number | null;
  leagueName: string | null;
}

export async function fetchStandings(league: string): Promise<StandingsResult> {
  const data = await getStandingsWithZones(league);

  return {
    standings: data.standings,
    zones: data.zones,
    matchweek: data.matchweek,
    leagueName: data.league?.name ?? null,
  };
}
