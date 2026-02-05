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

export function TimelineStrip({
  matchweeks,
  selectedWeek,
  latestCompleted,
  leagueColor,
  onSelectWeek,
}: TimelineStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const circleRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [scrubWeek, setScrubWeek] = useState<number | null>(null);
  const dragStartRef = useRef<{ x: number; scrollLeft: number } | null>(null);

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

  // Find the closest completed circle to a given x position
  const getWeekAtPosition = useCallback(
    (clientX: number): number | null => {
      let closestWeek: number | null = null;
      let closestDistance = Infinity;
      circleRefs.current.forEach((el, week) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const distance = Math.abs(clientX - centerX);
        const mw = matchweeks.find((m) => m.number === week);
        if (mw?.completed && distance < closestDistance) {
          closestWeek = week;
          closestDistance = distance;
        }
      });
      return closestWeek;
    },
    [matchweeks]
  );

  // Desktop drag-to-scrub handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only start drag from the container, not from individual circle clicks
      dragStartRef.current = {
        x: e.clientX,
        scrollLeft: containerRef.current?.scrollLeft ?? 0,
      };
      // We'll determine if this is a drag in mousemove (if moved > 5px threshold)
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragStartRef.current) return;

      const dx = Math.abs(e.clientX - dragStartRef.current.x);
      if (dx > 5) {
        // Threshold met - this is a drag
        if (!isDragging) {
          setIsDragging(true);
        }
        const week = getWeekAtPosition(e.clientX);
        if (week !== null) {
          setScrubWeek(week);
        }
      }
    },
    [isDragging, getWeekAtPosition]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging && scrubWeek !== null) {
      onSelectWeek(scrubWeek);
    }
    setIsDragging(false);
    setScrubWeek(null);
    dragStartRef.current = null;
  }, [isDragging, scrubWeek, onSelectWeek]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      // Cancel drag on leave
      setIsDragging(false);
      setScrubWeek(null);
      dragStartRef.current = null;
    }
  }, [isDragging]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        // Move to next completed matchweek
        const next = matchweeks.find(
          (m) => m.number > selectedWeek && m.completed
        );
        if (next) onSelectWeek(next.number);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        // Move to previous completed matchweek
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
    <div
      ref={containerRef}
      role="listbox"
      aria-label="Season matchweeks"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className="flex items-center gap-1 overflow-x-auto py-2 outline-none focus-visible:ring-1 focus-visible:ring-white/20"
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
          isScrubHighlighted={isDragging && mw.number === scrubWeek}
          leagueColor={leagueColor}
          totalWeeks={matchweeks.length}
          onClick={() => {
            if (!isDragging && mw.completed) {
              onSelectWeek(mw.number);
            }
          }}
        />
      ))}
    </div>
  );
}
