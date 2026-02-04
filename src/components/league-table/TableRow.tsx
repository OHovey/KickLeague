'use client';

import { useState } from 'react';
import type { StandingsRow } from '@/lib/standings/calculate';
import { ExpandedRowDetail } from './ExpandedRowDetail';

interface TableRowProps {
  row: StandingsRow;
  zoneColor: string | null;
}

export function TableRow({ row, zoneColor }: TableRowProps) {
  const [expanded, setExpanded] = useState(false);

  const handleRowClick = () => {
    // Only expand on mobile (< md breakpoint = 768px)
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setExpanded(!expanded);
    }
  };

  return (
    <>
      <tr
        className="group relative transition-colors hover:bg-white/5 md:cursor-default cursor-pointer"
        onClick={handleRowClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleRowClick();
          }
        }}
      >
        {/* Zone color indicator - absolute positioned left border */}
        {zoneColor && (
          <td className="absolute left-0 top-0 h-full w-1" aria-hidden="true">
            <div
              className="h-full w-full"
              style={{ backgroundColor: zoneColor }}
            />
          </td>
        )}

        {/* Position - Always visible */}
        <td className="min-h-[44px] py-3 pl-4 pr-2 text-center text-sm font-medium text-white/90">
          {row.position}
        </td>

        {/* Team name - Always visible */}
        <td className="min-h-[44px] py-3 px-2 text-left text-sm font-medium text-white">
          {row.teamName}
        </td>

        {/* Played - Always visible */}
        <td className="min-h-[44px] py-3 px-2 text-center text-sm text-white/70">
          {row.played}
        </td>

        {/* Won - Desktop only */}
        <td className="hidden min-h-[44px] py-3 px-2 text-center text-sm text-white/70 md:table-cell">
          {row.won}
        </td>

        {/* Drawn - Desktop only */}
        <td className="hidden min-h-[44px] py-3 px-2 text-center text-sm text-white/70 md:table-cell">
          {row.drawn}
        </td>

        {/* Lost - Desktop only */}
        <td className="hidden min-h-[44px] py-3 px-2 text-center text-sm text-white/70 md:table-cell">
          {row.lost}
        </td>

        {/* Goals For - Desktop only */}
        <td className="hidden min-h-[44px] py-3 px-2 text-center text-sm text-white/70 md:table-cell">
          {row.goalsFor}
        </td>

        {/* Goals Against - Desktop only */}
        <td className="hidden min-h-[44px] py-3 px-2 text-center text-sm text-white/70 md:table-cell">
          {row.goalsAgainst}
        </td>

        {/* Goal Difference - Always visible */}
        <td className="min-h-[44px] py-3 px-2 text-center text-sm text-white/70">
          {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
        </td>

        {/* Points - Always visible */}
        <td className="min-h-[44px] py-3 pl-2 pr-2 text-center text-sm font-bold text-white md:pr-4">
          {row.points}
        </td>

        {/* Expand indicator - Mobile only */}
        <td className="min-h-[44px] w-8 py-3 pr-2 text-center md:hidden">
          <svg
            className={`mx-auto h-4 w-4 text-white/50 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </td>
      </tr>

      {/* Expanded detail row - Mobile only */}
      {expanded && (
        <tr className="md:hidden">
          <td colSpan={6}>
            <ExpandedRowDetail row={row} />
          </td>
        </tr>
      )}
    </>
  );
}
