'use client';

import { useTranslations } from 'next-intl';
import type { EnhancedStandingsRow } from '@/lib/standings/queries';
import { FormBadges } from './FormBadges';
import { PositionChange } from './PositionChange';
import { Sparkline } from './Sparkline';

interface ExpandedRowDetailProps {
  row: EnhancedStandingsRow;
}

/**
 * Mobile expanded row showing additional team stats.
 * Shown when tapping a row on mobile devices.
 */
export function ExpandedRowDetail({ row }: ExpandedRowDetailProps) {
  const t = useTranslations('LeagueTable');

  return (
    <div className="bg-white/5 px-4 py-3">
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <p className="text-white/50">{t('formWon')}</p>
          <p className="font-medium text-white">{row.won}</p>
        </div>
        <div className="text-center">
          <p className="text-white/50">{t('formDrawn')}</p>
          <p className="font-medium text-white">{row.drawn}</p>
        </div>
        <div className="text-center">
          <p className="text-white/50">{t('formLost')}</p>
          <p className="font-medium text-white">{row.lost}</p>
        </div>
        <div className="text-center">
          <p className="text-white/50">{t('goalsFor')}</p>
          <p className="font-medium text-white">{row.goalsFor}</p>
        </div>
        <div className="text-center">
          <p className="text-white/50">{t('goalsAgainst')}</p>
          <p className="font-medium text-white">{row.goalsAgainst}</p>
        </div>
        <div className="text-center">
          <p className="text-white/50">{t('positionChange')}</p>
          <div className="flex justify-center">
            <PositionChange change={row.positionChange} />
          </div>
        </div>
      </div>

      {/* Form and Trend row */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs text-white/50">{t('form')}</p>
          <FormBadges form={row.form} />
        </div>
        <div>
          <p className="mb-1 text-xs text-white/50">{t('trend')}</p>
          <Sparkline data={row.sparklineData} width={100} height={28} />
        </div>
      </div>
    </div>
  );
}
