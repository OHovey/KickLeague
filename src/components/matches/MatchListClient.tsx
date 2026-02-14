'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { MatchWithTeams, MatchEvent } from '@/lib/matches/queries';
import { fetchRecentMatches, fetchUpcomingFixtures, getGeoContext } from './actions';
import { fetchCompactOdds, type CompactOddsData } from '@/components/odds/actions';
import { MatchList } from './MatchList';

// ─── Skeleton ───────────────────────────────────────────────────────────────

function MatchListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-lg bg-white/5 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-1 items-center justify-end gap-2">
                <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
                <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
              </div>
              <div className="h-5 w-14 animate-pulse rounded bg-white/10" />
              <div className="flex flex-1 items-center gap-2">
                <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
                <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface MatchListClientProps {
  league: string;
  tab: 'results' | 'fixtures';
}

interface MatchData {
  matches: MatchWithTeams[];
  events: Record<number, MatchEvent[]>;
  teamForms: Record<number, string>;
  oddsMap: Record<number, CompactOddsData>;
}

// ─── Component ──────────────────────────────────────────────────────────────

// Number of distinct matchweeks to fetch initially / on "show more"
const INITIAL_MW_LIMIT = 3;
const EXPANDED_MW_LIMIT = 15;

export function MatchListClient({ league, tab }: MatchListClientProps) {
  const t = useTranslations('Common');
  const [data, setData] = useState<MatchData | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [geoContext, setGeoContext] = useState<{
    showBetting: boolean;
    countryCode: string | null;
    isMapped: boolean;
  }>({ showBetting: false, countryCode: null, isMapped: false });

  const fetchData = useCallback(
    (matchweekLimit: number) => {
      startTransition(async () => {
        try {
          if (tab === 'results') {
            const result = await fetchRecentMatches(league, matchweekLimit, true);
            if (result.error === 'database_not_configured') {
              setDbError('database_not_configured');
              setData({ matches: [], events: {}, teamForms: {}, oddsMap: {} });
              return;
            }
            setDbError(null);
            setData({
              matches: result.matches,
              events: result.events,
              teamForms: result.teamForms,
              oddsMap: {},
            });
          } else {
            const result = await fetchUpcomingFixtures(league, matchweekLimit, true);
            if (result.error === 'database_not_configured') {
              setDbError('database_not_configured');
              setData({ matches: [], events: {}, teamForms: {}, oddsMap: {} });
              return;
            }
            setDbError(null);

            // Fetch compact odds for upcoming fixtures
            let oddsMap: Record<number, CompactOddsData> = {};
            if (geoContext.showBetting && result.matches.length > 0) {
              const fixtureIds = result.matches.map((m) => m.id);
              oddsMap = await fetchCompactOdds(fixtureIds, geoContext.countryCode);
            }

            setData({
              matches: result.matches,
              events: {},
              teamForms: result.teamForms,
              oddsMap,
            });
          }
          setError(null);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to load matches');
        }
      });
    },
    [league, tab, geoContext]
  );

  // Fetch geo context on mount
  useEffect(() => {
    getGeoContext().then(setGeoContext);
  }, []);

  // Fetch on mount and when league/tab changes
  useEffect(() => {
    setShowAll(false);
    fetchData(INITIAL_MW_LIMIT);
  }, [fetchData]);

  const handleShowMore = useCallback(() => {
    setShowAll(true);
    fetchData(EXPANDED_MW_LIMIT);
  }, [fetchData]);

  // Show skeleton during loading
  if (isPending && !data) {
    return <MatchListSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white/5 p-8 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (dbError === 'database_not_configured') {
    return (
      <div className="rounded-lg bg-white/5 p-8 text-center">
        <p className="text-lg font-medium text-white/90">{t('databaseNotConfigured')}</p>
        <p className="mt-2 text-white/70">
          {t('setupDatabase')}
        </p>
        <div className="mt-4 rounded bg-black/30 p-4 text-left">
          {/* Developer-facing instructions kept in English */}
          <p className="text-xs font-mono text-white/50">1. Create a Neon database at neon.tech</p>
          <p className="text-xs font-mono text-white/50 mt-1">2. Copy DATABASE_URL to .env.local</p>
          <p className="text-xs font-mono text-white/50 mt-1">3. Run: npx drizzle-kit push</p>
          <p className="text-xs font-mono text-white/50 mt-1">4. Run: npm run seed -- --all</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <MatchListSkeleton />;
  }

  return (
    <div className={isPending ? 'opacity-60 transition-opacity' : ''}>
      <MatchList
        key={league}
        matches={data.matches}
        events={data.events}
        teamForms={data.teamForms}
        oddsMap={data.oddsMap}
        type={tab}
        showBetting={geoContext.showBetting}
        onShowMore={!showAll ? handleShowMore : undefined}
        hasMore={!showAll && new Set(data.matches.map((m) => m.matchweek)).size >= INITIAL_MW_LIMIT}
      />
    </div>
  );
}
