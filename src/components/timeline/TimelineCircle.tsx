'use client';

import { forwardRef } from 'react';

interface TimelineCircleProps {
  weekNumber: number;
  completed: boolean;
  isSelected: boolean;
  isScrubHighlighted: boolean;
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
      isScrubHighlighted,
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

    if (!completed) {
      // Upcoming: hollow circle
      bgStyle = {
        border: `2px solid ${leagueColor}`,
        backgroundColor: 'transparent',
        opacity: 0.4,
      };
      textClass = 'text-white/30';
    } else if (isSelected) {
      // Selected completed: solid fill, full opacity, scale up
      bgStyle = {
        backgroundColor: leagueColor,
      };
      textClass = 'text-white';
    } else if (isScrubHighlighted) {
      // Scrub highlighted: solid fill at 80% opacity
      bgStyle = {
        backgroundColor: leagueColor,
        opacity: 0.8,
      };
      textClass = 'text-white/90';
    } else {
      // Completed not selected: solid fill at 60% opacity
      bgStyle = {
        backgroundColor: leagueColor,
        opacity: 0.6,
      };
      textClass = 'text-white/70';
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
            flex min-h-[28px] min-w-[28px] items-center justify-center
            rounded-full text-[10px] font-medium
            transition-transform duration-150
            ${isSelected ? 'scale-110' : ''}
            ${completed ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
            ${textClass}
          `}
          style={bgStyle}
        >
          {weekNumber}
        </button>
        {showLabel && (
          <span className="mt-1 text-[9px] text-white/40">{weekNumber}</span>
        )}
      </div>
    );
  }
);
