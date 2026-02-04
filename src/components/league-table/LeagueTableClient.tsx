'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import type { EnhancedStandingsRow } from '@/lib/standings/queries';
import type { Zone } from '@/lib/zones';
import { getZoneColor } from '@/lib/zones';
import { TableRow } from './TableRow';
import { ZoneLegend } from './ZoneLegend';
import { fetchStandings } from './actions';

interface LeagueTableClientProps {
  league: string;
}

interface StandingsData {
  standings: EnhancedStandingsRow[];
  zones: Zone[];
  matchweek: number | null;
  leagueName: string | null;
}

type ExpandState = 'collapsed' | 'default' | 'expanded';

const STORAGE_KEY = 'table-expand-state';
const ROW_COUNTS: Record<ExpandState, number> = {
  collapsed: 5,
  default: 10,
  expanded: Infinity,
};

function getStoredExpandState(): ExpandState {
  if (typeof window === 'undefined') return 'default';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'collapsed' || stored === 'default' || stored === 'expanded') {
    return stored;
  }
  return 'default';
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
  const [expandState, setExpandState] = useState<ExpandState>('default');

  // Load expand state from localStorage on mount
  useEffect(() => {
    setExpandState(getStoredExpandState());
  }, []);

  // Persist expand state to localStorage
  const handleExpandStateChange = useCallback((newState: ExpandState) => {
    setExpandState(newState);
    localStorage.setItem(STORAGE_KEY, newState);
  }, []);

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

  // Slice standings based on expand state
  const maxRows = ROW_COUNTS[expandState];
  const displayedStandings = data.standings.slice(0, maxRows);
  const totalRows = data.standings.length;
  const isFullyExpanded = expandState === 'expanded' || displayedStandings.length >= totalRows;

  // Determine next state and button text
  const getNextState = (): { state: ExpandState; label: string } => {
    switch (expandState) {
      case 'collapsed':
        return { state: 'default', label: 'Show 10 rows' };
      case 'default':
        return { state: 'expanded', label: 'Show full table' };
      case 'expanded':
        return { state: 'collapsed', label: 'Collapse' };
    }
  };
  const { state: nextState, label: buttonLabel } = getNextState();

  return (
    <div className={`overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm ${isPending ? 'opacity-50' : ''}`}>
      {/* Matchweek indicator */}
      {data.matchweek && (
        <div className="border-b border-white/10 px-4 py-3">
          <span className="text-sm text-white/50">Matchweek {data.matchweek}</span>
        </div>
      )}

      {/* Table with optional fade gradient when not fully expanded */}
      <div className="relative">
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
                <th className="py-3 pl-2 pr-2 text-center font-medium">Pts</th>
                {/* Desktop-only visual columns */}
                <th className="hidden py-3 px-2 text-left font-medium md:table-cell">Form</th>
                <th className="hidden py-3 px-2 text-center font-medium md:table-cell">+/-</th>
                <th className="hidden py-3 px-2 pr-4 text-left font-medium md:table-cell">Trend</th>
                {/* Expand indicator for mobile */}
                <th className="w-8 py-3 pr-2 md:hidden"><span className="sr-only">Expand</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayedStandings.map((row) => (
                <TableRow
                  key={row.teamId}
                  row={row}
                  zoneColor={getZoneColor(data.zones, row.position)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Fade gradient when table is not fully expanded */}
        {!isFullyExpanded && (
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Expand/collapse button */}
      <div className="border-t border-white/10 px-4 py-3 text-center">
        <button
          type="button"
          onClick={() => handleExpandStateChange(nextState)}
          className="min-h-[44px] px-4 py-2 text-sm text-primary underline underline-offset-2 transition-colors hover:text-primary/80"
        >
          {buttonLabel}
        </button>
      </div>

      {/* Zone legend */}
      <div className="border-t border-white/10 px-4 py-3">
        <ZoneLegend zones={data.zones} />
      </div>
    </div>
  );
}
