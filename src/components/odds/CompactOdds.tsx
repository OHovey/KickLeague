'use client';

import { useTranslations } from 'next-intl';

interface CompactOddsProps {
  fixtureId: number;
  bestHome: number;
  bestDraw: number;
  bestAway: number;
  bookmakerCount: number;
  showBetting: boolean;
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
  bestHome,
  bestDraw,
  bestAway,
  bookmakerCount,
  showBetting,
}: CompactOddsProps) {
  const t = useTranslations('Odds');

  if (!showBetting) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-1 pb-0.5">
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
  );
}
