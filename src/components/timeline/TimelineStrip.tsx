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

function ScrollArrow({
  direction,
  onClick,
  visible,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Scroll ${direction}`}
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
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
          <path d="M15 18l-6-6 6-6" />
        ) : (
          <path d="M9 18l6-6-6-6" />
        )}
      </svg>
    </button>
  );
}

export function TimelineStrip({
  matchweeks,
  selectedWeek,
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

  const scrollBy = useCallback((direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
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
      <ScrollArrow
        direction="left"
        onClick={() => scrollBy('left')}
        visible={canScrollLeft}
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

      <ScrollArrow
        direction="right"
        onClick={() => scrollBy('right')}
        visible={canScrollRight}
      />
    </div>
  );
}
