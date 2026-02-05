'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useAutoPlay(
  currentWeek: number,
  maxWeek: number,
  onAdvance: (week: number) => void,
  intervalMs: number = 1000
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const weekRef = useRef(currentWeek);

  // Keep ref in sync with current week
  weekRef.current = currentWeek;

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const toggle = useCallback(() => setIsPlaying((p) => !p), []);

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    intervalRef.current = setInterval(() => {
      const next = weekRef.current + 1;
      if (next > maxWeek) {
        setIsPlaying(false);
        return;
      }
      onAdvance(next);
    }, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isPlaying, maxWeek, onAdvance, intervalMs]);

  // Auto-pause when reaching end
  useEffect(() => {
    if (currentWeek >= maxWeek && isPlaying) {
      setIsPlaying(false);
    }
  }, [currentWeek, maxWeek, isPlaying]);

  return { isPlaying, play, pause, toggle };
}
