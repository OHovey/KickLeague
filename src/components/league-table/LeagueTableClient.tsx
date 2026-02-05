'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import { LayoutGroup } from 'motion/react';
import type { EnhancedStandingsRow } from '@/lib/standings/queries';
import type { Zone } from '@/lib/zones';
import { getZoneColor } from '@/lib/zones';
import { AnimatedTableRow } from './AnimatedTableRow';
import { ZoneLegend } from './ZoneLegend';
import { fetchStandings } from './actions';

interface LeagueTableClientProps {
  league: string;
  matchweek?: number;
}

interface StandingsData {
  standings: EnhancedStandingsRow[];
  zones: Zone[];
  matchweek: number | null;
  leagueName: string | null;
  error?: 'database_not_configured' | 'league_not_found';
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

const GRID_COLS = 'grid-cols-[2.5rem_1fr_2.5rem_2.5rem_2.5rem_2.5rem_2.5rem_2.5rem_3rem_3rem_auto_auto_auto_2rem]';

export function LeagueTableClient({ league, matchweek }: LeagueTableClientProps) {
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
        const result = await fetchStandings(league, matchweek);
        setData(result);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load standings');
      }
    });
  }, [league, matchweek]);

  // Show skeleton during initial load or when switching leagues
  if (isPending) {
    return <TableSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white/5 p-8 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (data?.error === 'database_not_configured') {
    return (
      <div className="rounded-lg bg-white/5 p-8 text-center">
        <p className="text-lg font-medium text-white/90">Database Not Configured</p>
        <p className="mt-2 text-white/70">
          Set up your database to see league standings
        </p>
        <div className="mt-4 rounded bg-black/30 p-4 text-left">
          <p className="text-xs font-mono text-white/50">1. Create a Neon database at neon.tech</p>
          <p className="text-xs font-mono text-white/50 mt-1">2. Copy DATABASE_URL to .env.local</p>
          <p className="text-xs font-mono text-white/50 mt-1">3. Run: npx drizzle-kit push</p>
          <p className="text-xs font-mono text-white/50 mt-1">4. Run: npm run seed -- --all</p>
        </div>
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
    <div className="overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm">
      {/* Matchweek indicator */}
      {data.matchweek && (
        <div className="border-b border-white/10 px-4 py-3">
          <span className="text-sm text-white/50">Matchweek {data.matchweek}</span>
        </div>
      )}

      {/* Table with optional fade gradient when not fully expanded */}
      <div className="relative">
        <div className="overflow-x-auto">
          <div role="table" className="w-full">
            {/* Header row */}
            <div
              role="row"
              className={`grid ${GRID_COLS} items-center border-b border-white/10 text-xs uppercase tracking-wider text-white/50`}
            >
              {/* Always visible columns */}
              <div role="columnheader" className="py-3 pl-4 pr-2 text-center font-medium">#</div>
              <div role="columnheader" className="py-3 px-2 text-left font-medium">Team</div>
              <div role="columnheader" className="py-3 px-2 text-center font-medium">P</div>
              {/* Desktop-only columns */}
              <div role="columnheader" className="hidden py-3 px-2 text-center font-medium md:block">W</div>
              <div role="columnheader" className="hidden py-3 px-2 text-center font-medium md:block">D</div>
              <div role="columnheader" className="hidden py-3 px-2 text-center font-medium md:block">L</div>
              <div role="columnheader" className="hidden py-3 px-2 text-center font-medium md:block">GF</div>
              <div role="columnheader" className="hidden py-3 px-2 text-center font-medium md:block">GA</div>
              {/* Always visible columns */}
              <div role="columnheader" className="py-3 px-2 text-center font-medium">GD</div>
              <div role="columnheader" className="py-3 pl-2 pr-2 text-center font-medium">Pts</div>
              {/* Desktop-only visual columns */}
              <div role="columnheader" className="hidden py-3 px-2 text-left font-medium md:block">Form</div>
              <div role="columnheader" className="hidden py-3 px-2 text-center font-medium md:block">+/-</div>
              <div role="columnheader" className="hidden py-3 px-2 pr-4 text-left font-medium md:block">Trend</div>
              {/* Expand indicator for mobile */}
              <div role="columnheader" className="w-8 py-3 pr-2 md:hidden"><span className="sr-only">Expand</span></div>
            </div>

            {/* Body */}
            <LayoutGroup>
              <div role="rowgroup">
                {displayedStandings.map((row, index) => (
                  <AnimatedTableRow
                    key={row.teamId}
                    row={row}
                    index={index}
                    zoneColor={getZoneColor(data.zones, row.position)}
                  />
                ))}
              </div>
            </LayoutGroup>
          </div>
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
