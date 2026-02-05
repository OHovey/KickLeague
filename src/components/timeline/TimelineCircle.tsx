'use client';

import { forwardRef } from 'react';

interface TimelineCircleProps {
  weekNumber: number;
  completed: boolean;
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
      isSelected,
      leagueColor,
      totalWeeks,
      onClick,
    },
    ref
  ) {
    // Show label for matchweek 1, every 5th, and the last matchweek
    const showLabel =
      weekNumber === 1 || weekNumber % 5 === 0 || weekNumber === totalWeeks;

    // Determine circle styles based on state
    let bgStyle: React.CSSProperties = {};
    let textClass = '';
    let ringClass = '';

    if (!completed) {
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

    return (
      <div className="flex flex-col items-center" style={{ scrollSnapAlign: 'center' }}>
        <button
          ref={ref}
          type="button"
          role="option"
          aria-selected={isSelected}
          aria-label={`Matchweek ${weekNumber}${completed ? '' : ' (upcoming)'}`}
          disabled={!completed}
          onClick={onClick}
          className={`
            flex min-h-[32px] min-w-[32px] items-center justify-center
            rounded-full text-xs leading-none
            transition-all duration-150
            ${isSelected ? 'scale-110' : ''}
            ${completed ? 'cursor-pointer hover:scale-105 hover:brightness-110' : 'cursor-default'}
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
