'use client';

import { useRef, useEffect, useCallback } from 'react';
import { TimelineCircle } from './TimelineCircle';

interface TimelineStripProps {
  matchweeks: Array<{ number: number; completed: boolean }>;
  selectedWeek: number;
  latestCompleted: number;
  leagueColor: string;
  onSelectWeek: (week: number) => void;
}

function NavArrow({
  direction,
  onClick,
  disabled,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Jump ${direction === 'left' ? 'back' : 'forward'} 5 matchweeks`}
      className={`
        flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full
        transition-colors
        ${
          disabled
            ? 'cursor-not-allowed bg-white/5 text-white/20'
            : 'cursor-pointer bg-white/10 text-white/70 hover:bg-white/20 hover:text-white active:bg-white/25'
        }
      `}
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {direction === 'left' ? (
          <>
            <path d="M12 18l-6-6 6-6" />
            <path d="M19 18l-6-6 6-6" />
          </>
        ) : (
          <>
            <path d="M5 18l6-6-6-6" />
            <path d="M12 18l6-6-6-6" />
          </>
        )}
      </svg>
    </button>
  );
}

export function TimelineStrip({
  matchweeks,
  selectedWeek,
  latestCompleted,
  leagueColor,
  onSelectWeek,
}: TimelineStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const circleRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Find the earliest completed matchweek for clamping
  const earliestCompleted = matchweeks
    .filter((m) => m.completed)
    .reduce((min, m) => Math.min(min, m.number), Infinity);

  const canNavLeft = selectedWeek > earliestCompleted;
  const canNavRight = selectedWeek < latestCompleted;

  // Scroll selected circle into view
  useEffect(() => {
    const circleEl = circleRefs.current.get(selectedWeek);
    if (circleEl) {
      circleEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedWeek]);

  const jumpWeek = useCallback(
    (direction: 'left' | 'right') => {
      const step = 5;
      if (direction === 'left') {
        onSelectWeek(Math.max(earliestCompleted, selectedWeek - step));
      } else {
        onSelectWeek(Math.min(latestCompleted, selectedWeek + step));
      }
    },
    [earliestCompleted, latestCompleted, selectedWeek, onSelectWeek]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = matchweeks.find(
          (m) => m.number > selectedWeek && m.completed
        );
        if (next) onSelectWeek(next.number);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = [...matchweeks]
          .reverse()
          .find((m) => m.number < selectedWeek && m.completed);
        if (prev) onSelectWeek(prev.number);
      }
    },
    [matchweeks, selectedWeek, onSelectWeek]
  );

  const setCircleRef = useCallback(
    (weekNumber: number) => (el: HTMLButtonElement | null) => {
      if (el) {
        circleRefs.current.set(weekNumber, el);
      } else {
        circleRefs.current.delete(weekNumber);
      }
    },
    []
  );

  return (
    <div className="flex items-center gap-1">
      <NavArrow
        direction="left"
        onClick={() => jumpWeek('left')}
        disabled={!canNavLeft}
      />

      <div
        ref={containerRef}
        role="listbox"
        aria-label="Season matchweeks"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="flex flex-1 items-center gap-1.5 overflow-x-auto py-2 outline-none focus-visible:ring-1 focus-visible:ring-white/20"
        style={{
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {matchweeks.map((mw) => (
          <TimelineCircle
            key={mw.number}
            ref={setCircleRef(mw.number)}
            weekNumber={mw.number}
            completed={mw.completed}
            isSelected={mw.number === selectedWeek}
            leagueColor={leagueColor}
            totalWeeks={matchweeks.length}
            onClick={() => {
              if (mw.completed) {
                onSelectWeek(mw.number);
              }
            }}
          />
        ))}
      </div>

      <NavArrow
        direction="right"
        onClick={() => jumpWeek('right')}
        disabled={!canNavRight}
      />
    </div>
  );
}
