'use client';

import { useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { fetchOddsForFixture, type FixtureOddsResult } from './actions';
import { OddsCell } from './OddsCell';
import {
  OddsFormatSwitcher,
  OddsFormatProvider,
} from './OddsFormatSwitcher';
import { ResponsibleGambling } from './ResponsibleGambling';
import { RegionNote } from './RegionNote';

interface OddsComparisonTableProps {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  showBetting: boolean;
  countryCode: string | null;
  isMapped?: boolean;
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function OddsTableSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg px-3 py-3"
        >
          <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
          <div className="flex flex-1 justify-around">
            <div className="h-6 w-14 animate-pulse rounded bg-white/10" />
            <div className="h-6 w-14 animate-pulse rounded bg-white/10" />
            <div className="h-6 w-14 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Relative time helper ───────────────────────────────────────────────────

function getRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Main Component ─────────────────────────────────────────────────────────

/**
 * Oddschecker-style comparison table showing odds from multiple bookmakers.
 * Highlights the best odds per outcome column.
 *
 * - Respects geo-compliance: renders null when showBetting=false
 * - Fetches odds via server action on mount
 * - Includes format switcher and responsible gambling footer
 */
export function OddsComparisonTable({
  fixtureId,
  homeTeam,
  awayTeam,
  showBetting,
  countryCode,
  isMapped = true,
}: OddsComparisonTableProps) {
  const t = useTranslations('Odds');
  const [data, setData] = useState<FixtureOddsResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!showBetting) return;
    startTransition(async () => {
      try {
        const result = await fetchOddsForFixture(fixtureId, countryCode);
        setData(result);
      } catch {
        // Silently fail - odds are supplementary
      } finally {
        setLoaded(true);
      }
    });
  }, [fixtureId, showBetting, countryCode]);

  // Geo-blocked: render nothing
  if (!showBetting) return null;

  // Loading state
  if (!loaded || isPending) {
    return (
      <div className="mt-6 rounded-xl bg-white/5 p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
          {t('comparisonTitle')}
        </h3>
        <OddsTableSkeleton />
      </div>
    );
  }

  // No odds available
  if (!data || data.odds.length === 0) {
    // Odds exist in DB but all filtered out by region
    const allFilteredOut = data !== null && data.odds.length === 0 && data.totalBookmakers > 0;
    return (
      <div className="mt-6 rounded-xl bg-white/5 p-6 text-center">
        <p className="text-white/50">
          {allFilteredOut ? t('noOddsRegion') : t('noOdds')}
        </p>
      </div>
    );
  }

  // Find best odds per column for highlighting
  const bestHome = Math.max(...data.odds.map((r) => r.homeOdds));
  const bestDraw = Math.max(...data.odds.map((r) => r.drawOdds));
  const bestAway = Math.max(...data.odds.map((r) => r.awayOdds));

  return (
    <OddsFormatProvider>
      <div className="mt-6 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">
            {t('comparisonTitle')}
          </h3>
          <OddsFormatSwitcher />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl bg-white/5">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_repeat(3,80px)] items-center gap-1 border-b border-white/10 px-3 py-2 text-xs font-medium uppercase tracking-wider text-white/40">
            <span>Bookmaker</span>
            <span className="text-center">{homeTeam}</span>
            <span className="text-center">{t('draw')}</span>
            <span className="text-center">{awayTeam}</span>
          </div>

          {/* Bookmaker rows */}
          {data.odds.map((row) => {
            const bookmakerLink = row.homeLink ?? row.drawLink ?? row.awayLink;

            const handleBookmakerClick = () => {
              if (!bookmakerLink) return;

              // Fire-and-forget click tracking
              fetch('/api/clicks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fixtureId,
                  bookmakerKey: row.bookmakerKey,
                  outcome: 'name',
                  affiliateProgram: row.affiliateProgram,
                }),
              }).catch(() => {});

              window.open(bookmakerLink, '_blank', 'noopener');
            };

            return (
            <div
              key={row.bookmakerKey}
              className="grid grid-cols-[1fr_repeat(3,80px)] items-center gap-1 border-b border-white/5 px-3 py-1"
            >
              {bookmakerLink ? (
                <button
                  onClick={handleBookmakerClick}
                  className="group flex items-center gap-1 truncate text-left text-sm text-white/70 transition-colors hover:text-white"
                >
                  <span className="truncate">{row.bookmakerTitle}</span>
                  <span className="shrink-0 text-[8px] text-white/20 group-hover:text-white/50 transition-colors">
                    &#x2197;
                  </span>
                </button>
              ) : (
                <span className="truncate text-sm text-white/70">
                  {row.bookmakerTitle}
                </span>
              )}
              <OddsCell
                value={row.homeOdds}
                link={row.homeLink}
                prevValue={row.prevHomeOdds}
                fixtureId={fixtureId}
                bookmakerKey={row.bookmakerKey}
                outcome="home"
                affiliateProgram={row.affiliateProgram}
                isBest={row.homeOdds === bestHome}
              />
              <OddsCell
                value={row.drawOdds}
                link={row.drawLink}
                prevValue={row.prevDrawOdds}
                fixtureId={fixtureId}
                bookmakerKey={row.bookmakerKey}
                outcome="draw"
                affiliateProgram={row.affiliateProgram}
                isBest={row.drawOdds === bestDraw}
              />
              <OddsCell
                value={row.awayOdds}
                link={row.awayLink}
                prevValue={row.prevAwayOdds}
                fixtureId={fixtureId}
                bookmakerKey={row.bookmakerKey}
                outcome="away"
                affiliateProgram={row.affiliateProgram}
                isBest={row.awayOdds === bestAway}
              />
            </div>
            );
          })}
        </div>

        {/* Last updated */}
        <p className="text-center text-[11px] text-white/30">
          {t('lastUpdated', { time: getRelativeTime(data.fetchedAt) })}
        </p>

        {/* Region note */}
        <RegionNote
          filteredCount={data.odds.length}
          totalCount={data.totalBookmakers}
          isFallback={!isMapped}
        />

        {/* Responsible gambling */}
        <ResponsibleGambling show={true} />
      </div>
    </OddsFormatProvider>
  );
}
