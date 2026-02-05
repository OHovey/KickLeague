'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import type { EnhancedStandingsRow } from '@/lib/standings/queries';
import { AnimatedStatCell } from './AnimatedStatCell';
import { ExpandedRowDetail } from './ExpandedRowDetail';
import { FormBadges } from './FormBadges';
import { PositionChange } from './PositionChange';
import { Sparkline } from './Sparkline';

interface AnimatedTableRowProps {
  row: EnhancedStandingsRow;
  index: number;
  zoneColor: string | null;
}

/**
 * Motion-powered div-based table row with layout="position" animation.
 * Uses CSS Grid columns matching the header layout.
 * When standings data changes, rows animate to new positions via FLIP.
 */
export const AnimatedTableRow = memo(function AnimatedTableRow({
  row,
  index,
  zoneColor,
}: AnimatedTableRowProps) {
  const [expanded, setExpanded] = useState(false);

  const handleRowClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setExpanded(!expanded);
    }
  };

  return (
    <div>
      <motion.div
        layout="position"
        transition={{
          layout: {
            type: 'spring',
            stiffness: 500,
            damping: 35,
            mass: 0.8,
            delay: index * 0.015,
          },
        }}
        role="row"
        className="group relative grid cursor-pointer grid-cols-[2.5rem_1fr_2.5rem_3rem_3rem_2rem] items-center border-b border-white/5 transition-colors hover:bg-white/5 md:cursor-default md:grid-cols-[2.5rem_1fr_2.5rem_2.5rem_2.5rem_2.5rem_2.5rem_2.5rem_3rem_3rem_7.5rem_2.5rem_7.5rem]"
        onClick={handleRowClick}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleRowClick();
          }
        }}
      >
        {/* Position - Always visible, with zone color indicator */}
        <div role="cell" className="relative min-h-[44px] py-3 pl-4 pr-2 text-center text-sm font-medium text-white/90">
          {zoneColor && (
            <div
              className="absolute left-0 top-0 h-full w-1"
              style={{ backgroundColor: zoneColor }}
              aria-hidden="true"
            />
          )}
          <AnimatedStatCell value={row.position} />
        </div>

        {/* Team name - Always visible */}
        <div role="cell" className="min-h-[44px] py-3 px-2 text-left text-sm font-medium text-white">
          <Link
            href={`/teams/${row.teamSlug}`}
            className="hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.teamName}
          </Link>
        </div>

        {/* Played - Always visible */}
        <div role="cell" className="min-h-[44px] py-3 px-2 text-center text-sm text-white/70">
          <AnimatedStatCell value={row.played} />
        </div>

        {/* Won - Desktop only */}
        <div role="cell" className="hidden min-h-[44px] py-3 px-2 text-center text-sm text-white/70 md:block">
          <AnimatedStatCell value={row.won} />
        </div>

        {/* Drawn - Desktop only */}
        <div role="cell" className="hidden min-h-[44px] py-3 px-2 text-center text-sm text-white/70 md:block">
          <AnimatedStatCell value={row.drawn} />
        </div>

        {/* Lost - Desktop only */}
        <div role="cell" className="hidden min-h-[44px] py-3 px-2 text-center text-sm text-white/70 md:block">
          <AnimatedStatCell value={row.lost} />
        </div>

        {/* Goals For - Desktop only */}
        <div role="cell" className="hidden min-h-[44px] py-3 px-2 text-center text-sm text-white/70 md:block">
          <AnimatedStatCell value={row.goalsFor} />
        </div>

        {/* Goals Against - Desktop only */}
        <div role="cell" className="hidden min-h-[44px] py-3 px-2 text-center text-sm text-white/70 md:block">
          <AnimatedStatCell value={row.goalsAgainst} />
        </div>

        {/* Goal Difference - Always visible */}
        <div role="cell" className="min-h-[44px] py-3 px-2 text-center text-sm text-white/70">
          <AnimatedStatCell value={row.goalDifference} className={row.goalDifference > 0 ? '' : ''} />
        </div>

        {/* Points - Always visible */}
        <div role="cell" className="min-h-[44px] py-3 pl-2 pr-2 text-center text-sm font-bold text-white">
          <AnimatedStatCell value={row.points} />
        </div>

        {/* Form - Desktop only */}
        <div role="cell" className="hidden min-h-[44px] py-3 px-2 md:block">
          <FormBadges form={row.form} />
        </div>

        {/* Position Change - Desktop only */}
        <div role="cell" className="hidden min-h-[44px] py-3 px-2 text-center md:block">
          <PositionChange change={row.positionChange} />
        </div>

        {/* Sparkline Trend - Desktop only */}
        <div role="cell" className="hidden min-h-[44px] py-3 px-2 md:block md:pr-4">
          <Sparkline data={row.sparklineData} />
        </div>

        {/* Expand indicator - Mobile only */}
        <div role="cell" className="min-h-[44px] w-8 py-3 pr-2 text-center md:hidden">
          <svg
            className={`mx-auto h-4 w-4 text-white/50 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </motion.div>

      {/* Expanded detail - Mobile only */}
      {expanded && (
        <div className="md:hidden">
          <ExpandedRowDetail row={row} />
        </div>
      )}
    </div>
  );
});
