'use client';

import { useTranslations } from 'next-intl';

interface HistoricalBannerProps {
  matchweek: number;
  isHistorical: boolean;
  onReturnToCurrent: () => void;
}

export function HistoricalBanner({
  matchweek,
  isHistorical,
  onReturnToCurrent,
}: HistoricalBannerProps) {
  const t = useTranslations('LeagueTable');

  if (!isHistorical) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/20 px-4 py-3">
      <span className="text-sm font-medium text-white/90">
        {t('viewingMatchweek', { week: matchweek })}
      </span>
      <button
        type="button"
        onClick={onReturnToCurrent}
        className="cursor-pointer text-sm text-primary underline transition-colors hover:text-primary/80"
      >
        {t('returnToCurrent')}
      </button>
    </div>
  );
}
