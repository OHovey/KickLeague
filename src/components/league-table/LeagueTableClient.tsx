'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
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
    <div className="glow-card overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-3 flex items-baseline gap-2">
        <div className="shimmer-loading h-4 w-24 rounded" />
        <div className="shimmer-loading h-3 w-16 rounded" />
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[2.5rem_1fr_2.5rem_3rem_3rem_2rem] md:grid-cols-[2rem_8fr_2fr_2fr_2fr_2fr_2fr_2fr_2.5fr_2.5fr_minmax(7rem,5fr)_2fr_minmax(6rem,5fr)] items-center border-b border-white/10 px-4 py-3">
        <div className="shimmer-loading h-2.5 w-4 rounded mx-auto" />
        <div className="shimmer-loading h-2.5 w-12 rounded" />
        <div className="shimmer-loading h-2.5 w-4 rounded mx-auto" />
        <div className="shimmer-loading hidden md:block h-2.5 w-4 rounded mx-auto" />
        <div className="shimmer-loading hidden md:block h-2.5 w-4 rounded mx-auto" />
        <div className="shimmer-loading hidden md:block h-2.5 w-4 rounded mx-auto" />
        <div className="shimmer-loading hidden md:block h-2.5 w-5 rounded mx-auto" />
        <div className="shimmer-loading hidden md:block h-2.5 w-5 rounded mx-auto" />
        <div className="shimmer-loading h-2.5 w-5 rounded mx-auto" />
        <div className="shimmer-loading h-2.5 w-5 rounded mx-auto" />
        <div className="shimmer-loading hidden md:block h-2.5 w-16 rounded mx-auto" />
        <div className="shimmer-loading hidden md:block h-2.5 w-5 rounded mx-auto" />
        <div className="shimmer-loading hidden md:block h-2.5 w-14 rounded mx-auto" />
      </div>

      {/* Skeleton rows with staggered shimmer */}
      <div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[2.5rem_1fr_2.5rem_3rem_3rem_2rem] md:grid-cols-[2rem_8fr_2fr_2fr_2fr_2fr_2fr_2fr_2.5fr_2.5fr_minmax(7rem,5fr)_2fr_minmax(6rem,5fr)] items-center border-b border-white/[0.04] px-4 py-3"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Position */}
            <div
              className="shimmer-loading h-4 w-5 rounded mx-auto"
              style={{ animationDelay: `${i * 80}ms` }}
            />
            {/* Team name + logo */}
            <div className="flex items-center gap-2 px-2">
              <div
                className="shimmer-loading h-5 w-5 rounded-full shrink-0"
                style={{ animationDelay: `${i * 80 + 40}ms` }}
              />
              <div
                className="shimmer-loading h-3.5 rounded"
                style={{
                  animationDelay: `${i * 80 + 60}ms`,
                  width: `${50 + ((i * 17) % 30)}%`,
                }}
              />
            </div>
            {/* P */}
            <div
              className="shimmer-loading h-3.5 w-5 rounded mx-auto"
              style={{ animationDelay: `${i * 80 + 80}ms` }}
            />
            {/* W, D, L (desktop) */}
            <div className="shimmer-loading hidden md:block h-3.5 w-4 rounded mx-auto" style={{ animationDelay: `${i * 80 + 100}ms` }} />
            <div className="shimmer-loading hidden md:block h-3.5 w-4 rounded mx-auto" style={{ animationDelay: `${i * 80 + 120}ms` }} />
            <div className="shimmer-loading hidden md:block h-3.5 w-4 rounded mx-auto" style={{ animationDelay: `${i * 80 + 140}ms` }} />
            {/* GF, GA (desktop) */}
            <div className="shimmer-loading hidden md:block h-3.5 w-5 rounded mx-auto" style={{ animationDelay: `${i * 80 + 160}ms` }} />
            <div className="shimmer-loading hidden md:block h-3.5 w-5 rounded mx-auto" style={{ animationDelay: `${i * 80 + 180}ms` }} />
            {/* GD */}
            <div
              className="shimmer-loading h-3.5 w-6 rounded mx-auto"
              style={{ animationDelay: `${i * 80 + 200}ms` }}
            />
            {/* Pts */}
            <div
              className="shimmer-loading h-4 w-6 rounded mx-auto"
              style={{ animationDelay: `${i * 80 + 220}ms` }}
            />
            {/* Form (desktop) */}
            <div className="hidden md:flex items-center justify-center gap-1">
              {Array.from({ length: 5 }).map((_, j) => (
                <div
                  key={j}
                  className="shimmer-loading h-4 w-4 rounded-sm"
                  style={{ animationDelay: `${i * 80 + 240 + j * 30}ms` }}
                />
              ))}
            </div>
            {/* +/- (desktop) */}
            <div className="shimmer-loading hidden md:block h-3.5 w-5 rounded mx-auto" style={{ animationDelay: `${i * 80 + 300}ms` }} />
            {/* Trend (desktop) */}
            <div className="shimmer-loading hidden md:block h-5 w-14 rounded mx-auto" style={{ animationDelay: `${i * 80 + 320}ms` }} />
            {/* Mobile expand chevron */}
            <div className="shimmer-loading md:hidden h-4 w-4 rounded mx-auto" />
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

  // Show skeleton during initial load, switching leagues, or before first fetch
  if (isPending || !data) {
    if (error) {
      return (
        <div className="rounded-lg bg-white/5 p-8 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      );
    }
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

  return (
    <div className="glow-card overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm">
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

      {/* Expand/collapse toggle */}
      <div className="border-t border-white/10 px-4 py-2.5 flex items-center justify-center gap-1">
        <div className="inline-flex items-center rounded-full bg-white/[0.03] border border-white/[0.06] p-0.5">
          <button
            type="button"
            onClick={() => handleExpandStateChange('collapsed')}
            className={`relative rounded-full px-3 py-1.5 text-xs font-medium tracking-wide transition-all duration-200 ${
              expandState === 'collapsed'
                ? 'bg-glow/20 text-glow shadow-[0_0_8px_var(--league-glow,#00ff87)_inset,0_0_12px_var(--league-glow,#00ff87)/15]'
                : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04]'
            }`}
          >
            5
          </button>
          <button
            type="button"
            onClick={() => handleExpandStateChange('default')}
            className={`relative rounded-full px-3 py-1.5 text-xs font-medium tracking-wide transition-all duration-200 ${
              expandState === 'default'
                ? 'bg-glow/20 text-glow shadow-[0_0_8px_var(--league-glow,#00ff87)_inset,0_0_12px_var(--league-glow,#00ff87)/15]'
                : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04]'
            }`}
          >
            10
          </button>
          <button
            type="button"
            onClick={() => handleExpandStateChange('expanded')}
            className={`relative rounded-full px-3 py-1.5 text-xs font-medium tracking-wide transition-all duration-200 ${
              expandState === 'expanded'
                ? 'bg-glow/20 text-glow shadow-[0_0_8px_var(--league-glow,#00ff87)_inset,0_0_12px_var(--league-glow,#00ff87)/15]'
                : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04]'
            }`}
          >
            {totalRows}
          </button>
        </div>
      </div>

      {/* Zone legend */}
      <div className="border-t border-white/10 px-4 py-3">
        <ZoneLegend zones={data.zones} />
      </div>

      {/* View full standings link */}
      <div className="border-t border-white/[0.06] px-4 py-2">
        <Link
          href={`/leagues/${league}`}
          className="flex items-center gap-1 text-xs font-medium text-white/40 transition-colors hover:text-white/70"
        >
          {t('viewFullStandings')}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
