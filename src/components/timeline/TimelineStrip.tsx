'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
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
      aria-label={`Scroll ${direction} 5 matchweeks`}
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll overflow state
  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      resizeObserver.disconnect();
    };
  }, [updateScrollState, matchweeks]);

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
    // Estimate width of ~5 circles (circle width + gap)
    const firstCircle = circleRefs.current.values().next().value;
    const circleWidth = firstCircle ? firstCircle.offsetWidth + 6 : 42;
    const amount = circleWidth * 5;
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  }, []);

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
        onClick={() => scrollByCircles('left')}
        disabled={!canScrollLeft}
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
        onClick={() => scrollByCircles('right')}
        disabled={!canScrollRight}
      />
    </div>
  );
}
