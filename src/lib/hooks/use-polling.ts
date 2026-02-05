'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePollingOptions {
  leagueSlug: string;
  season: string;
  onUpdate: () => void;
  matchWindowInterval?: number;
  offPeakInterval?: number;
  enabled?: boolean;
}

interface UsePollingReturn {
  lastUpdated: string | null;
  isMatchWindow: boolean;
}

export function usePolling({
  leagueSlug,
  season,
  onUpdate,
  matchWindowInterval = 30_000,
  offPeakInterval = 300_000,
  enabled = true,
}: UsePollingOptions): UsePollingReturn {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isMatchWindow, setIsMatchWindow] = useState(false);

  // Ref for onUpdate callback to prevent stale closures
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  // Ref to track previous updatedAt value (avoids triggering on first poll)
  const lastUpdatedRef = useRef<string | null>(null);

  // Reset lastUpdatedRef when league/season changes to avoid false change detection
  useEffect(() => {
    lastUpdatedRef.current = null;
    setLastUpdated(null);
    setIsMatchWindow(false);
  }, [leagueSlug, season]);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/updates/check?leagueSlug=${encodeURIComponent(leagueSlug)}&season=${encodeURIComponent(season)}`
      );
      if (!res.ok) return;

      const data: { updatedAt: string | null; matchWindowActive: boolean } =
        await res.json();

      setIsMatchWindow(data.matchWindowActive);

      // Detect data change: only fire onUpdate if we had a previous value
      // and the new value differs (skip the very first poll)
      if (
        data.updatedAt !== lastUpdatedRef.current &&
        lastUpdatedRef.current !== null
      ) {
        onUpdateRef.current();
      }

      lastUpdatedRef.current = data.updatedAt;
      setLastUpdated(data.updatedAt);
    } catch {
      // Silently ignore polling errors -- don't break the interval
    }
  }, [leagueSlug, season]);

  useEffect(() => {
    if (!enabled) return;

    // Poll immediately on mount / when deps change
    poll();

    const interval = isMatchWindow ? matchWindowInterval : offPeakInterval;
    const id = setInterval(poll, interval);

    return () => clearInterval(id);
  }, [enabled, isMatchWindow, matchWindowInterval, offPeakInterval, poll]);

  return { lastUpdated, isMatchWindow };
}
