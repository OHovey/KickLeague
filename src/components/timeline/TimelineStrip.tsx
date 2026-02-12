'use client';

import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useTranslations } from 'next-intl';
import { TimelineCircle } from './TimelineCircle';

export interface TimelineStripHandle {
  scrollByCircles: (direction: 'left' | 'right') => void;
}

interface TimelineStripProps {
  matchweeks: Array<{ number: number; completed: boolean; inProgress: boolean }>;
  selectedWeek: number;
  latestCompleted: number;
  leagueColor: string;
  onSelectWeek: (week: number) => void;
}

export function NavArrow({
  direction,
  onClick,
  disabled,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  disabled: boolean;
}) {
  const t = useTranslations('Timeline');

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={t('scrollDirection', { direction })}
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

export const TimelineStrip = forwardRef<TimelineStripHandle, TimelineStripProps>(
  function TimelineStrip(
    { matchweeks, selectedWeek, latestCompleted, leagueColor, onSelectWeek },
    ref
  ) {
    const t = useTranslations('Timeline');
    const containerRef = useRef<HTMLDivElement>(null);
    const circleRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

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

    // Scroll the strip by ~5 circles worth of distance
    const scrollByCircles = useCallback((direction: 'left' | 'right') => {
      const el = containerRef.current;
      if (!el) return;
      const firstCircle = circleRefs.current.values().next().value;
      const circleWidth = firstCircle ? firstCircle.offsetWidth + 6 : 42;
      const amount = circleWidth * 5;
      el.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
    }, []);

    // Expose scroll function to parent
    useImperativeHandle(ref, () => ({ scrollByCircles }), [scrollByCircles]);

    // Keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const next = matchweeks.find(
            (m) => m.number > selectedWeek && (m.completed || m.inProgress)
          );
          if (next) onSelectWeek(next.number);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const prev = [...matchweeks]
            .reverse()
            .find((m) => m.number < selectedWeek && (m.completed || m.inProgress));
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
      <div
        ref={containerRef}
        role="listbox"
        aria-label={t('seasonMatchweeks')}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="flex flex-1 items-center gap-1.5 overflow-x-auto px-2 py-2 outline-none focus-visible:ring-1 focus-visible:ring-white/20"
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
            inProgress={mw.inProgress}
            isSelected={mw.number === selectedWeek}
            leagueColor={leagueColor}
            totalWeeks={matchweeks.length}
            onClick={() => {
              if (mw.completed || mw.inProgress) {
                onSelectWeek(mw.number);
              }
            }}
          />
        ))}
      </div>
    );
  }
);
