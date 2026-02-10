'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import { useTranslations } from 'next-intl';
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

// Mobile: #, Team, P, GD, Pts, Expand (6 columns)
// Desktop: fractional units distribute space proportionally so columns spread evenly
// #=fixed, Team=8fr, stats=2fr, GD/Pts=2.5fr, Form=minmax(7rem,5fr), +/-=2fr, Trend=minmax(6rem,5fr)
const GRID_COLS = 'grid-cols-[2.5rem_1fr_2.5rem_3rem_3rem_2rem] md:grid-cols-[2rem_8fr_2fr_2fr_2fr_2fr_2fr_2fr_2.5fr_2.5fr_minmax(7rem,5fr)_2fr_minmax(6rem,5fr)]';

export function LeagueTableClient({ league, matchweek }: LeagueTableClientProps) {
  const t = useTranslations('LeagueTable');
  const tCommon = useTranslations('Common');
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
        setError(e instanceof Error ? e.message : tCommon('unableToLoad'));
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
        <p className="text-lg font-medium text-white/90">{tCommon('databaseNotConfigured')}</p>
        <p className="mt-2 text-white/70">
          {tCommon('setupDatabase')}
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
        <p className="text-white/70">{tCommon('leagueNotFound')}</p>
      </div>
    );
  }

  if (data.standings.length === 0) {
    return (
      <div className="rounded-lg bg-white/5 p-8 text-center">
        <p className="text-white/70">{t('noStandingsData')}</p>
        <p className="mt-2 text-sm text-white/50">
          {tCommon('neonInstructions')}
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
        return { state: 'default', label: t('showRows', { count: 10 }) };
      case 'default':
        return { state: 'expanded', label: t('showFullTable') };
      case 'expanded':
        return { state: 'collapsed', label: t('collapse') };
    }
  };
  const { state: nextState, label: buttonLabel } = getNextState();

  return (
    <div className="overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm">
      {/* Table header */}
      <div className="border-b border-white/10 px-4 py-3 flex items-baseline gap-2">
        <h2 className="text-sm font-medium text-white/70">{t('standings')}</h2>
        {data.matchweek && (
          <span className="text-xs text-white/40">{t('matchweekN', { week: data.matchweek })}</span>
        )}
      </div>

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
              <div role="columnheader" className="py-3 px-2 text-left font-medium">{t('team')}</div>
              <div role="columnheader" className="py-3 px-2 text-center font-medium">{t('played')}</div>
              {/* Desktop-only columns */}
              <div role="columnheader" className="hidden py-3 px-2 text-center font-medium md:block">{t('won')}</div>
              <div role="columnheader" className="hidden py-3 px-2 text-center font-medium md:block">{t('drawn')}</div>
              <div role="columnheader" className="hidden py-3 px-2 text-center font-medium md:block">{t('lost')}</div>
              <div role="columnheader" className="hidden py-3 px-2 text-center font-medium md:block">{t('goalsFor')}</div>
              <div role="columnheader" className="hidden py-3 px-2 text-center font-medium md:block">{t('goalsAgainst')}</div>
              {/* Always visible columns */}
              <div role="columnheader" className="py-3 px-2 text-center font-medium">{t('goalDifference')}</div>
              <div role="columnheader" className="py-3 pl-2 pr-2 text-center font-medium">{t('points')}</div>
              {/* Desktop-only visual columns */}
              <div role="columnheader" className="hidden py-3 px-2 text-center font-medium md:block">{t('form')}</div>
              <div role="columnheader" className="hidden py-3 px-2 text-center font-medium md:block" title={t('positionChangeTooltip')}>{t('positionChange')}</div>
              <div role="columnheader" className="hidden py-3 px-2 text-center font-medium md:block">{t('trend')}</div>
              {/* Expand indicator for mobile */}
              <div role="columnheader" className="w-8 py-3 pr-2 md:hidden"><span className="sr-only">{t('expand')}</span></div>
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
