'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useLeague } from '@/lib/hooks/use-league';
import { useMatchweek } from '@/lib/hooks/use-matchweek';
import { usePolling } from '@/lib/hooks/use-polling';
import { LEAGUE_THEMES } from '@/lib/themes/league-themes';
import type { League } from '@/lib/themes/league-themes';
import { SeasonTimeline } from '@/components/timeline/SeasonTimeline';
import { DataFreshness } from '@/components/DataFreshness';
import { HistoricalBanner } from './HistoricalBanner';
import { LeagueTableClient } from './LeagueTableClient';
import { fetchMatchweekList } from './actions';

interface MatchweekInfo {
  matchweeks: Array<{ number: number; completed: boolean; inProgress: boolean }>;
  latestCompleted: number;
  inProgress: number | null;
  season: string;
}

export function LeagueTableWrapper() {
  const { league } = useLeague();
  const [matchweekInfo, setMatchweekInfo] = useState<MatchweekInfo | null>(null);
  const [isLoadingMatchweeks, setIsLoadingMatchweeks] = useState(true);
  const prevLeagueRef = useRef(league);

  // week is null = "show current/latest", number = specific historical matchweek
  const { week, setWeek } = useMatchweek();

  const latestCompleted = matchweekInfo?.latestCompleted ?? 0;
  const inProgress = matchweekInfo?.inProgress ?? null;

  // Default week: prefer in-progress, fall back to latest completed
  const defaultWeek = inProgress ?? latestCompleted;

  // The effective selected week for display (null means default)
  const selectedWeek = week ?? defaultWeek;
  const isHistorical = week !== null && defaultWeek > 0 && week !== defaultWeek;

  // Polling for live data updates (season derived from league config)
  const [refreshKey, setRefreshKey] = useState(0);
  const season = matchweekInfo?.season ?? new Date().getFullYear().toString();
  const { lastUpdated } = usePolling({
    leagueSlug: league,
    season,
    onUpdate: () => setRefreshKey((k) => k + 1),
    enabled: !isHistorical,
  });

  // Fetch matchweek list on mount and when league changes
  useEffect(() => {
    let cancelled = false;
    setIsLoadingMatchweeks(true);
    setMatchweekInfo(null);

    fetchMatchweekList(league).then((result) => {
      if (cancelled) return;
      setMatchweekInfo({
        matchweeks: result.matchweeks,
        latestCompleted: result.latestCompleted,
        inProgress: result.inProgress,
        season: result.season,
      });
      setIsLoadingMatchweeks(false);
    });

    return () => {
      cancelled = true;
    };
  }, [league]);

  // Reset matchweek selection when league changes
  useEffect(() => {
    if (prevLeagueRef.current !== league) {
      prevLeagueRef.current = league;
      setWeek(null);
    }
  }, [league, setWeek]);

  const handleWeekChange = useCallback(
    (newWeek: number) => {
      // If selecting the default week (in-progress or latest completed), clear the URL param
      if (newWeek === defaultWeek) {
        setWeek(null);
      } else {
        setWeek(newWeek);
      }
    },
    [setWeek, defaultWeek]
  );

  const handleReturnToCurrent = useCallback(() => {
    setWeek(null);
  }, [setWeek]);

  // Get league color for timeline circles
  const leagueTheme = LEAGUE_THEMES[league as League];
  const leagueColor = leagueTheme?.colors.primary ?? '#3d195b';

  return (
    <div className="space-y-3">
      {/* Season Timeline - only show when matchweek data is loaded */}
      {!isLoadingMatchweeks && matchweekInfo && matchweekInfo.matchweeks.length > 0 && (
        <SeasonTimeline
          league={league}
          latestMatchweek={latestCompleted}
          matchweeks={matchweekInfo.matchweeks}
          leagueColor={leagueColor}
          selectedWeek={selectedWeek}
          onWeekChange={handleWeekChange}
        />
      )}

      {/* Historical Banner */}
      <HistoricalBanner
        matchweek={selectedWeek}
        isHistorical={isHistorical}
        onReturnToCurrent={handleReturnToCurrent}
      />

      {/* League Table */}
      <LeagueTableClient
        key={`${league}-${refreshKey}`}
        league={league}
        matchweek={selectedWeek || undefined}
      />

      {/* Data Freshness Indicator */}
      <div className="flex justify-end px-2">
        <DataFreshness updatedAt={lastUpdated} />
      </div>
    </div>
  );
}
