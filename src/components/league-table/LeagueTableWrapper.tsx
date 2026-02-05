'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useLeague } from '@/lib/hooks/use-league';
import { useMatchweek } from '@/lib/hooks/use-matchweek';
import { LEAGUE_THEMES } from '@/lib/themes/league-themes';
import type { League } from '@/lib/themes/league-themes';
import { SeasonTimeline } from '@/components/timeline/SeasonTimeline';
import { HistoricalBanner } from './HistoricalBanner';
import { LeagueTableClient } from './LeagueTableClient';
import { fetchMatchweekList } from './actions';

interface MatchweekInfo {
  matchweeks: Array<{ number: number; completed: boolean }>;
  latestCompleted: number;
}

export function LeagueTableWrapper() {
  const { league } = useLeague();
  const [matchweekInfo, setMatchweekInfo] = useState<MatchweekInfo | null>(null);
  const [isLoadingMatchweeks, setIsLoadingMatchweeks] = useState(true);
  const prevLeagueRef = useRef(league);

  // Determine the latest completed matchweek to use as default for useMatchweek
  const latestCompleted = matchweekInfo?.latestCompleted ?? 1;

  const { week, setWeek, isHistorical } = useMatchweek(latestCompleted);

  // Fetch matchweek list on mount and when league changes
  useEffect(() => {
    let cancelled = false;
    setIsLoadingMatchweeks(true);

    fetchMatchweekList(league).then((result) => {
      if (cancelled) return;
      setMatchweekInfo({
        matchweeks: result.matchweeks,
        latestCompleted: result.latestCompleted,
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
      setWeek(newWeek);
    },
    [setWeek]
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
        <div className="overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm">
          <SeasonTimeline
            league={league}
            latestMatchweek={latestCompleted}
            matchweeks={matchweekInfo.matchweeks}
            leagueColor={leagueColor}
            selectedWeek={week}
            onWeekChange={handleWeekChange}
          />
        </div>
      )}

      {/* Historical Banner */}
      <HistoricalBanner
        matchweek={week}
        isHistorical={isHistorical}
        onReturnToCurrent={handleReturnToCurrent}
      />

      {/* League Table */}
      <LeagueTableClient
        league={league}
        matchweek={isHistorical ? week : undefined}
      />
    </div>
  );
}
