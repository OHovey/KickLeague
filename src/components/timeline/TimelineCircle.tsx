'use client';

import { forwardRef } from 'react';
import { useTranslations } from 'next-intl';

interface TimelineCircleProps {
  weekNumber: number;
  completed: boolean;
  inProgress: boolean;
  isSelected: boolean;
  leagueColor: string;
  totalWeeks: number;
  onClick: () => void;
}

export const TimelineCircle = forwardRef<HTMLButtonElement, TimelineCircleProps>(
  function TimelineCircle(
    {
      weekNumber,
      completed,
      inProgress,
      isSelected,
      leagueColor,
      totalWeeks,
      onClick,
    },
    ref
  ) {
    const t = useTranslations('Timeline');

    // Show label for matchweek 1, every 5th, and the last matchweek
    const showLabel =
      weekNumber === 1 || weekNumber % 5 === 0 || weekNumber === totalWeeks;

    // Determine circle styles based on state
    let bgStyle: React.CSSProperties = {};
    let textClass = '';
    let ringClass = '';
    const isClickable = completed || inProgress;

    if (inProgress && isSelected) {
      // In-progress + selected: dashed border, half-filled with glow
      bgStyle = {
        border: `1.5px dashed ${leagueColor}`,
        background: `linear-gradient(to top, ${leagueColor}90 50%, transparent 50%)`,
        boxShadow: `0 0 8px ${leagueColor}80`,
      };
      textClass = 'text-white font-semibold';
      ringClass = 'ring-2 ring-white/30';
    } else if (inProgress) {
      // In-progress + not selected: dashed border, half-filled subtle
      bgStyle = {
        border: `1.5px dashed ${leagueColor}80`,
        background: `linear-gradient(to top, ${leagueColor}60 50%, transparent 50%)`,
      };
      textClass = 'text-white/70';
    } else if (!completed) {
      // Upcoming: hollow circle with subtle dashed border
      bgStyle = {
        border: `1.5px dashed rgba(255,255,255,0.2)`,
        backgroundColor: 'transparent',
      };
      textClass = 'text-white/25';
    } else if (isSelected) {
      // Selected completed: bright solid fill, ring glow, scale up
      bgStyle = {
        backgroundColor: leagueColor,
        boxShadow: `0 0 8px ${leagueColor}80`,
      };
      textClass = 'text-white font-semibold';
      ringClass = 'ring-2 ring-white/30';
    } else {
      // Completed not selected: solid fill, good contrast
      bgStyle = {
        backgroundColor: leagueColor,
        opacity: 0.75,
      };
      textClass = 'text-white/90';
    }

    // Build aria-label
    let stateLabel = '';
    if (inProgress) {
      stateLabel = ' (in progress)';
    } else if (!completed) {
      stateLabel = ` (${t('upcoming')})`;
    }

    return (
      <div className="flex flex-col items-center" style={{ scrollSnapAlign: 'center' }}>
        <button
          ref={ref}
          type="button"
          role="option"
          aria-selected={isSelected}
          aria-label={t('matchweek', { week: weekNumber }) + stateLabel}
          disabled={!isClickable}
          onClick={onClick}
          className={`
            flex min-h-[32px] min-w-[32px] items-center justify-center
            rounded-full text-xs leading-none
            transition-all duration-150
            ${isSelected ? 'scale-110' : ''}
            ${isClickable ? 'cursor-pointer hover:scale-105 hover:brightness-110' : 'cursor-default'}
            ${textClass}
            ${ringClass}
          `}
          style={bgStyle}
        >
          {weekNumber}
        </button>
        {showLabel && (
          <span className="mt-1 text-[10px] text-white/50">{weekNumber}</span>
        )}
      </div>
    );
  }
);
