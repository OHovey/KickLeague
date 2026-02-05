'use client';

import { useCallback, useRef } from 'react';
import { TimelineStrip, NavArrow } from './TimelineStrip';
import type { TimelineStripHandle } from './TimelineStrip';
import { TimelineControls } from './TimelineControls';
import { useAutoPlay } from './useAutoPlay';

interface SeasonTimelineProps {
  league: string;
  latestMatchweek: number;
  matchweeks: Array<{ number: number; completed: boolean }>;
  leagueColor: string;
  selectedWeek: number;
  onWeekChange: (week: number) => void;
}

export function SeasonTimeline({
  latestMatchweek,
  matchweeks,
  leagueColor,
  selectedWeek,
  onWeekChange,
}: SeasonTimelineProps) {
  const stripRef = useRef<TimelineStripHandle>(null);

  // Find the latest completed matchweek
  const latestCompleted = matchweeks
    .filter((m) => m.completed)
    .reduce((max, m) => Math.max(max, m.number), 0);

  const handleAdvance = useCallback(
    (week: number) => {
      onWeekChange(week);
    },
    [onWeekChange]
  );

  const { isPlaying, toggle, pause } = useAutoPlay(
    selectedWeek,
    latestCompleted,
    handleAdvance
  );

  const isAtEnd = selectedWeek >= latestCompleted;

  const handleWeekSelect = useCallback(
    (week: number) => {
      // Pause auto-play when user manually selects a week
      if (isPlaying) {
        pause();
      }
      onWeekChange(week);
    },
    [isPlaying, pause, onWeekChange]
  );

  const handleToggle = useCallback(() => {
    // If at end and not playing, restart from the beginning
    if (isAtEnd && !isPlaying) {
      onWeekChange(1);
      // Small delay to let the state update before starting play
      setTimeout(() => toggle(), 50);
    } else {
      toggle();
    }
  }, [isAtEnd, isPlaying, onWeekChange, toggle]);

  return (
    <div className="flex items-center gap-2">
      <TimelineControls
        isPlaying={isPlaying}
        onToggle={handleToggle}
        isAtEnd={isAtEnd && !isPlaying}
      />
      <NavArrow
        direction="left"
        onClick={() => stripRef.current?.scrollByCircles('left')}
        disabled={matchweeks.length === 0}
      />
      <div className="min-w-0 flex-1 overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm">
        <TimelineStrip
          ref={stripRef}
          matchweeks={matchweeks}
          selectedWeek={selectedWeek}
          latestCompleted={latestCompleted}
          leagueColor={leagueColor}
          onSelectWeek={handleWeekSelect}
        />
      </div>
      <NavArrow
        direction="right"
        onClick={() => stripRef.current?.scrollByCircles('right')}
        disabled={matchweeks.length === 0}
      />
    </div>
  );
}
