'use client';

import type { StandingsRow } from '@/lib/standings/calculate';

interface TableRowProps {
  row: StandingsRow;
  zoneColor: string | null;
}

export function TableRow({ row, zoneColor }: TableRowProps) {
  return (
    <tr className="group relative transition-colors hover:bg-white/5">
      {/* Zone color indicator - absolute positioned left border */}
      {zoneColor && (
        <td className="absolute left-0 top-0 h-full w-1" aria-hidden="true">
          <div
            className="h-full w-full"
            style={{ backgroundColor: zoneColor }}
          />
        </td>
      )}

      {/* Position */}
      <td className="py-3 pl-4 pr-2 text-center text-sm font-medium text-white/90">
        {row.position}
      </td>

      {/* Team name */}
      <td className="py-3 px-2 text-left text-sm font-medium text-white">
        {row.teamName}
      </td>

      {/* Played */}
      <td className="py-3 px-2 text-center text-sm text-white/70">
        {row.played}
      </td>

      {/* Won */}
      <td className="py-3 px-2 text-center text-sm text-white/70">
        {row.won}
      </td>

      {/* Drawn */}
      <td className="py-3 px-2 text-center text-sm text-white/70">
        {row.drawn}
      </td>

      {/* Lost */}
      <td className="py-3 px-2 text-center text-sm text-white/70">
        {row.lost}
      </td>

      {/* Goals For */}
      <td className="py-3 px-2 text-center text-sm text-white/70">
        {row.goalsFor}
      </td>

      {/* Goals Against */}
      <td className="py-3 px-2 text-center text-sm text-white/70">
        {row.goalsAgainst}
      </td>

      {/* Goal Difference */}
      <td className="py-3 px-2 text-center text-sm text-white/70">
        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
      </td>

      {/* Points */}
      <td className="py-3 pl-2 pr-4 text-center text-sm font-bold text-white">
        {row.points}
      </td>
    </tr>
  );
}
