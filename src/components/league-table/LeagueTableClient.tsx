'use client';

import { useEffect, useState, useTransition } from 'react';
import type { StandingsRow } from '@/lib/standings/calculate';
import type { Zone } from '@/lib/zones';
import { getZoneColor } from '@/lib/zones';
import { TableRow } from './TableRow';
import { ZoneLegend } from './ZoneLegend';
import { fetchStandings } from './actions';

interface LeagueTableClientProps {
  league: string;
}

interface StandingsData {
  standings: StandingsRow[];
  zones: Zone[];
  matchweek: number | null;
  leagueName: string | null;
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
      </div>
      <div className="p-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <div className="h-4 w-8 animate-pulse rounded bg-white/10" />
            <div className="h-4 flex-1 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeagueTableClient({ league }: LeagueTableClientProps) {
  const [data, setData] = useState<StandingsData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await fetchStandings(league);
        setData(result);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load standings');
      }
    });
  }, [league]);

  if (isPending && !data) {
    return <TableSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white/5 p-8 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!data || !data.leagueName) {
    return (
      <div className="rounded-lg bg-white/5 p-8 text-center">
        <p className="text-white/70">League not found</p>
      </div>
    );
  }

  if (data.standings.length === 0) {
    return (
      <div className="rounded-lg bg-white/5 p-8 text-center">
        <p className="text-white/70">No standings data available</p>
        <p className="mt-2 text-sm text-white/50">
          Run the seed script to populate league data
        </p>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm ${isPending ? 'opacity-50' : ''}`}>
      {/* Matchweek indicator */}
      {data.matchweek && (
        <div className="border-b border-white/10 px-4 py-3">
          <span className="text-sm text-white/50">Matchweek {data.matchweek}</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/50">
              {/* Always visible columns */}
              <th className="py-3 pl-4 pr-2 text-center font-medium">#</th>
              <th className="py-3 px-2 text-left font-medium">Team</th>
              <th className="py-3 px-2 text-center font-medium">P</th>
              {/* Desktop-only columns */}
              <th className="hidden py-3 px-2 text-center font-medium md:table-cell">W</th>
              <th className="hidden py-3 px-2 text-center font-medium md:table-cell">D</th>
              <th className="hidden py-3 px-2 text-center font-medium md:table-cell">L</th>
              <th className="hidden py-3 px-2 text-center font-medium md:table-cell">GF</th>
              <th className="hidden py-3 px-2 text-center font-medium md:table-cell">GA</th>
              {/* Always visible columns */}
              <th className="py-3 px-2 text-center font-medium">GD</th>
              <th className="py-3 pl-2 pr-4 text-center font-medium">Pts</th>
              {/* Expand indicator for mobile */}
              <th className="w-8 py-3 pr-2 md:hidden"><span className="sr-only">Expand</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.standings.map((row) => (
              <TableRow
                key={row.teamId}
                row={row}
                zoneColor={getZoneColor(data.zones, row.position)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Zone legend */}
      <div className="border-t border-white/10 px-4 py-3">
        <ZoneLegend zones={data.zones} />
      </div>
    </div>
  );
}
