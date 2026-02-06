'use client';

import { useTranslations } from 'next-intl';
import type { TopBookmaker } from './actions';

interface CompactOddsProps {
  fixtureId: number;
  bestHome: number;
  bestDraw: number;
  bestAway: number;
  bookmakerCount: number;
  showBetting: boolean;
  topBookmakers?: TopBookmaker[];
}

/**
 * Compact horizontal odds display for fixture cards.
 * Shows best odds per outcome with a "from N bookmakers" badge.
 *
 * - Renders null when showBetting=false (geo-blocked)
 * - Designed to fit inside MatchCard without expanding it
 * - Drives clicks to the match detail page where full comparison lives
 */
export function CompactOdds({
  fixtureId,
  bestHome,
  bestDraw,
  bestAway,
  bookmakerCount,
  showBetting,
  topBookmakers,
}: CompactOddsProps) {
  const t = useTranslations('Odds');

  if (!showBetting) return null;

  const handleBookmakerClick = (
    e: React.MouseEvent,
    bm: TopBookmaker,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Fire-and-forget click tracking
    fetch('/api/clicks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fixtureId,
        bookmakerKey: bm.bookmakerKey,
        outcome: 'pill',
        affiliateProgram: bm.affiliateProgram,
      }),
    }).catch(() => {});

    window.open(bm.link, '_blank', 'noopener');
  };

  return (
    <div className="flex flex-col items-center gap-1 pt-1 pb-0.5">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5">
          <span className="font-mono text-[11px] tabular-nums text-emerald-300/80">
            {bestHome.toFixed(2)}
          </span>
          <span className="text-[9px] text-white/20">|</span>
          <span className="font-mono text-[11px] tabular-nums text-emerald-300/80">
            {bestDraw.toFixed(2)}
          </span>
          <span className="text-[9px] text-white/20">|</span>
          <span className="font-mono text-[11px] tabular-nums text-emerald-300/80">
            {bestAway.toFixed(2)}
          </span>
        </div>
        {bookmakerCount > 0 && (
          <span className="text-[10px] text-white/30">
            {t('fromBookmakers', { count: bookmakerCount })}
          </span>
        )}
      </div>
      {topBookmakers && topBookmakers.length > 0 && (
        <div className="flex items-center gap-1.5">
          {topBookmakers.map((bm) => (
            <button
              key={bm.bookmakerKey}
              onClick={(e) => handleBookmakerClick(e, bm)}
              className="rounded px-1.5 py-0.5 text-[10px] text-white/50 transition-colors hover:bg-white/10 hover:text-white/70"
            >
              {bm.bookmakerTitle}{' '}
              <span className="text-[8px]">&#x2197;</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
