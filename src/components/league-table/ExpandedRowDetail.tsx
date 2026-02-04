'use client';

import type { StandingsRow } from '@/lib/standings/calculate';

interface ExpandedRowDetailProps {
  row: StandingsRow;
}

/**
 * Mobile expanded row showing additional team stats.
 * Shown when tapping a row on mobile devices.
 */
export function ExpandedRowDetail({ row }: ExpandedRowDetailProps) {
  return (
    <div className="bg-white/5 px-4 py-3">
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <p className="text-white/50">Won</p>
          <p className="font-medium text-white">{row.won}</p>
        </div>
        <div className="text-center">
          <p className="text-white/50">Drawn</p>
          <p className="font-medium text-white">{row.drawn}</p>
        </div>
        <div className="text-center">
          <p className="text-white/50">Lost</p>
          <p className="font-medium text-white">{row.lost}</p>
        </div>
        <div className="text-center">
          <p className="text-white/50">GF</p>
          <p className="font-medium text-white">{row.goalsFor}</p>
        </div>
        <div className="text-center">
          <p className="text-white/50">GA</p>
          <p className="font-medium text-white">{row.goalsAgainst}</p>
        </div>
        <div className="text-center">
          <p className="text-white/50">Form</p>
          <p className="font-medium text-white">{row.form || '-'}</p>
        </div>
      </div>
    </div>
  );
}
